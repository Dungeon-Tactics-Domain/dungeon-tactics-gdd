// Music lab: battle and pastoral evals, copied from dungeon-tactics-lab/musica (src/main.ts, data/*.json). Each old
// page (#/batalha, #/pastoral) is a group and each old anchor (referencias, a track id, checagens) a page with the same
// id, so old links like #/batalha/batalha-c land on the same content.
import { itensDe, PAGINAS } from './components/Musica';
import type { GrupoManifesto, Manifesto } from '../types';

// three pages by style, each one studio with a Música menu (the old per-track pages were merged into it); the pastoral and
// battle pages also keep the references of their original data page and its checks
const ESTILO_DADOS = { cidade: 'pastoral', batalha: 'batalha', jingles: 'jingles' } as const;
const TITULOS = { cidade: 'Cidade', batalha: 'Batalha', jingles: 'Jingles' } as const;
const grupos: GrupoManifesto[] = (Object.keys(ESTILO_DADOS) as (keyof typeof ESTILO_DADOS)[]).map((id) => {
  const p = PAGINAS[ESTILO_DADOS[id]];
  const itens = itensDe(id);
  const comRefs = id !== 'jingles';
  return {
    id,
    titulo: TITULOS[id],
    resumo: `${p.descricao ?? ''} · ${itens.length} músicas num só estúdio`,
    paginas: [
      { id: 'estudio', titulo: 'Estúdio' },
      ...(comRefs
        ? [
            { id: 'referencias', titulo: 'Referências' },
            { id: 'checagens', titulo: 'Checagens' },
          ]
        : []),
    ],
  };
});

export default {
  titulo: 'Laboratório de música PSX',
  resumo:
    'Trilha no estilo de Final Fantasy Tactics e Breath of Fire IV. A sessão ⚔🎵 Lab · Música PSX preenche estas páginas.',
  origem: {
    caminho: '/musica/',
    fonte: 'dungeon-tactics-lab/musica: src/main.ts, data/batalha.json, data/pastoral.json e audio/',
    copiadoEm: '2026-11-14T23:39:17-03:00',
  },
  grupos,
} satisfies Manifesto;
