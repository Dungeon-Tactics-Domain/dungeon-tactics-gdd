// Shared numbers of the music player screens.

// One colour per lane, repeated after eight. Mixer swatch and piano roll notes use the same one, so a lane reads as one
// instrument across both. The values live in index.css (--canal-1 to --canal-8), one set per theme, each measured
// against the roll of that theme.
export const varDoCanal = (i: number) => `--canal-${(i % 8) + 1}`;

// The mixer strips and the roll lanes are the same height and the mixer header matches the ruler, so rows line up.
// 100 px leaves room for two 44 px rows (name with Mute and Solo, volume with version) in a strip.
export const ALTURA_FAIXA = 100;
export const ALTURA_REGUA = 48;

// The player's height: by default it ends at the bottom of the window; the handle under it changes that, and the choice
// is remembered. 360 px still shows the transport, the ruler and two lanes; 2400 px is taller than any song's mixer.
export const ALTURA_MINIMA = 360;
export const ALTURA_MAXIMA = 2400;
export const PASSO_ALTURA = 40;
export const CHAVE_ALTURA = 'musica:player:altura';

// Below this the list stacks on top and the mixer sits above the lanes
export const ESTREITO = '(max-width: 700px)';
