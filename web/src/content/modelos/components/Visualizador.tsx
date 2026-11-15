// The 3D bench viewer of the models lab: piece and style buttons over an iframe of the bench (eval.html), which runs in
// the game's worktree on port 5205. Same URLs and behaviour as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
import { type ReactNode, useEffect, useState } from 'react';
import pecas from '../pecas.json';

const BANCADA = 'http://localhost:5205';
const BENCH = `${BANCADA}/eval.html`;
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
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';

function Botoes<T>({
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

function Bancada({ pecas: lista, children }: { pecas: Peca[]; children?: ReactNode }) {
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
      {!semCaixa && (
        <div className="grid gap-2 border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4">
          {lista.length > 1 && (
            <Botoes rotulo="Peça" itens={lista.map((p) => [p, p.nome] as const)} atual={peca} escolher={setPeca} />
          )}
          {!peca.glb && <Botoes rotulo="Estilo" itens={ESTILOS} atual={estilo} escolher={setEstilo} />}
          {foraDoAr && (
            <p className="m-0 border border-dashed border-traco bg-bilhete px-4 py-3 text-apagado">
              A bancada não respondeu. Ela roda na porta 5205: <code>npx vite --port 5205 --strictPort</code> na
              worktree do jogo.
            </p>
          )}
        </div>
      )}
      <iframe
        src={urlDaPeca(peca, estilo)}
        title="Visualizador 3D"
        className="block aspect-[16/10] w-full border-0 bg-terra"
      />
    </>
  );
}

/** Viewer of a set of pieces from pecas.json; the children are the intro shown above it. */
export function Visualizador({ conjunto, children }: { conjunto: Conjunto; children?: ReactNode }) {
  const lista = CONJUNTOS[conjunto];
  if (!lista?.length) return <p className="m-0 text-stop">Conjunto de peças desconhecido: {conjunto}.</p>;
  return <Bancada pecas={lista}>{children}</Bancada>;
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
        Em andamento: o modelo ainda não está na bancada (ou a bancada da porta 5205 está fora do ar).
      </p>
    );
  return <Bancada pecas={[{ id: modelo, nome: 'Guerreiro', glb, zoom: 1.6 }]}>{children}</Bancada>;
}
