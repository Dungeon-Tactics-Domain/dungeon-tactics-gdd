// Header, fixed on every page: the site's name, the "chama você" alert and, below 1024 px, the "☰ Menu" button whose
// sheet rises from the bottom with every place and the open lab's own pages (the sidebar holds them from 1024 up).
import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useQuadro } from '@/lib/fabrica-context';
import { townsOf } from '@/lib/fabrica';
import { Links } from './Navegacao';

export function TopBar({
  estreito,
  open,
  onOpenChange,
  setSlot,
}: {
  estreito: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  setSlot: (el: HTMLElement | null) => void;
}) {
  const calling = townsOf(useQuadro().fabrica).filter((t) => t.estado === 'aguardando-voce');
  return (
    <header className="sticky top-0 z-50 flex h-(--reino-h) items-center gap-1 bg-casca-topo px-4 text-[15px] font-bold text-casca-topo-texto shadow-[0_2px_0_rgba(43,42,34,.25)] max-sm:px-2">
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
      <div className="ml-auto flex items-center gap-1">
        {calling.length > 0 && (
          <NavLink
            to="/#avisos"
            className="flex min-h-11 shrink-0 items-center bg-call px-3.5 whitespace-nowrap text-tinta no-underline hover:bg-[#e9a04a] max-[520px]:px-2.5"
          >
            {/* at phone width only the bell and the name fit; the rest stays for screen readers */}
            🔔 {calling.length === 1 ? calling[0]!.place.curto : `${calling.length} labs`}
            <span className="max-[520px]:sr-only">&nbsp;{calling.length === 1 ? 'chama você' : 'chamam você'}</span>
          </NavLink>
        )}
        {estreito && (
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="shrink-0 border-2 border-casca-topo-texto/50"
                aria-label={calling.length ? 'Menu, alguém chama você' : 'Menu'}
              >
                ☰ Menu
              </Button>
            </SheetTrigger>
            {/* rises from the bottom, over the labs menu: the thumb reaches it (design lab, 15/11) */}
            <SheetContent
              aria-describedby={undefined}
              className="inset-x-0 top-auto bottom-0 max-h-[85dvh] w-full motion-safe:data-[state=open]:animate-[sobe_.2s_ease-out]"
            >
              <div className="flex items-center justify-between gap-2 bg-casca-topo px-4 py-1 text-casca-topo-texto">
                <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
                <SheetDescription className="sr-only">Todos os lugares e as páginas do lab aberto</SheetDescription>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" aria-label="Fechar menu">
                    ✕
                  </Button>
                </SheetClose>
              </div>
              <nav aria-label="Laboratórios" className="grid bg-casca-topo px-2 pb-3 font-bold text-casca-topo-texto">
                <Links />
              </nav>
              <div ref={setSlot} className="contents" />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}
