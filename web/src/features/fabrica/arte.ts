// Bench illustrations of the Fábrica, one per lab, as fixed SVG markup written here (never data from the board).
// Only the row that is working animates them (fabrica.css).

function gear(cx: number, cy: number, r: number, teeth: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.8;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.28).toFixed(1)}" class="hole"/>`;
}
const SPARKS = (x: number, y: number) =>
  `<g class="sparks" transform="translate(${x} ${y})">${[0, 60, 120, 180, 240, 300]
    .map((a, i) => `<path d="M0 -4 V-11" transform="rotate(${a})" style="animation-delay:${i * 0.11}s"/>`)
    .join('')}</g>`;
const FLOOR = '<path class="ground" d="M8 112 H192"/>';

export const ART = {
  // drafting board with the pencil scratching
  design: `${FLOOR}<path class="frame" d="M70 112 L82 66 M130 112 L118 66"/>
    <g transform="rotate(-10 100 52)"><rect class="board" x="38" y="22" width="124" height="66" rx="3"/>
    <path class="ink" d="M50 36 H118 M50 48 H140 M50 60 H96"/><rect class="ink-box" x="112" y="56" width="34" height="22"/>
    <g class="work draw"><path class="tool" d="M96 74 l26 -20 l6 5 l-26 20 z"/><path class="tool-tip" d="M96 74 l-4 7 l8 -2 z"/></g></g>
    ${SPARKS(94, 76)}`,
  // book desk: a pile, an open book turning a page and the candle
  narrativa: `${FLOOR}<path class="frame" d="M30 112 V84 M170 112 V84"/><rect class="desk" x="20" y="78" width="160" height="8" rx="2"/>
    <rect class="book b1" x="28" y="64" width="40" height="12" rx="1"/><rect class="book b2" x="32" y="52" width="34" height="12" rx="1"/><rect class="book b3" x="26" y="42" width="38" height="10" rx="1"/>
    <path class="page" d="M84 76 Q104 70 120 76 V50 Q104 44 84 50 Z"/><path class="page" d="M156 76 Q136 70 120 76 V50 Q136 44 156 50 Z"/>
    <g class="work flip"><path class="page turn" d="M120 76 Q136 70 152 74 V48 Q136 44 120 50 Z"/></g>
    <rect class="candle" x="164" y="58" width="7" height="20"/><path class="work flame" d="M167.5 46 q5 7 0 12 q-5 -5 0 -12z"/>
    ${SPARKS(120, 46)}`,
  // gears turning in opposite directions
  mecanicas: `${FLOOR}<rect class="desk" x="24" y="96" width="152" height="8" rx="2"/>
    <g class="work spin" style="transform-origin:78px 58px">${gear(78, 58, 30, 10)}</g>
    <g class="work spin-rev" style="transform-origin:128px 70px">${gear(128, 70, 20, 7)}</g>
    <g class="work spin" style="transform-origin:150px 38px">${gear(150, 38, 12, 6)}</g>
    ${SPARKS(106, 64)}`,
  // carving bench: pedestal, a carved tree and the chisel tapping
  modelos: `${FLOOR}<rect class="desk" x="62" y="88" width="76" height="24"/><rect class="desk" x="56" y="84" width="88" height="6"/>
    <path class="trunk" d="M96 84 V58 H104 V84 Z"/><circle class="canopy" cx="100" cy="44" r="24"/><circle class="canopy dim" cx="88" cy="50" r="12"/>
    <g class="work tap" style="transform-origin:150px 60px"><path class="tool" d="M124 46 L154 64 L150 70 L120 52 Z"/><rect class="tool-tip" x="150" y="62" width="16" height="8" rx="2" transform="rotate(30 158 66)"/></g>
    ${SPARKS(122, 50)}`,
  // studio: pulsing speaker, rising notes, equaliser
  musica: `${FLOOR}<rect class="board" x="26" y="34" width="46" height="78" rx="4"/>
    <circle class="work pulse cone" cx="49" cy="58" r="13" style="transform-origin:49px 58px"/><circle class="cone" cx="49" cy="92" r="9"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect class="work eq" x="${90 + i * 16}" y="70" width="10" height="42" style="transform-origin:0 112px;animation-delay:${i * 0.17}s"/>`).join('')}
    <g class="work float"><path class="note" d="M108 44 V22 L124 18 V40"/><circle class="note-head" cx="104" cy="44" r="5"/><circle class="note-head" cx="120" cy="40" r="5"/></g>
    ${SPARKS(49, 58)}`,
  // control tower of the orchestrators, with a sweeping radar and a beacon
  torre: `${FLOOR}<path class="board" d="M84 112 L90 52 H110 L116 112 Z"/><rect class="cabin" x="76" y="34" width="48" height="20" rx="3"/>
    <path class="window" d="M82 40 H118 V48 H82 Z"/><path class="frame" d="M100 34 V22"/>
    <g class="work sweep" style="transform-origin:100px 22px"><path class="radar" d="M100 22 L122 14 A24 24 0 0 1 124 26 Z"/></g>
    <circle class="work beacon" cx="100" cy="20" r="4"/>
    <path class="belt-line" d="M20 104 H76 M124 104 H180"/>
    ${SPARKS(100, 20)}`,
  // generic bench for a new station: hammer and crate
  generica: `${FLOOR}<rect class="desk" x="30" y="76" width="140" height="8" rx="2"/><path class="frame" d="M40 112 V84 M160 112 V84"/>
    <rect class="board" x="46" y="50" width="40" height="26" rx="2"/><path class="ink" d="M46 60 H86"/>
    <g class="work tap" style="transform-origin:150px 72px"><rect class="tool" x="104" y="44" width="22" height="12" rx="2"/><path class="frame" d="M116 56 L150 72"/></g>
    ${SPARKS(112, 62)}`,
} as const;

export type Tema = keyof typeof ART;

export const DRONE = `<g class="rotor-arm"><path d="M8 10 H40"/><ellipse class="rotor" cx="8" cy="8" rx="7" ry="2"/><ellipse class="rotor" cx="40" cy="8" rx="7" ry="2"/></g>
  <rect class="hull" x="12" y="12" width="24" height="16" rx="7"/><circle class="eye" cx="24" cy="20" r="3.5"/><path class="leg" d="M17 28 L14 34 M31 28 L34 34"/>`;
