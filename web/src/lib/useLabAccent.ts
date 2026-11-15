import { useEffect } from 'react';

/** Sets the page's lab colour on :root, so portalled parts (the drawer menu) get it too. */
export function useLabAccent(cor: string, corSuave: string) {
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty('--lab', cor);
    s.setProperty('--lab-soft', corSuave);
    return () => {
      s.removeProperty('--lab');
      s.removeProperty('--lab-soft');
    };
  }, [cor, corSuave]);
}
