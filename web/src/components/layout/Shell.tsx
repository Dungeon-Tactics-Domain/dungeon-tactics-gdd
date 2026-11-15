import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { GavetaContext } from '@/lib/gaveta-context';
import { TopBar } from './TopBar';

export function Shell() {
  const [open, setOpen] = useState(false);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  // any navigation closes the drawer; keyed on the location instead of an effect
  const { key } = useLocation();
  const [openAt, setOpenAt] = useState(key);
  const isOpen = open && openAt === key;
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    setOpenAt(key);
  };
  return (
    <GavetaContext value={{ slot: isOpen ? slot : null, fechar: () => setOpen(false) }}>
      <TopBar open={isOpen} onOpenChange={onOpenChange} setSlot={setSlot} />
      <Outlet />
    </GavetaContext>
  );
}
