// Parameters of the four live scenes, as the scene contract fixes them (same names, ranges and defaults on the Godot web
// export). A value outside its range is ignored, falls back to the default and becomes a warning.
export const CENAS = ['fisica', 'particulas', 'sombras', 'nevoa'] as const;
export type NomeCena = (typeof CENAS)[number];

export interface Params {
  qtd: number;
  luzes: number;
  otimizado: number;
  modo: number;
  passos: number;
  sombras: number;
  seed: number;
  segundos: number;
  ui: number;
}
type Chave = keyof Params;

const FAIXA: Record<NomeCena, Partial<Record<Chave, number[]>>> = {
  fisica: { qtd: [0, 100, 1000, 5000] },
  particulas: { qtd: [0, 1000, 10000, 100000] },
  sombras: { luzes: [0, 4, 16], otimizado: [0, 1] },
  nevoa: { modo: [0, 1, 2, 3], passos: [16, 32, 64] },
};
const COMUM: Partial<Record<Chave, number[]>> = { sombras: [0, 1], ui: [0, 1] };
const PADRAO: Record<NomeCena, Params> = {
  fisica: { qtd: 1000, luzes: 0, otimizado: 1, modo: 0, passos: 32, sombras: 0, seed: 1, segundos: 0, ui: 1 },
  particulas: { qtd: 10000, luzes: 0, otimizado: 1, modo: 0, passos: 32, sombras: 0, seed: 1, segundos: 0, ui: 1 },
  sombras: { qtd: 0, luzes: 4, otimizado: 1, modo: 0, passos: 32, sombras: 1, seed: 1, segundos: 0, ui: 1 },
  nevoa: { qtd: 0, luzes: 0, otimizado: 1, modo: 2, passos: 32, sombras: 1, seed: 1, segundos: 0, ui: 1 },
};
/** the parameters each scene reads (and passes to the Godot iframe) */
export const USADOS: Record<NomeCena, Chave[]> = {
  fisica: ['qtd', 'sombras'],
  particulas: ['qtd', 'sombras'],
  sombras: ['luzes', 'otimizado', 'sombras'],
  nevoa: ['modo', 'passos', 'sombras'],
};
/** the main parameter (arrow keys) */
export const PRINCIPAL: Record<NomeCena, Chave> = { fisica: 'qtd', particulas: 'qtd', sombras: 'luzes', nevoa: 'modo' };

export const faixa = (cena: NomeCena, k: Chave) => FAIXA[cena][k] ?? COMUM[k];

export function lerParams(cena: NomeCena, busca: URLSearchParams) {
  const p = { ...PADRAO[cena] };
  const avisos: string[] = [];
  for (const k of Object.keys(p) as Chave[]) {
    const bruto = busca.get(k);
    if (bruto === null) continue;
    const v = /^\d+$/.test(bruto) ? Number(bruto) : NaN;
    const f = faixa(cena, k);
    if (Number.isNaN(v) || (f && !f.includes(v))) avisos.push(`valor fora da faixa: ${k}=${bruto} (ignorado)`);
    else p[k] = v;
  }
  if (cena === 'nevoa' && p.modo === 3) {
    p.modo = 2;
    avisos.push('modo 3 (FogVolume) só existe no Godot nativo com Forward+; aqui vira o modo 2');
  }
  return { p, avisos };
}

/** Query string for both sides: only the parameters the scene reads, plus the measurement ones when set. */
export function paraBusca(cena: NomeCena, p: Params) {
  const b = new URLSearchParams();
  for (const k of USADOS[cena]) b.set(k, String(p[k]));
  if (p.seed !== 1) b.set('seed', String(p.seed));
  if (p.segundos > 0) b.set('segundos', String(p.segundos));
  if (p.ui === 0) b.set('ui', '0');
  return b;
}

/** Next or previous value of the main parameter (arrow keys), clamped to the range. */
export function passo(cena: NomeCena, p: Params, delta: 1 | -1): Params {
  const k = PRINCIPAL[cena];
  const f = faixa(cena, k)!;
  const i = Math.min(f.length - 1, Math.max(0, f.indexOf(p[k]) + delta));
  return { ...p, [k]: f[i] };
}
