// Pixel-art faces of the KayKit puppets in use: 7 official 8-frame sheets plus 3 old still faces (see OFICIAL below).
// Ported from dungeon-tactics-lab/design/src/rostos.ts.
import { useEffect, useState } from 'react';
import { ASSETS } from '../dados';

const FACES: [string, string][] = [
  ['barbarian', 'Bárbaro'],
  ['knight', 'Cavaleiro'],
  ['lancer', 'Lanceiro'],
  ['mage', 'Mago'],
  ['ranger', 'Arqueira'],
  ['rogue_hooded', 'Ladino encapuzado'],
  ['skeleton_mage', 'Esqueleto mago'],
  ['skeleton_minion', 'Lacaio de osso'],
  ['skeleton_rogue', 'Esqueleto ladino'],
  ['skeleton_warrior', 'Esqueleto guerreiro'],
];
// official sheets (version D): 8 frames of 256 px, in public/chars/px of the game; the three skeletons keep the old 4 x 128 sheet
const OFICIAL = new Set(['barbarian', 'knight', 'lancer', 'mage', 'ranger', 'rogue_hooded', 'skeleton_mage']);
const MOMENTOS = ['neutro', 'falando 1', 'falando 2', 'gritando', 'dano', 'ferido', 'sorrindo', 'bravo'];
const TALK = [0, 1, 2, 1]; // speech cycle at 180 ms per frame, same as the game

// frame n of the sheet at a given pixel size, so the pixels stay sharp
function Quadro({ id, n, size }: { id: string; n: number; size: number }) {
  const novo = OFICIAL.has(id);
  const frames = novo ? 8 : 4;
  return (
    <div
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        background: `#e8d9b0 url(${ASSETS}/chars/${novo ? 'ia-alinhado-rosto' : 'px'}/${id}.png) -${n * size}px 0/${frames * size}px ${size}px no-repeat`,
        border: '1px solid #0003',
      }}
    />
  );
}

export function Rostos() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setT((x) => x + 1), 180);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-4">
      {FACES.map(([id, nome]) => (
        <div key={id} className="flex min-w-0 flex-col gap-2 border border-borda bg-folha p-3">
          <strong>
            {nome} ({id})
          </strong>
          <div className="flex flex-wrap gap-1">
            {(OFICIAL.has(id) ? MOMENTOS : ['base', 'fechada', 'meia', 'aberta']).map((m, n) => (
              <Quadro key={m} id={id} n={n} size={48} />
            ))}
          </div>
          <Quadro id={id} n={OFICIAL.has(id) ? TALK[t % TALK.length]! : 0} size={192} />
          <span className="text-[14px]">
            {OFICIAL.has(id)
              ? 'Folha oficial: 8 momentos (neutro, falando 1 e 2, gritando, dano, ferido, sorrindo, bravo) e a fala.'
              : 'Sem folha de expressões ainda: rosto parado antigo de 4 quadros.'}
          </span>
        </div>
      ))}
    </div>
  );
}
