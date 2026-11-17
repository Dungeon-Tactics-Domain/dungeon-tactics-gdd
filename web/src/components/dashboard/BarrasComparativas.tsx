// Horizontal bars grouped by row, one bar per series, with a legend and the value printed at the end of each bar (a phone
// or a screenshot has no pointer, so no value hides in a tooltip). A missing value says "não medido" instead of a gap.
import type { ReactNode } from 'react';
import { NAO_MEDIDO, numero, type Serie } from './series';

export interface LinhaBarras {
  rotulo: string;
  valores: Record<string, number | null | undefined>;
}

export function Legenda({ series }: { series: Serie[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[15px]" aria-label="Legenda">
      {series.map((s) => (
        <li key={s.id} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block size-3.5 rounded-sm" style={{ background: s.cor }} />
          {s.nome}
        </li>
      ))}
    </ul>
  );
}

export function BarrasComparativas({
  titulo,
  series,
  linhas,
  unidade = '',
  maximo,
  nota,
}: {
  titulo: string;
  series: Serie[];
  linhas: LinhaBarras[];
  /** after each value, e.g. " fps" or "%" */
  unidade?: string;
  /** scale end; default = largest value */
  maximo?: number;
  nota?: ReactNode;
}) {
  const valores = linhas.flatMap((l) => series.map((s) => l.valores[s.id])).filter((v) => typeof v === 'number');
  const fim = maximo ?? Math.max(0, ...valores);
  return (
    <figure className="m-0 grid max-w-[110ch] gap-3 border border-borda bg-folha px-4 py-3">
      <figcaption className="grid gap-2">
        <span className="font-bold">{titulo}</span>
        {series.length > 1 && <Legenda series={series} />}
      </figcaption>
      {linhas.length === 0 || valores.length === 0 ? (
        <p className="m-0 text-apagado">Sem dados para mostrar.</p>
      ) : (
        <dl className="m-0 grid gap-3">
          {linhas.map((l) => (
            <div key={l.rotulo} className="grid gap-1">
              <dt className="text-[15px] font-bold">{l.rotulo}</dt>
              {series.map((s) => {
                const v = l.valores[s.id];
                const medido = typeof v === 'number';
                const largura = medido && fim > 0 ? Math.max(0.5, (Math.abs(v) / fim) * 100) : 0;
                return (
                  <dd
                    key={s.id}
                    className="m-0 grid grid-cols-[minmax(5.5rem,8rem)_1fr] items-center gap-2 text-[15px]"
                  >
                    <span className="truncate text-apagado">{s.nome}</span>
                    {/* the right padding keeps room for the value: the bar's % is of the track without it */}
                    <span className="flex min-w-0 items-center pr-[6.5rem]">
                      {medido && (
                        <span
                          aria-hidden="true"
                          className="block h-3.5 flex-none rounded-r-[4px]"
                          style={{ width: `${largura}%`, minWidth: 3, background: s.cor }}
                        />
                      )}
                      <span
                        className={
                          medido ? 'ml-2 flex-none whitespace-nowrap tabular-nums' : 'flex-none italic text-apagado'
                        }
                      >
                        {medido ? `${numero(v)}${unidade}` : NAO_MEDIDO}
                      </span>
                    </span>
                  </dd>
                );
              })}
            </div>
          ))}
        </dl>
      )}
      {nota && <div className="text-[15px] text-apagado">{nota}</div>}
    </figure>
  );
}
