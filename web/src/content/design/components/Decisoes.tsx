// "Agora estamos decidindo" on the lab home (old lab's main.ts + data/plan.ts): the open question or the next step.
// The phases, requests and the 22 grill decisions left the lab on 17/11; git history keeps them.
import { Callout } from '@/components/content/Callout';
import { Link } from 'react-router';
import { GOSTO_ABERTAS, PLANO } from '../dados';

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
            <Link to="/design/interface/decisoes-de-gosto" className="font-bold">
              {GOSTO_ABERTAS} decisões de gosto abertas
            </Link>{' '}
            na página Interface › Decisões de gosto: escolha olhando.
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
