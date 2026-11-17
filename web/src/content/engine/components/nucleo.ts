// Port of the bench core (banco-threejs/nucleo.js), the twin of the Godot bench: same seeded generator, terrain, draws,
// signature and frame meter. The live "sombras" scene must give the same `assinatura` on both engines (scene contract).
export const H = 0.5;
export const NIVEIS = [0, 1, 3, 5, 7, 9];
export const N_TEX = 4;
export const AQUECIMENTO_MS = 2000;
const VEL_CHAR = 1.5;

export function prng(seed: number) {
  let s = Math.imul(seed, 2654435761) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function gerarMapa(n: number, seed: number) {
  const r = prng(seed + 1000);
  const g = Math.floor(n / 8) + 2;
  const grossa: number[] = [];
  for (let i = 0; i < g * g; i++) grossa.push(r());
  const alt: number[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const gx = x / 8;
      const gy = y / 8;
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);
      const fx = gx - ix;
      const fy = gy - iy;
      const a = grossa[iy * g + ix]!;
      const b = grossa[iy * g + ix + 1]!;
      const c = grossa[(iy + 1) * g + ix]!;
      const d = grossa[(iy + 1) * g + ix + 1]!;
      const cima = a + (b - a) * fx;
      const baixo = c + (d - c) * fx;
      const v = 0.45 * (cima + (baixo - cima) * fy) + 0.65 * (1 - y / (n - 1)) - 0.1;
      alt.push(NIVEIS[Math.min(5, Math.max(0, Math.floor(v * 6)))]!);
    }
  }
  return alt;
}

function celulaTerra(r: () => number, alt: number[], n: number): [number, number] {
  let x = 0;
  let y = 0;
  for (let t = 0; t < 20; t++) {
    x = 1 + Math.floor(r() * (n - 2));
    y = 1 + Math.floor(r() * (n - 2));
    const h = alt[y * n + x];
    if (h !== 0 && h !== 9) break;
  }
  return [x, y];
}

function andavel(alt: number[], n: number, x: number, y: number, nx: number, ny: number) {
  if (nx < 0 || ny < 0 || nx >= n || ny >= n) return false;
  const a = alt[y * n + x]!;
  const b = alt[ny * n + nx]!;
  if (b === 0 || b === 9) return false;
  return Math.abs(NIVEIS.indexOf(a) - NIVEIS.indexOf(b)) <= 1;
}

interface Char {
  x: number;
  y: number;
  tx: number;
  ty: number;
  t: number;
  espera: number;
  r: () => number;
}
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function novoChar(seed: number, i: number, x: number, y: number): Char {
  const r = prng(seed + 1000 * (10 + i));
  return { x, y, tx: x, ty: y, t: 0, espera: r(), r };
}

function proximo(c: Char, alt: number[], n: number) {
  if (c.r() < 0.2) {
    c.espera = 0.5 + c.r();
    return;
  }
  const d = DIRS[Math.floor(c.r() * 4)]!;
  const nx = c.x + d[0];
  const ny = c.y + d[1];
  if (andavel(alt, n, c.x, c.y, nx, ny)) {
    c.tx = nx;
    c.ty = ny;
    c.t = 0;
  } else c.espera = 0.3;
}

function passoChar(c: Char, alt: number[], n: number, dt: number) {
  if (c.espera > 0) {
    c.espera -= dt;
    if (c.espera <= 0) {
      c.espera = 0;
      proximo(c, alt, n);
    }
  } else if (c.tx !== c.x || c.ty !== c.y) {
    c.t += dt * VEL_CHAR;
    if (c.t >= 1) {
      c.x = c.tx;
      c.y = c.ty;
      c.t = 0;
      proximo(c, alt, n);
    }
  } else proximo(c, alt, n);
}

/** The bench scene draws for the city: terrain, buildings [x, y, type] and point lights [x, y]; no characters. */
export function gerarCidade(p: { mapa: number; predios: number; luzes: number; seed: number }) {
  const n = p.mapa;
  const alt = gerarMapa(n, p.seed);
  const rp = prng(p.seed + 2000);
  const rl = prng(p.seed + 5000);
  const predios: [number, number, number][] = [];
  for (let i = 0; i < p.predios; i++) {
    const [x, y] = celulaTerra(rp, alt, n);
    predios.push([x, y, Math.floor(rp() * 7)]);
  }
  const luzes: [number, number][] = [];
  for (let i = 0; i < p.luzes; i++) luzes.push(celulaTerra(rl, alt, n));
  // FNV-1a over terrain and draws (no characters, no emitters) plus a probe character walking 100 steps of 0.1 s
  let h = 2166136261;
  const mix = (v: number) => {
    h = Math.imul(h ^ v, 16777619) >>> 0;
  };
  alt.forEach(mix);
  for (const q of predios) q.forEach(mix);
  for (const q of luzes) q.forEach(mix);
  const [x, y] = celulaTerra(prng(p.seed + 9000), alt, n);
  const prova = novoChar(p.seed, 9999, x, y);
  for (let i = 0; i < 100; i++) passoChar(prova, alt, n, 0.1);
  mix(prova.x);
  mix(prova.y);
  mix(prova.tx);
  mix(prova.ty);
  return { n, alt, predios, luzes, assinatura: h };
}

/** Frame meter of the bench: drops AQUECIMENTO_MS, measures `segundos`, closes whole 1 s buckets. */
export function criarMedidor(segundos: number) {
  let aquecido = 0;
  let tAcum = 0;
  let cont = 0;
  const dts: number[] = [];
  const porSeg: number[] = [];
  return {
    quadro(dt: number) {
      if (aquecido < AQUECIMENTO_MS) {
        aquecido += dt;
        return false;
      }
      dts.push(dt);
      tAcum += dt;
      cont++;
      while (tAcum >= (porSeg.length + 1) * 1000) {
        porSeg.push(cont);
        cont = 0;
      }
      return tAcum >= segundos * 1000;
    },
    resultado() {
      const q = dts.length;
      const ord = [...dts].sort((a, b) => a - b);
      const p99 = ord[Math.min(q - 1, Math.floor(q * 0.99))]!;
      const r2 = (v: number) => Math.round(v * 100) / 100;
      return {
        quadros: q,
        segundosMedidos: r2(tAcum / 1000),
        fpsMedio: r2(q / (tAcum / 1000)),
        fpsMinimoPorSegundo: Math.min(...porSeg),
        fps1pctLow: r2(1000 / p99),
        msPorQuadroMedio: r2(tAcum / q),
        msPorQuadroP99: r2(p99),
        fpsPorSegundo: porSeg,
      };
    },
  };
}
