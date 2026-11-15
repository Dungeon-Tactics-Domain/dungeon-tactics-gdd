//! Fernando's decision per asset (a track, a 3D piece, a mock-up), kept in one JSON file (`data/decisoes.json`)
//! that the platform writes and Claude sessions read.
//!
//! The file is a JSON object keyed by asset id, sorted, indented: stable diffs and easy to read by hand.

use std::collections::BTreeMap;
use std::path::Path;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// The note is a short comment, not a document; the cap keeps the file small and the page readable.
pub const NOTA_MAX: usize = 2000;
const ID_MAX: usize = 200;
const LAB_MAX: usize = 40;

/// What to do with an asset.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export)]
pub enum Escolha {
    Usar,
    Descartar,
    Refazer,
    Talvez,
}

/// One decision, as served by `GET /api/decisoes` and stored in `data/decisoes.json`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct Decisao {
    /// Stable asset id, `<lab>/<path>` (e.g. `musica/batalha-c`, `modelos/carrocas-high/D`).
    pub id: String,
    pub lab: String,
    pub escolha: Escolha,
    /// Free text, may be empty.
    pub nota: String,
    /// When the server saved it (ISO 8601 with the local offset).
    pub atualizado_em: String,
}

/// Why a decision or the file was refused. The text reaches the page, so it is in Portuguese.
#[derive(Debug, thiserror::Error)]
pub enum ErroDecisao {
    #[error(
        "id inválido: use <lab>/<nome>, só letras, números, ponto, _ e -, até {ID_MAX} caracteres"
    )]
    Id,
    #[error("lab inválido: o id precisa começar pelo lab")]
    Lab,
    #[error("nota longa demais (máximo {NOTA_MAX} caracteres)")]
    Nota,
    #[error("não consegui ler ou gravar as decisões: {0}")]
    Io(#[from] std::io::Error),
    #[error("arquivo de decisões corrompido, nada foi gravado: {0}")]
    Json(#[from] serde_json::Error),
}

fn segmento(s: &str) -> bool {
    !s.is_empty()
        && s != "."
        && s != ".."
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.'))
}

impl Decisao {
    /// Validates a decision coming from the page (a trust boundary: the server listens on the LAN).
    pub fn nova(
        id: &str,
        lab: &str,
        escolha: Escolha,
        nota: &str,
        agora: String,
    ) -> Result<Self, ErroDecisao> {
        let partes: Vec<&str> = id.split('/').collect();
        if id.len() > ID_MAX || partes.len() < 2 || !partes.iter().all(|p| segmento(p)) {
            return Err(ErroDecisao::Id);
        }
        if lab.len() > LAB_MAX || partes[0] != lab {
            return Err(ErroDecisao::Lab);
        }
        if nota.chars().count() > NOTA_MAX {
            return Err(ErroDecisao::Nota);
        }
        Ok(Self {
            id: id.into(),
            lab: lab.into(),
            escolha,
            nota: nota.trim().into(),
            atualizado_em: agora,
        })
    }
}

/// All decisions in the file, sorted by id. A missing file is an empty list; a broken one is an error.
pub fn ler(path: &Path) -> Result<Vec<Decisao>, ErroDecisao> {
    Ok(ler_mapa(path)?.into_values().collect())
}

fn ler_mapa(path: &Path) -> Result<BTreeMap<String, Decisao>, ErroDecisao> {
    match std::fs::read_to_string(path) {
        Ok(text) => Ok(serde_json::from_str(&text)?),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(BTreeMap::new()),
        Err(e) => Err(e.into()),
    }
}

/// Inserts or replaces one decision. Writes a temporary file next to the real one and renames it, so a crash
/// never leaves a half-written file. The caller serializes calls (one writer at a time).
pub fn gravar(path: &Path, decisao: Decisao) -> Result<(), ErroDecisao> {
    let mut todas = ler_mapa(path)?;
    todas.insert(decisao.id.clone(), decisao);
    if let Some(pasta) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        std::fs::create_dir_all(pasta)?;
    }
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, serde_json::to_string_pretty(&todas)? + "\n")?;
    std::fs::rename(&tmp, path)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn d(id: &str, escolha: Escolha, nota: &str) -> Decisao {
        let lab = id.split('/').next().unwrap();
        Decisao::nova(id, lab, escolha, nota, "2026-11-15T10:00:00-03:00".into()).unwrap()
    }

    #[test]
    fn writes_reads_and_replaces() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("data/decisoes.json");
        assert!(ler(&path).unwrap().is_empty(), "missing file is empty");

        gravar(&path, d("musica/batalha-c", Escolha::Usar, " gostei ")).unwrap();
        gravar(&path, d("modelos/carrocas-high/D", Escolha::Refazer, "")).unwrap();
        gravar(&path, d("musica/batalha-c", Escolha::Talvez, "na dúvida")).unwrap();

        let todas = ler(&path).unwrap();
        assert_eq!(
            todas
                .iter()
                .map(|x| (x.id.as_str(), x.escolha, x.nota.as_str()))
                .collect::<Vec<_>>(),
            [
                ("modelos/carrocas-high/D", Escolha::Refazer, ""),
                ("musica/batalha-c", Escolha::Talvez, "na dúvida"),
            ]
        );
        assert!(!path.with_extension("json.tmp").exists());
        let text = std::fs::read_to_string(&path).unwrap();
        assert!(
            text.contains(r#""atualizadoEm": "2026-11-15T10:00:00-03:00""#),
            "{text}"
        );
        assert!(text.contains(r#""escolha": "talvez""#), "{text}");
    }

    #[test]
    fn a_broken_file_is_an_error_and_stays_untouched() {
        let dir = tempfile::TempDir::new().unwrap();
        let path = dir.path().join("decisoes.json");
        std::fs::write(&path, "{ quebrado").unwrap();
        assert!(matches!(ler(&path), Err(ErroDecisao::Json(_))));
        assert!(gravar(&path, d("musica/a", Escolha::Usar, "")).is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "{ quebrado");
    }

    #[test]
    fn validates_id_lab_and_note() {
        let ok = |id: &str, lab: &str, nota: &str| {
            Decisao::nova(id, lab, Escolha::Usar, nota, String::new()).is_ok()
        };
        assert!(ok("musica/batalha-c", "musica", ""));
        assert!(ok("modelos/carrocas-low/6", "modelos", ""));
        assert!(ok("design/maquete_v2.1", "design", ""));
        for id in [
            "musica",
            "musica/",
            "/musica/a",
            "musica//a",
            "musica/../x",
            "musica/a b",
            "musica/á",
            r"musica\a",
        ] {
            assert!(!ok(id, "musica", ""), "{id}");
        }
        assert!(!ok(&format!("musica/{}", "a".repeat(ID_MAX)), "musica", ""));
        assert!(!ok("musica/a", "modelos", ""), "id must start with the lab");
        assert!(ok("musica/a", "musica", &"é".repeat(NOTA_MAX)));
        assert!(!ok("musica/a", "musica", &"é".repeat(NOTA_MAX + 1)));
    }
}
