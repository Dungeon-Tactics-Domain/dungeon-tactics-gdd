// The 3D bench (eval.html) runs in the game's worktree on port 5205; outside localhost (the published site) it is
// reached through the tunnel. Same rule as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
export const BANCADA =
  location.hostname === 'localhost' ? 'http://localhost:5205' : 'https://dungeon-bancada.fernandorffdev.com';
/** The port and the command are shown only on the author's machine; visitors of the published site get no internal detail. */
export const EM_LOCALHOST = location.hostname === 'localhost';
export const BENCH = `${BANCADA}/eval.html`;
/**
 * Every viewer box. Stacked (phones, tablets) it stays pinned on top, so it is half the screen tall but leaves ~340 px
 * between the header and the bottom menu for the options to scroll (Nov 15, Fernando's request), never under 200 px;
 * beside the options (LadoALado) a square of its column up to 80% of the screen tall, so ultrawide screens get a tall
 * view instead of a wide, low strip.
 */
export const CLASSE_VIEWER =
  'block h-[min(50vh,max(200px,calc(100dvh-var(--reino-h)-var(--nav-h)-340px)))] w-full rounded-lg border-0 bg-pergaminho-escuro min-[1024px]:aspect-square min-[1024px]:h-auto min-[1024px]:max-h-[80vh]';
/** Options panel; on very wide screens the groups flow into two columns. */
export const CLASSE_OPCOES =
  'border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4 min-[2000px]:columns-2 min-[2000px]:gap-x-8 *:break-inside-avoid';
