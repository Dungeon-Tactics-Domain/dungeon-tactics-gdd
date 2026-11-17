// The narrative lab's data, copied from dungeon-tactics-lab/narrativa/src/data (refs = games, plan.ts became plano.json);
// the game JSONs keep only what the loop pages read (the reference sheets were removed on 17/11). Each JSON is assigned
// to a typed list, so a wrong shape fails the typecheck.
import plano from './dados/plano.json';
import bannerSaga from './dados/refs/banner-saga.json';
import battleBrothers from './dados/refs/battle-brothers.json';
import darkestDungeon2 from './dados/refs/darkest-dungeon-2.json';
import darkestDungeon from './dados/refs/darkest-dungeon.json';
import feThreeHouses from './dados/refs/fe-three-houses.json';
import fft from './dados/refs/fft.json';
import intoTheBreach from './dados/refs/into-the-breach.json';
import mordheim from './dados/refs/mordheim.json';
import slayTheSpire from './dados/refs/slay-the-spire.json';
import zeroCompany from './dados/refs/star-wars-zero-company.json';
import tacticsOgre from './dados/refs/tactics-ogre-reborn.json';
import triangleStrategy from './dados/refs/triangle-strategy.json';
import wildermyth from './dados/refs/wildermyth.json';
import xcom2 from './dados/refs/xcom-2.json';
import xcomEu from './dados/refs/xcom-eu.json';

export interface Game {
  slug: string;
  game: string;
  year: number;
  loop: { batalha: string; corrida: string; base: string; arco: string };
  gives: string[];
}
export interface Plano {
  /** the open decision; null = none (the page shows the next step) */
  agora: { question: string; why: string; example: string; options: string[]; pick: string } | null;
  proximoPasso: string;
  decisoes: { tema: string; decisao: string }[];
  fases: { id: string; nome: string; portao: string; estado: string }[];
  pedidos: { data: string; pedido: string; dono: string; estado: string; proximo: string }[];
}

// file-name order, then by year (stable): the order the old lab got from import.meta.glob
const porAno = <T extends { year: number }>(l: T[]) => [...l].sort((a, b) => a.year - b.year);
const JOGOS_LISTA: Game[] = [
  bannerSaga,
  battleBrothers,
  darkestDungeon2,
  darkestDungeon,
  feThreeHouses,
  fft,
  intoTheBreach,
  mordheim,
  slayTheSpire,
  zeroCompany,
  tacticsOgre,
  triangleStrategy,
  wildermyth,
  xcom2,
  xcomEu,
];
export const JOGOS = porAno(JOGOS_LISTA);
export const PLANO: Plano = plano;

export const CAMADAS: [key: keyof Game['loop'], name: string][] = [
  ['batalha', 'Batalha'],
  ['corrida', 'Missão ou expedição'],
  ['base', 'Base ou vila'],
  ['arco', 'Arco da campanha'],
];

// the old split of the games into two shelves (narrativa/src/main.ts, TIPOS)
export const TIPOS: { id: string; nome: string; resumo: string; slugs: string[] }[] = [
  {
    id: 'taticos',
    nome: 'Táticos',
    resumo: 'Batalha por turnos em grade.',
    slugs: [
      'fft',
      'tactics-ogre-reborn',
      'triangle-strategy',
      'fe-three-houses',
      'into-the-breach',
      'xcom-eu',
      'xcom-2',
      'banner-saga',
    ],
  },
  {
    id: 'roguelike-gestao',
    nome: 'Roguelike e gestão',
    resumo: 'Expedição, morte do grupo e base ou companhia para gerir.',
    slugs: [
      'darkest-dungeon',
      'darkest-dungeon-2',
      'slay-the-spire',
      'battle-brothers',
      'mordheim',
      'wildermyth',
      'star-wars-zero-company',
    ],
  },
];
export const tipoDe = (slug: string) => TIPOS.find((t) => t.slugs.includes(slug))?.id ?? 'outros';
