# GDD Dungeon Tactics

Platform that supports the development of Dungeon Tactics: a Rust server that reads the state of the Claude Code
sessions (the "Fábrica") and a React app that shows every lab as a town on a kingdom map.

- `crates/labs-core`: board contract and the reader of the desktop app's files ([README](crates/labs-core/README.md))
- `crates/labs-server`: HTTP API, SSE and static files ([README](crates/labs-server/README.md))
- `web/`: React front end ([README](web/README.md))
- `docs/CONTRATO-FABRICA.md`: the board contract

## Quick start

```bash
cp config/fabrica.example.toml config/fabrica.toml   # then put your own session ids in it
cargo run -p labs-server                              # API on http://localhost:5191
cd web && npm ci && npm run dev                       # app on http://localhost:5192
```

Without the Rust server, `npm run dev:mock` serves the app with a fake API.

## Checks

```bash
cargo fmt --check && cargo test
cd web && npm run typecheck && npm run lint && npm test
```

Code under the MIT licence.
