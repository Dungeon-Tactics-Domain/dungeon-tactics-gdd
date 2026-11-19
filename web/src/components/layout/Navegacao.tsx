// The labs' navigation, B-2 (Stitch, 18/11): one tree of every lab in a boxed panel. From 1024 px it is a sidebar (an icon
// rail below 1440, open above it, and from 1440 dragged wider or narrower by its edge); below 1024 the same tree sits in
// the sheet of the "Menu" button. The open lab's own pages (Paginas) are portalled under its row, through `setSlot`.
import { Fragment, type KeyboardEvent, type PointerEvent, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { CONTEUDO } from '@/content/registry';
import { LABS, type Place } from '@/lib/labs';
import { DECISOES_ATIVAS } from '@/lib/recursos';
import { SEM_DESKTOP, SEM_ULTRA, useMediaQuery } from '@/lib/useMediaQuery';
import { cn, gravar, ler } from '@/lib/utils';
import { Icone } from './Icone';

const linkCls =
  (recolhida: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 w-full items-center gap-2 border-2 border-transparent px-2.5 text-base font-bold text-tinta no-underline hover:bg-pergaminho-escuro',
      recolhida && 'justify-center px-0',
      isActive && 'bg-couro-escuro text-creme hover:bg-couro-escuro',
    );

/** A link's face: the full name, or in the rail a 2-letter seal in the place's colour. */
function Face({
  nome,
  icone,
  sinal,
  cor,
  recolhida,
}: {
  nome: string;
  icone: string;
  sinal: string;
  cor?: string;
  recolhida: boolean;
}) {
  if (!recolhida)
    return (
      <>
        <Icone id={icone} />
        <span className="min-w-0 flex-1 truncate">{nome}</span>
      </>
    );
  return (
    <span className="relative">
      <span
        aria-hidden="true"
        // white on a place's colour stays above 4.5:1 (lib/labs.ts)
        className={cn(
          'flex size-9 items-center justify-center border-2 border-couro-escuro text-base',
          cor && 'text-white',
        )}
        style={cor ? { background: cor } : undefined}
      >
        {sinal}
      </span>
      <span className="sr-only">{nome}</span>
    </span>
  );
}

function LabLink({ p, recolhida, ativo }: { p: Place; recolhida: boolean; ativo: boolean }) {
  const naoMigrado = p.antigo && !CONTEUDO[p.id] ? ', ainda não migrado' : '';
  const face = <Face nome={p.curto} icone={p.id} sinal={p.curto.slice(0, 2)} cor={p.cor} recolhida={recolhida} />;
  if (!p.href)
    return (
      <span
        className={cn(linkCls(recolhida)({ isActive: false }), 'opacity-70 hover:bg-transparent')}
        title={`${p.nome} (ainda sem página)`}
      >
        {face}
        <span className="sr-only">: ainda sem página</span>
      </span>
    );
  return (
    <NavLink to={p.href} className={linkCls(recolhida)} title={p.nome}>
      {face}
      {naoMigrado && <span className="sr-only">{naoMigrado.slice(1)}</span>}
      {!recolhida && (
        <span aria-hidden="true" className="flex-none text-base">
          {ativo ? '▾' : '▸'}
        </span>
      )}
    </NavLink>
  );
}

/** The tree: home, then every lab; the open lab's own pages go under its row (the slot). */
export function Arvore({
  recolhida = false,
  setSlot,
}: {
  recolhida?: boolean;
  setSlot: (el: HTMLElement | null) => void;
}) {
  const { pathname } = useLocation();
  const aberto = LABS.find((l) => l.href && (pathname === l.href || pathname.startsWith(`${l.href}/`)));
  return (
    <div className={cn('grid gap-1 py-2', recolhida ? 'px-1.5' : 'px-2')}>
      <nav aria-label="Laboratórios" className="grid gap-1">
        <NavLink to="/" end className={linkCls(recolhida)} title="Início">
          <Face nome="Início" icone="inicio" sinal="◆" recolhida={recolhida} />
        </NavLink>
        {LABS.map((p) => (
          <Fragment key={p.id}>
            <LabLink p={p} recolhida={recolhida} ativo={p === aberto} />
            {p === aberto && <div ref={setSlot} className="contents" />}
          </Fragment>
        ))}
        {DECISOES_ATIVAS && (
          <NavLink to="/decisoes" className={linkCls(recolhida)} title="Decisões">
            <Face nome="Decisões" icone="decisoes" sinal="✓" recolhida={recolhida} />
          </NavLink>
        )}
      </nav>
    </div>
  );
}

// drag limits: under 220 the lab menus wrap every title, over 480 the page loses too much width on a 1440 screen
const MIN = 220;
const MAX = 480;
const RAIL = 88;
const CHAVE = 'casca:largura';
const limitar = (n: number) => Math.round(Math.min(MAX, Math.max(MIN, n)));

export function Lateral({
  recolhida,
  alternar,
  setSlot,
}: {
  recolhida: boolean;
  alternar: () => void;
  setSlot: (el: HTMLElement | null) => void;
}) {
  const arrasta = !useMediaQuery(SEM_DESKTOP);
  const ultra = !useMediaQuery(SEM_ULTRA);
  // the width the reader dragged to, remembered between visits; a bad stored value falls back to the band's default
  const [largura, setLargura] = useState(() => {
    const n = Number(ler(CHAVE));
    return ler(CHAVE) && Number.isFinite(n) ? limitar(n) : null;
  });
  const aberta = arrasta ? (largura ?? (ultra ? 320 : 280)) : 280;
  const w = recolhida ? RAIL : aberta;
  const mudar = (n: number) => {
    const v = limitar(n);
    setLargura(v);
    gravar(CHAVE, String(v));
  };
  const arrastar = (e: PointerEvent<HTMLDivElement>) => {
    // the sidebar starts at the window's left edge, so the pointer's x is the new width
    if (e.currentTarget.hasPointerCapture(e.pointerId)) mudar(e.clientX);
  };
  const teclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const passo = { ArrowLeft: -16, ArrowRight: 16, Home: MIN - aberta, End: MAX - aberta }[e.key];
    if (passo === undefined) return;
    e.preventDefault();
    mudar(aberta + passo);
  };
  return (
    <aside
      aria-label="Barra lateral"
      style={{ width: w }}
      className="sticky top-(--reino-h) z-30 h-[calc(100dvh-var(--reino-h))] flex-none self-start p-3 pr-4"
    >
      {/* the boxed panel of the B-2 design: 2 px border, hard shadow; it is as tall as its tree, up to the window */}
      <div className="flex max-h-full min-h-0 flex-col overflow-y-auto overscroll-contain border-2 border-couro-escuro bg-folha shadow-couro">
        <div className="px-2 pt-2">
          <button
            type="button"
            aria-expanded={!recolhida}
            aria-label={recolhida ? 'Abrir a barra lateral' : 'Recolher a barra lateral'}
            title={recolhida ? 'Abrir a barra lateral' : 'Recolher a barra lateral'}
            onClick={alternar}
            className={cn(linkCls(recolhida)({ isActive: false }), 'cursor-pointer border-couro-escuro')}
          >
            <Icone id={recolhida ? 'expandir' : 'recolher'} />
            {!recolhida && 'Recolher'}
          </button>
        </div>
        <Arvore recolhida={recolhida} setSlot={setSlot} />
      </div>
      {arrasta && !recolhida && (
        // a focusable separator is the ARIA window splitter: arrows, Home and End move it
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Largura da barra lateral"
          aria-valuenow={aberta}
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          tabIndex={0}
          onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
          onPointerMove={arrastar}
          onKeyDown={teclas}
          title="Arraste ou use as setas para mudar a largura"
          className="absolute top-0 right-0 h-full w-3 cursor-col-resize touch-none hover:bg-couro-escuro/20 focus-visible:bg-couro-escuro/20"
        />
      )}
    </aside>
  );
}
