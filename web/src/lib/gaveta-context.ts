import { createContext, useContext } from 'react';

/** The "☰ Labs" drawer: a lab page portals its own menu into `slot` on small screens, so there is one menu button only. */
export interface Gaveta {
  slot: HTMLElement | null;
  fechar: () => void;
}
export const GavetaContext = createContext<Gaveta>({ slot: null, fechar: () => {} });
export const useGaveta = () => useContext(GavetaContext);
