// Independent rebuild (Opus 5.5) of the Final Fantasy Tactics combat bar over a 3D battle: the knight slashes the skeleton
// mage on a stepped terrain made of the game's KayKit blocks, and the bar (opus-hud.ts) sits on top in an orthographic pass.
// Each frame: the scene is drawn small into a render target and blurred (two passes) for the frosted glass of the panels,
// then drawn full size on screen, then the bar. The loop holds the reference state (Thomas 54/82, 36 of damage in red)
// most of the time, then plays the blow: the red stretch drains, the number counts down, the portraits react.
import {
  AnimationMixer,
  type AnimationAction,
  type AnimationClip,
  Box3,
  CanvasTexture,
  DirectionalLight,
  HalfFloatType,
  HemisphereLight,
  InstancedMesh,
  LoopOnce,
  Matrix4,
  Mesh,
  type Material,
  type Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PCFShadowMap,
  ACESFilmicToneMapping,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { criarHud } from './opus-hud';

const BASE = '/content/design/hud3d/';
const ROSTOS = '/content/design/chars/ia-alinhado-rosto/';
const NIVEL = 0.5; // height of one terrain level (half a block, as in FFT)

// Terrain: one row per z (back to front), one digit per x (-5..4) = number of levels.
const MAPA = [
  '7766655555',
  '6655544444',
  '5544433344',
  '4433322333',
  '3322233333',
  '3322223333',
  '2222222222',
  '1111111122',
];
const X0 = -5;
const Z0 = -4;
const nivel = (x: number, z: number) => Number(MAPA[z - Z0]?.[x - X0] ?? 0);

const CICLO = 6.4; // seconds
const T_GOLPE = 3.4; // the knight starts the slash
const HP_ANTES = 54;
const DANO = 36;

const FRAG_BLUR = /* glsl */ `
uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(uTex, vUv).rgb * 0.2270270270;
  c += texture2D(uTex, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(uTex, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(uTex, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(uTex, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;

export async function criarCenaOpus(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping; // only the 3D scene: the HUD shaders skip tone mapping
  renderer.toneMappingExposure = 1.15;
  renderer.autoClear = false;

  // ---------------------------------------------------------------- world
  const cena = new Scene();
  const ceu = document.createElement('canvas');
  ceu.width = 4;
  ceu.height = 256;
  const gc = ceu.getContext('2d')!;
  const gr = gc.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#1d4d9c');
  gr.addColorStop(0.6, '#3f78b8');
  gr.addColorStop(1, '#8fb3c9');
  gc.fillStyle = gr;
  gc.fillRect(0, 0, 4, 256);
  const texCeu = new CanvasTexture(ceu);
  texCeu.colorSpace = SRGBColorSpace;
  cena.background = texCeu;

  cena.add(new HemisphereLight('#cfe0ff', '#5a4630', 1.6));
  const sol = new DirectionalLight('#fff1d6', 2.4);
  sol.position.set(-6, 10, 5);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  sol.shadow.bias = -0.0008;
  Object.assign(sol.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  cena.add(sol);

  const camera = new PerspectiveCamera(24, 1, 0.5, 80);
  const alvoCam = new Vector3(-0.5, 1.0, 0.2);

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const tl = new TextureLoader();
  const blocos = ['grass', 'dirt', 'stone', 'stone_dark', 'gravel'] as const;
  const [gltfBlocos, heroi, esqueleto, anims, rostoH, rostoA] = await Promise.all([
    Promise.all(blocos.map((n) => loader.loadAsync(`${BASE}blocks/${n}.gltf`))),
    loader.loadAsync(`${BASE}knight.glb`),
    loader.loadAsync(`${BASE}skeleton_mage.glb`),
    loader.loadAsync(`${BASE}animations.glb`),
    tl.loadAsync(`${ROSTOS}knight.png`),
    tl.loadAsync(`${ROSTOS}skeleton_mage.png`),
  ]);

  // terrain: one InstancedMesh per block kind (5 draw calls instead of ~200 meshes; the scene is drawn twice a frame)
  const listas: Record<string, Matrix4[]> = Object.fromEntries(blocos.map((b) => [b, []]));
  for (let z = Z0; z < Z0 + MAPA.length; z++)
    for (let x = X0; x < X0 + 10; x++) {
      const n = nivel(x, z);
      for (let k = 0; k < n; k++) {
        const topo = n >= 6 ? 'stone' : (x === -1 || x === 0) && z >= 1 ? 'gravel' : (x * 7 + z * 3 + 40) % 5 === 0 ? 'dirt' : 'grass';
        const tipo = k === n - 1 ? topo : k === n - 2 ? 'dirt' : 'stone_dark';
        // blocks are 2-unit cubes centred on the origin: scale to 1 x half x 1
        listas[tipo]!.push(new Matrix4().makeScale(0.5, NIVEL / 2, 0.5).setPosition(x, k * NIVEL + NIVEL / 2, z));
      }
    }
  blocos.forEach((b, i) => {
    let malha: Mesh | undefined;
    gltfBlocos[i]!.scene.traverse((o) => {
      if ((o as Mesh).isMesh) malha ??= o as Mesh;
    });
    const mats = listas[b]!;
    if (!malha || !mats.length) return;
    const im = new InstancedMesh(malha.geometry, malha.material, mats.length);
    mats.forEach((m, j) => im.setMatrixAt(j, m));
    im.castShadow = true;
    im.receiveShadow = true;
    cena.add(im);
  });

  // characters
  const pôrBoneco = (o: Object3D, x: number, z: number, altura: number, giro: number) => {
    const caixa = new Box3().setFromObject(o);
    o.scale.setScalar(altura / (caixa.max.y - caixa.min.y));
    o.position.set(x, nivel(x, z) * NIVEL, z);
    o.rotation.y = giro;
    o.traverse((c) => {
      if ((c as Mesh).isMesh) c.castShadow = true;
    });
    cena.add(o);
  };
  // knight on the lower step, skeleton one level up, face to face along x
  pôrBoneco(heroi.scene, -1, 0, 1.3, Math.PI / 2);
  pôrBoneco(esqueleto.scene, 0, 0, 1.3, -Math.PI / 2);
  // the knight steps toward the target while slashing
  const passo = (t: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * 0.22;

  const clipe = (lista: AnimationClip[], nome: string) => {
    const c = lista.find((a) => a.name === nome);
    if (!c) throw new Error(`clip ${nome} missing`);
    return c;
  };
  // the attack comes from another rig (Rig_Medium): keep only rotations so the knight is not displaced or stretched
  const corte = clipe(anims.animations, 'Melee_1H_Attack_Slice_Diagonal').clone();
  corte.tracks = corte.tracks.filter((t) => t.name.endsWith('.quaternion') && !t.name.startsWith('root.'));
  const mxH = new AnimationMixer(heroi.scene);
  const mxE = new AnimationMixer(esqueleto.scene);
  const idleH = mxH.clipAction(clipe(heroi.animations, 'Idle')).play();
  const golpe = mxH.clipAction(corte);
  golpe.setLoop(LoopOnce, 1);
  golpe.clampWhenFinished = true;
  const idleE = mxE.clipAction(clipe(esqueleto.animations, 'Idle')).play();
  const dor = mxE.clipAction(clipe(esqueleto.animations, 'Hit_A'));
  dor.setLoop(LoopOnce, 1);
  dor.clampWhenFinished = true;
  const durGolpe = corte.duration;
  const tImpacto = T_GOLPE + durGolpe * 0.42;
  const trocar = (de: AnimationAction, para: AnimationAction) => {
    para.reset().setEffectiveWeight(1).play();
    de.crossFadeTo(para, 0.18, false);
  };

  // ---------------------------------------------------------------- blur targets and the HUD
  const rtA = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  const rtB = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  const camTela = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const matBlur = new ShaderMaterial({
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: FRAG_BLUR,
    uniforms: { uTex: { value: null }, uDir: { value: new Vector2() } },
    depthTest: false,
    depthWrite: false,
  });
  const quadBlur = new Mesh(new PlaneGeometry(2, 2), matBlur);
  quadBlur.frustumCulled = false;
  const cenaBlur = new Scene().add(quadBlur);

  // faces stay without colour space: the HUD shaders work in sRGB and output the texels as they are
  const hud = criarHud(rostoH, rostoA);
  const cenaHud = new Scene().add(hud.grupo);
  const camHud = new OrthographicCamera(0, 1, 0, -1, -10, 10);

  let largura = 1;
  let alturaTela = 1;
  const relogio0 = performance.now();
  let tempoAntes = relogio0;

  const blur = () => {
    const wA = rtA.width;
    const hA = rtA.height;
    renderer.setRenderTarget(rtA);
    renderer.clear();
    renderer.render(cena, camera);
    for (let i = 0; i < 2; i++) {
      matBlur.uniforms.uTex!.value = rtA.texture;
      (matBlur.uniforms.uDir!.value as Vector2).set(1 / wA, 0);
      renderer.setRenderTarget(rtB);
      renderer.render(cenaBlur, camTela);
      matBlur.uniforms.uTex!.value = rtB.texture;
      (matBlur.uniforms.uDir!.value as Vector2).set(0, 1 / hA);
      renderer.setRenderTarget(rtA);
      renderer.render(cenaBlur, camTela);
    }
    renderer.setRenderTarget(null);
  };

  return {
    desenhar() {
      const agora = performance.now();
      const dt = Math.min(0.1, (agora - tempoAntes) / 1000);
      tempoAntes = agora;
      const t = ((agora - relogio0) / 1000) % CICLO;
      const tAnt = t - dt;

      // timeline of the blow
      if (tAnt < T_GOLPE && t >= T_GOLPE) trocar(idleH, golpe);
      if (tAnt < T_GOLPE + durGolpe && t >= T_GOLPE + durGolpe) trocar(golpe, idleH);
      if (tAnt < tImpacto && t >= tImpacto) trocar(idleE, dor);
      if (tAnt < tImpacto + dor.getClip().duration && t >= tImpacto + dor.getClip().duration) trocar(dor, idleE);
      mxH.update(dt);
      mxE.update(dt);
      heroi.scene.position.x = -1 + passo((t - T_GOLPE) / durGolpe);

      // bar state: hold the preview, drain on impact, refill near the end of the loop
      const drenar = Math.min(1, Math.max(0, (t - tImpacto) / 0.55));
      const voltar = Math.min(1, Math.max(0, (t - (CICLO - 0.6)) / 0.5));
      const suave = (k: number) => k * k * (3 - 2 * k);
      const hp = HP_ANTES - DANO * suave(drenar) + DANO * suave(voltar);
      const previa = hp - (HP_ANTES - DANO); // green stays at 18, only the red stretch drains and comes back
      const pisca = t < tImpacto ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
      const atacando = t >= T_GOLPE && t < T_GOLPE + durGolpe;
      const ferido = t >= tImpacto && t < CICLO - 0.6;
      hud.estado(hp, previa, pisca, atacando ? 3 : 0, ferido ? 4 : 0);

      blur();
      renderer.clear();
      renderer.render(cena, camera);
      renderer.clearDepth();
      renderer.render(cenaHud, camHud);
    },
    redimensionar(w: number, h: number) {
      largura = Math.max(1, w);
      alturaTela = Math.max(1, h);
      renderer.setSize(largura, alturaTela, false);
      const pr = renderer.getPixelRatio();
      rtA.setSize(Math.ceil((largura * pr) / 4), Math.ceil((alturaTela * pr) / 4));
      rtB.setSize(rtA.width, rtA.height);
      hud.fundo(rtA.texture, largura * pr, alturaTela * pr);

      // 3D camera: FFT-like high diagonal view; keep the fighters above the bar
      camera.aspect = largura / alturaTela;
      const dist = 9.5 / Math.min(1, camera.aspect / 1.4);
      const dir = new Vector3(0.42, 0.62, 0.9).normalize();
      camera.position.copy(alvoCam).addScaledVector(dir, dist);
      camera.lookAt(alvoCam);
      camera.setViewOffset(largura, alturaTela, 0, alturaTela * 0.02, largura, alturaTela);
      camera.updateProjectionMatrix();

      // bar: reference pixels -> screen. Full width of the 1920 capture, unless that makes it too tall for the viewer.
      const s = Math.min(largura / 1920, (alturaTela * 0.42) / 230);
      camHud.left = 0;
      camHud.right = largura;
      camHud.top = 0;
      camHud.bottom = -alturaTela;
      camHud.updateProjectionMatrix();
      hud.grupo.scale.set(s, s, 1);
      hud.grupo.position.set((largura - 1920 * s) / 2, -(alturaTela - 1050 * s), 0);
    },
    destruir() {
      hud.destruir();
      cena.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        for (const mat of ([] as Material[]).concat(m.material)) {
          for (const v of Object.values(mat)) if (v && typeof v === 'object' && 'isTexture' in v) (v as { dispose: () => void }).dispose();
          mat.dispose();
        }
      });
      texCeu.dispose();
      rostoH.dispose();
      rostoA.dispose();
      rtA.dispose();
      rtB.dispose();
      matBlur.dispose();
      quadBlur.geometry.dispose();
      renderer.dispose();
    },
  };
}
