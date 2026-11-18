// The narrative lab's open decision, shown on the lab home.
// Same content and behaviour as dungeon-tactics-lab/narrativa/src/main.ts, rendered from dados.ts.
import type { ReactNode } from 'react';
import { PLANO } from '../dados';

const Lede = ({ children }: { children: ReactNode }) => <p className="m-0 max-w-[72ch] text-apagado">{children}</p>;

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
