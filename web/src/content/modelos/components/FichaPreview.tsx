// The sheet under each 3D preview (Nov 15, Fernando's request): proportion, measures, triangles, bones, clips, how it
// was made, the file, known defects and what to test. Collapsed by default, so the window stays the first thing seen.
import type { Ficha } from '../fichas';

const ORIGEM = 'text-base text-apagado';

export function FichaPreview({ ficha, titulo = 'Ficha do modelo' }: { ficha: Ficha | 'medindo'; titulo?: string }) {
  return (
    <details className="border-2 border-t-[4px] border-couro-escuro border-t-lab bg-folha shadow-folha px-4 [&[open]]:pb-3">
      <summary className="flex min-h-11 cursor-pointer items-center font-bold">📋 {titulo}</summary>
      {ficha === 'medindo' ? (
        <p className="m-0 text-apagado">Medindo… ainda não disponível.</p>
      ) : (
        <div className="grid gap-2">
          <dl className="m-0 grid gap-1.5">
            {/* proportion first: it is the question the remodel pages answer */}
            {!ficha.numeros.some(([r]) => r === 'Cabeças') && (
              <div>
                <dt className="font-bold">Cabeças</dt>
                <dd className="m-0">não medido</dd>
              </div>
            )}
            {ficha.numeros.map(([rotulo, valor, origem]) => (
              <div key={rotulo}>
                <dt className="font-bold">{rotulo}</dt>
                <dd className="m-0">
                  {valor} {origem !== '—' && <span className={ORIGEM}>({origem})</span>}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="m-0 text-[17px] leading-tight">Como foi feito</h3>
          <p className="m-0">
            {ficha.metodo} <span className={ORIGEM}>({ficha.origemMetodo})</span>
          </p>
          {(ficha.arquivo || ficha.data) && (
            <p className="m-0 [overflow-wrap:anywhere]">
              {ficha.arquivo && (
                <>
                  Arquivo: <code>{ficha.arquivo}</code>
                </>
              )}
              {ficha.arquivo && ficha.data && ' · '}
              {ficha.data && <>Data: {ficha.data}</>}
            </p>
          )}
          <h3 className="m-0 text-[17px] leading-tight">Defeitos conhecidos</h3>
          {ficha.defeitos.length ? (
            <ul className="m-0 grid list-disc gap-1 pl-6">
              {ficha.defeitos.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-apagado">Nenhum anotado.</p>
          )}
          {ficha.origemDefeitos !== '—' && <p className={`m-0 ${ORIGEM}`}>Origem: {ficha.origemDefeitos}.</p>}
          {!!ficha.oQueTestar?.length && (
            <>
              <h3 className="m-0 text-[17px] leading-tight">O que testar</h3>
              <ul className="m-0 grid list-disc gap-1 pl-6">
                {ficha.oQueTestar.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </details>
  );
}
