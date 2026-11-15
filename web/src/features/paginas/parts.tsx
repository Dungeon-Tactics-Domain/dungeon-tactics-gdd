// Small pieces of the pages pattern: cards, title, summary and breadcrumbs.
import type { ReactNode, Ref } from 'react';
import { Link } from 'react-router';

export const Icone = ({ i }: { i?: string }) => (i ? <span aria-hidden="true">{i}</span> : null);

export interface Cartao {
  rota: string;
  titulo: string;
  icone?: string;
  resumo?: string;
  extra?: string;
}

export function Cartoes({ itens, base }: { itens: Cartao[]; base: string }) {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5 p-0 max-[700px]:grid-cols-1">
      {itens.map((c) => (
        <li key={c.rota}>
          {/* the full summary, never clamped (request from the labs, 14/11) */}
          <Link
            to={`${base}/${c.rota}`}
            className="grid h-full min-h-11 content-start gap-1.5 border border-t-[6px] border-borda border-t-lab bg-folha px-[18px] py-4 text-tinta no-underline hover:bg-lab-soft"
          >
            <span className="flex gap-2 font-serif text-[21px] leading-tight font-bold">
              <Icone i={c.icone} />
              {c.titulo}
            </span>
            {c.resumo && <span className="text-[15px]">{c.resumo}</span>}
            {c.extra && <span className="text-sm text-apagado">{c.extra}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Titulo({
  children,
  icone,
  ref,
}: {
  children: ReactNode;
  icone?: string;
  ref: Ref<HTMLHeadingElement>;
}) {
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className="m-0 flex items-baseline gap-3 text-[34px] leading-tight text-balance focus:outline-none max-[700px]:text-[28px]"
    >
      <Icone i={icone} />
      {children}
    </h1>
  );
}

export const Resumo = ({ texto }: { texto?: string }) =>
  texto ? <p className="-mt-2 mb-0 max-w-[72ch] text-[17px] text-apagado">{texto}</p> : null;

/** parts: [label, route relative to base]; the last one is the current page */
export function Migalhas({ partes, base }: { partes: [string, string?][]; base: string }) {
  return (
    <nav aria-label="Você está em">
      <ol className="m-0 flex list-none flex-wrap items-center p-0 text-[15px] text-apagado">
        {partes.map(([nome, r], i) => (
          <li key={`${i}-${nome}`} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="mx-2">
                ›
              </span>
            )}
            {i < partes.length - 1 ? (
              <Link to={r ? `${base}/${r}` : base} className="inline-flex min-h-11 items-center text-lab">
                {nome}
              </Link>
            ) : (
              <span aria-current="page" className="text-tinta">
                {nome}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
