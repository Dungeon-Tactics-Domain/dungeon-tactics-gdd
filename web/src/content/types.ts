// The typed manifest of one lab (src/content/<lab>/manifest.ts). It is the pages tree of features/paginas without the
// content: each page's text comes from the .mdx file at its route (see registry.tsx and LEIA-ME.md).
import type { Grupo, Pagina, Sumario } from '@/features/paginas/types';

export interface PaginaManifesto extends Omit<Pagina, 'conteudo' | 'subpaginas'> {
  subpaginas?: PaginaManifesto[];
}

export interface GrupoManifesto extends Omit<Grupo, 'paginas'> {
  paginas: PaginaManifesto[];
}

export interface Manifesto extends Omit<Sumario, 'lab' | 'inicio' | 'grupos'> {
  grupos: GrupoManifesto[];
  /** where the content was copied from; the lab home links back to it while the old lab runs */
  origem?: {
    /** path on the old lab (port 5190), e.g. "/modelos/" */
    caminho: string;
    /** source files of the copy, e.g. "dungeon-tactics-lab/modelos (index.html, src/main.ts)" */
    fonte: string;
    /** ISO date and time of the copy, with the offset */
    copiadoEm: string;
  };
}
