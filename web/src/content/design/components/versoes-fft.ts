/**
 * Versions of this recreation, to follow its evolution (the selector on the page):
 * 1 first pass (flat colours, 3D busts), 2 + reference gradients, tube bars and bevel,
 * 3 + slanted bars, rim light and sheen, 4 + the game's pixel faces and zodiac glyphs, 5 = v4 over a fuller scene (height, hero attacking the skeleton).
 */
// Kept apart from cena-fft.ts so the page can list the versions without loading Three.js.
export const VERSOES_FFT = [
  [1, 'v1 · primeira recriação'],
  [2, 'v2 · cores, degradês e barras em tubo'],
  [3, 'v3 · barras inclinadas, aro de luz e brilho'],
  [4, 'v4 · rostos pixel e signos'],
  [5, 'v5 · cena completa do jogo, herói atacando'],
] as const;

