// "Quero / Não quero" marks, with an optional note. The old lab POSTed them to narrativa/marcas.json through its Vite
// server; this app has no such API yet, so the same object (key "obra:l:lição" or "obra:i:arquivo") lives in this
// browser's localStorage. Storage can be missing (private tab), so every access is guarded.
import { useState } from 'react';

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

function gravar(chave: string, marca: Marca | undefined) {
  // read-modify-write of the whole object: every button on the page writes its own key without clobbering the others
  const todas = lerMarcas();
  if (marca) todas[chave] = marca;
  else delete todas[chave];
  try {
    localStorage.setItem(CHAVE, JSON.stringify(todas));
  } catch {
    // no storage: the mark lasts until reload
  }
}

export function useMarca(chave: string, label: string) {
  const [marca, setMarca] = useState<Marca | undefined>(() => lerMarcas()[chave]);
  const mudar = (m: Marca | undefined) => {
    gravar(chave, m);
    setMarca(m);
  };
  return {
    marca,
    /** clicking the current choice clears the mark, as in the old lab */
    alternar: (v: Marca['v']) => mudar(marca?.v === v ? undefined : { v, note: marca?.note ?? '', label }),
    anotar: (note: string) => marca && mudar({ ...marca, note }),
  };
}
