// Engine lab: the Godot x Three.js decision dashboard (data copied on 17/11 into dados.json, pendencias.json and
// fps-medido.json, each number with its origin) and the four live scenes side by side (scene contract).
import type { Manifesto } from '../types';

export default {
  titulo: 'Engine: Godot x Three.js',
  resumo: 'Qual motor para o Dungeon Tactics: notas, medições, ressalvas e quatro cenas ao vivo nos dois motores.',
  grupos: [
    {
      id: 'decisao',
      titulo: 'Decisão',
      icone: '⚖️',
      resumo: 'A pergunta em aberto, a recomendação atual e a matriz de notas.',
      paginas: [
        { id: 'agora', titulo: 'Agora estamos decidindo', icone: '❓', resumo: 'Console obrigatório ou só desejável.' },
        { id: 'matriz', titulo: 'Notas e pesos', icone: '🧮', resumo: 'Total com e sem custo de migração.' },
        { id: 'criterios', titulo: 'Cada critério', icone: '🔎', resumo: 'Número bruto, motivo da nota e origem.' },
        { id: 'ressalvas', titulo: 'Ressalvas e lacunas', icone: '⚠️', resumo: 'O que limita os números.' },
        { id: 'pendencias', titulo: 'Ainda não testado', icone: '🧪', resumo: 'Testes que faltam, com estado.' },
      ],
    },
    {
      id: 'medicoes',
      titulo: 'Medições',
      icone: '📊',
      resumo: 'Bancadas nativas de 16 e 17/11, vibe code, interface 3D e consoles.',
      paginas: [
        { id: 'desempenho', titulo: 'CPU e GPU', icone: '⏱️', resumo: 'Fps com a CPU e com a GPU no limite.' },
        {
          id: 'fisica',
          titulo: 'Física e personagens',
          icone: '🧱',
          resumo: 'Jolt contra Rapier; personagens animados.',
        },
        { id: 'fraco', titulo: 'Modo fraco e memória', icone: '🐢', resumo: '4 e 2 núcleos; RAM e VRAM.' },
        { id: 'vibe', titulo: 'Vibe code', icone: '🤖', resumo: '10 tarefas iguais nos dois motores.' },
        { id: 'interface', titulo: 'Interface 3D', icone: '🗂️', resumo: 'Menu de comandos portado para o Godot.' },
        { id: 'consoles', titulo: 'Consoles', icone: '🎮', resumo: 'Switch, Xbox, PlayStation e Steam Deck.' },
      ],
    },
    {
      id: 'cenas',
      titulo: 'Cenas ao vivo',
      icone: '🎬',
      resumo: 'Os dois motores lado a lado no navegador, com os mesmos parâmetros.',
      paginas: [
        { id: 'fisica', titulo: 'Física', icone: '📦', resumo: 'Até 5.000 caixas caindo.' },
        { id: 'particulas', titulo: 'Partículas', icone: '🔥', resumo: 'Fogo, fumaça e faíscas.' },
        { id: 'sombras', titulo: 'Sombras e luzes', icone: '💡', resumo: 'A cidade com sol e luzes de ponto.' },
        { id: 'nevoa', titulo: 'Névoa volumétrica', icone: '🌫️', resumo: 'Holofote numa sala com névoa.' },
      ],
    },
  ],
} satisfies Manifesto;
