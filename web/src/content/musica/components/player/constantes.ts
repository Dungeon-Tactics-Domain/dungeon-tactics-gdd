// Shared numbers of the music player screens.

// One colour per lane, repeated after eight. Mixer swatch and piano roll notes use the same one, so a lane reads as one
// instrument across both. They sit on the black roll (about 3:1 or better); the lab theme has no channel colours yet.
const CORES_CANAIS = ['#8e44ad', '#2a7fc1', '#e0661f', '#2e9e4f', '#c9372c', '#17a589', '#c98a2c', '#8a9399'];
export const corDoCanal = (i: number) => CORES_CANAIS[i % CORES_CANAIS.length]!;

// The mixer strips and the roll lanes are the same height and the mixer header matches the ruler, so rows line up.
// 100 px leaves room for two 44 px rows (name with Mute and Solo, volume with version) in a strip.
export const ALTURA_FAIXA = 100;
export const ALTURA_REGUA = 48;

// Below this the list stacks on top and the mixer sits above the lanes
export const ESTREITO = '(max-width: 700px)';
