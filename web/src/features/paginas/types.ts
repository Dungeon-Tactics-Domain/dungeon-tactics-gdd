import type { ReactNode } from 'react';

export interface Pagina {
  /** goes in the URL: lowercase letters, digits and hyphens, unique inside its parent */
  id: string;
  /** short, fits one menu line (~28 characters) */
  titulo: string;
  icone?: string;
  /** marks the page the work is on now: highlighted in the menu with this label (e.g. "Em andamento") */
  destaque?: string;
  /** one sentence, shown in full on the card */
  resumo?: string;
  /** rendered only while the page is open; without it, the page shows its subpages as cards */
  conteudo?: () => ReactNode;
  /** called when the reader leaves this page (route change or unmount), e.g. to tear down an embedded game */
  aoSair?: () => void;
  /** third and last level */
  subpaginas?: Pagina[];
}

export interface Grupo {
  id: string;
  titulo: string;
  icone?: string;
  resumo?: string;
  paginas: Pagina[];
}

export interface Sumario {
  /** lab id: key of the remembered group */
  lab: string;
  titulo: string;
  resumo?: string;
  /** extra content on the lab's home, above the group cards */
  inicio?: () => ReactNode;
  grupos: Grupo[];
  /** route that opens instead of the lab home and of its group page, e.g. 'estudio/musicas' (a lab that is one tool) */
  paginaInicial?: string;
  /** old in-page anchors to new routes, e.g. { fases: 'decisoes/fases' }; applied on entry and while the lab is open */
  linksAntigos?: Record<string, string>;
}
