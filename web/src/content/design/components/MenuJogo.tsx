// Live iframe of a game bench server (npm run bench in the version's worktree) showing the 3D action menu (?menu3d). Same idea
// as the mechanics lab's Cena.tsx: the game never starts by itself, "Ver ao vivo" mounts the iframe, "Parar" unloads it. The
// bench only allows localhost, so the page works on the machine that runs the game (also when opened from the public site).
import { useState } from 'react';

const VERSOES = [
  {
    id: 'opus',
    nome: 'Opus 5.5 (esforço alto)',
    porta: 5292,
    arvore: 'menu3d-opus-ag',
  },
  {
    id: 'fable',
    nome: 'Fable 5.2 (esforço alto)',
    porta: 5296,
    arvore: 'menu3d-fable-ag',
  },
] as const;
type Versao = (typeof VERSOES)[number];

const BOTAO =
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-4 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';

export function MenuJogo() {
  const [aoVivo, setAoVivo] = useState(false);
  const [versao, setVersao] = useState<Versao>(VERSOES[0]);
  const [habilidades, setHabilidades] = useState(false);
  const [pixel, setPixel] = useState(false);
  const spec = `menu3d-${versao.id}${habilidades ? '-habilidades' : ''}${pixel ? '-pixel' : ''}`;
  const src = `http://localhost:${versao.porta}/?scenario=ash_wood&sandbox=bench/${spec}.json`;
  return (
    <div className="my-4 grid gap-2">
      <div role="radiogroup" aria-label="Versão do menu" className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-tinta-suave">Versão</span>
        {VERSOES.map((v) => (
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={v.id === versao.id}
            onClick={() => setVersao(v)}
            className="min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-checked:border-lab aria-checked:bg-lab aria-checked:text-white"
          >
            {v.nome}
          </button>
        ))}
      </div>
      <p className="m-0 text-sm text-tinta-suave">
        Gerado por: {versao.nome}, subagente do zero. bench/{spec}.json em localhost:{versao.porta}. Dentro do jogo: setas,
        Enter, Esc e mouse (passar acende, clicar confirma). Os efeitos sonoros tocam.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setAoVivo((v) => !v)} className={BOTAO}>
          {aoVivo ? 'Parar' : 'Ver ao vivo'}
        </button>
        <button type="button" aria-pressed={habilidades} onClick={() => setHabilidades((h) => !h)} className={BOTAO}>
          Já com as habilidades abertas
        </button>
        <button type="button" aria-pressed={pixel} onClick={() => setPixel((p) => !p)} className={BOTAO}>
          Filtro pixelado nos ícones
        </button>
      </div>
      {aoVivo ? (
        <iframe
          key={src}
          src={src}
          title={`Jogo com o menu de ações em 3D, versão ${versao.nome}`}
          allow="fullscreen"
          className="mx-auto block aspect-video w-full max-w-[min(160vh,1280px)] rounded-lg border border-borda bg-tinta"
        />
      ) : (
        <p className="m-0 rounded-lg border border-borda bg-folha px-4 py-3 text-sm">
          Suba a bancada da versão (<code>npm run bench -- --port {versao.porta}</code> no worktree{' '}
          <code>{versao.arvore}</code> do jogo) e clique em &laquo;Ver ao vivo&raquo;.
        </p>
      )}
    </div>
  );
}
