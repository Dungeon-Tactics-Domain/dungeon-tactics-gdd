// subdividir2x(geometry, { suave }): about twice the triangles without rounding the body (Nov 17, Fernando's request:
// Catmull-Clark level 2 at 4,740 triangles looked too round; he wants ~800 instead of ~400 with the same animation).
// No three.js import: it builds through geometry.constructor, so it runs on the lab's 0.117 shim, the app's 0.186 and vs-local.
//
// How: longest edges first, bisected in every triangle that holds them (no T-junctions), until the count reaches 2x.
// Only edges whose two ends ride the same bone: VS geometry sits in a "joints at zero" bind pose, so a midpoint between
// two bones with 50/50 weights would leave the edge once the elbow bends (the hand would come loose or spike).
// `suave` (0..1) lifts each new point along a Hermite curve of the vertex normals (0 = flat, identical surface);
// open borders and creases sharper than 60 degrees stay straight so the silhouette and the piece seams hold.

const CREASE = Math.cos(Math.PI / 3);

export function subdividir2x(geometry, { suave = 0, alvo = 2 } = {}) {
  const pos = geometry.attributes.position.array, sIdx = geometry.attributes.skinIndex;
  const nV = geometry.attributes.position.count;
  let tris = [];
  if (geometry.index) for (let i = 0; i < geometry.index.count; i += 3) tris.push([geometry.index.array[i], geometry.index.array[i + 1], geometry.index.array[i + 2]]);
  else for (let i = 0; i < nV; i += 3) tris.push([i, i + 1, i + 2]);
  const n0 = tris.length;

  const P = (v) => [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]];
  const osso = (v) => (sIdx ? sIdx.array[v * 4] : 0); // VS vertices ride one bone with weight 1
  const pk = (v) => `${pos[v * 3]},${pos[v * 3 + 1]},${pos[v * 3 + 2]}`;
  const ek = (a, b) => { const x = pk(a) + '|' + osso(a), y = pk(b) + '|' + osso(b); return x < y ? x + '#' + y : y + '#' + x; };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // Geometric faces (double-sided copies counted once) give the normals and the border/crease test.
  const faceN = (t) => cross(sub(P(t[1]), P(t[0])), sub(P(t[2]), P(t[0])));
  const vistas = new Set(), vn = new Map(), adj = new Map();
  for (const t of tris) {
    const key = t.map(pk).sort().join(';');
    if (vistas.has(key) || osso(t[0]) !== osso(t[1]) || osso(t[1]) !== osso(t[2])) continue; // normals only from faces wholly on one bone
    vistas.add(key);
    const n = faceN(t);
    for (const v of t) { const k = pk(v) + '|' + osso(v), a = vn.get(k) || [0, 0, 0]; vn.set(k, [a[0] + n[0], a[1] + n[1], a[2] + n[2]]); }
    for (let i = 0; i < 3; i++) { const k = ek(t[i], t[(i + 1) % 3]); (adj.get(k) || adj.set(k, []).get(k)).push(unit(n)); }
  }

  // Output attributes as growable plain arrays; new vertices are appended.
  const attrs = Object.entries(geometry.attributes).map(([nome, a]) => ({ nome, a, it: a.itemSize, v: Array.from(a.array) }));
  const mids = new Map();
  const meio = (a, b) => {
    const ck = a < b ? a + ',' + b : b + ',' + a;
    if (mids.has(ck)) return mids.get(ck);
    const m = attrs[0].v.length / attrs[0].it;
    for (const { nome, it, v } of attrs) for (let c = 0; c < it; c++) v.push(nome === 'skinIndex' || nome === 'skinWeight' ? v[a * it + c] : (v[a * it + c] + v[b * it + c]) / 2);
    if (suave) {
      const k = ek(a, b), fs = adj.get(k) || [];
      if (fs.length === 2 && dot(fs[0], fs[1]) > CREASE) {
        const e = sub(P(b), P(a)), na = unit(vn.get(pk(a) + '|' + osso(a))), nb = unit(vn.get(pk(b) + '|' + osso(b)));
        const ea = dot(e, na), eb = dot(e, nb), p = attrs.find((x) => x.nome === 'position').v; // Hermite midpoint: (t0 - t1) / 8
        for (let c = 0; c < 3; c++) p[m * 3 + c] += (suave * (eb * nb[c] - ea * na[c])) / 8;
      }
    }
    mids.set(ck, m);
    return m;
  };

  // Split candidates: same-bone, non-degenerate edges, longest first.
  const len = new Map();
  for (const t of tris) for (let i = 0; i < 3; i++) {
    const a = t[i], b = t[(i + 1) % 3];
    if (osso(a) !== osso(b)) continue;
    const l = Math.hypot(...sub(P(a), P(b)));
    if (l > 0) len.set(ek(a, b), l);
  }
  const fila = [...len.entries()].sort((x, y) => y[1] - x[1]).map((x) => x[0]);

  // ponytail: rescans every triangle per split (O(n^2)); fine for ~400 triangles, index triangles by edge if meshes grow.
  for (const k of fila) {
    if (tris.length >= n0 * alvo) break;
    const novos = [];
    for (const t of tris) {
      const i = [0, 1, 2].find((j) => ek(t[j], t[(j + 1) % 3]) === k);
      if (i === undefined) { novos.push(t); continue; }
      const a = t[i], b = t[(i + 1) % 3], c = t[(i + 2) % 3], m = meio(a, b);
      novos.push([a, m, c], [m, b, c]); // keeps the winding of the parent triangle
    }
    tris = novos;
  }

  const g = new geometry.constructor();
  for (const { nome, a, it, v } of attrs) g.setAttribute(nome, new a.constructor(new a.array.constructor(v), it, a.normalized));
  g.setIndex(tris.flat());
  g.computeBoundingSphere();
  g.computeVertexNormals();
  return g;
}
