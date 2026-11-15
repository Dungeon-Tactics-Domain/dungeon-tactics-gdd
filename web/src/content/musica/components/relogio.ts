// Playback clock shared by the live mixer and the piano roll: the roll follows the mixer when it plays, else the page audio.
export const relogio: { atual: (() => number) | null } = { atual: null };
