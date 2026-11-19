// Mechanics and game feel lab: decisions and the rules and feel read from the game's code (the reference sheets of
// other games left on 17/11). Copied from dungeon-tactics-lab/mecanicas (src/main.ts and src/data); the tree is built
// from the data the same way the old montarPaginas call built it, so routes, titles and summaries match.
import type { Manifesto, PaginaManifesto } from '../types';
import { qtd, REGRAS } from './dados';

const paginasDeRegra = (lista: (typeof REGRAS)['mechanics']): PaginaManifesto[] =>
  lista.map((g) => ({
    id: g.id,
    titulo: g.titulo,
    resumo: `${qtd(g.regras.length, 'regra', 'regras')}${g.extra ? ` · ${g.extra}` : ''}.`,
  }));

export default {
  titulo: 'Mecânicas e sensação',
  resumo: 'Dungeon Tactics: decisões e as regras e a sensação de hoje lidas do código.',
  origem: {
    caminho: '/mecanicas/',
    fonte: 'dungeon-tactics-lab/mecanicas: src/main.ts e src/data',
    copiadoEm: '2026-11-14T23:38:40-03:00',
  },
  // anchors of the old single-page lab (#grill...) lead to the new routes; the game clips and reference sheets left on 17/11
  linksAntigos: {
    decisoes: 'decisoes',
    agora: 'decisoes/agora',
    grill: 'decisoes/grill',
    pedidos: 'decisoes/pedidos',
    fases: 'decisoes/fases',
    mecanicas: 'regras',
    divergencias: 'regras/divergencias',
    sensacao: 'sensacao',
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
        {
          id: 'itens-e-equipamento',
          titulo: 'Itens e equipamento',
          icone: '🎒',
          resumo: 'As peças que o jogo tem hoje, com preço e atributos, e as que só o lab propõe.',
        },
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
        {
          id: 'fichas-de-classes-e-inimigos',
          titulo: 'Fichas de classes e inimigos',
          icone: '🃏',
          resumo: 'Uma ficha por classe e inimigo: papel, alcance, forças, fraquezas e como enfrentar, gerada do jogo.',
        },
        {
          id: 'habilidades',
          titulo: 'Habilidades',
          icone: '✴️',
          resumo: 'Uma ficha por habilidade: alcance, dano, área, carga, elemento e quem usa, gerada do jogo.',
        },
        ...paginasDeRegra(REGRAS.mechanics),
        { id: 'divergencias', titulo: 'Divergências', icone: '⚠️', resumo: 'Onde a documentação diverge do código.' },
      ],
    },
    {
      id: 'sensacao',
      titulo: 'Sensação',
      icone: '✨',
      resumo: 'Tempos, câmera, som e retorno da interface como estão hoje.',
      paginas: [...paginasDeRegra(REGRAS.feel)],
    },
  ],
} satisfies Manifesto;
