import { useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { GavetaContext } from '@/lib/gaveta-context';
import { ESTREITO, SEM_DESKTOP, useMediaQuery } from '@/lib/useMediaQuery';
import { Lateral, MenuInferior } from './Navegacao';
import { TopBar } from './TopBar';

export function Shell() {
  const estreito = useMediaQuery(ESTREITO);
  const semDesktop = useMediaQuery(SEM_DESKTOP);
  const [open, setOpen] = useState(false);
  // the sheet's or the sidebar's slot: only one of them is mounted at a time
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  // the lying tablet starts with the icon rail, wider screens open; the reader's toggle wins at any size
  const [recolher, setRecolher] = useState<boolean | null>(null);
  const recolhida = recolher ?? semDesktop;
  // any navigation closes the sheet; keyed on the location instead of an effect
  const { key } = useLocation();
  const [openAt, setOpenAt] = useState(key);
  const isOpen = open && openAt === key;
  const onOpenChange = (o: boolean) => {
    setOpen(o);
    setOpenAt(key);
  };
  return (
    <GavetaContext
      value={{
        slot: estreito && !isOpen ? null : slot,
        recolhida: !estreito && recolhida,
        fechar: () => setOpen(false),
      }}
    >
      <TopBar estreito={estreito} open={isOpen} onOpenChange={onOpenChange} setSlot={setSlot} />
      {/* one tree at every size: turning the tablet must not remount the page (scroll, state, exit hooks) */}
      <div className={estreito ? 'pb-(--nav-h)' : 'flex'}>
        {!estreito && <Lateral recolhida={recolhida} alternar={() => setRecolher(!recolhida)} setSlot={setSlot} />}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
        {estreito && <MenuInferior />}
      </div>
    </GavetaContext>
  );
}
