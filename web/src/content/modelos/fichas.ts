// Sheets of the Blender characters (Nov 15, Fernando's request: fill the column beside the viewer). Numbers measured in the
// bench's glb files (JSON chunk: index count / 3, skins, animations, file size) on Nov 15; method and defects from the
// modelling agents' notes in the game's worktree (_notas/agentes/*.md, Nov 14 and 15). Nothing estimated.

/** [label, value, where it comes from] */
export type Linha = readonly [rotulo: string, valor: string, origem: string];

export interface Ficha {
  numeros: readonly Linha[];
  metodo: string;
  origemMetodo: string;
  defeitos: readonly string[];
  origemDefeitos: string;
  /** file on the bench (or in the game) the preview loads */
  arquivo?: string;
  /** when it was made, and its version when it has one */
  data?: string;
  oQueTestar?: readonly string[];
}

const GLB = (m: string) => `medido em blender-${m}/char.glb, 15/11`;
const RIG = (m: string) => `medido em anim-${m}/char.glb (página Animações), 15/11`;

export const FICHAS: Record<string, Ficha> = {
  sonnet: {
    numeros: [
      ['Triângulos', '21.776 (alvo ~20 mil, 9% acima)', GLB('sonnet')],
      ['Malhas', '1', GLB('sonnet')],
      ['Ossos e clipes', '0 e 0 (sem esqueleto)', GLB('sonnet')],
      ['Arquivo', '5,03 MB, 1 textura embutida', GLB('sonnet')],
      ['Textura', '2048 × 2048', 'nota blender-sonnet.md'],
      ['Versão rigada', '23 ossos, 25 clipes', RIG('sonnet')],
    ],
    metodo:
      'Script bpy do zero: tubos com seção superelíptica, esferas deformadas (rosto esculpido por script), capa em grade com dobras senoidais, ~60 mechas cônicas de cabelo. Cor de materiais procedurais com bake de cor e oclusão numa textura só.',
    origemMetodo: 'nota blender-sonnet.md, 14/11',
    defeitos: [
      'Cabelo em "escamas" pontudas, o ponto mais fraco.',
      'Sombreado vem da oclusão e de ruído, não de pinceladas; dobras de pano quase só como ruído.',
      'Manga clara estourada; fenda escura na ponta da bota; tiras do bracelete pairando.',
      'Capa pouco visível de frente; pernas longas para chibi.',
    ],
    origemDefeitos: 'nota blender-sonnet.md, "O que ficou longe da referência"',
  },
  opus: {
    numeros: [
      ['Triângulos', '19.942', GLB('opus')],
      ['Malhas', '1', GLB('opus')],
      ['Ossos e clipes', '0 e 0 (sem esqueleto)', GLB('opus')],
      ['Arquivo', '4,93 MB, 1 textura embutida', GLB('opus')],
      ['Textura', '2048 px', 'nota blender-opus.md'],
      ['Versão rigada', '23 ossos, 25 clipes', RIG('opus')],
    ],
    metodo:
      'Primitivas em bmesh: superelipsoides, tubos varridos por spline, torso por anéis, capa em sino com Solidify; rosto em peças (olhos, cílio, boca). Cor por vértice mais o bake de um shader "pintor" (luz em dois tons, sombra violeta, oclusão) num atlas de 2048 px.',
    origemMetodo: 'nota blender-opus.md, 14/11',
    defeitos: [
      'Acabamento de "massinha 3D": o pintado é procedural, sem pincelada de verdade.',
      'Dobras de pano em ondas senoidais regulares; cabelo em fitas espetadas.',
      'De costas a bainha lê como bastão; nariz "bolinha"; torso domina as pernas.',
      'A textura já traz luz pintada: sob a luz do jogo a sombra dobra.',
      'Versão rigada: ao andar, a calça atravessa a dobra do cano da bota no joelho (nota anim-opus-fix.md).',
    ],
    origemDefeitos: 'notas blender-opus.md e anim-opus-fix.md',
  },
  fable: {
    numeros: [
      ['Triângulos', '19.396', GLB('fable')],
      ['Malhas', '9 (cabeça, cabelo, torso, capa, braços, pernas, espada)', GLB('fable')],
      ['Ossos e clipes', '0 e 0 (sem esqueleto)', GLB('fable')],
      ['Arquivo', '2,77 MB, 1 textura embutida', GLB('fable')],
      ['Textura', '2048 × 2048', 'nota blender-fable.md'],
      ['Versão rigada', '23 ossos, 25 clipes', RIG('fable')],
    ],
    metodo:
      'Grades paramétricas com UV feita pelo script (62 retângulos no atlas). Pintura em espaço de UV em três camadas: cor chapada, oclusão de contato e milhares de pinceladas orientadas pelo pano; rosto pintado na textura; nenhuma luz assada.',
    origemMetodo: 'nota blender-fable.md, 14/11',
    defeitos: [
      'Cabelo facetado de lado e de costas, com fios pintados regulares (listrado).',
      'Pincelada procedural, sem luz e sombra desenhadas por planos; dobras suaves demais.',
      'Manchas de oclusão no queixo e na testa e em volta da mochila; mochila sem alças.',
      'Peças se atravessam, sem malha contínua nos ombros e quadris.',
      'Versão rigada: com o braço erguido a manga atravessa a capa (nota anim-fable-fix.md).',
    ],
    origemDefeitos: 'notas blender-fable.md e anim-fable-fix.md',
  },
};

/** Blender character as it is on the bench (Personagens pages). */
export const fichaBlender = (m: string): Ficha | undefined =>
  FICHAS[m] && { ...FICHAS[m], arquivo: `eval/blender-${m}/char.glb`, data: '14/11 (modelo), medido 15/11' };

// Rigged characters of the Animações pages: the full ones are the Blender model with the KayKit skeleton (the "Versão
// rigada" line of their sheet); the light ones were decimated from them (notes anim-*-leve.md, Nov 15).
const LEVES: Record<string, Ficha> = {
  'opus-leve': {
    numeros: [
      ['Triângulos', '5.133 (corpo 4.939 + espada 194; o original tem 19.956)', 'nota anim-opus-leve.md'],
      ['Ossos e clipes', '23 e 25', 'nota anim-opus-leve.md (check.py)'],
      ['Arquivo', '5,2 MB (a textura de ~5 MB domina)', 'nota anim-opus-leve.md'],
    ],
    metodo:
      'Decimate (collapse, razão 0,25) no corpo do Opus rigado, depois de soldar os vértices das costuras de UV; espada intocada; reexportado com as 25 ações.',
    origemMetodo: 'nota anim-opus-leve.md, 15/11',
    defeitos: ['Os olhos perdem um pouco do brilho e do contorno.', 'O topo do cabelo fica mais chapado.'],
    origemDefeitos: 'nota anim-opus-leve.md (check-comparacao.png)',
  },
  'sonnet-leve': {
    numeros: [
      ['Triângulos', '5.008 (o original tem 21.776)', 'nota anim-sonnet-leve.md'],
      ['Ossos e clipes', '23 e 25', 'nota anim-sonnet-leve.md (check.py)'],
    ],
    metodo: 'Decimate (collapse, razão 0,23) no corpo do Sonnet rigado, antes do modificador de armadura; reexportado.',
    origemMetodo: 'nota anim-sonnet-leve.md, 15/11',
    defeitos: [
      'Rosto mais áspero: olhos e nariz.',
      'Cabelo com pequenas lascas; bordas do pano um pouco rasgadas.',
      'O Swim estica mais as arestas (arestas mais longas, não explosão).',
    ],
    origemDefeitos: 'nota anim-sonnet-leve.md',
  },
};
export const fichaAnimacao = (m: string): Ficha | undefined => {
  const f = LEVES[m] ?? FICHAS[m];
  return f && { ...f, arquivo: `eval/anim-${m}/char.glb`, data: '15/11' };
};

// The game's KayKit characters (KayKit page). Rig and clip counts from the bench notes (bancada-kaykit.md, Nov 15):
// "ossos" is the 23 bones the animation packs move, not the 246/369 bone nodes of the files. Proportions are measured
// only for the knight (knight-5h.md, "Original" column, file units).
const KAYKIT_RIG: Linha = [
  'Ossos',
  '23 animados (Rig_Medium; o arquivo tem 246 nós de osso nos aventureiros, 369 nos esqueletos)',
  'nota bancada-kaykit.md',
];
export function fichaKayKit(base: string, clipes?: { jogo: number; pacote: number }): Ficha {
  const knight = base === 'knight';
  return {
    numeros: [
      ...(knight
        ? ([
            ['Cabeças', '2,11 cabeças = 1 de cabeça + 1,11 de corpo', 'nota remodel/knight-5h.md'],
            ['Altura total (topo do elmo)', '2,467', 'nota remodel/knight-5h.md (unidades do arquivo)'],
            ['Cabeça', '1,099', 'nota remodel/knight-5h.md'],
            ['Tronco', '0,865', 'nota remodel/knight-5h.md'],
            ['Perna à mostra', '0,376', 'nota remodel/knight-5h.md'],
            ['Braço (ombro à ponta dos dedos)', '0,759', 'nota remodel/knight-5h.md'],
          ] as const)
        : []),
      ['Triângulos', 'não medido', '—'],
      KAYKIT_RIG,
      ...(clipes
        ? ([
            ['Clipes', `${clipes.jogo} do jogo + ${clipes.pacote} do pacote completo`, 'clips.json da bancada'],
          ] as const)
        : []),
    ],
    metodo:
      'Modelo KayKit (CC0) do jogo, na escala do jogo (0,85). As partes trocadas vêm de outra classe e são religadas aos ossos do corpo pelo nome; chapéu e capa vão para o osso de mesmo nome.',
    origemMetodo: 'nota bancada-kaykit.md, 15/11',
    defeitos: knight ? [] : ['Proporção não medida para este personagem.'],
    origemDefeitos: 'nota bancada-kaykit.md',
    arquivo: `/models/${base}.glb`,
    data: 'pacote KayKit do jogo',
  };
}

// Sprite sheets rendered from the Blender characters (notes sprites-*.md, Nov 14).
export const FICHAS_SPRITES: Record<string, Ficha> = {
  opus: {
    numeros: [
      ['Quadro', 'HD 256 px e pixel 96 px', 'nota sprites-opus.md'],
      ['Direções', '8 (S, SE, E, NE, N, NW, W, SW)', 'nota sprites-opus.md'],
      ['Quadros por ação', 'parado 4, andar 8, atacar 8', 'nota sprites-opus.md'],
      ['Ossos', '23 (nomes do jogo)', 'nota sprites-opus.md'],
    ],
    metodo:
      'O personagem do Blender ganhou esqueleto e pesos (bone heat e correção por ilha), 3 clipes KayKit retargetados e 320 quadros em EEVEE, com a luz e a câmera fixas e o personagem girando; as folhas são montadas em Python.',
    origemMetodo: 'nota sprites-opus.md, 14/11',
    defeitos: ['O bone heat deixou 2.958 de 10.136 vértices sem peso; corrigido ilha a ilha.'],
    origemDefeitos: 'nota sprites-opus.md',
    arquivo: 'eval/sprites-opus/',
    data: '14/11',
  },
  sonnet: {
    numeros: [
      ['Quadro', 'HD 256 px (~156 px de altura) e pixel com 24 cores', 'nota sprites-sonnet.md'],
      ['Direções', '8', 'nota sprites-sonnet.md'],
      ['Ossos', '23 (nomes do jogo, sem IK)', 'nota sprites-sonnet.md'],
    ],
    metodo:
      'EEVEE ortográfico a 30°, fundo transparente, contorno por casco invertido; pixel art renderizada a 4x e reduzida (BOX), alfa duro, contorno de 1 px, 16 + 8 cores.',
    origemMetodo: 'nota sprites-sonnet.md, 14/11',
    defeitos: [
      'O pé oscila 4 a 6 px entre os quadros (não fica fixo no pixel).',
      'No pixel o rosto quase some (olhos de 1 a 2 px); a pele cai na paleta bege.',
    ],
    origemDefeitos: 'nota sprites-sonnet.md',
    arquivo: 'eval/sprites-sonnet/',
    data: '14/11',
  },
};

// Pieces made in code on the bench (carts, trees, the painted warrior). Only the warrior has measured numbers.
export function fichaPeca(m: string | undefined, nome: string): Ficha {
  const guerreiro = m === 'E';
  return {
    numeros: guerreiro
      ? [
          ['Triângulos', '1.364 no pintado liso, 680 no PSX', 'nota personagem-pintado.md (título da bancada)'],
          ['Altura', '0,85 (a peça é escalada pela caixa medida)', 'nota personagem-pintado.md'],
        ]
      : [['Triângulos', 'não medido', '—']],
    metodo: guerreiro
      ? 'Modelado do zero com as primitivas de painted.ts (nada do KayKit); dobras e luz pintadas por cor de vértice.'
      : `${nome}: peça feita em código para a bancada (TypeScript), sem arquivo 3D.`,
    origemMetodo: guerreiro ? 'nota personagem-pintado.md, 14/11' : 'bancada (src/client/eval)',
    defeitos: [],
    origemDefeitos: guerreiro ? 'nota personagem-pintado.md' : '—',
    arquivo: m ? `peça m=${m} da bancada (src/client/eval)` : undefined,
  };
}
