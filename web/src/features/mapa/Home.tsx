// Home of the kingdom (grill of 14/11, direction B): the map with every lab as a town, the notice board with what each
// lab expects from Fernando, and every session on one line. State comes only from the Fábrica board; nothing invented.
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Relogio } from '@/components/layout/Relogio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuadro } from '@/lib/fabrica-context';
import { askOf, GRUPOS, groupOf, ICONS, isLive, stateLabel, type Town, townsOf } from '@/lib/fabrica';
import { GENERIC_COLOR, PORT, SITE } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';
import type { Estacao, Fabrica } from '@/types/fabrica';
import { Mapa } from './Mapa';

const townOf = (towns: Town[], s: Estacao) => towns.find((t) => t.stations.includes(s));

function Avisos({ fabrica, towns }: { fabrica: Fabrica | null; towns: Town[] }) {
  const st = fabrica?.estacoes ?? [];
  // who calls first, then who left a written question
  const calling = st.filter((s) => s.estado === 'aguardando-voce');
  const asked = st.filter((s) => s.estado !== 'aguardando-voce' && s.pergunta);
  const busy = st.filter((s) => s.estado === 'rodando').length;
  return (
    <section
      id="avisos"
      aria-labelledby="avisos-titulo"
      className="grid gap-3 border-2 border-tinta bg-cortica p-[18px] shadow-[5px_5px_0_rgba(43,42,34,.3)]"
    >
      <h2 id="avisos-titulo" className="m-0 text-[30px]">
        Quadro de avisos
      </h2>
      {calling.length > 0 && (
        <span className="font-bold text-warn">
          {calling.length} {calling.length > 1 ? 'esperam' : 'espera'} por você
        </span>
      )}
      <ul className="m-0 grid list-none gap-3.5 p-0">
        {[...calling, ...asked].map((s, i) => {
          const t = townOf(towns, s);
          const chama = s.estado === 'aguardando-voce';
          return (
            <li
              key={s.id}
              className="nota relative grid gap-1.5 border border-l-8 border-traco bg-bilhete py-3.5 pr-4 pl-[18px] shadow-[2px_3px_0_rgba(43,42,34,.18)]"
              style={{ borderLeftColor: t?.place.cor ?? GENERIC_COLOR, rotate: i % 2 ? '.6deg' : '-.5deg' }}
            >
              <span
                className="text-sm font-bold tracking-wider uppercase"
                style={{ color: t?.place.cor ?? GENERIC_COLOR }}
              >
                {t?.place.curto ?? s.nome} ·{' '}
                {chama ? 'chama você' : `pergunta anotada (${stateLabel(s.estado).toLowerCase()})`}
              </span>
              <p className="m-0 text-[19px] leading-snug font-bold">
                {askOf(s) || 'A sessão chama você, mas não escreveu a pergunta no quadro.'}
              </p>
              <p className="m-0 text-sm text-apagado">
                {s.emoji && `${s.emoji} `}
                {s.nome || s.id}
                {s.papel && ` · ${s.papel}`}
              </p>
              <p className="m-0 mt-1 flex flex-wrap gap-2">
                {t?.place.href && (
                  <Button asChild>
                    <Link to={t.place.href}>Abrir {t.place.curto} →</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link to="/fabrica">Ver na Fábrica</Link>
                </Button>
              </p>
            </li>
          );
        })}
      </ul>
      {calling.length + asked.length === 0 && (
        <p className="m-0 border border-dashed border-traco bg-bilhete px-4 py-3.5">
          {fabrica ? 'Nenhum lab espera você agora. ' : 'Ainda sem leitura do quadro. '}
          {busy
            ? `${busy} sessão(ões) trabalhando; o quadro avisa sozinho quando alguma chamar.`
            : 'Nenhuma sessão trabalhando no momento.'}
        </p>
      )}
    </section>
  );
}

function Sessoes({ fabrica, towns }: { fabrica: Fabrica | null; towns: Town[] }) {
  const st = fabrica?.estacoes ?? [];
  const sorted = GRUPOS.flatMap((g) => st.filter((s) => groupOf(s.estado) === g));
  return (
    <section id="sessoes" aria-labelledby="sessoes-titulo" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sessoes-titulo" className="m-0 text-[30px]">
          Todas as sessões
        </h2>
        <Button asChild>
          <Link to="/fabrica">Bancadas e subagentes na Fábrica →</Link>
        </Button>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {sorted.map((s) => {
          const t = townOf(towns, s);
          const g = groupOf(s.estado);
          const n = (fabrica?.subagentes ?? []).filter((d) => d.estacao === s.id && isLive(d)).length;
          const motivo =
            g === 'parado' || g === 'espera' ? 'Motivo: ' : g === 'aguardando-voce' ? 'Assunto: ' : 'Fazendo: ';
          return (
            <li
              key={s.id}
              className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border border-l-8 border-traco bg-folha px-3.5 py-2.5 text-[15px] data-[estado=aguardando-voce]:bg-warn-soft lg:grid-cols-[28px_minmax(200px,1.2fr)_150px_minmax(0,2fr)_120px]"
              style={{ borderLeftColor: t?.place.cor ?? GENERIC_COLOR }}
              data-estado={s.estado}
            >
              <span aria-hidden="true">{ICONS[g]}</span>
              <span className="grid">
                <b className="text-base">
                  {s.emoji && `${s.emoji} `}
                  {s.nome || s.id}
                </b>
                <span className="text-sm text-apagado">
                  {t ? (t.place.id === PORT.id ? 'Porto · Fábrica' : `Cidade · ${t.place.curto}`) : ''}
                </span>
              </span>
              <Badge estado={g} className="justify-self-start">
                {stateLabel(s.estado)}
              </Badge>
              <span className="col-start-2 col-end-[-1] lg:col-auto">
                {s.tarefa ? motivo + s.tarefa : 'Sem tarefa escrita'}
              </span>
              <span className="col-start-2 col-end-[-1] text-sm text-apagado lg:col-auto">
                {n ? `⛵ ${n}` : 'sem subagente'}
              </span>
            </li>
          );
        })}
        {!sorted.length && (
          <li className="border border-dashed border-traco bg-bilhete px-4 py-3.5">
            Nenhuma sessão no quadro da Fábrica.
          </li>
        )}
      </ul>
    </section>
  );
}

export function Home() {
  useLabAccent(PORT.cor, PORT.corSuave);
  useEffect(() => {
    document.title = SITE;
  }, []);
  // the bar's "chama você" link points to /#avisos; client-side navigation does not scroll to a hash by itself
  const { hash, key } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, key]);
  const { fabrica } = useQuadro();
  const towns = townsOf(fabrica);
  return (
    <main className="mx-auto grid max-w-[1440px] content-start gap-6 px-(--margem) pt-6 pb-16">
      <header className="grid gap-1.5">
        <h1 className="m-0 text-(length:--h1) leading-none">{SITE}</h1>
        <p className="m-0 text-[17px]">
          Cada lab é uma cidade; a Fábrica é o porto. Escolha uma cidade ou leia o quadro de avisos.
        </p>
        <Relogio />
      </header>
      <div className="grid items-start gap-6 desk:grid-cols-[minmax(0,1fr)_420px]">
        <section aria-labelledby="mapa-titulo">
          <h2 id="mapa-titulo" className="sr-only">
            Mapa do reino
          </h2>
          <Mapa towns={towns} />
        </section>
        <Avisos fabrica={fabrica} towns={towns} />
      </div>
      <Sessoes fabrica={fabrica} towns={towns} />
    </main>
  );
}
