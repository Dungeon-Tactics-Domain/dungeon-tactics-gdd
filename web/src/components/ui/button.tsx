// shadcn/ui Button, resized for the kingdom: 44px targets and 15px+ text.
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-[15px] font-bold no-underline transition-colors disabled:pointer-events-none disabled:opacity-60 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-[#45432f]',
        outline: 'border-2 border-tinta bg-transparent text-tinta hover:bg-terra',
        ghost: 'bg-transparent hover:bg-white/15',
        lab: 'bg-lab text-white hover:opacity-90',
      },
      size: { default: '', icon: 'size-11 px-0' },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button };
