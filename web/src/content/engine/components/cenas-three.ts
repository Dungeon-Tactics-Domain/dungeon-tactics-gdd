// The four live scenes on the Three.js side, built to the scene contract (same camera, sun, colours and parameters as
// the Godot web export). Loaded on demand by CenaMotores, so three, Rapier and the pieces download only on "Rodar".
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { CenaHandle } from '@/components/content/Cena3d';
import { criarMedidor, gerarCidade, H, N_TEX, NIVEIS } from './nucleo';
import type { NomeCena, Params } from './parametros';

export interface Segundo {
  motor: 'threejs';
  cena: NomeCena;
  s: number;
  fps: number;
  params: Params;
}
export interface CenaThree extends CenaHandle {
  assinatura?: number;
  /** how the scene is built, in one sentence (shown next to the live counter) */
  tecnica: string;
}

const srgb = (r: number, g: number, b: number) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const GRAUS = THREE.MathUtils.degToRad;
const RENDERERS = new WeakMap<HTMLCanvasElement, THREE.WebGLRenderer>();
const LADO: Record<NomeCena, number> = { fisica: 16, particulas: 16, sombras: 64, nevoa: 32 };

interface Montagem {
  atualizar?: (dt: number, tempo: number) => void;
  destruir?: () => void;
  tecnica: string;
  assinatura?: number;
  /** pixels per world unit changed (particle size) */
  aoEscala?: (pxPorUnidade: number) => void;
}

export async function criarCena(
  cena: NomeCena,
  p: Params,
  avisos: string[],
  canvas: HTMLCanvasElement,
  aoSegundo: (s: Segundo) => void,
): Promise<CenaThree> {
  // one renderer per canvas: Cena3d reuses its canvas between scenes (and React's dev double mount builds two at once);
  // two renderers on one GL context break each other's state (black frames). It goes away with the canvas on "Parar".
  const renderer =
    RENDERERS.get(canvas) ?? new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  RENDERERS.set(canvas, renderer);
  renderer.setPixelRatio(1);
  renderer.shadowMap.needsUpdate = true;
  renderer.shadowMap.enabled = p.sombras === 1;
  renderer.shadowMap.type = THREE.PCFShadowMap; // r186: PCF is the soft default (PCFSoft is deprecated)
  const scene = new THREE.Scene();
  scene.background = srgb(0.6, 0.75, 0.9);
  scene.add(new THREE.AmbientLight(srgb(0.6, 0.75, 0.9), Math.PI)); // Godot ambient from the sky colour, energy 1

  // fixed isometric orthographic camera (contract, section 1)
  const lado = LADO[cena];
  const dist = lado + 60;
  const altura = lado * 1.05 + 4;
  const cam = new THREE.OrthographicCamera(-1, 1, altura / 2, -altura / 2, 0.05, dist * 2 + lado * 2);
  const alvo = new THREE.Vector3(0, 1.5, 0);
  cam.position
    .copy(alvo)
    .add(new THREE.Vector3(Math.sin(GRAUS(45)), 0.9, Math.cos(GRAUS(45))).normalize().multiplyScalar(dist));
  cam.lookAt(alvo);

  const sol = new THREE.DirectionalLight(0xffffff, Math.PI * (cena === 'nevoa' ? 0.3 : 1));
  sol.position.copy(
    new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(GRAUS(-50), GRAUS(30), 0, 'YXZ')).multiplyScalar(lado * 2),
  );
  scene.add(sol);
  if (p.sombras === 1) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(4096, 4096);
    Object.assign(sol.shadow.camera, {
      left: -lado * 0.8,
      right: lado * 0.8,
      top: lado * 0.8,
      bottom: -lado * 0.8,
      near: 0.5,
      far: lado * 4 + 20,
    });
  }

  const m: Montagem =
    cena === 'fisica'
      ? await fisica(scene, p)
      : cena === 'particulas'
        ? particulas(scene, p)
        : cena === 'sombras'
          ? await cidade(scene, p)
          : nevoa(scene, p, cam);
  if (p.sombras === 1)
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh && !o.userData.semSombra) o.castShadow = o.receiveShadow = true;
    });

  // per-second counter, log line and window.__fps (contract, section 1); window.__bench in measurement mode
  const w = window as unknown as Record<string, unknown>;
  const medidor = p.segundos > 0 ? criarMedidor(p.segundos) : null;
  const bench: Record<string, unknown> = {
    motor: 'threejs',
    renderizador: `webgl2 (three r${THREE.REVISION})`,
    cena,
    params: p,
    avisos,
    assinatura: m.assinatura,
  };
  if (medidor) w.__bench = bench;
  let anterior = -1;
  let tempo = 0;
  let inicio = 0;
  let quadros = 0;
  let marca = 0;

  return {
    tecnica: m.tecnica,
    assinatura: m.assinatura,
    desenhar() {
      const agora = performance.now();
      const dt = anterior < 0 ? 0 : (agora - anterior) / 1000;
      anterior = agora;
      tempo += dt;
      m.atualizar?.(dt, tempo);
      renderer.render(scene, cam);
      if (inicio === 0) {
        inicio = marca = agora;
        bench.msPrimeiroQuadro = +agora.toFixed(1);
        return;
      }
      if (medidor && !bench.pronto && medidor.quadro(dt * 1000))
        Object.assign(bench, medidor.resultado(), { pronto: true });
      quadros++;
      if (agora - marca >= 1000) {
        const s: Segundo = { motor: 'threejs', cena, s: Math.round((agora - inicio) / 1000), fps: quadros, params: p };
        w.__fps = { motor: s.motor, cena, s: s.s, fps: s.fps };
        console.log(JSON.stringify(s));
        aoSegundo(s);
        quadros = 0;
        marca = agora;
      }
    },
    redimensionar(largura, alturaPx) {
      renderer.setSize(largura, alturaPx, false);
      const a = largura / Math.max(1, alturaPx);
      cam.left = (-altura / 2) * a;
      cam.right = (altura / 2) * a;
      cam.updateProjectionMatrix();
      m.aoEscala?.(alturaPx / altura);
    },
    destruir() {
      m.destruir?.();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
          o.geometry.dispose();
          for (const mat of [o.material].flat()) mat.dispose();
        }
      });
      if (w.__fps) delete w.__fps;
    },
  };
}

// ---------- física: Rapier (WASM, 1 thread), the bench's pen on the floor (contract, section 3) ----------
// one init for the page: two parallel init() calls (React's dev double mount) re-instantiate the WASM under a live world
let rapierPronto: Promise<typeof import('@dimforge/rapier3d-compat').default> | undefined;
const carregarRapier = () =>
  (rapierPronto ??= import('@dimforge/rapier3d-compat').then(async ({ default: R }) => {
    await R.init();
    return R;
  }));

async function fisica(scene: THREE.Scene, p: Params): Promise<Montagem> {
  const RAPIER = await carregarRapier();
  const mundo = new RAPIER.World({ x: 0, y: -9.8, z: 0 });
  mundo.timestep = 1 / 60;
  const solidos: [[number, number, number], [number, number, number]][] = [
    [
      [13, 0.5, 13],
      [0, -0.25, 0],
    ],
    [
      [0.5, 16, 13],
      [6.25, 8, 0],
    ],
    [
      [0.5, 16, 13],
      [-6.25, 8, 0],
    ],
    [
      [13, 16, 0.5],
      [0, 8, 6.25],
    ],
    [
      [13, 16, 0.5],
      [0, 8, -6.25],
    ],
  ];
  for (const [t, c] of solidos)
    mundo.createCollider(RAPIER.ColliderDesc.cuboid(t[0] / 2, t[1] / 2, t[2] / 2).setTranslation(c[0], c[1], c[2]));
  const piso = new THREE.Mesh(
    new THREE.BoxGeometry(13, 0.5, 13),
    new THREE.MeshStandardMaterial({ color: srgb(0.55, 0.55, 0.55), roughness: 1 }),
  );
  piso.position.set(0, -0.25, 0);
  scene.add(piso);
  const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const mat = new THREE.MeshStandardMaterial({ color: srgb(0.85, 0.45, 0.2), roughness: 1 });
  const corpos: { corpo: InstanceType<typeof RAPIER.RigidBody>; malha: THREE.Mesh }[] = [];
  for (let i = 0; i < p.qtd; i++) {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(i * 0.11, i * 0.37, 0, 'YXZ'));
    const corpo = mundo.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(
          -5.625 + (i % 16) * 0.75,
          1 + Math.floor(i / 256) * 0.75,
          -5.625 + (Math.floor(i / 16) % 16) * 0.75,
        )
        .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w })
        .setCanSleep(false),
    );
    mundo.createCollider(RAPIER.ColliderDesc.cuboid(0.25, 0.25, 0.25).setDensity(8).setFriction(1), corpo); // mass 1
    const malha = new THREE.Mesh(geo, mat);
    scene.add(malha);
    corpos.push({ corpo, malha });
  }
  let acumulado = 0;
  return {
    tecnica: 'Rapier 0.21 (WebAssembly, 1 thread), passo fixo de 60 Hz, até 8 passos por quadro, uma malha por caixa.',
    atualizar(dt) {
      acumulado += dt;
      let passos = 0;
      while (acumulado >= 1 / 60 && passos < 8) {
        mundo.step();
        acumulado -= 1 / 60;
        passos++;
      }
      if (passos === 8) acumulado = 0;
      for (const { corpo, malha } of corpos) {
        malha.position.copy(corpo.translation());
        malha.quaternion.copy(corpo.rotation());
      }
    },
    destruir: () => mundo.free(),
  };
}

// ---------- partículas: stateless GPU particles in a vertex shader (contract, section 4) ----------
const PARTICULA_VS = /* glsl */ `
attribute vec4 aSorte;
attribute vec3 aOrigem;
uniform float uTempo, uVida, uCosAbre, uVelMin, uVelMax, uGrav, uPx;
uniform vec4 uIni, uFim;
varying vec4 vCor;
void main() {
  float idade = mod(uTempo + aSorte.w * uVida, uVida);
  float c = 1.0 - aSorte.x * (1.0 - uCosAbre);
  float s = sqrt(max(0.0, 1.0 - c * c));
  float fi = aSorte.y * 6.2831853;
  vec3 p = aOrigem + vec3(s * cos(fi), c, s * sin(fi)) * mix(uVelMin, uVelMax, aSorte.z) * idade
         + vec3(0.0, 0.5 * uGrav * idade * idade, 0.0);
  vCor = mix(uIni, uFim, idade / uVida);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPx;
}`;
const PARTICULA_FS = /* glsl */ `
varying vec4 vCor;
void main() {
  gl_FragColor = vCor;
  #include <colorspace_fragment>
}`;
const SISTEMAS = [
  // [share, life, spread °, speed min, max, gravity, emission radius, size, start RGBA, end RGBA, additive]
  {
    parte: 0.5,
    vida: 1,
    abre: 15,
    v: [1, 2],
    g: 1,
    raio: 0.3,
    tam: 0.4,
    ini: [1, 0.85, 0.3, 1],
    fim: [1, 0.3, 0.05, 0],
    soma: true,
    ordem: 1,
  },
  {
    parte: 0.3,
    vida: 3,
    abre: 25,
    v: [0.5, 1],
    g: 0.3,
    raio: 0.4,
    tam: 0.8,
    ini: [0.35, 0.35, 0.35, 0.6],
    fim: [0.6, 0.6, 0.6, 0],
    soma: false,
    ordem: 0,
  },
  {
    parte: 0.2,
    vida: 0.8,
    abre: 60,
    v: [3, 5],
    g: -9.8,
    raio: 0.1,
    tam: 0.08,
    ini: [1, 1, 0.6, 1],
    fim: [1, 0.5, 0.1, 0],
    soma: true,
    ordem: 2,
  },
] as const;

function particulas(scene: THREE.Scene, p: Params): Montagem {
  const chao = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.5, 16),
    new THREE.MeshStandardMaterial({ color: srgb(0.3, 0.3, 0.3), roughness: 1 }),
  );
  chao.position.y = -0.25;
  scene.add(chao);
  const porEmissor = Math.floor(p.qtd / 8);
  const cor = (c: readonly number[]) => {
    const l = srgb(c[0]!, c[1]!, c[2]!);
    return new THREE.Vector4(l.r, l.g, l.b, c[3]!);
  };
  const materiais: THREE.ShaderMaterial[] = [];
  let seed = 1;
  const r = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (const ex of [-4.5, -1.5, 1.5, 4.5])
    for (const ez of [-2, 2])
      for (const s of SISTEMAS) {
        const n = Math.floor(porEmissor * s.parte);
        if (n === 0) continue;
        const sorte = new Float32Array(n * 4);
        const origem = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          sorte.set([r(), r(), r(), i / n], i * 4); // uniform phase: steady emission over the life
          let x, y, z;
          do [x, y, z] = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1];
          while (x * x + y * y + z * z > 1);
          origem.set([ex + x * s.raio, 0.1 + y * s.raio, ez + z * s.raio], i * 3);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
        geo.setAttribute('aSorte', new THREE.BufferAttribute(sorte, 4));
        geo.setAttribute('aOrigem', new THREE.BufferAttribute(origem, 3));
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(ex, 3, ez), 8);
        const mat = new THREE.ShaderMaterial({
          vertexShader: PARTICULA_VS,
          fragmentShader: PARTICULA_FS,
          transparent: true,
          depthWrite: false,
          blending: s.soma ? THREE.AdditiveBlending : THREE.NormalBlending,
          uniforms: {
            uTempo: { value: 0 },
            uVida: { value: s.vida },
            uCosAbre: { value: Math.cos(GRAUS(s.abre)) },
            uVelMin: { value: s.v[0] },
            uVelMax: { value: s.v[1] },
            uGrav: { value: s.g },
            uPx: { value: 1 },
            uIni: { value: cor(s.ini) },
            uFim: { value: cor(s.fim) },
          },
        });
        mat.userData.tam = s.tam;
        materiais.push(mat);
        const pts = new THREE.Points(geo, mat);
        pts.userData.semSombra = true;
        pts.renderOrder = s.ordem; // contract: all smoke, then fire, then sparks (else smoke covers the fire)
        scene.add(pts);
      }
  return {
    tecnica:
      'Partículas sem estado num shader de vértice (posição = função do tempo, simulação na GPU), 24 sistemas, ordem fixa de desenho (fumaça, fogo, faíscas).',
    atualizar: (_dt, tempo) => {
      for (const m of materiais) m.uniforms.uTempo!.value = tempo;
    },
    aoEscala: (px) => {
      for (const m of materiais) m.uniforms.uPx!.value = Math.max(1, (m.userData.tam as number) * px);
    },
  };
}

// ---------- sombras: the bench's terraced city, map 64, 200 buildings, point lights (contract, section 5) ----------
const PECAS = [
  'building_market_red',
  'building_tavern_red',
  'building_blacksmith_red',
  'building_tower_A_red',
  'building_home_A_red',
  'building_well_red',
  'building_barracks_red',
];
const CORES_LUZ: [number, number, number][] = [
  [1, 0.6, 0.2],
  [0.2, 0.8, 1],
  [1, 0.3, 0.8],
  [1, 1, 0.4],
];

async function cidade(scene: THREE.Scene, p: Params): Promise<Montagem> {
  const c = gerarCidade({ mapa: 64, predios: 200, luzes: p.luzes, seed: p.seed });
  const { n, alt } = c;
  const xadrez = (cinza: number) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 512, 512);
    g.fillStyle = `rgb(${cinza},${cinza},${cinza})`;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2) g.fillRect(i * 64, j * 64, 64, 64);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const tex = [230, 204, 178, 153].map(xadrez);
  const corTerreno = (h: number) => {
    if (h === 0) return srgb(0.15, 0.4, 0.65);
    if (h === 1) return srgb(0.85, 0.78, 0.55);
    if (h === 9) return srgb(0.5, 0.5, 0.52);
    const t = h / 8;
    return srgb(0.35 + 0.15 * t, 0.6 - 0.05 * t, 0.3 + 0.05 * t);
  };
  const lotes = Array.from({ length: N_TEX }, () => [] as [THREE.Matrix4, THREE.Color][]);
  const semGiro = new THREE.Quaternion();
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const h = alt[y * n + x]!;
      const alto = Math.max(h * H, 0.1);
      const t = NIVEIS.indexOf(h) % N_TEX;
      const pos = new THREE.Vector3(x - n / 2, alto / 2, y - n / 2);
      if (p.otimizado === 1)
        lotes[t]!.push([new THREE.Matrix4().compose(pos, semGiro, new THREE.Vector3(1, alto, 1)), corTerreno(h)]);
      else {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(1, alto, 1),
          new THREE.MeshStandardMaterial({ color: corTerreno(h), map: tex[t]!, roughness: 1 }),
        );
        m.position.copy(pos);
        scene.add(m);
      }
    }
  const unit = new THREE.BoxGeometry(1, 1, 1);
  lotes.forEach((lote, t) => {
    if (!lote.length) return;
    const inst = new THREE.InstancedMesh(
      unit,
      new THREE.MeshStandardMaterial({ map: tex[t]!, roughness: 1 }),
      lote.length,
    );
    lote.forEach(([mx, cor], i) => {
      inst.setMatrixAt(i, mx);
      inst.setColorAt(i, cor);
    });
    scene.add(inst);
  });

  const loader = new GLTFLoader();
  const gltfs = await Promise.all(PECAS.map((nome) => loader.loadAsync(`/content/engine/pecas/${nome}.gltf`)));
  const modelos = gltfs.map((g, i) => {
    const tmpl = g.scene;
    tmpl.updateMatrixWorld(true);
    const caixa = new THREE.Box3().setFromObject(tmpl);
    const tam = caixa.getSize(new THREE.Vector3());
    const centro = caixa.getCenter(new THREE.Vector3());
    const s = (i === 5 ? 1.6 : 2.8) / Math.max(tam.x, tam.z);
    const malhas: THREE.Mesh[] = [];
    tmpl.traverse((o) => {
      if (o instanceof THREE.Mesh) malhas.push(o);
    });
    return {
      tmpl,
      s,
      desloc: new THREE.Vector3(centro.x, caixa.min.y, centro.z).multiplyScalar(s),
      malhas,
      lista: [] as THREE.Matrix4[],
    };
  });
  for (const [x, y, tipo] of c.predios) {
    const md = modelos[tipo]!;
    const pos = new THREE.Vector3(x - n / 2, alt[y * n + x]! * H, y - n / 2).sub(md.desloc);
    if (p.otimizado === 1)
      md.lista.push(new THREE.Matrix4().compose(pos, semGiro, new THREE.Vector3(md.s, md.s, md.s)));
    else {
      const o = md.tmpl.clone();
      o.position.copy(pos);
      o.scale.setScalar(md.s);
      scene.add(o);
    }
  }
  if (p.otimizado === 1)
    for (const md of modelos)
      for (const malha of md.malhas) {
        if (!md.lista.length) continue;
        const inst = new THREE.InstancedMesh(malha.geometry, malha.material, md.lista.length);
        md.lista.forEach((mx, i) => inst.setMatrixAt(i, mx.clone().multiply(malha.matrixWorld)));
        scene.add(inst);
      }
  c.luzes.forEach(([x, y], i) => {
    const luz = new THREE.PointLight(srgb(...CORES_LUZ[i % 4]!), 2 * Math.PI, 8, 1); // Godot energy 2, range 8
    luz.position.set(x - n / 2, alt[y * n + x]! * H + 2, y - n / 2);
    scene.add(luz);
  });
  return {
    tecnica: `Cidade da bancada (mapa 64, 200 prédios), ${p.otimizado ? 'instâncias (poucas chamadas de desenho)' : 'um objeto por peça'}, sombra PCF de 4096, luzes de ponto sem sombra.`,
    assinatura: c.assinatura,
    destruir: () => tex.forEach((t) => t.dispose()),
  };
}

// ---------- névoa: dark scene, spotlight, distance fog or a raymarched box (contract, section 6) ----------
const NEVOA_VS = /* glsl */ `
varying vec3 vMundo;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vMundo = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const nevoaFs = (passos: number) => /* glsl */ `
uniform vec3 uMin, uMax, uDir, uLuzPos, uLuzCor;
varying vec3 vMundo;
void main() {
  vec3 rd = normalize(uDir);
  vec3 ro = vMundo - rd * 200.0;
  vec3 t0 = (uMin - ro) / rd, t1 = (uMax - ro) / rd;
  vec3 a = min(t0, t1), b = max(t0, t1);
  float tn = max(max(a.x, a.y), a.z), tf = min(min(b.x, b.y), b.z);
  float passo = max(tf - tn, 0.0) / ${passos}.0;
  float T = 1.0;
  vec3 luz = vec3(0.0);
  for (int i = 0; i < ${passos}; i++) {
    vec3 p = ro + rd * (tn + (float(i) + 0.5) * passo);
    vec3 dl = p - uLuzPos;
    float d = length(dl);
    float co = dot(dl / d, vec3(0.0, -1.0, 0.0));
    vec3 L = 4.0 * uLuzCor * smoothstep(${Math.cos(GRAUS(25)).toFixed(6)}, ${Math.cos(GRAUS(20)).toFixed(6)}, co) / (1.0 + d * d * 0.02);
    luz += T * 0.08 * passo * (L + 0.05);
    T *= exp(-0.08 * passo);
  }
  gl_FragColor = vec4(luz, 1.0 - T);
  #include <colorspace_fragment>
}`;

function nevoa(scene: THREE.Scene, p: Params, cam: THREE.Camera): Montagem {
  const chao = new THREE.Mesh(
    new THREE.BoxGeometry(32, 0.5, 32),
    new THREE.MeshStandardMaterial({ color: srgb(0.4, 0.4, 0.42), roughness: 1 }),
  );
  chao.position.y = -0.25;
  scene.add(chao);
  const geo = new THREE.BoxGeometry(1, 4, 1);
  const mat = new THREE.MeshStandardMaterial({ color: srgb(0.7, 0.65, 0.6), roughness: 1 });
  for (const x of [-9, -3, 3, 9])
    for (const z of [-9, -3, 3, 9]) {
      const col = new THREE.Mesh(geo, mat);
      col.position.set(x, 2, z);
      scene.add(col);
    }
  const corLuz = srgb(1, 0.9, 0.7);
  const holofote = new THREE.SpotLight(corLuz, 4 * Math.PI, 20, GRAUS(25), 0.2, 1);
  holofote.position.set(0, 12, 0);
  holofote.target.position.set(0, 0, 0);
  holofote.castShadow = p.sombras === 1;
  holofote.shadow.mapSize.set(2048, 2048);
  scene.add(holofote, holofote.target);
  // contract: linear by camera depth, 70 (none) to 120 (full); exponential formulas differ between the engines
  if (p.modo === 1) scene.fog = new THREE.Fog(srgb(0.6, 0.65, 0.7), 70, 120);
  if (p.modo === 2) {
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const caixa = new THREE.Mesh(
      new THREE.BoxGeometry(24, 8, 24),
      new THREE.ShaderMaterial({
        vertexShader: NEVOA_VS,
        fragmentShader: nevoaFs(p.passos),
        side: THREE.BackSide,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uMin: { value: new THREE.Vector3(-12, 0, -12) },
          uMax: { value: new THREE.Vector3(12, 8, 12) },
          uDir: { value: dir },
          uLuzPos: { value: holofote.position.clone() },
          uLuzCor: { value: new THREE.Vector3(corLuz.r, corLuz.g, corLuz.b) },
        },
      }),
    );
    caixa.position.y = 4;
    caixa.renderOrder = 10;
    caixa.userData.semSombra = true;
    scene.add(caixa);
  }
  const tecnica = [
    'Sem névoa.',
    'Névoa linear de distância (Fog, de 70 a 120), aplicada no shader de cada material; não pinta o fundo.',
    `Névoa volumétrica por raymarching num shader próprio, ${p.passos} amostras por pixel, sem sombra no feixe.`,
  ][p.modo]!;
  return { tecnica };
}
