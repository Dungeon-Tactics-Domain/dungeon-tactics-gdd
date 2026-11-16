// Live iframe of a game bench server (npm run bench in the piece's worktree). One page for every FFT-style interface piece we
// made for the game: the 3D action menu (two versions), the 3D turn order and the HTML/CSS action menu. Same idea as the
// mechanics lab's Cena.tsx: the game never starts by itself, "Ver ao vivo" mounts the iframe, "Parar" unloads it. The bench
// only allows localhost, so the page works on the machine that runs the game (also when opened from the public site).
import { useState } from 'react';

interface Cena {
  nome: string;
  arquivo: string;
  /** Has a pixel-filter variant (file name + "-pixel"). */
  pixel?: boolean;
}
interface Peca {
  id: string;
  nome: string;
  feito: string;
  porta: number;
  arvore: string;
  cenas: Cena[];
}

const PECAS: Peca[] = [
  {
    id: 'unificado',
    nome: 'Unificado (menu 3D + fila + CSS)',
    feito: 'Fable 5.2, esforço médio',
    porta: 5299,
    arvore: 'ui3d-unificado',
    cenas: [
      { nome: 'Menu 3D e fila juntos', arquivo: 'ui3d-tudo' },
      { nome: 'Menu 3D', arquivo: 'menu3d', pixel: true },
      { nome: 'Menu 3D com habilidades', arquivo: 'menu3d-habilidades', pixel: true },
      { nome: 'Fila de turnos', arquivo: 'turn3d' },
      { nome: 'Prévia do golpe', arquivo: 'turn3d-previa' },
      { nome: 'Menu em CSS', arquivo: 'menucss' },
      { nome: 'CSS com habilidades', arquivo: 'menucss-habilidades' },
    ],
  },
  {
    id: 'menu-opus',
    nome: 'Menu 3D, Opus 5.5',
    feito: 'Opus 5.5, esforço alto',
    porta: 5292,
    arvore: 'menu3d-opus-ag',
    cenas: [
      { nome: 'Menu de comandos', arquivo: 'menu3d-opus', pixel: true },
      { nome: 'Com habilidades abertas', arquivo: 'menu3d-opus-habilidades', pixel: true },
    ],
  },
  {
    id: 'menu-fable',
    nome: 'Menu 3D, Fable 5.2',
    feito: 'Fable 5.2, esforço alto',
    porta: 5296,
    arvore: 'menu3d-fable-ag',
    cenas: [
      { nome: 'Menu de comandos', arquivo: 'menu3d-fable', pixel: true },
      { nome: 'Com habilidades abertas', arquivo: 'menu3d-fable-habilidades', pixel: true },
    ],
  },
  {
    id: 'fila',
    nome: 'Fila de turnos 3D',
    feito: 'Fable 5.2, esforço médio',
    porta: 5297,
    arvore: 'turn3d-fable',
    cenas: [
      { nome: 'Fila', arquivo: 'turn3d' },
      { nome: 'Prévia do golpe', arquivo: 'turn3d-previa' },
      { nome: 'Prévia de carga', arquivo: 'turn3d-previa-carga' },
    ],
  },
  {
    id: 'menu-css',
    nome: 'Menu em HTML/CSS',
    feito: 'Opus 5.5, esforço médio',
    porta: 5298,
    arvore: 'menucss-opus',
    cenas: [
      { nome: 'Menu de comandos', arquivo: 'menucss' },
      { nome: 'Com habilidades abertas', arquivo: 'menucss-habilidades' },
      { nome: 'Descrição, página 2', arquivo: 'menucss-descricao-p2' },
    ],
  },
];

const BOTAO =
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-4 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';
const ESCOLHA =
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-checked:border-lab aria-checked:bg-lab aria-checked:text-white';

export function MenuJogo() {
  const [aoVivo, setAoVivo] = useState(false);
  const [peca, setPeca] = useState<Peca>(PECAS[0]!);
  const [cenaIdx, setCenaIdx] = useState(0);
  const [pixel, setPixel] = useState(false);
  const cena = peca.cenas[Math.min(cenaIdx, peca.cenas.length - 1)]!;
  const arquivo = `${cena.arquivo}${cena.pixel && pixel ? '-pixel' : ''}`;
  const src = `http://localhost:${peca.porta}/?scenario=ash_wood&sandbox=bench/${arquivo}.json`;
  const escolher = (p: Peca) => {
    setPeca(p);
    setCenaIdx(0);
  };
  return (
    <div className="my-4 grid gap-2">
      <div role="radiogroup" aria-label="Peça de interface" className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-tinta-suave">Peça</span>
        {PECAS.map((p) => (
          <button key={p.id} type="button" role="radio" aria-checked={p.id === peca.id} onClick={() => escolher(p)} className={ESCOLHA}>
            {p.nome}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Cena" className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm text-tinta-suave">Cena</span>
        {peca.cenas.map((c, i) => (
          <button key={c.arquivo} type="button" role="radio" aria-checked={i === cenaIdx} onClick={() => setCenaIdx(i)} className={ESCOLHA}>
            {c.nome}
          </button>
        ))}
      </div>
      <p className="m-0 text-sm text-tinta-suave">
        Gerado por: {peca.feito}, subagente do zero. bench/{arquivo}.json em localhost:{peca.porta}. Dentro do jogo: setas,
        Enter, Esc e mouse. Os efeitos sonoros tocam.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setAoVivo((v) => !v)} className={BOTAO}>
          {aoVivo ? 'Parar' : 'Ver ao vivo'}
        </button>
        {cena.pixel && (
          <button type="button" aria-pressed={pixel} onClick={() => setPixel((p) => !p)} className={BOTAO}>
            Filtro pixelado nos ícones
          </button>
        )}
      </div>
      {aoVivo ? (
        <iframe
          key={src}
          src={src}
          title={`Jogo com ${peca.nome}, cena ${cena.nome}`}
          allow="fullscreen"
          className="mx-auto block aspect-video w-full max-w-[min(160vh,1280px)] rounded-lg border border-borda bg-tinta"
        />
      ) : (
        <p className="m-0 rounded-lg border border-borda bg-folha px-4 py-3 text-sm">
          Suba a bancada da peça (<code>npm run bench -- --port {peca.porta}</code> no worktree <code>{peca.arvore}</code> do
          jogo) e clique em &laquo;Ver ao vivo&raquo;.
        </p>
      )}
    </div>
  );
}
