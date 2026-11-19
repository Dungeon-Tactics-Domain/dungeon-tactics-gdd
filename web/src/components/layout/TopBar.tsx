// Header, fixed on every page (B-2): the site's mark and name on a light bar with a 2 px rule. Below 1024 px it also holds
// the "Menu" button whose sheet rises from the bottom with the labs tree (from 1024 up the sidebar holds it).
import { NavLink } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SITE } from '@/lib/labs';
import { escolherTema, useTema, type Tema } from '@/lib/tema';
import { Icone } from './Icone';
import { Arvore } from './Navegacao';

// One button that walks system, light, dark. It names the theme in use and what the next press does.
const TEMAS: Record<Tema, { icone: string; nome: string; proximo: Tema }> = {
  sistema: { icone: 'sistema', nome: 'do sistema', proximo: 'light' },
  light: { icone: 'sol', nome: 'claro', proximo: 'dark' },
  dark: { icone: 'lua', nome: 'escuro', proximo: 'sistema' },
};

export function SeletorTema() {
  const { icone, nome, proximo } = TEMAS[useTema()];
  const rotulo = `Tema ${nome}. Trocar para o tema ${TEMAS[proximo].nome}`;
  return (
    <Button
      variant="outline"
      size="icon"
      icone={icone}
      className="shrink-0"
      aria-label={rotulo}
      title={rotulo}
      onClick={() => escolherTema(proximo)}
    />
  );
}

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
    <header className="sticky top-0 z-50 flex h-(--reino-h) items-center gap-1 border-b-2 border-couro-escuro bg-folha px-4 text-couro-escuro max-sm:px-2">
      <NavLink
        to="/"
        className="mr-3 flex min-h-11 shrink-0 items-center gap-3 font-serif text-[21px] font-bold whitespace-nowrap no-underline max-[520px]:mr-0 max-[520px]:text-lg"
      >
        <span
          aria-hidden="true"
          className="flex size-9 flex-none items-center justify-center border-2 border-couro-escuro bg-couro-escuro text-ouro-claro shadow-folha"
        >
          <Icone id="logo" />
        </span>
        <span className="max-[420px]:hidden">{SITE}</span>
        <span className="hidden max-[420px]:inline" aria-hidden="true">
          DT Lab
        </span>
        <span className="sr-only min-[421px]:hidden">{SITE}</span>
      </NavLink>
      <div className="ml-auto flex items-center gap-1">
        <SeletorTema />
        {estreito && (
          <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button variant="outline" icone="menu" className="shrink-0" aria-label="Menu">
                Menu
              </Button>
            </SheetTrigger>
            {/* rises from the bottom: the thumb reaches it (design lab, 15/11) */}
            <SheetContent
              aria-describedby={undefined}
              className="inset-x-0 top-auto bottom-0 max-h-[85dvh] w-full border-t-2 border-couro-escuro bg-folha motion-safe:data-[state=open]:animate-[sobe_.2s_ease-out]"
            >
              <div className="flex items-center justify-between gap-2 border-b-2 border-couro-escuro px-4 py-1">
                <SheetTitle className="font-serif text-xl">Menu</SheetTitle>
                <SheetDescription className="sr-only">Todos os labs e as páginas do lab aberto</SheetDescription>
                <SheetClose asChild>
                  <Button variant="outline" size="icon" icone="fechar" aria-label="Fechar menu" />
                </SheetClose>
              </div>
              <Arvore setSlot={setSlot} />
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}
