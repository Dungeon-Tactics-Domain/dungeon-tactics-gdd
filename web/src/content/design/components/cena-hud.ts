// HUD of combat in Three.js (test, 15/11): a 3D scene of the game (KayKit) with the FFT-style bar drawn as quads in an
// orthographic pass over it. Glass panels blur the real scene behind them (framebuffer copy), bars are shader quads,
// portraits are live 3D busts (second camera, scissor), text is a canvas texture. Units: design units * s = CSS px.
import {
  AmbientLight,
  AnimationMixer,
  BoxGeometry,
  Box3,
  Clock,
  DirectionalLight,
  FramebufferTexture,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  CanvasTexture,
  LinearFilter,
  NearestFilter,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
  type AnimationClip,
  type Light,
  type Object3D,
} from 'three';
import { alturaDe, criarArena } from './cena-arena';
import { ALVO, ATACANTE, type Lado } from './hud-dados';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const BASE = '/content/design/hud3d/';
export type Rgba = [number, number, number, number];
export const hex = (h: string, a = 1): Rgba => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
  a,
];

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
// one shader for panel, border and bar: rounded rect SDF, optional blur of the scene behind, optional fill/trail
const FRAG = `
precision highp float;
varying vec2 vUv;
uniform vec2 uSize; uniform float uRadius; uniform vec4 uTop; uniform vec4 uBottom;
uniform vec4 uBorder; uniform float uBorderW; uniform float uBlur; uniform sampler2D uScene; uniform vec2 uRes;
uniform float uFill; uniform float uTrail; uniform vec4 uTrailC; uniform vec4 uTL; uniform vec4 uTR; uniform vec4 uBL; uniform vec4 uBR; uniform float uG4;
uniform float uBar; uniform float uHoriz; uniform float uSkew; uniform float uSheen;
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = (vUv - 0.5) * uSize;
  vec2 q = vec2(p.x + p.y * uSkew / uSize.y, p.y);
  float d = sdBox(q, uSize * 0.5 - vec2(abs(uSkew) * 0.5, 0.0), uRadius);
  float cover = 1.0 - smoothstep(-0.5, 0.5, d);
  if (cover <= 0.0) discard;
  vec4 c = mix(uBottom, uTop, uHoriz > 0.5 ? 1.0 - vUv.x : vUv.y);
  if (uG4 > 0.5) c = mix(mix(uBL, uBR, vUv.x), mix(uTL, uTR, vUv.x), vUv.y);
  vec3 rgb = c.rgb; float a = c.a;
  if (uBlur > 0.5) {
    vec2 px = 1.0 / uRes; vec3 acc = texture2D(uScene, gl_FragCoord.xy * px).rgb; float n = 1.0;
    for (int i = 0; i < 12; i++) {
      float ang = float(i) * 2.399963; float rad = (0.35 + 0.65 * fract(float(i) * 0.618)) * uBlur * 9.0;
      acc += texture2D(uScene, (gl_FragCoord.xy + vec2(cos(ang), sin(ang)) * rad) * px).rgb; n += 1.0;
    }
    vec3 bg = acc / n;
    rgb = mix(bg, c.rgb, c.a); a = 1.0;
  }
  if (uBar > 0.5) {
    float x = vUv.x;
    if (x < uFill) { rgb = c.rgb; a = c.a; }
    else if (x < uTrail) { rgb = uTrailC.rgb; a = uTrailC.a; }
    else { rgb = uBottom.rgb * 0.35; a = 0.55; }
    float tube = abs(vUv.y - 0.5) * 2.0;
    rgb *= 0.86 + 0.3 * tube * tube;
    rgb += 0.14 * smoothstep(1.0 - 2.0 / uSize.y, 1.0, vUv.y);
    rgb *= 1.0 - 0.45 * smoothstep(2.5 / uSize.y, 0.0, vUv.y);
  }
  if (uSheen > 0.0) {
    vec2 n = normalize(vec2(-0.6, 1.0));
    float dist = dot(p, n) + uSize.y * 0.12;
    rgb += vec3(0.10, 0.17, 0.36) * uSheen * exp(-pow(dist / (uSize.y * 0.2), 2.0));
  }
  if (uBorderW > 0.0) {
    float edge = smoothstep(-uBorderW - 0.5, -uBorderW + 0.5, d);
    rgb = mix(rgb, uBorder.rgb, edge * uBorder.a); a = max(a, edge * uBorder.a);
  }
  gl_FragColor = vec4(rgb, a * cover);
}`;

interface RectOpts {
  grad4?: [Rgba, Rgba, Rgba, Rgba]; // corner colours: top-left, top-right, bottom-left, bottom-right
  skew?: number; // px of slant of the left/right edges (parallelogram)
  sheen?: number; // soft diagonal light band
  horizontal?: boolean; // gradient runs left (top colour) to right (bottom colour)
  top?: Rgba;
  bottom?: Rgba;
  radius?: number;
  border?: Rgba;
  borderW?: number;
  blur?: number;
  bar?: boolean;
  trail?: Rgba;
}

export interface Ctx {
  s: number;
  H: number;
  scene: Group;
  front: Group; // drawn after the 3D busts
  scale: number; // s * pixel ratio, for text sharpness
  tex: FramebufferTexture;
  res: Vector2;
}

/** y is measured from the top of the bar, down; the quad is centred on its rectangle. */
export function rect(c: Ctx, x: number, y: number, w: number, h: number, o: RectOpts = {}) {
  const top = o.top ?? hex('#ffffff', 0);
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uSize: { value: new Vector2(w * c.s, h * c.s) },
      uRadius: { value: (o.radius ?? 0) * c.s },
      uTop: { value: top },
      uBottom: { value: o.bottom ?? top },
      uBorder: { value: o.border ?? [0, 0, 0, 0] },
      uBorderW: { value: o.borderW ?? 0 },
      uBlur: { value: o.blur ?? 0 },
      uScene: { value: c.tex },
      uRes: { value: c.res },
      uFill: { value: 1 },
      uTrail: { value: 1 },
      uTrailC: { value: o.trail ?? [0, 0, 0, 0] },
      uBar: { value: o.bar ? 1 : 0 },
      uHoriz: { value: o.horizontal ? 1 : 0 },
      uG4: { value: o.grad4 ? 1 : 0 },
      uTL: { value: o.grad4?.[0] ?? top },
      uTR: { value: o.grad4?.[1] ?? top },
      uBL: { value: o.grad4?.[2] ?? top },
      uBR: { value: o.grad4?.[3] ?? top },
      uSkew: { value: (o.skew ?? 0) * c.s },
      uSheen: { value: o.sheen ?? 0 },
    },
  });
  const m = new Mesh(new PlaneGeometry(w, h), mat);
  m.position.set(x + w / 2, c.H - y - h / 2, 0);
  c.scene.add(m);
  return m;
}

export interface TextOpts {
  serif?: boolean;
  stroke?: string;
  size: number;
  color?: string;
  weight?: number;
  align?: 'left' | 'center' | 'right';
}
const SERIF = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';
const FONT = 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Text as a canvas texture (accents come from the browser font); `set` redraws it. Anchor: x by align, y = centre. */
export function text(c: Ctx, str: string, x: number, y: number, o: TextOpts) {
  const align = o.align ?? 'left';
  const cv = document.createElement('canvas');
  const tex = new CanvasTexture(cv);
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  const mesh = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: tex, transparent: true, depthTest: false }));
  const draw = (s: string) => {
    const k = c.scale;
    const ctx = cv.getContext('2d')!;
    const font = `${o.weight ?? 500} ${o.size * k}px ${o.serif ? SERIF : FONT}`;
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(s).width) + 4 * k;
    const h = Math.ceil(o.size * k * 1.4);
    cv.width = w;
    cv.height = h;
    ctx.font = font;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowOffsetY = 1.5 * k;
    ctx.shadowBlur = 2 * k;
    ctx.fillStyle = o.color ?? '#e8edf3';
    ctx.textBaseline = 'middle';
    if (o.stroke) {
      ctx.lineWidth = o.size * k * 0.14;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(s, 2 * k, h / 2 + o.size * k * 0.04);
    }
    ctx.fillText(s, 2 * k, h / 2 + o.size * k * 0.04);
    tex.needsUpdate = true;
    const uw = w / k;
    const uh = h / k;
    mesh.geometry.dispose();
    mesh.geometry = new PlaneGeometry(uw, uh);
    const cx = align === 'left' ? x + uw / 2 : align === 'right' ? x - uw / 2 : x;
    mesh.position.set(cx, c.H - y, 0.1);
  };
  draw(str);
  c.scene.add(mesh);
  return { mesh, set: draw };
}

/** Small round badge with a glyph drawn by hand (no emoji fonts), for sign, hit chance and so on. */
export function icon(c: Ctx, kind: 'star' | 'sword' | 'bolt' | 'target' | 'tri' | 'gemini' | 'capri', x: number, y: number, r: number, color: string, fill = '#0b0f14', plain = false) {
  if (!plain) rect(c, x - r, y - r, r * 2, r * 2, { top: hex(fill, 0.8), radius: r, border: hex(color, 0.9), borderW: 1 });
  if (!plain) rect(c, x - r + 1.5, y - r + 1.5, r * 2 - 3, r * 0.9, { top: hex('#ffffff', 0.16), bottom: hex('#ffffff', 0), radius: r * 0.8 });
  const k = c.scale;
  const cv = document.createElement('canvas');
  cv.width = cv.height = Math.ceil(r * 2 * k);
  const g = cv.getContext('2d')!;
  g.translate(cv.width / 2, cv.height / 2);
  g.scale(k * r, k * r);
  g.strokeStyle = g.fillStyle = color;
  g.lineWidth = 0.14;
  g.lineJoin = g.lineCap = 'round';
  g.beginPath();
  if (kind === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? 0.28 : 0.62;
      g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  } else if (kind === 'target') {
    g.arc(0, 0, 0.5, 0, Math.PI * 2);
    g.moveTo(0, -0.95);
    g.lineTo(0, -0.3);
    g.moveTo(0, 0.95);
    g.lineTo(0, 0.3);
    g.moveTo(-0.95, 0);
    g.lineTo(-0.3, 0);
    g.moveTo(0.95, 0);
    g.lineTo(0.3, 0);
    g.stroke();
  } else if (kind === 'gemini') {
    g.lineWidth = 0.17;
    g.moveTo(-0.32, -0.45);
    g.lineTo(-0.32, 0.45);
    g.moveTo(0.32, -0.45);
    g.lineTo(0.32, 0.45);
    g.moveTo(-0.55, -0.62);
    g.quadraticCurveTo(0, -0.28, 0.55, -0.62);
    g.moveTo(-0.55, 0.62);
    g.quadraticCurveTo(0, 0.28, 0.55, 0.62);
    g.stroke();
  } else if (kind === 'capri') {
    g.lineWidth = 0.17;
    g.moveTo(-0.6, -0.35);
    g.quadraticCurveTo(-0.45, -0.7, -0.2, -0.1);
    g.lineTo(-0.05, 0.35);
    g.quadraticCurveTo(0.1, -0.5, 0.35, -0.1);
    g.quadraticCurveTo(0.55, 0.2, 0.3, 0.4);
    g.quadraticCurveTo(0.05, 0.55, 0.2, 0.2);
    g.stroke();
  } else if (kind === 'tri') {
    for (const [tx, ty] of [[0, -0.55], [-0.5, 0.35], [0.5, 0.35]] as const) {
      g.moveTo(tx, ty - 0.32);
      g.lineTo(tx - 0.3, ty + 0.2);
      g.lineTo(tx + 0.3, ty + 0.2);
      g.closePath();
    }
    g.stroke();
  } else if (kind === 'sword') {
    g.moveTo(-0.45, 0.45);
    g.lineTo(0.45, -0.45);
    g.moveTo(-0.38, 0.12);
    g.lineTo(-0.12, 0.38);
    g.moveTo(0.2, -0.45);
    g.lineTo(0.45, -0.45);
    g.lineTo(0.45, -0.2);
    g.stroke();
  } else {
    g.moveTo(0.12, -0.6);
    g.lineTo(-0.3, 0.1);
    g.lineTo(0, 0.1);
    g.lineTo(-0.12, 0.6);
    g.lineTo(0.3, -0.1);
    g.lineTo(0, -0.1);
    g.closePath();
    g.fill();
  }
  const t = new CanvasTexture(cv);
  const m = new Mesh(new PlaneGeometry(r * 2, r * 2), new MeshBasicMaterial({ map: t, transparent: true, depthTest: false }));
  m.position.set(x, c.H - y, 0.1);
  c.scene.add(m);
}

export interface Barra {
  mat: ShaderMaterial;
  w: number; // design width, to move the damage number
}
/** The game's pixel-art face sheets (chars/ia-alinhado-rosto for the knight: 8 frames of 256 px; chars/px for the skeleton: 4 frames of 128 px). */
export const ROSTOS = {
  knight: { url: 'ia-alinhado-rosto/knight.png', n: 8, frames: { neutro: 0, grito: 3, dano: 4 } },
  skeleton_mage: { url: 'ia-alinhado-rosto/skeleton_mage.png', n: 8, frames: { neutro: 0, grito: 3, dano: 4 } },
} as const;
export type IdRosto = keyof typeof ROSTOS;
export type Expressao = 'neutro' | 'grito' | 'dano';

/** A face from the sheet as a textured quad (square frame cropped to the portrait box); returns the expression setter. */
export function retratoPixel(c: Ctx, hud: Hud, id: IdRosto, x: number, y: number, w: number, h: number) {
  const { url, n, frames } = ROSTOS[id];
  const tx = new TextureLoader().load(`/content/design/chars/${url}`);
  tx.colorSpace = SRGBColorSpace;
  tx.magFilter = NearestFilter;
  const corte = Math.min(1, w / h); // the frame is square: keep the middle `corte` of its width
  tx.repeat.set(corte / n, 1);
  const pos = (f: number) => tx.offset.set(f / n + ((1 - corte) / 2) / n, 0);
  pos(0);
  const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tx, transparent: true, depthTest: false }));
  m.position.set(x + w / 2, c.H - y - h / 2, 0.05);
  c.scene.add(m);
  hud.rostos.push({ set: (k: Expressao) => pos(frames[k]) });
}

export interface Hud {
  rostos: { set: (k: Expressao) => void }[];
  /** every bar fill, to animate: [material, current fill, target fill, current trail, target trail] */
  barras: { mat: ShaderMaterial; fill: number; alvoFill: number; trail: number; alvoTrail: number }[];
  hpAlvo: { barra: number; texto: (s: string) => void; max: number };
  retratos: { x: number; y: number; w: number; h: number }[];
  centro: { x: number; y: number; w: number; h: number };
  dano: { set: (s: string) => void };
  S: number;
  alturaPx: number;
}

const GLASS = hex('#0c1118', 0.5);
const GLASS2 = hex('#0c1118', 0.7);
const LINE = hex('#ffffff', 0.16);
const MUTED = '#9fb0c0';

const dimLado = (compact: boolean) => ({ W: compact ? 170 : 400, H: compact ? 72 : 130 });
const CW = (compact: boolean) => (compact ? 52 : 176);
const GAP = (compact: boolean) => (compact ? 4 : 8);

function lado(c: Ctx, hud: Hud, d: Lado, x0: number, compact: boolean, mirror: boolean) {
  const { W, H } = dimLado(compact);
  rect(c, x0, 0, W, H, { top: GLASS, bottom: GLASS2, blur: 1, radius: 10, border: LINE, borderW: 1 });
  const ps = H - 16; // portrait side
  const px = mirror ? x0 + W - 8 - ps : x0 + 8;
  const py = 8;
  rect(c, px, py, ps, ps, { top: hex('#1b2733', 1), radius: 6 });
  retratoPixel(c, hud, d.inimigo ? 'skeleton_mage' : 'knight', px, py, ps, ps);
  // frame, corner marks and seal go in front of the 3D bust
  const fundo = c.scene;
  c.scene = c.front;
  rect(c, px, py, ps, ps, { radius: 6, border: hex('#ffffff', 0.3), borderW: 1 });
  rect(c, px + 3, py + 3, compact ? 15 : 20, compact ? 14 : 17, { top: hex('#05080c', 0.78), radius: 4 });
  text(c, d.turno, px + (compact ? 4.5 : 5.5), py + (compact ? 10 : 11.5), { size: compact ? 11 : 12, weight: 700 });
  icon(c, 'star', px + ps - 9, py + 9, 6, '#f5d36b');
  if (d.inimigo) {
    const w = compact ? 44 : 56;
    rect(c, px + ps / 2 - w / 2, py + ps - 15, w, 13, { top: hex('#b91c1c', 0.9), radius: 6 });
    text(c, 'Inimigo', px + ps / 2, py + ps - 8.5, { size: 10, weight: 700, align: 'center' });
  }
  c.scene = fundo;
  // text region: [tx, lim]; the Bravura/Fe panel takes the other side on the wide layout
  const painel = 88;
  const tx = compact ? (mirror ? x0 + 8 : px + ps + 8) : mirror ? x0 + 10 + painel + 10 : px + ps + 10;
  const lim = compact ? (mirror ? px - 8 : x0 + W - 8) : mirror ? px - 10 : x0 + W - 10 - painel - 10;
  text(c, d.nome, tx, compact ? 14 : 17, { size: compact ? 13 : 18, weight: 700 });
  text(c, `Nv ${d.nv}`, lim, compact ? 14 : 17, { size: compact ? 11 : 13, color: MUTED, align: 'right' });
  const labelW = compact ? 0 : 22;
  const valW = compact ? 34 : 46;
  const barra = (rotulo: string, y: number, [v, m]: [number, number], top: Rgba, bot: Rgba, isHp = false) => {
    if (!compact) text(c, rotulo, tx, y + 3.5, { size: 11, weight: 700, color: MUTED });
    const bx = tx + labelW;
    const mesh = rect(c, bx, y, lim - valW - bx, 7, { top, bottom: bot, bar: true, radius: 3, trail: hex('#ef4444', 1) });
    const f = v / m;
    const prev = isHp && d.previa ? Math.max(0, v - d.previa) / m : f;
    const entry = { mat: mesh.material as ShaderMaterial, fill: prev, alvoFill: prev, trail: f, alvoTrail: f };
    entry.mat.uniforms.uFill!.value = prev;
    entry.mat.uniforms.uTrail!.value = f;
    hud.barras.push(entry);
    const t = text(c, `${v}/${m}`, lim, y + 3.5, { size: compact ? 11 : 12, weight: 600, align: 'right' });
    if (isHp && d.inimigo) hud.hpAlvo = { barra: hud.barras.length - 1, texto: t.set, max: m };
  };
  barra('HP', compact ? 30 : 32, d.hp, hex('#4ade80'), hex('#16a34a'), true);
  barra('PM', compact ? 46 : 50, d.mp, hex('#f87171'), hex('#dc2626'));
  if (compact) return;
  barra('CT', 68, d.ct, hex('#fde047'), hex('#ca8a04'));
  const bx = mirror ? x0 + 10 : x0 + W - 10 - painel;
  rect(c, bx, 28, painel, 54, { top: hex('#000000', 0.28), radius: 6, border: hex('#ffffff', 0.1), borderW: 1 });
  text(c, 'Bravura', bx + 8, 42, { size: 11, color: MUTED });
  text(c, String(d.bravura), bx + painel - 8, 42, { size: 14, weight: 700, align: 'right' });
  text(c, 'Fé', bx + 8, 66, { size: 11, color: MUTED });
  text(c, String(d.fe), bx + painel - 8, 66, { size: 14, weight: 700, align: 'right' });
  rect(c, tx, 92, lim - tx, 1, { top: hex('#ffffff', 0.12) });
  text(c, d.classe, tx, 108, { size: 13, weight: 700 });
  text(c, `Próx ${d.prox}   PH ${d.ph}`, lim, 108, { size: 12, color: MUTED, align: 'right' });
}

/** Builds the whole bar into the groups of `c` and returns what to animate. */
export function montarHud(c: Ctx, compact: boolean): Hud {
  const hud: Hud = {
    rostos: [],
    barras: [], hpAlvo: { barra: -1, texto: () => {}, max: 82 }, retratos: [], centro: { x: 0, y: 0, w: 0, h: 0 },
    dano: { set: () => {} }, S: c.s, alturaPx: 0,
  };
  const { W, H } = dimLado(compact);
  const gap = GAP(compact);
  const cw = CW(compact);
  lado(c, hud, ATACANTE, 0, compact, false);
  const cx = W + gap;
  // centre: dark glass block with an arrow pointing at the target, hit chances and the damage
  rect(c, cx, 0, cw, H, { top: hex('#05080c', 0.62), bottom: hex('#05080c', 0.78), blur: 1, radius: 10, border: LINE, borderW: 1 });
  hud.centro = { x: cx, y: 0, w: cw, h: H };
  if (!compact) {
    icon(c, 'sword', cx + cw / 2 - 40, 26, 12, '#9ad0ff');
    text(c, '100%', cx + cw / 2 - 40, 48, { size: 11, weight: 700, align: 'center' });
    icon(c, 'bolt', cx + cw / 2 + 40, 26, 12, '#f5d36b');
    text(c, '100%', cx + cw / 2 + 40, 48, { size: 11, weight: 700, align: 'center' });
  }
  hud.dano = text(c, '36', cx + cw / 2, compact ? 31 : 76, { size: compact ? 26 : 44, weight: 700, align: 'center' });
  text(c, 'Dano', cx + cw / 2, compact ? 54 : 106, { size: compact ? 11 : 13, color: MUTED, align: 'center' });
  lado(c, hud, ALVO, cx + cw + gap, compact, true);
  const seta = new Shape();
  seta.moveTo(0, 0);
  seta.lineTo(12, -H * 0.18);
  seta.lineTo(0, -H * 0.36);
  seta.closePath();
  const sm = new Mesh(new ShapeGeometry(seta), new MeshBasicMaterial({ color: 0x0c1118, transparent: true, opacity: 0.9, depthTest: false }));
  sm.position.set(cx + cw - 1, c.H - H * 0.32, 0);
  c.scene.add(sm);
  hud.alturaPx = H * c.s;
  return hud;
}

/** Overall width in design units. */
export const larguraProjeto = (compact: boolean) => dimLado(compact).W * 2 + CW(compact) + GAP(compact) * 2;

// ---------- 3D scene ----------
interface Pers {
  root: Object3D;
  head: Vector3;
  face: Vector3;
  mixer?: AnimationMixer;
  h: number; // model height at scale 1
}

export interface Cena {
  desenhar: (dt?: number) => void;
  redimensionar: (w: number, h: number) => void;
  confirmar: (ativo: boolean) => void;
  destruir: () => void;
  hit: (x: number, y: number) => 'centro' | null;
  /** FFT bar only: rebuild it at version `v` (1 to 4). */
  versao: (v: number) => void;
}

function chao(): Group {
  const g = new Group();
  const claro = new MeshStandardMaterial({ color: 0x6b7280, roughness: 1 });
  const escuro = new MeshStandardMaterial({ color: 0x4b5563, roughness: 1 });
  for (let x = -4; x <= 4; x++)
    for (let z = -3; z <= 2; z++) {
      const t = new Mesh(new BoxGeometry(1, 0.4, 1), (x + z) % 2 ? claro : escuro);
      t.position.set(x, -0.2 + ((x * 7 + z * 3) % 5 === 0 ? 0.12 : 0), z);
      g.add(t);
    }
  return g;
}

export async function criarCena(canvas: HTMLCanvasElement, comHud = true, fft = false): Promise<Cena> {
  const montarFft = fft ? (await import('./cena-fft')).montarFft : null;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.autoClear = false;
  renderer.setClearColor(0x1d2a38, 1);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const lights: Light[] = [new HemisphereLight(0xcfe0ff, 0x3a3226, 1.6), new AmbientLight(0xffffff, 0.5)];
  const sun = new DirectionalLight(0xfff1d6, 2.4);
  sun.position.set(3, 6, 4);
  lights.push(sun);
  for (const l of lights) {
    l.layers.enable(1);
    scene.add(l);
  }
  const chaoSimples = chao();
  scene.add(chaoSimples);
  let arena: Group | null = null;

  const cam = new PerspectiveCamera(40, 1, 0.1, 60);
  const base = new Vector3(0, 2.6, 5.6);
  const olhar = new Vector3(0, 0.6, 0);
  cam.position.copy(base);
  cam.lookAt(olhar);

  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const [knight, skel, anims] = await Promise.all(
    ['knight', 'skeleton_mage', 'animations'].map((n) => loader.loadAsync(`${BASE}${n}.glb`)),
  );
  const clips: AnimationClip[] = anims!.animations;
  const clip = (n: string) => clips.find((a) => a.name === n);
  const pers: Pers[] = [];
  const colocar = (gltf: typeof knight, x: number, ry: number) => {
    const root = gltf!.scene;
    root.position.set(x, 0, 0);
    root.rotation.y = ry;
    root.traverse((o) => o.layers.enable(1));
    scene.add(root);
    const box = new Box3().setFromObject(root);
    const h = box.max.y;
    const face = new Vector3(Math.sin(ry), 0, Math.cos(ry));
    const mixer = new AnimationMixer(root);
    pers.push({ root, head: new Vector3(x, h * 0.76, 0), face, mixer, h });
  };
  colocar(knight, -1.3, Math.PI / 2);
  colocar(skel, 1.3, -Math.PI / 2);
  const toca = (i: number, nome: string, loop = true) => {
    const cl = clip(nome);
    const mx = pers[i]!.mixer!;
    if (!cl) return;
    mx.stopAllAction();
    const a = mx.clipAction(cl);
    if (!loop) {
      a.setLoop(2200, 1); // LoopOnce
      a.clampWhenFinished = true;
    }
    a.reset().play();
  };
  toca(0, 'Idle');
  toca(1, 'Idle');

  // v5: the fuller battlefield, with the hero attacking in a loop. Loaded the first time it is asked for.
  let laco: number | undefined;
  const ciclo = () => {
    toca(0, 'Melee_1H_Attack_Slice_Diagonal', false);
    hud?.rostos[0]?.set('grito');
    window.setTimeout(() => {
      toca(1, 'Hit_A', false);
      hud?.rostos[1]?.set('dano');
    }, 450);
    window.setTimeout(() => {
      toca(0, 'Idle');
      toca(1, 'Idle');
      hud?.rostos[0]?.set('neutro');
      hud?.rostos[1]?.set('neutro');
    }, 1700);
  };
  const posicionar = (i: number, x: number, y: number, z: number, k: number) => {
    const p = pers[i]!;
    p.root.position.set(x, y, z);
    p.root.scale.setScalar(k);
    p.head.set(x, y + p.h * k * 0.76, z);
  };
  const modoArena = async (ligar: boolean) => {
    window.clearInterval(laco);
    if (ligar) {
      arena ??= await criarArena();
      scene.add(arena);
      chaoSimples.visible = false;
      posicionar(0, -1, alturaDe(-1, 0), 0, 0.6);
      posicionar(1, 0, alturaDe(0, 0), 0, 0.6);
      base.set(1.2, 6.6, 9.6);
      olhar.set(-0.3, 0.5, 0);
      cam.fov = 32;
      ciclo();
      laco = window.setInterval(ciclo, 2600);
    } else {
      if (arena) scene.remove(arena);
      chaoSimples.visible = true;
      posicionar(0, -1.3, 0, 0, 1);
      posicionar(1, 1.3, 0, 0, 1);
      base.set(0, 2.6, 5.6);
      olhar.set(0, 0.6, 0);
      cam.fov = 40;
      toca(0, 'Idle');
      toca(1, 'Idle');
    }
    cam.updateProjectionMatrix();
  };
  let ligada = false;

  // HUD pass
  const hudCam = new OrthographicCamera(0, 1, 1, 0, -10, 10);
  const hudBack = new Scene();
  const hudFront = new Scene();
  let hud: Hud | null = null;
  let tex: FramebufferTexture | null = null;
  const res = new Vector2(1, 1);
  const portCams = [new PerspectiveCamera(24, 1, 0.1, 30), new PerspectiveCamera(24, 1, 0.1, 30)];
  for (const pc of portCams) pc.layers.set(1);
  let W = 1;
  let H = 1;
  let ox = 0;
  let oy = 0;
  let s = 1;
  let compact = false;
  let versaoFft = 4;

  const limpar = (sc: Scene) => {
    for (const ch of [...sc.children]) {
      ch.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as MeshBasicMaterial | ShaderMaterial | undefined;
        (mat as MeshBasicMaterial | undefined)?.map?.dispose();
        mat?.dispose();
      });
      sc.remove(ch);
    }
  };
  const montar = () => {
    limpar(hudBack);
    limpar(hudFront);
    tex?.dispose();
    renderer.getDrawingBufferSize(res);
    tex = new FramebufferTexture(res.x, res.y);
    compact = W < 720;
    const dw = montarFft ? 1760 : larguraProjeto(compact);
    s = montarFft ? (W - 16) / dw : Math.min(W - 16, 1500) / dw;
    const dh = montarFft ? 215 : dimLado(compact).H;
    const g = new Group();
    ox = (W - dw * s) / 2;
    oy = 8;
    g.position.set(ox, oy, 0);
    g.scale.set(s, s, 1);
    // the quads are authored in units; the group scales them, the shader sizes stay in px (set from s)
    const gf = new Group();
    gf.position.copy(g.position);
    gf.scale.copy(g.scale);
    const c: Ctx = { s, H: dh, scene: g, front: gf, scale: s * dpr, tex, res };
    hud = montarFft ? montarFft(c, versaoFft) : montarHud(c, compact);
    hudBack.add(g);
    hudFront.add(gf);
  };

  let t = 0;
  const clock = new Clock();

  const desenhar = (dt?: number) => {
    const d = dt ?? clock.getDelta();
    t += d;
    for (const p of pers) p.mixer?.update(d);
    // slow camera sway, to show the HUD staying put over a moving scene
    cam.position.set(base.x + Math.sin(t * 0.4) * (ligada ? 0.5 : 0.9), base.y, base.z);
    cam.lookAt(olhar);
    renderer.clear();
    renderer.setViewport(0, 0, W, H);
    renderer.setScissorTest(false);
    renderer.render(scene, cam);
    if (!comHud || !hud || !tex) return;
    renderer.copyFramebufferToTexture(tex);
    // bars: ease fill and trail toward their targets
    for (const b of hud.barras) {
      b.fill += (b.alvoFill - b.fill) * Math.min(1, d * 6);
      b.trail += (b.alvoTrail - b.trail) * Math.min(1, d * 2.2);
      b.mat.uniforms.uFill!.value = b.fill;
      b.mat.uniforms.uTrail!.value = Math.max(b.trail, b.fill);
    }
    renderer.render(hudBack, hudCam);
    // live 3D busts inside the portrait squares
    renderer.setScissorTest(true);
    hud.retratos.forEach((r, i) => {
      const p = pers[i]!;
      const x = ox + r.x * s;
      const w = r.w * s;
      const yb = oy + (hud!.alturaPx / s - r.y - r.h) * s; // from the bottom of the canvas
      renderer.setViewport(x, yb, w, w);
      renderer.setScissor(x, yb, w, w);
      renderer.clearDepth();
      const pc = portCams[i]!;
      pc.position.copy(p.head).addScaledVector(p.face, 2.2).addScaledVector(new Vector3(-p.face.z, 0, p.face.x), 1.8).add(new Vector3(0, 0.05, 0));
      pc.lookAt(p.head);
      renderer.render(scene, pc);
    });
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    renderer.render(hudFront, hudCam);
  };

  return {
    desenhar,
    versao(v) {
      versaoFft = v;
      if (comHud && W > 1) montar();
      if (fft && (v >= 5) !== ligada) {
        ligada = v >= 5;
        void modoArena(ligada);
      }
    },
    redimensionar(w, h) {
      W = w;
      H = h;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      base.z = Math.min(16, (ligada ? 9.6 : 5.6) * Math.max(1, 1.4 / cam.aspect)); // narrow screens: step back so both fit
      cam.updateProjectionMatrix();
      hudCam.right = w;
      hudCam.top = h;
      hudCam.updateProjectionMatrix();
      if (comHud) montar();
    },
    confirmar(ativo) {
      const b = hud?.barras[hud.hpAlvo.barra];
      if (hud && b) {
        const prev = ALVO.hp[0] - (ALVO.previa ?? 0);
        b.alvoFill = prev / hud.hpAlvo.max;
        b.fill = prev / hud.hpAlvo.max;
        b.alvoTrail = ativo ? prev / hud.hpAlvo.max : ALVO.hp[0] / hud.hpAlvo.max;
        if (!ativo) b.trail = ALVO.hp[0] / hud.hpAlvo.max;
        hud.hpAlvo.texto(`${ativo ? prev : ALVO.hp[0]}/${hud.hpAlvo.max}`);
      }
      hud?.rostos[0]?.set(ativo ? 'grito' : 'neutro');
      if (!ativo) hud?.rostos[1]?.set('neutro');
      if (ativo) {
        window.setTimeout(() => hud?.rostos[1]?.set('dano'), 450);
        toca(0, 'Melee_1H_Attack_Slice_Diagonal', false);
        window.setTimeout(() => toca(1, 'Hit_A', false), 450);
        window.setTimeout(() => {
          hud?.rostos[0]?.set('neutro');
          toca(0, 'Idle');
          toca(1, 'Idle');
        }, 2000);
      }
    },
    hit(x, y) {
      if (!hud) return null;
      const c = hud.centro;
      const px = ox + c.x * s;
      const py = H - (oy + (c.y + c.h) * s);
      return x >= px && x <= px + c.w * s && y >= py && y <= py + c.h * s ? 'centro' : null;
    },
    destruir() {
      window.clearInterval(laco);
      limpar(hudBack);
      limpar(hudFront);
      tex?.dispose();
      renderer.dispose();
    },
  };
}
