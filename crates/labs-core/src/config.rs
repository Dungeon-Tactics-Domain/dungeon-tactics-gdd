//! Which sessions make up the factory, read from a TOML file (`config/fabrica.toml`).

use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::Error;

/// The board configuration. Re-read on every refresh, so edits need no restart.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    /// Sidebar group whose sessions join the board (e.g. "⚔️ Dungeon Tactics").
    #[serde(default)]
    pub grupo: String,
    /// Sessions whose folder starts with one of these (case-insensitive) join the board.
    #[serde(default)]
    pub pastas: Vec<String>,
    /// Unlisted sessions only show while active within this many hours.
    #[serde(default = "default_hours")]
    pub horas_sessao_nova: f64,
    /// Known sessions, always shown, in this order.
    #[serde(default)]
    pub sessoes: Vec<SessaoConhecida>,
}

/// A session with a fixed place on the board.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SessaoConhecida {
    /// The app's session id (`local_...`).
    pub sessao: String,
    pub id: String,
    pub nome: Option<String>,
    pub emoji: Option<String>,
    pub papel: Option<String>,
    /// Manual "waiting for ..." note; only shown when the session is neither running nor asking.
    pub espera: Option<String>,
}

fn default_hours() -> f64 {
    24.0
}

impl Config {
    pub fn load(path: &Path) -> Result<Self, Error> {
        let text = std::fs::read_to_string(path).map_err(|source| Error::ConfigRead {
            path: path.to_path_buf(),
            source,
        })?;
        Self::parse(&text).map_err(|source| Error::ConfigParse {
            path: PathBuf::from(path),
            source,
        })
    }

    pub fn parse(text: &str) -> Result<Self, toml::de::Error> {
        toml::from_str(text)
    }

    pub(crate) fn known(&self, session_id: &str) -> Option<(usize, &SessaoConhecida)> {
        self.sessoes
            .iter()
            .enumerate()
            .find(|(_, s)| s.sessao == session_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_known_sessions_in_order() {
        let cfg = Config::parse(
            r#"
            grupo = "⚔️ Dungeon Tactics"
            pastas = ['D:\Projetos\dungeon-tactics']

            [[sessoes]]
            sessao = "local_b"
            id = "impl"
            emoji = "🧭"

            [[sessoes]]
            sessao = "local_a"
            id = "labs"
            espera = "esperando"
            "#,
        )
        .unwrap();
        assert_eq!(cfg.horas_sessao_nova, 24.0);
        assert_eq!(cfg.pastas, [r"D:\Projetos\dungeon-tactics"]);
        assert_eq!(
            cfg.known("local_a").map(|(i, s)| (i, s.id.as_str())),
            Some((1, "labs"))
        );
        assert!(cfg.known("local_c").is_none());
    }

    #[test]
    fn rejects_unknown_fields() {
        assert!(Config::parse("grupoo = \"x\"").is_err());
    }
}
