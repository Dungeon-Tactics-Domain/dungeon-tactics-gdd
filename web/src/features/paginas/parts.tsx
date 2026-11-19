// Small pieces of the pages pattern: cards, title, summary and breadcrumbs.
import type { ReactNode, Ref } from 'react';
import { Link } from 'react-router';

export const Icone = ({ i }: { i?: string }) => (i ? <span aria-hidden="true">{i}</span> : null);

/** The lab-coloured square that marks a title (the B-2 design's shape marker). */
export const Marca = () => <span aria-hidden="true" className="size-3.5 flex-none translate-y-px bg-lab" />;

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
            className="grid h-full min-h-11 content-start gap-1.5 border-2 border-couro-escuro bg-folha px-[18px] py-4 text-tinta no-underline shadow-folha hover:bg-lab-soft"
          >
            <span className="flex items-baseline gap-2 font-serif text-[21px] leading-tight font-bold">
              {c.icone ? <Icone i={c.icone} /> : <Marca />}
              {c.titulo}
            </span>
            {c.resumo && <span className="text-base">{c.resumo}</span>}
            {c.extra && <span className="text-base text-apagado">{c.extra}</span>}
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
      className="m-0 flex items-baseline gap-3 border-b-2 border-couro-escuro pb-2 text-(length:--h1) leading-tight text-balance focus:outline-none"
    >
      {icone ? <Icone i={icone} /> : <Marca />}
      {children}
    </h1>
  );
}

export const Resumo = ({ texto }: { texto?: string }) =>
  texto ? <p className="m-0 max-w-[72ch] text-[17px] text-apagado">{texto}</p> : null;

/** parts: [label, route relative to base]; the last one is the current page */
export function Migalhas({ partes, base }: { partes: [string, string?][]; base: string }) {
  return (
    <nav aria-label="Você está em">
      <ol className="m-0 flex list-none flex-wrap items-center p-0 text-base text-apagado">
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
