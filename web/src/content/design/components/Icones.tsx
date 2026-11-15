// Atlas of the 32 px ability icons (the AI sheet reduced by the game's scripts/assets/icon-test.py): each icon at 1x, 2x
// and 4x, sharp, then without background on light and dark. Ported from dungeon-tactics-lab/design/src/icones.ts.
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
// hard edge (first two) and soft edge with opacity (last two), on light and dark
const SEM_FUNDO: [cor: string, arquivo: string][] = [
  ['#ece2c4', 'atlas-32-sem-fundo'],
  ['#282830', 'atlas-32-sem-fundo'],
  ['#ece2c4', 'atlas-32-suave'],
  ['#282830', 'atlas-32-suave'],
];

function Icone({ i, escala, arquivo = 'atlas-32' }: { i: number; escala: number; arquivo?: string }) {
  const x = (i % COLUNAS) * CELULA * escala;
  const y = Math.floor(i / COLUNAS) * CELULA * escala;
  return (
    <div
      style={{
        width: CELULA * escala,
        height: CELULA * escala,
        imageRendering: 'pixelated',
        background: `url(${ASSETS}/ia/icones/${arquivo}.png) -${x}px -${y}px/${CELULA * COLUNAS * escala}px ${CELULA * 4 * escala}px no-repeat`,
      }}
    />
  );
}

export function Icones() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-3">
      {NOMES.map((nome, i) => (
        <div key={nome} className="flex flex-col gap-2 border border-borda bg-folha p-2.5">
          <strong>{nome}</strong>
          <div className="flex items-end gap-2.5">
            <Icone i={i} escala={1} />
            <Icone i={i} escala={2} />
            <Icone i={i} escala={4} />
          </div>
          <div className="flex">
            {SEM_FUNDO.map(([cor, arquivo]) => (
              <div key={cor + arquivo} className="flex flex-1 justify-center p-1" style={{ background: cor }}>
                <Icone i={i} escala={2} arquivo={arquivo} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
