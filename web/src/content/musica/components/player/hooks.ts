import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { MidiNote } from '@/lib/player/read-midi';
import { gravar, ler } from '@/lib/utils';
import { ALTURA_MAXIMA, ALTURA_MINIMA, CHAVE_ALTURA, ESTREITO } from './constantes';

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

const NOTAS = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
/** The note's name as a musician here says it: 60 is "Dó 4", 67 is "Sol 4". */
export const nomeDaNota = (altura: number) => `${NOTAS[altura % 12]} ${Math.floor(altura / 12) - 1}`;

/**
 * The note sounding on each channel at an instant: channel to pitch, the highest one of a chord (the one the ear
 * follows). A note sounds from its start up to, not including, its end, so a repeated note is never counted twice.
 */
export function notasEm(notas: MidiNote[], t: number) {
  const soando = new Map<number, number>();
  for (const n of notas)
    if (n.start <= t && t < n.end && n.pitch > (soando.get(n.channel) ?? -1)) soando.set(n.channel, n.pitch);
  return soando;
}

const limitar = (n: number, maximo = ALTURA_MAXIMA) => Math.round(Math.min(maximo, Math.max(ALTURA_MINIMA, n)));

/**
 * The height at which every lane shows and nothing is left empty under the last one: what the box measures now, minus
 * the part of the scrolling area on screen, plus everything that area holds. Rounded up, or one pixel would still
 * scroll. Content that measures 0 (not laid out yet, jsdom) is unknown, so the fixed ceiling stands.
 */
export const alturaNecessaria = (caixa: number, visivel: number, conteudo: number) =>
  conteudo > 0 ? limitar(Math.ceil(caixa - visivel + conteudo)) : ALTURA_MAXIMA;
// under the player, so its bottom border does not touch the edge of the window
const FOLGA = 16;

/**
 * The player's height. The default fills the window from where the box starts (measured, because the page header above
 * it wraps differently per width); a height chosen with the handle wins and is remembered between visits. `mudar()`
 * with no number goes back to the default. Neither goes past `maximo`, the height that shows every lane of the song on
 * screen; a remembered height above it stays stored, so a song with more lanes gets it back.
 */
export function useAlturaDaw(caixa: RefObject<HTMLElement | null>) {
  const [padrao, setPadrao] = useState(ALTURA_MINIMA);
  // a bad stored value falls back to the default
  const [escolhida, setEscolhida] = useState(() => {
    const n = Number(ler(CHAVE_ALTURA));
    return ler(CHAVE_ALTURA) && Number.isFinite(n) ? limitar(n) : null;
  });
  const [maximo, setMaximo] = useState(ALTURA_MAXIMA);

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

  // The lanes scroll in the roll's box on a desktop and in their own wrapper on a phone, where --daw-altura caps only
  // them. Measured again whenever the box, the scrolling area or what it holds changes size: another song, the
  // transport wrapping, the horizontal scrollbar of a zoomed roll.
  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el || !globalThis.ResizeObserver) return;
    const medir = () => {
      const estreito = matchMedia(ESTREITO).matches;
      const rolagem = el.querySelector<HTMLElement>(`[data-roll="${estreito ? 'pista' : 'rolagem'}"]`);
      if (!rolagem) return;
      const conteudo = Math.max(0, ...[...rolagem.children].map((c) => (c as HTMLElement).offsetHeight));
      setMaximo(alturaNecessaria((estreito ? rolagem : el).offsetHeight, rolagem.clientHeight, conteudo));
    };
    const ro = new ResizeObserver(medir);
    for (const x of [
      el,
      ...el.querySelectorAll('[data-roll="rolagem"], [data-roll="rolagem"] > *, [data-roll="pista"] > *'),
    ])
      ro.observe(x);
    return () => ro.disconnect();
  }, [caixa]);

  const mudar = (n?: number) => {
    const v = n === undefined ? null : limitar(n, maximo);
    setEscolhida(v);
    try {
      if (v === null) localStorage.removeItem(CHAVE_ALTURA);
      else gravar(CHAVE_ALTURA, String(v));
    } catch {
      // no storage: the default comes back on reload anyway
    }
  };

  return { altura: Math.min(escolhida ?? padrao, maximo), maximo, mudar };
}
