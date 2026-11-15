// Atlas of the 32 px ability icons (the AI sheet reduced by the game's scripts/assets/icon-test.py): each icon at 1x, 2x
// and 4x, sharp, then without background on light and dark. Ported from dungeon-tactics-lab/design/src/icones.ts.
import { useState } from 'react';
import { ASSETS } from '../dados';

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

function Icone({ i, escala, arquivo = 'atlas-32', liso = false }: { i: number; escala: number; arquivo?: string; liso?: boolean }) {
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

const FUNDOS = ['linear-gradient(#1c3a78,#0b1a3e)', '#ece2c4', '#282830'];

export function Icones() {
  const [lupa, setLupa] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-3">
        {NOMES.map((nome, i) => (
          <div key={nome} className="flex flex-col gap-1.5 border border-borda bg-folha p-2">
            <strong className="text-sm">{nome}</strong>
            <div className="flex items-end gap-1.5">
              <Icone i={i} escala={1} />
              <span className="text-[10px] opacity-60">original</span>
            </div>
            <div className="flex items-end gap-3 p-1.5" style={{ background: FUNDOS[0] }} title="32, 48 e 64 px">
              {TAMANHOS.map(([escala, arquivo]) => (
                <Icone key={arquivo} i={i} escala={escala} arquivo={arquivo} liso />
              ))}
            </div>
            <div className="flex">
              {FUNDOS.slice(1).map((cor) => (
                <div key={cor} className="flex flex-1 justify-center p-1" style={{ background: cor }}>
                  <Icone i={i} escala={1} arquivo="atlas-32-suave" liso />
                </div>
              ))}
            </div>
            <button type="button" className="border border-borda px-2 py-0.5 text-xs" onClick={() => setLupa(i)}>
              Lupa 8x
            </button>
          </div>
        ))}
      </div>
      {lupa !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setLupa(null)}>
          <div className="flex flex-col items-center gap-3 bg-folha p-4" onClick={(e) => e.stopPropagation()}>
            <strong>{NOMES[lupa]}</strong>
            <div className="flex">
              {FUNDOS.map((cor) => (
                <div key={cor} className="p-3" style={{ background: cor }}>
                  <Icone i={lupa} escala={8} arquivo="atlas-32-suave" />
                </div>
              ))}
            </div>
            <button type="button" className="border border-borda px-3 py-1 text-sm" onClick={() => setLupa(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
