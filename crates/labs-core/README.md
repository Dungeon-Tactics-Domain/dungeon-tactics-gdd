# labs-core

The factory board contract (`Fabrica`, `Estacao`, `Subagente`, `Estado`) and the reader that builds it from the
Claude Code desktop app's files, plus the per-asset decisions (`Decisao`, `Escolha`, module `decisoes`). No HTTP
here; [`labs-server`](../labs-server/README.md) serves both.

```rust
let mut board = labs_core::Board::new(paths, "config/fabrica.toml".into());
let fabrica = board.refresh(chrono::Local::now()); // never fails: last good board + `aviso` on error
```

## What is read (metadata only)

- **Sessions:** `Claude-Data\<account>\claude-code-sessions\<a>\<b>\local_*.json`: id, title, last activity,
  archived flag, folders and the app's post-turn summary. The same session under several accounts counts once
  (the latest). Archived sessions are left out.
- **Sidebar group:** `Claude-Data\<account>\claude_desktop_config.json`, only `preferences.epitaxyPrefs.dframe-group-scopes`.
- **Transcript:** `~/.claude/projects/*/<cliSessionId>.jsonl`, the last 3 MB only, and from each line only the
  type, subtype, time, stop reason, tool ids and the first question of an `AskUserQuestion`.
- **Subagents:** `<transcript>/subagents/*.meta.json` (description, agent type, model, `finished`) and the
  modification time of each agent log.

Every file is deserialized into structs that keep only those fields; message text is never kept or logged.

## States

- `aguardando-voce`: open turn with an unanswered `AskUserQuestion` (`pergunta` = first question, 200 chars, `(+N)`).
- `rodando`: open turn with an event in the last 15 min, or a live subagent.
- `espera`: the config has `espera` and the session is neither running nor asking.
- `ocioso`: the rest. Subagents are `rodando` (no `finished`, log touched within 15 min) or `terminado`
  (finished within 15 min).

`tarefa` is the app's summary of the last turn when the turn is closed, else the session title.

## Limits

- Undocumented internal format: `stop_hook_summary`, `finished`, the session JSON fields and the sidebar group may
  change with an app update. The board then freezes with `aviso` instead of showing wrong data.
- "rodando" is inferred: a session left mid-turn shows as running for up to 15 min; a tool silent for more than
  15 min shows as idle.
- A subagent that dies without writing `finished` leaves the board 15 min after its last event.

## Decisions

Fernando's decision per asset, saved by the platform and read by Claude sessions as a file (default
`data/decisoes.json`, key `decisoes` in `config/fabrica.toml`). The file is a JSON object keyed by asset id, sorted and
indented; `data/decisoes.example.json` shows it:

```json
{ "musica/batalha-c": { "id": "musica/batalha-c", "lab": "musica", "escolha": "refazer", "nota": "…", "atualizadoEm": "2026-11-15T10:00:00-03:00" } }
```

- `id`: `<lab>/<path>`, segments of ASCII letters, digits, `.`, `_`, `-` (no `.` or `..` alone), up to 200 characters.
  Ids in use: `musica/<track id>` (e.g. `musica/batalha-c`), `modelos/<set in pecas.json>/<piece id>` (e.g.
  `modelos/carrocas-high/D`) and `modelos/blender/<model>` (e.g. `modelos/blender/opus`).
- `escolha`: `usar`, `descartar`, `refazer` or `talvez`. `nota`: free text, trimmed, up to 2000 characters.
- `atualizadoEm`: set by the server when it saves.
- `decisoes::gravar` writes a temporary file and renames it over the real one. A broken file is an error and is never
  overwritten. There is no delete: change the choice, or edit the file by hand.

## Tests

`cargo test -p labs-core` runs unit tests on small synthetic fixtures written to a temp folder, and regenerates
the TypeScript bindings in `web/src/types/generated/`.
