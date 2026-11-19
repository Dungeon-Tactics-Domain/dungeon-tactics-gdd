import { type RefObject, useEffect, useLayoutEffect, useState } from 'react';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { MidiNote } from '@/lib/player/read-midi';
import type { Catalog, Song } from '@/lib/player/schema';
import { gravar, ler } from '@/lib/utils';
import { ALTURA_FAIXA, ALTURA_MAXIMA, ALTURA_MINIMA, CHAVE_ALTURA, ESTREITO, FADE_NOTA } from './constantes';

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
 * The notes sounding on each channel at an instant: channel to its pitches, each once, the highest first. A note
 * sounds from its start up to, not including, its end, so a repeated note is never counted twice.
 */
export function notasEm(notas: MidiNote[], t: number) {
  const soando = new Map<number, number[]>();
  for (const n of notas) {
    if (t < n.start || t >= n.end) continue;
    const lista = soando.get(n.channel) ?? [];
    if (!lista.includes(n.pitch)) lista.push(n.pitch);
    soando.set(n.channel, lista);
  }
  for (const lista of soando.values()) lista.sort((a, b) => b - a);
  return soando;
}

/** A label of the mixer's notes column: `saiu` is the clock time (ms) at which the note stopped sounding. */
export interface NotaAtiva {
  altura: number;
  saiu?: number;
}

/**
 * The labels of one channel after a frame: the notes sounding now, plus the ones that stopped less than FADE_NOTA ago
 * (they fade out instead of vanishing). The exit is stamped once, on the clock and not on the song's position, so a
 * seek or a pause does not freeze a fading label; a note that sounds again loses its stamp. Highest first.
 */
export function passoNotas(antes: NotaAtiva[], soando: number[], agora: number): NotaAtiva[] {
  const ficam = antes
    .filter((n) => soando.includes(n.altura) || agora - (n.saiu ?? agora) < FADE_NOTA)
    .map((n) => (soando.includes(n.altura) ? { altura: n.altura } : { altura: n.altura, saiu: n.saiu ?? agora }));
  const novas = soando.filter((a) => !antes.some((n) => n.altura === a)).map((altura) => ({ altura }));
  return [...ficam, ...novas].sort((a, b) => b.altura - a.altura);
}

/**
 * The text size at which `n` stacked labels fit the strip's height, and how many show. A label is 1.2 lines of text
 * plus 2 px of border, 1 px apart. 16 px while they fit; then they shrink (asked by Fernando, even under 16 px) down
 * to 11 px, the smallest still readable; past that the lowest notes are left out.
 */
// 9: the strip's top border and its padding above and below
export function ajusteEtiquetas(n: number, altura = ALTURA_FAIXA - 9) {
  const fonte = Math.max(11, Math.min(16, Math.floor(((altura + 1) / Math.max(1, n) - 3) / 1.2)));
  return { fonte, visiveis: Math.min(n, Math.floor((altura + 1) / (fonte * 1.2 + 3))) };
}

/**
 * The song and the version a shared link names (?musica=<song id>&som=<version id>). An id that does not exist is
 * dropped, so the caller falls back to its default; a version only counts inside the song the link names.
 */
export function lerLink(catalogo: Catalog, params: URLSearchParams): { musica?: Song; versaoId?: string } {
  const musica = catalogo.songs.find((s) => s.id === params.get('musica'));
  return { musica, versaoId: musica?.versions.find((v) => v.id === params.get('som'))?.id };
}

/** The address parameters with the song and version in them; any other parameter is kept. */
export function escreverLink(params: URLSearchParams, musicaId: string, versaoId: string | undefined) {
  const p = new URLSearchParams(params);
  p.set('musica', musicaId);
  if (versaoId) p.set('som', versaoId);
  else p.delete('som');
  return p;
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
