// Fábrica de games (Fernando, 14/11): each Claude session is one line with its illustrated bench, its state and the
// subagents it launched. Summary in numbers on top, sessions grouped by state, only who works moves, and a panel with
// every running subagent. The same number and colour tie a subagent to the session that launched it.
import { type CSSProperties, useEffect } from 'react';
import { Relogio } from '@/components/layout/Relogio';
import { useQuadro } from '@/lib/fabrica-context';
import { GRUPOS, type Grupo, groupOf, ICONS, isLive, isTower, since, stateLabel } from '@/lib/fabrica';
import { GENERIC_COLOR, LABS, PORT } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';
import { cn } from '@/lib/utils';
import type { Estacao, Subagente } from '@/types/fabrica';
import { ART, DRONE, type Tema } from './arte';
import './fabrica.css';

const DONE_WINDOW_MS = 15 * 60 * 1000;
const TITULOS: Record<Grupo, string> = {
  'aguardando-voce': 'Chamando você',
  rodando: 'Trabalhando agora',
  espera: 'Esperando outra coisa',
  parado: 'Parado',
};

function temaDe(s: Estacao): { tema: Tema; cor: string; suave: string } {
  if (isTower(s)) return { tema: 'torre', cor: PORT.cor, suave: PORT.corSuave };
  const lab = LABS.find((l) => l.id === s.id);
  return lab && lab.id in ART
    ? { tema: lab.id as Tema, cor: lab.cor, suave: lab.corSuave }
    : { tema: 'generica', cor: GENERIC_COLOR, suave: '#ecebe3' };
}

const modelo = (m: string) => (/^(opus|sonnet|haiku|fable)$/i.test(m) ? `modelo-${m.toLowerCase()}` : 'modelo-outro');
const Svg = ({ vb, body, className }: { vb: string; body: string; className: string }) => (
  // fixed markup from arte.ts, never board text
  <svg
    className={className}
    viewBox={vb}
    aria-hidden="true"
    focusable="false"
    dangerouslySetInnerHTML={{ __html: body }}
  />
);

function meta(d: Subagente, agora: number) {
  const inicio = Date.parse(d.inicio ?? '');
  const tempo = Number.isNaN(inicio) ? 'início não informado' : `rodando há ${since(Math.max(0, agora - inicio))}`;
  const estado = d.estado === 'rodando' ? '' : `${stateLabel(d.estado)} · `;
  return `${d.modelo || 'modelo não informado'} · ${estado}${tempo}`;
}

function Linha({ s, n, subs, agora }: { s: Estacao; n: number; subs: Subagente[]; agora: number }) {
  const { tema, cor, suave } = temaDe(s);
  const g = groupOf(s.estado);
  const chama = s.estado === 'aguardando-voce';
  // without the "pergunta" field the task is the question, so it is not repeated above it
  const tarefaEhPergunta = chama && !s.pergunta;
  const rotulo = g === 'parado' || g === 'espera' ? 'Motivo: ' : chama ? 'Assunto: ' : 'Fazendo: ';
  return (
    <article
      className={cn('row', subs.length && 'com-subs')}
      data-estado={s.estado}
      data-grupo={g}
      style={{ '--st': cor, '--st-soft': suave } as CSSProperties}
    >
      <div className="scene">
        <Svg vb="0 0 200 120" body={ART[tema]} className="art" />
        <span className="num" aria-hidden="true">
          {n}
        </span>
      </div>
      <div className="info">
        <h3>
          <span className="num-inline">{n}.</span>
          {s.emoji && <span aria-hidden="true">{s.emoji}</span>}
          <span>{s.nome || s.id}</span>
        </h3>
        {s.papel && <p className="papel">{s.papel}</p>}
        <p className="estado">
          <span className="estado-icon" aria-hidden="true">
            {ICONS[g]}
          </span>
          {stateLabel(s.estado)}
        </p>
        {s.tarefa && !tarefaEhPergunta && <p className="tarefa">{rotulo + s.tarefa}</p>}
        {chama && (
          <p className="pergunta">
            Pergunta: {(s.pergunta || s.tarefa).replace(/^pergunta:\s*/i, '') || 'sem pergunta escrita no quadro'}
          </p>
        )}
      </div>
      <div className="subs">
        <h4>Subagentes desta sessão</h4>
        {subs.length ? (
          <ul className="chips">
            {subs.map((d) => (
              <li key={d.id} className={cn('chip', modelo(d.modelo))} data-estado={d.estado}>
                <Svg vb="0 0 48 38" body={DRONE} className="bot" />
                <span className="chip-txt">
                  <b>{d.nome || d.id}</b>
                  <span className="meta">{meta(d, agora)}</span>
                  <span>{d.tarefa}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="none">Nenhum subagente</p>
        )}
      </div>
    </article>
  );
}

export function FabricaPage() {
  useLabAccent(PORT.cor, PORT.corSuave);
  useEffect(() => {
    document.title = 'Fábrica de games · Reino dos Laboratórios';
  }, []);
  const { fabrica, agora, conexao } = useQuadro();
  const stations = fabrica?.estacoes ?? [];
  const subs = fabrica?.subagentes ?? [];
  // the bench number comes from the board order, so a subagent always points to the same bench
  const numOf = new Map(stations.map((s, i) => [s.id, i + 1]));
  const live = subs.filter(isLive);
  const done = subs.filter((d) => {
    const fim = Date.parse(d.fim ?? '');
    return d.estado === 'terminado' && !Number.isNaN(fim) && agora - fim <= DONE_WINDOW_MS;
  });
  const nomeDe = (id: string) => stations.find((s) => s.id === id)?.nome || id;
  const conta = (g: Grupo) => stations.filter((s) => groupOf(s.estado) === g).length;
  const resumo: [string, string, number][] = [
    ['rodando', '🟢 Trabalhando agora', conta('rodando')],
    ['aguardando-voce', '🔔 Esperando você', conta('aguardando-voce')],
    ['espera', '⏳ Esperando outra coisa', conta('espera')],
    ['parado', '⚪ Parado', conta('parado')],
    ['subs', '🤖 Subagentes rodando', live.length],
  ];

  if (conexao === 'sem-api')
    return (
      <main className="fabrica mx-auto grid max-w-[1280px] gap-3 px-4 pt-7 pb-16 sm:px-10">
        <h1 className="m-0 text-[40px] leading-none">Fábrica de games</h1>
        <Relogio />
      </main>
    );

  return (
    <main className="fabrica mx-auto grid max-w-[1280px] content-start gap-7 px-4 pt-7 pb-16 sm:px-10">
      <header className="grid gap-2">
        <h1 className="m-0 text-[40px] leading-none">Fábrica de games</h1>
        <Relogio />
        <ul className="summary" aria-label="Resumo">
          {resumo.map(([k, rotulo, v]) => (
            <li key={k} className={cn('sum', `sum-${k}`, !v && 'zero')}>
              {rotulo}: <b>{v}</b>
            </li>
          ))}
        </ul>
      </header>

      <section aria-label="Sessões" className="grid gap-6">
        {!fabrica && <p className="empty">Lendo o quadro da Fábrica…</p>}
        {GRUPOS.map((g) => {
          const mine = stations.filter((s) => groupOf(s.estado) === g);
          if (!mine.length) return null;
          return (
            <section key={g} className={`group group-${g}`}>
              <h2 className="group-title">
                {ICONS[g]} {TITULOS[g]}
              </h2>
              <div className="grid gap-3">
                {mine.map((s) => (
                  <Linha
                    key={s.id}
                    s={s}
                    n={numOf.get(s.id)!}
                    subs={live.filter((d) => d.estacao === s.id)}
                    agora={agora}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <section id="subagentes" className="panel" aria-labelledby="subagentes-titulo">
        <h2 id="subagentes-titulo">🤖 Subagentes rodando agora</h2>
        {live.length ? (
          <ul className="cards">
            {live.map((d) => {
              const st = stations.find((s) => s.id === d.estacao);
              const t = st ? temaDe(st) : { cor: GENERIC_COLOR, suave: '#ecebe3' };
              return (
                <li
                  key={d.id}
                  className={cn('card', modelo(d.modelo))}
                  data-estado={d.estado}
                  style={{ '--st': t.cor, '--st-soft': t.suave } as CSSProperties}
                >
                  <span className="origem">
                    <span className="num">{numOf.get(d.estacao) ?? '?'}</span>
                    {st ? `de ${st.nome || st.id}` : `de uma sessão que não está no quadro ("${d.estacao}")`}
                  </span>
                  <div className="card-body">
                    <Svg vb="0 0 48 38" body={DRONE} className="bot" />
                    <div>
                      <b className="text-lg">{d.nome || d.id}</b>
                      <p className="meta">{meta(d, agora)}</p>
                      <p>{d.tarefa}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="empty">Nenhum subagente rodando agora.</p>
        )}
        {done.length > 0 && (
          <div>
            <h3 className="mt-1.5 mb-1 font-sans text-base text-apagado">Terminaram nos últimos 15 min</h3>
            <ul className="m-0 list-disc pl-5 text-[15px] text-apagado">
              {done.map((d) => (
                <li key={d.id}>
                  {d.nome || d.id} ({d.modelo || 'modelo não informado'}, de {nomeDe(d.estacao)}): terminou há{' '}
                  {since(Math.max(0, agora - Date.parse(d.fim!)))}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
