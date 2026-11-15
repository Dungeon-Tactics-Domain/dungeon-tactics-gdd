// Models lab: the 3D bench viewer, styles and evals. Copied from dungeon-tactics-lab/modelos (index.html, src/main.ts).
import type { Manifesto, PaginaManifesto } from '../types';

const ESFORCOS = [
  ['low', 'Esforço baixo'],
  ['medium', 'Esforço médio'],
  ['high', 'Esforço alto'],
  ['xhigh', 'Esforço máximo'],
] as const;
const porEsforco: PaginaManifesto[] = ESFORCOS.map(([id, titulo]) => ({
  id,
  titulo,
  resumo: 'Três versões feitas no mesmo esforço.',
}));

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
        { id: 'codigo', titulo: 'Guerreiro em código', icone: '🗡️', resumo: 'Fable 5.2, só com código, sem KayKit.' },
        {
          id: 'blender-sonnet',
          titulo: 'Blender · Sonnet',
          icone: '🧱',
          resumo: 'Script do Blender feito pelo Sonnet 5.5.',
        },
        { id: 'blender-opus', titulo: 'Blender · Opus', icone: '🧱', resumo: 'Script do Blender feito pelo Opus 5.5.' },
        {
          id: 'blender-fable',
          titulo: 'Blender · Fable',
          icone: '🧱',
          resumo: 'Script do Blender feito pelo Fable 5.2.',
        },
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
        { id: 'livres', titulo: 'Árvores livres', resumo: 'Sem as peças-base do projeto: Fable (P) contra Opus (Q).' },
      ],
    },
    {
      id: 'estilos',
      titulo: 'Estilos',
      icone: '🎨',
      resumo: 'O que cada estilo mostra.',
      paginas: [
        { id: 'pintado', titulo: 'Pintado', icone: '🖌️', resumo: 'O estilo atual do jogo.' },
        { id: 'psx', titulo: 'PSX', icone: '📼', resumo: 'Teste de estilo do primeiro PlayStation.' },
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
