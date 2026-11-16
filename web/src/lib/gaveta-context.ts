import { createContext, useContext } from 'react';

/**
 * Where a lab page puts its own menu: the sidebar from 1024 px, the sheet below it. `slot` null = hidden right now
 * (sheet closed); undefined = no shell around the page (tests), so the menu renders in place. `recolhida` = the sidebar
 * is an icon rail.
 */
export interface Gaveta {
  slot: HTMLElement | null | undefined;
  recolhida: boolean;
  fechar: () => void;
}
export const GavetaContext = createContext<Gaveta>({ slot: undefined, recolhida: false, fechar: () => {} });
export const useGaveta = () => useContext(GavetaContext);
