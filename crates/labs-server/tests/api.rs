//! Starts the server on an ephemeral port over synthetic session files and checks the JSON endpoint,
//! the SSE stream (first event, then an event after a session file changes) and the decisions API.

use std::fs;
use std::path::Path;
use std::time::Duration;

use labs_core::{Decisao, Escolha, Estado, Fabrica, Paths};
use tempfile::TempDir;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::time::timeout;

const CONFIG: &str = r#"
grupo = "⚔️ Dungeon Tactics"

[[sessoes]]
sessao = "local_one"
id = "impl"
emoji = "🧭"
"#;

fn write_session(data: &Path, title: &str) {
    let dir = data.join("acc/claude-code-sessions/a/o");
    fs::create_dir_all(&dir).unwrap();
    let last = chrono::Local::now().timestamp_millis();
    let json = format!(
        r#"{{"sessionId":"local_one","cliSessionId":"cli-one","title":"{title}","lastActivityAt":{last}}}"#
    );
    fs::write(dir.join("local_one.json"), json).unwrap();
}

fn fixtures() -> (TempDir, Paths) {
    let dir = TempDir::new().unwrap();
    let paths = Paths {
        data_dir: dir.path().join("Claude-Data"),
        projects_dir: dir.path().join("projects"),
    };
    write_session(&paths.data_dir, "Orquestrador");
    let project = paths.projects_dir.join("proj");
    fs::create_dir_all(&project).unwrap();
    let now = chrono::Local::now().to_rfc3339();
    let ask = format!(
        r#"{{"type":"assistant","timestamp":"{now}","message":{{"content":[{{"type":"tool_use","id":"t1","name":"AskUserQuestion","input":{{"questions":[{{"question":"Pode publicar?"}}]}}}}]}}}}"#
    );
    fs::write(project.join("cli-one.jsonl"), format!("{ask}\n")).unwrap();
    fs::write(dir.path().join("fabrica.toml"), CONFIG).unwrap();
    (dir, paths)
}

async fn start(dir: &TempDir, paths: Paths) -> u16 {
    let board = labs_server::start_reader(paths, dir.path().join("fabrica.toml")).unwrap();
    let dist = dir.path().join("dist");
    fs::create_dir_all(&dist).unwrap();
    fs::write(
        dist.join("index.html"),
        "<!doctype html><title>labs-spa</title>",
    )
    .unwrap();
    let app = labs_server::router(board, &dist, dir.path().join("data/decisoes.json"));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    port
}

async fn request(port: u16, path: &str) -> TcpStream {
    let mut s = TcpStream::connect(("127.0.0.1", port)).await.unwrap();
    let req = format!("GET {path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n");
    s.write_all(req.as_bytes()).await.unwrap();
    s
}

/// Sends a JSON `PUT` and returns the status code and body.
async fn put(port: u16, path: &str, body: &str) -> (u16, String) {
    let mut s = TcpStream::connect(("127.0.0.1", port)).await.unwrap();
    let req = format!(
        "PUT {path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{body}",
        body.len()
    );
    s.write_all(req.as_bytes()).await.unwrap();
    let mut resp = String::new();
    s.read_to_string(&mut resp).await.unwrap();
    let status = resp[9..12].parse().unwrap();
    let body = resp.split("\r\n\r\n").nth(1).unwrap_or("");
    (status, body.to_string())
}

/// Reads from an SSE response until `n` complete `fabrica` events arrived; returns their JSON payloads.
async fn read_events(s: &mut TcpStream, buf: &mut String, n: usize) -> Vec<Fabrica> {
    loop {
        let events: Vec<Fabrica> = buf
            .split("event: fabrica\n")
            .skip(1)
            .filter_map(|e| e.lines().find_map(|l| l.strip_prefix("data: ")))
            .filter_map(|d| serde_json::from_str(d).ok())
            .collect();
        if events.len() >= n {
            return events;
        }
        let mut chunk = [0u8; 8192];
        let read = s.read(&mut chunk).await.unwrap();
        assert!(read > 0, "stream closed: {buf}");
        buf.push_str(&String::from_utf8_lossy(&chunk[..read]));
    }
}

#[tokio::test(flavor = "multi_thread")]
async fn serves_the_board_and_streams_changes() {
    let (dir, paths) = fixtures();
    let port = start(&dir, paths.clone()).await;

    let mut s = request(port, "/api/fabrica").await;
    let mut resp = String::new();
    s.read_to_string(&mut resp).await.unwrap();
    assert!(resp.starts_with("HTTP/1.1 200"), "{resp}");
    let body = resp.split("\r\n\r\n").nth(1).unwrap();
    let board: Fabrica = serde_json::from_str(body).unwrap();
    assert_eq!(board.aviso, None);
    assert_eq!(board.estacoes.len(), 1);
    let st = &board.estacoes[0];
    assert_eq!(
        (st.id.as_str(), st.estado),
        ("impl", Estado::AguardandoVoce)
    );
    assert_eq!(st.pergunta.as_deref(), Some("Pode publicar?"));

    let mut sse = request(port, "/api/fabrica/stream").await;
    let mut buf = String::new();
    let first = timeout(Duration::from_secs(5), read_events(&mut sse, &mut buf, 1))
        .await
        .expect("first SSE event");
    assert!(buf.contains("content-type: text/event-stream"), "{buf}");
    assert!(buf.contains("retry: 3000"), "{buf}");
    assert_eq!(first[0].estacoes, board.estacoes);

    // a session file change reaches the stream (watcher, or the 10 s re-read at the latest)
    write_session(&paths.data_dir, "Orquestrador renomeado");
    let events = timeout(Duration::from_secs(15), read_events(&mut sse, &mut buf, 2))
        .await
        .expect("SSE event after a change");
    assert_eq!(events[1].estacoes[0].nome, "Orquestrador renomeado");

    // client-side routes fall back to the SPA's index.html
    let mut s = request(port, "/fabrica/qualquer").await;
    let mut resp = String::new();
    s.read_to_string(&mut resp).await.unwrap();
    assert!(
        resp.starts_with("HTTP/1.1 200") && resp.contains("labs-spa"),
        "{resp}"
    );
}

#[tokio::test(flavor = "multi_thread")]
async fn missing_sessions_give_an_empty_board_with_a_warning() {
    let dir = TempDir::new().unwrap();
    fs::write(dir.path().join("fabrica.toml"), CONFIG).unwrap();
    let paths = Paths {
        data_dir: dir.path().join("nothing"),
        projects_dir: dir.path().join("nothing"),
    };
    let port = start(&dir, paths).await;
    let mut s = request(port, "/api/fabrica").await;
    let mut resp = String::new();
    s.read_to_string(&mut resp).await.unwrap();
    assert!(resp.starts_with("HTTP/1.1 200"), "{resp}");
    let board: Fabrica = serde_json::from_str(resp.split("\r\n\r\n").nth(1).unwrap()).unwrap();
    assert!(board.estacoes.is_empty());
    assert!(board.aviso.is_some());
}

#[tokio::test(flavor = "multi_thread")]
async fn saves_and_lists_decisions() {
    let (dir, paths) = fixtures();
    let port = start(&dir, paths).await;
    let get = || async {
        let mut s = request(port, "/api/decisoes").await;
        let mut resp = String::new();
        s.read_to_string(&mut resp).await.unwrap();
        assert!(resp.starts_with("HTTP/1.1 200"), "{resp}");
        let body = resp.split("\r\n\r\n").nth(1).unwrap();
        serde_json::from_str::<Vec<Decisao>>(body).unwrap()
    };
    assert!(get().await.is_empty(), "no file yet");

    let (status, body) = put(
        port,
        "/api/decisoes/musica/batalha-c",
        r#"{"lab":"musica","escolha":"refazer","nota":"ponte longa"}"#,
    )
    .await;
    assert_eq!(status, 200, "{body}");
    let saved: Decisao = serde_json::from_str(&body).unwrap();
    assert_eq!(
        (saved.id.as_str(), saved.escolha, saved.nota.as_str()),
        ("musica/batalha-c", Escolha::Refazer, "ponte longa")
    );
    assert!(!saved.atualizado_em.is_empty());
    assert_eq!(get().await, [saved]);
    assert!(dir.path().join("data/decisoes.json").is_file());

    // invalid input is refused and leaves the file alone
    let long = "a".repeat(labs_core::decisoes::NOTA_MAX + 1);
    for (path, body) in [
        (
            "/api/decisoes/musica",
            r#"{"lab":"musica","escolha":"usar"}"#.to_string(),
        ),
        (
            "/api/decisoes/musica/a%20b",
            r#"{"lab":"musica","escolha":"usar"}"#.into(),
        ),
        (
            "/api/decisoes/musica/..",
            r#"{"lab":"musica","escolha":"usar"}"#.into(),
        ),
        (
            "/api/decisoes/musica/a",
            r#"{"lab":"modelos","escolha":"usar"}"#.into(),
        ),
        (
            "/api/decisoes/musica/a",
            format!(r#"{{"lab":"musica","escolha":"usar","nota":"{long}"}}"#),
        ),
    ] {
        let (status, body) = put(port, path, &body).await;
        assert_eq!(status, 400, "{path}: {body}");
    }
    for body in [
        r#"{"lab":"musica","escolha":"talvez-nao"}"#,
        r#"{"lab":"musica","escolha":"usar","x":1}"#,
    ] {
        let (status, _) = put(port, "/api/decisoes/musica/a", body).await;
        assert_eq!(status, 422, "{body}");
    }
    assert_eq!(get().await.len(), 1);
}
