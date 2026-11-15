// The narrative lab's data, copied as is from dungeon-tactics-lab/narrativa/src/data (refs = games, obras = anime and
// books, plan.ts became plano.json). Each JSON is assigned to a typed list, so a wrong shape fails the typecheck.
import berserk from './dados/obras/berserk-era-de-ouro.json';
import companhiaNegra from './dados/obras/companhia-negra.json';
import dungeonMeshi from './dados/obras/dungeon-meshi.json';
import eightySix from './dados/obras/eighty-six.json';
import frieren from './dados/obras/frieren.json';
import grimgar from './dados/obras/grimgar.json';
import madeInAbyss from './dados/obras/made-in-abyss.json';
import mushoku from './dados/obras/mushoku-tensei.json';
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

export interface Shot {
  file: string;
  source: string;
  theme: string;
  title: string;
  note: string;
  take: string;
}
export interface Video {
  url: string;
  title: string;
  kind: string;
  note: string;
}
export interface Lesson {
  name: string;
  what: string;
  story: string;
  take: string;
  avoid: string;
  source: string;
}
interface Entry {
  slug: string;
  year: number;
  why: string;
  shots: Shot[];
  videos: Video[];
  notFound: string[];
}
export interface Game extends Entry {
  game: string;
  loop: { batalha: string; corrida: string; base: string; arco: string };
  gives: string[];
  mechanics: Lesson[];
}
export interface Work extends Entry {
  work: string;
  kind: string;
  axes: Record<string, string>;
  lessons: Lesson[];
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
const OBRAS_LISTA: Work[] = [berserk, companhiaNegra, dungeonMeshi, eightySix, frieren, grimgar, madeInAbyss, mushoku];
export const JOGOS = porAno(JOGOS_LISTA);
export const OBRAS = porAno(OBRAS_LISTA);
export const PLANO: Plano = plano;

export const TEMAS: Record<string, string> = {
  tom: 'Tom e clima',
  personagem: 'Personagens',
  base: 'Base e vila',
  mapa: 'Mapa e estratégia',
  mundo: 'Mundo e lugar',
  campanha: 'Campanha e capítulos',
  escolha: 'Escolhas',
  morte: 'Morte e perda',
  outro: 'Outras',
};
export const CAMADAS: [key: keyof Game['loop'], name: string][] = [
  ['batalha', 'Batalha'],
  ['corrida', 'Missão ou expedição'],
  ['base', 'Base ou vila'],
  ['arco', 'Arco da campanha'],
];
export const EIXOS: [key: string, name: string][] = [
  ['tom', 'Tom'],
  ['grupo', 'Grupo'],
  ['morte', 'Morte e perda'],
  ['mundo', 'Mundo e descida'],
  ['politica', 'Política e facções'],
  ['progressao', 'Progressão'],
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

/** Shots of every game and work, with the work's name and slug: the moodboard. Files live in public/content/narrativa. */
export const IMAGENS = [
  ...JOGOS.map((g) => ({ ...g, nome: g.game })),
  ...OBRAS.map((w) => ({ ...w, nome: w.work })),
].flatMap((g) => g.shots.map((s) => ({ ...s, nome: g.nome, slug: g.slug })));
export type Imagem = (typeof IMAGENS)[number];
export const urlImagem = (file: string) => `/content/narrativa/${file}`;
