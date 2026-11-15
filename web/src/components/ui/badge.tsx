// shadcn/ui Badge with one variant per board state. Text always says the state; colour only reinforces it.
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-block whitespace-nowrap px-2 py-0.5 text-sm font-bold leading-tight', {
  variants: {
    estado: {
      rodando: 'bg-run text-white',
      'aguardando-voce': 'bg-call text-tinta',
      espera: 'bg-wait text-white',
      parado: 'bg-idle text-white',
      nenhum: 'border border-dashed border-apagado text-apagado',
    },
  },
  defaultVariants: { estado: 'nenhum' },
});

function Badge({ className, estado, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ estado }), className)} {...props} />;
}

export { Badge };
