// Fuller scene for the combat bar test (v5): a small battlefield built from the game's own KayKit blocks, with height
// (a low side, a raised side, a back wall) and a few dungeon props. Cells are 1 unit wide and each level is half a unit tall.
import { Box3, Group, Mesh, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const BASE = '/content/design/hud3d/';
const NIVEL = 0.5;

/** Levels (half-blocks) of the column at cell (x, z). */
export function niveis(x: number, z: number): number {
  if (z <= -3) return 6; // back wall
  if (x <= -3) return 1; // low ground on the left
  if (x >= 2 && z >= 1) return 6; // a tower of blocks at the right-front corner
  return x >= 0 ? 4 : 2; // raised side where the skeleton stands, hero one step below
}
export const alturaDe = (x: number, z: number) => niveis(Math.round(x), Math.round(z)) * NIVEL;

export async function criarArena(): Promise<Group> {
  const loader = new GLTFLoader();
  const nomes = ['grass', 'dirt', 'stone', 'stone_dark', 'bricks_A'];
  const [blocos, props] = await Promise.all([
    Promise.all(nomes.map((n) => loader.loadAsync(`${BASE}blocks/${n}.gltf`))),
    Promise.all(['barrel_large', 'column', 'chest_gold', 'crates_stacked'].map((n) => loader.loadAsync(`${BASE}dungeon/${n}.gltf`))),
  ]);
  const proto = Object.fromEntries(nomes.map((n, i) => [n, blocos[i]!.scene])) as Record<string, Object3D>;
  const g = new Group();

  const bloco = (nome: string, x: number, y: number, z: number) => {
    const p = proto[nome]!;
    const box = new Box3().setFromObject(p);
    const size = box.getSize(new Vector3());
    const c = box.getCenter(new Vector3());
    const m = p.clone();
    const sx = 1 / size.x;
    const sy = NIVEL / size.y;
    m.scale.set(sx, sy, 1 / size.z);
    m.position.set(x - c.x * sx, y - box.min.y * sy, z - c.z / size.z);
    g.add(m);
  };
  for (let x = -4; x <= 4; x++)
    for (let z = -3; z <= 3; z++) {
      const L = niveis(x, z);
      const topo = z <= -3 ? 'bricks_A' : x >= 0 ? 'stone' : 'grass';
      for (let k = 0; k < L; k++) bloco(k === L - 1 ? topo : k === L - 2 ? 'dirt' : 'stone_dark', x, k * NIVEL, z);
    }

  const objeto = (gltf: (typeof props)[number], x: number, z: number, alvo: number, ry = 0) => {
    const o = gltf.scene.clone();
    const box = new Box3().setFromObject(o);
    const k = alvo / (box.max.y - box.min.y);
    o.scale.setScalar(k);
    o.rotation.y = ry;
    o.position.set(x, alturaDe(x, z) - box.min.y * k, z);
    o.traverse((c) => ((c as Mesh).isMesh ? c.layers.set(0) : undefined));
    g.add(o);
  };
  objeto(props[0]!, 1, -2, 0.55);
  objeto(props[1]!, -3, -2, 1.7);
  objeto(props[2]!, 3, 0, 0.4, -Math.PI / 2);
  objeto(props[3]!, 3, -2, 0.55);
  return g;
}
