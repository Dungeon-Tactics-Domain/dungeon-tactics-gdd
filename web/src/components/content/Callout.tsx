// A boxed note in lab pages. "destaque" is the old lab's `.box.now` (lab-coloured left edge), "simples" its plain `.box`.
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
        'grid max-w-[110ch] gap-3 border-2 border-couro-escuro bg-folha px-5 py-4 shadow-folha',
        tom === 'destaque' && 'border-l-[10px] border-l-lab',
        tom === 'aviso' && 'border-dashed shadow-none',
      )}
    >
      {titulo && <h2 className="m-0 text-[21px] leading-tight">{titulo}</h2>}
      {children}
    </div>
  );
}
