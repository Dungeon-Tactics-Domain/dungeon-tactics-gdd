// Typed data of the design lab, copied from dungeon-tactics-lab/design (src/main.ts, src/ia.ts, src/data/plan.ts and
// src/data/refs/*.json). The JSON files were dumped by running the old TS, so concatenated prompts are exact. The page
// tree in manifest.ts and the components derive from the same helpers as the old main.ts and ia.ts.
import direcoesJson from './direcoes.json';
import iaJson from './ia.json';
import planoJson from './plano.json';

export interface Shot {
  file: string;
  source: string;
  screen: string;
  title: string;
  layout: string;
  pieces: string[];
  take: string;
  avoid: string;
}
export interface Game {
  game: string;
  slug: string;
  year: number;
  shots: Shot[];
  notFound: string[];
}

export const GAMES: Game[] = Object.values(import.meta.glob<Game>('./refs/*.json', { eager: true, import: 'default' }));

export const SCREENS: [id: string, name: string][] = [
  ['previa', 'Prévia do golpe'],
  ['batalha', 'Batalha'],
  ['fila', 'Fila de turnos'],
  ['ficha', 'Ficha'],
  ['equipamento', 'Equipamento'],
  ['classe', 'Classe'],
  ['loja', 'Loja'],
  ['mapa', 'Mapa'],
  ['titulo', 'Título'],
  ['opcoes', 'Opções'],
  ['dialogo', 'Diálogo'],
  ['outro', 'Outras'],
];
export const screenName = (id: string) => SCREENS.find(([s]) => s === id)?.[1] ?? id;
// the game name in the menu fits ~28 letters; the full name is on the page
export const SHORT: Record<string, string> = { 'fft-ivalice': 'FFT: Ivalice Chronicles' };
// captures per page: each card is ~900px tall (long text); 2 = one row, fits a screen and a half
export const PER_PAGE = 2;
export const NOTICE =
  'Ficam só neste PC. Servem para estudar disposição e UX; arte, fontes e ícones desses jogos não entram no nosso.';
/** images and other files of this lab, served from public/content/design */
export const ASSETS = '/content/design';

/** shots of one game sorted by screen type, cut in blocks of PER_PAGE (one subpage each) */
export function blocos(g: Game): Shot[][] {
  const order = (s: Shot) => SCREENS.findIndex(([id]) => id === s.screen);
  const shots = [...g.shots].sort((a, b) => order(a) - order(b));
  return Array.from({ length: Math.ceil(shots.length / PER_PAGE) }, (_, i) =>
    shots.slice(i * PER_PAGE, (i + 1) * PER_PAGE),
  );
}

export const PLANO = planoJson as {
  now: { question: string; why: string; example: string; options: string[]; pick: string } | null;
  nextStep: string;
  decisions: [topic: string, decision: string][];
  phases: [id: string, name: string, gate: string, status: Status][];
  requests: [date: string, ask: string, owner: string, status: Status, next: string][];
};
export type Status = 'feito' | 'fazendo' | 'aberto' | 'bloqueado';

export interface Test {
  file: string;
  title: string;
  size: string;
  attached?: string;
  link?: string;
  prompt: string;
  good: string;
  bad: string;
}
export interface Platform {
  name: string;
  plan: string;
  tests: Test[];
}
export const IA = iaJson as {
  platforms: Platform[];
  notRun: [string, string][];
  featured: string[];
  subs: [id: string, titulo: string, resumo: string][];
};
export const PLATFORM_IDS = ['gemini', 'pixellab', 'chatgpt', 'copilot', 'craiyon'];
export const plataforma = (id: string) => IA.platforms[PLATFORM_IDS.indexOf(id)];
// platforms with many images (Gemini, Copilot) become subpages by kind, each fitting ~a screen and a half
export const dividida = (p: Platform) => p.tests.length > 8;
export const iaSub = (t: Test) =>
  t.file.includes('rosto')
    ? 'rostos'
    : t.file.includes('fft')
      ? 'fft'
      : t.file.includes('aplicado')
        ? 'aplicados'
        : t.file.includes('-ui-')
          ? 'folhas'
          : 'cenas';
export const contagem = (n: number) => `${n} ${n === 1 ? 'imagem' : 'imagens'}`;

export interface Direcao {
  id: 'a' | 'b' | 'c';
  name: string;
  idea: string;
  from: string;
  palette: [name: string, hex: string, use: string][];
  type: [role: string, family: string, sample: string][];
  hud: string;
  risk: string;
}
export const DIRECOES = direcoesJson as Direcao[];

/** Adds a Google Fonts stylesheet once. Not a React 19 <link precedence>: that suspends the page until the CSS loads. */
export function carregarFonte(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
}

/** Mouth frame of the FFT kit portraits: still on 0; talking, it steps through the sheet at ~8 Hz. */
export const MOUTH_HZ = 8;
export const mouthFrame = (ms: number, talking: boolean, frames = 4, hz = MOUTH_HZ) =>
  talking ? Math.floor((ms * hz) / 1000) % frames : 0;
