// One page for the FFT-style 3D interface work (in progress): tab "No jogo" runs the pieces in the game bench (MenuJogo), tab
// "Barra de combate" is the lab test of the combat bar (Hud3d). Both used to be separate pages (hud-3d and menu-3d).
import { useState } from 'react';
import { Hud3d } from './Hud3d';
import { MenuJogo } from './MenuJogo';

const ABAS = [
  ['jogo', 'Peças no jogo (menu, fila, unificado)'],
  ['barra', 'Barra de combate em 3D (lab)'],
] as const;
type Aba = (typeof ABAS)[number][0];

export function InterfaceFft3d() {
  const [aba, setAba] = useState<Aba>('jogo');
  return (
    <div className="my-4 max-w-[1280px]">
      <div role="tablist" aria-label="Partes da interface FFT em 3D" className="mb-3 flex flex-wrap gap-1.5 border-b border-borda">
        {ABAS.map(([id, nome]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`aba-fft3d-${id}`}
            aria-selected={aba === id}
            aria-controls={`painel-fft3d-${id}`}
            onClick={() => setAba(id)}
            className="min-h-11 cursor-pointer border-b-4 border-transparent px-3 text-[15px] text-tinta aria-selected:border-lab aria-selected:font-bold"
          >
            {nome}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-fft3d-${aba}`} aria-labelledby={`aba-fft3d-${aba}`}>
        {aba === 'jogo' ? <MenuJogo /> : <Hud3d />}
      </div>
    </div>
  );
}
