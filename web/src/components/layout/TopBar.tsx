// Kingdom bar, fixed on every page: one dot per place (border = lab flag, fill = state), the "chama você" alert and,
// below the xl breakpoint or whenever the links do not fit, a single "☰ Labs" button whose drawer also holds the open
// lab's own menu.
import { useLayoutEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { CONTEUDO } from '@/content/registry';
import { useQuadro } from '@/lib/fabrica-context';
import { stateLabel, type Town, townsOf } from '@/lib/fabrica';
import { ARCHIVE } from '@/lib/labs';
import { cn } from '@/lib/utils';

const DOT: Record<string, string> = {
  rodando: 'bg-[#5fc283]',
  'aguardando-voce': 'bg-call motion-safe:animate-[ping-dot_1.6s_ease-out_infinite]',
  espera: 'bg-[#8fb8d8]',
  parado: 'bg-[#8c877a]',
  nenhum: 'bg-transparent',
};

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-2.5 whitespace-nowrap no-underline hover:bg-sobre-tinta/15',
    isActive && 'bg-sobre-tinta text-tinta hover:bg-sobre-tinta',
  );

function TownLink({ t }: { t: Town }) {
  const naoMigrado = t.place.antigo && !CONTEUDO[t.place.id] ? ', ainda não migrado' : '';
  const label = `${t.estado ? stateLabel(t.estado) : 'sem sessão no quadro'}${naoMigrado}`;
  const dot = (
    <i
      className={cn('size-[13px] flex-none rounded-full border-2', DOT[t.estado ?? 'nenhum'])}
      style={{ borderColor: t.place.cor }}
    />
  );
  if (!t.place.href)
    return (
      <span
        className="flex min-h-11 shrink-0 items-center gap-2 px-2.5 whitespace-nowrap text-[#b9b3a0]"
        title={`${t.place.nome}: ${label} (ainda sem página)`}
      >
        {dot}
        <span className="max-w-40 truncate">{t.place.curto}</span>
        <span className="sr-only">: {label}, ainda sem página</span>
      </span>
    );
  return (
    <NavLink
      to={t.place.href}
      className={linkCls}
      title={`${t.place.nome}: ${label}`}
      data-estado={t.estado ?? 'nenhum'}
    >
      {dot}
      <span className="max-w-40 truncate">{t.place.curto}</span>
      <span className="sr-only">: {label}</span>
    </NavLink>
  );
}

function Links({ towns }: { towns: Town[] }) {
  // order: home, the fixed places, then labs the board knows but lib/labs.ts does not, then the archive
  return (
    <>
      <NavLink to="/" end className={linkCls}>
        Início
      </NavLink>
      {towns.map((t) => (
        <TownLink key={t.place.id} t={t} />
      ))}
      <NavLink to={ARCHIVE.href} className={linkCls}>
        {ARCHIVE.nome}
      </NavLink>
    </>
  );
}

export function TopBar({
  open,
  onOpenChange,
  setSlot,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  setSlot: (el: HTMLElement | null) => void;
}) {
  const { fabrica } = useQuadro();
  const towns = townsOf(fabrica);
  const calling = towns.filter((t) => t.estado === 'aguardando-voce');
  // stations unknown to lib/labs.ts only appear in the drawer, so the fixed places keep their inline dots
  const fixos = towns.filter((t) => !t.generic);
  const extras = towns.length > fixos.length;
  // labs arrive from the board (a new session = a new town), so the inline links can outgrow the bar at any width;
  // then they stay laid out but invisible (to keep measuring) and the drawer takes over
  const nav = useRef<HTMLElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const [cheio, setCheio] = useState(false);
  const forma = fixos.map((t) => t.place.id).join('|');
  useLayoutEffect(() => {
    const n = nav.current;
    if (!n) return;
    // the room the links would have without the button (it only shows because they did not fit)
    const medir = () => setCheio(n.scrollWidth > n.clientWidth + (botao.current?.offsetWidth ?? 0) + 1);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(n);
    // the first measure can run with the fallback font, which is wider than Karla
    void document.fonts?.ready.then(medir);
    return () => ro.disconnect();
  }, [forma]);
  return (
    <header className="sticky top-0 z-50 flex h-(--reino-h) items-center gap-1 bg-tinta px-4 text-[15px] font-bold text-sobre-tinta shadow-[0_2px_0_rgba(43,42,34,.25)]">
      <NavLink
        to="/"
        className="mr-3 flex min-h-11 shrink-0 items-center font-serif text-[21px] whitespace-nowrap no-underline max-[520px]:mr-0 max-[520px]:text-lg"
      >
        <span className="max-[420px]:hidden">Reino dos Laboratórios</span>
        <span className="hidden max-[420px]:inline" aria-hidden="true">
          ◆ Reino
        </span>
        <span className="sr-only min-[421px]:hidden">Reino dos Laboratórios</span>
      </NavLink>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            ref={botao}
            variant="ghost"
            className={cn('shrink-0 border-2 border-sobre-tinta/50', !cheio && !extras && 'xl:hidden')}
            aria-label={calling.length ? 'Labs, alguém chama você' : 'Labs'}
          >
            ☰ Labs
            {calling.length > 0 && <i className="size-2.5 rounded-full bg-call" aria-hidden="true" />}
          </Button>
        </SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          <div className="flex items-center justify-between gap-2 bg-tinta px-4 py-1 text-sobre-tinta">
            <SheetTitle className="font-serif text-xl">Labs</SheetTitle>
            <SheetDescription className="sr-only">Laboratórios e o menu do lab aberto</SheetDescription>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="Fechar menu">
                ✕
              </Button>
            </SheetClose>
          </div>
          <nav aria-label="Laboratórios" className="grid bg-tinta px-2 pb-3 font-bold text-sobre-tinta">
            <Links towns={towns} />
          </nav>
          <div ref={setSlot} className="contents" />
        </SheetContent>
      </Sheet>
      <nav
        ref={nav}
        aria-label="Laboratórios"
        aria-hidden={cheio || undefined}
        className={cn('hidden min-w-0 flex-1 items-center gap-0.5 overflow-hidden xl:flex', cheio && 'invisible')}
      >
        <Links towns={fixos} />
      </nav>
      {calling.length > 0 && (
        <NavLink
          to="/#avisos"
          className="ml-auto flex min-h-11 shrink-0 items-center bg-call px-3.5 whitespace-nowrap text-tinta no-underline hover:bg-[#e9a04a] max-[520px]:px-2.5"
        >
          {/* at phone width only the bell and the name fit; the rest stays for screen readers */}
          🔔 {calling.length === 1 ? calling[0]!.place.curto : `${calling.length} labs`}
          <span className="max-[520px]:sr-only">&nbsp;{calling.length === 1 ? 'chama você' : 'chamam você'}</span>
        </NavLink>
      )}
    </header>
  );
}
