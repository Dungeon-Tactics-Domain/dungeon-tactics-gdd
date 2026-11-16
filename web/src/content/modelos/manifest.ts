// Models lab: the 3D bench viewer, styles and evals. Copied from dungeon-tactics-lab/modelos (index.html, src/main.ts).
import type { Manifesto, PaginaManifesto } from '../types';

const ESFORCOS = [
  ['low', 'esforço baixo'],
  ['medium', 'esforço médio'],
  ['high', 'esforço alto'],
  ['xhigh', 'esforço máximo'],
] as const;
const porEsforco: PaginaManifesto[] = ESFORCOS.map(([id, titulo]) => ({
  id,
  titulo: `Fable 5.2 · ${titulo}`,
  resumo: 'Três versões feitas no mesmo esforço.',
}));

const NOMES = [
  ['sonnet', 'Sonnet 5.5'],
  ['opus', 'Opus 5.5'],
  ['fable', 'Fable 5.2'],
  ['sonnet-leve', 'Sonnet 5.5 (leve)'],
  ['opus-leve', 'Opus 5.5 (leve)'],
  ['fable-leve', 'Fable 5.2 (leve)'],
] as const;

export default {
  titulo: 'Modelos 3D',
  resumo: 'Peças pintadas do jogo (árvores, objetos, carroça) e testes de estilo.',
  origem: {
    caminho: '/modelos/',
    fonte: 'dungeon-tactics-lab/modelos: index.html e src/main.ts',
    copiadoEm: '2026-11-14T23:23:00-03:00',
  },
  grupos: [
    {
      id: 'personagens',
      titulo: 'Personagens',
      icone: '🧍',
      resumo: 'O guerreiro-viajante em cada técnica.',
      paginas: [
        { id: 'codigo', titulo: 'Fable 5.2 · código', icone: '🗡️', resumo: 'Fable 5.2, só com código, sem KayKit.' },
        {
          id: 'blender-sonnet',
          titulo: 'Sonnet 5.5 · Blender',
          icone: '🧱',
          resumo: 'Script do Blender feito pelo Sonnet 5.5.',
        },
        {
          id: 'blender-opus',
          titulo: 'Opus 5.5 · Blender',
          icone: '🧱',
          resumo: 'Script do Blender feito pelo Opus 5.5.',
        },
        {
          id: 'blender-fable',
          titulo: 'Fable 5.2 · Blender',
          icone: '🧱',
          resumo: 'Script do Blender feito pelo Fable 5.2.',
        },
      ],
    },
    {
      id: 'animacoes',
      titulo: 'Animações',
      icone: '🎬',
      resumo: 'Os 17 clipes do jogo tocando em cada personagem que gerei.',
      paginas: NOMES.map(([id, nome]) => ({
        id,
        titulo: `${nome} · animações`,
        icone: '🧱',
        resumo: `Personagem ${nome} com esqueleto e todos os clipes.`,
      })),
    },
    {
      id: 'kaykit',
      titulo: 'KayKit',
      icone: '🛡️',
      resumo: 'Os personagens KayKit do jogo por partes, com todas as animações do pacote.',
      paginas: [
        {
          id: 'personagens',
          titulo: 'Personagens e animações',
          icone: '🎬',
          resumo: 'Os 17 gestos do jogo e o pacote completo, em cada personagem.',
        },
        {
          id: 'remodelagem',
          titulo: 'Cavaleiro em 5 cabeças',
          icone: '📐',
          resumo: 'O Cavaleiro KayKit com proporção menos chibi, ao lado do original.',
        },
      ],
    },
    {
      id: 'sprites',
      titulo: 'Sprites',
      icone: '🖼️',
      resumo: 'Renders 2D do personagem do Blender: 8 direções, parado, andar e atacar.',
      paginas: [
        {
          id: 'sonnet',
          titulo: 'Sonnet 5.5 · sprites',
          icone: '🧱',
          resumo: 'Render do personagem do Sonnet, HD e pixel.',
        },
        { id: 'opus', titulo: 'Opus 5.5 · sprites', icone: '🧱', resumo: 'Render do personagem do Opus, HD e pixel.' },
      ],
    },
    {
      id: 'carrocas',
      titulo: 'Carroças',
      icone: '🛒',
      resumo: 'A carroça tombada, 12 versões por esforço do modelo.',
      paginas: porEsforco,
    },
    {
      id: 'arvores',
      titulo: 'Árvores',
      icone: '🌳',
      resumo: 'A árvore velha do Bosque, 12 versões por esforço, mais as livres.',
      paginas: [
        ...porEsforco,
        {
          id: 'livres',
          titulo: 'Fable 5.2 × Opus 5.5 · livres',
          resumo: 'Sem as peças-base do projeto: Fable (P) contra Opus (Q).',
        },
      ],
    },
    {
      id: 'estilos',
      titulo: 'Estilos',
      icone: '🎨',
      resumo: 'O que cada estilo mostra.',
      paginas: [
        { id: 'pintado', titulo: 'Pintado (Fable 5.2)', icone: '🖌️', resumo: 'O estilo atual do jogo.' },
        {
          id: 'psx',
          titulo: 'PSX (carroça do Fable 5.2)',
          icone: '📼',
          resumo: 'Teste de estilo do primeiro PlayStation.',
        },
      ],
    },
    {
      id: 'evals',
      titulo: 'Evals',
      icone: '🧪',
      resumo: 'Testes de como modelar melhor.',
      paginas: [
        {
          id: 'esforco',
          titulo: 'Esforço nos modelos',
          icone: '📊',
          resumo: 'Quanto esforço do modelo vale pagar para modelar.',
        },
      ],
    },
  ],
} satisfies Manifesto;
