import type { Effect } from '@/lib/player/schema';

// Shared numbers of the music player screens.

// One colour per lane, repeated after eight. Mixer swatch and piano roll notes use the same one, so a lane reads as one
// instrument across both. The values live in index.css (--canal-1 to --canal-8), one set per theme, each measured
// against the roll of that theme.
export const varDoCanal = (i: number) => `--canal-${(i % 8) + 1}`;

// The mixer strips and the roll lanes are the same height and the mixer header matches the ruler, so rows line up.
// 124 px leaves room for two 44 px rows (name with Mute and Solo, volume with version) and a line of effect tags.
export const ALTURA_FAIXA = 124; // three lines: name with Mute and Solo, volume and sound, effect tags

// A note that stops sounding fades out of the mixer's notes column in this long (ms) instead of vanishing
export const FADE_NOTA = 300;
export const ALTURA_REGUA = 48;

// The player's height: by default it ends at the bottom of the window; the handle under it changes that, and the choice
// is remembered. 360 px still shows the transport, the overview, the ruler and one lane; 2400 px is the ceiling only
// while the content cannot be measured: the real one is the height that shows every lane (alturaNecessaria in hooks).
export const ALTURA_MINIMA = 360;
export const ALTURA_MAXIMA = 2400;
export const PASSO_ALTURA = 40;
export const CHAVE_ALTURA = 'musica:player:altura';

// Horizontal zoom of the lanes: 1 shows the whole song; it opens at 2 and the choice is remembered. The buttons double
// or halve it; a notch of the wheel (with Ctrl over the lanes, plain over the overview) is 25%.
// ponytail: each lane is one canvas as wide as the zoomed song, so the zoom also stops where a canvas would pass
// LARGURA_CANVAS device pixels (16 lanes of 12000 x 100 px are about 77 MB); draw only the visible part to go further.
export const ZOOM_PADRAO = 2;
export const ZOOM_MAXIMO = 8;
export const CHAVE_ZOOM = 'musica:player:zoom';
export const PASSO_RODA = 1.25;
export const LARGURA_CANVAS = 12000;

// Below this the list stacks on top and the mixer sits above the lanes
export const ESTREITO = '(max-width: 700px)';

export const ROTULO_EFEITO: Record<Effect, string> = {
  reverb: 'Reverb',
  release: 'Release longo',
  sustain: 'Sustain (pedal)',
  eco: 'Eco',
};
// the Icone id of each effect tag
export const ICONE_EFEITO: Record<Effect, string> = {
  reverb: 'reverb',
  release: 'release',
  sustain: 'sustain',
  eco: 'eco',
};
