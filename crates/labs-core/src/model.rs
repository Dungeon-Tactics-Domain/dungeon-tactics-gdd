//! The factory board contract shared with the web app (docs/CONTRATO-FABRICA.md).
//!
//! These types are the single source of truth: `ts-rs` turns them into TypeScript under
//! `web/src/types/generated/` (`cargo test -p labs-core export_bindings`).

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// State of a station (a Claude Code session) or of a subagent.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export)]
pub enum Estado {
    Rodando,
    Ocioso,
    Espera,
    AguardandoVoce,
    Terminado,
}

/// The whole board, as served by `GET /api/fabrica` and each `fabrica` SSE event.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Fabrica {
    /// When the sessions were last read successfully (ISO 8601 with the local offset).
    pub atualizado: String,
    /// Set when the last read failed; the rest of the board is then the last good one.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub aviso: Option<String>,
    pub estacoes: Vec<Estacao>,
    pub subagentes: Vec<Subagente>,
}

/// One Claude Code session on the board.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Estacao {
    pub id: String,
    pub nome: String,
    pub emoji: String,
    pub papel: String,
    pub estado: Estado,
    pub tarefa: String,
    /// The open `AskUserQuestion`, only when `estado` is `aguardando-voce`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub pergunta: Option<String>,
    /// The app's session id (`local_...`).
    pub sessao: String,
}

/// A subagent that is running or finished in the last 15 minutes.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Subagente {
    pub id: String,
    pub nome: String,
    pub modelo: String,
    /// Id of the station that launched it.
    pub estacao: String,
    pub estado: Estado,
    pub tarefa: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub inicio: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub fim: Option<String>,
}

impl Fabrica {
    /// Same board apart from `atualizado`, which moves on every read.
    pub fn same_content(&self, other: &Self) -> bool {
        self.aviso == other.aviso
            && self.estacoes == other.estacoes
            && self.subagentes == other.subagentes
    }
}
