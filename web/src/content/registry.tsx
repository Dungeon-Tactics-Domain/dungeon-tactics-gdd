// Every lab folder in src/content registers itself: its manifest.ts gives the pages tree and each page's text is the .mdx
// file at the same route (<lab>/<group>/<page>.mdx, subpages one folder deeper, the lab home in <lab>/inicio.mdx).
// No central list to edit, so labs migrate in parallel without touching each other's files.
// Sumarios are built once here: Paginas needs a stable object (its exit hook is keyed on it) and each lazy() must be
// created once, or every live board update would remount the page.
/* eslint-disable react-refresh/only-export-components -- data module; OrigemAntiga is a local helper, never hot-reloaded alone */
import { type ComponentType, lazy, Suspense } from 'react';
import { MDX_COMPONENTS } from '@/components/content/mdx';
import type { Pagina, Sumario } from '@/features/paginas/types';
import { ehLocal, OLD_LAB } from '@/lib/labs';
import type { Manifesto, PaginaManifesto } from './types';

type MdxModule = { default: ComponentType<{ components?: typeof MDX_COMPONENTS }> };
type Carregar = () => Promise<MdxModule>;

export interface LabConteudo {
  sumario: Sumario;
  /** .mdx files of the lab that no page or the home uses: a typo in a file name or a page id */
  orfaos: string[];
  /** routes of pages with neither an .mdx file nor subpages: they would open empty */
  vazias: string[];
}

function mdxPagina(carregar: Carregar) {
  // pages load on demand: one chunk per page, not every lab in the first download
  const Texto = lazy(carregar);
  return () => (
    <Suspense fallback={<p className="m-0 text-apagado">Carregando…</p>}>
      <Texto components={MDX_COMPONENTS} />
    </Suspense>
  );
}

function OrigemAntiga({ origem }: { origem: NonNullable<Manifesto['origem']> }) {
  const quando = new Date(origem.copiadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  return (
    <p className="m-0 max-w-[110ch] text-base text-apagado">
      Conteúdo copiado do lab antigo em {quando} ({origem.fonte}).{' '}
      {ehLocal() && (
        <a
          href={`${OLD_LAB}${origem.caminho}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-lab underline underline-offset-2"
        >
          Ver no lab antigo ↗
        </a>
      )}
    </p>
  );
}

/** Builds one lab's Sumario from its manifest and the .mdx loaders (keys like "./modelos/estilos/psx.mdx"). */
export function montarLab(id: string, m: Manifesto, mdx: Record<string, Carregar>): LabConteudo {
  const usados = new Set<string>();
  const vazias: string[] = [];
  const achar = (rota: string) => {
    const k = `./${id}/${rota}.mdx`;
    if (!mdx[k]) return undefined;
    usados.add(k);
    return mdxPagina(mdx[k]);
  };
  const pagina = (p: PaginaManifesto, pai: string): Pagina => {
    const rota = `${pai}/${p.id}`;
    const conteudo = achar(rota);
    if (!conteudo && !p.subpaginas?.length) vazias.push(rota);
    return { ...p, conteudo, subpaginas: p.subpaginas?.map((sp) => pagina(sp, rota)) };
  };
  const inicio = achar('inicio');
  const { origem, grupos, ...resto } = m;
  const sumario: Sumario = {
    ...resto,
    lab: id,
    inicio:
      inicio || origem
        ? () => (
            <>
              {inicio?.()}
              {origem && <OrigemAntiga origem={origem} />}
            </>
          )
        : undefined,
    grupos: grupos.map((g) => ({ ...g, paginas: g.paginas.map((p) => pagina(p, g.id)) })),
  };
  const orfaos = Object.keys(mdx).filter((k) => k.startsWith(`./${id}/`) && !usados.has(k));
  return { sumario, orfaos, vazias };
}

const MANIFESTOS = import.meta.glob<Manifesto>('./*/manifest.ts', { eager: true, import: 'default' });
const MDX = import.meta.glob<MdxModule>('./*/**/*.mdx');

/** Migrated labs by id (the folder name, which is also the lab id in lib/labs.ts). */
export const CONTEUDO: Record<string, LabConteudo> = Object.fromEntries(
  Object.entries(MANIFESTOS).map(([caminho, m]) => {
    const id = caminho.split('/')[1]!;
    return [id, montarLab(id, m, MDX)];
  }),
);
