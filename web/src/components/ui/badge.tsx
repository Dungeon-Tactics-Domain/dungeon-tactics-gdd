// shadcn/ui Badge with one variant per board state. Text always says the state; colour only reinforces it.
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-block whitespace-nowrap px-2 py-0.5 text-base font-bold leading-tight', {
  variants: {
    estado: {
      rodando: 'bg-sucesso text-white',
      'aguardando-voce': 'bg-ouro-claro text-tinta',
      espera: 'bg-link text-white',
      parado: 'bg-apagado text-white',
      nenhum: 'border-2 border-dashed border-apagado text-apagado',
    },
  },
  defaultVariants: { estado: 'nenhum' },
});

function Badge({ className, estado, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ estado }), className)} {...props} />;
}

export { Badge };
