// The narrative lab's pages: the loop track, the marks and the plan.
// Same content and behaviour as dungeon-tactics-lab/narrativa/src/main.ts, rendered from dados.ts.
import { type ReactNode, useState } from 'react';
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { cn } from '@/lib/utils';
import { CAMADAS, JOGOS, PLANO } from '../dados';
import { lerMarcas, type Marca } from './marcas';

const TAG: Record<string, string> = {
  feito: 'border-sucesso text-sucesso',
  fazendo: 'border-lab bg-lab-soft text-lab',
  aberto: 'border-aviso bg-aviso-suave text-aviso',
  bloqueado: 'border-erro bg-erro-suave text-erro',
};
const Tag = ({ s }: { s: string }) => (
  <span className={cn('inline-block rounded-sm border bg-folha px-2 text-[14px] font-bold whitespace-nowrap', TAG[s])}>
    {s}
  </span>
);
// Wide screens: a table row must not run past ~110 characters (the shared Rolagem allows 1400px)
const Estreita = ({ children }: { children: ReactNode }) => (
  <div className="max-w-[110ch]">
    <Rolagem>{children}</Rolagem>
  </div>
);

const Lede = ({ children }: { children: ReactNode }) => <p className="m-0 max-w-[72ch] text-apagado">{children}</p>;
const Vazio = ({ children }: { children: ReactNode }) => <p className="m-0 text-apagado italic">{children}</p>;
const jogo = (slug: string) => JOGOS.find((g) => g.slug === slug);
const Desconhecido = ({ slug }: { slug: string }) => <p className="m-0 text-erro">Slug desconhecido: {slug}.</p>;

/** Each game on the same 4 layers, to compare how the story crosses the loop. */
export function Loop({ slug }: { slug: string }) {
  const g = jogo(slug);
  if (!g) return <Desconhecido slug={slug} />;
  return (
    <div className="grid gap-4">
      <ol className="m-0 grid list-none gap-2 p-0 desk:grid-cols-4">
        {CAMADAS.map(([k, n]) => (
          <li
            key={k}
            className={cn(
              'grid content-start gap-1 border border-borda border-t-[6px] border-t-lab bg-folha p-3',
              !g.loop[k] && 'text-apagado',
            )}
          >
            <strong>{n}</strong>
            <span>{g.loop[k] || 'Não tem.'}</span>
          </li>
        ))}
      </ol>
      <ul className="m-0 grid max-w-[72ch] list-disc gap-1 pl-6">
        {g.gives.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

export function MinhasMarcas() {
  const [linhas] = useState(() => Object.entries(lerMarcas()));
  const lista = (v: Marca['v']) => linhas.filter(([, m]) => m.v === v);
  const tabela = (v: Marca['v']) =>
    lista(v).length ? (
      <Estreita>
        <table className={TABELA}>
          <tbody>
            {lista(v).map(([k, m]) => (
              <tr key={k}>
                <td>{m.label}</td>
                <td className="text-apagado">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Estreita>
    ) : (
      <Vazio>Nada ainda.</Vazio>
    );
  return (
    <div className="grid gap-3">
      <h2 className="m-0 mt-2 text-[26px] leading-tight">Quero ({lista('quero').length})</h2>
      {tabela('quero')}
      <h2 className="m-0 mt-2 text-[26px] leading-tight">Não quero ({lista('nao').length})</h2>
      {tabela('nao')}
    </div>
  );
}

// ---------- plan ----------

export function Agora() {
  const a = PLANO.agora;
  return (
    <div className="grid gap-3 border border-borda border-t-[6px] border-t-lab bg-folha px-5 py-4">
      {a ? (
        <>
          <p className="m-0">
            <strong>{a.question}</strong>
          </p>
          <p className="m-0">{a.why}</p>
          <Lede>{a.example}</Lede>
          <ul className="m-0 grid list-disc gap-1 pl-6">
            {a.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="m-0">
            <strong>Recomendação: </strong>
            {a.pick}
          </p>
        </>
      ) : (
        <>
          <p className="m-0">
            <strong>Nenhuma decisão pendente.</strong>
          </p>
          <p className="m-0">
            <strong>Próximo passo: </strong>
            {PLANO.proximoPasso}
          </p>
        </>
      )}
    </div>
  );
}

export function Fases() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {PLANO.fases.map((f) => (
        <li
          key={f.id}
          className="grid items-center gap-2 border border-borda bg-folha p-3 desk:grid-cols-[90px_1fr_auto]"
        >
          <b>{f.id}</b>
          <span>
            {f.nome}
            <span className="text-apagado"> · {f.portao}</span>
          </span>
          <span>
            <Tag s={f.estado} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Pedidos() {
  return (
    <Estreita>
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
          {PLANO.pedidos.map((p) => (
            <tr key={p.pedido}>
              <td className="whitespace-nowrap">{p.data}</td>
              <td>{p.pedido}</td>
              <td>{p.dono}</td>
              <td>
                <Tag s={p.estado} />
              </td>
              <td>{p.proximo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Estreita>
  );
}

export function DecisoesTomadas() {
  return PLANO.decisoes.length ? (
    <Estreita>
      <table className={TABELA}>
        <tbody>
          {PLANO.decisoes.map((d, i) => (
            <tr key={d.tema}>
              <td>{i + 1}</td>
              <td>
                <strong>{d.tema}</strong>
              </td>
              <td>{d.decisao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Estreita>
  ) : (
    <Vazio>Nenhuma ainda.</Vazio>
  );
}
