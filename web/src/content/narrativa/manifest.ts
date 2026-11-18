// Narrative lab: the decisions about the dungeon crawler loop and the town. The reference sheets (games, anime and
// books), the moodboard, the marks and the plan pages (agora, fases, pedidos, grill) were removed on 17/11 at Fernando's
// request; the per-game loop pages ("Loops") and the walkable town draft ("Mapa") left on 18/11.
import type { Manifesto } from '../types';

// old in-page links (#decisoes) still open the right page; routes of the removed pages (/jogos, /moodboard, /marcas,
// /loops/..., /mapa/cidade...) fall to the lab home with the usual notice
const linksAntigos: Record<string, string> = { decisoes: 'decisoes' };

export default {
  titulo: 'Laboratório de narrativa',
  resumo: 'Decisões da história, do loop de dungeon crawler e da cidade do Dungeon Tactics.',
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
  ],
} satisfies Manifesto;
