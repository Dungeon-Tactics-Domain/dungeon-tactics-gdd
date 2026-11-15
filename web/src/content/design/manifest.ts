// Design lab: the old lab's tabs (design/src/main.ts, 15/11) as groups and their sections as pages, with the same ids, so
// the old routes (#/interface/testes, #/personagens/em-uso...) open the same page. The tree of the games is derived from the
// data with the old lab's own rules; the AI tests are listed by subject (the old "por assunto" pages).
import type { Manifesto, PaginaManifesto } from '../types';
import { blocos, GAMES, PER_PAGE, screenName, SHORT } from './dados';

const jogos: PaginaManifesto[] = GAMES.map((g) => ({
  id: g.slug,
  titulo: SHORT[g.slug] ?? g.game,
  resumo: `${g.shots.length} capturas · ${g.year}`,
  subpaginas: blocos(g).map((c, i) => ({
    id: `capturas-${i + 1}`,
    titulo: `Capturas ${i * PER_PAGE + 1} a ${i * PER_PAGE + c.length}`,
    resumo: [...new Set(c.map((s) => screenName(s.screen)))].join(', '),
  })),
}));

export default {
  titulo: 'Laboratório de design',
  resumo: 'Dungeon Tactics: o que o jogo usa agora, interface, personagens, mapa, plano e referências de outros jogos.',
  origem: {
    caminho: '/design/',
    fonte:
      'dungeon-tactics-lab/design: src/main.ts, ia.ts, inicio.ts, icones.ts, expressoes.ts, pixelizar.ts, fft-kit.ts, rostos.ts, data/',
    copiadoEm: '2026-11-15T14:14:11-03:00',
  },
  // old anchors (#maquetes, #ia…) and the old lab's tab-system map lead to the new route; "#/tab/section" routes work as they are
  linksAntigos: {
    agora: '',
    fases: 'plano/fases',
    pedidos: 'plano/pedidos',
    grill: 'plano/decisoes',
    decisoes: 'plano',
    'direcao-fft': 'interface',
    maquetes: 'interface/alternativas',
    pecas: 'personagens',
    'testes-de-ia': 'interface/testes',
    ia: 'interface/testes',
    referencias: 'referencias',
  },
  grupos: [
    {
      id: 'interface',
      titulo: 'Interface',
      icone: '🟦',
      resumo: 'O estilo FFT Clássico escolhido, os ícones e as alternativas testadas.',
      paginas: [
        {
          id: 'em-uso',
          titulo: 'Em uso: kit FFT Clássico',
          resumo: 'Kit de peças com todos os estados e montagem 1920×1080.',
        },
        {
          id: 'icones',
          titulo: 'Em uso: ícones 32 px',
          resumo: 'Atlas de 32 px dos ícones de habilidade, em 1x, 2x e 4x.',
        },
        {
          id: 'alternativas',
          titulo: 'Alternativas A, B e C',
          resumo: 'Direções de estilo preteridas, com o mesmo momento da batalha.',
        },
        {
          id: 'testes',
          titulo: 'Testes de IA: interface',
          resumo: 'Folhas de elementos e a interface aplicada sobre o jogo.',
        },
      ],
    },
    {
      id: 'personagens',
      titulo: 'Personagens',
      icone: '🙂',
      resumo: 'Rostos falando e sprites dos 10 bonecos.',
      paginas: [
        {
          id: 'em-uso',
          titulo: 'Em uso: rostos',
          resumo: 'Os 10 bonecos KayKit em pixel art, com 4 quadros de boca; 4 falam.',
        },
        {
          id: 'expressoes',
          titulo: 'Bancada de expressões (IA)',
          resumo: 'Rostos de IA em vários momentos: falando, dano, ataque, ferido, vitória.',
        },
        {
          id: 'pixelizar',
          titulo: 'Pixelizadores locais (teste)',
          resumo:
            'Ferramentas que rodam no PC e transformam o pixel art falso da IA em pixel art de grade real; a fala anima em cada uma.',
        },
        { id: 'testes', titulo: 'Testes de IA: rostos', resumo: 'Retratos por plataforma e por estilo.' },
        {
          id: 'sprites',
          titulo: 'Testes de IA: sprites',
          resumo: 'Bonecos andando e atacando (prova de conceito).',
        },
      ],
    },
    {
      id: 'mapa',
      titulo: 'Mapa',
      icone: '🗺️',
      resumo: 'Cenas e terreno.',
      paginas: [
        {
          id: 'testes',
          titulo: 'Testes de IA: cenas e terreno',
          resumo: 'Ainda sem peça aprovada para o mapa.',
        },
      ],
    },
    {
      id: 'plano',
      titulo: 'Plano',
      icone: '📋',
      resumo: 'Plano do tema, fases, pedidos e decisões.',
      paginas: [
        {
          id: 'tema',
          titulo: 'Plano do tema FFT',
          resumo: 'As decisões do grill de 15/11 sobre levar o tema ao jogo.',
        },
        { id: 'fases', titulo: 'Fases e portões', resumo: 'As fases do plano e o portão de cada uma.' },
        { id: 'pedidos', titulo: 'Pedidos', resumo: 'Todo pedido do Fernando, com dono e estado.' },
        { id: 'decisoes', titulo: 'As 22 decisões', resumo: 'As decisões do grill de 13/11.' },
        {
          id: 'plataformas',
          titulo: 'Plataformas de IA',
          resumo: 'Limites e contas de cada gerador; as imagens ficam nas páginas, por assunto.',
        },
      ],
    },
    {
      id: 'referencias',
      titulo: 'Referências',
      icone: '📚',
      resumo: `Capturas de ${GAMES.length} jogos de tática, só neste PC.`,
      paginas: [
        {
          id: 'visao-geral',
          titulo: 'Visão geral e filtro',
          resumo: 'Todas as capturas, filtradas por tipo de tela e por jogo.',
        },
        ...jogos,
      ],
    },
  ],
} satisfies Manifesto;
