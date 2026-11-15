//! Core of the Dungeon Tactics labs: the factory board contract and the reader that builds it from the
//! Claude Code desktop app's session files.
//!
//! ```no_run
//! use labs_core::{Board, Paths};
//!
//! let paths = Paths { data_dir: "C:/Users/me/AppData/Local/Claude-Data".into(), projects_dir: "C:/Users/me/.claude/projects".into() };
//! let mut board = Board::new(paths, "config/fabrica.toml".into());
//! let fabrica = board.refresh(chrono::Local::now());
//! println!("{}", serde_json::to_string_pretty(&fabrica).unwrap());
//! ```

use std::path::PathBuf;

pub mod config;
pub mod decisoes;
pub mod model;
mod reader;

pub use config::{Config, SessaoConhecida};
pub use decisoes::{Decisao, ErroDecisao, Escolha};
pub use model::{Estacao, Estado, Fabrica, Subagente};
pub use reader::{Board, Paths, iso};

/// Why a read produced no board. The text ends up in `Fabrica::aviso`, which the page shows, so it is in
/// Portuguese like the rest of the page.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("não consegui ler a configuração {path}: {source}")]
    ConfigRead {
        path: PathBuf,
        source: std::io::Error,
    },
    #[error("configuração inválida em {path}: {source}")]
    ConfigParse {
        path: PathBuf,
        source: toml::de::Error,
    },
    #[error("nenhum JSON de sessão em {0}")]
    NoSessionFiles(PathBuf),
    #[error("{0} JSONs de sessão sem sessionId/lastActivityAt: formato do app mudou?")]
    NoValidSessions(usize),
    #[error("nenhuma sessão do projeto encontrada")]
    NoProjectSessions,
    #[error("nenhum transcript achado em {0}: formato do app mudou?")]
    NoTranscripts(PathBuf),
}
