// Music lab: battle and pastoral evals, copied from dungeon-tactics-lab/musica (src/main.ts, data/*.json). Each old
// page (#/batalha, #/pastoral) is a group and each old anchor (referencias, a track id, checagens) a page with the same
// id, so old links like #/batalha/batalha-c land on the same content.
import { faixasDe, PAGINAS } from './components/Musica';
import type { GrupoManifesto, Manifesto } from '../types';

// the TFG versions' full titles do not fit one menu line; the page keeps the full title in its heading
const curto = (titulo: string) => titulo.replace(' com a soundfont Tactical Fantasy Guy', ' (TFG)');

const grupos: GrupoManifesto[] = Object.entries(PAGINAS).map(([id, p]) => {
  const faixas = faixasDe(p);
  const refs = p.referencias ?? [];
  const pendentes = (p.checagens ?? []).filter((c) => c.estado !== 'feito').length;
  // same card text as the old index: the description, else the references
  const texto =
    p.descricao ??
    (refs.length ? `Referência${refs.length > 1 ? 's' : ''}: ${refs.map((r) => r.rotulo).join('; ')}` : '');
  return {
    id,
    titulo: p.titulo ?? id[0]!.toUpperCase() + id.slice(1),
    resumo: `${texto} · ${faixas.length} faixas · ${pendentes} checagens pendentes`,
    paginas: [
      { id: 'referencias', titulo: 'Referências' },
      ...faixas.map((t) => ({ id: t.id, titulo: curto(t.titulo) })),
      { id: 'checagens', titulo: 'Checagens' },
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
