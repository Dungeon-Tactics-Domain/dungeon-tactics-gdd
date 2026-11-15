// A boxed note in lab pages. "destaque" is the old lab's `.box.now` (lab-coloured top edge), "simples" its plain `.box`.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Callout({
  tom = 'destaque',
  titulo,
  children,
}: {
  tom?: 'destaque' | 'simples' | 'aviso';
  titulo?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-3 border border-borda bg-folha px-5 py-4',
        tom === 'destaque' && 'border-t-[6px] border-t-lab',
        tom === 'aviso' && 'border-dashed border-traco bg-bilhete',
      )}
    >
      {titulo && <h2 className="m-0 text-[21px] leading-tight">{titulo}</h2>}
      {children}
    </div>
  );
}
