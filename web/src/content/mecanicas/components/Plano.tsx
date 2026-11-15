// Decisions group: the open question (or the next step), the grill decisions, Fernando's requests and the plan phases.
// Same content and order as the old lab (dungeon-tactics-lab/mecanicas/src/main.ts, "Decisões"), data in plano.json.
import { Callout } from '@/components/content/Callout';
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { cn } from '@/lib/utils';
import { PLANO } from '../dados';

const COR_ESTADO: Record<string, string> = {
  feito: 'bg-run/10 text-run',
  fazendo: 'bg-lab-soft text-lab',
  aberto: 'bg-warn-soft text-warn',
  bloqueado: 'bg-stop-soft text-stop',
};

export function Estado({ de }: { de: string }) {
  return (
    <span className={cn('inline-block rounded-[3px] px-2 text-[14px] font-bold whitespace-nowrap', COR_ESTADO[de])}>
      {de}
    </span>
  );
}

export function Agora() {
  const now = PLANO.now;
  if (!now)
    return (
      <Callout>
        <p className="m-0">
          <strong>Nenhuma decisão pendente.</strong>
        </p>
        <p className="m-0">
          <strong>Próximo passo: </strong>
          {PLANO.nextStep}
        </p>
      </Callout>
    );
  return (
    <Callout>
      <p className="m-0">
        <strong>{now.question}</strong>
      </p>
      <p className="m-0">{now.why}</p>
      <p className="m-0 text-apagado">{now.example}</p>
      {now.options.map((o, i) => (
        <div
          key={o.name}
          className={cn('grid gap-1.5 border border-borda px-3.5 py-3', i === 0 && 'border-2 border-run')}
        >
          <strong>
            {o.name}
            {i === 0 ? ' (recomendada)' : ''}
          </strong>
          <p className="m-0">{o.what}</p>
          <p className="m-0 text-apagado">Embasamento: {o.basis}</p>
          <div className="grid grid-cols-2 gap-3 max-[900px]:grid-cols-1">
            <div>
              <b className="block text-run">Prós</b>
              {o.pros}
            </div>
            <div>
              <b className="block text-stop">Contras</b>
              {o.cons}
            </div>
          </div>
          <p className="m-0">
            <b>Consequência: </b>
            {o.effect}
          </p>
        </div>
      ))}
      <p className="m-0">
        <strong>Recomendação: </strong>
        {now.pick}
      </p>
    </Callout>
  );
}

export function Grill() {
  if (!PLANO.decisions.length)
    return (
      <p className="m-0 border border-dashed border-borda bg-folha p-7 text-apagado">
        Nenhuma ainda: o grill começa depois do Portão 1.
      </p>
    );
  return (
    <Rolagem>
      <table className={TABELA}>
        <tbody>
          {PLANO.decisions.map((d, i) => (
            <tr key={d.topic}>
              <td>{i + 1}</td>
              <td>
                <strong>{d.topic}</strong>
              </td>
              <td>{d.decision}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  );
}

// the 14 requests in one table passed 1,900px: the open ones stay on the page, the done ones go to a subpage
export function Pedidos({ feitos = false }: { feitos?: boolean }) {
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
          {PLANO.requests
            .filter((r) => (r.status === 'feito') === feitos)
            .map((r) => (
              <tr key={r.ask}>
                <td>{r.date}</td>
                <td>{r.ask}</td>
                <td>{r.owner}</td>
                <td>
                  <Estado de={r.status} />
                </td>
                <td>{r.next}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </Rolagem>
  );
}

export function Fases() {
  return (
    <div className="grid gap-2">
      {PLANO.phases.map((f) => (
        <div
          key={f.id}
          className="grid grid-cols-[90px_1fr_auto] items-baseline gap-3 border border-borda bg-folha px-3.5 py-2.5 max-[700px]:grid-cols-1"
        >
          <b>{f.id}</b>
          <span>
            {f.name}
            <span className="text-apagado"> · {f.gate}</span>
          </span>
          <span className="justify-self-start">
            <Estado de={f.status} />
          </span>
        </div>
      ))}
    </div>
  );
}
