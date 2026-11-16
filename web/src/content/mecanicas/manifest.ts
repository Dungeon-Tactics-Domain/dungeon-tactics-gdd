// Mechanics and game feel lab: decisions, the game live in an iframe, the rules and feel read from the game's code, and
// references from other games. Copied from dungeon-tactics-lab/mecanicas (src/main.ts and src/data); the tree is built
// from the data the same way the old montarPaginas call built it, so routes, titles and summaries match.
import type { Manifesto, PaginaManifesto } from '../types';
import { CENAS, JOGOS, qtd, REGRAS, slug } from './dados';

const GAME = 'localhost:5291';
const ICONE_CENAS: Record<string, string> = { Movimento: '🏃', Golpe: '⚔️', 'Empurrão e terreno': '🪨' };
const gruposDeCena = [...new Set(CENAS.map((s) => s.group))];

const paginasDeRegra = (lista: (typeof REGRAS)['mechanics']): PaginaManifesto[] =>
  lista.map((g) => ({
    id: g.id,
    titulo: g.titulo,
    resumo: `${qtd(g.regras.length, 'regra', 'regras')}${g.extra ? ` · ${g.extra}` : ''}.`,
  }));

export default {
  titulo: 'Mecânicas e sensação',
  resumo:
    'Dungeon Tactics: decisões, o jogo ao vivo, as regras e a sensação de hoje lidas do código, e referências de outros jogos.',
  origem: {
    caminho: '/mecanicas/',
    fonte: 'dungeon-tactics-lab/mecanicas: src/main.ts, src/data e public/mecanicas/clips',
    copiadoEm: '2026-11-14T23:38:40-03:00',
  },
  // anchors of the old single-page lab (#clipes, #grill, game and scene ids) lead to the new routes
  linksAntigos: {
    decisoes: 'decisoes',
    agora: 'decisoes/agora',
    grill: 'decisoes/grill',
    pedidos: 'decisoes/pedidos',
    fases: 'decisoes/fases',
    clipes: 'clipes',
    'ao-vivo': 'clipes',
    gravados: 'clipes/gravados',
    mecanicas: 'regras',
    divergencias: 'regras/divergencias',
    sensacao: 'sensacao',
    referencias: 'referencias',
    ...Object.fromEntries(JOGOS.map((g) => [g.slug, `referencias/${slug(g.slug)}`])),
    ...Object.fromEntries(CENAS.map((s) => [`cena-${s.name}`, `clipes/${slug(s.group)}/${s.name}`])),
  },
  grupos: [
    {
      id: 'decisoes',
      titulo: 'Decisões',
      icone: '🧭',
      resumo: 'O que está aberto, o que o grill decidiu, os pedidos e as fases.',
      paginas: [
        {
          id: 'agora',
          titulo: 'Agora estamos decidindo',
          icone: '❓',
          resumo: 'A pergunta aberta da vez, ou o próximo passo.',
        },
        {
          id: 'grill',
          titulo: 'Decisões do grill',
          icone: '🔥',
          resumo: 'O que o grill de mecânicas e sensação já decidiu.',
        },
        {
          id: 'pedidos',
          titulo: 'Pedidos',
          icone: '📋',
          resumo: 'Todo pedido do Fernando, com dono e estado; aqui os que faltam.',
          subpaginas: [
            { id: 'feitos', titulo: 'Pedidos feitos', icone: '✅', resumo: 'Os pedidos já entregues, com a prova.' },
          ],
        },
        { id: 'fases', titulo: 'Fases e portões', icone: '🚪', resumo: 'As fases do plano e o portão de cada uma.' },
      ],
    },
    {
      id: 'descida',
      titulo: 'Descida do loop',
      icone: '🕳️',
      resumo:
        'Números da descida do MVP do dungeon crawler (15/11): sala curta, inimigos e chefe, ferido e regras do mapa.',
      paginas: [
        {
          id: 'sala-curta',
          titulo: 'Sala curta',
          icone: '⏱️',
          resumo: 'Duração alvo, dano por turno e tamanho da descida.',
        },
        {
          id: 'inimigos',
          titulo: 'Inimigos e chefe',
          icone: '💀',
          resumo: '7 salas para os 3 andares e o Colosso no fim.',
        },
        { id: 'ferido', titulo: 'Ferido', icone: '🩹', resumo: 'Quem cai volta com 25% da vida.' },
        {
          id: 'mapa',
          titulo: 'Regras do mapa',
          icone: '🗺️',
          resumo: 'Tamanho, altura, água, rampas e linha de tiro da sala.',
        },
      ],
    },
    {
      id: 'equipamento',
      titulo: 'Equipamento e atributos',
      icone: '🛡️',
      resumo: 'Sem XP: fórmulas de acerto e dano, classes e inimigos x5, peças por raridade e buffs (grill de 15/11).',
      paginas: [
        {
          id: 'formulas',
          titulo: 'Fórmulas',
          icone: '🧮',
          resumo: 'Acerto com esquiva, dano com resistências, mana e stamina.',
        },
        {
          id: 'classes',
          titulo: 'Classes e inimigos',
          icone: '🧍',
          resumo: 'Vida, recursos, resistências e o custo de cada habilidade.',
        },
        { id: 'pecas', titulo: 'Peças', icone: '🗡️', resumo: '7 espaços, 3 raridades, drop e preço.' },
        { id: 'buffs', titulo: 'Buffs e consumíveis', icone: '✨', resumo: 'Habilidades, poções, altares e comida.' },
        {
          id: 'ouro',
          titulo: 'Ouro e cidade',
          icone: '🪙',
          resumo: 'Drop por monstro, loja, ferreiro, encantador e taverna.',
        },
      ],
    },
    {
      id: 'clipes',
      titulo: 'Clipes do jogo',
      icone: '🎬',
      resumo: `O jogo de verdade em ${GAME}, uma cena ao vivo por vez, e os trechos gravados.`,
      paginas: [
        ...gruposDeCena.map((g): PaginaManifesto => {
          const lista = CENAS.filter((s) => s.group === g);
          return {
            id: slug(g),
            titulo: g,
            icone: ICONE_CENAS[g],
            resumo: `${qtd(lista.length, 'cena', 'cenas')} da bancada do jogo, ao vivo e em laço.`,
            subpaginas: lista.map((s) => ({ id: s.name, titulo: s.title, resumo: s.note })),
          };
        }),
        { id: 'gravados', titulo: 'Gravados', icone: '🎞️', resumo: 'Trechos gravados do jogo (clips.json).' },
      ],
    },
    {
      id: 'regras',
      titulo: 'Regras',
      icone: '⚙️',
      resumo:
        'As regras de batalha como estão no código hoje (master 4ed1af4, 14/11), com arquivo e linha no repositório do jogo.',
      paginas: [
        {
          id: 'como-jogar',
          titulo: 'Como jogar, para quem nunca jogou',
          icone: '🎓',
          resumo: 'As regras em palavras simples, com exemplos, e onde cada bloco caberia como ajuda no jogo.',
        },
        ...paginasDeRegra(REGRAS.mechanics),
        { id: 'divergencias', titulo: 'Divergências', icone: '⚠️', resumo: 'Onde a documentação diverge do código.' },
      ],
    },
    {
      id: 'sensacao',
      titulo: 'Sensação',
      icone: '✨',
      resumo: 'Tempos, impacto, câmera, som e retorno da interface como estão hoje.',
      paginas: [
        ...paginasDeRegra(REGRAS.feel),
        {
          id: 'trajetorias',
          titulo: 'Trajetórias',
          icone: '🏹',
          resumo: 'Tiro curvo e reto, magia conjurada: protótipo em Three.js e as decisões do grill de 15/11.',
        },
      ],
    },
    {
      id: 'referencias',
      titulo: 'Referências',
      icone: '📚',
      resumo: `${JOGOS.length} fichas com fonte em cada item. Ideias e regras, nunca arte, som ou texto desses jogos. Vídeos são links com o minuto a olhar.`,
      paginas: JOGOS.map((g): PaginaManifesto => ({
        id: slug(g.slug),
        titulo: g.game,
        resumo: `${g.year ? `${g.year} · ` : ''}${g.why}`,
        subpaginas: [
          g.mechanics.length
            ? {
                id: 'mecanicas',
                titulo: 'Mecânicas',
                resumo: `${qtd(g.mechanics.length, 'ideia', 'ideias')} de regra, com fonte.`,
              }
            : null,
          g.feel.length
            ? {
                id: 'sensacao',
                titulo: 'Sensação',
                resumo: `${qtd(g.feel.length, 'ideia', 'ideias')} de sensação, com fonte.`,
              }
            : null,
          g.videos.length
            ? {
                id: 'videos',
                titulo: 'Vídeos',
                resumo: `${qtd(g.videos.length, 'vídeo', 'vídeos')}, com o minuto a olhar.`,
              }
            : null,
        ].filter((p) => p !== null),
      })),
    },
  ],
} satisfies Manifesto;
