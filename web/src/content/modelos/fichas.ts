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
