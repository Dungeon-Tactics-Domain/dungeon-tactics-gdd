// Pixel-art faces of the KayKit puppets in use (made by the game's scripts/assets/pixel-faces.mjs): a sheet of 4 frames
// of 64x64 (0 base, 1 closed, 2 half open, 3 open). Each card shows the 4 frames and a talking mouth at ~8 Hz.
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
const TALK = [0, 1, 2, 3, 2, 1, 2, 3, 1, 2]; // frame cycle, switched every 125 ms (~8 Hz)
const FRAME = 64;

// frame n of the sheet, at an integer scale so the pixels stay sharp
function Quadro({ id, n, scale }: { id: string; n: number; scale: number }) {
  return (
    <div
      style={{
        width: FRAME * scale,
        height: FRAME * scale,
        imageRendering: 'pixelated',
        background: `#e8d9b0 url(${ASSETS}/chars/px/${id}.png) -${n * FRAME * scale}px 0/${FRAME * 4 * scale}px ${FRAME * scale}px no-repeat`,
        border: '1px solid #0003',
      }}
    />
  );
}

export function Rostos() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setT((x) => x + 1), 125);
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
            {[0, 1, 2, 3].map((n) => (
              <Quadro key={n} id={id} n={n} scale={1} />
            ))}
          </div>
          <Quadro id={id} n={TALK[t % TALK.length]!} scale={3} />
          <span className="text-[14px]">Quadros 0 a 3 (64 px) e boca falando (192 px).</span>
        </div>
      ))}
    </div>
  );
}
