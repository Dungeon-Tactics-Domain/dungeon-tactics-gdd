# labs-server

Local HTTP server for the Dungeon Tactics labs. It shows the "factory board": which Claude Code sessions
(stations) are running, idle, waiting or asking you something, and which subagents are alive. It replaces
the old `scripts/fabrica-sync.mjs` of the first lab, which rewrote a JSON file every 10 s.

Built on Axum and Tokio. The reading logic lives in [`labs-core`](../labs-core/README.md).

## Run

```powershell
cargo run --release -p labs-server                      # http://127.0.0.1:5190
cargo run --release -p labs-server -- --port 5191       # another port
$env:RUST_LOG = "labs_server=debug,info"                 # log every read with its duration
```

| Flag | Env | Default |
|---|---|---|
| `--port` | `LABS_PORT` | `5190` |
| `--host` | `LABS_HOST` | `127.0.0.1` (the board is private) |
| `--config` | `LABS_CONFIG` | `config/fabrica.toml` |
| `--claude-data` | `LABS_CLAUDE_DATA` | `%LOCALAPPDATA%\Claude-Data` |
| `--claude-projects` | `LABS_CLAUDE_PROJECTS` | `~/.claude/projects` |
| `--web-dist` | `LABS_WEB_DIST` | `web/dist` |

Paths are relative to the working directory: run it from the repository root.

## API

Types are in [`docs/CONTRATO-FABRICA.md`](../../docs/CONTRATO-FABRICA.md) and in TypeScript under
`web/src/types/generated/`.

- `GET /api/fabrica` returns the current `Fabrica`. Always `200`: when a read fails, the last good board comes
  back with `aviso` set (and its old `atualizado`); before any good read, an empty board with `aviso`.
- `GET /api/fabrica/stream` is Server-Sent Events:
  - the current board as the first `fabrica` event, so a (re)connected client never waits;
  - a `fabrica` event each time the board **content** changes (`atualizado` alone does not count, it moves on
    every read);
  - a `ping` event after 15 s without other events: use it as the liveness signal, since `atualizado` is not
    pushed on its own;
  - `retry: 3000`, so `EventSource` reconnects 3 s after a drop.
- `GET /api/decisoes` returns every decision (`Decisao[]`, sorted by id; `[]` when the file does not exist yet).
- `PUT /api/decisoes/{id}` with `{"lab": "musica", "escolha": "usar", "nota": "…"}` saves one decision and returns it.
  The id keeps its slashes (`/api/decisoes/musica/batalha-c`). The server listens on the LAN, so the body is a trust
  boundary: unknown fields or an unknown `escolha` give `422`; a bad id, an id that does not start with `lab`, or a
  note over 2000 characters give `400` with the reason as text; a broken file gives `500` and is left as it was.
  The file is re-read on every request (hand edits show up at once) and one lock serializes the writes.
- Any other path serves `web/dist` when `web/dist/index.html` exists, with `index.html` as the fallback for
  client-side routes (missing assets also get `index.html`). Without a build, only the API is served.
- No CORS headers: in development, proxy `/api` from the Vite dev server to this server.

## How it stays current

- A [`notify`](https://docs.rs/notify) watcher on each `Claude-Data\<account>\claude-code-sessions` folder and on
  `~/.claude/projects`, debounced to one read per 2 s at most (active transcripts change many times a second).
- A re-read every 10 s as a safety net, which also moves clock-driven states (a quiet open turn stops being
  "rodando" after 15 min, finished subagents leave after 15 min) and picks up `config/fabrica.toml` edits.
- Reads are cached by file modification time and size, so a read is mostly a directory listing plus the
  transcripts that changed (~30-40 ms on ~1200 sessions; ~1% of one core, measured on 14/11).

## Configuration

Copy `config/fabrica.example.toml` to `config/fabrica.toml` (git-ignored, holds your own session ids) and edit it.
The file is the TOML version of the old `fabrica-config.json`:

```toml
grupo = "⚔️ Dungeon Tactics"              # sidebar group whose sessions join the board
pastas = ['D:\Projetos\dungeon-tactics']  # sessions whose folder starts with this join (case-insensitive prefix)
horas_sessao_nova = 24                    # unlisted sessions only show while active within this many hours
decisoes = 'data/decisoes.json'           # optional: per-asset decisions file (read once at start-up)

[[sessoes]]                               # fixed stations, in bench order
sessao = "local_..."                      # the app's session id
id = "impl"
nome = "Orquestrador Dungeon Tactics"
emoji = "🧭"
papel = "junta commits, roda gates, publica"
espera = "motivo"                         # optional, manual
```

## Development

```powershell
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test                                 # also regenerates the TypeScript types
cargo test -p labs-core export_bindings    # only the TypeScript types, into web/src/types/generated/
```

`tests/api.rs` starts the server on an ephemeral port over synthetic session files and checks `/api/fabrica`,
the first SSE event, an SSE event after a session file changes, the SPA fallback, and saving, listing and refusing
decisions.

## Limits

The app's session files are an internal, undocumented format (app 5.11492.5, CLI 2.1.325). See the
[`labs-core` README](../labs-core/README.md#limits).
