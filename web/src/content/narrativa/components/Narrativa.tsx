// The narrative lab's pages: the loop track and the open decision.
// Same content and behaviour as dungeon-tactics-lab/narrativa/src/main.ts, rendered from dados.ts.
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CAMADAS, JOGOS, PLANO } from '../dados';

const Lede = ({ children }: { children: ReactNode }) => <p className="m-0 max-w-[72ch] text-apagado">{children}</p>;
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
