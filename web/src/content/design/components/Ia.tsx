// AI image test pages of the old lab (ia.ts): the featured pick, each platform (Gemini and Copilot split by kind) and
// the platforms not tested yet.
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { IA, iaSub, plataforma } from '../dados';
import { CartoesIa } from './Cartoes';

export function IaDestaque() {
  const todos = IA.platforms.flatMap((p) => p.tests);
  return <CartoesIa tests={IA.featured.map((f) => todos.find((t) => t.file === f)!)} />;
}

export function IaPlataforma({ id, sub }: { id: string; sub?: string }) {
  const p = plataforma(id);
  if (!p) return <p className="m-0 text-stop">Plataforma desconhecida: {id}</p>;
  const tests = sub ? p.tests.filter((t) => iaSub(t) === sub) : p.tests;
  if (!tests.length) return <p className="m-0 text-stop">Grupo desconhecido: {sub}</p>;
  return <CartoesIa tests={tests} />;
}

export function IaSemImagem() {
  return (
    <Rolagem>
      <table className={TABELA}>
        <tbody>
          {IA.notRun.map(([a, b]) => (
            <tr key={a}>
              <td>
                <strong>{a}</strong>
              </td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  );
}
