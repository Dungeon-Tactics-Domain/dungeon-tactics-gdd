// Experimental particle liquid for the lab's gothic room: a few thousand particles that flow, splash and get pushed
// by the characters. Simulation on the CPU (position-based fluid: each particle is moved until its neighbourhood has
// the rest density), surface drawn in screen space (spheres' depth -> blur -> normals -> lighting). See fluido-LEIAME.md.
//
// criarFluido({ THREE, scene, renderer, camera, bacia: { x0, z0, x1, z1, y0 }, quantidade, luzes, ... })
//   -> { update(dt, unidades, camera?), setEnabled(on), derramar(n, ponto), dispose(), estatisticas, posicoes, velocidades }
// `camera` is required (beyond the original brief): the surface is built from what the camera sees.
// unidades = [{ pos: {x,y,z} (feet), vel: {x,y,z} (optional), raio, altura }]: vertical capsules. A column is a
// capsule that does not move.

const EMPACOTA = `
vec4 empacota(float v) { vec4 e = fract(min(v, 0.9999) * vec4(1., 255., 65025., 16581375.)); e -= e.yzww * vec4(1. / 255., 1. / 255., 1. / 255., 0.); return e; }
float desempacota(vec4 c) { return dot(c, vec4(1., 1. / 255., 1. / 65025., 1. / 16581375.)); }`;
const TELA_VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

// The physics alone, no drawing (criarFluido uses it; it also runs in Node for a bench or inside a worker).
export function criarSimulacao({
  bacia, quantidade = 3000,
  tile = 1, // size of one Vagrant Story tile in scene units (1 in the closed room, 128 on raw files)
  profundidade = 0.8 * tile, // depth of the liquid at rest with `quantidade` particles
  maximo = Math.ceil(quantidade * 1.5), // room for the particles that derramar() adds
  iteracoes = 2, // density passes per step: more = stiffer and calmer liquid, each one costs about a third of the step
}) {
  const { x0, z0, x1, z1, y0 } = bacia;
  const N = maximo;
  // d: distance between particles at rest, taken from the volume each one has to fill. h: how far a particle feels its
  // neighbours (1.75 d = about 19 of them; 2 d was 28 and cost half as much again for the same look).
  const d = Math.cbrt(((x1 - x0) * (z1 - z0) * profundidade) / quantidade), h = 1.75 * d, h2 = h * h, rp = d * 0.5;
  const k6 = 315 / (64 * Math.PI * h ** 9), ks = 45 / (Math.PI * h ** 6);
  // rest density: what a particle sees inside a cubic grid of spacing d
  let rho0 = 0;
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let c = -2; c <= 2; c++) { const r2 = (a * a + b * b + c * c) * d * d; if (r2 < h2) rho0 += k6 * (h2 - r2) ** 3; }
  const G = 20 * tile; // gravity: a 3.7-tile character is about 1.8 m, so 9.8 m/s² is about 20 tiles/s²
  const EPS = 4 / h2, VISC = 0.08, MAXV = 32;

  const p = new Float32Array(N * 3), q = new Float32Array(N * 3), v = new Float32Array(N * 3), dq = new Float32Array(N * 3);
  const lam = new Float32Array(N), espuma = new Float32Array(N), tocou = new Uint8Array(N);
  const viz = new Int32Array(N * MAXV), nviz = new Uint8Array(N), gp = new Float32Array(N * MAXV);
  const gx = Math.ceil((x1 - x0) / h) + 1, gz = Math.ceil((z1 - z0) / h) + 1, gy = 24, nc = gx * gy * gz;
  const inicio = new Int32Array(nc + 1), cursor = new Int32Array(nc + 1), ordem = new Int32Array(N), celula = new Int32Array(N), tmp = new Float32Array(N * 3);
  let n = 0, fila = 0, bica = null;

  // starts as a block of layers on the basin floor, slightly shaken so it does not stay a perfect crystal
  const nx = Math.max(1, Math.floor((x1 - x0) / d) - 1), nz = Math.max(1, Math.floor((z1 - z0) / d) - 1);
  for (; n < Math.min(quantidade, N); n++) {
    const c = n % (nx * nz), j = () => (Math.random() - 0.5) * d * 0.2;
    p[n * 3] = x0 + d + (c % nx) * d + j(); p[n * 3 + 1] = y0 + rp + Math.floor(n / (nx * nz)) * d; p[n * 3 + 2] = z0 + d + Math.floor(c / nx) * d + j();
  }

  const limites = (i) => {
    const a = i * 3;
    if (q[a] < x0 + rp) q[a] = x0 + rp; else if (q[a] > x1 - rp) q[a] = x1 - rp;
    if (q[a + 2] < z0 + rp) q[a + 2] = z0 + rp; else if (q[a + 2] > z1 - rp) q[a + 2] = z1 - rp;
    if (q[a + 1] < y0 + rp) q[a + 1] = y0 + rp;
  };
  const capsulas = (i, us) => {
    const a = i * 3;
    for (let k = 0; k < us.length; k++) {
      const u = us[k], R = u.raio + rp, ya = u.pos.y + u.raio, yb = Math.max(ya, u.pos.y + u.altura - u.raio);
      let dx = q[a] - u.pos.x, dy = q[a + 1] - Math.min(yb, Math.max(ya, q[a + 1])), dz = q[a + 2] - u.pos.z;
      const r2 = dx * dx + dy * dy + dz * dz;
      if (r2 >= R * R) continue;
      let r = Math.sqrt(r2);
      if (r < 1e-6) { dx = 1; dy = dz = 0; r = 1; } // exactly on the axis: any way out will do
      const empurra = Math.min(R - r, h) / r; // capped: a capsule that teleports in must not fire the liquid away
      q[a] += dx * empurra; q[a + 1] += dy * empurra; q[a + 2] += dz * empurra; tocou[i] = k + 1;
    }
  };

  function passo(dt, us) {
    // pouring: a few particles per step from the spout, so they do not land inside each other
    for (let k = 0; k < 8 && fila > 0 && n < N; k++, fila--, n++) {
      const a = n * 3, ang = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * 1.8 * d;
      p[a] = bica.x + Math.cos(ang) * rr; p[a + 1] = bica.y + (Math.random() - 0.5) * d; p[a + 2] = bica.z + Math.sin(ang) * rr;
      v[a] = v[a + 2] = 0; v[a + 1] = -4 * tile; espuma[n] = 0;
    }
    if (n >= N) fila = 0;
    const vmax = (0.5 * h) / dt; // no particle crosses more than half a neighbourhood per step
    for (let i = 0, a = 0; i < n; i++, a += 3) {
      v[a + 1] -= G * dt;
      const s = Math.sqrt(v[a] * v[a] + v[a + 1] * v[a + 1] + v[a + 2] * v[a + 2]);
      if (s > vmax) { const f = vmax / s; v[a] *= f; v[a + 1] *= f; v[a + 2] *= f; }
      q[a] = p[a] + v[a] * dt; q[a + 1] = p[a + 1] + v[a + 1] * dt; q[a + 2] = p[a + 2] + v[a + 2] * dt;
      limites(i); tocou[i] = 0;
    }
    // neighbours: the particles are put in the order of their cells of side h (so who is close in the room is close
    // in memory, which is what makes this fast), then each one looks at the 27 cells around it, 3 cells per stretch
    inicio.fill(0);
    for (let i = 0, a = 0; i < n; i++, a += 3) {
      const cx = Math.min(gx - 1, Math.max(0, ((q[a] - x0) / h) | 0)), cy = Math.min(gy - 1, Math.max(0, ((q[a + 1] - y0) / h) | 0)), cz = Math.min(gz - 1, Math.max(0, ((q[a + 2] - z0) / h) | 0));
      inicio[(celula[i] = (cy * gz + cz) * gx + cx) + 1]++;
    }
    for (let c = 0; c < nc; c++) inicio[c + 1] += inicio[c]; // inicio[c] = first particle of cell c
    cursor.set(inicio);
    for (let i = 0; i < n; i++) ordem[cursor[celula[i]]++] = i;
    for (const m of [p, v, q]) { for (let k = 0, a = 0; k < n; k++, a += 3) { const b = ordem[k] * 3; tmp[a] = m[b]; tmp[a + 1] = m[b + 1]; tmp[a + 2] = m[b + 2]; } m.set(tmp.subarray(0, n * 3)); }
    for (let k = 0; k < n; k++) { tmp[k] = espuma[ordem[k]]; ordem[k] = celula[ordem[k]]; } espuma.set(tmp.subarray(0, n)); celula.set(ordem.subarray(0, n));
    nviz.fill(0, 0, n);
    for (let i = 0, a = 0; i < n; i++, a += 3) { // each pair is found once, from its lower index, and written on both lists
      const c = celula[i], cx = c % gx, cz = ((c / gx) | 0) % gz, cy = (c / (gx * gz)) | 0, qx = q[a], qy = q[a + 1], qz = q[a + 2];
      for (let oy = 0, ay = cy < gy - 1 ? 1 : 0; oy <= ay; oy++) for (let oz = oy && cz > 0 ? -1 : 0, az = cz < gz - 1 ? 1 : 0; oz <= az; oz++) {
        const cc = c + (oy * gz + oz) * gx, fim = inicio[(cx < gx - 1 ? cc + 1 : cc) + 1];
        for (let j = oy || oz ? inicio[cx > 0 ? cc - 1 : cc] : i + 1, b = j * 3; j < fim; j++, b += 3) {
          const dx = qx - q[b], dy = qy - q[b + 1], dz = qz - q[b + 2];
          if (dx * dx + dy * dy + dz * dz < h2 && nviz[i] < MAXV && nviz[j] < MAXV) { viz[i * MAXV + nviz[i]++] = j; viz[j * MAXV + nviz[j]++] = i; }
        }
      }
    }
    // density passes: where the liquid is squeezed above the rest density, push the neighbours apart.
    // Only squeezing is corrected (no pull), so a loose drop flies free instead of dragging a string behind it.
    for (let it = 0; it < iteracoes; it++) {
      for (let i = 0, a = 0; i < n; i++, a += 3) {
        let rho = k6 * h2 * h2 * h2, sx = 0, sy = 0, sz = 0, s2 = 0;
        for (let k = i * MAXV, fim = k + nviz[i]; k < fim; k++) {
          const b = viz[k] * 3, dx = q[a] - q[b], dy = q[a + 1] - q[b + 1], dz = q[a + 2] - q[b + 2], r2 = dx * dx + dy * dy + dz * dz;
          if (r2 >= h2 || r2 < 1e-12) { gp[k] = 0; if (r2 < h2) rho += k6 * h2 * h2 * h2; continue; }
          const w = h2 - r2, r = Math.sqrt(r2), g = (gp[k] = (ks * (h - r) * (h - r)) / (r * rho0)); // gp: kept for the push loop below
          rho += k6 * w * w * w; sx += g * dx; sy += g * dy; sz += g * dz; s2 += g * g * r2;
        }
        const C = rho / rho0 - 1;
        lam[i] = C > 0 ? -C / (s2 + sx * sx + sy * sy + sz * sz + EPS) : 0;
      }
      for (let i = 0, a = 0; i < n; i++, a += 3) {
        let mx = 0, my = 0, mz = 0;
        for (let k = i * MAXV, fim = k + nviz[i]; k < fim; k++) {
          const j = viz[k], g = -(lam[i] + lam[j]) * gp[k];
          if (g === 0) continue;
          const b = j * 3; mx += g * (q[a] - q[b]); my += g * (q[a + 1] - q[b + 1]); mz += g * (q[a + 2] - q[b + 2]);
        }
        dq[a] = mx; dq[a + 1] = my; dq[a + 2] = mz;
      }
      for (let i = 0, a = 0; i < n; i++, a += 3) { q[a] += dq[a]; q[a + 1] += dq[a + 1]; q[a + 2] += dq[a + 2]; capsulas(i, us); limites(i); }
    }
    // speed = how far the corrections moved the particle; who touched a moving character is dragged and thrown up
    for (let i = 0, a = 0; i < n; i++, a += 3) {
      dq[a] = (q[a] - p[a]) / dt; dq[a + 1] = (q[a + 1] - p[a + 1]) / dt; dq[a + 2] = (q[a + 2] - p[a + 2]) / dt;
      if (tocou[i]) {
        const u = us[tocou[i] - 1].vel, s = Math.sqrt(u.x * u.x + u.z * u.z);
        dq[a] += u.x * 0.3; dq[a + 2] += u.z * 0.3; const sorte = Math.random(); dq[a + 1] += s * 0.9 * sorte * sorte; // a few drops fly high, most barely rise
        // a character moves the liquid about as fast as it walks: without this cap a step into the pool is an explosion
        const lim = 1.2 * s + 1.5 * tile, t = Math.sqrt(dq[a] * dq[a] + dq[a + 1] * dq[a + 1] + dq[a + 2] * dq[a + 2]);
        if (t > lim) { dq[a] *= lim / t; dq[a + 1] *= lim / t; dq[a + 2] *= lim / t; }
      }
    }
    // neighbours share a little of their speed (thickness of the liquid); foam = fast and with few neighbours
    for (let i = 0, a = 0; i < n; i++, a += 3) {
      let mx = 0, my = 0, mz = 0;
      for (let k = i * MAXV, fim = k + nviz[i]; k < fim; k++) {
        const b = viz[k] * 3, dx = q[a] - q[b], dy = q[a + 1] - q[b + 1], dz = q[a + 2] - q[b + 2], w = h2 - (dx * dx + dy * dy + dz * dz);
        if (w <= 0) continue;
        const f = (k6 * w * w * w) / rho0; mx += (dq[b] - dq[a]) * f; my += (dq[b + 1] - dq[a + 1]) * f; mz += (dq[b + 2] - dq[a + 2]) * f;
      }
      v[a] = dq[a] + VISC * mx; v[a + 1] = dq[a + 1] + VISC * my; v[a + 2] = dq[a + 2] + VISC * mz;
      p[a] = q[a]; p[a + 1] = q[a + 1]; p[a + 2] = q[a + 2];
      if (!(p[a] + p[a + 1] + p[a + 2] + v[a] + v[a + 1] + v[a + 2] < Infinity)) { // a broken number would spread to every neighbour: drop the particle back in
        p[a] = (x0 + x1) / 2; p[a + 1] = y0 + profundidade + d; p[a + 2] = (z0 + z1) / 2; v[a] = v[a + 1] = v[a + 2] = 0;
      }
      const s = Math.sqrt(v[a] * v[a] + v[a + 1] * v[a + 1] + v[a + 2] * v[a + 2]) / (4 * tile), solto = 1 - Math.min(1, nviz[i] / 15);
      espuma[i] = Math.max(espuma[i] * 0.93, Math.min(1, Math.max(0, s - 0.4) * solto * 1.5));
    }
  }

  return {
    N, d, posicoes: p, velocidades: v, espuma, nviz, passo, get n() { return n; },
    // adds up to qtd particles falling from `ponto` (default: above the middle of the basin); returns how many fit
    derramar(qtd = 300, ponto) {
      bica = ponto || { x: (x0 + x1) / 2, y: y0 + profundidade + 3 * tile, z: (z0 + z1) / 2 };
      const cabem = Math.max(0, Math.min(qtd, N - n - fila)); fila += cabem; return cabem;
    },
  };
}

export function criarFluido(opcoes) {
  const {
    THREE, scene, renderer, camera, bacia, luzes = [],
    resolucao = 0.5, // the surface is drawn at this fraction of the screen: cheaper, and the chunky pixels suit the PSX look
    cor = 0x12383a, ambiente = 0x0c1020,
  } = opcoes;
  if (!camera || !camera.isPerspectiveCamera) throw new Error('criarFluido: passe camera (PerspectiveCamera); a superfície é desenhada em espaço de tela');
  const sim = criarSimulacao(opcoes), { N, d, posicoes: p, espuma, nviz } = sim, { x0, z0, x1, z1, y0 } = bacia;
  let ligado = true; const antes = []; // antes: last position of each unit, for the ones that come without `vel`

  // ---- drawing: spheres' depth -> blur that respects edges -> normals and lighting on a full-screen quad ----
  const fragDepth = renderer.capabilities.isWebGL2 || !!renderer.extensions.get('EXT_frag_depth');
  const geo = new THREE.BufferGeometry(), aPos = new THREE.BufferAttribute(p, 3), aEsp = new THREE.BufferAttribute(espuma, 1), tam = new Float32Array(N), aTam = new THREE.BufferAttribute(tam, 1);
  aPos.usage = aEsp.usage = aTam.usage = THREE.DynamicDrawUsage; geo.setAttribute('position', aPos); geo.setAttribute('espuma', aEsp); geo.setAttribute('tam', aTam);
  const U = { uRaio: { value: d * 1.15 }, uPx: { value: 1 }, uPerto: { value: 0.1 }, uLonge: { value: 100 } };
  const matProf = new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: 'uniform float uRaio, uPx; attribute float tam; varying float vZ, vR; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vZ = -mv.z; vR = uRaio * tam; gl_Position = projectionMatrix * mv; gl_PointSize = 2. * vR * uPx / vZ; }',
    fragmentShader: `uniform float uPerto, uLonge; varying float vZ, vR; ${EMPACOTA}
      void main() { vec2 c = gl_PointCoord * 2. - 1.; float r2 = dot(c, c); if (r2 > 1.) discard;
        gl_FragColor = empacota((vZ - sqrt(1. - r2) * vR - uPerto) / (uLonge - uPerto)); }`,
  });
  const matEsp = new THREE.ShaderMaterial({
    uniforms: U, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
    vertexShader: 'uniform float uRaio, uPx; attribute float espuma, tam; varying float vE; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.); vE = espuma; gl_Position = projectionMatrix * mv; gl_PointSize = 3. * uRaio * tam * uPx / -mv.z; }',
    fragmentShader: 'varying float vE; void main() { vec2 c = gl_PointCoord * 2. - 1.; float a = 1. - dot(c, c); if (a < 0.) discard; gl_FragColor = vec4(a * 0.07, a * vE * 0.2, 0., 1.); }',
  });
  const pontos = new THREE.Points(geo, matProf); pontos.frustumCulled = false;
  const cenaP = new THREE.Scene(); cenaP.add(pontos);

  const alvo = (filtro, depth) => new THREE.WebGLRenderTarget(4, 4, { minFilter: filtro, magFilter: filtro, depthBuffer: depth, stencilBuffer: false, generateMipmaps: false });
  const tA = alvo(THREE.NearestFilter, true), tB = alvo(THREE.NearestFilter, false), tE = alvo(THREE.LinearFilter, false);
  const matBorra = new THREE.ShaderMaterial({
    uniforms: { ...U, tProf: { value: null }, uDir: { value: new THREE.Vector2() }, uLargo: { value: d * 4 }, uTol: { value: d * 2 }, uFator: { value: 1 } },
    depthTest: false, depthWrite: false, vertexShader: TELA_VS,
    fragmentShader: `uniform sampler2D tProf; uniform vec2 uDir; uniform float uPx, uPerto, uLonge, uLargo, uTol, uFator; varying vec2 vUv; ${EMPACOTA}
      void main() { float t0 = desempacota(texture2D(tProf, vUv)); if (t0 > 0.9995) { gl_FragColor = vec4(1.); return; }
        float z0 = uPerto + t0 * (uLonge - uPerto), soma = z0, peso = 1.;
        float passo = clamp(uLargo * uPx / z0 / 5., 1., 6.) * uFator; // blur as wide as a particle looks at this distance
        for (int i = 1; i <= 5; i++) for (int s = -1; s <= 1; s += 2) {
          float t = desempacota(texture2D(tProf, vUv + uDir * passo * float(i * s))); if (t > 0.9995) continue;
          float z = uPerto + t * (uLonge - uPerto), dz = (z - z0) / uTol, w = exp(-float(i * i) / 12.5 - dz * dz); soma += z * w; peso += w; }
        gl_FragColor = empacota((soma / peso - uPerto) / (uLonge - uPerto)); }`,
  });
  const LUZ = 4, quadGeo = new THREE.PlaneBufferGeometry(2, 2);
  const cenaQ = new THREE.Scene(), quadQ = new THREE.Mesh(quadGeo, matBorra); quadQ.frustumCulled = false; cenaQ.add(quadQ);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      ...U, tProf: { value: tA.texture }, tEsp: { value: tE.texture }, uTan: { value: new THREE.Vector2() }, uTexel: { value: new THREE.Vector2() }, uP: { value: new THREE.Vector2() },
      uLuzPos: { value: Array.from({ length: LUZ }, () => new THREE.Vector3()) }, uLuzCor: { value: Array.from({ length: LUZ }, () => new THREE.Color(0)) }, uLuzAlc: { value: [1, 1, 1, 1] },
      uCor: { value: new THREE.Color(cor) }, uAmb: { value: new THREE.Color(ambiente) }, uNevoa: { value: new THREE.Color(0) }, uNevoaLim: { value: new THREE.Vector2(0, 0) },
    },
    defines: fragDepth ? { PROFUNDIDADE: 1 } : {}, extensions: { fragDepth }, transparent: true, depthTest: fragDepth, depthWrite: false, vertexShader: TELA_VS,
    fragmentShader: `uniform sampler2D tProf, tEsp; uniform vec2 uTan, uTexel, uP, uNevoaLim; uniform float uPerto, uLonge;
      uniform vec3 uLuzPos[${LUZ}], uLuzCor[${LUZ}], uCor, uAmb, uNevoa; uniform float uLuzAlc[${LUZ}]; varying vec2 vUv; ${EMPACOTA}
      float lerZ(vec2 uv) { float t = desempacota(texture2D(tProf, uv)); return t > 0.9995 ? -1. : uPerto + t * (uLonge - uPerto); }
      vec3 pos(vec2 uv, float z) { return vec3((uv * 2. - 1.) * uTan * z, -z); }
      void main() { float z = lerZ(vUv); if (z < 0.) discard; vec3 p = pos(vUv, z);
        #ifdef PROFUNDIDADE
        gl_FragDepthEXT = 0.5 * (uP.x * -z + uP.y) / z + 0.5; // the same depth the scene wrote, so columns and characters hide the liquid
        #endif
        // slope of the surface from the neighbouring pixels, taking on each axis the side that is on the same surface
        vec2 ex = vec2(uTexel.x, 0.), ey = vec2(0., uTexel.y); float zr = lerZ(vUv + ex), zl = lerZ(vUv - ex), zu = lerZ(vUv + ey), zd = lerZ(vUv - ey);
        // (both sides when both are on it: the average hides the grain the particles leave)
        float salto = 0.02 * z;
        vec3 dx = zr > 0. && zl > 0. && abs(zr - z) < salto && abs(zl - z) < salto ? pos(vUv + ex, zr) - pos(vUv - ex, zl)
          : zr > 0. && (zl < 0. || abs(zr - z) <= abs(zl - z)) ? pos(vUv + ex, zr) - p : (zl > 0. ? p - pos(vUv - ex, zl) : vec3(1., 0., 0.));
        vec3 dy = zu > 0. && zd > 0. && abs(zu - z) < salto && abs(zd - z) < salto ? pos(vUv + ey, zu) - pos(vUv - ey, zd)
          : zu > 0. && (zd < 0. || abs(zu - z) <= abs(zd - z)) ? pos(vUv + ey, zu) - p : (zd > 0. ? p - pos(vUv - ey, zd) : vec3(0., 1., 0.));
        vec3 N = normalize(cross(dx, dy)), V = normalize(-p), cima = (viewMatrix * vec4(0., 1., 0., 0.)).xyz;
        float fres = 0.03 + 0.97 * pow(1. - max(dot(N, V), 0.), 5.);
        vec3 dif = uAmb, esp = vec3(0.);
        for (int i = 0; i < ${LUZ}; i++) { vec3 L = uLuzPos[i] - p; float dl = length(L); L /= dl; float att = pow(clamp(1. - dl / uLuzAlc[i], 0., 1.), 2.);
          dif += uLuzCor[i] * att * (0.35 + 0.65 * max(dot(N, L), 0.)); esp += uLuzCor[i] * att * pow(max(dot(N, normalize(L + V)), 0.), 40.); }
        vec4 e = texture2D(tEsp, vUv); float grosso = 1. - exp(-e.r * 2.2), branco = clamp(e.g * 1.5, 0., 1.);
        vec3 c = uCor * dif; // murky body lit by the torches
        c = mix(c, uAmb * (0.6 + 1.6 * clamp(dot(reflect(-V, N), cima), 0., 1.)) + dif * 0.25, fres); // grazing angles mirror the dark room
        c += esp * 1.6; c = mix(c, vec3(0.5, 0.56, 0.55) * min(dif, vec3(1.2)), branco * 0.7);
        float a = clamp(max(grosso, fres * smoothstep(0., 0.3, grosso)) * 0.9 + dot(esp, vec3(0.5)) + branco * 0.4, 0., 0.97); // a thin drop stays see-through even at its rim
        if (uNevoaLim.y > 0.) c = mix(c, uNevoa, smoothstep(uNevoaLim.x, uNevoaLim.y, length(p)));
        gl_FragColor = vec4(c, a); }`,
  });
  const quad = new THREE.Mesh(quadGeo, mat); quad.frustumCulled = false; scene.add(quad);
  quad.renderOrder = -1; // first of the see-through things: flames, dust and haze in front of the liquid are drawn over it, not dimmed by it

  const tela = new THREE.Vector2(), corLimpa = new THREE.Color(), centro = new THREE.Vector3((x0 + x1) / 2, y0, (z0 + z1) / 2);
  const est = { particulas: sim.n, maximo: N, espacamento: d, msSimulacao: 0, msDesenho: 0, vizinhosMedios: 0, ocultaAtrasDaCena: fragDepth, onde: 'processador (thread principal)' };

  function desenha(cam) {
    renderer.getDrawingBufferSize(tela);
    const w = Math.max(4, Math.round(tela.x * resolucao)), a = Math.max(4, Math.round(tela.y * resolucao));
    if (tA.width !== w || tA.height !== a) { tA.setSize(w, a); tB.setSize(w, a); tE.setSize(w >> 1, a >> 1); }
    for (let i = 0; i < sim.n; i++) tam[i] = nviz[i] < 5 ? 0.55 : nviz[i] < 9 ? 0.8 : 1; // a loose drop is drawn smaller than the liquid's body
    aPos.needsUpdate = aEsp.needsUpdate = aTam.needsUpdate = true; geo.setDrawRange(0, sim.n);
    const P = cam.projectionMatrix.elements;
    U.uPx.value = (P[5] * a) / 2; U.uPerto.value = cam.near; U.uLonge.value = cam.far;
    mat.uniforms.uTan.value.set(1 / P[0], 1 / P[5]); mat.uniforms.uTexel.value.set(1 / w, 1 / a); mat.uniforms.uP.value.set(P[10], P[14]);
    // the four lights that reach the basin best, moved to the camera's space
    cam.updateMatrixWorld(); const inv = cam.matrixWorldInverse; if (inv.invert) inv.copy(cam.matrixWorld).invert(); else inv.getInverse(cam.matrixWorld);
    const vivas = luzes.filter((l) => l.visible !== false && l.intensity > 0).map((l) => ({ l, k: l.intensity / (1 + l.position.distanceToSquared(centro)) })).sort((m, o) => o.k - m.k);
    for (let i = 0; i < LUZ; i++) {
      const l = vivas[i] && vivas[i].l;
      mat.uniforms.uLuzCor.value[i].setRGB(0, 0, 0); if (!l) continue;
      mat.uniforms.uLuzPos.value[i].copy(l.position).applyMatrix4(inv);
      mat.uniforms.uLuzCor.value[i].copy(l.color).multiplyScalar(l.intensity); mat.uniforms.uLuzAlc.value[i] = l.distance || 1e6;
    }
    const f = scene.fog; mat.uniforms.uNevoaLim.value.set(f && f.far ? f.near : 0, f && f.far ? f.far : 0); if (f) mat.uniforms.uNevoa.value.copy(f.color);

    // the pre-passes borrow the renderer: put back what the page had
    const alvoAntes = renderer.getRenderTarget(), auto = renderer.autoClear, alfa = renderer.getClearAlpha(); corLimpa.copy(renderer.getClearColor());
    renderer.autoClear = false;
    renderer.setClearColor(0xffffff, 1); renderer.setRenderTarget(tA); renderer.clear(); pontos.material = matProf; renderer.render(cenaP, cam);
    renderer.setClearColor(0x000000, 1); renderer.setRenderTarget(tE); renderer.clear(); pontos.material = matEsp; U.uPx.value = (P[5] * (a >> 1)) / 2; renderer.render(cenaP, cam);
    U.uPx.value = (P[5] * a) / 2;
    for (let k = 0; k < 2; k++) { // two rounds of across-then-down, wide then fine: the wide one alone skips pixels and leaves a weave
      matBorra.uniforms.uFator.value = k ? 0.4 : 1;
      matBorra.uniforms.tProf.value = tA.texture; matBorra.uniforms.uDir.value.set(1 / w, 0); renderer.setRenderTarget(tB); renderer.render(cenaQ, cam);
      matBorra.uniforms.tProf.value = tB.texture; matBorra.uniforms.uDir.value.set(0, 1 / a); renderer.setRenderTarget(tA); renderer.render(cenaQ, cam);
    }
    renderer.setRenderTarget(alvoAntes); renderer.setClearColor(corLimpa, alfa); renderer.autoClear = auto;
  }

  return {
    estatisticas: est,
    // Call once per frame BEFORE the page's renderer.render(scene, camera).
    update(dt, unidades = [], cam = camera) {
      quad.visible = ligado; if (!ligado) return;
      const us = unidades.map((u, i) => {
        const a = antes[i] || (antes[i] = { x: u.pos.x, y: u.pos.y, z: u.pos.z });
        const vel = u.vel || (dt > 0 ? { x: (u.pos.x - a.x) / dt, y: 0, z: (u.pos.z - a.z) / dt } : { x: 0, y: 0, z: 0 });
        a.x = u.pos.x; a.y = u.pos.y; a.z = u.pos.z;
        return { pos: u.pos, vel, raio: u.raio, altura: u.altura };
      });
      // ponytail: one step per frame, dt held between 1/120 and 1/40 s (below 40 frames/s the liquid runs in slow
      // motion instead of costing more); fixed sub-steps if the speed must not depend on the frame rate
      const t0 = performance.now(); if (dt > 0) sim.passo(Math.min(1 / 40, Math.max(1 / 120, dt)), us);
      const t1 = performance.now(); desenha(cam); const t2 = performance.now();
      const n = sim.n; let soma = 0; for (let i = 0; i < n; i++) soma += nviz[i];
      est.particulas = n; est.vizinhosMedios = n ? soma / n : 0;
      est.msSimulacao += (t1 - t0 - est.msSimulacao) * 0.1; est.msDesenho += (t2 - t1 - est.msDesenho) * 0.1; // running averages
    },
    setEnabled(on) { ligado = !!on; quad.visible = ligado; },
    derramar: sim.derramar, posicoes: p, velocidades: sim.velocidades,
    dispose() {
      scene.remove(quad); [geo, quadGeo, matProf, matEsp, matBorra, mat, tA, tB, tE].forEach((o) => o.dispose());
    },
  };
}
