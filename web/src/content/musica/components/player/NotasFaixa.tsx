// "Explicação da faixa", the light box under the stage: story (with a Rascunho badge), where it plays, measurements,
// checks and references, then the keyboard hints.
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Song } from '@/lib/player/schema';

const Titulo = ({ children }: { children: ReactNode }) => (
  <h3 className="m-0 text-[length:var(--h3)] text-ouro-escuro">{children}</h3>
);
const Nada = () => <p className="m-0 text-apagado">Nada ainda.</p>;

export function NotasFaixa({ musica }: { musica: Song | undefined }) {
  if (!musica) return null;
  const feitas = musica.checks.filter((c) => c.state === 'done');
  const pendentes = musica.checks.filter((c) => c.state === 'pending');

  return (
    <section className="grid min-w-0 gap-4 border-2 border-couro bg-folha p-5 shadow-folha max-[700px]:p-3">
      <h2 className="m-0 border-b-2 border-couro pb-2.5 text-[length:var(--h2)] uppercase text-ouro-escuro">
        Explicação da faixa
      </h2>
      <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
        <div className="grid content-start gap-3">
          <div className="flex items-center justify-between gap-2">
            <Titulo>História</Titulo>
            {musica.storyDraft && <Badge estado="aguardando-voce">Rascunho</Badge>}
          </div>
          <p className="m-0 border-2 border-borda/40 bg-campo p-3">
            {musica.story ?? 'A história desta música ainda não foi escrita.'}
          </p>
          <Titulo>Onde toca</Titulo>
          <p className="m-0 border-2 border-borda/40 bg-campo p-3">{musica.whereItPlays ?? 'A definir'}</p>
          <Titulo>Medições</Titulo>
          {musica.measurements.length ? (
            <dl className="m-0 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
              {musica.measurements.map((m) => (
                <div key={m.label} className="border-2 border-couro p-2.5">
                  <dt className="text-apagado">{m.label}</dt>
                  <dd className="m-0 font-mono font-bold tabular-nums">{m.value}</dd>
                  <dd className="m-0 italic text-apagado">origem: {m.source}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <Nada />
          )}
        </div>
        <div className="grid content-start gap-3">
          <Titulo>Checagens</Titulo>
          {!musica.checks.length && <Nada />}
          {feitas.length > 0 && <Lista titulo="Feito" itens={feitas.map((c) => c.text)} />}
          {pendentes.length > 0 && <Lista titulo="Pendente" itens={pendentes.map((c) => c.text)} pendente />}
          <Titulo>Referências</Titulo>
          {musica.references.length ? (
            <ul className="m-0 grid list-none gap-2 p-0">
              {musica.references.map((r) => (
                <li key={r.url}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-between gap-2 border-2 border-couro px-3 py-1.5 text-tinta no-underline hover:bg-pergaminho-escuro"
                  >
                    <span>{r.label}</span>
                    {r.study && <Badge>só estudo</Badge>}
                    <span aria-hidden="true">↗</span>
                    <span className="sr-only">(abre em nova aba)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Nada />
          )}
        </div>
      </div>
      <p className="m-0 text-apagado">
        Espaço toca e pausa; clique nas notas, na régua ou na visão geral para ir a um ponto; setas movem um compasso; M
        e S no canal em foco.
      </p>
    </section>
  );
}

function Lista({ titulo, itens, pendente }: { titulo: string; itens: string[]; pendente?: boolean }) {
  return (
    <div className={`border-2 px-3 py-2.5 ${pendente ? 'border-ouro' : 'border-couro'}`}>
      <h4 className="m-0 font-serif text-lg font-bold uppercase">{titulo}</h4>
      <ul className="m-0 mt-1.5 list-disc pl-5">
        {itens.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
