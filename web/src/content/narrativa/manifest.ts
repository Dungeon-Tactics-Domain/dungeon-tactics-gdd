// Narrative lab: decisions and the loop of each reference game. The reference sheets (games, anime and books), the
// moodboard, the marks and the plan pages (agora, fases, pedidos, grill) were removed on 17/11 at Fernando's request;
// the per-game loop pages come from dados.ts.
import type { Manifesto, PaginaManifesto } from '../types';
import { type Game, JOGOS, TIPOS, tipoDe } from './dados';

// menu titles up to ~28 characters; the full name and year go in the summary
const curto = (n: string) =>
  n.length <= 28 ? n : n.includes(':') ? n.split(':')[0]! : (n.match(/\(([^)]+)\)$/)?.[1] ?? n);

const porTipo = (pagina: (g: Game) => PaginaManifesto): PaginaManifesto[] =>
  [
    ...TIPOS.map((t) => ({ ...t, jogos: JOGOS.filter((g) => t.slugs.includes(g.slug)) })),
    {
      id: 'outros',
      nome: 'Outros',
      resumo: 'Jogos fora das divisões acima.',
      jogos: JOGOS.filter((g) => tipoDe(g.slug) === 'outros'),
    },
  ]
    .filter((t) => t.jogos.length)
    .map((t) => ({ id: t.id, titulo: t.nome, resumo: t.resumo, subpaginas: t.jogos.map(pagina) }));

const jogo = (g: Game): PaginaManifesto => ({ id: g.slug, titulo: curto(g.game), resumo: `${g.game} (${g.year})` });

// old in-page links (#loop-slug, #decisoes...) still open the right page; routes of the removed sheets
// (/jogos, /animes, /moodboard, /marcas, /decisoes/agora...) fall to the lab home with the usual notice
const linksAntigos: Record<string, string> = {
  decisoes: 'decisoes',
  loops: 'loops/nosso-loop',
  ...Object.fromEntries(JOGOS.map((g) => [`loop-${g.slug}`, `loops/${tipoDe(g.slug)}/${g.slug}`])),
};

export default {
  titulo: 'Laboratório de narrativa',
  resumo: 'Decisões da história e o loop de cada jogo de referência do Dungeon Tactics.',
  origem: {
    caminho: '/narrativa/',
    fonte: 'dungeon-tactics-lab/narrativa: src/main.ts e src/data (plan.ts, refs, obras)',
    copiadoEm: '2026-11-14T23:39:31-03:00',
  },
  linksAntigos,
  grupos: [
    {
      id: 'decisoes',
      titulo: 'Decisões',
      icone: '🧭',
      resumo: 'O loop de dungeon crawler e a cidade.',
      paginas: [
        {
          id: 'loop-crawler',
          titulo: 'Loop de dungeon crawler',
          icone: '🏰',
          resumo: 'As 10 decisões do grill de 15/11, as fases e o que falta decidir.',
        },
        {
          id: 'cidade',
          titulo: 'A cidade e a pena',
          icone: '🏘️',
          resumo: 'Rascunho de 15/11: a vila, a pena do prisioneiro, os moradores e os primeiros textos, para aprovar.',
        },
        {
          id: 'mapa-cidade',
          titulo: 'Mapa da cidade (layout)',
          icone: '🏘️',
          resumo: 'Zonas, níveis, escadas, rampas, praia e porto; onde fica cada instalação e morador; referências.',
        },
        {
          id: 'lugares',
          titulo: 'Lugares da cidade',
          icone: '🗺️',
          resumo: 'Brief para o mapa: instalações, moradores, o que se faz em cada lugar e a circulação.',
        },
      ],
    },
    {
      id: 'loops',
      titulo: 'Loops',
      icone: '🔁',
      resumo: 'Cada jogo nas 4 camadas: batalha, expedição, base e arco.',
      paginas: [
        { id: 'nosso-loop', titulo: 'Nosso loop', icone: '🎯', resumo: 'O loop do Dungeon Tactics hoje.' },
        ...porTipo(jogo),
      ],
    },
  ],
} satisfies Manifesto;
