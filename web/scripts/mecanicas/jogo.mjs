// Shared by the mecanicas generators: reads the game's origin/master without touching its working tree.
// `git show` copies the data files into a temp folder with their relative paths, and Node 25 imports them as TypeScript
// (it strips types natively; the files only use `import type`, so no other game module is needed).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const ELEMENTO = { fire: 'fogo', ice: 'gelo', lightning: 'raio', shadow: 'sombra', wind: 'vento', light: 'luz' };
export const faixa = ([a, b]) => (a === b ? `${a}` : `${a}–${b}`);

/** The origin/master commit, `show(path)` for raw sources, and the imported modules of `arquivos`, in order. */
export async function lerJogo(jogo, arquivos) {
  const git = (...a) => execFileSync('git', ['-C', jogo, ...a], { encoding: 'utf8' });
  const commit = git('rev-parse', 'origin/master').trim();
  const show = (p) => git('show', `origin/master:${p}`);
  const tmp = mkdtempSync(join(tmpdir(), 'mecanicas-'));
  writeFileSync(join(tmp, 'package.json'), '{"type":"module"}');
  for (const p of arquivos) {
    mkdirSync(dirname(join(tmp, p)), { recursive: true });
    writeFileSync(join(tmp, p), show(p));
  }
  const modulos = [];
  for (const p of arquivos) modulos.push(await import(pathToFileURL(join(tmp, p)).href));
  rmSync(tmp, { recursive: true, force: true });
  return { commit, show, modulos };
}
