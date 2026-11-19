// Tests or tasks still open, each with its state in words (colour only reinforces it). Fed by a JSON that is easy to update.
export type EstadoPendencia = 'nao-testado' | 'em-andamento' | 'feito';

export interface Pendencia {
  id: string;
  titulo: string;
  porQue?: string;
  estado: EstadoPendencia;
  /** how to run it, in order; a command goes between backticks */
  passos?: string[];
  /** what came out, once done */
  resultado?: string;
}

const ESTADO: Record<EstadoPendencia, [string, string]> = {
  'nao-testado': ['Não testado', 'border-2 border-dashed border-apagado text-apagado'],
  'em-andamento': ['Em andamento', 'bg-aviso-suave text-aviso'],
  feito: ['Feito', 'bg-sucesso-suave text-sucesso'],
};

export function ListaPendencias({ itens }: { itens: Pendencia[] }) {
  if (itens.length === 0) return <p className="m-0 text-apagado">Nada pendente.</p>;
  return (
    <ul className="m-0 grid max-w-[110ch] list-none gap-2 p-0">
      {itens.map((p) => {
        const [rotulo, cor] = ESTADO[p.estado];
        return (
          <li key={p.id} className="grid gap-1 border-2 border-couro-escuro bg-folha shadow-folha px-4 py-3">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`rounded-sm px-2 py-0.5 text-base font-bold ${cor}`}>{rotulo}</span>
              <b>{p.titulo}</b>
            </span>
            {p.porQue && <span className="text-base text-apagado">{p.porQue}</span>}
            {p.passos && p.passos.length > 0 && (
              <ol aria-label={`Como rodar: ${p.titulo}`} className="m-0 grid list-decimal gap-1 pl-6 text-base">
                {p.passos.map((s) => (
                  <li key={s} className="break-words">
                    {/* text between backticks is a command: monospace, so "--" is not drawn as a dash */}
                    {s.split('`').map((t, i) =>
                      i % 2 ? (
                        <code key={i} className="bg-lab-soft px-1 font-mono text-base">
                          {t}
                        </code>
                      ) : (
                        t
                      ),
                    )}
                  </li>
                ))}
              </ol>
            )}
            {p.resultado && <span className="text-base">Resultado: {p.resultado}</span>}
          </li>
        );
      })}
    </ul>
  );
}
