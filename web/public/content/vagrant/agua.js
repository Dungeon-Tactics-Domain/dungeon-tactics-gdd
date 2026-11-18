// Simulated water that reacts to the characters: a height grid run by the wave equation, drawn as one flat quad whose
// shader bends a stone bottom by the wave's slope and adds a dark blue fresnel, torch glints, foam and splash drops.
// No imports: the host passes its own THREE (written against r117), so the module rides on whatever the page loads.
// Units are VS tiles (1 tile = 128 raw units; a character is ~3.7 tiles tall). See agua-LEIAME.md.

// The simulation runs on the CPU on purpose: alturaDaAguaEm() has to answer in the same frame, which a GPU grid only
// does with a blocking read-back, and r117 opens WebGL1 where float render targets are not guaranteed on phones.
// Measured cost is in agua-LEIAME.md (a 128x128 grid is well under a millisecond per frame).

// What each mode means for the host. `velocidade` multiplies the walking speed; `peito` is how much of the body's
// height sits under the surface while swimming (the pit is shallower than a chest-deep character, so it floats).
export const MODOS = {
  rasa: { profundidade: 0.3, velocidade: 0.85, animacao: 'andar-na-agua', forca: 1, borda: 0.5, onda: 1.5, amortece: 1.1, ambiente: 0.012 },
  fosso: { profundidade: 1.5, velocidade: 0.6, animacao: 'nadar', forca: 1.9, borda: 0, onda: 2.1, amortece: 0.55, ambiente: 0.028, peito: 0.72 },
};

const LUZES = 6, CORPOS = 8, GOTAS = 120;
const H_MAX = 0.3, INCL_MAX = 2; // ranges packed into the texture: height in tiles, slope in tiles per tile
const C_MAX = 0.67; // wave speed in cells per step; the 5-point stencil is stable below 1/sqrt(2)
const GRAV = 12;

const VERT = `
varying vec3 vMundo;
void main() {
  vec4 m = modelMatrix * vec4(position, 1.0);
  vMundo = m.xyz;
  gl_Position = projectionMatrix * viewMatrix * m;
}`;

const FRAG = `
uniform sampler2D mapa;
uniform vec4 regiao;
uniform float tempo, prof, borda, ondinha;
uniform vec3 luzPos[${LUZES}];
uniform vec3 luzCor[${LUZES}];
uniform float luzAlc[${LUZES}];
uniform vec4 corpos[${CORPOS}];
uniform vec3 ambiente, nevoaCor;
uniform vec2 nevoa;
varying vec3 vMundo;

float acaso(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ruido(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(acaso(i), acaso(i + vec2(1.0, 0.0)), f.x), mix(acaso(i + vec2(0.0, 1.0)), acaso(i + vec2(1.0, 1.0)), f.x), f.y);
}
// the same falloff three r117 gives a PointLight with decay 2
float queda(float d, float alcance) { float k = clamp(1.0 - d / alcance, 0.0, 1.0); return k * k; }

void main() {
  vec2 uv = (vMundo.xz - regiao.xy) / (regiao.zw - regiao.xy);
  vec4 t = texture2D(mapa, uv);
  float h = (t.r - 0.5) * ${(2 * H_MAX).toFixed(2)};
  vec2 incl = (t.gb - 0.5) * ${(2 * INCL_MAX).toFixed(2)};
  // a slow swell so still water is never a mirror-flat slab
  vec2 p = vMundo.xz;
  incl += ondinha * vec2(cos(p.x * 3.1 + tempo * 1.3) + cos((p.x + p.y) * 5.3 - tempo * 1.7), cos(p.y * 3.7 - tempo * 1.1) + cos((p.x - p.y) * 4.9 + tempo * 1.9));
  vec3 n = normalize(vec3(-incl.x, 1.0, -incl.y));
  vec3 paraOlho = cameraPosition - vMundo;
  float dist = length(paraOlho);
  vec3 V = paraOlho / dist;

  vec2 beira2 = min(vMundo.xz - regiao.xy, regiao.zw - vMundo.xz);
  float beira = min(beira2.x, beira2.y);
  float rampa = borda > 0.0 ? smoothstep(0.0, borda, beira) : 1.0;
  float d = prof * rampa;

  // the bottom, seen where the bent ray lands: flagstones one tile wide
  vec2 pf = p + n.xz * (0.3 + d) - V.xz / max(V.y, 0.3) * d * 0.45;
  vec2 laje = abs(fract(pf) - 0.5);
  float junta = smoothstep(0.44, 0.5, max(laje.x, laje.y));
  vec3 fundo = mix(vec3(0.30, 0.31, 0.33), vec3(0.15, 0.15, 0.17), ruido(pf * 4.0)) * (1.0 - 0.6 * junta);
  fundo *= 1.0 + 8.0 * h; // crests focus light, troughs spread it

  vec3 luzFundo = ambiente, luzTopo = ambiente, brilho = vec3(0.0), relevo = vec3(0.0);
  for (int i = 0; i < ${LUZES}; i++) {
    vec3 ate = luzPos[i] - vMundo;
    float dl = length(ate);
    float q = queda(dl, luzAlc[i]);
    vec3 L = ate / dl;
    luzTopo += luzCor[i] * q * max(L.y, 0.0);
    relevo += luzCor[i] * q * (dot(n, L) - L.y); // the side of a ripple that faces the torch, against the far side
    luzFundo += luzCor[i] * queda(length(luzPos[i] - vec3(pf.x, vMundo.y - d, pf.y)), luzAlc[i]);
    float e = max(dot(n, normalize(L + V)), 0.0);
    // The torch's mirror image, smeared by the ripples: a tight glint on the crests, a streak and a wide glow. A
    // reflection dims with distance far less than the light the torch throws, hence the square root.
    brilho += luzCor[i] * sqrt(q) * (pow(e, 400.0) * 3.0 + pow(e, 90.0) * 0.2 + pow(e, 10.0) * 0.05);
  }

  float sombra = 1.0;
  for (int i = 0; i < ${CORPOS}; i++) sombra *= 1.0 - 0.65 * corpos[i].w * smoothstep(corpos[i].z * 1.7, corpos[i].z * 0.5, length(pf - corpos[i].xy));

  float limpa = exp(-d * 1.5) * 0.62; // how much of the bottom survives the water above it
  vec3 cor = mix(vec3(0.014, 0.04, 0.1) * (luzFundo * 2.0 + 0.5), fundo * vec3(0.3, 0.5, 0.85) * luzFundo, limpa) * sombra;
  float fresnel = 0.03 + 0.97 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  cor = mix(cor, vec3(0.012, 0.018, 0.035) + luzTopo * vec3(0.03, 0.05, 0.09), fresnel) + brilho + relevo * vec3(0.25, 0.4, 0.6);

  float espuma = clamp(t.a * 1.4 * (0.55 + 0.45 * ruido(p * 14.0 + tempo * 0.7)), 0.0, 1.0);
  cor = mix(cor, vec3(0.75, 0.82, 0.88) * (luzTopo * 1.5 + 0.1), espuma * 0.85);

  float alfa = max(max(mix(0.97, 0.72, limpa), fresnel), espuma);
  if (borda > 0.0) alfa *= smoothstep(0.0, borda * 0.4, beira);
  if (nevoa.y > 0.0) cor = mix(cor, nevoaCor, smoothstep(nevoa.x, nevoa.y, dist));
  gl_FragColor = vec4(cor, alfa);
}`;

export function criarAgua({ THREE, scene, renderer, regiao, modo = 'rasa', luzes = [], resolucao = 128, ambiente, textura = 'auto' }) {
  const { x0, z0, x1, z1, yAgua } = regiao;
  const largura = x1 - x0, fundura = z1 - z0;
  // square cells, `resolucao` of them along the longer side
  const cel = Math.max(largura, fundura) / resolucao;
  const nx = Math.max(8, Math.round(largura / cel)), nz = Math.max(8, Math.round(fundura / cel)), n = nx * nz;
  const h = new Float32Array(n), v = new Float32Array(n), espuma = new Float32Array(n);

  // Float texels when the device filters them, bytes otherwise: both hold the same 0-1 packing, so one shader.
  const flutua = textura !== 'bytes' && !!(renderer.capabilities.isWebGL2 || renderer.extensions.get('OES_texture_float')) && !!renderer.extensions.get('OES_texture_float_linear');
  const grava = flutua ? new Float32Array(n * 4) : new Uint8ClampedArray(n * 4), escala = flutua ? 1 : 255;
  const mapa = new THREE.DataTexture(flutua ? grava : new Uint8Array(grava.buffer), nx, nz, THREE.RGBAFormat, flutua ? THREE.FloatType : THREE.UnsignedByteType);
  mapa.magFilter = mapa.minFilter = THREE.LinearFilter;

  const uniforms = {
    mapa: { value: mapa }, regiao: { value: new THREE.Vector4(x0, z0, x1, z1) }, tempo: { value: 0 }, prof: { value: 0 }, borda: { value: 0 }, ondinha: { value: 0 },
    luzPos: { value: Array.from({ length: LUZES }, () => new THREE.Vector3()) }, luzCor: { value: Array.from({ length: LUZES }, () => new THREE.Color(0, 0, 0)) },
    luzAlc: { value: new Array(LUZES).fill(1) }, corpos: { value: Array.from({ length: CORPOS }, () => new THREE.Vector4()) },
    ambiente: { value: ambiente || new THREE.Color(0.04, 0.045, 0.07) }, nevoaCor: { value: new THREE.Color() }, nevoa: { value: new THREE.Vector2() },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
  const malha = new THREE.Mesh(new THREE.PlaneBufferGeometry(largura, fundura).rotateX(-Math.PI / 2), material);
  malha.position.set((x0 + x1) / 2, yAgua, (z0 + z1) / 2);
  scene.add(malha);

  // splash drops: additive points whose colour is the torch light where they were born
  const gp = new Float32Array(GOTAS * 3).fill(-1e6), gc = new Float32Array(GOTAS * 3), gv = new Float32Array(GOTAS * 3), viva = new Uint8Array(GOTAS);
  const gotasG = new THREE.BufferGeometry();
  gotasG.setAttribute('position', new THREE.BufferAttribute(gp, 3)); gotasG.setAttribute('color', new THREE.BufferAttribute(gc, 3));
  const gotas = new THREE.Points(gotasG, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  gotas.frustumCulled = false; scene.add(gotas);
  let proximaGota = 0;

  let M, ligada = true, descartada = false, hz, c2, acumulado = 0, acordada = 0, media = 0, tempo = 0;
  const estatisticas = { modo, ligada, grade: [nx, nz], textura: flutua ? 'float' : 'bytes', passosPorSegundo: 0, passosNoQuadro: 0, msCpu: 0, msCpuPico: 0, acordada: false, particulas: 0, dentro: 0, picoOnda: 0 };

  function setModo(novo) {
    if (!MODOS[novo]) throw new Error(`agua: modo desconhecido "${novo}" (use rasa ou fosso)`);
    M = MODOS[novo]; modo = novo; estatisticas.modo = novo;
    // Steps per second: enough for the wave to cross the grid at M.onda tiles/s without passing C_MAX cells a step,
    // never under 60 (so the picture moves every frame) and capped at 240 so a tiny dense region stays cheap: there
    // the wave just travels slower than M.onda.
    hz = Math.min(240, Math.max(60, M.onda / (C_MAX * cel)));
    const c = Math.min(C_MAX, M.onda / (cel * hz)); c2 = c * c;
    estatisticas.passosPorSegundo = Math.round(hz);
    uniforms.prof.value = M.profundidade; uniforms.borda.value = M.borda; uniforms.ondinha.value = M.ambiente;
  }
  setModo(modo);

  const naRegiao = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1;
  // 0 at the shore to 1 where the bottom is level: the shallow pool has a beach, the pit has walls
  function rampa(x, z) {
    if (!M.borda) return 1;
    const k = Math.min(1, Math.max(0, Math.min(x - x0, x1 - x, z - z0, z1 - z) / M.borda));
    return k * k * (3 - 2 * k);
  }
  const vale = (x, z) => ligada && !descartada && naRegiao(x, z);

  function profundidadeEm(x, z) { return vale(x, z) ? M.profundidade * rampa(x, z) : 0; }
  // how far under the surface the feet go: standing on the bottom when shallow, floating chest-deep in the pit
  function afundamentoEm(x, z, altura) { return !vale(x, z) ? 0 : M.peito && altura ? altura * M.peito : M.profundidade * rampa(x, z); }
  function fatorVelocidadeEm(x, z) { return vale(x, z) ? 1 + (M.velocidade - 1) * rampa(x, z) : 1; }
  function animacaoEm(x, z) { return vale(x, z) && rampa(x, z) > 0.3 ? M.animacao : 'andar'; }
  function alturaDaAguaEm(x, z) {
    if (!vale(x, z)) return null;
    const fx = Math.min(nx - 1, Math.max(0, (x - x0) / cel - 0.5)), fz = Math.min(nz - 1, Math.max(0, (z - z0) / cel - 0.5));
    const ix = Math.min(nx - 2, Math.floor(fx)), iz = Math.min(nz - 2, Math.floor(fz)), tx = fx - ix, tz = fz - iz, i = iz * nx + ix;
    return yAgua + (h[i] * (1 - tx) + h[i + 1] * tx) * (1 - tz) + (h[i + nx] * (1 - tx) + h[i + nx + 1] * tx) * tz;
  }
  function estadoEm(x, z, altura) {
    return { dentro: vale(x, z), yAgua, profundidade: profundidadeEm(x, z), afundamento: afundamentoEm(x, z, altura), velocidade: fatorVelocidadeEm(x, z), animacao: animacaoEm(x, z) };
  }

  // adds a gaussian blob (or a ring of that radius) to a field
  function carimbo(campo, x, z, raio, forca, anel) {
    const cx = (x - x0) / cel - 0.5, cz = (z - z0) / cel - 0.5, rc = Math.max(1.2, raio / cel), R = Math.ceil(rc * 2.2);
    const xa = Math.max(0, Math.floor(cx - R)), xb = Math.min(nx - 1, Math.ceil(cx + R)), za = Math.max(0, Math.floor(cz - R)), zb = Math.min(nz - 1, Math.ceil(cz + R));
    for (let j = za; j <= zb; j++) for (let i = xa; i <= xb; i++) {
      const d = Math.hypot(i - cx, j - cz) / rc;
      campo[j * nx + i] += forca * (anel ? Math.exp(-(d - 1) * (d - 1) * 9) : Math.exp(-d * d * 2));
    }
    acordada = 3;
  }

  function luzEm(x, y, z) {
    let k = 0.06;
    for (let i = 0; i < LUZES; i++) { const p = uniforms.luzPos.value[i], c = uniforms.luzCor.value[i]; k += Math.max(c.r, c.g, c.b) * Math.max(0, 1 - Math.hypot(p.x - x, p.y - y, p.z - z) / uniforms.luzAlc.value[i]) ** 2; }
    return Math.min(1, k);
  }
  function respingo(x, z, raio, quantas, forca) {
    const k = luzEm(x, yAgua, z);
    for (let q = 0; q < quantas; q++) {
      const i = proximaGota; proximaGota = (proximaGota + 1) % GOTAS;
      const a = Math.random() * Math.PI * 2, fora = 0.5 + Math.random() * 1.6, r = raio * (0.6 + Math.random() * 0.5);
      gp[i * 3] = x + Math.cos(a) * r; gp[i * 3 + 1] = yAgua + 0.02; gp[i * 3 + 2] = z + Math.sin(a) * r;
      gv[i * 3] = Math.cos(a) * fora; gv[i * 3 + 1] = (2.4 + Math.random() * 2.6) * forca; gv[i * 3 + 2] = Math.sin(a) * fora;
      gc[i * 3] = 0.55 * k; gc[i * 3 + 1] = 0.7 * k; gc[i * 3 + 2] = 0.9 * k; viva[i] = 1;
    }
  }

  // One entry per character, kept for good: the clipping plane it owns is already inside the host's materials.
  // ponytail: entries are never dropped, a few dozen bytes each; prune here if a host ever churns thousands of units
  const fichas = new Map();
  function ficha(u) {
    let f = fichas.get(u);
    if (!f) { f = { dentro: false, x: u.pos.x, z: u.pos.z, plano: new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e9) }; fichas.set(u, f); }
    return f;
  }
  // The plane cuts what is under the surface, and only while its owner is in this water: a character on the hall
  // floor is below the pit's water line too. Moving the constant (never swapping the array) avoids a recompile.
  const planoDeCorte = (u) => ficha(u).plano;
  const soltaCortes = () => fichas.forEach((f) => { f.dentro = false; f.plano.constant = 1e9; });
  function aplicarCorte(objeto, u) {
    const plano = planoDeCorte(u), principal = /void\s+main\s*\(\s*\)\s*\{/;
    renderer.localClippingEnabled = true;
    objeto.traverse((o) => [].concat(o.material || []).forEach((m) => {
      if (m.clippingPlanes && m.clippingPlanes.includes(plano)) return;
      // a ShaderMaterial clips only if its shaders carry three's chunks: VSTools' character shader does not
      if (m.isShaderMaterial && !m.clipping) {
        if (!m.vertexShader.includes('#include <project_vertex>')) { console.warn('agua: material sem <project_vertex>, corte não aplicado', m); return; }
        m.vertexShader = m.vertexShader.replace(principal, '#include <clipping_planes_pars_vertex>\n$&').replace('#include <project_vertex>', '$&\n#include <clipping_planes_vertex>');
        m.fragmentShader = m.fragmentShader.replace(principal, '#include <clipping_planes_pars_fragment>\n$&\n#include <clipping_planes_fragment>');
        m.clipping = true;
      }
      m.clippingPlanes = [...(m.clippingPlanes || []), plano]; m.needsUpdate = true;
    }));
    return plano;
  }

  function passo() {
    const amort = Math.exp(-M.amortece / hz);
    for (let z = 0; z < nz; z++) {
      const r = z * nx, rm = (z ? z - 1 : 0) * nx, rp = (z < nz - 1 ? z + 1 : z) * nx; // clamped rows: the walls reflect
      for (let x = 0; x < nx; x++) {
        const i = r + x;
        v[i] = (v[i] + c2 * (h[x ? i - 1 : i] + h[x < nx - 1 ? i + 1 : i] + h[rm + x] + h[rp + x] - 4 * h[i])) * amort;
      }
    }
    // the stamps add or remove water; pulling the mean back to zero keeps the level from drifting
    // (heights are held inside H_MAX, the most the texture can carry)
    let soma = 0, pico = 0; const puxa = media * 0.05;
    for (let i = 0; i < n; i++) { let a = h[i] + v[i] - puxa; if (a > H_MAX) a = H_MAX; else if (a < -H_MAX) a = -H_MAX; h[i] = a; soma += a; const m = a < 0 ? -a : a; if (m > pico) pico = m; }
    media = soma / n;
    return pico;
  }

  function empacota(dt) {
    const some = Math.exp(-1.6 * dt), kh = escala * 0.5 / H_MAX, ki = escala * 0.5 / (INCL_MAX * 2 * cel), meio = escala * 0.5;
    for (let z = 0; z < nz; z++) {
      const r = z * nx, rm = (z ? z - 1 : 0) * nx, rp = (z < nz - 1 ? z + 1 : z) * nx;
      for (let x = 0; x < nx; x++) {
        const i = r + x, o = i * 4, rapidez = (v[i] < 0 ? -v[i] : v[i]) * hz; // tiles per second, up or down
        const e = Math.min(1, espuma[i] * some + (rapidez > 0.32 ? (rapidez - 0.32) * 4 * dt : 0)); espuma[i] = e;
        grava[o] = meio + h[i] * kh;
        grava[o + 1] = meio + (h[x < nx - 1 ? i + 1 : i] - h[x ? i - 1 : i]) * ki;
        grava[o + 2] = meio + (h[rp + x] - h[rm + x]) * ki;
        grava[o + 3] = e * escala;
      }
    }
    mapa.needsUpdate = true;
  }
  empacota(0);

  function update(dt, unidades = []) {
    if (!ligada || descartada) return;
    const inicio = performance.now();
    dt = Math.min(dt, 0.1); tempo += dt; uniforms.tempo.value = tempo;

    // lights are read by reference every frame: the room moves its six PointLights between torches
    for (let i = 0; i < LUZES; i++) {
      const l = luzes[i], cor = uniforms.luzCor.value[i];
      const forca = !l || l.visible === false ? 0 : l.intensity !== undefined ? l.intensity : l.forca !== undefined ? l.forca : 1;
      if (!forca) { cor.setRGB(0, 0, 0); continue; }
      uniforms.luzPos.value[i].copy(l.position || l.pos); cor.copy(l.color || l.cor).multiplyScalar(forca);
      uniforms.luzAlc.value[i] = l.distance || l.alcance || 10;
    }
    const nev = scene.fog && scene.fog.isFog ? scene.fog : null; // the room switches its fog on and off
    uniforms.nevoa.value.set(nev ? nev.near : 0, nev ? nev.far : 0); if (nev) uniforms.nevoaCor.value.copy(nev.color);

    let dentro = 0;
    for (const u of unidades) {
      const f = ficha(u), x = u.pos.x, z = u.pos.z, raio = u.raio || 0.45;
      // feet at or under the surface: a jump out of the water counts as leaving it, and splashes on the way back
      const agora = naRegiao(x, z) && u.pos.y <= yAgua + 0.1;
      const rapidez = u.vel ? Math.hypot(u.vel.x, u.vel.z) : dt > 0 ? Math.hypot(x - f.x, z - f.z) / dt : 0;
      if (agora && !f.dentro) { // in: a hole that closes into a ring, foam around it, drops
        carimbo(h, x, z, raio * 1.3, -0.15 * M.forca); carimbo(espuma, x, z, raio * 1.25, 1, true); respingo(x, z, raio, Math.round(18 * M.forca), 0.8 + 0.2 * M.forca);
      } else if (agora && rapidez > 0.05) { // wading: the feet keep pushing water down, which trails a wake
        carimbo(h, x, z, raio, -0.007 * M.forca * Math.min(rapidez, 6) * Math.min(dt * 60, 3)); carimbo(espuma, x, z, raio * 0.9, 0.5 * dt * Math.min(rapidez, 6), true);
      } else if (!agora && f.dentro) { // out: the water the body lifted falls back where it left
        const sx = Math.min(x1, Math.max(x0, f.x)), sz = Math.min(z1, Math.max(z0, f.z));
        carimbo(h, sx, sz, raio * 1.2, 0.13 * M.forca); carimbo(espuma, sx, sz, raio, 0.8, true); respingo(sx, sz, raio * 0.8, Math.round(10 * M.forca), 0.7);
      }
      f.dentro = agora; f.x = x; f.z = z; f.plano.constant = agora ? -yAgua : 1e9;
      if (agora && dentro < CORPOS) uniforms.corpos.value[dentro++].set(x, z, raio, 1);
    }
    estatisticas.dentro = dentro;
    for (let i = dentro; i < CORPOS; i++) uniforms.corpos.value[i].w = 0;

    let passos = 0;
    if (acordada > 0) {
      acumulado = Math.min(acumulado + dt, 8 / hz); // at most 8 steps a frame: a slow frame slows the water, not the page
      let pico = 0;
      while (acumulado >= 1 / hz) { acumulado -= 1 / hz; pico = passo(); passos++; }
      if (passos) { if (pico > 0.0015) acordada = 3; else acordada -= dt; estatisticas.picoOnda = pico; }
      if (acordada <= 0) { h.fill(0); v.fill(0); espuma.fill(0); media = 0; estatisticas.picoOnda = 0; } // asleep: no cost until the next stamp
      empacota(dt);
    }
    estatisticas.passosNoQuadro = passos; estatisticas.acordada = acordada > 0;

    let vivas = 0;
    for (let i = 0; i < GOTAS; i++) {
      if (!viva[i]) continue;
      const o = i * 3;
      gv[o + 1] -= GRAV * dt; gp[o] += gv[o] * dt; gp[o + 1] += gv[o + 1] * dt; gp[o + 2] += gv[o + 2] * dt;
      if (gp[o + 1] < yAgua && gv[o + 1] < 0) { // back in the water: a small ring if it fell inside, then gone
        if (naRegiao(gp[o], gp[o + 2])) carimbo(h, gp[o], gp[o + 2], 0.06, -0.006);
        viva[i] = 0; gp[o + 1] = -1e6; continue;
      }
      vivas++;
    }
    if (vivas || estatisticas.particulas) { gotasG.attributes.position.needsUpdate = true; gotasG.attributes.color.needsUpdate = true; }
    estatisticas.particulas = vivas;

    const ms = performance.now() - inicio;
    estatisticas.msCpu += (ms - estatisticas.msCpu) * 0.05; if (ms > estatisticas.msCpuPico) estatisticas.msCpuPico = ms;
  }

  function setEnabled(sim) {
    ligada = !!sim; estatisticas.ligada = ligada; malha.visible = gotas.visible = ligada;
    if (!ligada) { soltaCortes(); h.fill(0); v.fill(0); espuma.fill(0); viva.fill(0); gp.fill(-1e6); acordada = 0; media = 0; empacota(0); gotasG.attributes.position.needsUpdate = true; }
  }
  function dispose() {
    setEnabled(false); descartada = true;
    scene.remove(malha); scene.remove(gotas);
    malha.geometry.dispose(); material.dispose(); mapa.dispose(); gotasG.dispose(); gotas.material.dispose();
  }

  return {
    update, setModo, setEnabled, dispose, alturaDaAguaEm, profundidadeEm, afundamentoEm, fatorVelocidadeEm, animacaoEm, estadoEm,
    planoDeCorte, aplicarCorte, estatisticas, regiao, malha, gotas, get modo() { return modo; }, get ligada() { return ligada; },
  };
}
