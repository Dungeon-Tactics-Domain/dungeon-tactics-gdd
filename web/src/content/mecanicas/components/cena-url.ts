// Iframe address of a live bench scene, the same function as the old lab's data/scenes.ts sceneUrl, so the URLs match.
export const GAME = 'http://localhost:5291';
// branch server with a proposal (`npm run bench -- --port 5292`); with it, each scene shows in pairs (Hoje and Proposta)
export const PROPOSAL: string | null = null;

export type Camera = 'acao' | 'side' | 'three-quarter';
export interface View {
  bare: boolean;
  speed: number;
  camera: Camera;
}
export type Spec = Record<string, unknown> & { scenario?: string; camera?: Record<string, unknown> };

// the scene as it is in the bench file, read once from the game server (its Vite allows localhost origins by CORS)
const specs = new Map<string, Spec>();
export async function benchSpec(base: string, name: string): Promise<Spec> {
  const key = `${base}/${name}`;
  if (!specs.has(key)) {
    const r = await fetch(`${base}/scripts/sandbox/bench/${name}.json`);
    if (!r.ok) throw new Error(`${r.status}`);
    specs.set(key, (await r.json()) as Spec);
  }
  return specs.get(key)!;
}

// base64url of the JSON (UTF-8, no "="), the form the game accepts for a spec built by another page (specParam)
const b64 = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

// Without changes it points at bench/<name>.json; with changes the file cannot override keys, so the whole spec goes in
// base64url. The arena gets &extension=none (no black bands at the map edge).
export function sceneUrl(base: string, name: string, spec: Spec, v: View): string {
  const map = `?scenario=${spec.scenario ?? 'ash_wood'}${spec.scenario === 'arena' ? '&extension=none' : ''}`;
  if (v.bare && v.speed === 1 && v.camera === 'side') return `${base}/${map}&sandbox=bench/${name}.json`;
  const cam = { ...spec.camera };
  delete cam.fixed;
  const next: Spec = {
    ...spec,
    // off: match look, without the fps counter, the toolbar and the help
    hide: v.bare ? ['all'] : ['fps', 'tools', 'help'],
    // "ação" is the spec without `fixed` (an unknown key or null is an error in the game)
    camera: v.camera === 'acao' ? cam : { ...cam, fixed: v.camera },
    ...(v.speed === 1 ? {} : { speed: v.speed }),
  };
  return `${base}/${map}&sandbox=${b64(JSON.stringify(next))}`;
}
