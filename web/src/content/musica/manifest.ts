// Music lab: battle and pastoral evals, copied from dungeon-tactics-lab/musica (src/main.ts, data/*.json). Each old
// page (#/batalha, #/pastoral) is a group and each old anchor (referencias, a track id, checagens) a page with the same
// id, so old links like #/batalha/batalha-c land on the same content.
import { itensDe } from './components/Musica';
import type { GrupoManifesto, Manifesto } from '../types';

// one studio with a list of every piece (search, category, order); the references and checks of the two old data pages
// stay as pages beside it
const grupos: GrupoManifesto[] = [
  {
    id: 'estudio',
    titulo: 'Estúdio',
    resumo: `${itensDe('cidade').length + itensDe('batalha').length + itensDe('jingles').length} músicas num só estúdio, com lista, busca e filtro por categoria.`,
    paginas: [
      { id: 'musicas', titulo: 'Músicas' },
      { id: 'referencias-cidade', titulo: 'Referências da cidade' },
      { id: 'referencias-batalha', titulo: 'Referências da batalha' },
      { id: 'checagens-cidade', titulo: 'Checagens da cidade' },
      { id: 'checagens-batalha', titulo: 'Checagens da batalha' },
    ],
  },
];

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
