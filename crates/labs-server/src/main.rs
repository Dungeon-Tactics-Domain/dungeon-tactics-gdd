use std::net::{IpAddr, SocketAddr};
use std::path::PathBuf;

use anyhow::Context;
use clap::Parser;
use labs_core::Paths;
use labs_core::config::{Config, DECISOES_PADRAO};
use tracing_subscriber::EnvFilter;

/// Serves the Dungeon Tactics labs: the live factory board (`/api/fabrica`, SSE at `/api/fabrica/stream`),
/// the per-asset decisions (`/api/decisoes`) and the built web app.
#[derive(Parser)]
#[command(version)]
struct Args {
    /// Port to listen on (5190 is the one the current lab uses).
    #[arg(long, env = "LABS_PORT", default_value_t = 5190)]
    port: u16,
    /// Address to bind; the board is private, so only this PC by default.
    #[arg(long, env = "LABS_HOST", default_value = "127.0.0.1")]
    host: IpAddr,
    /// Board configuration (TOML): which sessions are stations, with id, emoji and role.
    #[arg(long, env = "LABS_CONFIG", default_value = "config/fabrica.toml")]
    config: PathBuf,
    /// The desktop app's data folder [default: %LOCALAPPDATA%\Claude-Data].
    #[arg(long, env = "LABS_CLAUDE_DATA")]
    claude_data: Option<PathBuf>,
    /// Claude Code transcripts [default: ~/.claude/projects].
    #[arg(long, env = "LABS_CLAUDE_PROJECTS")]
    claude_projects: Option<PathBuf>,
    /// Built web app, served with an index.html fallback when present.
    #[arg(long, env = "LABS_WEB_DIST", default_value = "web/dist")]
    web_dist: PathBuf,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")),
        )
        .init();
    let args = Args::parse();

    let home = std::env::home_dir().context("no home folder")?;
    let data_dir = match args.claude_data {
        Some(d) => d,
        None => std::env::var_os("LOCALAPPDATA")
            .map_or_else(|| home.join("AppData").join("Local"), PathBuf::from)
            .join("Claude-Data"),
    };
    let paths = Paths {
        data_dir,
        projects_dir: args
            .claude_projects
            .unwrap_or_else(|| home.join(".claude").join("projects")),
    };
    tracing::info!(?paths, config = %args.config.display(), "reading sessions");

    // the decisions file is read from the config once; a missing or broken config falls back to the default
    let decisoes = Config::load(&args.config)
        .map(|c| c.decisoes)
        .unwrap_or_else(|_| DECISOES_PADRAO.into());
    tracing::info!(decisoes = %decisoes.display(), "decisions file");

    let board = labs_server::start_reader(paths, args.config)?;
    let app = labs_server::router(board, &args.web_dist, decisoes);
    let addr = SocketAddr::new(args.host, args.port);
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .with_context(|| format!("cannot listen on {addr}"))?;
    tracing::info!("listening on http://{addr}");
    // no graceful shutdown: open SSE streams never end, so Ctrl+C just stops the process
    axum::serve(listener, app).await?;
    Ok(())
}
