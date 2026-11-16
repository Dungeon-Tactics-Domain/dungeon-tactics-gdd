// Header, fixed on every page: the site's name, from 1024 px the places (home, Fábrica, the labs), the "chama você" alert
// and, below 1024 px, the "☰ Menu" button whose sheet rises from the bottom with every place and the open lab's own pages
// (from 1024 up the sidebar holds those pages).
import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SITE } from '@/lib/labs';
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
  return (
    <header className="sticky top-0 z-50 flex h-(--reino-h) items-center gap-1 bg-casca-topo px-4 text-[15px] font-bold text-casca-topo-texto shadow-[0_2px_0_rgba(43,42,34,.25)] max-sm:px-2">
      <NavLink
        to="/"
        className="mr-3 flex min-h-11 shrink-0 items-center font-serif text-[21px] whitespace-nowrap no-underline max-[520px]:mr-0 max-[520px]:text-lg"
      >
        <span className="max-[420px]:hidden">{SITE}</span>
        <span className="hidden max-[420px]:inline" aria-hidden="true">
          ◆ DT Lab
        </span>
        <span className="sr-only min-[421px]:hidden">{SITE}</span>
      </NavLink>
      {!estreito && (
        <nav aria-label="Laboratórios" className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          <Links />
        </nav>
      )}
      <div className="ml-auto flex items-center gap-1">
        {estreito && (
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                icone="menu"
                className="shrink-0 border-2 border-casca-topo-texto/50"
                aria-label="Menu"
              >
                Menu
              </Button>
            </SheetTrigger>
            {/* rises from the bottom, over the labs menu: the thumb reaches it (design lab, 15/11) */}
            <SheetContent
              aria-describedby={undefined}
              className="inset-x-0 top-auto bottom-0 max-h-[85dvh] w-full bg-casca-lateral motion-safe:data-[state=open]:animate-[sobe_.2s_ease-out]"
            >
              <div className="flex items-center justify-between gap-2 bg-casca-topo px-4 py-1 text-casca-topo-texto">
                <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
                <SheetDescription className="sr-only">Todos os lugares e as páginas do lab aberto</SheetDescription>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" icone="fechar" aria-label="Fechar menu" />
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
