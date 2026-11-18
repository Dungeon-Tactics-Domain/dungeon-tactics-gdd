// VS pilot: a map's look stamped from pieces of several Vagrant Story rooms (Nov 17, Fernando's request: Ash Wood with
// its own heights, dressed in cut-outs of VS rooms). No imports, so the same file runs in the game (vs-local/, three
// of today) and in the lab page (content/vagrant/, VSTools' three r117): the caller passes `lib` = { T, ZND, MPD, Reader }.
//
// Units: 1 room tile = 1 cell of the map; cell (cx, cz) is centred on (cx, cz). Each cell copies the floor of one room
// tile, clipped to the tile's square, at the height the caller gives; height steps get vertical skirts textured with
// a wall quad of the same room.

const S = 12.8; // room units per tile: MPD vertices sit on multiples of 12.8 (after the 0.1 scale MPDMesh applies)

// Rooms and the flat rectangles cut from them (room tile coordinates, from a height scan of Nov 17). `rot`: the
// cut-out turns a quarter, so the trough of room 025 (it runs along z) runs along the river (along x).
export const WOOD_ROOMS = {
  arena: ['011', '025'], // stone arena with the trough
  hall: ['024', '085'], // studded stone hall
  wood: ['018', '062'], // dark plank floor
  dirt: ['013', '032'], // earthen catacomb corridor
};
export const WOOD_PIECES = {
  bank: { room: 'arena', x: 1, z: 9, w: 5, h: 10 }, // the heroes' bank: the arena's west floor
  plateau: { room: 'hall', x: 7, z: 4, w: 10, h: 11 }, // the enemy plateau: the hall floor
  road: { room: 'dirt', x: 12, z: 1, w: 10, h: 8 }, // the sand road: the corridor's earth
  bridge: { room: 'wood', x: 5, z: 8, w: 7, h: 10 }, // bridge and rubble: the planks
  // `flat`: the trough's sides slope more than half a tile, which would poke through the water: its relief is dropped
  river: { room: 'arena', x: 7, z: 6, w: 4, h: 16, rot: true, flat: true }, // deep and shallow water: the trough's bed
  block: { room: 'arena', x: 12, z: 15, w: 5, h: 4 }, // trees: stone pillars
  rock: { room: 'hall', x: 7, z: 4, w: 10, h: 11 }, // rocks: a step of the hall floor
  crate: { room: 'wood', x: 5, z: 8, w: 7, h: 10 }, // crates and barrels: a block of planks
};

const bin = async (lib, url) => new lib.Reader(new Uint8Array(await (await fetch(url)).arrayBuffer()));

// A room in tile units, y up (the same half turn as the characters), with what stamping needs: its visible meshes,
// the floor top per point and its wall quads.
export async function loadRoom(lib, zndUrl, mpdUrl) {
  const { T } = lib;
  const znd = new lib.ZND(await bin(lib, zndUrl));
  znd.read();
  znd.frameBuffer.build();
  const mpd = new lib.MPD(await bin(lib, mpdUrl), znd);
  mpd.read();
  mpd.build();
  const room = new T.Group().add(mpd.mesh);
  room.rotation.x = Math.PI;
  room.scale.setScalar(1 / S);
  room.position.set(0.5, 0, 0.5);
  room.updateMatrixWorld(true);
  // all-black pieces (ceiling and wall caps) only hide the void around the room in the game's own camera
  const meshes = [];
  mpd.mesh.traverse((o) => o.isMesh && !o.geometry.attributes.color.array.every((v) => v < 0.02) && meshes.push(o));
  const box = new T.Box3().setFromObject(room),
    ray = new T.Raycaster(),
    down = new T.Vector3(0, -1, 0);
  // front faces only answer, as in the game: ceilings and walls seen from behind do not
  const top = (x, z) => {
    ray.set(new T.Vector3(x, box.max.y + 1, z), down);
    return ray.intersectObjects(meshes, false)[0]?.point.y ?? null;
  };
  // every triangle in tile units: positions, uvs, colours, the material it draws with and its normal
  const tris = [];
  const walls = [];
  const v = new T.Vector3();
  for (const m of meshes) {
    const g = m.geometry,
      idx = g.index.array,
      P = g.attributes.position,
      U = g.attributes.uv,
      C = g.attributes.color;
    const vert = (i) => ({
      p: v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld).toArray(),
      uv: [U.getX(i), U.getY(i)],
      c: [C.getX(i), C.getY(i), C.getZ(i)],
    });
    for (let k = 0; k < idx.length; k += 3) {
      const t = [vert(idx[k]), vert(idx[k + 1]), vert(idx[k + 2])];
      tris.push({ v: t, n: normal(t), mat: m.material });
    }
    // wall quads (MPDMesh writes a quad as 4 vertices and the indices 2 1 0, 1 2 3): one tile wide and high, upright,
    // not dark; a skirt segment takes its uvs and colours
    for (let k = 0; k + 5 < idx.length; k += 3) {
      const b = idx[k + 2];
      if (idx[k] !== b + 2 || idx[k + 1] !== b + 1 || idx[k + 3] !== b + 1 || idx[k + 4] !== b + 2 || idx[k + 5] !== b + 3)
        continue;
      const q = [vert(b), vert(b + 1), vert(b + 2), vert(b + 3)];
      const n = normal([q[2], q[1], q[0]]);
      const ys = q.map((p) => p.p[1]);
      const hgt = Math.max(...ys) - Math.min(...ys);
      const wid = Math.hypot(q[0].p[0] - q[3].p[0], q[0].p[2] - q[3].p[2]);
      const lit = q.reduce((s, p) => s + p.c[0] + p.c[1] + p.c[2], 0) / 12;
      if (Math.abs(n[1]) < 0.05 && hgt > 0.8 && hgt < 1.25 && wid > 0.8 && wid < 1.5 && lit > 0.12)
        walls.push({ corners: corners(q, n), mat: m.material });
      k += 3;
    }
  }
  return { room, meshes, top, tris, walls };
}

function normal([a, b, c]) {
  const u = [b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]],
    w = [c.p[0] - a.p[0], c.p[1] - a.p[1], c.p[2] - a.p[2]];
  const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  const l = Math.hypot(...n) || 1;
  return n.map((x) => x / l);
}

// the 4 corners of an upright quad as seen from its front: bottom-left, bottom-right, top-right, top-left
function corners(q, n) {
  const right = [n[2], 0, -n[0]]; // cross(-n, up): the viewer's right looking at the front
  const along = (p) => p.p[0] * right[0] + p.p[2] * right[2];
  const byY = [...q].sort((a, b) => a.p[1] - b.p[1]);
  const [bl, br] = byY.slice(0, 2).sort((a, b) => along(a) - along(b));
  const [tl, tr] = byY.slice(2).sort((a, b) => along(a) - along(b));
  return [bl, br, tr, tl];
}

// Sutherland-Hodgman against one side of the tile square, every attribute interpolated
function clip(poly, axis, lim, keepBelow) {
  const inside = (p) => (keepBelow ? p.p[axis] <= lim : p.p[axis] >= lim);
  const mix = (a, b) => {
    const t = (lim - a.p[axis]) / (b.p[axis] - a.p[axis]);
    const l = (x, y) => x.map((v, i) => v + (y[i] - v) * t);
    return { p: l(a.p, b.p), uv: l(a.uv, b.uv), c: l(a.c, b.c) };
  };
  const out = [];
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length];
    if (inside(a)) out.push(a);
    if (inside(a) !== inside(b)) out.push(mix(a, b));
  });
  return out;
}

// The floor polygons of room tile (sx, sz), clipped to its square: up-facing and on the top surface (a ray from above
// meets them first). `ref` is the tile's floor height at its centre, the zero the caller's height is added to.
function floorOf(src, sx, sz) {
  const key = `${sx},${sz}`;
  src.cache ??= new Map();
  if (src.cache.has(key)) return src.cache.get(key);
  const polys = [];
  for (const t of src.tris) {
    if (t.n[1] < 0.5) continue;
    const xs = t.v.map((p) => p.p[0]),
      zs = t.v.map((p) => p.p[2]);
    if (Math.max(...xs) < sx - 0.5 || Math.min(...xs) > sx + 0.5 || Math.max(...zs) < sz - 0.5 || Math.min(...zs) > sz + 0.5)
      continue;
    let poly = t.v;
    poly = clip(poly, 0, sx - 0.5, false);
    poly = clip(poly, 0, sx + 0.5, true);
    poly = clip(poly, 2, sz - 0.5, false);
    poly = clip(poly, 2, sz + 0.5, true);
    if (poly.length < 3) continue;
    const mid = [0, 1, 2].map((i) => poly.reduce((s, p) => s + p.p[i], 0) / poly.length);
    const top = src.top(mid[0], mid[2]);
    if (top === null || Math.abs(top - mid[1]) > 0.05) continue;
    polys.push({ poly, mat: t.mat });
  }
  const ref = src.top(sx, sz) ?? 0;
  // a slanted sliver on a prop (a torch cap, a spike) would stand out of the cell as a spike: only what lies near the
  // tile's floor stays (the trough's slope is dropped flat by its piece instead)
  const kept = polys.filter(({ poly }) => poly.every((p) => Math.abs(p.p[1] - ref) < 0.6));
  // how much of the square the kept floor covers, seen from above (shoelace)
  const area = kept.reduce(
    (s, { poly }) =>
      s + Math.abs(poly.reduce((a, p, i) => { const q = poly[(i + 1) % poly.length]; return a + p.p[0] * q.p[2] - q.p[0] * p.p[2]; }, 0)) / 2,
    0,
  );
  const r = { polys: kept, all: polys, ref, area };
  src.cache.set(key, r);
  return r;
}

// Stamps the map. `cellAt(cx, cz)` gives { piece (a WOOD_PIECES key), y(u, v): ground height at offset (u, v) from the
// cell centre, thick?: how far its skirts reach down (bridges are planks, not walls) } or null off the map; `bottom`
// is where the skirts at the map edge end; `material(m)` turns a room material into the one to draw with.
export function stampMap(lib, rooms, W, H, cellAt, { bottom = -1, material = (m) => m } = {}) {
  const { T } = lib;
  const out = new Map(); // material -> { p, uv, c }
  const push = (mat, vs) => {
    const m = material(mat);
    if (!out.has(m)) out.set(m, { p: [], uv: [], c: [] });
    const o = out.get(m);
    for (const x of vs) {
      o.p.push(...x.p);
      o.uv.push(...x.uv);
      o.c.push(...x.c);
    }
  };
  const mod = (a, n) => ((a % n) + n) % n;
  for (let cz = 0; cz < H; cz++)
    for (let cx = 0; cx < W; cx++) {
      const cell = cellAt(cx, cz);
      if (!cell) continue;
      const pc = WOOD_PIECES[cell.piece],
        src = rooms[pc.room];
      // the cut-out repeats over the map; turned, the room's x runs along the map's z
      let sx = pc.x + mod(pc.rot ? cz : cx, pc.w),
        sz = pc.z + mod(pc.rot ? -cx : cz, pc.h);
      // a tile with a gap (a dropped prop, a hole) would show the void: the next whole tile of the cut-out stands in
      for (let k = 1; !pc.flat && floorOf(src, sx, sz).area < 0.97 && k < pc.w * pc.h; k++) {
        const i = mod(sx - pc.x + (sz - pc.z) * pc.w + 1, pc.w * pc.h);
        sx = pc.x + (i % pc.w);
        sz = pc.z + Math.floor(i / pc.w);
      }
      const f = floorOf(src, sx, sz);
      for (const { poly, mat } of pc.flat ? f.all : f.polys) {
        const vs = poly.map((p) => {
          const du = p.p[0] - sx,
            dv = p.p[2] - sz;
          const [u, w] = pc.rot ? [-dv, du] : [du, dv];
          return { p: [cx + u, cell.y(u, w) + (pc.flat ? 0 : p.p[1] - f.ref), cz + w], uv: p.uv, c: p.c };
        });
        for (let i = 1; i + 1 < vs.length; i++) push(mat, [vs[0], vs[i], vs[i + 1]]);
      }
      // skirts on the 4 sides, facing out, from the lower neighbour (or the map bottom) up to this cell's edge
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const n = cellAt(cx + dx, cz + dz);
        // edge ends as seen from outside: left then right (the viewer's right looking at a face that points to dx, dz)
        const ends = [
          [dx / 2 - dz / 2, dz / 2 + dx / 2],
          [dx / 2 + dz / 2, dz / 2 - dx / 2],
        ];
        const tops = ends.map(([u, w]) => cell.y(u, w));
        const lows = ends.map(([u, w], i) => {
          const floor = n ? n.y(u - dx, w - dz) : bottom;
          return Math.max(floor, cell.thick ? tops[i] - cell.thick : -Infinity);
        });
        if (tops[0] - lows[0] < 0.02 && tops[1] - lows[1] < 0.02) continue;
        const wall = (src.walls.length ? src : rooms.arena).walls;
        const steps = Math.ceil(Math.max(tops[0] - lows[0], tops[1] - lows[1]) - 0.01);
        for (let k = 0; k < steps; k++) {
          const q = wall[mod(cx * 7 + cz * 13 + k * 5 + dx * 3 + dz, wall.length)];
          const lo = lows.map((l, i) => Math.min(tops[i], l + k)),
            hi = lows.map((l, i) => Math.min(tops[i], l + k + 1));
          if (hi[0] - lo[0] < 0.01 && hi[1] - lo[1] < 0.01) continue;
          // corner uvs and colours of the wall quad, the top cut short where the segment is (bilinear in height)
          const at = (side, h) => {
            const b = q.corners[side ? 1 : 0],
              t = q.corners[side ? 2 : 3];
            const l = (x, y) => x.map((v, i) => v + (y[i] - v) * h);
            return { uv: l(b.uv, t.uv), c: l(b.c, t.c) };
          };
          const pt = (i, y, h) => {
            const [u, w] = ends[i];
            return { p: [cx + u, y, cz + w], ...at(i, h) };
          };
          const bl = pt(0, lo[0], 0),
            br = pt(1, lo[1], 0),
            tr = pt(1, hi[1], hi[1] - lo[1]),
            tl = pt(0, hi[0], hi[0] - lo[0]);
          push(q.mat, [bl, br, tr, bl, tr, tl]);
        }
      }
    }
  const group = new T.Group();
  for (const [mat, o] of out) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(o.p, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(o.uv, 2));
    g.setAttribute('color', new T.Float32BufferAttribute(o.c, 3));
    g.computeVertexNormals();
    group.add(new T.Mesh(g, mat));
  }
  return group;
}
