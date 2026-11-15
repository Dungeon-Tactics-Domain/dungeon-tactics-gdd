// Design lab: decisions, references from other games, mock-ups of the directions, AI tests and pieces. Copied from
// dungeon-tactics-lab/design (src/main.ts, src/ia.ts); the tree is derived from the data with the old lab's own rules.
import type { Manifesto, PaginaManifesto } from '../types';
import {
  blocos,
  contagem,
  DIRECOES,
  dividida,
  GAMES,
  IA,
  iaSub,
  PER_PAGE,
  PLATFORM_IDS,
  screenName,
  SHORT,
} from './dados';

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

const plataformas: PaginaManifesto[] = IA.platforms.map((p, i) => ({
  id: PLATFORM_IDS[i]!,
  titulo: p.name,
  resumo: `${contagem(p.tests.length)} · ${p.plan}`,
  subpaginas: dividida(p)
    ? IA.subs
        .map(([id, titulo, resumo]) => ({
          id,
          titulo,
          resumo: `${contagem(p.tests.filter((t) => iaSub(t) === id).length)} · ${resumo}`,
        }))
        .filter((sp) => !sp.resumo.startsWith('0 '))
    : undefined,
}));

export default {
  titulo: 'Laboratório de design',
  resumo: 'Dungeon Tactics: decisões, referências de outros jogos, maquetes das direções, testes de IA e peças.',
  origem: {
    caminho: '/design/',
    fonte: 'dungeon-tactics-lab/design: src/main.ts, ia.ts, directions.ts, fft-kit.ts, rostos.ts, data/',
    copiadoEm: '2026-11-15T10:47:53-03:00',
  },
  // old anchors (#maquetes, #ia…) and the single-page anchors from before lead to the new route
  linksAntigos: {
    decisoes: 'decisoes',
    agora: 'decisoes/agora',
    fases: 'decisoes/fases',
    pedidos: 'decisoes/pedidos',
    grill: 'decisoes/as-22-decisoes',
    referencias: 'referencias',
    maquetes: 'maquetes',
    ia: 'testes-de-ia',
    pecas: 'pecas',
  },
  grupos: [
    {
      id: 'decisoes',
      titulo: 'Decisões',
      icone: '🧭',
      resumo: 'O que está aberto, as fases, os pedidos e o que o grill decidiu.',
      paginas: [
        {
          id: 'agora',
          titulo: 'Agora estamos decidindo',
          icone: '❓',
          resumo: 'A pergunta aberta da vez, ou o próximo passo.',
        },
        { id: 'fases', titulo: 'Fases e portões', icone: '🚪', resumo: 'As fases do plano e o portão de cada uma.' },
        { id: 'pedidos', titulo: 'Pedidos', icone: '📋', resumo: 'Todo pedido do Fernando, com dono e estado.' },
        { id: 'as-22-decisoes', titulo: 'As 22 decisões', icone: '🔥', resumo: 'As decisões do grill de 13/11.' },
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
          icone: '🔎',
          resumo: 'Todas as capturas, filtradas por tipo de tela e por jogo.',
        },
        ...jogos,
      ],
    },
    {
      id: 'maquetes',
      titulo: 'Maquetes',
      icone: '🎨',
      resumo: 'Amostra de estilo de cada direção, com o mesmo momento da batalha.',
      paginas: [
        ...DIRECOES.map((d) => ({ id: `direcao-${d.id}`, titulo: d.name, resumo: d.idea })),
        {
          id: 'fft-classico',
          titulo: 'FFT Clássico',
          icone: '🟦',
          resumo: 'Kit de peças com todos os estados e montagem 1920×1080.',
        },
        {
          id: 'rostos-pixel',
          titulo: 'Rostos em pixel art',
          icone: '🙂',
          resumo: 'Os 10 bonecos KayKit em uso, com 4 quadros de boca (script do jogo).',
        },
      ],
    },
    {
      id: 'testes-de-ia',
      titulo: 'Testes de IA',
      icone: '🤖',
      resumo: 'Geradores de imagem testados em 14/11, com o prompt de cada imagem.',
      paginas: [
        // the image Fernando picked (14/11) comes before the rest
        {
          id: 'destaque-fft-classico',
          titulo: 'Destaque: FFT Clássico',
          resumo: 'A vibe que o Fernando curtiu: base para a direção do jogo.',
        },
        ...plataformas,
        { id: 'sem-imagem', titulo: 'Ainda sem imagem', resumo: 'Plataformas que faltam testar e por quê.' },
      ],
    },
    {
      id: 'pecas',
      titulo: 'Peças',
      icone: '🧩',
      resumo: 'Tokens e peças com todos os estados.',
      paginas: [{ id: 'em-breve', titulo: 'Em breve', resumo: 'Entra depois da direção escolhida.' }],
    },
  ],
} satisfies Manifesto;
