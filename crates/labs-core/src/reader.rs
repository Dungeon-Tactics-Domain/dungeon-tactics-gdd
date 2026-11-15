//! Reads the Claude Code desktop app's session state from disk and builds the board.
//!
//! Only metadata is read: session titles, timestamps, ids, event types, tool names and the short text of an
//! open `AskUserQuestion`. Every file is deserialized into structs that keep just those fields, and nothing is
//! logged from inside them. The app's file format is undocumented (app 5.11492.5, CLI 2.1.325), so every
//! file is read defensively and [`Board`] keeps the last good board when a read fails.

use std::collections::{HashMap, HashSet};
use std::fs::{self, File, Metadata};
use std::io::{Read, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use chrono::{DateTime, Local, SecondsFormat, TimeZone};
use serde::Deserialize;
use serde_json::value::RawValue;

use crate::Error;
use crate::config::Config;
use crate::model::{Estacao, Estado, Fabrica, Subagente};

/// A turn open with no event for longer than this is a long tool or an abandoned session (measured on 14/11).
const RECENT_MS: i64 = 15 * 60_000;
/// Transcripts pass 7 MB; the end of the current turn fits in the last 3 MB (measured).
const TAIL_BYTES: u64 = 3_000_000;
const QUESTION_CHARS: usize = 200;

/// Where the app keeps its files.
#[derive(Debug, Clone)]
pub struct Paths {
    /// `%LOCALAPPDATA%\Claude-Data`: one folder per account, each with `claude-code-sessions`.
    pub data_dir: PathBuf,
    /// `~/.claude/projects`: one folder per working directory, with the `<cliSessionId>.jsonl` transcripts.
    pub projects_dir: PathBuf,
}

impl Paths {
    /// Folders whose changes can change the board: each account's session folder and the transcripts.
    pub fn watch_dirs(&self) -> Vec<PathBuf> {
        let mut dirs: Vec<PathBuf> = list_dir(&self.data_dir)
            .into_iter()
            .map(|acc| acc.join("claude-code-sessions"))
            .filter(|d| d.is_dir())
            .collect();
        dirs.push(self.projects_dir.clone());
        dirs
    }
}

/// Builds boards and keeps the last good one, with `aviso` set while reads fail.
pub struct Board {
    reader: Reader,
    config_path: PathBuf,
    last_good: Option<Fabrica>,
    last_error: Option<String>,
}

impl Board {
    pub fn new(paths: Paths, config_path: PathBuf) -> Self {
        Self {
            reader: Reader::new(paths),
            config_path,
            last_good: None,
            last_error: None,
        }
    }

    /// Reads the sessions again. Never fails: on error it returns the last good board (with its old
    /// `atualizado`, so the page can tell it is stale) plus `aviso`, or an empty board before the first success.
    pub fn refresh(&mut self, now: DateTime<Local>) -> Fabrica {
        let result = Config::load(&self.config_path).and_then(|cfg| self.reader.build(&cfg, now));
        match result {
            Ok(board) => {
                if self.last_error.take().is_some() {
                    tracing::info!("session read is OK again");
                }
                self.last_good = Some(board.clone());
                board
            }
            Err(err) => {
                let msg = err.to_string();
                if self.last_error.as_deref() != Some(msg.as_str()) {
                    tracing::warn!("session read failed: {msg}");
                }
                let aviso = Some(format!("leitura falhou às {}: {msg}", now.format("%H:%M")));
                self.last_error = Some(msg);
                match &self.last_good {
                    Some(good) => Fabrica {
                        aviso,
                        ..good.clone()
                    },
                    None => Fabrica {
                        atualizado: iso(now),
                        aviso,
                        estacoes: Vec::new(),
                        subagentes: Vec::new(),
                    },
                }
            }
        }
    }
}

/// Parsed files, cached by modification time and size: there are ~1200 session files, so each refresh is
/// mostly `stat` calls. Only parses are cached; states that depend on the clock are recomputed every time.
/// ponytail: entries for deleted files are never evicted; a few KB per session, fine until sessions reach 100k.
struct Cache<T> {
    map: HashMap<PathBuf, (SystemTime, u64, T)>,
}

impl<T: Clone> Cache<T> {
    fn new() -> Self {
        Self {
            map: HashMap::new(),
        }
    }

    fn get(&mut self, path: &Path, read: impl FnOnce(&Path, &Metadata) -> Option<T>) -> Option<T> {
        self.get_with(path, fs::metadata(path).ok()?, read)
    }

    /// Same as `get` with metadata already at hand (from a directory listing, which costs no extra syscall
    /// on Windows: a `stat` per session file made each refresh ~60 ms, measured).
    fn get_with(
        &mut self,
        path: &Path,
        meta: Metadata,
        read: impl FnOnce(&Path, &Metadata) -> Option<T>,
    ) -> Option<T> {
        let mtime = meta.modified().ok()?;
        if let Some((m, s, v)) = self.map.get(path)
            && *m == mtime
            && *s == meta.len()
        {
            return Some(v.clone());
        }
        let value = read(path, &meta)?;
        self.map
            .insert(path.to_path_buf(), (mtime, meta.len(), value.clone()));
        Some(value)
    }
}

struct Reader {
    paths: Paths,
    sessions: Cache<Session>,
    groups: Cache<Vec<(String, String)>>,
    tails: Cache<Option<Tail>>,
    metas: Cache<SubagentMeta>,
    transcripts: HashMap<String, PathBuf>,
}

/// What the board needs from one `local_*.json` session file.
#[derive(Debug, Clone)]
struct Session {
    id: String,
    cli: String,
    title: String,
    last: i64,
    archived: bool,
    dirs: Vec<String>,
    summary: String,
    needs: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawSession {
    session_id: String,
    last_activity_at: f64,
    cli_session_id: Option<String>,
    title: Option<String>,
    is_archived: Option<bool>,
    cwd: Option<String>,
    origin_cwd: Option<String>,
    worktree_path: Option<String>,
    post_turn_summary: Option<RawSummary>,
    post_turn_summary_for: Option<String>,
    last_assistant_uuid: Option<String>,
}

#[derive(Deserialize)]
struct RawSummary {
    status_detail: Option<String>,
    needs_action: Option<String>,
}

impl From<RawSession> for Session {
    fn from(j: RawSession) -> Self {
        // the app's summary only describes the last turn; once a new turn opens it describes the previous one
        let current =
            j.post_turn_summary_for.is_some() && j.post_turn_summary_for == j.last_assistant_uuid;
        let (summary, needs) = match (current, j.post_turn_summary) {
            (true, Some(s)) => (
                s.status_detail.unwrap_or_default(),
                s.needs_action.unwrap_or_default(),
            ),
            _ => Default::default(),
        };
        Self {
            id: j.session_id,
            cli: j.cli_session_id.unwrap_or_default(),
            title: j.title.unwrap_or_default(),
            last: j.last_activity_at as i64,
            archived: j.is_archived == Some(true),
            dirs: [j.cwd, j.origin_cwd, j.worktree_path]
                .into_iter()
                .flatten()
                .filter(|d| !d.is_empty())
                .collect(),
            summary,
            needs,
        }
    }
}

/// `claude_desktop_config.json`, down to the sidebar groups only; every other key is skipped unread.
#[derive(Deserialize)]
struct DesktopConfig {
    preferences: Option<Preferences>,
}

#[derive(Deserialize)]
struct Preferences {
    #[serde(rename = "epitaxyPrefs")]
    epitaxy: Option<EpitaxyPrefs>,
}

#[derive(Deserialize)]
struct EpitaxyPrefs {
    #[serde(rename = "dframe-group-scopes", default)]
    scopes: HashMap<String, GroupScope>,
}

#[derive(Deserialize)]
struct GroupScope {
    #[serde(default)]
    groups: Vec<Group>,
    #[serde(default)]
    assignments: HashMap<String, serde_json::Value>,
}

#[derive(Deserialize)]
struct Group {
    id: Option<String>,
    name: Option<String>,
}

/// End of a transcript: whether the turn is closed, when the last event happened and the open question.
#[derive(Debug, Clone)]
struct Tail {
    closed: bool,
    ts: Option<i64>,
    ask: Option<String>,
}

/// One transcript line, down to type, subtype, time, stop reason and tool ids; message text is skipped.
#[derive(Deserialize)]
struct Line {
    #[serde(rename = "type")]
    kind: String,
    subtype: Option<String>,
    timestamp: Option<String>,
    message: Option<Message>,
}

#[derive(Deserialize)]
struct Message {
    stop_reason: Option<String>,
    /// Kept raw and parsed as blocks only when it is a list: some user lines carry a plain string, and an
    /// untagged enum here would buffer every line into a full tree first.
    content: Option<Box<RawValue>>,
}

#[derive(Deserialize)]
struct Block {
    #[serde(rename = "type")]
    kind: Option<String>,
    name: Option<String>,
    id: Option<String>,
    tool_use_id: Option<String>,
    input: Option<AskInput>,
}

/// Only `AskUserQuestion` input is kept; other tools' input fails this shape and is ignored.
#[derive(Deserialize)]
struct AskInput {
    #[serde(default)]
    questions: Vec<Question>,
}

#[derive(Deserialize)]
struct Question {
    question: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct SubagentMeta {
    description: Option<String>,
    #[serde(rename = "agentType")]
    agent_type: Option<String>,
    model: Option<String>,
    #[serde(default)]
    finished: bool,
}

impl Reader {
    fn new(paths: Paths) -> Self {
        Self {
            paths,
            sessions: Cache::new(),
            groups: Cache::new(),
            tails: Cache::new(),
            metas: Cache::new(),
            transcripts: HashMap::new(),
        }
    }

    fn build(&mut self, cfg: &Config, now: DateTime<Local>) -> Result<Fabrica, Error> {
        let now_ms = now.timestamp_millis();
        let mut best: HashMap<String, Session> = HashMap::new();
        let mut files = 0;
        for acc in list_dir(&self.paths.data_dir) {
            for account in list_dir(&acc.join("claude-code-sessions")) {
                for org in list_dir(&account) {
                    let Ok(entries) = fs::read_dir(&org) else {
                        continue;
                    };
                    for entry in entries.flatten() {
                        let file = entry.path();
                        let name = file_name(&file);
                        if !(name.starts_with("local_") && name.ends_with(".json")) {
                            continue;
                        }
                        files += 1;
                        let Ok(meta) = entry.metadata() else { continue };
                        // the app may be writing the file right now: an unreadable one skips this cycle only
                        let Some(s) = self.sessions.get_with(&file, meta, |p, _| {
                            serde_json::from_slice::<RawSession>(&fs::read(p).ok()?)
                                .ok()
                                .map(Session::from)
                        }) else {
                            continue;
                        };
                        // the same session shows up under more than one account folder: the latest wins
                        if best.get(&s.id).is_none_or(|b| s.last > b.last) {
                            best.insert(s.id.clone(), s);
                        }
                    }
                }
            }
        }
        if files == 0 {
            return Err(Error::NoSessionFiles(self.paths.data_dir.clone()));
        }
        if best.is_empty() {
            return Err(Error::NoValidSessions(files));
        }

        let group = self.group_members(&cfg.grupo);
        let roots: Vec<String> = cfg.pastas.iter().map(|p| p.to_lowercase()).collect();
        // a string prefix on purpose: "dungeon-tactics" also covers "dungeon-tactics-lab" and the worktrees
        let mine = |s: &Session| {
            group.contains(&s.id)
                || s.dirs.iter().any(|d| {
                    let d = d.to_lowercase();
                    roots.iter().any(|r| d.starts_with(r.as_str()))
                })
        };
        let fresh = |s: &Session| ((now_ms - s.last) as f64) < cfg.horas_sessao_nova * 3_600_000.0;
        let mut picked: Vec<Session> = best
            .into_values()
            .filter(|s| !s.archived && (cfg.known(&s.id).is_some() || (mine(s) && fresh(s))))
            .collect();
        picked.sort_by_key(|s| {
            let order = cfg.known(&s.id).map_or(usize::MAX, |(i, _)| i);
            (order, std::cmp::Reverse(s.last))
        });
        if picked.is_empty() {
            return Err(Error::NoProjectSessions);
        }

        let mut estacoes = Vec::new();
        let mut subagentes = Vec::new();
        let mut with_transcript = 0;
        for s in picked {
            let known = cfg.known(&s.id).map(|(_, k)| k);
            let id = known.map_or_else(
                || format!("s-{}", s.id.get(6..14).unwrap_or(&s.id)),
                |k| k.id.clone(),
            );
            let transcript = self.transcript_of(&s.cli);
            let tail = transcript
                .as_deref()
                .and_then(|f| self.tails.get(f, |p, m| Some(read_tail(p, m))))
                .flatten();
            if tail.is_some() {
                with_transcript += 1;
            }
            let subs = transcript
                .as_deref()
                .map(|f| self.subagents_of(f, &id, now_ms))
                .unwrap_or_default();
            let open = tail.as_ref().is_some_and(|t| !t.closed);
            let ask = tail.as_ref().and_then(|t| t.ask.clone()).filter(|_| open);
            // "rodando" = open turn with a recent event, or a live subagent (the orchestrator's turn closes
            // while its subagents keep working)
            let recent = tail
                .as_ref()
                .is_some_and(|t| now_ms - t.ts.unwrap_or(0).max(s.last) < RECENT_MS);
            let busy = (open && recent) || subs.iter().any(|d| d.estado == Estado::Rodando);
            let espera = known.and_then(|k| k.espera.clone());
            let estado = if ask.is_some() {
                Estado::AguardandoVoce
            } else if busy {
                Estado::Rodando
            } else if espera.is_some() {
                Estado::Espera
            } else {
                Estado::Ocioso
            };
            let summary = match (s.summary.is_empty(), s.needs.is_empty()) {
                (false, false) if s.needs != s.summary => format!("{} ({})", s.summary, s.needs),
                (false, _) => s.summary.clone(),
                _ => s.needs.clone(),
            };
            let tarefa = match (estado, espera) {
                (Estado::Espera, Some(e)) => e,
                _ if !open && !summary.is_empty() => summary,
                _ => s.title.clone(),
            };
            let nome = known.and_then(|k| k.nome.clone()).unwrap_or_else(|| {
                s.title
                    .trim_start_matches(|c: char| !c.is_alphanumeric())
                    .to_string()
            });
            estacoes.push(Estacao {
                id,
                nome,
                emoji: known
                    .and_then(|k| k.emoji.clone())
                    .unwrap_or_else(|| "🧩".to_string()),
                papel: known.and_then(|k| k.papel.clone()).unwrap_or_default(),
                estado,
                tarefa,
                pergunta: ask,
                sessao: s.id,
            });
            subagentes.extend(subs);
        }
        if with_transcript == 0 {
            return Err(Error::NoTranscripts(self.paths.projects_dir.clone()));
        }
        Ok(Fabrica {
            atualizado: iso(now),
            aviso: None,
            estacoes,
            subagentes,
        })
    }

    /// Session ids assigned to the sidebar group named `name`, in any scope, across every account.
    fn group_members(&mut self, name: &str) -> HashSet<String> {
        let mut ids = HashSet::new();
        for acc in list_dir(&self.paths.data_dir) {
            let file = acc.join("claude_desktop_config.json");
            let pairs = self
                .groups
                .get(&file, |p, _| {
                    let cfg: DesktopConfig = serde_json::from_slice(&fs::read(p).ok()?).ok()?;
                    let scopes = cfg.preferences?.epitaxy?.scopes;
                    let mut out = Vec::new();
                    for scope in scopes.into_values() {
                        for g in scope.groups {
                            let (Some(gid), Some(gname)) = (g.id, g.name) else {
                                continue;
                            };
                            for (k, v) in &scope.assignments {
                                if v.as_str() == Some(gid.as_str()) {
                                    let session = k.strip_prefix("code:").unwrap_or(k);
                                    out.push((gname.clone(), session.to_string()));
                                }
                            }
                        }
                    }
                    Some(out)
                })
                .unwrap_or_default();
            ids.extend(pairs.into_iter().filter(|(g, _)| g == name).map(|(_, s)| s));
        }
        ids
    }

    /// The transcript lives under the project folder of the session's working directory, which changes per
    /// worktree, so it is searched in all of them.
    fn transcript_of(&mut self, cli: &str) -> Option<PathBuf> {
        if cli.is_empty() {
            return None;
        }
        if let Some(p) = self.transcripts.get(cli).filter(|p| p.is_file()) {
            return Some(p.clone());
        }
        let name = format!("{cli}.jsonl");
        let hit = list_dir(&self.paths.projects_dir)
            .into_iter()
            .map(|d| d.join(&name))
            .find(|f| f.is_file())?;
        self.transcripts.insert(cli.to_string(), hit.clone());
        Some(hit)
    }

    fn subagents_of(&mut self, transcript: &Path, estacao: &str, now_ms: i64) -> Vec<Subagente> {
        let dir = transcript.with_extension("").join("subagents");
        let mut out = Vec::new();
        for meta_file in list_dir(&dir) {
            let Some(id) = file_name(&meta_file)
                .strip_suffix(".meta.json")
                .map(str::to_string)
            else {
                continue;
            };
            let Some(meta) = self.metas.get(&meta_file, |p, _| {
                serde_json::from_slice(&fs::read(p).ok()?).ok()
            }) else {
                continue;
            };
            let log = dir.join(format!("{id}.jsonl"));
            let (Ok(meta_stat), Ok(log_stat)) = (fs::metadata(&meta_file), fs::metadata(&log))
            else {
                continue;
            };
            let meta_ms = mtime_ms(&meta_stat);
            // without "finished" and with the log quiet for 15 min it is an orphan (dozens of old metas lack it)
            let running = !meta.finished && now_ms - mtime_ms(&log_stat) < RECENT_MS;
            let done = meta.finished && now_ms - meta_ms < RECENT_MS;
            if !running && !done {
                continue;
            }
            out.push(Subagente {
                id,
                nome: meta
                    .description
                    .filter(|d| !d.is_empty())
                    .or(meta.agent_type)
                    .unwrap_or_default(),
                modelo: meta.model.unwrap_or_default(),
                estacao: estacao.to_string(),
                estado: if running {
                    Estado::Rodando
                } else {
                    Estado::Terminado
                },
                tarefa: String::new(),
                inicio: log_stat.created().ok().map(|t| iso_ms(system_ms(t))),
                fim: done.then(|| iso_ms(meta_ms)),
            });
        }
        out
    }
}

/// Reads the last [`TAIL_BYTES`] of a transcript. Returns `None` when there is no user/assistant/system event.
fn read_tail(path: &Path, meta: &Metadata) -> Option<Tail> {
    let start = meta.len().saturating_sub(TAIL_BYTES);
    let mut file = File::open(path).ok()?;
    file.seek(SeekFrom::Start(start)).ok()?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).ok()?;
    // split bytes, not text: the tail may start in the middle of a UTF-8 character
    let mut lines = buf.split(|b| *b == b'\n');
    if start > 0 {
        lines.next(); // first line cut in half
    }
    let mut last: Option<(bool, Option<i64>)> = None;
    let mut ask: Option<(String, String)> = None;
    let mut answered = HashSet::new();
    for raw in lines {
        let Ok(e) = serde_json::from_slice::<Line>(raw) else {
            continue;
        };
        // api-request-blob lines repeat tool_use blocks and would raise false questions
        if !matches!(e.kind.as_str(), "user" | "assistant" | "system") {
            continue;
        }
        let ts = e
            .timestamp
            .as_deref()
            .and_then(|t| DateTime::parse_from_rfc3339(t).ok())
            .map(|t| t.timestamp_millis());
        let stop = e.message.as_ref().and_then(|m| m.stop_reason.as_deref());
        // the Stop hook writes stop_hook_summary at the end of a turn; without a hook, the final answer counts
        let closed = (e.kind == "system" && e.subtype.as_deref() == Some("stop_hook_summary"))
            || (e.kind == "assistant" && stop == Some("end_turn"));
        last = Some((closed, ts));
        let blocks: Vec<Block> = e
            .message
            .and_then(|m| m.content)
            .and_then(|c| serde_json::from_str(c.get()).ok())
            .unwrap_or_default();
        for b in blocks {
            let kind = b.kind.as_deref();
            if e.kind == "assistant"
                && kind == Some("tool_use")
                && b.name.as_deref() == Some("AskUserQuestion")
            {
                let qs = b.input.map(|i| i.questions).unwrap_or_default();
                let first = qs.first().and_then(|q| q.question.as_deref()).unwrap_or("");
                let mut text: String = first.chars().take(QUESTION_CHARS).collect();
                if qs.len() > 1 {
                    text.push_str(&format!(" (+{})", qs.len() - 1));
                }
                ask = Some((b.id.unwrap_or_default(), text));
            }
            if e.kind == "user" && kind == Some("tool_result") {
                answered.extend(b.tool_use_id);
            }
        }
    }
    let (closed, ts) = last?;
    Some(Tail {
        closed,
        ts,
        ask: ask.filter(|(id, _)| !answered.contains(id)).map(|(_, q)| q),
    })
}

fn list_dir(dir: &Path) -> Vec<PathBuf> {
    fs::read_dir(dir)
        .map(|rd| rd.flatten().map(|e| e.path()).collect())
        .unwrap_or_default()
}

fn file_name(path: &Path) -> &str {
    path.file_name().and_then(|n| n.to_str()).unwrap_or("")
}

fn system_ms(t: SystemTime) -> i64 {
    t.duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as i64)
}

fn mtime_ms(meta: &Metadata) -> i64 {
    meta.modified().map_or(0, system_ms)
}

/// ISO 8601 with the local offset and whole seconds, as the page expects (`2026-11-14T22:23:22-03:00`).
pub fn iso(t: DateTime<Local>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Secs, false)
}

fn iso_ms(ms: i64) -> String {
    Local
        .timestamp_millis_opt(ms)
        .single()
        .map(iso)
        .unwrap_or_default()
}

#[cfg(test)]
mod tests;
