// Volumetric smoke for the gothic room: a ray is marched through animated 3D noise inside a box, lit by the torches.
// Self-contained: update() renders scene depth and the smoke into two small targets; a fullscreen quad added to the
// host scene blends the result during the host's own render. Integration: fumaca-LEIAME.md.

const MAX = 6; // lights and sources the shader loops over
const QUALIDADES = { baixa: { escala: 0.5, passos: 16, oitavas: 2 }, alta: { escala: 1, passos: 32, oitavas: 3 } };

const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tProf, tRuido;
uniform mat4 uInvVP;
uniform vec3 uCam, uMin, uMax, uCor, uAmb;
uniform float uTempo, uDens, uAltura, uCob, uTemProf;
uniform vec3 uLuzPos[${MAX}]; uniform vec3 uLuzCor[${MAX}]; uniform float uLuzAlc[${MAX}];
uniform vec4 uFonte[${MAX}];
uniform int uNLuz, uNFonte;

// 3D value noise from one 2D fetch: the R channel is G shifted by (37,17), so bilinear filtering gives two z slices
float ruido(vec3 x){
  vec3 p = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  vec2 rg = texture2D(tRuido, (p.xy + vec2(37.0,17.0)*p.z + f.xy + 0.5)/256.0).yx;
  return mix(rg.x, rg.y, f.z);
}
float fbm(vec3 p){
  float n = ruido(p)*0.5 + ruido(p*2.03 + 7.1)*0.25;
#if OITAVAS > 2
  n = (n + ruido(p*4.07 + 13.7)*0.125)/0.875;
#else
  n /= 0.75;
#endif
  return smoothstep(0.22, 0.78, n); // value noise bunches around 0.5: stretch it so wisps and gaps both show
}
float densidade(vec3 p){
  float h = p.y - uMin.y, T = uTempo;
  // cover: thick at the floor, fading before the four sides and the top of the box so no flat face ever shows
  vec3 b = min(p - uMin, uMax - p);
  float borda = smoothstep(0.0, 2.5, min(b.x, b.z)) * smoothstep(0.0, 1.0, uMax.y - p.y);
  float cob = exp(-h/uAltura) * uCob;
  // plumes: a column over each fire that widens and sways as it rises
  float pluma = 0.0;
  for (int i = 0; i < ${MAX}; i++){
    if (i >= uNFonte) break;
    vec3 r = p - uFonte[i].xyz; float hy = r.y;
    r.xz += hy*0.3*vec2(sin(T*0.7 + hy*1.3 + uFonte[i].x), cos(T*0.5 + hy*1.1 + uFonte[i].z));
    float raio = 0.2*uFonte[i].w + max(hy, 0.0)*0.3;
    pluma += 0.9 * exp(-dot(r.xz, r.xz)/(raio*raio)) * smoothstep(-0.2, 0.5, hy) * exp(-max(hy, 0.0)/(2.6*uFonte[i].w));
  }
  float total = (cob + pluma) * borda;
  if (total < 0.02) return 0.0;
  // ground layer: slow drift plus a sine warp that reads as lazy swirls
  vec3 q = p*0.55; q.xz += vec2(T*0.035, T*0.022);
  q.xz += 0.55*vec2(sin(q.z*1.4 + T*0.13), cos(q.x*1.4 + T*0.11)); q.y -= T*0.012;
  float n = fbm(q);
  // inside a plume the noise climbs with the hot air
  if (pluma > 0.02) n = mix(n, fbm(vec3(p.x, p.y - T*0.6, p.z)*1.7), min(pluma*1.5, 1.0));
  return max(0.0, n + total - 1.0) * 2.0; // erosion: thin cover leaves only the noise peaks, so edges break into wisps
}
vec3 mundo(float z){ vec4 w = uInvVP * vec4(vUv*2.0-1.0, z*2.0-1.0, 1.0); return w.xyz/w.w; }

void main(){
  vec3 rd = normalize(mundo(1.0) - uCam);
  vec3 t0 = (uMin - uCam)/rd, t1 = (uMax - uCam)/rd, ta = min(t0, t1), tb = max(t0, t1);
  float tA = max(max(ta.x, ta.y), max(ta.z, 0.0)), tB = min(tb.x, min(tb.y, tb.z));
  // soft depth: the march simply stops at the geometry, so smoke thins out against it instead of cutting
  if (uTemProf > 0.5) tB = min(tB, dot(mundo(texture2D(tProf, vUv).x) - uCam, rd));
  if (tB <= tA){ gl_FragColor = vec4(0.0); return; }
  float ds = (tB - tA)/float(PASSOS);
  // fixed screen dither (not per frame) hides the step bands without shimmering at half resolution
  float t = tA + ds*fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  vec3 cor = vec3(0.0); float tr = 1.0;
  for (int s = 0; s < PASSOS; s++){
    vec3 p = uCam + rd*t; t += ds;
    float d = densidade(p);
    if (d < 0.003) continue;
    vec3 L = uAmb;
    for (int i = 0; i < ${MAX}; i++){
      if (i >= uNLuz) break;
      vec3 l = uLuzPos[i] - p; float dist = length(l), a = max(0.0, 1.0 - dist/uLuzAlc[i]);
      // Henyey-Greenstein, g = 0.35, scaled so an even scatter is 1: smoke glows more when looking toward the fire
      float c = dot(rd, l/dist), hg = 0.8775/pow(1.1225 - 0.7*c, 1.5);
      L += uLuzCor[i] * (a*a/(1.0 + dist*dist*0.12)) * hg;
    }
    L *= mix(1.0, 0.6, min(d*1.5, 1.0)); // dense cores swallow their own light
    float a = 1.0 - exp(-d*uDens*ds);
    cor += tr*a*L*uCor; tr *= 1.0 - a;
    if (tr < 0.03) break;
  }
  gl_FragColor = vec4(cor, 1.0 - tr);
}`;

// 3x3 box: the footprint the dither pattern is built to vanish under; also softens the half-resolution upscale
const FRAG_COMP = `
precision mediump float;
varying vec2 vUv; uniform sampler2D tFumaca; uniform vec2 uTexel;
void main(){
  vec4 c = vec4(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) c += texture2D(tFumaca, vUv + uTexel*vec2(float(x), float(y)));
  gl_FragColor = c/9.0;
}`;

export function criarFumaca({ THREE, scene, camera, renderer, luzes = [], caixa, fontes = [], cor = 0xbfd1ff, ambiente = 0x293352, densidade = 0.7, altura = 0.4, cobertura = 0.7, qualidade = 'alta', profundidade = true }) {
  const temProf = profundidade && (renderer.capabilities.isWebGL2 || !!renderer.extensions.get('WEBGL_depth_texture'));

  const dados = new Uint8Array(256 * 256 * 4);
  for (let i = 0; i < 256 * 256; i++) dados[i * 4 + 1] = Math.random() * 256;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) dados[(y * 256 + x) * 4] = dados[(((y + 17) & 255) * 256 + ((x + 37) & 255)) * 4 + 1];
  const ruido = new THREE.DataTexture(dados, 256, 256, THREE.RGBAFormat);
  ruido.wrapS = ruido.wrapT = THREE.RepeatWrapping; ruido.magFilter = ruido.minFilter = THREE.LinearFilter; ruido.needsUpdate = true;

  const alvo = (prof) => {
    const rt = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: prof, stencilBuffer: false });
    rt.texture.generateMipmaps = false;
    // 24-bit depth: the 16-bit default lets smoke leak through far walls
    if (prof) rt.depthTexture = new THREE.DepthTexture(4, 4, THREE.UnsignedIntType);
    return rt;
  };
  const rtCena = temProf ? alvo(true) : null, rtFumaca = alvo(false);

  const vetores = (n, V) => Array.from({ length: n }, () => new V());
  const u = {
    tProf: { value: rtCena ? rtCena.depthTexture : null }, tRuido: { value: ruido }, uInvVP: { value: new THREE.Matrix4() },
    uCam: { value: new THREE.Vector3() }, uMin: { value: new THREE.Vector3().copy(caixa.min) }, uMax: { value: new THREE.Vector3().copy(caixa.max) },
    uCor: { value: new THREE.Color(cor) }, uAmb: { value: new THREE.Color(ambiente) },
    uTempo: { value: 0 }, uDens: { value: densidade }, uAltura: { value: altura }, uCob: { value: cobertura }, uTemProf: { value: temProf ? 1 : 0 },
    uLuzPos: { value: vetores(MAX, THREE.Vector3) }, uLuzCor: { value: vetores(MAX, THREE.Vector3) }, uLuzAlc: { value: new Array(MAX).fill(1) },
    uFonte: { value: vetores(MAX, THREE.Vector4) }, uNLuz: { value: 0 }, uNFonte: { value: 0 },
  };
  fontes.slice(0, MAX).forEach((f, i) => u.uFonte.value[i].set(f.pos.x, f.pos.y, f.pos.z, f.forca == null ? 1 : f.forca));
  u.uNFonte.value = Math.min(fontes.length, MAX);

  const geo = new THREE.PlaneBufferGeometry(2, 2);
  const matFumaca = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, defines: { PASSOS: 32, OITAVAS: 3 }, depthTest: false, depthWrite: false });
  const cenaFumaca = new THREE.Scene(), camFixa = new THREE.Camera();
  cenaFumaca.add(new THREE.Mesh(geo, matFumaca));

  // premultiplied: rgb already carries the light gathered along the ray, alpha is how much of the room it hides
  const quad = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: { tFumaca: { value: rtFumaca.texture }, uTexel: { value: new THREE.Vector2() } }, vertexShader: VERT, fragmentShader: FRAG_COMP,
    transparent: true, premultipliedAlpha: true, depthTest: false, depthWrite: false, fog: false,
  }));
  quad.frustumCulled = false; quad.renderOrder = 999; quad.raycast = () => {}; // the host picks with a Raycaster
  scene.add(quad);

  let q = 'alta', ligada = true, msCpu = 0;
  const tam = new THREE.Vector2(), c3 = new THREE.Color();
  const ativa = () => ligada && q !== 'desligada';

  function setQualidade(nome) {
    q = nome in QUALIDADES ? nome : 'desligada';
    if (q !== 'desligada') { matFumaca.defines.PASSOS = QUALIDADES[q].passos; matFumaca.defines.OITAVAS = QUALIDADES[q].oitavas; matFumaca.needsUpdate = true; }
    quad.visible = ativa();
  }
  setQualidade(qualidade);

  function update(dt, cam = camera, ls = luzes) {
    if (!ativa()) return;
    const t0 = performance.now();
    u.uTempo.value += dt;
    // the host changes pixel ratio and window size at runtime, so the targets follow the drawing buffer every frame
    renderer.getDrawingBufferSize(tam);
    const w = Math.max(2, Math.round(tam.x * QUALIDADES[q].escala)), h = Math.max(2, Math.round(tam.y * QUALIDADES[q].escala));
    if (rtFumaca.width !== w || rtFumaca.height !== h) { rtFumaca.setSize(w, h); if (rtCena) rtCena.setSize(w, h); quad.material.uniforms.uTexel.value.set(1 / w, 1 / h); }

    let n = 0;
    for (const l of ls) {
      const I = l.intensidade != null ? l.intensidade : l.intensity; if (!(I > 0) || n >= MAX) continue;
      u.uLuzPos.value[n].copy(l.posicao || l.position); c3.set(l.cor != null ? l.cor : l.color);
      u.uLuzCor.value[n].set(c3.r * I, c3.g * I, c3.b * I); u.uLuzAlc.value[n] = l.alcance || l.distance || 10; n++;
    }
    u.uNLuz.value = n;
    cam.updateMatrixWorld(); u.uCam.value.setFromMatrixPosition(cam.matrixWorld);
    u.uInvVP.value.multiplyMatrices(cam.matrixWorld, cam.projectionMatrixInverse);

    const rtAntes = renderer.getRenderTarget(), sombraAntes = renderer.shadowMap.autoUpdate;
    if (rtCena) {
      // real materials, not an override: an override material draws skinned characters in their bind pose (r117)
      quad.visible = false; renderer.shadowMap.autoUpdate = false; // or the point-light shadow cubes render twice per frame
      renderer.setRenderTarget(rtCena); renderer.render(scene, cam);
      quad.visible = true; renderer.shadowMap.autoUpdate = sombraAntes;
    }
    renderer.setRenderTarget(rtFumaca); renderer.render(cenaFumaca, camFixa);
    renderer.setRenderTarget(rtAntes);
    msCpu = performance.now() - t0;
  }

  return {
    update, setQualidade,
    setEnabled(on) { ligada = !!on; quad.visible = ativa(); },
    dispose() { scene.remove(quad); geo.dispose(); matFumaca.dispose(); quad.material.dispose(); ruido.dispose(); rtFumaca.dispose(); if (rtCena) { rtCena.depthTexture.dispose(); rtCena.dispose(); } },
    get estatisticas() {
      const p = QUALIDADES[q];
      return { qualidade: q, ligada, passos: p ? p.passos : 0, escala: p ? p.escala : 0, largura: ativa() ? rtFumaca.width : 0, altura: ativa() ? rtFumaca.height : 0, profundidade: temProf, luzes: u.uNLuz.value, fontes: u.uNFonte.value, msCpu };
    },
    uniforms: u, // live tuning: uCor, uAmb, uDens (density), uAltura (height of the ground layer), uCob (how much floor it covers)
  };
}
