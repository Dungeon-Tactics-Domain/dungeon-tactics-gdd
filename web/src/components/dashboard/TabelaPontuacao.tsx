// Weighted score table: each criterion has a weight and a 0..escala score per series; points = weight x score / escala.
// The totals are computed here, never typed in, so a transcription error in the data shows up in the total.
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { Legenda } from './BarrasComparativas';
import { numero, type Serie } from './series';

export interface CriterioPontuado {
  id: string;
  nome: string;
  peso: number;
  notas: Record<string, number>;
}

/** Total points per series. With `sem`, that criterion leaves and the other weights are scaled back to base 100. */
export function pontuar(criterios: CriterioPontuado[], series: Serie[], escala = 5, sem?: string) {
  const usados = criterios.filter((c) => c.id !== sem);
  const pesos = usados.reduce((s, c) => s + c.peso, 0);
  const base = sem ? 100 / (pesos || 1) : 1;
  return Object.fromEntries(
    series.map((s) => [
      s.id,
      Math.round(usados.reduce((t, c) => t + (c.peso * (c.notas[s.id] ?? 0)) / escala, 0) * base * 10) / 10,
    ]),
  ) as Record<string, number>;
}

function Nota({ valor, escala, cor }: { valor: number | undefined; escala: number; cor: string }) {
  if (valor === undefined) return <span className="italic text-apagado">sem nota</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="relative block h-2.5 w-14 rounded-sm bg-pergaminho-escuro">
        <span
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ width: `${(valor / escala) * 100}%`, background: cor }}
        />
      </span>
      <span className="tabular-nums">
        {valor} de {escala}
      </span>
    </span>
  );
}

export function TabelaPontuacao({
  criterios,
  series,
  escala = 5,
  legenda,
}: {
  criterios: CriterioPontuado[];
  series: Serie[];
  escala?: number;
  legenda?: string;
}) {
  if (criterios.length === 0) return <p className="m-0 text-apagado">Nenhum critério para pontuar.</p>;
  const total = pontuar(criterios, series, escala);
  const pesos = criterios.reduce((s, c) => s + c.peso, 0);
  return (
    <div className="grid max-w-[min(100%,1400px)] gap-2">
      <Legenda series={series} />
      <Rolagem>
        <table className={TABELA}>
          {legenda && <caption className="pb-2 text-left text-base text-apagado">{legenda}</caption>}
          <thead>
            <tr>
              <th scope="col">Critério</th>
              <th scope="col">Peso</th>
              {series.map((s) => (
                <th key={s.id} scope="col">
                  Nota {s.nome}
                </th>
              ))}
              {series.map((s) => (
                <th key={s.id} scope="col">
                  Pontos {s.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criterios.map((c) => (
              <tr key={c.id}>
                <th scope="row" className="!bg-transparent font-normal">
                  {c.nome}
                </th>
                <td className="tabular-nums">{c.peso}</td>
                {series.map((s) => (
                  <td key={s.id}>
                    <Nota valor={c.notas[s.id]} escala={escala} cor={s.cor} />
                  </td>
                ))}
                {series.map((s) => (
                  <td key={s.id} className="tabular-nums">
                    {numero((c.peso * (c.notas[s.id] ?? 0)) / escala)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="font-bold tabular-nums">{pesos}</td>
              {series.map((s) => (
                <td key={s.id} />
              ))}
              {series.map((s) => (
                <td key={s.id} className="font-bold tabular-nums">
                  {numero(total[s.id] ?? 0)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </Rolagem>
    </div>
  );
}
