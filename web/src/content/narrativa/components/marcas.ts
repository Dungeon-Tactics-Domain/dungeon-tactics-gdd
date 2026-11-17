// "Quero / Não quero" marks, with an optional note, made on the reference sheets and the moodboard (both removed on
// 17/11). The old lab POSTed them to narrativa/marcas.json; here the same object (key "obra:l:lição" or "obra:i:arquivo")
// lives in this browser's localStorage and is only read now. Storage can be missing (private tab), so access is guarded.
export type Marca = { v: 'quero' | 'nao'; note: string; label: string };
export type Marcas = Record<string, Marca>;

export const CHAVE = 'narrativa:marcas';

export function lerMarcas(): Marcas {
  try {
    const m: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? '{}');
    if (!m || typeof m !== 'object' || Array.isArray(m)) return {};
    // rebuilt field by field: anything else in storage is dropped
    return Object.fromEntries(
      Object.entries(m as Record<string, Partial<Marca>>).flatMap(([k, x]) =>
        x && (x.v === 'quero' || x.v === 'nao')
          ? [[k, { v: x.v, note: String(x.note ?? ''), label: String(x.label ?? k) }]]
          : [],
      ),
    );
  } catch {
    return {};
  }
}
