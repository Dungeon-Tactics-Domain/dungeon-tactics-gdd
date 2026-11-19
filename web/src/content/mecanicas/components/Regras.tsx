// Rules and feel pages: one table per group of regras.json (read from the game's code on 14/11), and the list of places
// where the docs disagree with the code. Same columns as the old lab's ruleTable.
import { Callout } from '@/components/content/Callout';
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { DRIFT, REGRAS } from '../dados';
import { LIMITE_TEXTO } from './Descida';

export function Regras({ de, grupo }: { de: keyof typeof REGRAS; grupo: string }) {
  const g = REGRAS[de]?.find((x) => x.id === grupo);
  if (!g) return <p className="m-0 text-erro">Grupo de regras desconhecido: {grupo}</p>;
  return (
    <div className={LIMITE_TEXTO}>
      <Rolagem>
        <table className={TABELA}>
          <thead>
            <tr>
              {['Regra', 'Como está hoje', 'Onde no código'].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {g.regras.map((r) => (
              <tr key={r.name}>
                <td>
                  <strong>{r.name}</strong>
                </td>
                <td>
                  {r.now}
                  {r.note && <span className="mt-1 block text-base text-apagado">{r.note}</span>}
                </td>
                <td>
                  <code className="bg-pergaminho-escuro px-1 text-base [overflow-wrap:anywhere]">{r.where}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Rolagem>
    </div>
  );
}

export function Divergencias() {
  return (
    <Callout tom="simples">
      <ul className="m-0 grid list-disc gap-1 gap-x-10 pl-6 wide:grid-cols-2 ultra:grid-cols-3">
        {DRIFT.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </Callout>
  );
}
