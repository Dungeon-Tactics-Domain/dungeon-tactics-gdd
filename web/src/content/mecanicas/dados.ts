// Typed access to the mechanics lab data, shared by the manifest and the components. The JSON files are copies of
// dungeon-tactics-lab/mecanicas/src/data (plan.ts, rules.ts, scenes.ts as JSON; refs/*.json as they were).
import cenas from './cenas.json';
import clipes from './clipes.json';
import plano from './plano.json';
import regras from './regras.json';

export interface Opcao {
  name: string;
  what: string;
  basis: string;
  pros: string;
  cons: string;
  effect: string;
}
export interface Plano {
  /** open decision now; null = none (the page shows the next step) */
  now: { question: string; why: string; example: string; options: Opcao[]; pick: string } | null;
  nextStep: string;
  decisions: { topic: string; decision: string }[];
  phases: { id: string; name: string; gate: string; status: string }[];
  requests: { date: string; ask: string; owner: string; status: string; next: string }[];
}
export interface Regra {
  name: string;
  now: string;
  where: string;
  note?: string;
}
export interface Cena {
  name: string;
  title: string;
  group: string;
  note: string;
}
export interface Clipe {
  name: string;
  file: string;
  title: string;
  action: string;
  commit: string;
  source: string;
  note?: string;
  after?: string;
}
export interface Item {
  name: string;
  what: string;
  feel?: string;
  take?: string;
  avoid?: string;
  source: string;
}
export interface Jogo {
  game: string;
  slug: string;
  year: number;
  reception: string;
  why: string;
  mechanics: Item[];
  feel: Item[];
  videos: { url: string; title: string; note: string }[];
  notFound: string[];
}

export const PLANO: Plano = plano;
export const CENAS: Cena[] = cenas;
export const CLIPES: Clipe[] = clipes;
export const DRIFT: string[] = regras.drift;

// route id: lowercase letters, digits and hyphens (same function as the old lab, so the routes match)
export const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const qtd = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// the group name fits the menu (~28 letters): what is in parentheses goes to the summary
const grupos = (lista: { group: string; rules: Regra[] }[]) =>
  lista.map(({ group, rules }) => {
    const [titulo, extra] = group.split(/ \((.*)\)$/);
    return { id: slug(titulo!), titulo: titulo!, extra, regras: rules };
  });
export const REGRAS = { mechanics: grupos(regras.mechanics), feel: grupos(regras.feel) };

export const JOGOS: Jogo[] = Object.values(
  import.meta.glob<Jogo>('./refs/*.json', { eager: true, import: 'default' }),
).sort((a, b) => a.year - b.year);
export const jogo = (id: string) => JOGOS.find((g) => slug(g.slug) === id);
