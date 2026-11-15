// Decision pages of the old lab (main.ts + data/plan.ts): the open question or next step, the phases, Fernando's
// requests and the 22 grill decisions.
import { Callout } from '@/components/content/Callout';
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { cn } from '@/lib/utils';
import { PLANO, type Status } from '../dados';

const TOM: Record<Status, string> = {
  feito: 'bg-mar text-run',
  fazendo: 'bg-lab-soft text-lab',
  aberto: 'bg-warn-soft text-warn',
  bloqueado: 'bg-stop-soft text-stop',
};
const Etiqueta = ({ s }: { s: Status }) => (
  <span className={cn('inline-block rounded-[3px] px-2 py-px text-[14px] font-bold whitespace-nowrap', TOM[s])}>
    {s}
  </span>
);
const N = 'w-[3em] text-apagado tabular-nums';

export function Agora() {
  const now = PLANO.now;
  return (
    <Callout>
      {now ? (
        <div className="grid gap-3">
          <p className="m-0">
            <strong>{now.question}</strong>
          </p>
          <p className="m-0">{now.why}</p>
          <p className="m-0 text-apagado">{now.example}</p>
          <ul className="m-0 grid list-disc gap-1 pl-6">
            {now.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="m-0">
            <strong>Recomendação: </strong>
            {now.pick}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          <p className="m-0">
            <strong>Nenhuma decisão pendente.</strong>
          </p>
          <p className="m-0">
            <strong>Próximo passo: </strong>
            {PLANO.nextStep}
          </p>
        </div>
      )}
    </Callout>
  );
}

export function Fases() {
  return (
    <div className="grid gap-2">
      {PLANO.phases.map(([id, name, gate, st]) => (
        <div
          key={id}
          className="grid grid-cols-[90px_1fr_auto] items-baseline gap-3 border border-borda bg-folha px-3.5 py-2.5 max-[700px]:grid-cols-1"
        >
          <b className="tabular-nums">{id}</b>
          <span>
            {name}
            <span className="text-apagado"> · {gate}</span>
          </span>
          <span className="justify-self-start">
            <Etiqueta s={st} />
          </span>
        </div>
      ))}
    </div>
  );
}

export function Pedidos() {
  return (
    <Rolagem>
      <table className={TABELA}>
        <thead>
          <tr>
            {['Data', 'Pedido', 'Dono', 'Estado', 'Prova ou próximo passo'].map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLANO.requests.map(([d, ask, owner, st, next], i) => (
            <tr key={i}>
              <td className={N}>{d}</td>
              <td>{ask}</td>
              <td>{owner}</td>
              <td>
                <Etiqueta s={st} />
              </td>
              <td>{next}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  );
}

export function Decisoes22() {
  return (
    <Rolagem>
      <table className={TABELA}>
        <tbody>
          {PLANO.decisions.map(([topic, d], i) => (
            <tr key={topic}>
              <td className={N}>{i + 1}</td>
              <td>
                <strong>{topic}</strong>
              </td>
              <td>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  );
}
