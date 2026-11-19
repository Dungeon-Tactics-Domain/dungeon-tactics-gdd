// shadcn/ui Sheet (Radix Dialog): focus trap, Esc, overlay click and focus return come from Radix.
// Opens below the kingdom bar, from the left; slides only without prefers-reduced-motion.
import * as SheetPrimitive from '@radix-ui/react-dialog';
import type * as React from 'react';
import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof SheetPrimitive.Content>) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-x-0 top-(--reino-h) bottom-0 z-40 bg-tinta/45" />
      <SheetPrimitive.Content
        className={cn(
          'fixed top-(--reino-h) bottom-0 left-0 z-50 flex w-[min(340px,88vw)] flex-col overflow-y-auto overscroll-contain bg-folha shadow-[4px_0_0_var(--color-couro-escuro)] motion-safe:data-[state=open]:animate-[gaveta_.2s_ease-out]',
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

export { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger };
