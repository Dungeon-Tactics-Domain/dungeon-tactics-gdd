// The 3D bench (eval.html) runs in the game's worktree on port 5205; outside localhost (the published site) it is
// reached through the tunnel. Same rule as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
export const BANCADA =
  location.hostname === 'localhost' ? 'http://localhost:5205' : 'https://dungeon-bancada.fernandorffdev.com';
export const BENCH = `${BANCADA}/eval.html`;
/** Size of every viewer box, as in the old lab: 760 px wide at most, 58% of the screen tall up to 480 px. */
export const CLASSE_VIEWER = 'block h-[min(58vh,480px)] w-full max-w-[760px] rounded-lg border-0 bg-terra';
