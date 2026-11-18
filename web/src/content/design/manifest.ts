// Design lab: the old lab's tabs (design/src/main.ts, 15/11) as groups and their sections as pages, with the same ids, so
// the old routes (#/interface/em-uso, #/personagens/em-uso...) open the same page. The tree of the games is derived from the
// data with the old lab's own rules. The AI test pages were archived on 17/11 in docs/arquivo-assets-ia.
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
  resumo: 'Dungeon Tactics: o que o jogo usa agora, interface, personagens e referências de outros jogos.',
  origem: {
    caminho: '/design/',
    fonte:
      'dungeon-tactics-lab/design: src/main.ts, ia.ts, inicio.ts, icones.ts, expressoes.ts, pixelizar.ts, fft-kit.ts, rostos.ts, data/',
    copiadoEm: '2026-11-15T14:14:11-03:00',
  },
  // old anchors (#maquetes, #ia…) and the old lab's tab-system map lead to the new route; "#/tab/section" routes work as they are
  linksAntigos: {
    'interface/hud-3d': 'interface/fft-3d',
    'interface/menu-3d': 'interface/fft-3d',
    agora: '',
    'direcao-fft': 'interface',
    maquetes: 'interface',
    pecas: 'personagens',
    'testes-de-ia': 'interface',
    ia: 'interface',
    referencias: 'referencias',
  },
  grupos: [
    {
      id: 'interface',
      titulo: 'Interface',
      icone: '🟦',
      resumo: 'O estilo FFT Clássico escolhido e os ícones.',
      paginas: [
        {
          id: 'fft-3d',
          titulo: 'Interface FFT em 3D',
          icone: '⭐',
          destaque: 'Em andamento',
          resumo:
            'A interface completa do Final Fantasy Tactics: The Ivalice Chronicles em 3D no jogo: barra de combate, menu de ações e fila de turnos, para montar peça por peça.',
        },
        {
          id: 'vozes',
          titulo: 'Vozes dos personagens (teste de dublagem)',
          resumo:
            '20 falas em inglês dubladas por Qwen3-TTS e Maya1, lado a lado, com espaço para os modelos de nuvem.',
        },
        {
          id: 'marcacoes',
          titulo: 'Marcações do chão em 3D (4 estilos)',
          resumo: 'Casas, cursor e círculos do mapa em Simples, Luz, Pedra e Neon: capturas lado a lado e o jogo ao vivo.',
        },
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
          id: 'redesign-responsivo',
          titulo: 'Redesign responsivo (maquetes)',
          resumo: 'Navegação, 3 painéis no ultrawide, página densa e tipografia, do celular ao ultrawide.',
        },
        {
          id: 'ouro-e-couro',
          titulo: 'Ouro e couro (tokens do lab)',
          resumo:
            'Paleta medida na referência, tokens com contraste calculado, exemplos vivos e o bloco pronto para colar.',
        },
        {
          id: 'decisoes-de-gosto',
          titulo: 'Decisões de gosto: escolha olhando',
          resumo:
            'As 10 decisões de gosto pendentes da interface, com as opções desenhadas lado a lado em 3440×1440 e 390×844.',
        },
      ],
    },
    {
      id: 'personagens',
      titulo: 'Personagens',
      icone: '🙂',
      resumo: 'Rostos falando dos 10 bonecos.',
      paginas: [
        {
          id: 'em-uso',
          titulo: 'Em uso: rostos',
          resumo: 'Os 10 bonecos KayKit em pixel art: 7 com folha oficial de 8 expressões, 3 esqueletos parados.',
        },
        {
          id: 'expressoes',
          titulo: 'Bancada de expressões (IA)',
          resumo: 'Rostos de IA em vários momentos: falando, dano, ataque, ferido, vitória.',
        },
      ],
    },
    {
      id: 'referencias',
      titulo: 'Referências',
      icone: '📚',
      resumo: 'Capturas do Final Fantasy Tactics: The Ivalice Chronicles, só neste PC.',
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
