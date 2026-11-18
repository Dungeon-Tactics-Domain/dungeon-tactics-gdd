// The "world" plan for sala-fechada.html (?planta=mundo; Fernando, Nov 18: "make the map bigger and join different
// kinds of architecture in one map, like an MMO"): a cave, a long corridor, a Dullahan-style hall, a tunnel out to an
// open clearing (reference h2, Nov 18) with a thin river, a bridge, an earth trail and a wooden house; opening the
// house's door takes the walker into its inside, a room of its own out of sight. Same data shape as planta-chefe.js
// (one letter per cell of 2x2 VS tiles, torches, spawns), plus hooks the page calls only when a plan brings them:
// pisa, seco, fora, corta, bloqueia, molha, montar. See planta-mundo-LEIAME.md.
//
// Size: 92 x 44 cells = 184 x 88 tiles; the clearing takes columns 22-63, the house's inside 82-89, the rest is rock.

// indoor letters as in the page; outdoor: , grass  : path  T tree  R boulder  r river  b bridge  H the house seen from
// outside (solid)  h the house's inside (a room of its own, out of sight to the east, reached through the door)
// The river is shallow water a walker wades through (Fernando, Nov 18), slower than dry ground (the page's LENTO_AGUA)
const FORA = ',:TRrbhH', ANDA_FORA = ',:bhr';
// the clearing ends at column FL - 1; columns FL..LARG-1 are rock, with the house's inside at 82-89
const LARG = 92, ALTA = 44, CEL = 2, TETO = 10, FL = 64;
const PISO_CASA = 1.0, CLAREIRA = 0.6, PE = 5; // house floor, the flat ground around it, wall height (tiles)
// The house in tiles: outside in the clearing, inside 72 tiles east, same size (Fernando, Nov 18: opening the door
// takes the walker into the inside, a separate room, and its door takes him back out). Door on the west wall of
// both, facing the trail; hinge at z0, swings inward (+x).
const CASA = { x0: 92, x1: 108, z0: 40, z1: 52 }, DENTRO = { x0: 164, x1: 180, z0: 40, z1: 52 };
const PORTA = { z0: 44.2, z1: 45.8, alto: 4.2 }, PORTA_Z = (PORTA.z0 + PORTA.z1) / 2;

// ---- deterministic noise ------------------------------------------------------------------------------------------
const hash = (i, j) => { let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function ruido(x, z) {
  const i = Math.floor(x), j = Math.floor(z), u = x - i, v = z - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
  return (hash(i, j) * (1 - a) * (1 - b) + hash(i + 1, j) * a * (1 - b) + hash(i, j + 1) * (1 - a) * b + hash(i + 1, j + 1) * a * b) * 2 - 1;
}
const lisa = (a, b, t) => { const k = Math.min(1, Math.max(0, (t - a) / (b - a))); return k * k * (3 - 2 * k); };
function sorteio(s) { return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// A thin river (reference h2: about 3 tiles of water) running north to south across the clearing, gently bending;
// centre line in cells (x for a row z). One bridge on the trail's row.
const RIO = (z) => 35 + 1.6 * Math.sin(z * 0.17 + 0.6);
const noRio = (x, z) => Math.abs(x + 0.5 - RIO(z + 0.5)) < 0.75;
const PONTE = 32, RP = RIO(PONTE + 0.5);
// the water's surface, and how far under it the feet of a wader stand: the bed is up to 0.8 deep, he never sinks
const AGUA_Y = 0.04, PE_NA_AGUA = 0.1;
// the earth trail from the cave mouth over the bridge to the house door (cell centres), one to two cells wide
const TRILHA = [[21.5, 33.5], [26, 33.5], [29, 32.5], [RP - 3, 32.5], [RP + 3, 32.5], [40, 30.5], [43, 25], [45.5, 22.5]];
const aoSegmento = (px, pz, [ax, az], [bx, bz]) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz))); return Math.hypot(px - ax - t * dx, pz - az - t * dz); };
const naTrilha = (x, z) => TRILHA.some((a, i) => i > 0 && aoSegmento(x + 0.5, z + 0.5, TRILHA[i - 1], a) < 0.9);
const naCasa = (C, x, z) => x >= C.x0 / CEL && x < C.x1 / CEL && z >= C.z0 / CEL && z < C.z1 / CEL;
// the few loose trees in the open (h2 has two or three); the rest stand in a ring at the clearing's edge
const SOLTAS = ['31,14', '44,9', '52,35', '28,24', '57,14'];

// ---- the grid ---------------------------------------------------------------------------------------------------
const G = Array.from({ length: ALTA }, () => Array(LARG).fill('#'));
const poe = (x0, z0, x1, z1, L) => { for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) G[z][x] = L; };
// cave: an irregular blob, four rock islands
for (let z = 1; z <= 14; z++) for (let x = 1; x <= 20; x++) if (((x - 10.5) / 9.5) ** 2 + ((z - 7.5) / 6.8) ** 2 + 0.35 * ruido(x * 0.45, z * 0.45) < 1) G[z][x] = '.';
const ILHAS = [[6, 6], [14, 9], [5, 11], [15, 4]];
for (const [x, z] of ILHAS) G[z][x] = '#';
// corridor with a bend, 2 cells wide, 13 cells (26 tiles) long
poe(8, 13, 9, 19, '.'); poe(8, 19, 13, 20, '.'); poe(12, 20, 13, 25, '.');
// hall 19 x 17 cells (the Dullahan 1.5x is 12 x 14 inside): four corner daises at +2 with two-cell stairs, four columns
poe(1, 26, 19, 42, '.');
for (const x of [1, 17]) { poe(x, 26, x + 2, 27, '-'); poe(x, 41, x + 2, 42, '-'); poe(x, 28, x + 2, 29, '#'); poe(x, 39, x + 2, 40, '#'); G[28][x + 1] = G[29][x + 1] = '^'; G[39][x + 1] = G[40][x + 1] = 'v'; }
for (const [x, z] of [[6, 32], [13, 34], [8, 37], [15, 36]]) G[z][x] = 'o';
poe(20, 33, 21, 34, '.'); // the tunnel out
// the open clearing (reference h2, Fernando, Nov 18): grass, the trail, the river, the house, trees only at the edge
const sorte = sorteio(11);
for (let z = 0; z < ALTA; z++) for (let x = 22; x < FL; x++) {
  let L = ',';
  if (noRio(x, z)) L = z === PONTE ? 'b' : 'r';
  else if (naCasa(CASA, x, z)) L = 'H';
  else if (naTrilha(x, z)) L = ':';
  else if (z === 0 || z === ALTA - 1 || x === FL - 1) L = 'T';
  else if (![-1, 1].some((d) => noRio(x + d, z))) {
    const s = sorte(), borda = z <= 2 || z >= ALTA - 3 || x >= FL - 3 || (x <= 24 && Math.abs(z - 33.5) > 3);
    if (borda ? s < 0.5 : SOLTAS.includes(x + ',' + z)) L = 'T';
    else if (s > (borda ? 0.93 : 0.995) && !naCasa({ x0: CASA.x0 - 4, x1: CASA.x1 + 4, z0: CASA.z0 - 4, z1: CASA.z1 + 4 }, x, z)) L = 'R'; // no boulder against the house
  }
  G[z][x] = L;
}
// the bridge reaches one cell onto each bank, so both ends rest on dry ground
{ const l = G[PONTE], a = l.indexOf('b'), b = l.lastIndexOf('b'); l[a - 1] = l[b + 1] = 'b'; }
poe(DENTRO.x0 / CEL, DENTRO.z0 / CEL, DENTRO.x1 / CEL - 1, DENTRO.z1 / CEL - 1, 'h'); // the house's inside
const SPAWNS = { aliados: [{ x: 9, z: 3 }, { x: 10, z: 3 }, { x: 11, z: 3 }, { x: 12, z: 3 }], inimigos: [{ x: 9, z: 31 }, { x: 11, z: 31 }, { x: 30, z: 20 }, { x: 55, z: 30 }] };
for (const s of SPAWNS.inimigos) if (G[s.z][s.x] === 'T' || G[s.z][s.x] === 'R') G[s.z][s.x] = ',';
const TEXTO = G.map((l) => l.join(''));
const letra = (cx, cz) => (cx < 0 || cz < 0 || cx >= LARG || cz >= ALTA ? '#' : TEXTO[cz][cx]);

// ---- heights (tiles) ------------------------------------------------------------------------------------------------
const PONTE_X = (() => { const l = TEXTO[PONTE]; return [l.indexOf('b') * CEL, (l.lastIndexOf('b') + 1) * CEL]; })();
function altura(x, z) {
  // a gentle meadow: about 0.6 +- 0.45 tiles, much flatter than the old forest
  let h = CLAREIRA + 0.35 * ruido(x / 18, z / 18) + 0.12 * ruido(x / 6 + 9, z / 6 + 4);
  h *= lisa(1, 12, Math.hypot(x - 44, z - 68)); // 0 at the tunnel mouth (the hall's floor), rising over 12 tiles
  const dc = Math.hypot(Math.max(CASA.x0 - x, 0, x - CASA.x1), Math.max(CASA.z0 - z, 0, z - CASA.z1));
  h = CLAREIRA + (h - CLAREIRA) * lisa(0, 6, dc); // flat around the house
  // the channel: a steep bed under the water (the surface 1.75 tiles from the centre, about 3.5 tiles wide), then a bank
  // a wader climbs, a straight slope over 1.6 tiles (Nov 18: it was a 0.6-tile cliff, and the walk's 0.6 step rule
  // stopped him at the edge of the water)
  const d = Math.abs(x - RIO(z / CEL) * CEL);
  if (d < 1.75) h = -0.8 + (AGUA_Y + 0.8) * lisa(1.1, 1.75, d);
  else if (d < 3.35) h = AGUA_Y + ((h - AGUA_Y) * (d - 1.75)) / 1.6;
  return h;
}
// the bridge deck: from bank to bank with a low arch
const ponte = (x, z) => { const t = Math.min(1, Math.max(0, (x - PONTE_X[0]) / (PONTE_X[1] - PONTE_X[0]))); return altura(PONTE_X[0], z) * (1 - t) + altura(PONTE_X[1], z) * t + 0.35 * Math.sin(Math.PI * t); };
function seco(x, z, L) {
  if (!FORA.includes(L)) return undefined;
  // in the water (river and the drowned edge of its banks) the feet stay just under the surface, not on the bed
  return L === 'h' || L === 'H' ? PISO_CASA : L === 'b' ? ponte(x, z) : Math.max(altura(x, z), AGUA_Y - PE_NA_AGUA);
}
// wading: outdoors, off the bridge and the house, where the ground is under the surface; with y, only while the feet
// are in it (a jump over the water is dry). The page slows the walker and prices route steps by it.
const molha = (x, z, y) => { const L = letra(Math.floor(x / CEL), Math.floor(z / CEL)); return FORA.includes(L) && !'bhH'.includes(L) && altura(x, z) < AGUA_Y && (y === undefined || y <= AGUA_Y + 0.1); };

// ---- the house in its own tiles (0..16 x 0..12): walls with windows and door, furniture --------------------------------
// [axis of the line, its coordinate, from, to, openings [from, to, y0, y1], outward normal]; a window on every wall
// so every hour has one the sun shines into. Windows 2.2 wide and 2.5 tall: at 1.6 x 1.6 the wall's depth, the sill
// and the cross let only a 0.2-tile sliver of sun onto the floor (measured by rays, Nov 18)
const JAN = [1.4, 3.9], CW = CASA.x1 - CASA.x0, CD = CASA.z1 - CASA.z0;
const PAREDES = [
  ['x', 0, 0, CD, [[PORTA.z0 - CASA.z0, PORTA.z1 - CASA.z0, 0, PORTA.alto], [8.2, 10.4, ...JAN]], -1],
  ['x', CW, 0, CD, [[2.4, 4.6, ...JAN], [7.6, 9.8, ...JAN]], 1],
  ['z', 0, 0, CW, [[11.8, 14, ...JAN]], -1],
  ['z', CD, 0, CW, [[3.4, 5.6, ...JAN], [10.4, 12.6, ...JAN]], 1],
];
// the same walls placed on one house (world tiles)
const paredesDe = (C) => PAREDES.map(([e, c, a, b, ab, s]) => { const [oc, oa] = e === 'x' ? [C.x0, C.z0] : [C.z0, C.x0]; return [e, c + oc, a + oa, b + oa, ab.map(([p, q, y0, y1]) => [p + oa, q + oa, y0, y1]), s]; });
// inside (g1/g2): fireplace on the north wall, the bed beside it under the window, table and stools in the middle,
// chest by the south wall; footprints that block [x0, z0, x1, z1] in world tiles
const MOVEIS = [[1, 0, 5, 1.7], [8.5, 0, 10.5, 3.8], [8.8, 6.8, 11.2, 8.2], [4.3, 10.6, 5.7, 12]].map(([a, b, c, d]) => [a + DENTRO.x0, b + DENTRO.z0, c + DENTRO.x0, d + DENTRO.z0]);
const MEIA = 0.35; // half the wall thickness plus a margin: a foot point closer than this to a wall line is blocked
const naCaixa = (C, x, z, m) => x > C.x0 - m && x < C.x1 + m && z > C.z0 - m && z < C.z1 + m;
const noMovel = (x, z) => MOVEIS.some(([a, b, c, d]) => x > a && x < c && z > b && z < d);
// the outside house is solid; inside, the walls' own thickness and the furniture
const bloqueia = (x, z) => naCaixa(CASA, x, z, MEIA) || (naCaixa(DENTRO, x, z, 1) && !naCaixa(DENTRO, x, z, -MEIA)) || noMovel(x, z);
// a route step into or out of a cell whose centre stands in the furniture (the walls are the grid's own rock cells)
const corta = (c, n) => [c, n].some(([cx, cz]) => noMovel(cx * CEL + 1, cz * CEL + 1));

// ---- torches (18 at most: every one is a real light looped per pixel on the characters) ------------------------------
// a wall torch on the first rock side of the cell
const naParede = (cx, cz) => { for (const [dx, dz] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (letra(cx + dx, cz + dz) === '#') return { cx, cz, dx, dz }; return null; };
const TOCHAS = [
  { cx: 8, cz: 8, braseiro: true }, { cx: 14, cz: 6, braseiro: true }, naParede(1, 7), naParede(20, 8), naParede(10, 14),
  naParede(8, 16), naParede(13, 23),
  { cx: 2, cz: 26, braseiro: true }, { cx: 18, cz: 26, braseiro: true }, { cx: 2, cz: 42, braseiro: true }, { cx: 18, cz: 42, braseiro: true },
  naParede(1, 33), naParede(19, 30), naParede(10, 26), naParede(10, 42),
  { cx: 21, cz: 33, dx: 0, dz: -1 }, // at the tunnel mouth
  { cx: 83, cz: 20, braseiro: true }, // the fireplace, inside the house
  { cx: 88, cz: 25, dx: 0, dz: 1 }, // inside the house, on the south wall
].filter(Boolean);


export const PLANTAS = {
  mundo: {
    nome: 'Mundo: caverna, corredor, salão, clareira, rio e casa',
    texto: TEXTO, teto: TETO, tochas: TOCHAS, spawns: SPAWNS,
    agua: { poca: [], fosso: [] }, // no ford since the clearing (h2 has only the bridge)
    fumaca: [{ cx: 2, cz: 26 }, { cx: 18, cz: 26 }, { cx: 2, cz: 42 }, { cx: 18, cz: 42 }],
    sol: true, fora: FORA,
    pisa: (L) => (FORA.includes(L) ? ANDA_FORA.includes(L) : undefined),
    seco, bloqueia, corta, molha, montar,
  },
};

// =====================================================================================================================
// Everything drawn: built once the page has its scene, lights and torches. ctx is the page's (see the call there).
async function montar(ctx) {
  const T = ctx.THREE, cena = ctx.cena, r = ctx.r, Q = ctx.Q;
  const v3 = (x, y, z) => new T.Vector3(x, y, z);

  // ---- textures: ?texmundo=misto|gemini|pattern|vs; per kind the set's file when it has one, else the VS crop ----
  // No probing: a missing file is a 404 in the console. Pattern Diffusion names its files with hyphens and has no
  // cave floor and no water. Gemini's 512 files where they are 512; the four that came out 493-494 use their 256
  // copy (three r117 on WebGL1 resizes a repeating texture that is not a power of two, with a console warning).
  // misto, the default (Fernando, Nov 18): Gemini's grass, leaves, roof, rock and stone floor, the VS crops for the rest.
  const TIPOS = ['rocha', 'parede_caverna', 'chao_caverna', 'chao_pedra', 'relva', 'terra', 'casca', 'folhagem', 'madeira', 'telhado', 'piso_tabua', 'agua'];
  const PATTERN = { rocha: 'rocha-caverna', parede_caverna: 'parede-caverna', chao_pedra: 'chao-pedra', relva: 'relva', terra: 'terra', casca: 'casca', folhagem: 'folhagem', madeira: 'madeira', telhado: 'telhado', piso_tabua: 'piso-tabua' };
  const GEMINI = { ...Object.fromEntries(TIPOS.map((t) => [t, t + '.png'])), rocha: 'rocha-256.png', parede_caverna: 'parede_caverna-256.png', chao_caverna: 'chao_caverna-256.png', chao_pedra: 'chao_pedra-v2-256.png' };
  const MISTO = ['relva', 'folhagem', 'telhado', 'rocha', 'chao_pedra'];
  const CONJ = ['misto', 'gemini', 'pattern', 'vs'].includes(Q.get('texmundo')) ? Q.get('texmundo') : 'misto';
  const carrega = (u) => new Promise((ok, erro) => new T.TextureLoader().load(u, ok, undefined, erro));
  const fontes = {};
  const caminhos = (t) => [...(CONJ === 'pattern' && PATTERN[t] ? [`pattern/${PATTERN[t]}-1-256.png`] : []), ...(CONJ === 'gemini' || (CONJ === 'misto' && MISTO.includes(t)) ? [`gemini/${GEMINI[t]}`] : []), `vs/${t}.png`];
  const tex = Object.fromEntries(await Promise.all(TIPOS.map(async (t) => {
    let x = null;
    for (const c of caminhos(t)) { try { x = await carrega('./sala-tex/mundo/' + c); fontes[t] = c; break; } catch { /* next one */ } }
    if (!x) { x = new T.DataTexture(new Uint8Array([90, 90, 90]), 1, 1, T.RGBFormat); fontes[t] = 'nenhum'; }
    // crisp texels up close (the page's PSX look), mipmaps and anisotropy so the far forest does not shimmer
    x.wrapS = x.wrapT = T.RepeatWrapping; x.magFilter = T.NearestFilter; x.minFilter = T.LinearMipmapLinearFilter; x.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy()); x.needsUpdate = true;
    return [t, x];
  })));

  // ---- materials ----------------------------------------------------------------------------------------------------
  // Per-pixel Phong for everything here: three applies each light's own shadow to that light only in Phong (the
  // room's Lambert multiplies every shadow into one mask, so a roof's sun shadow would black out the fireplace too).
  // `ceu` scales the sky light (hemisphere): 1 outside, less under a roof, 0 in the cave, where the sun is cut too.
  function fosca(t, { ceu = 1, bump = 0.04, ...extra } = {}) {
    const m = new T.MeshPhongMaterial({ map: tex[t], bumpMap: tex[t], bumpScale: bump, shininess: 8, specular: new T.Color(0.05, 0.05, 0.05), ...extra });
    // ceu goes in as defines, not into the patched text: three caches a program by the patch function's source, so
    // the cave's program (sun removed) was handed to the house floor and walls too (measured: no sun through windows)
    if (ceu < 1) {
      m.defines = { CEU: ceu.toFixed(2), ...(ceu === 0 ? { SEM_SOL: '' } : {}) };
      m.onBeforeCompile = (s) => {
        const c = T.ShaderChunk.lights_fragment_begin.replace('irradiance += getHemisphereLightIrradiance', 'irradiance += CEU * getHemisphereLightIrradiance').replace(/NUM_DIR_LIGHTS > 0/g, 'NUM_DIR_LIGHTS > 0 && !defined( SEM_SOL )');
        s.fragmentShader = s.fragmentShader.replace('#include <lights_fragment_begin>', () => c);
      };
    }
    return m;
  }
  // The room's own Lambert pieces (walls, floor, ceiling, columns, arches of the cave, corridor and hall) never see
  // the sun or the sky: both are dropped from their vertex lighting and the sun's shadow from their shadow mask.
  const semSol = (t) => t.replace(/NUM_DIR_LIGHTS > 0/g, '0 > 1').replace(/NUM_HEMI_LIGHTS > 0/g, '0 > 1').replace(/NUM_DIR_LIGHT_SHADOWS > 0/g, '0 > 1');
  const fechaLambert = (s) => {
    s.vertexShader = s.vertexShader.replace('#include <lights_lambert_vertex>', () => semSol(T.ShaderChunk.lights_lambert_vertex));
    s.fragmentShader = s.fragmentShader.replace('#include <shadowmask_pars_fragment>', () => semSol(T.ShaderChunk.shadowmask_pars_fragment));
  };
  cena.traverse((o) => [].concat(o.material || []).forEach((m) => { if (m.isMeshLambertMaterial) { m.onBeforeCompile = fechaLambert; m.needsUpdate = true; } }));

  // ---- geometry helpers ---------------------------------------------------------------------------------------------
  // merge non-indexed copies of several geometries (position and normal); uvs are planar in world tiles (uvPlano)
  function junta(gs) {
    const qs = gs.map((g) => (g.index ? g.toNonIndexed() : g)), n = qs.reduce((s, q) => s + q.attributes.position.count, 0);
    const p = new Float32Array(n * 3), no = new Float32Array(n * 3), uv = new Float32Array(n * 2); let i = 0, j = 0;
    for (const q of qs) { p.set(q.attributes.position.array, i); no.set(q.attributes.normal.array, i); if (q.attributes.uv) uv.set(q.attributes.uv.array, j); i += q.attributes.position.count * 3; j += q.attributes.position.count * 2; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(no, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.computeBoundingSphere(); return g;
  }
  // a texture laid on the world: the face's dominant axis picks the plane, k tiles per repeat
  function uvPlano(g, k) {
    const P = g.attributes.position, N = g.attributes.normal, uv = new Float32Array(P.count * 2);
    for (let i = 0; i < P.count; i++) {
      const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)), nz = Math.abs(N.getZ(i));
      const [a, b] = ny >= nx && ny >= nz ? [P.getX(i), P.getZ(i)] : nx >= nz ? [P.getZ(i), P.getY(i)] : [P.getX(i), P.getY(i)];
      uv[i * 2] = a / k; uv[i * 2 + 1] = b / k;
    }
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); return g;
  }
  const bx = (w, h, d, x, y, z, ry = 0) => new T.BoxBufferGeometry(w, h, d).rotateY(ry).translate(x, y, z);
  // Two groups: everything outdoors, and the house's inside. Only one shows at a time (the inside while the selected
  // character stands in it): a hidden group casts no sun shadow either, so the trees never shade the inside's windows.
  const gFora = new T.Group(), gCasa = new T.Group(); gCasa.visible = false; cena.add(gFora, gCasa);
  let destino = gFora;
  const malha = (g, m, { lanca = true, recebe = true } = {}) => { const o = new T.Mesh(g, m); o.castShadow = lanca; o.receiveShadow = recebe; destino.add(o); return o; };
  // a mesh from a list of quads [[x,y,z] x4]
  function quads(lista) {
    const p = []; for (const q of lista) for (const i of [0, 1, 2, 0, 2, 3]) p.push(...q[i]);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
  }
  // a heightfield over [x0,x1] x [z0,z1] every `passo` tiles, only where `usa(x, z)` holds for the quad's centre
  function campo(x0, z0, x1, z1, passo, h, usa, extra) {
    const p = [], e = [];
    for (let z = z0; z < z1; z += passo) for (let x = x0; x < x1; x += passo) {
      if (!usa(x + passo / 2, z + passo / 2)) continue;
      const v = [[x, z + passo], [x + passo, z + passo], [x + passo, z], [x, z]];
      for (const i of [0, 1, 2, 0, 2, 3]) { const [a, b] = v[i]; p.push(a, h(a, b), b); if (extra) e.push(extra(a, b)); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    if (extra) g.setAttribute('mistura', new T.Float32BufferAttribute(e, 1));
    // smooth normals: the same corner gets the same normal (non-indexed, so average by position)
    g.computeVertexNormals(); const P = g.attributes.position, N = g.attributes.normal, soma = new Map();
    for (let i = 0; i < P.count; i++) { const k = P.getX(i) + ',' + P.getZ(i), s = soma.get(k) || [0, 0, 0]; s[0] += N.getX(i); s[1] += N.getY(i); s[2] += N.getZ(i); soma.set(k, s); }
    for (let i = 0; i < P.count; i++) { const s = soma.get(P.getX(i) + ',' + P.getZ(i)), l = Math.hypot(...s) || 1; N.setXYZ(i, s[0] / l, s[1] / l, s[2] / l); }
    return g;
  }
  const celula = (x, z) => letra(Math.floor(x / CEL), Math.floor(z / CEL));
  const sorte = sorteio(23);

  // ---- terrain: grass, with the trail and the river banks in earth (by distance, so the trail curves smoothly) ---------------------------------------------------------
  const solo = (x, z) => Math.max(1 - lisa(1.1, 2.1, CEL * Math.min(...TRILHA.slice(1).map((a, i) => aoSegmento(x / CEL, z / CEL, TRILHA[i], a)))), 1 - lisa(2.1, 2.9, Math.abs(x - RIO(z / CEL) * CEL)));
  const gTerra = uvPlano(campo(44, 0, 128, 88, 1, altura, (x, z) => FORA.includes(celula(x, z)), solo), 4);
  const mTerra = fosca('relva', { bump: 0.05 });
  mTerra.onBeforeCompile = (s) => {
    s.uniforms.mapa2 = { value: tex.terra };
    s.vertexShader = s.vertexShader.replace('void main() {', 'attribute float mistura;\nvarying float vMist;\nvoid main() {\n vMist = mistura;');
    s.fragmentShader = s.fragmentShader.replace('void main() {', 'uniform sampler2D mapa2;\nvarying float vMist;\nvoid main() {')
      .replace('#include <map_fragment>', 'vec4 texelColor = mix( texture2D( map, vUv ), texture2D( mapa2, vUv ), smoothstep( 0.2, 0.8, vMist ) );\n diffuseColor *= mapTexelToLinear( texelColor );');
  };
  const terreno = malha(gTerra, mTerra, { lanca: false });

  // ---- mountain over the cave, corridor and hall: hides them from outside, fades when a character is inside --------------
  const fora = (cx, cz) => FORA.includes(letra(cx, cz));
  const pico = (a, b) => {
    const cs = [[a - 1, b - 1], [a, b - 1], [a - 1, b], [a, b]], foraK = cs.some(([x, z]) => fora(x, z)), dentro = cs.some(([x, z]) => !fora(x, z) && letra(x, z) !== '#');
    if (foraK && dentro) return TETO + 0.5; // the tunnel's mouth: an overhang, not a slope
    return foraK ? altura(a * CEL, b * CEL) : TETO + 1.5 + 1.3 * (ruido(a * 0.4, b * 0.4) + 1);
  };
  const gMonte = uvPlano(campo(0, 0, 44, 88, CEL, (x, z) => pico(x / CEL, z / CEL), (x, z) => !fora(Math.floor(x / CEL), Math.floor(z / CEL))), 4);
  const lintel = uvPlano(quads([[[44, 7, 70], [44, 7, 66], [44, TETO + 0.5, 66], [44, TETO + 0.5, 70]]]), 4);
  const mMonte = fosca('rocha', { side: T.DoubleSide, bump: 0.08 });
  const monte = malha(junta([gMonte, lintel]), mMonte);

  // ---- cave dressing: rock floor, stalactites, stalagmites, boulders, rough rock pillars on the islands ---------------
  const naCaverna = (cx, cz) => cz <= 25 && cx <= 21 && letra(cx, cz) === '.';
  const pedras = [], chaoCav = [];
  // roughen around the piece's own axis (the pieces arrive already moved into place)
  const rugosa = (g, k) => { g.computeBoundingBox(); const c = g.boundingBox.getCenter(v3(0, 0, 0)), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), n = 1 + k * ruido(x * 1.7 + y, z * 1.7 - y); P.setXYZ(i, c.x + (x - c.x) * n, y, c.z + (z - c.z) * n); } g.computeVertexNormals(); return g; };
  for (let cz = 0; cz < 26; cz++) for (let cx = 0; cx < 22; cx++) {
    if (!naCaverna(cx, cz)) continue;
    const x0 = cx * CEL, z0 = cz * CEL; chaoCav.push([[x0, 0.015, z0 + CEL], [x0 + CEL, 0.015, z0 + CEL], [x0 + CEL, 0.015, z0], [x0, 0.015, z0]]);
    const parede = [[0, -1], [-1, 0], [1, 0], [0, 1]].some(([a, b]) => letra(cx + a, cz + b) === '#');
    for (let k = 0; k < 2; k++) if (sorte() < 0.45) { const l = 0.8 + sorte() * 2, rr = 0.15 + sorte() * 0.3; pedras.push(rugosa(new T.ConeBufferGeometry(rr, l, 6, 2).rotateX(Math.PI).translate(x0 + sorte() * CEL, TETO - l / 2, z0 + sorte() * CEL), 0.2)); }
    if (parede && sorte() < 0.5) { const l = 0.6 + sorte() * 1.6; pedras.push(rugosa(new T.ConeBufferGeometry(0.25 + sorte() * 0.35, l, 6, 2).translate(x0 + 0.3 + sorte() * 1.4, l / 2, z0 + 0.3 + sorte() * 1.4), 0.25)); }
    if (parede && sorte() < 0.3) { const rr = 0.4 + sorte() * 0.6; pedras.push(rugosa(new T.IcosahedronBufferGeometry(rr, 1).scale(1, 0.7, 1).translate(x0 + 0.4 + sorte() * 1.2, rr * 0.4, z0 + 0.4 + sorte() * 1.2), 0.25)); }
  }
  for (const [x, z] of ILHAS) pedras.push(rugosa(new T.CylinderBufferGeometry(1.15, 1.45, TETO, 9, 8).translate(x * CEL + 1, TETO / 2, z * CEL + 1), 0.18));
  const mCav = fosca('parede_caverna', { ceu: 0, bump: 0.1 });
  malha(uvPlano(junta(pedras), 3), mCav);
  malha(uvPlano(quads(chaoCav), 3), fosca('chao_caverna', { ceu: 0, bump: 0.06 }), { lanca: false });
  // the cave's and corridor's wall runs take the cave rock (the hall keeps the page's dungeon stone)
  for (const f of ctx.fadeaveis) if (Math.max(f.a[1], f.b[1]) <= 52 && Math.max(f.a[0], f.b[0]) <= 44) { f.obj.material.map = tex.parede_caverna; f.obj.material.needsUpdate = true; }

  // ---- trees and boulders ---------------------------------------------------------------------------------------------
  const troncos = [], copas = [], rochas = [];
  for (let cz = 0; cz < ALTA; cz++) for (let cx = 22; cx < FL; cx++) {
    const L = letra(cx, cz), x = cx * CEL + 0.5 + sorte(), z = cz * CEL + 0.5 + sorte(), y = altura(x, z) - 0.2, s = 0.8 + sorte() * 0.5;
    if (L === 'R') { const rr = (0.8 + sorte() * 0.6) * s; rochas.push(rugosa(new T.IcosahedronBufferGeometry(rr, 1).scale(1, 0.65, 1.1).rotateY(sorte() * 6).translate(x, y + rr * 0.3, z), 0.2)); }
    if (L !== 'T') continue;
    if (sorte() < 0.6) { // pine: three stacked cones
      troncos.push(new T.CylinderBufferGeometry(0.18 * s, 0.3 * s, 3 * s, 6).translate(x, y + 1.5 * s, z));
      [[2.1, 3.2, 2.2], [1.65, 2.8, 4.2], [1.1, 2.4, 6]].forEach(([rr, h, b]) => copas.push(new T.ConeBufferGeometry(rr * s, h * s, 8).translate(x, y + (b + h / 2) * s, z)));
    } else { // broadleaf: a trunk and three rough blobs
      troncos.push(new T.CylinderBufferGeometry(0.22 * s, 0.38 * s, 4.6 * s, 7).translate(x, y + 2.3 * s, z));
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + sorte(), rr = (1.6 + sorte() * 0.7) * s; copas.push(rugosa(new T.IcosahedronBufferGeometry(rr, 1).translate(x + Math.cos(a) * 0.9 * s, y + (5 + sorte() * 1.6) * s, z + Math.sin(a) * 0.9 * s), 0.18)); }
    }
  }
  const nArvores = troncos.length;
  malha(uvPlano(junta(troncos), 1.5), fosca('casca', { bump: 0.1 }));
  malha(uvPlano(junta(copas), 2.5), fosca('folhagem', { bump: 0.08 }));
  malha(uvPlano(junta(rochas), 2.5), fosca('rocha', { bump: 0.1 }));

  // ---- the river: a flowing surface of our own (agua.js has no current), 6 tiles of strip; the banks hide the rest ----
  const rioP = [], rioB = [];
  for (let z = 0; z < 88; z++) {
    for (let i = 0; i < 6; i++) {
      const xs = (zz) => RIO(zz / CEL) * CEL, q = [[xs(z) - 3 + i, z], [xs(z) - 2 + i, z], [xs(z + 1) - 2 + i, z + 1], [xs(z + 1) - 3 + i, z + 1]];
      for (const k of [0, 2, 1, 0, 3, 2]) { const [a, b] = q[k]; rioP.push(a, AGUA_Y, b); rioB.push(Math.abs(a - xs(b)) / 1.8); }
    }
  }
  const gRio = new T.BufferGeometry(); gRio.setAttribute('position', new T.Float32BufferAttribute(rioP, 3)); gRio.setAttribute('borda', new T.Float32BufferAttribute(rioB, 1));
  // ANEIS ring slots born under a wader's feet (x, z, birth time, strength), drawn by this shader; see the splashes below
  const ANEIS = 8;
  const uRio = T.UniformsUtils.merge([T.UniformsLib.fog, { tempo: { value: 0 }, zen: { value: new T.Color() }, hor: { value: new T.Color() }, solCor: { value: new T.Color() }, solDir: { value: v3(0, 1, 0) }, ceuI: { value: 1 }, aneis: { value: Array.from({ length: ANEIS }, () => new T.Vector4(0, 0, -99, 0)) } }]);
  const rio = new T.Mesh(gRio, new T.ShaderMaterial({ uniforms: uRio, fog: true, transparent: true, depthWrite: false, vertexShader: `
    attribute float borda; varying vec3 vM; varying float vB;
    #include <fog_pars_vertex>
    void main() { vM = (modelMatrix * vec4(position, 1.0)).xyz; vB = borda; vec4 mvPosition = viewMatrix * vec4(vM, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
    }`, fragmentShader: `
    #define ANEIS ${ANEIS}
    uniform float tempo, ceuI; uniform vec3 zen, hor, solCor, solDir; uniform vec4 aneis[ANEIS]; varying vec3 vM; varying float vB;
    #include <fog_pars_fragment>
    // the rings: each grows 1.5 tiles a second for 1.4 s and fades; x = the ripple's height, y = its bright crest
    vec2 anel(vec2 p) {
      vec2 s = vec2(0.0);
      for (int i = 0; i < ANEIS; i++) {
        vec4 a = aneis[i]; float t = tempo - a.z; if (t < 0.0 || t > 1.4) continue;
        float d = length(p - a.xy) - (0.25 + 1.5 * t), k = a.w * (1.0 - t / 1.4) * exp(-d * d * 30.0);
        s += vec2(k * sin(d * 14.0), k);
      }
      return s;
    }
    float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + 1.0), f.x), f.y); }
    // the current runs south (+z): two layers of ripples dragged downstream at different speeds
    float onda(vec2 p) { return n(p * vec2(0.9, 0.45) - vec2(0.0, tempo * 1.2)) + 0.5 * n(p * vec2(2.1, 1.2) - vec2(tempo * 0.15, tempo * 2.0)) + 0.25 * n(p * 4.3 - vec2(0.0, tempo * 2.6)); }
    void main() {
      vec2 p = vM.xz, a0 = anel(p); float e = 0.08, o = onda(p) + a0.x;
      vec3 nrm = normalize(vec3(-(onda(p + vec2(e, 0.0)) + anel(p + vec2(e, 0.0)).x - o) / e * 0.25, 1.0, -(onda(p + vec2(0.0, e)) + anel(p + vec2(0.0, e)).x - o) / e * 0.25));
      vec3 V = normalize(cameraPosition - vM), R = reflect(-V, nrm);
      float fres = 0.05 + 0.95 * pow(1.0 - max(dot(nrm, V), 0.0), 4.0);
      vec3 ceu = mix(hor, zen, clamp(R.y * 1.5, 0.0, 1.0));
      vec3 c = mix(vec3(0.02, 0.05, 0.06) * (0.3 + ceuI) + hor * 0.08, ceu, fres);
      c += solCor * pow(max(dot(R, solDir), 0.0), 180.0) * 2.5 + solCor * pow(max(dot(R, solDir), 0.0), 12.0) * 0.08;
      float esp = smoothstep(0.7, 1.0, vB) * smoothstep(0.45, 0.85, n(p * 3.0 - vec2(0.0, tempo * 1.8))); // foam where the bank breaks the flow
      c = mix(c, (hor * 0.6 + zen * 0.4) * (0.4 + ceuI), esp * 0.5);
      c = mix(c, (hor * 0.5 + vec3(0.5)) * (0.3 + ceuI), clamp(a0.y * 0.7, 0.0, 0.7)); // the ring's crest, foam-light
      gl_FragColor = vec4(c, mix(0.88, 0.6, smoothstep(0.75, 1.0, vB)));
      #include <fog_fragment>
    }` }));
  rio.frustumCulled = false; gFora.add(rio);
  // Splashes when a character wades (Fernando, Nov 18): agua.js's look (a ring under the feet, drops thrown up and
  // falling back), not its code: its rings and drops live inside its own box of water, and the river is a curved strip.
  const GOTAS = 160, aneis = uRio.aneis.value, gp = new Float32Array(GOTAS * 3).fill(-1e6), gv = new Float32Array(GOTAS * 3);
  let proxAnel = 0, proxGota = 0, vivas = 0;
  const gotasG = new T.BufferGeometry(); gotasG.setAttribute('position', new T.BufferAttribute(gp, 3)); // shares gp (Float32BufferAttribute copies it)
  const gotas = new T.Points(gotasG, new T.PointsMaterial({ size: 0.16, transparent: true, opacity: 0.9, depthWrite: false })); gotas.frustumCulled = false; gFora.add(gotas);
  const anel = (x, z, forca) => { aneis[proxAnel].set(x, z, tempo, forca); proxAnel = (proxAnel + 1) % ANEIS; };
  function respinga(x, z, quantas, forca) {
    for (let q = 0; q < quantas; q++) {
      // born outside the robe's hem
      const i = proxGota * 3, a = Math.random() * 6.283, rr = 0.5 + Math.random() * 0.3, f = 0.8 + Math.random() * 1.2; proxGota = (proxGota + 1) % GOTAS;
      gp[i] = x + Math.cos(a) * rr; gp[i + 1] = AGUA_Y + 0.02; gp[i + 2] = z + Math.sin(a) * rr; gv[i] = Math.cos(a) * f; gv[i + 1] = (2 + Math.random() * 2.4) * forca; gv[i + 2] = Math.sin(a) * f;
    }
  }
  const pes = new Map(); // per character: in the water last frame, time to the next ring, last position
  function respingos(dt) {
    for (const u of unidades) {
      const p = u.g.position, w = molha(p.x, p.z, p.y), s = pes.get(u) || { dentro: false, t: 0, x: p.x, z: p.z }, anda = dt > 0 && Math.hypot(p.x - s.x, p.z - s.z) / dt > 0.3;
      s.t -= dt;
      if (w && !s.dentro) { anel(p.x, p.z, 1); respinga(p.x, p.z, 18, 1); s.t = 0.3; } // in: a big ring and a spray
      else if (w && s.t <= 0) { anel(p.x, p.z, anda ? 0.6 : 0.25); if (anda) respinga(p.x, p.z, 4, 0.6); s.t = anda ? 0.3 : 1.3; } // a ring a step, a slow one standing
      else if (!w && s.dentro) respinga(s.x, s.z, 8, 0.7); // out: what the legs lift falls back
      s.dentro = w; s.x = p.x; s.z = p.z; pes.set(u, s);
    }
    vivas = 0;
    for (let i = 0; i < GOTAS * 3; i += 3) {
      if (gp[i + 1] < -1e5) continue;
      gv[i + 1] -= 12 * dt; gp[i] += gv[i] * dt; gp[i + 1] += gv[i + 1] * dt; gp[i + 2] += gv[i + 2] * dt; // agua.js's gravity
      if (gp[i + 1] < AGUA_Y && gv[i + 1] < 0) gp[i + 1] = -1e6; else vivas++;
    }
    gotasG.attributes.position.needsUpdate = true;
  }

  // ---- the bridge -------------------------------------------------------------------------------------------------------
  const mMadeira = fosca('madeira', { bump: 0.06 });
  const tabuas = [], zp0 = PONTE * CEL, zp1 = (PONTE + 1) * CEL;
  for (let x = PONTE_X[0] - 0.6; x < PONTE_X[1] + 0.6; x += 0.5) { const y = ponte(Math.min(Math.max(x + 0.25, PONTE_X[0]), PONTE_X[1]), (zp0 + zp1) / 2); tabuas.push(bx(0.46, 0.18, zp1 - zp0 + 0.4, x + 0.25, y - 0.09, (zp0 + zp1) / 2)); }
  for (const z of [zp0 + 0.15, zp1 - 0.15]) {
    for (let x = PONTE_X[0]; x <= PONTE_X[1] + 0.01; x += (PONTE_X[1] - PONTE_X[0]) / 4) { const y = ponte(x, z); tabuas.push(bx(0.22, 1.5, 0.22, x, y + 0.6, z)); tabuas.push(bx(0.3, 3, 0.3, x, y - 1.6, z)); }
    for (let x = PONTE_X[0]; x < PONTE_X[1]; x += 0.5) { const y = (ponte(x, z) + ponte(x + 0.5, z)) / 2; tabuas.push(bx(0.52, 0.12, 0.14, x + 0.25, y + 1.3, z)); }
  }
  const pontes = malha(uvPlano(junta(tabuas), 2), mMadeira);

  // ---- the house, built twice from the same walls ----------------------------------------------------------------------
  // Outside (in the clearing, group gFora): closed, roof and chimney on, glass in the windows, dark behind the door.
  // Inside (group gCasa, its own room 72 tiles east): furniture, open windows, no visible roof. Inside, each outer
  // wall fades when the camera is outside its plane; the roof and gables never draw colour there, but still cast
  // the sun's shadow (colorWrite off, not visible = false), so the sun comes in only through the windows.
  const fadas = [];
  const fada = (m, quer, op = 1) => { const f = { m, op, quer }; fadas.push(f); m.opacity = op; m.transparent = op < 1; m.depthWrite = op === 1; m.colorWrite = op > 0; return f; };
  const quadrosJanela = [], P0 = PISO_CASA;
  const vidro = new T.MeshBasicMaterial({ color: 0x000000 }); // outside windows: dark by day, lamp-lit at night (poeHora)
  const claros = []; // what the inside's windows and door show: the hour's sky, one material per wall so it fades with it
  let dentro = false;
  function casa(C, porDentro) {
    destino = porDentro ? gCasa : gFora;
    for (const [eixo, c, a, b, ab, sai] of paredesDe(C)) {
      const vidros = [], cortes = [...new Set([a, b, ...ab.flatMap((o) => [o[0], o[1]])])].sort((p, q) => p - q), ps = [];
      for (let i = 0; i + 1 < cortes.length; i++) {
        const s0 = cortes[i], s1 = cortes[i + 1], m = (s0 + s1) / 2, o = ab.find((q) => m > q[0] && m < q[1]);
        const faixas = o ? [[0, o[2]], [o[3], PE]].filter(([y0, y1]) => y1 - y0 > 0.01) : [[0, PE]];
        for (const [y0, y1] of faixas) { const L = s1 - s0 + (o ? 0 : 0.3), y = P0 + (y0 + y1) / 2; ps.push(eixo === 'x' ? bx(0.3, y1 - y0, L, c, y, m) : bx(L, y1 - y0, 0.3, m, y, c)); }
        if (o && o[2] > 0) { // window: a frame and a cross, the sill sticking out
          const w = s1 - s0, yc = P0 + (o[2] + o[3]) / 2, hh = o[3] - o[2], em = (W, H, D, u, y, d = 0) => (eixo === 'x' ? bx(D, H, W, c + d, y, u) : bx(W, H, D, u, y, c + d));
          ps.push(em(0.1, hh, 0.36, m, yc), em(w, 0.1, 0.36, m, yc), em(w + 0.3, 0.12, 0.6, m, P0 + o[2] - 0.06));
          if (porDentro) { quadrosJanela.push({ eixo, c, s0, s1, y0: P0 + o[2], y1: P0 + o[3], sai }); vidros.push(em(w, hh, 0.02, m, yc, sai * 0.8)); }
          else vidros.push(em(w, hh, 0.04, m, yc));
        }
      }
      if (porDentro && ab.some((o) => o[2] === 0)) vidros.push(bx(0.02, PORTA.alto, PORTA.z1 - PORTA.z0, C.x0 - 0.8, P0 + PORTA.alto / 2, PORTA_Z)); // the sky behind the door
      const mat = fosca('madeira', { ceu: porDentro ? 0.7 : 1, bump: 0.06 }); malha(uvPlano(junta(ps), 2), mat);
      // the inside's sky panes cast nothing, or they would shut the sun out of the very windows they stand behind
      const mv = porDentro ? new T.MeshBasicMaterial({ fog: false }) : vidro; if (porDentro) claros.push(mv);
      if (vidros.length) malha(junta(vidros), mv, { lanca: !porDentro });
      if (porDentro) { const quer = () => ctx.sel && dentro && (eixo === 'x' ? (ctx.cam.position.x - c) * sai : (ctx.cam.position.z - c) * sai) > 0; fada(mat, quer); fada(mv, quer); }
    }
    const cx = (C.x0 + C.x1) / 2, cz = (C.z0 + C.z1) / 2;
    // floor (planks) inside; a stone footing and a step at the door outside
    const piso = porDentro ? malha(uvPlano(bx(CW + 0.3, 0.2, CD + 0.3, cx, P0 - 0.1, cz), 2), fosca('piso_tabua', { ceu: 0.3, bump: 0.04 }), { lanca: false }) : null;
    if (!porDentro) malha(uvPlano(junta([bx(CW + 0.6, 1.6, CD + 0.6, cx, P0 - 0.8, cz), bx(1.4, P0, 2.4, C.x0 - 0.7, P0 / 2 - 0.05, PORTA_Z)]), 2), fosca('rocha', { bump: 0.08 }), { lanca: false });
    // roof: two slopes along x, gables, and outside the chimney over the inside's fireplace
    const BEIRA = P0 + PE, CUME = BEIRA + 3.5, AB = 0.8, inc = (CUME - BEIRA) / (cz - C.z0);
    const xa = C.x0 - AB, xb = C.x1 + AB, za = C.z0 - AB, zb = C.z1 + AB, yb = BEIRA - AB * inc;
    const gTelhado = uvPlano(quads([[[xa, yb, za], [xb, yb, za], [xb, CUME, cz], [xa, CUME, cz]], [[xa, CUME, cz], [xb, CUME, cz], [xb, yb, zb], [xa, yb, zb]]]), 2);
    const oitao = (x) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([x, BEIRA, C.z0, x, BEIRA, C.z1, x, CUME, cz], 3)); g.computeVertexNormals(); return g; };
    const mTelhado = fosca('telhado', { side: T.DoubleSide, bump: 0.06 }), mOitao = fosca('madeira', { side: T.DoubleSide, ceu: 0.7 });
    malha(gTelhado, mTelhado); malha(uvPlano(junta([oitao(C.x0), oitao(C.x1)]), 2), mOitao);
    if (porDentro) for (const m of [mTelhado, mOitao]) fada(m, () => true, 0);
    else malha(uvPlano(bx(2, 6, 1.4, C.x0 + 3, BEIRA + 2, C.z0 + 0.9), 2), fosca('rocha', { bump: 0.08 }));
    // the door: a leaf on a hinge, opened with E or Ação near it
    const dob = new T.Group(); dob.position.set(C.x0, P0, PORTA.z0); destino.add(dob);
    const folha = malha(uvPlano(junta([bx(0.12, PORTA.alto - 0.05, PORTA.z1 - PORTA.z0 - 0.04, 0, PORTA.alto / 2, (PORTA.z1 - PORTA.z0) / 2), bx(0.2, 0.12, 1.2, 0.05, 1.2, 0.8), bx(0.2, 0.12, 1.2, 0.05, 3.2, 0.8)]), 1.5), fosca('madeira', { ceu: porDentro ? 0.7 : 1, bump: 0.06 }));
    destino.remove(folha); dob.add(folha);
    if (!porDentro) malha(bx(0.02, PORTA.alto, PORTA.z1 - PORTA.z0, C.x0 + 1.2, P0 + PORTA.alto / 2, PORTA_Z), new T.MeshBasicMaterial({ color: 0x000000 }), { lanca: false }); // dark behind the open door
    if (porDentro) {
      // fireplace around the brazier the page puts at the cell centre (3, 1), with its stone stack up the wall; bed,
      // mattress, table, stools, chest and two shelves (g1/g2), all in the house's own tiles
      const pedra = [bx(0.8, 3.3, 1.5, 1.4, P0 + 1.65, 0.9), bx(0.8, 3.3, 1.5, 4.6, P0 + 1.65, 0.9), bx(4, 0.9, 1.6, 3, P0 + 3.75, 0.9), bx(4, 0.2, 1.8, 3, P0 + 4.3, 1), bx(2.4, 3.3, 0.3, 3, P0 + 1.65, 0.3), bx(2.2, 1.2, 1.1, 3, P0 + 5, 0.7)];
      malha(uvPlano(junta(pedra).translate(C.x0, 0, C.z0), 2), fosca('chao_pedra', { ceu: 0.3, bump: 0.08 }));
      const banco = (x, z) => new T.CylinderBufferGeometry(0.35, 0.3, 0.8, 8).translate(x, P0 + 0.4, z);
      const moveis = [bx(2.4, 0.15, 1.4, 10, P0 + 1.3, 7.5), ...[[9, 7], [11, 7], [9, 8], [11, 8]].map(([x, z]) => bx(0.15, 1.25, 0.15, x, P0 + 0.62, z)), banco(8.3, 7.5), banco(11.7, 7.5), banco(10, 9.1),
        bx(2, 0.5, 3.6, 9.5, P0 + 0.55, 2), bx(2, 1.2, 0.2, 9.5, P0 + 0.9, 0.2), bx(2, 0.7, 0.15, 9.5, P0 + 0.6, 3.8), bx(1.4, 0.9, 1, 5, P0 + 0.45, 11.3),
        bx(0.4, 0.1, 2.4, 15.6, P0 + 2.6, 6), bx(0.4, 0.1, 2.4, 15.6, P0 + 3.4, 6)];
      malha(uvPlano(junta(moveis).translate(C.x0, 0, C.z0), 1.5), fosca('madeira', { ceu: 0.3, bump: 0.05 }));
      malha(uvPlano(bx(1.8, 0.25, 3.2, C.x0 + 9.5, P0 + 0.9, C.z0 + 2.2), 1.5), fosca('chao_pedra', { ceu: 0.3, color: new T.Color(0.85, 0.75, 0.6) })); // the mattress
    }
    destino = gFora;
    return { piso, dob, t: 0, aberta: false, quem: null, x: C.x0, z: PORTA_Z };
  }
  const portas = { fora: casa(CASA, false), dentro: casa(DENTRO, true) };
  const pisoDentro = portas.dentro.piso;

  // ---- sky, sun, sky light, mist, beams through the windows ----------------------------------------------------------
  const sol = new T.DirectionalLight(0xffffff, 1), alvoSol = new T.Object3D(); sol.target = alvoSol; cena.add(sol, alvoSol);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0006;
  // the shadow box follows the camera target: 64 tiles square at 2048 texels is 32 texels a tile, enough for the
  // window patches; past it nothing is shadowed by the sun (only the forest far off can be that far)
  const LADO_SOL = 32; Object.assign(sol.shadow.camera, { left: -LADO_SOL, right: LADO_SOL, top: LADO_SOL, bottom: -LADO_SOL, near: 1, far: 220 }); sol.shadow.camera.updateProjectionMatrix();
  const ceu = new T.HemisphereLight(0xffffff, 0x000000, 1); cena.add(ceu);
  const uCeu = { zen: { value: new T.Color() }, hor: { value: new T.Color() }, solCor: { value: new T.Color() }, solDir: { value: v3(0, 1, 0) }, estrelas: { value: 0 }, disco: { value: 1 } };
  const domo = new T.Mesh(new T.SphereBufferGeometry(100, 32, 16), new T.ShaderMaterial({ uniforms: uCeu, side: T.BackSide, depthWrite: false, fog: false, vertexShader: `
    varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.99999; }`, fragmentShader: `
    uniform vec3 zen, hor, solCor, solDir; uniform float estrelas, disco; varying vec3 vD;
    float h(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
    void main() {
      vec3 d = normalize(vD); float y = d.y, s = max(dot(d, solDir), 0.0);
      vec3 c = y > 0.0 ? mix(hor, zen, pow(y, 0.55)) : mix(hor, hor * 0.3, clamp(-y * 5.0, 0.0, 1.0));
      c += solCor * (smoothstep(0.9993, 0.9996, s) * 2.0 * disco + pow(s, 14.0) * 0.35 + pow(s, 3.0) * 0.08);
      if (estrelas > 0.0) c += step(0.9975, h(floor(d * 260.0))) * estrelas * smoothstep(0.0, 0.3, y) * (0.5 + 0.5 * h(floor(d * 97.0)));
      gl_FragColor = vec4(c, 1.0);
    }` }));
  domo.renderOrder = -1; domo.frustumCulled = false; gFora.add(domo);
  // Hour (?hora=, Fernando's grill, Nov 18; default late afternoon): sun height and bearing (0 = from the east, 90 = from
  // the south), its colour and strength, the sky light, the sky's colours and the haze colour.
  // Elevations by rays from the house floor to the sun (Nov 18): at 9-11 degrees the forest hid the windows (0 lit
  // points of 704), at 62 the eaves did; 25 / 45 / 25 give 76 / 78 / 107 points, about 5 to 7 tiles of sun inside.
  const HORAS = {
    amanhecer: { el: 25, az: -15, sol: [1, 0.72, 0.5], si: 1.1, ceu: [0.45, 0.52, 0.75], chao: [0.22, 0.18, 0.14], ci: 0.55, zen: '#3b5a8c', hor: '#f2a878', nev: '#9a8a8a', estrelas: 0 },
    meiodia: { el: 45, az: 100, sol: [1, 0.96, 0.88], si: 1.45, ceu: [0.55, 0.65, 0.85], chao: [0.25, 0.22, 0.16], ci: 0.7, zen: '#2f6fc4', hor: '#b7d2ec', nev: '#a8b8c8', estrelas: 0 },
    fimdetarde: { el: 25, az: 195, sol: [1, 0.58, 0.32], si: 1.25, ceu: [0.42, 0.38, 0.58], chao: [0.2, 0.14, 0.1], ci: 0.5, zen: '#26315e', hor: '#e7834f', nev: '#6e5a66', estrelas: 0 },
    noite: { el: 40, az: 140, sol: [0.55, 0.65, 0.95], si: 0.3, ceu: [0.1, 0.13, 0.28], chao: [0.03, 0.03, 0.05], ci: 0.45, zen: '#03050d', hor: '#101a33', nev: '#0c1020', estrelas: 1 },
  };
  let hora = HORAS[Q.get('hora')] ? Q.get('hora') : 'fimdetarde';
  const dirSol = v3(0, 1, 0), corNevoa = new T.Color();
  const feixes = new T.Group(); gCasa.add(feixes);
  const brilhoFeixe = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false });
  const poeiraFeixe = { pts: null, base: null };
  // Light shafts: each window the sun shines into gets a prism from the opening along the light until the floor,
  // drawn additive and fading with length; a few dust specks float inside. The bright patches on the floor are the
  // real shadow map, the prism only stands in for the dusty air.
  function poeFeixes() {
    feixes.clear?.(); while (feixes.children.length) feixes.remove(feixes.children[0]);
    const L = dirSol.clone().negate(), H = HORAS[hora], k = 0.1 * H.si, cor1 = new T.Color(...H.sol).multiplyScalar(k), pos = [], cor0 = [], pts = [];
    const raio = new T.Raycaster(), lancam = []; gCasa.traverse((o) => o.isMesh && o.castShadow && !o.isSkinnedMesh && lancam.push(o));
    if (L.y < -0.02) for (const j of quadrosJanela) {
      const n = j.eixo === 'x' ? v3(j.sai, 0, 0) : v3(0, 0, j.sai); if (L.dot(n) > -0.05) continue; // the sun is behind this wall
      const em = (s, y) => (j.eixo === 'x' ? v3(j.c, y, s) : v3(s, y, j.c));
      // no shaft where trees, the mountain or the eaves hide the sun from this window: 9 rays from just outside it
      let ve = 0; for (let a = 0.1; a < 1; a += 0.4) for (let b = 0.1; b < 1; b += 0.4) { raio.set(em(j.s0 + (j.s1 - j.s0) * a, j.y0 + (j.y1 - j.y0) * b).addScaledVector(n, 0.4), dirSol); if (!raio.intersectObjects(lancam, false).length) ve += 1 / 9; }
      if (!ve) continue; const cor = cor1.clone().multiplyScalar(ve);
      const cs = [em(j.s0, j.y0), em(j.s1, j.y0), em(j.s1, j.y1), em(j.s0, j.y1)], f = cs.map((c) => c.clone().addScaledVector(L, Math.min(16, (c.y - PISO_CASA) / -L.y)));
      for (let i = 0; i < 4; i++) { const a = cs[i], b = cs[(i + 1) % 4], c = f[(i + 1) % 4], d = f[i]; for (const [p, w] of [[a, 1], [b, 1], [c, 0], [a, 1], [c, 0], [d, 0]]) { pos.push(p.x, p.y, p.z); cor0.push(cor.r * w, cor.g * w, cor.b * w); } }
      for (let i = 0; i < 40; i++) { const u = Math.random(), v = Math.random(), t = Math.random() * 0.9, p = cs[0].clone().lerp(cs[1], u).lerp(cs[3].clone().lerp(cs[2], u), v); p.addScaledVector(L, t * Math.min(16, (p.y - PISO_CASA) / -L.y)); pts.push(p.x, p.y, p.z); }
    }
    if (!pos.length) { poeiraFeixe.pts = null; return; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(cor0, 3));
    feixes.add(new T.Mesh(g, brilhoFeixe));
    const gp = new T.BufferGeometry(); gp.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    poeiraFeixe.pts = new T.Points(gp, new T.PointsMaterial({ size: 0.05, color: new T.Color(...H.sol).multiplyScalar(0.5 * Math.min(1, H.si)), transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
    poeiraFeixe.base = Float32Array.from(pts); feixes.add(poeiraFeixe.pts);
  }
  // low mist over the forest floor: big soft sprites, the colour of the hour's haze
  const nuvem = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); })();
  const nevoas = [];
  for (let i = 0; i < 36; i++) {
    const x = 48 + sorte() * 78, z = 3 + sorte() * 82, s = new T.Sprite(new T.SpriteMaterial({ map: nuvem, transparent: true, depthWrite: false, opacity: 0, fog: true }));
    s.position.set(x, altura(x, z) + 0.8 + sorte() * 0.8, z); s.scale.set(12 + sorte() * 10, 2.5 + sorte() * 2, 1); s.userData = { x, fase: sorte() * 6, a: 0.08 + sorte() * 0.08 }; gFora.add(s); nevoas.push(s);
  }
  function poeHora(h) {
    hora = HORAS[h] ? h : 'fimdetarde'; const H = HORAS[hora], el = (H.el * Math.PI) / 180, az = (H.az * Math.PI) / 180;
    dirSol.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();
    sol.color.setRGB(...H.sol); ceu.color.setRGB(...H.ceu); ceu.groundColor.setRGB(...H.chao);
    uCeu.zen.value.set(H.zen); uCeu.hor.value.set(H.hor); uCeu.solCor.value.setRGB(...H.sol); uCeu.solDir.value.copy(dirSol); uCeu.estrelas.value = H.estrelas; uCeu.disco.value = hora === 'noite' ? 0.6 : 1;
    uRio.zen.value.set(H.zen); uRio.hor.value.set(H.hor); uRio.solCor.value.setRGB(...H.sol).multiplyScalar(H.si); uRio.solDir.value.copy(dirSol); uRio.ceuI.value = H.ci;
    gotas.material.color.set(H.hor).lerp(new T.Color(1, 1, 1), 0.5).multiplyScalar(0.4 + H.ci); // the drops catch the hour's light
    corNevoa.set(H.nev); for (const s of nevoas) s.material.color.copy(corNevoa);
    // the outside windows glow with the lamp at night; the inside shows the hour's horizon through windows and door
    vidro.color.setRGB(...(hora === 'noite' ? [0.9, 0.55, 0.25] : [0.05, 0.045, 0.04])); for (const m of claros) m.color.set(H.hor).multiplyScalar(hora === 'noite' ? 0.6 : 0.85);
    poeFeixes(); if (ctx.$hora) ctx.$hora.value = hora;
  }

  // ---- the strip: Hora do dia (Luz e escuridão) and Texturas do mundo (Texturas) ------------------------------------------
  const itHora = ctx.seletor('hora', 'Hora do dia', 'Luz de fora: sol, céu, névoa e as janelas da casa.', [['amanhecer', 'Amanhecer', 'sol baixo a leste'], ['meiodia', 'Meio-dia', 'sol alto'], ['fimdetarde', 'Fim de tarde', 'sol baixo a oeste'], ['noite', 'Noite', 'lua e estrelas']]);
  const itTex = ctx.seletor('texmundo', 'Texturas do mundo', 'De onde vêm as texturas da caverna, da clareira e da casa. Recarrega a página.', [['misto', 'Misto', 'relva, folhas, telhado, rocha e pedra do Gemini; o resto do VS'], ['vs', 'Originais do VS', 'recortes do jogo'], ['pattern', 'Pattern Diffusion', 'geradas no PC; chão da caverna e água do VS'], ['gemini', 'Gemini', 'todas geradas no Gemini']]);
  ctx.CATS.find((c) => c.id === 'luz').itens.push(itHora); ctx.CATS.find((c) => c.id === 'texturas').itens.push(itTex); ctx.ITENS.hora = itHora; ctx.ITENS.texmundo = itTex;
  ctx.$hora = itHora.el; itTex.el.value = CONJ;
  itHora.el.onchange = () => { poeHora(itHora.el.value); ctx.naURL('hora', hora); };
  itTex.el.onchange = () => ctx.recarrega('texmundo', itTex.el.value);
  poeHora(hora);

  // ---- per frame -----------------------------------------------------------------------------------------------------------
  let tempo = 0, pertoAntes = false;
  const SOME = 0.25, foraDe = (u) => { const L = letra(Math.floor(u.g.position.x / CEL), Math.floor(u.g.position.z / CEL)); return !FORA.includes(L) ? [0, 0] : L === 'h' ? [1, 0.3] : [1, 1]; };
  const fadaMonte = fada(mMonte, () => ctx.sel && !FORA.includes(letra(Math.floor(ctx.sel.g.position.x / CEL), Math.floor(ctx.sel.g.position.z / CEL))));
  // the door the selected character stands by (outside or inside), or none
  const perto = () => { const p = ctx.sel?.g.position; return p ? Object.values(portas).find((d) => Math.hypot(p.x - d.x, p.z - d.z) < 3.2) : undefined; };
  const portaPerto = () => !!perto();
  // Through the door: the walker comes out on the other side, a tile from it, facing away from it; the door he used
  // shuts at once (out of sight), the one behind him starts open and swings shut.
  function atravessa(de, para, s) {
    de.aberta = false; de.t = 0; para.t = 1; para.aberta = false;
    const u = de.quem; if (!u) return;
    const x = para.x + s, z = para.z, p = u.g.position;
    p.set(x, seco(x, z, letra(Math.floor(x / CEL), Math.floor(z / CEL))), z); u.cx = Math.floor(x / CEL); u.cz = Math.floor(z / CEL);
    u.rota = []; u.v = u.v1 = 0; u.pulo = null; u.g.rotation.y = u.rumo = (s * Math.PI) / 2;
    if (u.foraU) u.foraU.value.set(...foraDe(u));
    if (u === ctx.sel) ctx.alvoCam.set(x, p.y + 1.2, z); // no glide across the map: the camera is there at once
    ctx.enchaAcoes();
  }
  function quadro(dt) {
    tempo += dt; uRio.tempo.value = tempo; respingos(dt);
    // k stays 1 outside: "Escuridão total" is the room's ambient (cave, house), the hour alone lights the open air (Fernando saw a black noon)
    const H = HORAS[hora], k = 1, sel = ctx.sel;
    sol.intensity = H.si * k; ceu.intensity = H.ci * k;
    // the sun's shadow box over the camera target, snapped to whole texels so its edges do not crawl
    const t = ctx.alvoCam, passo = (2 * LADO_SOL) / 2048, sx = Math.round(t.x / passo) * passo, sz = Math.round(t.z / passo) * passo;
    alvoSol.position.set(sx, 0, sz); sol.position.set(sx + dirSol.x * 120, dirSol.y * 120, sz + dirSol.z * 120); alvoSol.updateMatrixWorld();
    domo.position.copy(ctx.cam.position);
    if (cena.fog) cena.fog.color.copy(corNevoa).multiplyScalar(k);
    uCeu.zen.value.set(H.zen).multiplyScalar(k ? 1 : 0.05); uCeu.hor.value.set(H.hor).multiplyScalar(k ? 1 : 0.05);
    // the ford (agua.js) takes the sky as its ambient light, or it is a dark slab in daylight
    for (const a of ctx.aguas) a.malha.material.uniforms.ambiente.value.setRGB(...H.ceu).multiplyScalar(0.35 * H.ci * k);
    // the smoke stays indoors (its box), its ambient is the room's
    dentro = !!sel && letra(Math.floor(sel.g.position.x / CEL), Math.floor(sel.g.position.z / CEL)) === 'h';
    if (gCasa.visible !== dentro) { gCasa.visible = dentro; gFora.visible = !dentro; } // one place at a time: the clearing or the inside
    for (const f of fadas) {
      const quer = f.quer() ? 0 : 1; if (quer === f.op) continue;
      f.op = Math.min(1, Math.max(0, f.op + Math.sign(quer - f.op) * (dt / SOME)));
      f.m.opacity = f.op; f.m.transparent = f.op < 1; f.m.depthWrite = f.op === 1; f.m.colorWrite = f.op > 0;
    }
    // door: eased swing, ~0.7 s
    for (const d of Object.values(portas)) { d.t = Math.min(1, Math.max(0, d.t + (d.aberta ? 1 : -1) * dt / 0.7)); d.dob.rotation.y = 1.65 * d.t * d.t * (3 - 2 * d.t); }
    if (portas.fora.aberta && portas.fora.t >= 1) atravessa(portas.fora, portas.dentro, 1);
    else if (portas.dentro.aberta && portas.dentro.t >= 1) atravessa(portas.dentro, portas.fora, -1);
    const pp = portaPerto(); if (pp !== pertoAntes) { pertoAntes = pp; ctx.enchaAcoes(); }
    // mist breathes and drifts
    for (const s of nevoas) { const d = s.userData; s.position.x = d.x + Math.sin(tempo * 0.05 + d.fase) * 3; s.material.opacity = d.a * k * (0.7 + 0.3 * Math.sin(tempo * 0.2 + d.fase)); }
    if (poeiraFeixe.pts) { const P = poeiraFeixe.pts.geometry.attributes.position, b = poeiraFeixe.base; for (let i = 0; i < P.count; i++) P.setXYZ(i, b[i * 3] + Math.sin(tempo * 0.3 + i) * 0.15, b[i * 3 + 1] + Math.sin(tempo * 0.21 + i * 1.3) * 0.2, b[i * 3 + 2] + Math.cos(tempo * 0.27 + i) * 0.15); P.needsUpdate = true; }
    feixes.visible = k > 0;
    // the characters: how much sun and sky reach them (smoothed, so leaving the tunnel is not a switch)
    for (const u of unidades) {
      const [a, b] = foraDe(u), F = u.foraU.value; F.x += (a - F.x) * Math.min(1, dt * 3); F.y += (b - F.y) * Math.min(1, dt * 3);
      const luz = (H.si * F.x + H.ci * F.y) * k;
      if (ctx.direta === 'some' && ctx.comoSome === 'inteiro') u.visto.value = Math.max(u.visto.value, Math.min(1, luz * 2));
      if (ctx.direta === 'some') u.disco.material.opacity = Math.max(u.disco.material.opacity, 0.5 * Math.min(1, luz));
      if (!ctx.direta) u.luz.add(new T.Color(...H.ceu).multiplyScalar(0.5 * H.ci * F.y * k)).add(new T.Color(...H.sol).multiplyScalar(0.4 * H.si * F.x * k));
    }
  }

  // The characters' shader (the page's, lit per pixel from the point lights) gets the sun, with its shadow map, and
  // the sky light, both scaled by foraU (x sun, y sky): 0 in the cave, so it reads as before there.
  const LUZ_FORA = `#ifdef DIRETO
    {
      vec3 nM = normalize( cross( dFdx( vPosVista ), dFdy( vPosVista ) ) );
      #ifdef ABRACA
        if ( dot( vNorm, vNorm ) > 0.25 ) { vec3 s = normalize( vNorm ); nM = dot( s, nM ) < 0.0 ? - s : s; }
      #endif
      #if NUM_DIR_LIGHTS > 0
        float nlS = dot( nM, directionalLights[ 0 ].direction );
        #ifdef ABRACA
          nlS = 0.2 + 0.4 * ( nlS + 1.0 );
        #else
          nlS = max( nlS, 0.0 );
        #endif
        float shS = 1.0;
        #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
          shS = getShadow( directionalShadowMap[ 0 ], directionalLightShadows[ 0 ].shadowMapSize, directionalLightShadows[ 0 ].shadowBias - 0.0015, directionalLightShadows[ 0 ].shadowRadius, vDirectionalShadowCoord[ 0 ] );
        #endif
        luzes += directionalLights[ 0 ].color * nlS * shS * foraU.x;
      #endif
      #if NUM_HEMI_LIGHTS > 0
        luzes += mix( hemisphereLights[ 0 ].groundColor, hemisphereLights[ 0 ].skyColor, 0.5 * dot( nM, hemisphereLights[ 0 ].direction ) + 0.5 ) * foraU.y;
      #endif
    }
  #endif
  `;
  let unidades = [];
  function bonecos(us) {
    unidades = us;
    for (const u of us) {
      u.foraU = { value: new T.Vector2(...foraDe(u)) };
      for (const m of u.mats) {
        m.uniforms.foraU = u.foraU;
        m.fragmentShader = m.fragmentShader.replace('uniform float visto;', 'uniform float visto;\nuniform vec2 foraU;').replace(/(\n\s*#ifdef SOME\s*\n\s*#ifdef INTEIRO)/, '\n' + LUZ_FORA + '$1');
        m.needsUpdate = true;
      }
    }
  }

  return {
    quadro, bonecos, poeHora, get hora() { return hora; }, HORAS, portas, portaPerto,
    // the page reads porta.aberta for the Ação label: the door by the selected character, else the outside one
    get porta() { return perto() || portas.fora; },
    alternaPorta() { const d = perto(); if (d && !d.aberta) { d.aberta = true; d.quem = ctx.sel; ctx.enchaAcoes(); } },
    chaos: [terreno, pisoDentro, pontes], caixaFumaca: { min: v3(0, 0, 0), max: v3(44, TETO, 88) },
    sol, ceu, domo, rio, monte, fadas, get respingo() { return { aneis: aneis.filter((a) => a.w > 0 && tempo - a.z <= 1.4).length, gotas: vivas }; }, gFora, gCasa, feixes, nevoas, texturas: fontes, conjunto: CONJ, arvores: nArvores, altura, get dentro() { return dentro; },
  };
}
