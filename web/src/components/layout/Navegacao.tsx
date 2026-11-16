// The labs' navigation per band (design lab, 15/11): from 1024 px a sidebar (an icon rail below 1440, open above it, and
// from 1440 dragged wider or narrower by its edge); below 1024 the 5 labs in a bottom menu. The links list (home, places,
// decisions, one dot per place: border = lab flag, fill = state) is the same in the sidebar and the phone sheet.
import { type KeyboardEvent, type PointerEvent, type ReactNode, useState } from 'react';
import { NavLink } from 'react-router';
import { CONTEUDO } from '@/content/registry';
import { useQuadro } from '@/lib/fabrica-context';
import { stateLabel, type Town, townsOf } from '@/lib/fabrica';
import { LABS } from '@/lib/labs';
import { DECISOES_ATIVAS } from '@/lib/recursos';
import { SEM_DESKTOP, SEM_ULTRA, useMediaQuery } from '@/lib/useMediaQuery';
import { cn, gravar, ler } from '@/lib/utils';
import { Icone } from './Icone';

const DOT: Record<string, string> = {
  rodando: 'bg-[#5fc283]',
  'aguardando-voce': 'bg-ouro-claro motion-safe:animate-[ping-dot_1.6s_ease-out_infinite]',
  espera: 'bg-[#8fb8d8]',
  parado: 'bg-[#8c877a]',
  nenhum: 'bg-transparent',
};

const linkCls =
  (recolhida: boolean) =>
  ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-2.5 whitespace-nowrap no-underline hover:bg-casca-topo-texto/15',
      recolhida && 'justify-center px-0',
      isActive && 'bg-casca-topo-texto text-casca-topo hover:bg-casca-topo-texto',
    );

/** A link's face: the full name, or in the rail a 2-letter seal in the place's colour with the dot on its corner. */
function Face({
  nome,
  icone,
  sinal,
  cor,
  dot,
  recolhida,
}: {
  nome: string;
  icone: string;
  sinal: string;
  cor?: string;
  dot?: ReactNode;
  recolhida: boolean;
}) {
  if (!recolhida)
    return (
      <>
        {dot}
        <Icone id={icone} />
        {/* between 1024 and 1199 px the bar has no room for 7 names: icon only, the name stays as tooltip and for readers */}
        <span className="max-w-60 truncate min-[1024px]:max-[1199px]:sr-only">{nome}</span>
      </>
    );
  return (
    <span className="relative">
      <span
        aria-hidden="true"
        // white on a place's colour stays above 4.5:1 (lib/labs.ts)
        className={cn(
          'flex size-9 items-center justify-center rounded-sm border-2 border-casca-topo-texto/50 text-[14px]',
          cor && 'text-white',
        )}
        style={cor ? { background: cor, borderColor: cor } : undefined}
      >
        {sinal}
      </span>
      {dot && <span className="absolute -top-1 -right-1 flex">{dot}</span>}
      <span className="sr-only">{nome}</span>
    </span>
  );
}

function TownLink({ t, recolhida }: { t: Town; recolhida: boolean }) {
  // without the board (public site) every dot would read "sem sessão", so the indicator goes away
  const semApi = useQuadro().conexao === 'sem-api';
  const naoMigrado = t.place.antigo && !CONTEUDO[t.place.id] ? ', ainda não migrado' : '';
  const label = semApi
    ? naoMigrado.slice(2) || 'lab'
    : `${t.estado ? stateLabel(t.estado) : 'sem sessão no quadro'}${naoMigrado}`;
  const dot = semApi ? null : (
    <i
      className={cn('size-[13px] flex-none rounded-full border-2', DOT[t.estado ?? 'nenhum'])}
      style={{ borderColor: t.place.cor }}
    />
  );
  const face = (
    <Face nome={t.place.curto} icone={t.place.id} sinal={t.place.curto.slice(0, 2)} cor={t.place.cor} dot={dot} recolhida={recolhida} />
  );
  if (!t.place.href)
    return (
      <span
        className={cn(linkCls(recolhida)({ isActive: false }), 'opacity-70 hover:bg-transparent')}
        title={`${t.place.nome}: ${label} (ainda sem página)`}
      >
        {face}
        <span className="sr-only">: {label}, ainda sem página</span>
      </span>
    );
  return (
    <NavLink
      to={t.place.href}
      className={linkCls(recolhida)}
      title={`${t.place.nome}: ${label}`}
      data-estado={t.estado ?? 'nenhum'}
    >
      {face}
      <span className="sr-only">: {label}</span>
    </NavLink>
  );
}

/** Home, the fixed places, labs the board knows but lib/labs.ts does not, then decisions. */
export function Links({ recolhida = false }: { recolhida?: boolean }) {
  const towns = townsOf(useQuadro().fabrica);
  return (
    <>
      <NavLink to="/" end className={linkCls(recolhida)} title="Início">
        <Face nome="Início" icone="inicio" sinal="◆" recolhida={recolhida} />
      </NavLink>
      {towns.map((t) => (
        <TownLink key={t.place.id} t={t} recolhida={recolhida} />
      ))}
      {DECISOES_ATIVAS && (
        <NavLink to="/decisoes" className={linkCls(recolhida)} title="Decisões">
          <Face nome="Decisões" icone="decisoes" sinal="✓" recolhida={recolhida} />
        </NavLink>
      )}
    </>
  );
}

// drag limits: under 220 the lab menus wrap every title, over 480 the page loses too much width on a 1440 screen
const MIN = 220;
const MAX = 480;
const RAIL = 72;
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
      className="sticky top-(--reino-h) z-30 flex h-[calc(100dvh-var(--reino-h))] flex-none flex-col self-start border-r-[6px] border-casca-borda bg-casca-lateral"
    >
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
        <nav
          aria-label="Barra lateral"
          className={cn(
            'grid gap-0.5 bg-casca-topo py-2 font-bold text-casca-topo-texto',
            recolhida ? 'px-1.5' : 'px-2',
          )}
        >
          <button
            type="button"
            aria-expanded={!recolhida}
            aria-label={recolhida ? 'Abrir a barra lateral' : 'Recolher a barra lateral'}
            title={recolhida ? 'Abrir a barra lateral' : 'Recolher a barra lateral'}
            onClick={alternar}
            className={cn(
              linkCls(recolhida)({ isActive: false }),
              'cursor-pointer border-2 border-casca-topo-texto/50 font-bold',
            )}
          >
            <Icone id={recolhida ? 'expandir' : 'recolher'} />
            {!recolhida && 'Recolher'}
          </button>
        </nav>
        <div ref={setSlot} className="contents" />
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
          className="absolute top-0 -right-[9px] h-full w-3 cursor-col-resize touch-none hover:bg-casca-borda/40 focus-visible:bg-casca-borda/40"
        />
      )}
    </aside>
  );
}

/** Phone and standing tablet: the 5 labs at the thumb. */
export function MenuInferior() {
  return (
    <nav
      aria-label="Labs"
      className="fixed inset-x-0 bottom-0 z-40 grid h-(--nav-h) grid-cols-5 border-t border-borda bg-casca-lateral"
    >
      {LABS.map((l) => (
        <NavLink
          key={l.id}
          to={l.href ?? '/'}
          title={l.nome}
          // the active mark is gold: the labs' own colours fall under 3:1 on the leather bar
          className="flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 border-t-4 border-transparent text-[14px] text-creme no-underline aria-[current=page]:border-casca-titulo aria-[current=page]:font-bold"
        >
          <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-md text-white" style={{ background: l.cor }}>
            <Icone id={l.id} className="size-[18px]" />
          </span>
          <span className="max-w-full truncate">{l.curto}</span>
        </NavLink>
      ))}
    </nav>
  );
}
