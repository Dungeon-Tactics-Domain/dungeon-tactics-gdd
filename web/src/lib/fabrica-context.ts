import { createContext, useContext } from 'react';
import type { Quadro } from './useFabrica';

export const FabricaContext = createContext<Quadro>({
  fabrica: null,
  conexao: 'conectando',
  idadeMs: null,
  velho: false,
  lidoEm: null,
  agora: 0,
});

export const useQuadro = () => useContext(FabricaContext);
