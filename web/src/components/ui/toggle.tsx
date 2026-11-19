// A bordered button for dark panels (tabs, cards, Mute/Solo, collapse). The pressed or selected state is drawn from the
// aria attribute, so the look can never disagree with what a screen reader hears. 44px target, 16px text.
import { cva } from 'class-variance-authority';
import type * as React from 'react';
import { Icone } from '@/components/layout/Icone';
import { cn } from '@/lib/utils';

const toggleVariants = cva(
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 border-2 border-apagado bg-transparent px-3 text-base font-bold text-creme transition-colors hover:bg-couro-claro disabled:pointer-events-none disabled:opacity-60 aria-pressed:border-ouro-claro aria-pressed:bg-ouro-claro aria-pressed:text-couro-escuro aria-pressed:hover:bg-ouro-brilho aria-selected:border-ouro-claro aria-selected:bg-ouro-claro aria-selected:text-couro-escuro aria-selected:hover:bg-ouro-brilho',
);

function Toggle({ className, icone, children, ...props }: React.ComponentProps<'button'> & { icone?: string }) {
  return (
    <button type="button" data-slot="toggle" className={cn(toggleVariants(), className)} {...props}>
      {icone && <Icone id={icone} />}
      {children}
    </button>
  );
}

export { Toggle };

// The same button on parchment (filters, choices, pagers): 2 px dark border, dark fill when pressed or checked.
export const FILTRO =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 border-2 border-couro-escuro bg-folha px-3 text-base text-tinta hover:bg-pergaminho-escuro aria-pressed:bg-couro-escuro aria-pressed:text-creme aria-checked:bg-couro-escuro aria-checked:text-creme disabled:cursor-default disabled:opacity-60';
