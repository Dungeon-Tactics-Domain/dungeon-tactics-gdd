// Atlas of the 32 px ability icons (the AI sheet reduced by the game's scripts/assets/icon-test.py): each icon at 1x, 2x
// and 4x, sharp, then without background on light and dark. Ported from dungeon-tactics-lab/design/src/icones.ts.
import { useRef, useState } from 'react';
import { Icone as IconeAcao } from '@/components/layout/Icone';
import { cn } from '@/lib/utils';
import { ASSETS } from '../dados';
import { FILTRO } from '@/components/ui/toggle';

const NOMES = [
  'Golpe',
  'Golpe pesado',
  'Escudada',
  'Giro',
  'Machadada',
  'Pancada',
  'Tiro',
  'Tiro mirado',
  'Tiro de recuo',
  'Adaga',
  'Faca arremessada',
  'Facada',
  'Raio de fogo',
  'Explosão',
  'Rajada',
  'Cura',
  'Onda sombria',
  'Golpe mortal',
  'Rasteira',
  'Derrubar',
  'Estocada longa',
  'Salto',
  'Mover',
  'Esperar',
];
const CELULA = 32;
const COLUNAS = 6;
// soft-edge atlases proposed for the game: native size of each file (32, 48 and 64 px cells) on the game's blue panel
const TAMANHOS: [escala: number, arquivo: string][] = [
  [1, 'atlas-32-suave'],
  [1.5, 'atlas-48-suave'],
  [2, 'atlas-64-suave'],
];

function Icone({
  i,
  escala,
  arquivo = 'atlas-32',
  liso = false,
}: {
  i: number;
  escala: number;
  arquivo?: string;
  liso?: boolean;
}) {
  const x = (i % COLUNAS) * CELULA * escala;
  const y = Math.floor(i / COLUNAS) * CELULA * escala;
  return (
    <div
      style={{
        width: CELULA * escala,
        height: CELULA * escala,
        imageRendering: liso ? 'auto' : 'pixelated',
        background: `url(${ASSETS}/ia/icones/${arquivo}.png) -${x}px -${y}px/${CELULA * COLUNAS * escala}px ${CELULA * 4 * escala}px no-repeat`,
      }}
    />
  );
}

// toggle button: the pressed one takes the lab colour
const BOTAO = FILTRO;
const FUNDOS: [nome: string, cor: string][] = [
  ['Painel azul do jogo', 'linear-gradient(#1c3a78,#0b1a3e)'],
  ['Papel claro', '#ece2c4'],
  ['Fundo escuro', '#282830'],
];

// the magnifier sits beside the cards from 1024 px (sticky, no modal) and below them on narrower screens; on the
// ultrawide it shows the three backgrounds at once, elsewhere the one picked (redesign-responsivo, section 2)
export function Icones() {
  const [sel, setSel] = useState(0);
  const [fundo, setFundo] = useState(0);
  const lupa = useRef<HTMLElement>(null);
  const escolher = (i: number) => {
    setSel(i);
    if (!matchMedia('(min-width: 1024px)').matches) lupa.current?.scrollIntoView({ block: 'nearest' });
  };
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px] ultra:grid-cols-[minmax(0,1fr)_920px]">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-3">
        {NOMES.map((nome, i) => (
          <div key={nome} className="flex flex-col gap-1.5 border border-borda bg-folha p-2">
            <strong className="text-[15px]">{nome}</strong>
            <div className="flex items-end gap-1.5">
              <Icone i={i} escala={1} />
              <span className="text-[14px] text-apagado">original</span>
            </div>
            <div className="flex items-end gap-3 p-1.5" style={{ background: FUNDOS[0]![1] }} title="32, 48 e 64 px">
              {TAMANHOS.map(([escala, arquivo]) => (
                <Icone key={arquivo} i={i} escala={escala} arquivo={arquivo} liso />
              ))}
            </div>
            <div className="flex">
              {FUNDOS.slice(1).map(([nomeFundo, cor]) => (
                <div key={nomeFundo} className="flex flex-1 justify-center p-1" style={{ background: cor }}>
                  <Icone i={i} escala={1} arquivo="atlas-32-suave" liso />
                </div>
              ))}
            </div>
            <button
              id={`lupa-${i}`}
              type="button"
              aria-pressed={i === sel}
              className={BOTAO}
              onClick={() => escolher(i)}
            >
              Lupa 8x
            </button>
          </div>
        ))}
      </div>
      <aside
        ref={lupa}
        aria-label="Lupa"
        className="grid scroll-mt-[calc(var(--reino-h)+8px)] scroll-mb-[calc(var(--nav-h)+8px)] gap-3 border border-borda bg-folha p-4 lg:sticky lg:top-[calc(var(--reino-h)+16px)]"
      >
        <h2 className="m-0 text-[21px]">{NOMES[sel]}</h2>
        {/* below 1024 px the magnifier sits after all 24 cards (about 6,000 px down): the way back to the card */}
        <button
          type="button"
          className={cn(BOTAO, 'inline-flex items-center gap-2 justify-self-start text-[16px] lg:hidden')}
          onClick={() => {
            const b = document.getElementById(`lupa-${sel}`);
            b?.scrollIntoView({ block: 'center' });
            b?.focus({ preventScroll: true });
          }}
        >
          <IconeAcao id="subir" />
          Voltar ao ícone
        </button>
        <p className="m-0 text-[15px] text-apagado">Lupa 8x (256 px), sem suavizar.</p>
        <div className="flex flex-wrap gap-3">
          {FUNDOS.map(([nomeFundo, cor], n) => (
            <figure key={nomeFundo} className={`m-0 grid gap-1.5 ${n === fundo ? '' : 'max-ultra:hidden'}`}>
              <div className="w-fit p-3" style={{ background: cor }}>
                <Icone i={sel} escala={8} arquivo="atlas-32-suave" />
              </div>
              <figcaption className="text-[14px] text-apagado">{nomeFundo}</figcaption>
            </figure>
          ))}
        </div>
        <div role="group" aria-label="Fundo" className="flex flex-wrap gap-2 ultra:hidden">
          {FUNDOS.map(([nomeFundo], n) => (
            <button
              key={nomeFundo}
              type="button"
              aria-pressed={n === fundo}
              onClick={() => setFundo(n)}
              className={BOTAO}
            >
              {nomeFundo}
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
