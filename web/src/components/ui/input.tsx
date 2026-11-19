import type * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'min-h-11 w-full border-2 border-input bg-campo px-3 text-base text-tinta placeholder:text-apagado',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
