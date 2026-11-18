// Models lab: the KayKit bench and the Vagrant Story study. The pages of the models and animations made by Claude were
// archived on Nov 17 in docs/arquivo-modelos, to come back in a unified studio.
import type { Manifesto } from '../types';

export default {
  titulo: 'Modelos 3D',
  resumo: 'Personagens KayKit do jogo e o estudo do Vagrant Story.',
  origem: {
    caminho: '/modelos/',
    fonte: 'dungeon-tactics-lab/modelos: index.html e src/main.ts',
    copiadoEm: '2026-11-14T23:23:00-03:00',
  },
  grupos: [
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
        {
          id: 'estudo-wow',
          titulo: 'Estudo: humano do WoW',
          icone: '🔍',
          resumo: 'Modelo original do WoW para remodelar por cima; só no PC do Fernando.',
        },
      ],
    },
    {
      id: 'vagrant',
      titulo: 'Vagrant Story',
      icone: '⚔️',
      resumo: 'Personagens, animações e mapas do Vagrant Story, para estudar e remodelar.',
      paginas: [
        {
          id: 'estudo',
          titulo: 'Estudo: modelos e mapas',
          icone: '🔍',
          resumo: 'Visualizador 3D com animações, subdivisão com textura e salas do jogo.',
        },
      ],
    },
  ],
} satisfies Manifesto;
