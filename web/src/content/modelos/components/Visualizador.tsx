// The 3D bench viewer of the models lab: piece and style buttons over an iframe of the bench (eval.html), which runs in
// the game's worktree (see bancada.ts). Same URLs and behaviour as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
import { type ReactNode, useEffect, useState } from 'react';
import { DecisaoAsset } from '@/components/content/DecisaoAsset';
import { FICHAS, type Ficha as DadosDaFicha } from '../fichas';
import pecas from '../pecas.json';
import { BANCADA, BENCH, CLASSE_VIEWER, EM_LOCALHOST } from './bancada';

const ESTILOS = [
  ['psx', 'PSX'],
  ['normal', 'Pintado (jogo)'],
  ['liso', 'Pintado em 3D liso'],
] as const;
type Estilo = (typeof ESTILOS)[number][0];

interface Peca {
  id: string;
  nome: string;
  m?: string;
  glb?: string;
  zoom?: number;
}

export type Conjunto = keyof typeof pecas;
const CONJUNTOS: Record<Conjunto, Peca[]> = pecas;

function urlDaPeca(p: Peca, estilo: Estilo) {
  // the warrior is taller than the carts and the tree taller still: zoom per piece
  const q = new URLSearchParams({ zoom: String(p.zoom ?? 2.2) });
  if (p.glb) {
    // Blender model: smooth 3D only, no pixel or PSX
    q.set('glb', p.glb);
    return `${BENCH}?${q}`;
  }
  q.set('m', p.m ?? '');
  if (estilo === 'psx') {
    q.set('ps1', '1');
    q.set('pixel', '3');
    q.set('keep', '0.35');
  }
  if (estilo === 'normal') q.set('pixel', '3');
  return `${BENCH}?${q}`;
}

const BOTAO =
  'min-h-11 min-w-11 cursor-pointer rounded-md border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';

export function Botoes<T>({
  rotulo,
  itens,
  atual,
  escolher,
}: {
  rotulo: string;
  itens: readonly (readonly [T, string])[];
  atual: T;
  escolher: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-1.5">
      {itens.map(([v, nome]) => (
        <button key={nome} type="button" aria-pressed={v === atual} onClick={() => escolher(v)} className={BOTAO}>
          {nome}
        </button>
      ))}
    </div>
  );
}

/**
 * The 3D viewer on the left, sticky while the options on the right scroll (Nov 15, Fernando's request). The viewer
 * column is 58% of the width but never wider than the screen is tall, or ultrawide screens get a wide, low strip;
 * below 1024 px (the shell's two-panel band) they stack, viewer first.
 */
export function LadoALado({ viewer, children }: { viewer: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-4 min-[1024px]:grid-cols-[minmax(0,min(58%,100vh))_minmax(0,1fr)]">
      <div className="min-w-0 min-[1024px]:sticky min-[1024px]:top-[calc(var(--reino-h)+1rem)]">{viewer}</div>
      <div className="grid min-w-0 content-start gap-4">{children}</div>
    </div>
  );
}

/** Sheet of a Blender character beside its viewer: measured numbers and the notes' method and defects, each with its source. */
function Ficha({ numeros, metodo, origemMetodo, defeitos, origemDefeitos }: DadosDaFicha) {
  return (
    <section
      aria-label="Ficha do modelo"
      className="grid gap-3 border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4"
    >
      <h2 className="m-0 text-[21px] leading-tight">Ficha do modelo</h2>
      <dl className="m-0 grid gap-2">
        {numeros.map(([rotulo, valor, origem]) => (
          <div key={rotulo}>
            <dt className="font-bold">{rotulo}</dt>
            <dd className="m-0">
              {valor} <span className="text-[15px] text-apagado">({origem})</span>
            </dd>
          </div>
        ))}
      </dl>
      <h3 className="m-0 text-[18px] leading-tight">Método</h3>
      <p className="m-0">
        {metodo} <span className="text-[15px] text-apagado">({origemMetodo})</span>
      </p>
      <h3 className="m-0 text-[18px] leading-tight">Defeitos conhecidos</h3>
      <ul className="m-0 grid list-disc gap-1 pl-6">
        {defeitos.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
      <p className="m-0 text-[15px] text-apagado">Origem: {origemDefeitos}.</p>
    </section>
  );
}

/** `asset` prefixes the piece id into the decision's asset id (`modelos/<set>/<piece>`); `lado` goes under the options. */
function Bancada({
  pecas: lista,
  asset,
  lado,
  children,
}: {
  pecas: Peca[];
  asset: string;
  lado?: ReactNode;
  children?: ReactNode;
}) {
  const [peca, setPeca] = useState(lista[0]!);
  const [estilo, setEstilo] = useState<Estilo>('liso');
  const [foraDoAr, setForaDoAr] = useState(false);
  useEffect(() => {
    fetch(BENCH, { mode: 'no-cors' }).catch(() => setForaDoAr(true));
  }, []);
  // a lone Blender model has no buttons: the old lab hid the whole box then
  const semCaixa = lista.length === 1 && !!lista[0]!.glb;
  return (
    <>
      {children}
      <LadoALado viewer={<iframe src={urlDaPeca(peca, estilo)} title="Visualizador 3D" className={CLASSE_VIEWER} />}>
        {!semCaixa && (
          <div className="grid gap-2 border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4">
            {lista.length > 1 && (
              <Botoes rotulo="Peça" itens={lista.map((p) => [p, p.nome] as const)} atual={peca} escolher={setPeca} />
            )}
            {!peca.glb && <Botoes rotulo="Estilo" itens={ESTILOS} atual={estilo} escolher={setEstilo} />}
            {foraDoAr && (
              <p className="m-0 border border-dashed border-traco bg-folha px-4 py-3 text-apagado">
                A bancada 3D não respondeu.
                {EM_LOCALHOST && (
                  <>
                    {' '}
                    Ela roda na porta 5205: <code>npx vite --port 5205 --strictPort</code> na worktree do jogo.
                  </>
                )}
              </p>
            )}
          </div>
        )}
        {lado}
        <DecisaoAsset key={peca.id} id={`${asset}/${peca.id}`} rotulo={peca.nome} />
      </LadoALado>
    </>
  );
}

/** Viewer of a set of pieces from pecas.json; the children are the intro shown above it. */
export function Visualizador({ conjunto, children }: { conjunto: Conjunto; children?: ReactNode }) {
  const lista = CONJUNTOS[conjunto];
  if (!lista?.length) return <p className="m-0 text-erro">Conjunto de peças desconhecido: {conjunto}.</p>;
  return (
    <Bancada pecas={lista} asset={`modelos/${conjunto}`}>
      {children}
    </Bancada>
  );
}

/** Page of a Blender model: if the file is not on the bench yet, says so instead of showing an empty bench. */
export function Blender({ modelo, children }: { modelo: string; children?: ReactNode }) {
  const glb = `${BANCADA}/eval/blender-${modelo}/char.glb`;
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'falta'>('carregando');
  useEffect(() => {
    let vivo = true;
    fetch(glb, { method: 'HEAD' })
      .then((r) => {
        if (!r.ok) throw new Error('sem arquivo');
        if (vivo) setEstado('ok');
      })
      .catch(() => vivo && setEstado('falta'));
    return () => {
      vivo = false;
    };
  }, [glb]);
  if (estado === 'carregando') return <p className="m-0 text-apagado">Carregando…</p>;
  if (estado === 'falta')
    return (
      <p className="m-0 border border-dashed border-traco bg-folha px-4 py-3 text-apagado">
        Em andamento: o modelo ainda não está na bancada (ou a bancada 3D está fora do ar).
      </p>
    );
  return (
    <Bancada
      pecas={[{ id: modelo, nome: 'Guerreiro', glb, zoom: 1.6 }]}
      asset="modelos/blender"
      lado={FICHAS[modelo] && <Ficha {...FICHAS[modelo]} />}
    >
      {children}
    </Bancada>
  );
}
