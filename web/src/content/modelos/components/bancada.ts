// The 3D bench (eval.html) runs in the game's worktree on port 5205; outside localhost (the published site) it is
// reached through the tunnel. Same rule as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
export const BANCADA =
  location.hostname === 'localhost' ? 'http://localhost:5205' : 'https://dungeon-bancada.fernandorffdev.com';
/** The port and the command are shown only on the author's machine; visitors of the published site get no internal detail. */
export const EM_LOCALHOST = location.hostname === 'localhost';
export const BENCH = `${BANCADA}/eval.html`;
/**
 * Every viewer box: half the screen tall when stacked on phones and tablets; beside the options (LadoALado) a square
 * of its column up to 80% of the screen tall, so ultrawide screens get a tall view instead of a wide, low strip.
 */
export const CLASSE_VIEWER =
  'block h-[50vh] w-full rounded-lg border-0 bg-pergaminho-escuro min-[1024px]:aspect-square min-[1024px]:h-auto min-[1024px]:max-h-[80vh]';
/** Options panel; on very wide screens the groups flow into two columns. */
export const CLASSE_OPCOES =
  'border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4 min-[2000px]:columns-2 min-[2000px]:gap-x-8 *:break-inside-avoid';
