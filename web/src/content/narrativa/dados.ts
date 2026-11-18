// The narrative lab's data, copied from dungeon-tactics-lab/narrativa/src/data (plan.ts became plano.json). The game
// JSONs and the per-game loop pages were removed on 18/11. The JSON is assigned to a typed value, so a wrong shape fails
// the typecheck.
import plano from './dados/plano.json';

export interface Plano {
  /** the open decision; null = none (the page shows the next step) */
  agora: { question: string; why: string; example: string; options: string[]; pick: string } | null;
  proximoPasso: string;
}

export const PLANO: Plano = plano;
