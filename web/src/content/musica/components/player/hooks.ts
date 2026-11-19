import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import { gravar, ler } from '@/lib/utils';
import { ALTURA_MAXIMA, ALTURA_MINIMA, CHAVE_ALTURA } from './constantes';

/**
 * Redraws the component on every engine change (song, mixer, state, download progress). With `quadro` it also redraws
 * once per frame while playing, for the parts that follow the position.
 */
export function useMotor(engine: PlayerEngine | undefined, quadro = false) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!engine) return;
    const bump = () => setN((n) => n + 1);
    const off = [
      engine.on('change', bump),
      engine.on('state', bump),
      engine.on('progress', bump),
      engine.on('error', bump),
      ...(quadro ? [engine.on('time', bump)] : []),
    ];
    return () => off.forEach((f) => f());
  }, [engine, quadro]);
}

const limitar = (n: number) => Math.round(Math.min(ALTURA_MAXIMA, Math.max(ALTURA_MINIMA, n)));
// under the player, so its bottom border does not touch the edge of the window
const FOLGA = 16;

/**
 * The player's height. The default fills the window from where the box starts (measured, because the page header above
 * it wraps differently per width); a height chosen with the handle wins and is remembered between visits. `mudar()`
 * with no number goes back to the default.
 */
export function useAlturaDaw(caixa: RefObject<HTMLElement | null>) {
  const [padrao, setPadrao] = useState(ALTURA_MINIMA);
  // a bad stored value falls back to the default
  const [escolhida, setEscolhida] = useState(() => {
    const n = Number(ler(CHAVE_ALTURA));
    return ler(CHAVE_ALTURA) && Number.isFinite(n) ? limitar(n) : null;
  });

  // layout effect: the first paint already has the measured height
  useLayoutEffect(() => {
    const medir = () => {
      const el = caixa.current;
      if (el) setPadrao(limitar(window.innerHeight - (el.getBoundingClientRect().top + window.scrollY) - FOLGA));
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [caixa]);

  const mudar = (n?: number) => {
    const v = n === undefined ? null : limitar(n);
    setEscolhida(v);
    try {
      if (v === null) localStorage.removeItem(CHAVE_ALTURA);
      else gravar(CHAVE_ALTURA, String(v));
    } catch {
      // no storage: the default comes back on reload anyway
    }
  };

  return { altura: escolhida ?? padrao, mudar };
}
