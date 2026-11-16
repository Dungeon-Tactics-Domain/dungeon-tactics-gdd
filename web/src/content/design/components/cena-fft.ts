// The Final Fantasy Tactics (Ivalice Chronicles) combat bar redone as close as possible to the reference screenshot
// (refs/fft-ivalice/01-previa.jpg), in 3D quads. Coordinates are the screenshot's own pixels (1920x1080) minus the origin
// of the bar, so each number can be checked against the reference.
import {
  BufferAttribute,
  Color,
  Line,
  BufferGeometry,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
  type ShaderMaterial,
} from 'three';
import { type Ctx, type Hud, hex, icon, rect, retratoPixel, text } from './cena-hud';

const X0 = 65; // 30 px of left margin inside the bar's box, for the turn number and badge that stick out
const Y0 = 808;
const MUTED = '#b9c0d2';
const CREME = '#ece4d2';

/** Pentagon with the point on the right (the dark block in the middle), vertical gradient, light outline. */
function hexagono(c: Ctx, pts: [number, number][], topo: string, base: string, linha: string) {
  const sh = new Shape();
  pts.forEach(([x, y], i) => (i ? sh.lineTo(x, c.H - y) : sh.moveTo(x, c.H - y)));
  sh.closePath();
  const g = new ShapeGeometry(sh);
  const pos = g.getAttribute('position');
  const cores = new Float32Array(pos.count * 3);
  const a = new Color(topo);
  const b = new Color(base);
  for (let i = 0; i < pos.count; i++) {
    const t = 1 - (c.H - pos.getY(i) - 4) / 208; // 0 at the top edge, 1 at the bottom
    const k = a.clone().lerp(b, Math.min(1, Math.max(0, t)));
    cores.set([k.r, k.g, k.b], i * 3);
  }
  g.setAttribute('color', new BufferAttribute(cores, 3));
  const m = new Mesh(g, new MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.96, depthTest: false }));
  c.scene.add(m);
  const ln = new Line(
    new BufferGeometry().setFromPoints([...pts, pts[0]!].map(([x, y]) => new Vector3(x, c.H - y, 0.05))),
    new LineBasicMaterial({ color: linha, transparent: true, opacity: 0.8, depthTest: false }),
  );
  c.scene.add(ln);
}

export function montarFft(c: Ctx, v = 4): Hud {
  const hud: Hud = {
    rostos: [],
    barras: [],
    hpAlvo: { barra: -1, texto: () => {}, max: 82 },
    retratos: [],
    centro: { x: 770 - X0, y: 4, w: 360, h: 208 },
    dano: { set: () => {} },
    S: c.s,
    alturaPx: 215 * c.s,
  };
  const X = (x: number) => x - X0;
  const Y = (y: number) => y - Y0;
  const T = (s: string, x: number, y: number, size: number, o: { c?: string; w?: number; serif?: boolean; al?: 'left' | 'center' | 'right'; stroke?: string } = {}) =>
    text(c, s, X(x), Y(y), { size, color: o.c ?? CREME, weight: o.w ?? 400, serif: o.serif, align: o.al, stroke: o.stroke });

  // side panels: blue (ally) and maroon (enemy), fading toward the middle; darker band for the class row
  if (v >= 2) {
    rect(c, X(262), Y(812), 512, 208, { grad4: [hex('#111b36', 0.96), hex('#14264f', 0.5), hex('#213969', 0.97), hex('#101a44', 0.92)], radius: 5, blur: 1, sheen: v >= 3 ? 1 : 0 });
    rect(c, X(262), Y(975), 512, 45, { top: hex('#151e2f', 1), radius: 5, border: hex('#060c18', 1), borderW: 1 });
    rect(c, X(1126), Y(812), 541, 208, { grad4: [hex('#271410', 0.9), hex('#4e474e', 0.72), hex('#2f2220', 0.95), hex('#74514d', 0.97)], radius: 5, blur: 1 });
    rect(c, X(1126), Y(975), 541, 45, { top: hex('#1a1210', 1), bottom: hex('#3a2826', 1), horizontal: true, radius: 5, border: hex('#0a0605', 1), borderW: 1 });
  } else {
    rect(c, X(262), Y(812), 512, 208, { top: hex('#2c52b4', 0.95), bottom: hex('#0e1838', 0.95), horizontal: true, radius: 5, blur: 1 });
    rect(c, X(262), Y(975), 512, 45, { top: hex('#070c20', 0.55), radius: 5 });
    rect(c, X(1126), Y(812), 541, 208, { top: hex('#7c2d3d', 0.95), bottom: hex('#2a1119', 0.95), horizontal: true, radius: 5, blur: 1 });
    rect(c, X(1126), Y(975), 541, 45, { top: hex('#1a0a10', 0.55), radius: 5 });
  }
  if (v >= 3) {
    rect(c, X(262), Y(1016), 512, 4, { top: hex('#2f4457', 0.9), bottom: hex('#223242', 0.9), horizontal: true });
    rect(c, X(1126), Y(1016), 541, 4, { top: hex('#303936', 0.9), bottom: hex('#686e6c', 0.9), horizontal: true });
  }
  // middle: dark pentagon pointing at the target
  const pent: [number, number][] = [[X(768), Y(812)], [X(1052), Y(812)], [X(1130), Y(916)], [X(1052), Y(1020)], [X(768), Y(1020)]];
  if (v >= 2) hexagono(c, pent, '#1e1d1b', '#0f0f0f', '#a7a09a');
  else hexagono(c, pent, '#222834', '#0a0d13', '#9ca3af');
  if (v >= 3) {
    const cx = pent.reduce((a, p) => a + p[0], 0) / 5;
    const cy = pent.reduce((a, p) => a + p[1], 0) / 5;
    [[4, 0.5], [8, 0.3], [13, 0.16], [19, 0.08]].forEach(([k, op]) => {
      const inset = pent.map(([x, y]) => {
        const l = Math.hypot(cx - x, cy - y);
        return new Vector3(x + ((cx - x) / l) * k!, c.H - (y + ((cy - y) / l) * k!), 0.04);
      });
      c.scene.add(
        new Line(
          new BufferGeometry().setFromPoints([...inset, inset[0]!]),
          new LineBasicMaterial({ color: '#6b6452', transparent: true, opacity: op!, depthTest: false }),
        ),
      );
    });
  }
  if (v >= 2) {
    // bevel on the top edge of the middle block: bright thread, then a fading olive band
    rect(c, X(770), Y(812), 280, 2, { top: hex('#b9b27e', 0.9) });
    rect(c, X(770), Y(814), 280, 12, { grad4: [hex('#8a8567', 0.85), hex('#434337', 0.2), hex('#8a8567', 0), hex('#434337', 0)] });
  }
  if (v >= 3) rect(c, X(770), Y(1016), 280, 4, { top: hex('#1f1f1f', 0.9), bottom: hex('#44433e', 0.9), horizontal: true });
  hud.centro = { x: X(768), y: Y(812), w: 362, h: 208 };

  const lado = (m: {
    nome: string; lv: string; exp: string; hp: [number, number]; mp: [number, number]; ct: [number, number]; brav: [string, string];
    classe: string; clv: string; next: string; jp: string; x: number; mpx: number; ctx: number; enemy?: boolean; previa?: number; lvx: number; expx: number;
    cx: number; cxx: [number, number, number];
  }) => {
    const e = m.enemy;
    T(m.nome, m.x, 837, 31, { serif: true });
    T(m.lv, m.lvx, 842, 27, { serif: true, c: CREME });
    if (v >= 2) rect(c, X(m.expx - 7), Y(836), 2, 16, { top: hex('#4f8cff', 1) });
    T(`EXP ${m.exp}`, m.expx, 846, 21, { c: MUTED });
    // HP
    T('HP', m.x + 2, 880, 28, { serif: true });
    if (!e) T(`${m.hp[0]}/${m.hp[1]}`, m.x + 224, 880, 31, { serif: true, al: 'right' });
    const hpX = m.x;
    const f = m.hp[0] / m.hp[1];
    const prev = m.previa ? (m.hp[0] - m.previa) / m.hp[1] : f;
    const barra = (x: number, y: number, w: number, h: number, a: string, b: string, fill: number, trail = fill, lime = false, skew = 0) => {
      if (v >= 2) {
        rect(c, X(x - 1), Y(y - 1), w + 2, h + 2, { top: hex('#000010', 0.9), radius: h / 2 + 1, skew: v >= 3 ? skew : 0, border: hex(lime ? '#9be22a' : '#000010', 1), borderW: lime ? 1.6 : 1 });
      } else {
        rect(c, X(x - 1), Y(y - 1), w + 2, h + 2, { top: hex('#05070d', 0.85), radius: 4, border: hex('#d9d2bf', 0.35), borderW: 1 });
      }
      const r = rect(c, X(x), Y(y), w, h, { top: hex(a), bottom: hex(b), horizontal: v >= 2, bar: true, radius: v >= 2 ? h / 2 : 3, skew: v >= 3 ? skew : 0, trail: hex(v >= 2 ? '#c9301f' : '#e8402f', 1) });
      const mat = r.material as ShaderMaterial;
      mat.uniforms.uFill!.value = fill;
      mat.uniforms.uTrail!.value = trail;
      const ent = { mat, fill, alvoFill: fill, trail, alvoTrail: trail };
      hud.barras.push(ent);
      return ent;
    };
    if (v >= 2) barra(hpX, 901, 234, 18, '#5e8218', '#98bf4a', prev, f, !!e, 9);
    else barra(hpX, 903, 234, 14, '#b4e24a', '#4e9b1c', prev, f);
    if (e) hud.hpAlvo = { barra: hud.barras.length - 1, texto: () => {}, max: m.hp[1] };
    // MP
    T('MP', m.mpx, 880, 28, { serif: true });
    T(`${m.mp[0]}/${m.mp[1]}`, m.mpx + 229, 880, 31, { serif: true, al: 'right' });
    if (v >= 2) barra(m.mpx - 5, 901, 234, 18, '#c06050', '#d6a77a', m.mp[0] / m.mp[1], m.mp[0] / m.mp[1], false, 9);
    else barra(m.mpx - 5, 903, 234, 14, '#ec8a72', '#d6a77a', m.mp[0] / m.mp[1]);
    // CT
    T('CT', m.x + 2, 943, 27, { serif: true });
    if (v >= 2) barra(m.ctx, 939, 130, 14, '#b98a0d', '#f1c232', m.ct[0] / m.ct[1]);
    else barra(m.ctx, 940, 130, 12, '#f1c232', '#b98a0d', m.ct[0] / m.ct[1]);
    T(String(m.ct[0]), m.ctx + 184, 941, 29, { serif: true, al: 'right' });
    // Bravery / Faith
    if (v >= 2) {
      rect(c, X(m.mpx - 6), Y(930), 235, 33, { top: hex('#0c1325', 0.92), radius: 5, border: hex('#262a36', 1), borderW: 1 });
      rect(c, X(m.mpx - 4), Y(932), 231, 6, { top: hex('#000000', 0.35), bottom: hex('#000000', 0), radius: 3 });
    } else {
      rect(c, X(m.mpx - 6), Y(930), 235, 33, { top: hex('#070b1d', 0.55), radius: 6, border: hex('#ffffff', 0.08), borderW: 1 });
    }
    T('Bravery', m.mpx + 8, 947, 21, { c: MUTED });
    T(m.brav[0], m.mpx + 88, 947, 25, { w: 500 });
    T('Faith', m.mpx + 130, 947, 21, { c: MUTED });
    T(m.brav[1], m.mpx + 188, 947, 25, { w: 500 });
    // class row
    icon(c, 'sword', X(m.cx), Y(993), 15, v >= 3 ? '#e8d9b0' : '#d9c58a', '#161a2c');
    if (v >= 3) rect(c, X(m.cx) - 12, Y(993) - 12, 24, 24, { radius: 12, border: hex('#7a6646', 0.9), borderW: 1 });
    T(m.classe, m.cx + 24, 993, 23, { serif: true });
    T(`Lv. ${m.clv}`, m.cxx[0], 994, 22, { c: MUTED });
    T(`Next ${m.next}`, m.cxx[1], 994, 22, { c: MUTED });
    if (v >= 2) rect(c, X(m.cxx[2] - 8), Y(985), 2, 17, { top: hex('#5fd16a', 1) });
    T(`JP ${m.jp}`, m.cxx[2], 994, 22, { c: MUTED });
    return e;
  };
  lado({
    nome: 'Ramza', lv: 'Lv.8', exp: '77', hp: [84, 84], mp: [30, 30], ct: [100, 100], brav: ['72', '70'], classe: 'Squire', clv: '6', next: '600',
    jp: '1368', x: 278, mpx: 533, ctx: 325, lvx: 607, expx: 683, cx: 295, cxx: [497, 563, 680],
  });
  lado({
    nome: 'Thomas', lv: 'Lv.5', exp: '80', hp: [54, 82], mp: [30, 30], ct: [60, 100], brav: ['72', '71'], classe: 'Knight', clv: '1', next: '89',
    jp: '111', x: 1153, mpx: 1407, ctx: 1199, lvx: 1481, expx: 1557, cx: 1168, cxx: [1413, 1466, 1558], enemy: true, previa: 36,
  });
  // the target's HP number is redrawn on confirm: keep a handle
  const hpTxt = text(c, '54/82', X(1153 + 226), Y(880), { size: 31, color: CREME, serif: true, align: 'right' });
  hud.hpAlvo.texto = hpTxt.set;

  // middle block contents
  icon(c, 'target', X(817), Y(842), 14, '#d7dbe6', '#000000', true);
  T('100%', 843, 842, 27, { c: '#eef0f6' });
  icon(c, 'tri', X(957), Y(842), 14, '#d7dbe6', '#000000', true);
  T('100%', 983, 842, 27, { c: '#eef0f6' });
  hud.dano = T('36', 932, 900, 92, { serif: true, al: 'center', c: '#f3efe4' });
  T('Damage', 932, 974, 25, { serif: true, al: 'center', c: '#e6e1d3' });

  // portraits: live 3D busts up to v3, the game's pixel faces from v4
  for (const [px, id] of [[100, 'knight'], [1660, 'skeleton_mage']] as const) {
    rect(c, X(px), Y(815), 162, 197, { top: hex('#1b2230', 1), radius: 5 });
    if (v >= 4) retratoPixel(c, hud, id, X(px) + 2, Y(815) + 2, 158, 193);
    else hud.retratos.push({ x: X(px), y: Y(815), w: 162, h: 197 });
  }
  const fundo = c.scene;
  c.scene = c.front;
  for (const px of [100, 1660]) {
    if (v >= 4) {
      rect(c, X(px), Y(815), 162, 197, { radius: 5, border: hex('#e4d3b7', 0.95), borderW: 2 });
      rect(c, X(px) + 160, Y(821), 2, 185, { top: hex('#d4b362', 1), bottom: hex('#b58867', 1) });
    } else {
      rect(c, X(px), Y(815), 162, 197, { radius: 5, border: hex('#d8bb7a', 0.95), borderW: 2 });
    }
  }
  T('Enemy', 1740, 994, 25, { c: '#f7b9cf', w: 500, al: 'center', stroke: '#3a1522' });
  T('1', 78, 838, 32, { c: '#7fd1ff', w: 700, al: 'center', stroke: '#0b2a4a' });
  icon(c, v >= 4 ? 'capri' : 'star', X(113), Y(830), 19, '#e7f3ec', '#3a9a78');
  icon(c, v >= 4 ? 'gemini' : 'star', X(1806), Y(828), 19, '#ece6fa', '#6a4fb5');
  c.scene = fundo;
  return hud;
}
