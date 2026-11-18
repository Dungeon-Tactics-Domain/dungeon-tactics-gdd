// Typed data of the design lab, copied from dungeon-tactics-lab/design (src/main.ts, src/ia.ts, src/data/plan.ts and
// src/data/refs/*.json). The JSON files were dumped by running the old TS, so concatenated prompts are exact. The page
// tree in manifest.ts and the components derive from the same helpers as the old main.ts and ia.ts.
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

// open taste decisions (DecisoesDeGosto.tsx): a number, not an import, so the lab home does not load that page;
// decisoes-de-gosto.test.tsx fails when they diverge
export const GOSTO_ABERTAS = 10;

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
/** the conversation's name, by the first 8 characters of its id (the old ia.ts map); without a name the heading says "Mesma conversa" */
const ESTILO: Record<string, string> = {
  '5940caa1': 'Sprites em pixel art dos 10 bonecos',
  '8481078a': 'Ícones FFT Clássico',
  '23ab3225': 'Terreno e cena de batalha',
  '6ef32d77': 'Retratos no traço FFT',
  c9ac8134: 'Retratos no traço FFT',
  b80de995: 'Rostos Vitral, moldura dourada (usados no jogo)',
};
export const estiloDe = (link: string) => ESTILO[link.split('/').pop()!.slice(0, 8)];
/** images of the same conversation (same style, same session) go together; the loose ones go in one block */
export function porConversa(tests: Test[]): { juntas: Test[][]; soltas: Test[] } {
  const grupos = new Map<string, Test[]>();
  for (const t of tests) {
    const k = t.link ?? `solta-${t.file}`;
    grupos.set(k, [...(grupos.get(k) ?? []), t]);
  }
  const todos = [...grupos.values()];
  return { juntas: todos.filter((g) => g.length > 1), soltas: todos.filter((g) => g.length === 1).flat() };
}
/** the AI test kind of an image, from its file name (the old geminiSub, now for every platform) */
export const iaSub = (t: Test) =>
  t.file.includes('sprite')
    ? 'sprites'
    : t.file.includes('icone')
      ? 'icones'
      : t.file.includes('terreno')
        ? 'terreno'
        : /rosto|retrato/.test(t.file)
          ? 'rostos'
          : t.file.includes('fft')
            ? 'fft'
            : t.file.includes('aplicado')
              ? 'aplicados'
              : t.file.includes('-ui-')
                ? 'folhas'
                : 'cenas';
export const contagem = (n: number) => `${n} ${n === 1 ? 'imagem' : 'imagens'}`;

/** the kit's typeface (Alegreya Sans, OFL), for the pages that draw on .fft */
export const FONTE_FFT = 'https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@500;700&display=swap';

/** Adds a Google Fonts stylesheet once. Not a React 19 <link precedence>: that suspends the page until the CSS loads. */
export function carregarFonte(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
}

/** Mouth frame of the FFT kit portraits: still on 0; talking, it steps closed, half, open, half at ~5 Hz (8 Hz jumped too fast between 2 and 3). */
export const MOUTH_HZ = 5;
const FALA = [1, 2, 3, 2];
export const mouthFrame = (ms: number, talking: boolean, hz = MOUTH_HZ) =>
  talking ? FALA[Math.floor((ms * hz) / 1000) % FALA.length]! : 0;

/** Frames of the AI face sheets (chars/ia-alinhado-rosto/<id>.png, 8 frames of 256 px, the Copilot sheets' order). */
export const ROSTO = {
  neutro: 0,
  falando1: 1,
  falando2: 2,
  gritando: 3,
  dano: 4,
  ferido: 5,
  sorrindo: 6,
  bravo: 7,
} as const;
/** Face on the end-of-battle screen: the fallen and anyone below 30% of life look hurt; the rest smile on a victory and stay neutral on a defeat. */
export const rostoFim = (hp: number, max: number, vitoria: boolean) =>
  hp <= 0 || hp < max * 0.3 ? ROSTO.ferido : vitoria ? ROSTO.sorrindo : ROSTO.neutro;
