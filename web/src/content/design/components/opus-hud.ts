// Combat bar of Final Fantasy Tactics (preview of a blow: Ramza vs Thomas), rebuilt from scratch in an orthographic 3D
// layer. Everything is laid out in the reference's own pixels (1920x1080 capture, bar at x 65-1825, y 806-1022) inside one
// group, which the scene scales to the viewer. Shaders work in sRGB, like the game's compositing, so the hex values measured
// on the capture go in as they are; the frosted glass samples a blurred copy of the 3D scene (uBlur, linear, converted here).
import {
  CanvasTexture,
  Group,
  LinearMipmapLinearFilter,
  Mesh,
  NearestFilter,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  type Texture,
  Vector2,
  Vector3,
  Vector4,
} from 'three';

const rgb = (h: string) =>
  new Vector3(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Segoe UI", "Trebuchet MS", Arial, sans-serif';
const CREME = '#f4eed6';
const CINZA = '#b4b2a4';

// ---------------------------------------------------------------- shaders
const VERT_PLANO = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const VERT_FORMA = /* glsl */ `
varying vec2 vP;
void main(){ vP = vec2(position.x, -position.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

// Frosted glass: blurred scene behind, a tint with a 2-axis gradient (4 corner colours and 4 corner opacities), an optional
// diagonal where the panel turns see-through, a sheen along the top edge and a little grain.
const FRAG_VIDRO = /* glsl */ `
uniform sampler2D uBlur; uniform vec2 uRes;
uniform vec4 uBox; uniform vec3 uC00, uC10, uC01, uC11; uniform vec4 uA;
uniform vec4 uCorte; uniform float uBrilho, uSobre;
varying vec2 vP;
float hash(vec2 p){ return fract(sin(dot(floor(p), vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 t = clamp((vP - uBox.xy) / (uBox.zw - uBox.xy), 0.0, 1.0);
  vec3 tinta = mix(mix(uC00, uC10, t.x), mix(uC01, uC11, t.x), t.y);
  float a = mix(mix(uA.x, uA.y, t.x), mix(uA.z, uA.w, t.x), t.y);
  float borda = mix(uCorte.x, uCorte.y, t.y);
  a = mix(a, uCorte.w, smoothstep(borda - uCorte.z, borda + uCorte.z, vP.x));
  vec3 fundo = pow(max(texture2D(uBlur, gl_FragCoord.xy / uRes).rgb, 0.0), vec3(1.0 / 2.2));
  vec3 c = mix(fundo, tinta, a);
  c += uBrilho * smoothstep(uBox.y + 16.0, uBox.y, vP.y);
  c += (hash(vP * 0.5) - 0.5) * 0.02;
  // overlay mode: only the tint, with its own opacity, over what is already drawn
  gl_FragColor = uSobre > 0.5 ? vec4(tinta, a) : vec4(c, 1.0);
}`;

// Thin border along a ring shape: colour and opacity ramp along x (the pentagon's rim is dark on the left, light on the right).
const FRAG_ARO = /* glsl */ `
uniform vec2 uX; uniform vec3 uCa, uCb; uniform vec2 uAlfa;
varying vec2 vP;
void main(){
  float t = clamp((vP.x - uX.x) / (uX.y - uX.x), 0.0, 1.0);
  gl_FragColor = vec4(mix(uCa, uCb, t), mix(uAlfa.x, uAlfa.y, t));
}`;

// Rounded (optionally slanted) box drawn by its distance field: soft drop shadow, outer line, inner line, then the fill
// (left-to-right gradient up to uFill, damage red up to uPrev, empty after) with tube shading and a gloss band.
const FRAG_CAIXA = /* glsl */ `
uniform vec2 uSize; uniform float uPad, uRaio, uInc;
uniform float uLinha, uFora; uniform vec4 uCorLinha, uCorFora;
uniform vec3 uA, uB, uVerm, uVazio; uniform float uFill, uPrev, uPisca, uTubo, uAlfa, uSombra;
varying vec2 vUv;
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = (vUv - 0.5) * (uSize + 2.0 * uPad);
  vec2 q = vec2(p.x + p.y * uInc, p.y);
  float d = sdBox(q, uSize * 0.5, uRaio);
  float aa = max(fwidth(d), 0.001) * 0.75;
  // drop shadow (below and outside)
  float ds = sdBox(q + vec2(0.0, 2.5), uSize * 0.5, uRaio);
  vec4 cor = vec4(0.0, 0.0, 0.0, uSombra * (1.0 - smoothstep(-1.0, 5.0, ds)));
  // outer line (ring outside the body)
  float fo = uCorFora.a * (1.0 - smoothstep(uFora - aa, uFora + aa, d)) * smoothstep(-aa, aa, d);
  cor = vec4(mix(cor.rgb, uCorFora.rgb, fo), max(cor.a, fo));
  // inner line (ring inside the body)
  float fl = uCorLinha.a * (1.0 - smoothstep(-aa, aa, d)) * smoothstep(-uLinha - aa, -uLinha + aa, d);
  cor = vec4(mix(cor.rgb, uCorLinha.rgb, fl), max(cor.a, fl));
  // fill
  float fi = 1.0 - smoothstep(-uLinha - aa, -uLinha + aa, d);
  float f = (q.x + uSize.x * 0.5) / uSize.x;
  float yn = clamp(p.y / max(uSize.y * 0.5 - uLinha, 1.0), -1.0, 1.0);
  float faa = fwidth(f) * 0.75;
  vec3 c = mix(mix(uA, uB, f), uVerm * (1.0 + 0.18 * uPisca), smoothstep(uFill - faa, uFill + faa, f));
  float cheia = 1.0 - smoothstep(uPrev - faa, uPrev + faa, f);
  c = mix(uVazio, c, cheia);
  float tubo = mix(0.85 + 0.25 * smoothstep(0.9, -0.6, yn),
                   0.97 + 0.18 * pow(abs(yn), 2.0) + 0.1 * smoothstep(0.15, 0.6, yn) * (1.0 - smoothstep(0.6, 0.95, yn)), cheia);
  c *= mix(1.0, tubo, uTubo);
  gl_FragColor = vec4(mix(cor.rgb, c, fi), mix(cor.a, uAlfa, fi));
}`;

// Square portrait: one frame of the 8-frame face sheet over a backdrop gradient, rounded corners, dark rim and a bevel
// (light top-left, shade bottom-right) with an inner vignette.
const FRAG_RETRATO = /* glsl */ `
uniform sampler2D uMapa; uniform float uQuadro; uniform vec2 uSize; uniform float uPad;
uniform vec3 uFundoA, uFundoB; uniform float uEspelho;
varying vec2 vUv;
float sdBox(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 full = uSize + 2.0 * uPad;
  vec2 p = (vUv - 0.5) * full;
  float d = sdBox(p, uSize * 0.5, 8.0);
  float aa = max(fwidth(d), 0.001) * 0.75;
  float ds = sdBox(p + vec2(-2.0, 4.0), uSize * 0.5, 8.0);
  vec4 cor = vec4(0.0, 0.0, 0.0, 0.55 * (1.0 - smoothstep(-2.0, 8.0, ds)));
  vec2 t = p / uSize + 0.5; // 0..1 inside the box
  float k = uSize.x / uSize.y;
  float u = 0.5 + (t.x - 0.5) * k * 1.06;
  if (uEspelho > 0.5) u = 1.0 - u;
  vec2 st = vec2((uQuadro + clamp(u, 0.0, 1.0)) / 8.0, clamp(t.y * 1.06 - 0.02, 0.0, 1.0));
  vec4 rosto = texture2D(uMapa, st);
  vec3 c = mix(uFundoB, uFundoA, t.y);
  c = mix(c, rosto.rgb, rosto.a);
  float dentro = -d;
  c *= 0.78 + 0.22 * smoothstep(0.0, 14.0, dentro);
  c += 0.10 * (1.0 - smoothstep(0.0, 4.0, dentro)) * clamp(t.y - t.x + 0.4, 0.0, 1.0);
  float fi = 1.0 - smoothstep(-2.0 - aa, -2.0 + aa, d);
  float rim = 1.0 - smoothstep(-aa, aa, d);
  cor = vec4(mix(cor.rgb, vec3(0.1, 0.075, 0.06), rim), max(cor.a, rim));
  cor = vec4(mix(cor.rgb, c, fi), max(cor.a, fi));
  gl_FragColor = cor;
}`;

// ---------------------------------------------------------------- building blocks
type Pt = [number, number];
const forma = (pts: Pt[], furo?: Pt[]) => {
  const s = new Shape(pts.map(([x, y]) => new Vector2(x, -y)));
  if (furo) s.holes.push(new Shape(furo.map(([x, y]) => new Vector2(x, -y))));
  return new ShapeGeometry(s);
};

interface Vidro {
  box: [number, number, number, number];
  cores: [string, string, string, string];
  alfas: [number, number, number, number];
  corte?: [number, number, number, number];
  brilho?: number;
  sobre?: boolean;
}

export interface Hud {
  grupo: Group;
  /** Re-points the glass at the blurred scene and the viewport size in device pixels. */
  fundo: (blur: Texture, w: number, h: number) => void;
  /** HP of the target now (number shown and green+red), red preview on/off, blink 0..1, portrait frames. */
  estado: (hp: number, previa: number, pisca: number, quadroHeroi: number, quadroAlvo: number) => void;
  destruir: () => void;
}

export function criarHud(rostoHeroi: Texture, rostoAlvo: Texture): Hud {
  const grupo = new Group();
  const vidros: ShaderMaterial[] = [];
  const descartar: { dispose: () => void }[] = [];
  let ordem = 0;
  const pôr = (geo: ShapeGeometry | PlaneGeometry, mat: ShaderMaterial) => {
    mat.transparent = true;
    mat.depthTest = false;
    mat.depthWrite = false;
    const m = new Mesh(geo, mat);
    m.renderOrder = ordem++;
    m.frustumCulled = false;
    grupo.add(m);
    descartar.push(geo, mat);
    return m;
  };

  const vidro = (geo: ShapeGeometry, v: Vidro) => {
    const mat = new ShaderMaterial({
      vertexShader: VERT_FORMA,
      fragmentShader: FRAG_VIDRO,
      uniforms: {
        uBlur: { value: null },
        uRes: { value: new Vector2(1, 1) },
        uBox: { value: new Vector4(...v.box) },
        uC00: { value: rgb(v.cores[0]) },
        uC10: { value: rgb(v.cores[1]) },
        uC01: { value: rgb(v.cores[2]) },
        uC11: { value: rgb(v.cores[3]) },
        uA: { value: new Vector4(...v.alfas) },
        uCorte: { value: new Vector4(...(v.corte ?? [1e5, 1e5, 1, 0])) },
        uBrilho: { value: v.brilho ?? 0 },
        uSobre: { value: v.sobre ? 1 : 0 },
      },
    });
    vidros.push(mat);
    return pôr(geo, mat);
  };

  const aro = (geo: ShapeGeometry, x: [number, number], ca: string, cb: string, alfa: [number, number]) =>
    pôr(
      geo,
      new ShaderMaterial({
        vertexShader: VERT_FORMA,
        fragmentShader: FRAG_ARO,
        uniforms: {
          uX: { value: new Vector2(...x) },
          uCa: { value: rgb(ca) },
          uCb: { value: rgb(cb) },
          uAlfa: { value: new Vector2(...alfa) },
        },
      }),
    );

  interface Caixa {
    x: number; // centre, reference px
    y: number;
    w: number;
    h: number;
    raio: number;
    inc?: number;
    linha?: number;
    corLinha?: [string, number];
    fora?: number;
    corFora?: [string, number];
    a: string;
    b?: string;
    verm?: string;
    vazio?: string;
    fill?: number;
    prev?: number;
    tubo?: number;
    alfa?: number;
    sombra?: number;
  }
  const caixa = (c: Caixa) => {
    const pad = 8 + Math.abs(c.inc ?? 0) * c.h;
    const mat = new ShaderMaterial({
      vertexShader: VERT_PLANO,
      fragmentShader: FRAG_CAIXA,
      uniforms: {
        uSize: { value: new Vector2(c.w, c.h) },
        uPad: { value: pad },
        uRaio: { value: c.raio },
        uInc: { value: c.inc ?? 0 },
        uLinha: { value: c.linha ?? 1.5 },
        uFora: { value: c.fora ?? 0 },
        uCorLinha: { value: new Vector4(...rgb(c.corLinha?.[0] ?? '#05080f').toArray(), c.corLinha?.[1] ?? 1) },
        uCorFora: { value: new Vector4(...rgb(c.corFora?.[0] ?? '#000000').toArray(), c.corFora?.[1] ?? 0) },
        uA: { value: rgb(c.a) },
        uB: { value: rgb(c.b ?? c.a) },
        uVerm: { value: rgb(c.verm ?? '#fd573f') },
        uVazio: { value: rgb(c.vazio ?? '#2a1d1c') },
        uFill: { value: c.fill ?? 1 },
        uPrev: { value: c.prev ?? c.fill ?? 1 },
        uPisca: { value: 0 },
        uTubo: { value: c.tubo ?? 1 },
        uAlfa: { value: c.alfa ?? 1 },
        uSombra: { value: c.sombra ?? 0.35 },
      },
    });
    const m = pôr(new PlaneGeometry(1, 1), mat);
    m.scale.set(c.w + 2 * pad, c.h + 2 * pad, 1);
    m.position.set(c.x, -c.y, 0);
    return mat;
  };

  const retrato = (x0: number, y0: number, x1: number, y1: number, mapa: Texture, fundoA: string, fundoB: string) => {
    const pad = 10;
    const w = x1 - x0;
    const h = y1 - y0;
    mapa.magFilter = NearestFilter;
    const mat = new ShaderMaterial({
      vertexShader: VERT_PLANO,
      fragmentShader: FRAG_RETRATO,
      uniforms: {
        uMapa: { value: mapa },
        uQuadro: { value: 0 },
        uSize: { value: new Vector2(w, h) },
        uPad: { value: pad },
        uFundoA: { value: rgb(fundoA) },
        uFundoB: { value: rgb(fundoB) },
        uEspelho: { value: 0 },
      },
    });
    const m = pôr(new PlaneGeometry(1, 1), mat);
    m.scale.set(w + 2 * pad, h + 2 * pad, 1);
    m.position.set((x0 + x1) / 2, -(y0 + y1) / 2, 0);
    return mat;
  };

  // ---- ally panel (navy glass): solid on the left, see-through past a diagonal that leans right towards the bottom
  vidro(forma([[250, 812], [800, 812], [800, 1008], [250, 1008]]), {
    box: [250, 812, 800, 1008],
    cores: ['#122352', '#1a2c5e', '#1f3a6b', '#1c3466'],
    alfas: [0.97, 0.9, 0.98, 0.95],
    corte: [470, 760, 34, 0.3],
    brilho: 0.025,
  });
  // class row band of the ally (dark, almost opaque)
  vidro(forma([[250, 977], [790, 977], [790, 1008], [250, 1008]]), {
    box: [250, 977, 790, 1008],
    cores: ['#141c2f', '#17181f', '#121828', '#131419'],
    alfas: [0.94, 0.86, 0.96, 0.9],
  });

  // ---- enemy panel (wine glass): dark next to the centre block, warmer and lighter towards the portrait and the bottom
  vidro(forma([[1080, 818], [1665, 818], [1665, 1008], [1080, 1008]]), {
    box: [1080, 818, 1665, 1008],
    cores: ['#1f0f0c', '#6a4141', '#2c1a17', '#7a514b'],
    alfas: [0.97, 0.9, 0.97, 0.97],
    brilho: 0.02,
  });
  vidro(forma([[1080, 977], [1665, 977], [1665, 1008], [1080, 1008]]), {
    box: [1080, 977, 1665, 1008],
    cores: ['#232120', '#3a2c2b', '#1e1b1a', '#382a29'],
    alfas: [0.9, 0.9, 0.93, 0.93],
  });
  // hairline at the bottom of both panels
  aro(forma([[250, 1007], [1665, 1007], [1665, 1009.5], [250, 1009.5]]), [250, 1665], '#06070c', '#0c0909', [0.9, 0.9]);

  // ---- centre block: pentagon pointing right, dark smoked glass that clears up on its left side
  const PENT: Pt[] = [[768, 807], [1063, 807], [1127, 918], [1068, 1020], [768, 1020]];
  const PENT_IN: Pt[] = [[768, 809.5], [1061.6, 809.5], [1124.1, 918], [1066.6, 1017.5], [768, 1017.5]];
  const PENT_OUT: Pt[] = [[768, 805], [1064.2, 805], [1129.4, 918], [1069.2, 1022], [768, 1022]];
  vidro(forma(PENT), {
    box: [768, 807, 1127, 1020],
    cores: ['#1c1c18', '#2a2a24', '#141412', '#181816'],
    alfas: [0.8, 0.99, 0.85, 0.99],
  });
  // top sheen of the pentagon (the lighter band right under the rim)
  vidro(forma([[800, 809], [1062, 809], [1078, 836], [800, 836]]), {
    box: [800, 809, 1078, 836],
    cores: ['#4a493d', '#46463a', '#2c2b25', '#2c2b25'],
    alfas: [0.35, 0.8, 0.0, 0.0],
    sobre: true,
  });
  aro(forma(PENT_OUT, PENT), [770, 1100], '#0a0a0a', '#0e0e0e', [0.0, 0.8]);
  aro(forma(PENT, PENT_IN), [740, 1000], '#3a3632', '#aaa9a4', [0.0, 1.0]);

  // ---- bars. Slant: both ends lean like "\" (7 px over the 19 px height).
  const INC = 0.37;
  // ally
  caixa({ x: 396, y: 909.5, w: 228, h: 19, raio: 4, inc: INC, linha: 1.6, corLinha: ['#03081a', 1], a: '#5a7e12', b: '#9ac546' });
  caixa({ x: 645, y: 909.5, w: 226, h: 19, raio: 4, inc: INC, linha: 1.6, corLinha: ['#22170f', 1], a: '#b34a49', b: '#c8a46a' });
  caixa({ x: 391, y: 945.5, w: 133, h: 14, raio: 7, linha: 1.6, corLinha: ['#2a2208', 1], a: '#8a6810', b: '#c29414' });
  caixa({ x: 645, y: 948, w: 234, h: 36, raio: 5, linha: 1.2, corLinha: ['#2b3449', 1], a: '#060b1b', alfa: 0.75, tubo: 0, sombra: 0 });
  // enemy: HP with a green rim and the red damage stretch, CT with a gold rim, partly empty
  const hpAlvo = caixa({
    x: 1266, y: 909.5, w: 232, h: 19, raio: 4, inc: INC, linha: 2.2, corLinha: ['#5b7c12', 1], fora: 1.2, corFora: ['#120806', 1],
    a: '#5c8116', b: '#6a9418', verm: '#fd573f', vazio: '#372221', fill: 18 / 82, prev: 54 / 82,
  });
  caixa({ x: 1517, y: 909.5, w: 228, h: 19, raio: 4, inc: INC, linha: 1.6, corLinha: ['#22170f', 1], a: '#b04a4c', b: '#c9a66c' });
  caixa({
    x: 1264, y: 945.5, w: 134, h: 14, raio: 7, linha: 2, corLinha: ['#b08a1c', 1], fora: 1, corFora: ['#1a0e0b', 1],
    a: '#836310', b: '#a07c14', vazio: '#2c1f21', fill: 0.6, prev: 0.6,
  });
  caixa({ x: 1519, y: 948, w: 234, h: 36, raio: 5, linha: 1.2, corLinha: ['#5a403c', 1], a: '#2a1513', alfa: 0.55, tubo: 0, sombra: 0 });

  // ---- portraits
  const rHeroi = retrato(100, 816, 262, 1012, rostoHeroi, '#c9d4cf', '#7d9aa0');
  const rAlvo = retrato(1659, 816, 1820, 1012, rostoAlvo, '#d29a8a', '#b25f5a');
  rAlvo.uniforms.uEspelho!.value = 1;

  // ---- text and small icons: one canvas texture over the bar (drawn once, twice the reference resolution)
  const TX0 = 50;
  const TY0 = 796;
  const TW = 1800;
  const TH = 236;
  const K = 2;
  const tela = document.createElement('canvas');
  tela.width = TW * K;
  tela.height = TH * K;
  const g = tela.getContext('2d')!;
  g.scale(K, K);
  g.translate(-TX0, -TY0);
  desenharTextos(g);
  const texTexto = new CanvasTexture(tela);
  texTexto.minFilter = LinearMipmapLinearFilter;
  texTexto.anisotropy = 4;
  const matTexto = (mapa: Texture) =>
    new ShaderMaterial({
      vertexShader: VERT_PLANO,
      fragmentShader: 'uniform sampler2D uMapa; varying vec2 vUv; void main(){ gl_FragColor = texture2D(uMapa, vUv); }',
      uniforms: { uMapa: { value: mapa } },
      premultipliedAlpha: false,
    });
  const mt = pôr(new PlaneGeometry(1, 1), matTexto(texTexto));
  mt.scale.set(TW, TH, 1);
  mt.position.set(TX0 + TW / 2, -(TY0 + TH / 2), 0);

  // the target's HP number changes while the bar drains: its own small canvas
  const NX0 = 1270;
  const NY0 = 856;
  const NW = 112;
  const NH = 46;
  const telaHp = document.createElement('canvas');
  telaHp.width = NW * K;
  telaHp.height = NH * K;
  const gh = telaHp.getContext('2d')!;
  const texHp = new CanvasTexture(telaHp);
  texHp.minFilter = LinearMipmapLinearFilter;
  const mh = pôr(new PlaneGeometry(1, 1), matTexto(texHp));
  mh.scale.set(NW, NH, 1);
  mh.position.set(NX0 + NW / 2, -(NY0 + NH / 2), 0);
  let hpMostrado = -1;
  const desenharHp = (hp: number) => {
    gh.setTransform(K, 0, 0, K, -NX0 * K, -NY0 * K);
    gh.clearRect(NX0, NY0, NW, NH);
    texto(gh, `${hp}/82`, 1373, 889, `33px ${SERIF}`, CREME, 'right');
    texHp.needsUpdate = true;
  };

  descartar.push(texTexto, texHp);
  return {
    grupo,
    fundo(blur, w, h) {
      for (const m of vidros) {
        m.uniforms.uBlur!.value = blur;
        (m.uniforms.uRes!.value as Vector2).set(w, h);
      }
    },
    estado(hp, previa, pisca, qh, qa) {
      const n = Math.round(hp);
      if (n !== hpMostrado) desenharHp((hpMostrado = n));
      const u = hpAlvo.uniforms;
      u.uFill!.value = Math.max(0, hp - previa) / 82;
      u.uPrev!.value = hp / 82;
      u.uPisca!.value = pisca;
      rHeroi.uniforms.uQuadro!.value = qh;
      rAlvo.uniforms.uQuadro!.value = qa;
    },
    destruir() {
      for (const d of descartar) d.dispose();
    },
  };
}

// ---------------------------------------------------------------- 2D drawing (text, icons, badges)
function texto(
  g: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  fonte: string,
  cor: string | CanvasGradient,
  alinhar: CanvasTextAlign = 'left',
  sombra = true,
  largura = 1, // horizontal squeeze: the game's faces are narrower than Georgia / Segoe UI
  espaco = 0,
) {
  g.font = fonte;
  g.textAlign = alinhar;
  g.textBaseline = 'alphabetic';
  g.fillStyle = cor;
  if (sombra) {
    g.shadowColor = 'rgba(0,0,0,0.75)';
    g.shadowBlur = 3;
    g.shadowOffsetX = 0.5;
    g.shadowOffsetY = 1.5;
  }
  g.letterSpacing = `${espaco}px`;
  g.save();
  g.translate(x, y);
  g.scale(largura, 1);
  g.fillText(s, 0, 0);
  g.restore();
  g.letterSpacing = '0px';
  g.shadowColor = 'transparent';
}

function traco(g: CanvasRenderingContext2D, x: number, y0: number, y1: number, cor: string) {
  g.fillStyle = cor;
  g.fillRect(x, y0, 2.5, y1 - y0);
}

function selo(g: CanvasRenderingContext2D, x: number, y: number, a: string, b: string, aro: string, simbolo: string) {
  g.save();
  g.shadowColor = 'rgba(0,0,0,0.6)';
  g.shadowBlur = 4;
  g.shadowOffsetY = 1.5;
  g.beginPath();
  g.arc(x, y, 21, 0, Math.PI * 2);
  g.fillStyle = '#0b0b0b';
  g.fill();
  g.shadowColor = 'transparent';
  const gr = g.createRadialGradient(x - 6, y - 8, 2, x, y, 20);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  g.beginPath();
  g.arc(x, y, 19, 0, Math.PI * 2);
  g.fillStyle = gr;
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = aro;
  g.stroke();
  g.font = `25px "Segoe UI Symbol", "Noto Sans Symbols", ${SANS}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#eef4f0';
  g.fillText(simbolo, x, y + 1);
  g.restore();
}

function desenharTextos(g: CanvasRenderingContext2D) {
  const lado = (o: {
    dx: number;
    nome: string;
    nv: string;
    exp: string;
    hp: string | null;
    ct: string;
    brav: string;
    fe: string;
    classe: string;
    lv: string;
    prox: string;
    jp: string;
    classeX: number;
    lvX: number;
    proxX: number;
    proxR: number;
    jpX: number;
    jpR: number;
  }) => {
    const d = o.dx;
    texto(g, o.nome, 280 + d, 846, `bold 29px ${SERIF}`, CREME, 'left', true, 0.88);
    texto(g, `Lv.${o.nv}`, 609 + d, 850, `600 31px ${SANS}`, CREME, 'left', true, 1, 0.5);
    traco(g, 679 + d, 834, 849, '#3e78d8');
    texto(g, 'EXP', 684 + d, 849, `19px ${SANS}`, '#c9c7bb');
    texto(g, o.exp, 755 + d, 849, `600 28px ${SANS}`, CREME, 'right');
    texto(g, 'HP', 280 + d, 888, `28px ${SERIF}`, CREME);
    if (o.hp) texto(g, o.hp, 502 + d, 889, `33px ${SERIF}`, CREME, 'right');
    texto(g, 'MP', 534 + d, 888, `27px ${SERIF}`, CREME);
    texto(g, '30/30', 755 + d, 889, `33px ${SERIF}`, CREME, 'right');
    texto(g, 'CT', 282 + d, 950, `27px ${SERIF}`, CREME);
    texto(g, o.ct, (d ? 1374 : 508), 949, `bold ${d ? 27 : 25}px ${SERIF}`, CREME, 'right');
    texto(g, 'Bravery', 540 + d, 955, `20px ${SANS}`, CINZA);
    texto(g, o.brav, 637 + d, 955, `600 24px ${SANS}`, CREME, 'right');
    texto(g, 'Faith', 654 + d, 955, `20px ${SANS}`, CINZA);
    texto(g, o.fe, 742 + d, 955, `600 24px ${SANS}`, CREME, 'right');
    texto(g, o.classe, o.classeX, 1001, `21px ${SERIF}`, CREME, 'left', true, 0.88);
    texto(g, `Lv. ${o.lv}`, o.lvX, 1000, `600 24px ${SANS}`, CREME);
    texto(g, 'Next', o.proxX, 1000, `21px ${SANS}`, CINZA);
    texto(g, o.prox, o.proxR, 1000, `600 24px ${SANS}`, CREME, 'right', true, 1, 0.5);
    traco(g, o.jpX, 986, 1001, '#3fa04a');
    texto(g, 'JP', o.jpX + 6, 1000, `21px ${SANS}`, CINZA);
    texto(g, o.jp, o.jpR, 1000, `600 25px ${SANS}`, CREME, 'right', true, 1, 0.5);
  };
  lado({ dx: 0, nome: 'Ramza', nv: '8', exp: '77', hp: '84/84', ct: '100', brav: '72', fe: '70', classe: 'Squire', lv: '6', prox: '600', jp: '1368', classeX: 319, lvX: 498, proxX: 555, proxR: 649, jpX: 672, jpR: 760 });
  lado({ dx: 874, nome: 'Thomas', nv: '5', exp: '80', hp: null, ct: '60', brav: '72', fe: '71', classe: 'Knight', lv: '1', prox: '89', jp: '111', classeX: 1194, lvX: 1372, proxX: 1430, proxR: 1510, jpX: 1546, jpR: 1617 });

  // class icons: Squire diamond with a figure, Knight sword in a square
  g.save();
  g.translate(296, 993);
  g.rotate(Math.PI / 4);
  g.fillStyle = 'rgba(40,36,30,0.85)';
  g.strokeStyle = '#d8cfb4';
  g.lineWidth = 1.5;
  g.fillRect(-10, -10, 20, 20);
  g.strokeRect(-10, -10, 20, 20);
  g.restore();
  g.strokeStyle = '#d8cfb4';
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(296, 988, 3.2, 0, Math.PI * 2);
  g.moveTo(290, 999);
  g.quadraticCurveTo(296, 990, 302, 999);
  g.stroke();
  g.fillStyle = 'rgba(60,52,44,0.9)';
  g.strokeStyle = '#cfc6ae';
  g.lineWidth = 1.5;
  g.beginPath();
  g.roundRect(1155, 979, 30, 28, 3);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(1160, 984);
  g.lineTo(1177, 1001);
  g.moveTo(1174, 1004);
  g.lineTo(1180, 998);
  g.moveTo(1178, 1003);
  g.lineTo(1181, 1006);
  g.stroke();

  // centre: hit chance icons, 100 %, the big 36 and "Damage"
  g.strokeStyle = CREME;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(815, 841, 9.5, 0, Math.PI * 2);
  g.moveTo(815 + 4, 841);
  g.arc(815, 841, 4, 0, Math.PI * 2);
  for (const [a, b, c, d] of [[803, 841, 809, 841], [821, 841, 827, 841], [815, 829, 815, 835], [815, 847, 815, 853]] as const) {
    g.moveTo(a, b);
    g.lineTo(c, d);
  }
  g.stroke();
  texto(g, '100%', 844, 851, `600 29px ${SANS}`, CREME, 'left', true, 1, 1.5);
  const estrela = (x: number, y: number, r: number) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
    }
    g.closePath();
    g.fillStyle = '#e8dcae';
    g.fill();
  };
  g.strokeStyle = '#cfc6a6';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(958, 835);
  g.lineTo(950, 848);
  g.lineTo(966, 848);
  g.closePath();
  g.stroke();
  estrela(958, 834, 7);
  estrela(949, 848, 7);
  estrela(967, 848, 7);
  texto(g, '100%', 984, 851, `600 29px ${SANS}`, CREME, 'left', true, 1, 1.5);
  texto(g, '36', 932, 927, `90px ${SERIF}`, CREME, 'center', true, 0.8);
  texto(g, 'Damage', 932, 982, `bold 26px ${SERIF}`, CREME, 'center', true, 0.8);

  // turn number of the acting unit, zodiac badges and the "Enemy" tag
  const azul = g.createLinearGradient(0, 826, 0, 848);
  azul.addColorStop(0, '#f2fbff');
  azul.addColorStop(1, '#6fb6ef');
  g.lineWidth = 3;
  g.strokeStyle = '#173a66';
  g.font = `bold 28px ${SANS}`;
  g.textAlign = 'center';
  g.strokeText('1', 76, 848);
  texto(g, '1', 76, 848, `bold 28px ${SANS}`, azul, 'center', false);
  selo(g, 112, 829, '#5a9a84', '#2c5e4f', '#9fc9bb', '♑︎');
  selo(g, 1806, 829, '#b07abb', '#7a4685', '#e2c6e8', '♊︎');
  const rosa = g.createLinearGradient(0, 982, 0, 1004);
  rosa.addColorStop(0, '#fff8f8');
  rosa.addColorStop(0.5, '#f8c4cc');
  rosa.addColorStop(1, '#ee7f8e');
  g.font = `600 25px ${SANS}`;
  g.textAlign = 'center';
  g.lineJoin = 'round';
  g.lineWidth = 3;
  g.strokeStyle = '#7d2433';
  g.strokeText('Enemy', 1754, 1003);
  texto(g, 'Enemy', 1754, 1003, `600 25px ${SANS}`, rosa, 'center', false);
}
