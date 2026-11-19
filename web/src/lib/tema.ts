// Light and dark theme. With no choice the system preference decides (the dark block of index.css under
// prefers-color-scheme); a choice is the data-theme attribute on <html>, kept in this browser. index.html applies the
// stored choice before the first paint, with this same key and values.
import { useSyncExternalStore } from 'react';
import { gravar } from './utils';

export type Tema = 'sistema' | 'light' | 'dark';
const CHAVE = 'casca:tema';
const ESCURO = '(prefers-color-scheme: dark)';
const raiz = () => document.documentElement;

/** The reader's choice; anything else in the attribute counts as none. */
export const temaEscolhido = (): Tema => {
  const t = raiz().dataset.theme;
  return t === 'light' || t === 'dark' ? t : 'sistema';
};

export function escolherTema(t: Tema) {
  if (t === 'sistema') {
    delete raiz().dataset.theme;
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      // no storage: nothing was kept
    }
  } else {
    raiz().dataset.theme = t;
    gravar(CHAVE, t);
  }
}

const assinar = (cb: () => void) => {
  const mo = new MutationObserver(cb);
  mo.observe(raiz(), { attributes: true, attributeFilter: ['data-theme'] });
  const m = matchMedia(ESCURO);
  m.addEventListener('change', cb);
  return () => {
    mo.disconnect();
    m.removeEventListener('change', cb);
  };
};

/** The choice, re-rendering when it changes. */
export const useTema = () => useSyncExternalStore(assinar, temaEscolhido);

/** The theme on screen, re-rendering when it changes: canvases repaint on it, since they copy colours from the CSS. */
export const useTemaNaTela = () =>
  useSyncExternalStore(assinar, () => {
    const t = temaEscolhido();
    return t === 'sistema' ? (matchMedia(ESCURO).matches ? 'dark' : 'light') : t;
  });
