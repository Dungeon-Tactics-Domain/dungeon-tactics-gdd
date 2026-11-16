// Live iframe of the game's bench server (npm run bench, port 5291) showing the 3D action menu (?menu3d). Same idea as the
// mechanics lab's Cena.tsx: the game never starts by itself, "Ver ao vivo" mounts the iframe, "Parar" unloads it. The bench
// only allows localhost, so the page works on the machine that runs the game (also when opened from the public site).
import { useState } from 'react';

const GAME = 'http://localhost:5291';
const BOTAO =
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-4 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';

export function MenuJogo() {
  const [ao_vivo, setAoVivo] = useState(false);
  const [pixel, setPixel] = useState(false);
  const spec = pixel ? 'menu3d-pixel' : 'menu3d';
  const src = `${GAME}/?scenario=ash_wood&sandbox=bench/${spec}.json`;
  return (
    <div className="my-4 grid gap-2">
      <p className="m-0 text-sm text-tinta-suave">
        bench/{spec}.json, rodando em localhost:5291. Dentro do jogo: setas, Enter, Esc e mouse (passar acende, clicar
        confirma). Os efeitos sonoros tocam.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setAoVivo((v) => !v)} className={BOTAO}>
          {ao_vivo ? 'Parar' : 'Ver ao vivo'}
        </button>
        <button type="button" aria-pressed={pixel} onClick={() => setPixel((p) => !p)} className={BOTAO}>
          Filtro pixelado nos ícones
        </button>
      </div>
      {ao_vivo ? (
        <iframe
          key={src}
          src={src}
          title="Jogo com o menu de ações em 3D"
          allow="fullscreen"
          className="mx-auto block aspect-video w-full max-w-[160vh] rounded-lg border border-borda bg-tinta"
        />
      ) : (
        <p className="m-0 rounded-lg border border-borda bg-folha px-4 py-3 text-sm">
          Suba a bancada do jogo (<code>npm run bench</code> no worktree <code>menu3d-fase1</code>) e clique em
          &laquo;Ver ao vivo&raquo;.
        </p>
      )}
    </div>
  );
}
