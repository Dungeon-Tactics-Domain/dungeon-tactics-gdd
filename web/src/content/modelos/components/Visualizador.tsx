// The 3D bench viewer of the models lab: piece and style buttons over an iframe of the bench (eval.html), which runs in
// the game's worktree (see bancada.ts). Same URLs and behaviour as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
import { type ReactNode, useEffect, useState } from 'react';
import { DecisaoAsset } from '@/components/content/DecisaoAsset';
import { type Ficha, fichaBlender, fichaPeca } from '../fichas';
import pecas from '../pecas.json';
import { BANCADA, BENCH, CLASSE_VIEWER, EM_LOCALHOST } from './bancada';
import { FichaPreview } from './FichaPreview';
import { JanelaRedimensionavel } from './JanelaRedimensionavel';
import { FILTRO } from '@/components/ui/toggle';

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

export const BOTAO = FILTRO;

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
 * column hugs its JanelaRedimensionavel (dragged by the user) and the options keep at least 320 px; the column scrolls
 * on its own when the window plus its ficha are taller than the screen. Below 1024 px (the shell's two-panel band)
 * they stack: the column dissolves so only the window's viewer box is pinned under the header, on a page-coloured
 * band, and the ficha scrolls with the options.
 */
export function LadoALado({ viewer, children }: { viewer: ReactNode; children: ReactNode }) {
  return (
    <div className="grid items-start gap-4 min-[1024px]:grid-cols-[minmax(0,max-content)_minmax(320px,1fr)]">
      <div className="grid min-w-0 gap-2 max-[1023px]:contents min-[1024px]:sticky min-[1024px]:top-[calc(var(--reino-h)+1rem)] min-[1024px]:max-h-[calc(100dvh-var(--reino-h)-2rem)] min-[1024px]:overflow-y-auto">
        {viewer}
      </div>
      {/* keyboard focus and scrollIntoView must stop below the pinned viewer, not under it (at most 50vh + its caption) */}
      <div className="grid min-w-0 content-start gap-4 max-[1023px]:[&_:is(button,summary)]:scroll-mt-[calc(50vh+var(--reino-h)+48px)]">
        {children}
      </div>
    </div>
  );
}

/** `asset` prefixes the piece id into the decision's asset id (`modelos/<set>/<piece>`); `ficha` replaces the piece's own. */
function Bancada({
  pecas: lista,
  asset,
  tipo,
  ficha,
  children,
}: {
  pecas: Peca[];
  asset: string;
  /** remembers the window size per kind of page */
  tipo: string;
  ficha?: Ficha;
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
      <LadoALado
        viewer={
          <JanelaRedimensionavel tipo={tipo} ficha={<FichaPreview ficha={ficha ?? fichaPeca(peca.m, peca.nome)} />}>
            <iframe src={urlDaPeca(peca, estilo)} title="Visualizador 3D" className={CLASSE_VIEWER} />
          </JanelaRedimensionavel>
        }
      >
        {!semCaixa && (
          <div className="grid gap-2 border-2 border-t-[6px] border-couro-escuro border-t-lab bg-folha shadow-folha px-5 py-4">
            {lista.length > 1 && (
              <Botoes rotulo="Peça" itens={lista.map((p) => [p, p.nome] as const)} atual={peca} escolher={setPeca} />
            )}
            {!peca.glb && <Botoes rotulo="Estilo" itens={ESTILOS} atual={estilo} escolher={setEstilo} />}
            {foraDoAr && (
              <p className="m-0 border-2 border-dashed border-apagado bg-folha px-4 py-3 text-apagado">
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
    <Bancada pecas={lista} asset={`modelos/${conjunto}`} tipo="visualizador">
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
      <p className="m-0 border-2 border-dashed border-apagado bg-folha px-4 py-3 text-apagado">
        Em andamento: o modelo ainda não está na bancada (ou a bancada 3D está fora do ar).
      </p>
    );
  return (
    <Bancada
      pecas={[{ id: modelo, nome: 'Guerreiro', glb, zoom: 1.6 }]}
      asset="modelos/blender"
      tipo="blender"
      ficha={fichaBlender(modelo)}
    >
      {children}
    </Bancada>
  );
}
