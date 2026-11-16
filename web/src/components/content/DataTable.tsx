// A plain table from typed data (usually a lab's JSON). Wide tables scroll inside their box, never the page at 375px.
import type { ReactNode } from 'react';

export const TABELA =
  'w-full border-collapse text-[15px] [&_td]:border [&_td]:border-borda [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_th]:border [&_th]:border-borda [&_th]:bg-lab-soft [&_th]:px-3 [&_th]:py-2 [&_th]:text-left';

export function Rolagem({ children }: { children: ReactNode }) {
  // focusable so keyboard users can scroll a table wider than the screen
  return (
    <div tabIndex={0} role="region" aria-label="Tabela" className="max-w-[min(100%,1400px)] overflow-x-auto">
      {children}
    </div>
  );
}

export function DataTable({
  colunas,
  linhas,
  legenda,
}: {
  colunas: string[];
  linhas: (string | number)[][];
  legenda?: string;
}) {
  return (
    <Rolagem>
      <table className={TABELA}>
        {legenda && <caption className="pb-2 text-left text-[15px] text-apagado">{legenda}</caption>}
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i}>
              {l.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  );
}
