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
  /** Built with the piece-by-piece selector (flags in the address, see the game's ui3d/skin-flags.ts). */
  montar?: boolean;
}

const PECAS: Peca[] = [
  {
    id: 'montar',
    nome: 'Montar o unificado',
    feito: 'Fable 5.2, esforço médio (layout, flags e presets)',
    porta: 5299,
    arvore: 'ui3d-unificado',
    montar: true,
    cenas: [
      { nome: 'Menu de comandos', arquivo: 'layout-edges' },
      { nome: 'Com habilidades abertas', arquivo: 'preset-css' },
    ],
  },
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
    id: 'menu-uikit',
    nome: 'Menu com uikit (teste)',
    feito: 'Fable 5.2, esforço médio, com @pmndrs/uikit (teste não aprovado: mais pesado, sem acentos; guardado para ver depois)',
    porta: 5305,
    arvore: 'menu-uikit',
    cenas: [
      { nome: 'Menu de comandos', arquivo: 'menuuikit' },
      { nome: 'Com habilidades abertas', arquivo: 'menuuikit-habilidades' },
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

type Visual = 'html' | 'css' | '3d';
const VISUAIS: [Visual, string][] = [
  ['html', 'HTML atual'],
  ['css', 'CSS'],
  ['3d', '3D'],
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
  const [menu, setMenu] = useState<Visual>('3d');
  const [fila, setFila] = useState<Visual>('3d');
  const [layout, setLayout] = useState<'edges' | 'frame'>('edges');
  const [guias, setGuias] = useState(true);
  const cena = peca.cenas[Math.min(cenaIdx, peca.cenas.length - 1)]!;
  const arquivo = `${cena.arquivo}${cena.pixel && pixel ? '-pixel' : ''}`;
  // the address beats the scene piece by piece, so the selector only has to name every piece and the layout
  const flags = peca.montar
    ? `&menu=${menu}&turn=${fila === 'css' ? 'html' : fila}&layout=${layout}&pixel=${pixel ? 1 : 0}&guides=${guias ? 1 : 0}`
    : '';
  const src = `http://localhost:${peca.porta}/?scenario=ash_wood${flags}&sandbox=bench/${arquivo}.json`;
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
      {peca.montar && (
        <div className="grid gap-2 rounded-lg border border-borda bg-folha p-3">
          <div role="radiogroup" aria-label="Combinações prontas" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-tinta-suave">Combinação pronta</span>
            {VISUAIS.map(([v, nome]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={menu === v && fila === (v === 'css' ? 'html' : v)}
                onClick={() => {
                  setMenu(v);
                  setFila(v === 'css' ? 'html' : v);
                }}
                className={ESCOLHA}
              >
                Tudo {nome}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Menu de ações" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-tinta-suave">Menu de ações</span>
            {VISUAIS.map(([v, nome]) => (
              <button key={v} type="button" role="radio" aria-checked={menu === v} onClick={() => setMenu(v)} className={ESCOLHA}>
                {nome}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Fila de turnos" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-tinta-suave">Fila de turnos</span>
            {VISUAIS.filter(([v]) => v !== 'css').map(([v, nome]) => (
              <button key={v} type="button" role="radio" aria-checked={fila === v} onClick={() => setFila(v)} className={ESCOLHA}>
                {nome}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Disposição da interface" className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-tinta-suave">Disposição</span>
            {(
              [
                ['edges', 'Regiões nas bordas'],
                ['frame', 'Moldura 16:9 centralizada'],
              ] as const
            ).map(([v, nome]) => (
              <button key={v} type="button" role="radio" aria-checked={layout === v} onClick={() => setLayout(v)} className={ESCOLHA}>
                {nome}
              </button>
            ))}
          </div>
          <p className="m-0 text-xs text-tinta-suave">
            Ainda são só HTML atual: barra de combate, ficha, Height, banner, dicas e prévia (fase 2). A fila em CSS não existe;
            &laquo;Tudo CSS&raquo; usa a fila HTML atual.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setAoVivo((v) => !v)} className={BOTAO}>
          {aoVivo ? 'Parar' : 'Ver ao vivo'}
        </button>
        {peca.montar && (
          <button type="button" aria-pressed={guias} onClick={() => setGuias((g) => !g)} className={BOTAO}>
            Guias 16:9 e regiões
          </button>
        )}
        {(cena.pixel || peca.montar) && (
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
