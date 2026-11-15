# labs-core

The factory board contract (`Fabrica`, `Estacao`, `Subagente`, `Estado`) and the reader that builds it from the
Claude Code desktop app's files. No HTTP here; [`labs-server`](../labs-server/README.md) serves it.

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

## Tests

`cargo test -p labs-core` runs unit tests on small synthetic fixtures written to a temp folder, and regenerates
the TypeScript bindings in `web/src/types/generated/`.
