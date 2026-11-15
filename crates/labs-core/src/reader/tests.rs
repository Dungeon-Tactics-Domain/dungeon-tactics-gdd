//! Unit tests on small synthetic fixtures written to a temp folder (no real session data).

use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime};

use chrono::{DateTime, Local};
use serde_json::{Value, json};
use tempfile::TempDir;

use super::*;

struct Fixture {
    _dir: TempDir,
    paths: Paths,
    config: PathBuf,
}

const CONFIG: &str = r#"
grupo = "⚔️ Dungeon Tactics"
pastas = ['D:\Projetos\dungeon-tactics']

[[sessoes]]
sessao = "local_known-1"
id = "impl"
nome = "Orquestrador"
emoji = "🧭"
papel = "junta commits"

[[sessoes]]
sessao = "local_known-2"
id = "narrativa"
espera = "esperando os fluxos"
"#;

impl Fixture {
    fn new() -> Self {
        let dir = TempDir::new().unwrap();
        let paths = Paths {
            data_dir: dir.path().join("Claude-Data"),
            projects_dir: dir.path().join("projects"),
        };
        let config = dir.path().join("fabrica.toml");
        fs::write(&config, CONFIG).unwrap();
        Self {
            _dir: dir,
            paths,
            config,
        }
    }

    /// Writes a session file under `account`; `extra` adds or overrides fields.
    fn session(&self, account: &str, id: &str, title: &str, last: DateTime<Local>, extra: Value) {
        let dir = self
            .paths
            .data_dir
            .join(account)
            .join("claude-code-sessions/acc/org");
        fs::create_dir_all(&dir).unwrap();
        let mut j = json!({
            "sessionId": id,
            "cliSessionId": format!("cli-{id}"),
            "title": title,
            "lastActivityAt": last.timestamp_millis(),
            "cwd": r"C:\elsewhere",
        });
        j.as_object_mut()
            .unwrap()
            .extend(extra.as_object().unwrap().clone());
        fs::write(dir.join(format!("{id}.json")), j.to_string()).unwrap();
    }

    fn transcript(&self, id: &str, lines: &[Value]) -> PathBuf {
        let dir = self.paths.projects_dir.join("D--Projetos-x");
        fs::create_dir_all(&dir).unwrap();
        let file = dir.join(format!("cli-{id}.jsonl"));
        let text: String = lines.iter().map(|l| format!("{l}\n")).collect();
        fs::write(&file, text).unwrap();
        file
    }

    fn subagent(&self, transcript: &Path, id: &str, finished: bool, age: Duration) {
        let dir = transcript.with_extension("").join("subagents");
        fs::create_dir_all(&dir).unwrap();
        let mut meta = json!({ "description": format!("agent {id}"), "agentType": "general-purpose", "model": "opus" });
        if finished {
            meta["finished"] = json!(true);
        }
        let meta_file = dir.join(format!("{id}.meta.json"));
        let log_file = dir.join(format!("{id}.jsonl"));
        fs::write(&meta_file, meta.to_string()).unwrap();
        fs::write(&log_file, "{}\n").unwrap();
        for f in [meta_file, log_file] {
            File::options()
                .write(true)
                .open(f)
                .unwrap()
                .set_modified(SystemTime::now() - age)
                .unwrap();
        }
    }

    fn board(&self) -> Board {
        Board::new(self.paths.clone(), self.config.clone())
    }
}

fn now() -> DateTime<Local> {
    Local::now()
}

fn ago(minutes: i64) -> DateTime<Local> {
    now() - chrono::Duration::minutes(minutes)
}

fn event(kind: &str, at: DateTime<Local>, message: Value) -> Value {
    json!({ "type": kind, "timestamp": at.to_rfc3339(), "message": message })
}

fn user_text(at: DateTime<Local>) -> Value {
    event(
        "user",
        at,
        json!({ "role": "user", "content": "plain string content" }),
    )
}

fn closed_turn(at: DateTime<Local>) -> Vec<Value> {
    vec![
        user_text(at),
        event(
            "assistant",
            at,
            json!({ "stop_reason": "end_turn", "content": [{ "type": "text", "text": "done" }] }),
        ),
        json!({ "type": "system", "subtype": "stop_hook_summary", "timestamp": at.to_rfc3339() }),
    ]
}

fn ask(at: DateTime<Local>, id: &str, questions: &[&str]) -> Value {
    let qs: Vec<Value> = questions.iter().map(|q| json!({ "question": q })).collect();
    event(
        "assistant",
        at,
        json!({ "stop_reason": "tool_use", "content": [{ "type": "tool_use", "id": id, "name": "AskUserQuestion", "input": { "questions": qs } }] }),
    )
}

fn station<'a>(f: &'a Fabrica, id: &str) -> &'a Estacao {
    f.estacoes
        .iter()
        .find(|e| e.id == id)
        .unwrap_or_else(|| panic!("no station {id}: {f:?}"))
}

#[test]
fn open_question_waits_for_you() {
    let fx = Fixture::new();
    fx.session("a", "local_known-1", "⚔️🧭 Orquestrador", ago(1), json!({}));
    let long = "á".repeat(250);
    fx.transcript(
        "local_known-1",
        &[user_text(ago(2)), ask(ago(1), "t1", &[&long, "segunda"])],
    );
    let f = fx.board().refresh(now());
    let s = station(&f, "impl");
    assert_eq!(s.estado, Estado::AguardandoVoce);
    assert_eq!(
        s.pergunta.as_deref(),
        Some(format!("{} (+1)", "á".repeat(200)).as_str())
    );
    assert_eq!(
        (s.nome.as_str(), s.emoji.as_str(), s.papel.as_str()),
        ("Orquestrador", "🧭", "junta commits")
    );
    // open turn: the task is the title, not the previous turn's summary
    assert_eq!(s.tarefa, "⚔️🧭 Orquestrador");
}

#[test]
fn answered_question_and_closed_turn_is_idle_with_summary() {
    let fx = Fixture::new();
    let summary = json!({
        "lastAssistantUuid": "u9", "postTurnSummaryFor": "u9",
        "postTurnSummary": { "status_detail": "gates verdes", "needs_action": "escolher o próximo" },
    });
    fx.session("a", "local_known-1", "Orq", ago(1), summary);
    let mut lines = vec![ask(ago(3), "t1", &["pergunta?"])];
    lines.push(event(
        "user",
        ago(2),
        json!({ "content": [{ "type": "tool_result", "tool_use_id": "t1" }] }),
    ));
    lines.extend(closed_turn(ago(1)));
    fx.transcript("local_known-1", &lines);
    let f = fx.board().refresh(now());
    let s = station(&f, "impl");
    assert_eq!(s.estado, Estado::Ocioso);
    assert_eq!(s.pergunta, None);
    assert_eq!(s.tarefa, "gates verdes (escolher o próximo)");
}

#[test]
fn stale_summary_is_ignored() {
    let fx = Fixture::new();
    let summary = json!({
        "lastAssistantUuid": "u10", "postTurnSummaryFor": "u9",
        "postTurnSummary": { "status_detail": "antigo" },
    });
    fx.session("a", "local_known-1", "Orq", ago(1), summary);
    fx.transcript("local_known-1", &closed_turn(ago(1)));
    assert_eq!(station(&fx.board().refresh(now()), "impl").tarefa, "Orq");
}

#[test]
fn open_turn_is_running_until_it_goes_quiet() {
    let fx = Fixture::new();
    fx.session("a", "local_known-1", "Orq", ago(1), json!({}));
    fx.transcript("local_known-1", &[user_text(ago(1))]);
    fx.session("a", "local_known-2", "Narrativa", ago(60), json!({}));
    fx.transcript("local_known-2", &[user_text(ago(60))]);
    let f = fx.board().refresh(now());
    assert_eq!(station(&f, "impl").estado, Estado::Rodando);
    let n = station(&f, "narrativa");
    assert_eq!(n.estado, Estado::Espera);
    assert_eq!(n.tarefa, "esperando os fluxos");
    // the quiet open turn without a config "espera" is idle
    let f = fx.board().refresh(now() + chrono::Duration::minutes(20));
    assert_eq!(station(&f, "impl").estado, Estado::Ocioso);
}

#[test]
fn subagents_live_finished_and_orphans() {
    let fx = Fixture::new();
    fx.session("a", "local_known-1", "Orq", ago(30), json!({}));
    let t = fx.transcript("local_known-1", &closed_turn(ago(30)));
    fx.subagent(&t, "agent-live", false, Duration::from_secs(5));
    fx.subagent(&t, "agent-orphan", false, Duration::from_secs(3600));
    fx.subagent(&t, "agent-done", true, Duration::from_secs(60));
    fx.subagent(&t, "agent-old", true, Duration::from_secs(3600));
    let f = fx.board().refresh(now());
    let mut subs: Vec<(&str, Estado, bool)> = f
        .subagentes
        .iter()
        .map(|s| (s.id.as_str(), s.estado, s.fim.is_some()))
        .collect();
    subs.sort_by_key(|s| s.0);
    assert_eq!(
        subs,
        [
            ("agent-done", Estado::Terminado, true),
            ("agent-live", Estado::Rodando, false)
        ]
    );
    assert!(
        f.subagentes
            .iter()
            .all(|s| s.estacao == "impl" && s.modelo == "opus" && s.inicio.is_some())
    );
    assert_eq!(
        f.subagentes[0].nome,
        format!("agent {}", f.subagentes[0].id)
    );
    // a closed turn with a live subagent still counts as running
    assert_eq!(station(&f, "impl").estado, Estado::Rodando);
}

#[test]
fn picks_project_sessions_dedups_and_orders() {
    let fx = Fixture::new();
    // known sessions keep the config order even when older
    fx.session("a", "local_known-2", "Narrativa", ago(500), json!({}));
    fx.transcript("local_known-2", &closed_turn(ago(500)));
    fx.session("a", "local_known-1", "Orq", ago(400), json!({}));
    fx.transcript("local_known-1", &closed_turn(ago(400)));
    // unknown, inside the project folder (prefix, any case), recent: generic station
    fx.session(
        "a",
        "local_abcdefgh-1234",
        "⚔️🧩 Ajuste do mapa",
        ago(5),
        json!({ "cwd": r"d:\projetos\Dungeon-Tactics-lab\x" }),
    );
    // the same session in another account, older: ignored
    fx.session(
        "b",
        "local_abcdefgh-1234",
        "título velho",
        ago(50),
        json!({ "cwd": r"d:\projetos\dungeon-tactics" }),
    );
    // unknown via sidebar group
    fx.session("a", "local_grouped-99", "Grupo", ago(10), json!({}));
    let desktop = json!({ "preferences": { "epitaxyPrefs": { "dframe-group-scopes": { "s1": {
        "groups": [{ "id": "g1", "name": "⚔️ Dungeon Tactics" }, { "id": "g2", "name": "Outro" }],
        "assignments": { "code:local_grouped-99": "g1", "code:local_other": "g2" },
    } } } }, "secret": "never read" });
    fs::write(
        fx.paths.data_dir.join("a/claude_desktop_config.json"),
        desktop.to_string(),
    )
    .unwrap();
    // excluded: archived, too old, outside the project
    fx.session(
        "a",
        "local_archived",
        "x",
        ago(1),
        json!({ "isArchived": true, "cwd": r"D:\Projetos\dungeon-tactics" }),
    );
    fx.session(
        "a",
        "local_old",
        "x",
        ago(48 * 60),
        json!({ "cwd": r"D:\Projetos\dungeon-tactics" }),
    );
    fx.session("a", "local_other", "x", ago(1), json!({}));
    // corrupt file: skipped, not fatal
    fs::write(
        fx.paths
            .data_dir
            .join("a/claude-code-sessions/acc/org/local_broken.json"),
        "{ half",
    )
    .unwrap();

    let f = fx.board().refresh(now());
    assert_eq!(f.aviso, None);
    let ids: Vec<&str> = f.estacoes.iter().map(|e| e.id.as_str()).collect();
    assert_eq!(ids, ["impl", "narrativa", "s-abcdefgh", "s-grouped-"]);
    let generic = station(&f, "s-abcdefgh");
    assert_eq!(
        (generic.nome.as_str(), generic.emoji.as_str()),
        ("Ajuste do mapa", "🧩")
    );
    assert_eq!(generic.tarefa, "⚔️🧩 Ajuste do mapa");
}

#[test]
fn keeps_last_good_board_with_a_warning() {
    let fx = Fixture::new();
    fx.session("a", "local_known-1", "Orq", ago(1), json!({}));
    fx.transcript("local_known-1", &closed_turn(ago(1)));
    let mut board = fx.board();
    let good = board.refresh(now());
    assert_eq!(good.aviso, None);

    fs::remove_dir_all(&fx.paths.projects_dir).unwrap();
    let bad = board.refresh(now() + chrono::Duration::seconds(10));
    assert!(
        bad.aviso.as_deref().unwrap().contains("nenhum transcript"),
        "{bad:?}"
    );
    assert_eq!(bad.estacoes, good.estacoes);
    assert_eq!(bad.atualizado, good.atualizado);

    fx.transcript("local_known-1", &closed_turn(ago(1)));
    assert_eq!(board.refresh(now()).aviso, None);
}

#[test]
fn first_failure_gives_an_empty_board_with_a_warning() {
    let fx = Fixture::new();
    let f = fx.board().refresh(now());
    assert!(f.estacoes.is_empty());
    assert!(
        f.aviso
            .as_deref()
            .unwrap()
            .contains("nenhum JSON de sessão")
    );
}

#[test]
fn tail_starting_mid_character_still_parses() {
    let dir = TempDir::new().unwrap();
    let file = dir.path().join("t.jsonl");
    // ~3.2 MB of two-byte characters, so the 3 MB cut lands on a random byte
    let filler = format!("{{\"type\":\"user\",\"x\":\"{}\"}}\n", "é".repeat(800_000));
    let last = json!({ "type": "system", "subtype": "stop_hook_summary", "timestamp": "2026-11-14T10:00:00Z" });
    fs::write(&file, format!("{filler}{filler}{last}\n")).unwrap();
    let tail = read_tail(&file, &fs::metadata(&file).unwrap()).unwrap();
    assert!(tail.closed);
    assert_eq!(
        tail.ts,
        Some(
            DateTime::parse_from_rfc3339("2026-11-14T10:00:00Z")
                .unwrap()
                .timestamp_millis()
        )
    );
}

#[test]
fn contract_serializes_like_the_page_expects() {
    let e = Estacao {
        id: "impl".into(),
        nome: "n".into(),
        emoji: "🧭".into(),
        papel: String::new(),
        estado: Estado::AguardandoVoce,
        tarefa: "t".into(),
        pergunta: None,
        sessao: "local_x".into(),
    };
    let v = serde_json::to_value(&e).unwrap();
    assert_eq!(v["estado"], "aguardando-voce");
    assert!(v.get("pergunta").is_none());
}
