//! HTTP side of the labs: serves the factory board as JSON and as a live SSE stream, plus the built web app.

use std::convert::Infallible;
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::sync::mpsc::{self, RecvTimeoutError};
use std::time::{Duration, Instant};

use axum::Router;
use axum::extract::State;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Json};
use axum::routing::get;
use labs_core::{Board, Fabrica, Paths};
use notify_debouncer_mini::notify::RecursiveMode;
use notify_debouncer_mini::{DebounceEventResult, new_debouncer};
use tokio::sync::watch;
use tokio_stream::{Stream, StreamExt, wrappers::WatchStream};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

/// Safety net for changes the watcher misses and for clock-driven states (a quiet turn stops "rodando").
pub const REREAD_EVERY: Duration = Duration::from_secs(10);
/// Active transcripts change many times a second; one refresh per 2 s at most keeps the CPU near idle.
pub const DEBOUNCE: Duration = Duration::from_secs(2);
const PING_EVERY: Duration = Duration::from_secs(15);
const RETRY: Duration = Duration::from_secs(3);

/// Starts the background reader and returns the live board.
///
/// The reader runs on its own thread (it is blocking file IO). It refreshes when the watched folders change
/// (debounced) and at least every [`REREAD_EVERY`]. Subscribers are only woken when the board content
/// changes; `atualizado` is still stored on every read so `GET /api/fabrica` shows it is fresh.
pub fn start_reader(
    paths: Paths,
    config: PathBuf,
) -> anyhow::Result<watch::Receiver<Arc<Fabrica>>> {
    let (trigger, triggers) = mpsc::channel::<()>();
    let mut debouncer = new_debouncer(DEBOUNCE, move |res: DebounceEventResult| {
        if let Err(e) = res {
            tracing::warn!("watcher error: {e}");
        }
        let _ = trigger.send(());
    })?;
    for dir in paths.watch_dirs() {
        match debouncer.watcher().watch(&dir, RecursiveMode::Recursive) {
            Ok(()) => tracing::info!("watching {}", dir.display()),
            Err(e) => tracing::warn!("cannot watch {}: {e}", dir.display()),
        }
    }

    let mut board = Board::new(paths, config);
    let (tx, rx) = watch::channel(Arc::new(board.refresh(chrono::Local::now())));
    std::thread::Builder::new()
        .name("fabrica-reader".into())
        .spawn(move || {
            let _debouncer = debouncer; // dropping it would stop the watcher
            loop {
                if let Err(RecvTimeoutError::Disconnected) = triggers.recv_timeout(REREAD_EVERY) {
                    return;
                }
                while triggers.try_recv().is_ok() {}
                let started = Instant::now();
                let fresh = board.refresh(chrono::Local::now());
                tx.send_if_modified(|current| {
                    let changed = !current.same_content(&fresh);
                    tracing::debug!(elapsed = ?started.elapsed(), changed, "board read");
                    *current = Arc::new(fresh);
                    changed
                });
            }
        })?;
    Ok(rx)
}

/// `/api/fabrica`, `/api/fabrica/stream` and, when `web_dist/index.html` exists, the web app with an SPA fallback.
pub fn router(board: watch::Receiver<Arc<Fabrica>>, web_dist: &Path) -> Router {
    let mut app = Router::new()
        .route("/api/fabrica", get(fabrica))
        .route("/api/fabrica/stream", get(stream))
        .with_state(board);
    let index = web_dist.join("index.html");
    if index.is_file() {
        app = app.fallback_service(ServeDir::new(web_dist).fallback(ServeFile::new(index)));
    } else {
        tracing::info!("{} not found: serving the API only", index.display());
    }
    app.layer(TraceLayer::new_for_http())
}

async fn fabrica(State(board): State<watch::Receiver<Arc<Fabrica>>>) -> impl IntoResponse {
    Json(Fabrica::clone(&board.borrow()))
}

/// The current board as the first event, then one `fabrica` event per change and a `ping` event every 15 s
/// without changes. `retry` tells EventSource to reconnect after 3 s; a reconnect gets the current board first.
async fn stream(
    State(board): State<watch::Receiver<Arc<Fabrica>>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let events = WatchStream::new(board).map(|f| {
        Ok(Event::default()
            .event("fabrica")
            .retry(RETRY)
            .json_data(&*f)
            .expect("the board always serializes"))
    });
    Sse::new(events).keep_alive(
        KeepAlive::new()
            .interval(PING_EVERY)
            .event(Event::default().event("ping").data("")),
    )
}
