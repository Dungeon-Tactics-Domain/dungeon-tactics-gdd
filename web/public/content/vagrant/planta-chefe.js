// Boss-room floor plans for sala-fechada.html (Fernando, Nov 17): Vagrant Story's Dullahan arena (MAP025, zone 11)
// scaled 1.5x per side, and a combined plan (the Wyvern hall of MAP006, zone 6, joined to the Dullahan cross at 1x).
// Same data as the page: one letter per cell of 2x2 VS tiles, torches in its FOGOS shape, characters in its ELENCO
// shape ({x, z} = cell). Measurements: _estudo-vagrant/salas-chefe/tabela.md. Letters the page does not read yet
// (^ v ~ =) and the smoke list are described in planta-chefe-LEIAME.md.

// # rock · . floor (0) · - dais (+2) · > < ^ v stairs climbing east, west, north, south (1 tile per cell)
// o column · ~ shallow puddle (walkable, floor 0) · = water pit (not walkable)
export const LEGENDA = {
  '#': 'rocha', '.': 'chão (altura 0)', '-': 'estrado (+2 tiles)', '>': 'escada subindo para leste', '<': 'escada subindo para oeste',
  '^': 'escada subindo para norte', v: 'escada subindo para sul', o: 'coluna', '~': 'poça rasa (andável)', '=': 'fosso de água (não andável)',
};

// every cell holding one of the letters, as {x, z}
const onde = (texto, letras) => texto.flatMap((linha, z) => [...linha].flatMap((L, x) => (letras.includes(L) ? [{ x, z }] : [])));
const planta = (p) => ({ ...p, legenda: LEGENDA, colunas: onde(p.texto, 'o'), agua: { poca: onde(p.texto, '~'), fosso: onde(p.texto, '=') } });

export const PLANTAS = {
  // MAP025 x1.5: central band 24x12 tiles (the original 16x10, two rows short to stay near 218 x 2.25 tiles),
  // north and south arms 8 tiles wide, four corner daises at +2 reached by two-cell stairs, a 2x2-cell rock block
  // near the east wall and three single columns; a 2x2 puddle mid-north and a water pit splitting the south arm.
  dullahan15: planta({
    nome: 'Dullahan ampliada 1,5x',
    texto: [
      '##############',
      '##---....---##',
      '##---....---##',
      '###^#....#^###',
      '###^#....#^###',
      '#............#',
      '#.....~~..##.#',
      '#....o~~..##.#',
      '#..o.........#',
      '#.......o....#',
      '#............#',
      '###v#.==.#v###',
      '###v#.==.#v###',
      '##---....---##',
      '##---....---##',
      '##############',
    ],
    // ceiling in tiles: the Dullahan room measures 8, a little more for the wider room (one value per plan, as TETO)
    teto: 10,
    tochas: [
      { cx: 1, cz: 6, dx: -1, dz: 0 }, { cx: 1, cz: 9, dx: -1, dz: 0 }, { cx: 12, cz: 5, dx: 1, dz: 0 }, { cx: 12, cz: 9, dx: 1, dz: 0 },
      { cx: 5, cz: 3, dx: -1, dz: 0 }, { cx: 8, cz: 3, dx: 1, dz: 0 }, { cx: 5, cz: 12, dx: -1, dz: 0 }, { cx: 8, cz: 12, dx: 1, dz: 0 },
      { cx: 3, cz: 1, dx: 0, dz: -1 }, { cx: 10, cz: 1, dx: 0, dz: -1 }, { cx: 3, cz: 14, dx: 0, dz: 1 }, { cx: 10, cz: 14, dx: 0, dz: 1 },
      { cx: 5, cz: 7, dx: 0, dz: 1, coluna: true }, { cx: 8, cz: 9, dx: 0, dz: -1, coluna: true },
      { cx: 2, cz: 2, braseiro: true }, { cx: 11, cz: 2, braseiro: true }, { cx: 2, cz: 13, braseiro: true }, { cx: 11, cz: 13, braseiro: true },
    ],
    // smoke rising from each brazier and from the water pit (cells)
    fumaca: [{ cx: 2, cz: 2 }, { cx: 11, cz: 2 }, { cx: 2, cz: 13 }, { cx: 11, cz: 13 }, { cx: 6, cz: 12 }],
    spawns: {
      aliados: [{ x: 5, z: 14 }, { x: 6, z: 14 }, { x: 7, z: 14 }, { x: 8, z: 14 }],
      inimigos: [{ x: 5, z: 1 }, { x: 6, z: 1 }, { x: 7, z: 1 }, { x: 8, z: 1 }],
    },
  }),
  // West: the Wyvern hall (MAP006, 16x20 tiles here) with a gallery at +2 and a four-wide stair to the north,
  // four columns joined by arches, two wall niches, a puddle in the middle and a water pit across the south end.
  // A passage 4 tiles wide and 6 long leads east to the Dullahan cross at its own size (MAP025, 18x22 tiles).
  combinada: planta({
    nome: 'Salas combinadas: salão do Wyvern + cruz do Dullahan',
    texto: [
      '#######################',
      '###------####---...---#',
      '###-^^^^-#####^#...#^##',
      '##..^^^^..####^#...#^##',
      '#.........###.....o...#',
      '##.o....o.............#',
      '##...~~.............#.#',
      '#....~~...###..o......#',
      '##.o....o.###.........#',
      '##..====..####v#...#v##',
      '##........####v#...#v##',
      '#############---...---#',
      '#######################',
    ],
    // one ceiling for both rooms: the Wyvern hall measures 11.8 tiles, the Dullahan room 8
    teto: 10,
    tochas: [
      { cx: 2, cz: 5, dx: -1, dz: 0 }, { cx: 2, cz: 8, dx: -1, dz: 0 }, { cx: 9, cz: 4, dx: 1, dz: 0 }, { cx: 9, cz: 8, dx: 1, dz: 0 },
      { cx: 4, cz: 1, dx: 0, dz: -1 }, { cx: 7, cz: 1, dx: 0, dz: -1 }, { cx: 3, cz: 10, dx: 0, dz: 1 }, { cx: 8, cz: 10, dx: 0, dz: 1 },
      { cx: 3, cz: 5, dx: 0, dz: 1, coluna: true }, { cx: 8, cz: 8, dx: 0, dz: -1, coluna: true },
      { cx: 11, cz: 5, dx: 0, dz: -1 }, { cx: 11, cz: 6, dx: 0, dz: 1 },
      { cx: 13, cz: 4, dx: -1, dz: 0 }, { cx: 13, cz: 8, dx: -1, dz: 0 }, { cx: 21, cz: 5, dx: 1, dz: 0 }, { cx: 21, cz: 7, dx: 1, dz: 0 },
      { cx: 16, cz: 2, dx: -1, dz: 0 }, { cx: 18, cz: 2, dx: 1, dz: 0 }, { cx: 16, cz: 10, dx: -1, dz: 0 }, { cx: 18, cz: 10, dx: 1, dz: 0 },
      { cx: 3, cz: 1, braseiro: true }, { cx: 8, cz: 1, braseiro: true },
      { cx: 13, cz: 1, braseiro: true }, { cx: 21, cz: 1, braseiro: true }, { cx: 13, cz: 11, braseiro: true }, { cx: 21, cz: 11, braseiro: true },
    ],
    fumaca: [{ cx: 3, cz: 1 }, { cx: 8, cz: 1 }, { cx: 13, cz: 1 }, { cx: 21, cz: 1 }, { cx: 13, cz: 11 }, { cx: 21, cz: 11 }, { cx: 5, cz: 9 }],
    spawns: {
      aliados: [{ x: 4, z: 10 }, { x: 5, z: 10 }, { x: 6, z: 10 }, { x: 7, z: 10 }],
      inimigos: [{ x: 16, z: 1 }, { x: 17, z: 1 }, { x: 18, z: 1 }, { x: 17, z: 2 }],
    },
  }),
};
