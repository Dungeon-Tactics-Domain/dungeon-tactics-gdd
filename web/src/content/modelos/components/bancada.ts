// The 3D bench (eval.html) runs in the game's worktree on port 5205; outside localhost (the published site) it is
// reached through the tunnel. Same rule as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
export const BANCADA =
  location.hostname === 'localhost' ? 'http://localhost:5205' : 'https://dungeon-bancada.fernandorffdev.com';
/** The port and the command are shown only on the author's machine; visitors of the published site get no internal detail. */
export const EM_LOCALHOST = location.hostname === 'localhost';
export const BENCH = `${BANCADA}/eval.html`;
/** Size of every viewer box: the page's full width (Nov 15, Fernando works on ultrawide screens), 58% of the screen tall up to 480 px. */
export const CLASSE_VIEWER = 'block h-[min(58vh,480px)] w-full rounded-lg border-0 bg-pergaminho-escuro';
/** Viewer box beside the options: the width of its column, most of the screen tall on desktop. */
export const CLASSE_VIEWER_LADO = 'block h-[min(70vh,560px)] w-full rounded-lg border-0 bg-pergaminho-escuro min-[900px]:h-[76vh]';
/** Options panel; on very wide screens the groups flow into two columns. */
export const CLASSE_OPCOES =
  'border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4 min-[2000px]:columns-2 min-[2000px]:gap-x-8 *:break-inside-avoid';
