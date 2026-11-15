// Walkable town draft (grill of 15/11, GRILL-cidade-andavel-15-11.md): the data in the shape proposed for the game's
// src/content/town.ts, so the lab preview and the game read the same thing. One ASCII row per tile row, a key per symbol
// (as maps/ash-wood.ts does), places with one KayKit Medieval Hexagon model per town level, and the NPCs with their lines.

// Real file names in assets/kaykit/medieval-hexagon/Assets/gltf/buildings/ (neutral/ and blue/), listed on 15/11
export type Modelo =
  | 'building_tavern_blue'
  | 'building_home_A_blue'
  | 'building_home_B_blue'
  | 'building_blacksmith_blue'
  | 'building_well_blue'
  | 'building_market_blue'
  | 'building_church_blue'
  | 'building_barracks_blue'
  | 'building_archeryrange_blue'
  | 'building_tower_base_blue'
  | 'building_tower_A_blue'
  | 'building_tower_B_blue'
  | 'building_destroyed'
  | 'building_scaffolding'
  | 'building_dirt'
  | 'building_stage_A'
  | 'building_grain'
  | 'fence_wood_straight'
  | 'fence_wood_straight_gate'
  | 'wall_straight'
  | 'wall_straight_gate';
// the character models the game already ships (public/models/*.glb)
export type Boneco = 'mage' | 'knight' | 'barbarian' | 'rogue' | 'rogue_hooded' | 'ranger' | 'lancer';
export type Nivel = 1 | 2 | 3;
type Tr = [pt: string, en: string];

export interface Simbolo {
  terrain: 'floor' | 'forest' | 'wall';
  h: number;
  look?: string; // the game's existing tile looks (scene/board.ts); a building tile has none: its lot draws the model
  depth?: number; // 1 shallow, 2 deep (grid.ts)
  ramp?: [dir: number, rise: number]; // FACING order: 2 = rises toward -y (north)
  nome: Tr;
}

// Town ground at height 1; the beacon cliff at 3, reached by one ramp at 2. Every building tile is a wall at every level
// (an empty lot or scaffolding before the building), so the paths never change with the level.
export const CHAVE: Record<string, Simbolo> = {
  '.': { terrain: 'floor', h: 1, look: 'grass', nome: ['grama', 'grass'] },
  ',': { terrain: 'floor', h: 1, look: 'stone', nome: ['rua de pedra', 'stone street'] },
  '+': {
    terrain: 'floor',
    h: 1,
    look: 'stone',
    nome: ['porta (parar aqui e apertar ação)', 'door (stand here, press action)'],
  },
  '@': { terrain: 'floor', h: 1, look: 'stone', nome: ['onde o jogador nasce', 'player start'] },
  '=': { terrain: 'floor', h: 1, look: 'bridge', nome: ['ponte', 'bridge'] },
  '~': {
    terrain: 'floor',
    h: 1,
    look: 'water',
    depth: 2,
    nome: ['água funda (riacho e mar)', 'deep water (brook and sea)'],
  },
  w: { terrain: 'floor', h: 1, look: 'water', depth: 1, nome: ['água rasa (praia)', 'shallow water (shore)'] },
  T: { terrain: 'forest', h: 1, look: 'tree', nome: ['árvore', 'tree'] },
  r: { terrain: 'wall', h: 3, look: 'rock', nome: ['rocha do penhasco', 'cliff rock'] },
  ':': { terrain: 'floor', h: 3, look: 'summit', nome: ['alto do penhasco', 'clifftop'] },
  '/': { terrain: 'floor', h: 2, look: 'rock', ramp: [2, 1], nome: ['rampa', 'ramp'] },
  '#': { terrain: 'wall', h: 1, nome: ['muro (paliçada no nível 1)', 'wall (palisade at level 1)'] },
  h: { terrain: 'wall', h: 1, nome: ['casa de moradores', "townsfolk's house"] },
  f: { terrain: 'wall', h: 1, nome: ['campo de trigo', 'wheat field'] },
  c: { terrain: 'wall', h: 1, look: 'crates', nome: ['caixotes', 'crates'] },
  b: { terrain: 'wall', h: 1, look: 'barrel', nome: ['barril', 'barrel'] },
  // the places' lots: one letter per place (LUGARES)
  ...Object.fromEntries(
    [...'ABCDEFGHI'].map((l) => [l, { terrain: 'wall', h: 1, nome: ['prédio', 'building'] } satisfies Simbolo]),
  ),
  J: { terrain: 'wall', h: 3, nome: ['prédio', 'building'] },
};

// 40 x 30, north up. North: the gate in the wall and the road to the dungeons; east: the sea and the beacon cliff;
// a brook splits the old town (north) from the part that rises with the levels (south).
export const MAPA = [
  'TTTTTTTTTTTTTTTTTTT,,TTTTTTTrrrrrrrr~~~~',
  'TTTTTTTTTTTTTTTTTTT,,TTTTTTTr::::::r~~~~',
  'TTTTTTTTTTTTTTTTTTT,,TTTTTTTr:JJJ::r~~~~',
  'TT################AAAA######r:JJJ::r~~~~',
  'TT................,+,,......r:JJJ::r~~~~',
  'TT.hh.............,,@,.DDD..r::::::r~~~~',
  'TT.hh.CC...BBB....,,,,.DDD..r::::::r~~~~',
  'TT....CC...BBB....,,,,.DDD..r/rrrrrr~~~~',
  'TT....CC...BBB....,,,,..+....,.....w~~~~',
  'TT,,,,+,,,,,+,,,,,,,,,,,,,,,,,,,,,,w~~~~',
  'TT.........,,,,,,,,,,,,,,..........w~~~~',
  'TT.............,,,,EE,,,,,FFFF.....w~~~~',
  'TT....HH+......,,,,EE,,,,+FFFF.....w~~~~',
  'TT....HH.......,,,,,,,,,,,FFFF.....w~~~~',
  'TT.............,,,,,,,,,,.c...b....w~~~~',
  'TT..T..............,,..........T...w~~~~',
  'TT......,,.........,,..............w~~~~',
  '~~~~~~~~==~~~~~~~~~==~~~~~~~~~~~~~~~~~~~',
  'TT......,,.........,,..............w~~~~',
  'TT......,,........,+,,,,,,,III.....w~~~~',
  'TT......,,.hh.....GGG.....+IIIIIII.w~~~~',
  'TT.fffff,,.hh.....GGG......IIIIIII.w~~~~',
  'TT.fffff,,........GGG......IIIIIII.w~~~~',
  'TT.fffff,,....................IIII.w~~~~',
  'TT.fffff,,...hh.........T..........w~~~~',
  'TT......,,...hh....................w~~~~',
  'TT.................................w~~~~',
  'TT...T..........T..........T.......w~~~~',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTw~~~~',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTw~~~~',
];

export type Servico =
  | 'expedicao' // choose a dungeon (grill: the gate)
  | 'recrutar' // tavern
  | 'comprar' // shop
  | 'forjar' // blacksmith: craft and repair (loop decision 12)
  | 'ingredientes' // kitchen and apothecary (loop decision 8)
  | 'obras' // build and improve the town (grill: the square)
  | 'treinar'; // barracks (loop decision 33: gold buys recruiting and training)

export const SERVICO: Record<Servico, Tr> = {
  expedicao: ['Escolher dungeon', 'Choose a dungeon'],
  recrutar: ['Recrutar', 'Recruit'],
  comprar: ['Comprar e vender', 'Buy and sell'],
  forjar: ['Forjar e consertar', 'Craft and repair'],
  ingredientes: ['Ingredientes e cozinha', 'Ingredients and kitchen'],
  obras: ['Melhorar a cidade', 'Improve the town'],
  treinar: ['Treinar', 'Train'],
};

export interface Lote {
  x: number;
  y: number;
  w: number;
  h: number;
  modelos: [Modelo, Modelo, Modelo]; // levels 1, 2 and 3
}
export interface Lugar {
  letra: string;
  nome: Tr;
  porta: { x: number; y: number };
  servico?: Servico;
  lotes: Lote[];
  porque: Tr; // why this model (shown in the lab)
}

// Footprint in tiles: about 2 tiles per KayKit unit, rounded up (bounds read from the glTF files on 15/11); to be
// measured in the 3D scene next to a character.
export const LUGARES: Lugar[] = [
  {
    letra: 'A',
    nome: ['Portão das dungeons', 'Dungeon gate'],
    porta: { x: 19, y: 4 },
    servico: 'expedicao',
    lotes: [
      { x: 18, y: 3, w: 4, h: 1, modelos: ['fence_wood_straight_gate', 'wall_straight_gate', 'wall_straight_gate'] },
    ],
    porque: [
      'Paliçada de madeira no começo; vira muro de pedra quando a cidade sobe.',
      'Wooden palisade at first; a stone wall once the town rises.',
    ],
  },
  {
    letra: 'B',
    nome: ['Taverna', 'Tavern'],
    porta: { x: 12, y: 9 },
    servico: 'recrutar',
    lotes: [
      { x: 11, y: 6, w: 3, h: 3, modelos: ['building_tavern_blue', 'building_tavern_blue', 'building_tavern_blue'] },
    ],
    porque: [
      'Instalação inicial: não muda (decisão 16 do loop).',
      'Starting facility: it does not change (loop decision 16).',
    ],
  },
  {
    letra: 'C',
    nome: ['Armazém (loja)', 'Store (shop)'],
    porta: { x: 6, y: 9 },
    servico: 'comprar',
    lotes: [
      { x: 6, y: 6, w: 2, h: 3, modelos: ['building_home_B_blue', 'building_home_B_blue', 'building_home_B_blue'] },
    ],
    porque: [
      'O KayKit não tem loja; a casa de dois andares é o armazém. O mercado ficou com a cozinha.',
      'KayKit has no shop; the two-storey house is the store. The market went to the kitchen.',
    ],
  },
  {
    letra: 'D',
    nome: ['Ferreiro', 'Blacksmith'],
    porta: { x: 24, y: 8 },
    servico: 'forjar',
    lotes: [
      {
        x: 23,
        y: 5,
        w: 3,
        h: 3,
        modelos: ['building_blacksmith_blue', 'building_blacksmith_blue', 'building_blacksmith_blue'],
      },
    ],
    porque: ['Instalação inicial: não muda.', 'Starting facility: it does not change.'],
  },
  {
    letra: 'E',
    nome: ['Praça do poço (obras)', 'Well square (works)'],
    porta: { x: 19, y: 13 },
    servico: 'obras',
    lotes: [{ x: 19, y: 11, w: 2, h: 2, modelos: ['building_well_blue', 'building_well_blue', 'building_well_blue'] }],
    porque: [
      'O poço marca o centro; o mestre de obras vende cada nível da cidade aqui.',
      'The well marks the centre; the master builder sells each town level here.',
    ],
  },
  {
    letra: 'F',
    nome: ['Mercado e cozinha', 'Market and kitchen'],
    porta: { x: 25, y: 12 },
    servico: 'ingredientes',
    lotes: [
      { x: 26, y: 11, w: 4, h: 3, modelos: ['building_market_blue', 'building_market_blue', 'building_market_blue'] },
    ],
    porque: [
      'No lugar do "mercado" da lista: a 4ª instalação inicial é cozinha/boticário (decisão 8 do loop), e as barracas do mercado servem a ela.',
      'In place of the list\'s "market": the 4th starting facility is kitchen/apothecary (loop decision 8), and the market stalls suit it.',
    ],
  },
  {
    letra: 'G',
    nome: ['Capela', 'Chapel'],
    porta: { x: 19, y: 19 },
    lotes: [
      { x: 18, y: 20, w: 3, h: 3, modelos: ['building_destroyed', 'building_church_blue', 'building_church_blue'] },
    ],
    porque: ['Em ruínas no nível 1; reerguida no 2.', 'In ruins at level 1; rebuilt at 2.'],
  },
  {
    letra: 'H',
    nome: ['Casa do faroleiro (história)', "Keeper's house (story)"],
    porta: { x: 8, y: 12 },
    lotes: [
      { x: 6, y: 12, w: 2, h: 2, modelos: ['building_home_A_blue', 'building_home_A_blue', 'building_home_A_blue'] },
    ],
    porque: [
      'Casa pequena e velha: quem mora nela conta a história e os rumores.',
      'A small old house: whoever lives there tells the story and the rumours.',
    ],
  },
  {
    letra: 'I',
    nome: ['Quartel e campo de treino', 'Barracks and training field'],
    porta: { x: 26, y: 20 },
    servico: 'treinar',
    lotes: [
      {
        x: 27,
        y: 19,
        w: 3,
        h: 4,
        modelos: ['building_scaffolding', 'building_barracks_blue', 'building_barracks_blue'],
      },
      { x: 30, y: 20, w: 4, h: 4, modelos: ['building_dirt', 'building_stage_A', 'building_archeryrange_blue'] },
    ],
    porque: [
      'Andaime no nível 1, quartel no 2; o campo de tiro sobe do terreno vazio ao alicerce e fica pronto no 3.',
      'Scaffolding at level 1, barracks at 2; the range goes from bare lot to foundation and is done at 3.',
    ],
  },
  {
    letra: 'J',
    nome: ['Torre do farol (arquivo)', 'Beacon tower (archive)'],
    porta: { x: 31, y: 5 },
    lotes: [
      {
        x: 30,
        y: 2,
        w: 3,
        h: 3,
        modelos: ['building_tower_base_blue', 'building_tower_A_blue', 'building_tower_B_blue'],
      },
    ],
    porque: [
      'O KayKit não tem farol: a torre faz o papel, da base apagada (1) à torre alta acesa (3).',
      'KayKit has no lighthouse: the tower stands in, from the dark base (1) to the tall lit tower (3).',
    ],
  },
];

// the wall row ('#') and the townsfolk's houses ('h'), per level
export const MURO: [Modelo, Modelo, Modelo] = ['fence_wood_straight', 'wall_straight', 'wall_straight'];
export const CASAS: Modelo[] = ['building_home_A_blue', 'building_home_B_blue'];
export const CAMPO: Modelo = 'building_grain';

export interface Npc {
  id: string;
  nome: string;
  papel: Tr;
  boneco: Boneco;
  lugar: string; // place letter
  em: { x: number; y: number };
  ate?: { x: number; y: number }; // short walk: back and forth in a straight line from `em` to `ate`
  nivel: Nivel; // town level it appears from
  servico?: Servico; // menu opened after the line
  falas: Tr[];
}

// Names avoid the party (Bran, Tess, Odo, Lia), the recruits (party.ts) and Vesper (campaign.ts)
export const NPCS: Npc[] = [
  {
    id: 'hilde',
    nome: 'Hilde',
    papel: ['guarda do portão', 'gate warden'],
    boneco: 'lancer',
    lugar: 'A',
    em: { x: 18, y: 4 },
    nivel: 1,
    servico: 'expedicao',
    falas: [
      [
        'A névoa chegou à estrada de novo. Quem sai, volta antes do sino.',
        'The mist reached the road again. Whoever goes out comes back before the bell.',
      ],
      [
        'Eu abro o portão. Fechar depois de vocês é a parte difícil.',
        'I open the gate. Shutting it behind you is the hard part.',
      ],
    ],
  },
  {
    id: 'rurik',
    nome: 'Rurik',
    papel: ['taverneiro', 'innkeeper'],
    boneco: 'barbarian',
    lugar: 'B',
    em: { x: 11, y: 10 },
    ate: { x: 14, y: 10 },
    nivel: 1,
    servico: 'recrutar',
    falas: [
      [
        'Cerveja quente e gente com coragem: das duas coisas eu tenho pouco.',
        'Warm ale and brave folk: I am short on both.',
      ],
      [
        'Quem bebe aqui já enterrou alguém. Escolha com calma.',
        'Everyone who drinks here has buried someone. Choose with care.',
      ],
    ],
  },
  {
    id: 'sabela',
    nome: 'Sabela',
    papel: ['dona do armazém', 'storekeeper'],
    boneco: 'rogue',
    lugar: 'C',
    em: { x: 7, y: 10 },
    nivel: 1,
    servico: 'comprar',
    falas: [
      [
        'Corda, tocha, pão duro. O resto vem das caravanas, quando vêm.',
        'Rope, torch, hard bread. The rest comes with the caravans, when they come.',
      ],
      [
        'Traga o que achar lá embaixo. Eu pago, sem perguntar de quem era.',
        'Bring whatever you find down there. I pay, and I never ask whose it was.',
      ],
    ],
  },
  {
    id: 'gaspar',
    nome: 'Gaspar',
    papel: ['ferreiro', 'blacksmith'],
    boneco: 'knight',
    lugar: 'D',
    em: { x: 25, y: 8 },
    nivel: 1,
    servico: 'forjar',
    falas: [
      [
        'Já usei esta armadura. Agora só conserto as dos outros.',
        "I used to wear this armour. Now I only mend other people's.",
      ],
      ['Osso cega a lâmina. Volte antes que ela quebre.', 'Bone dulls the blade. Come back before it breaks.'],
      ['Ferro bom não tem medo de morto. O ferreiro, um pouco.', 'Good iron fears no dead man. The smith, a little.'],
    ],
  },
  {
    id: 'brom',
    nome: 'Brom',
    papel: ['mestre de obras', 'master builder'],
    boneco: 'barbarian',
    lugar: 'E',
    em: { x: 17, y: 11 },
    ate: { x: 17, y: 13 },
    nivel: 1,
    servico: 'obras',
    falas: [
      ['Pedra eu tenho. Ouro e braços, não.', 'Stone I have. Gold and hands, I do not.'],
      ['Cada muro novo é uma noite a mais de sono.', 'Every new wall is one more night of sleep.'],
    ],
  },
  {
    id: 'jacinta',
    nome: 'Jacinta',
    papel: ['caçadora e cozinheira', 'hunter and cook'],
    boneco: 'ranger',
    lugar: 'F',
    em: { x: 24, y: 11 },
    ate: { x: 24, y: 13 },
    nivel: 1,
    servico: 'ingredientes',
    falas: [
      ['Raiz de cripta amarga, mas fecha ferida. Quer?', 'Crypt root is bitter, but it closes wounds. Want some?'],
      [
        'O que anda lá embaixo também sangra. E o que sangra, eu cozinho.',
        'What walks down there bleeds too. And what bleeds, I cook.',
      ],
    ],
  },
  {
    id: 'elvira',
    nome: 'Elvira',
    papel: ['viúva do faroleiro', "the keeper's widow"],
    boneco: 'rogue_hooded',
    lugar: 'H',
    em: { x: 9, y: 13 },
    nivel: 1,
    falas: [
      [
        'Meu marido acendia o farol toda noite. Na última, a luz ficou azul e ele não desceu.',
        'My husband lit the beacon every night. On the last one the light went blue and he never came down.',
      ],
      [
        'Os mortos não gostam de luz. Por isso eles querem a torre.',
        'The dead dislike light. That is why they want the tower.',
      ],
      [
        'Ouvi passos na cripta velha ontem. Passos de quem não respira.',
        'I heard steps in the old crypt last night. Steps of something that does not breathe.',
      ],
    ],
  },
  {
    id: 'clara',
    nome: 'Irmã Clara',
    papel: ['irmã da capela', 'chapel sister'],
    boneco: 'mage',
    lugar: 'G',
    em: { x: 20, y: 19 },
    nivel: 2,
    falas: [
      ['Reerguemos as paredes. A fé demora mais.', 'We raised the walls again. Faith takes longer.'],
      [
        'Rezo pelos que voltam feridos. Pelos outros, rezo mais alto.',
        'I pray for those who come back wounded. For the others, I pray louder.',
      ],
    ],
  },
  {
    id: 'tobias',
    nome: 'Sargento Tobias',
    papel: ['sargento do quartel', 'barracks sergeant'],
    boneco: 'knight',
    lugar: 'I',
    em: { x: 26, y: 21 },
    ate: { x: 26, y: 23 },
    nivel: 2,
    servico: 'treinar',
    falas: [
      [
        'Esqueleto não sente dor. Você sente. Treine para sentir menos.',
        'A skeleton feels no pain. You do. Train to feel less.',
      ],
      ['Escudo alto, costas para a parede. O resto é sorte.', 'Shield up, back to the wall. The rest is luck.'],
    ],
  },
  {
    id: 'amaro',
    nome: 'Amaro',
    papel: ['arquivista do farol', 'beacon archivist'],
    boneco: 'mage',
    lugar: 'J',
    em: { x: 33, y: 5 },
    nivel: 3,
    falas: [
      [
        'O farol aceso de novo. Os registros dizem que da última vez durou cem anos.',
        'The beacon lit again. The records say last time it lasted a hundred years.',
      ],
      [
        'Anoto cada andar que vocês descem. Alguém precisa lembrar.',
        'I write down every floor you descend. Someone has to remember.',
      ],
    ],
  },
];

export const NIVEIS: Record<Nivel, { nome: Tr; resumo: Tr }> = {
  1: {
    nome: ['Vila sitiada', 'Besieged village'],
    resumo: [
      'Paliçada de madeira, capela em ruínas, quartel em andaime, farol apagado. As 4 instalações iniciais (armazém, ferreiro, taverna, cozinha) já funcionam.',
      'Wooden palisade, chapel in ruins, barracks under scaffolding, beacon dark. The 4 starting facilities (store, blacksmith, tavern, kitchen) already work.',
    ],
  },
  2: {
    nome: ['Vila reerguida', 'Village rebuilt'],
    resumo: [
      'Muro de pedra, capela de pé com a Irmã Clara, quartel pronto com o Sargento Tobias, torre sobe um andar, alicerce no campo de treino.',
      'Stone wall, chapel standing with Sister Clara, barracks ready with Sergeant Tobias, the tower rises a floor, foundation on the training field.',
    ],
  },
  3: {
    nome: ['Farol aceso', 'Beacon lit'],
    resumo: [
      'Torre alta com o farol aceso e o arquivista Amaro, campo de tiro pronto.',
      'Tall tower with the beacon lit and Amaro the archivist, archery range ready.',
    ],
  },
};
