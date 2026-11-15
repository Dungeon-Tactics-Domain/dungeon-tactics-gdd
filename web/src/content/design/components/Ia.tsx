// AI image tests of the old lab (ia.ts), by subject: each subject lists its images per platform, and inside a platform
// the images of one conversation go together under a heading that links to the chat. The featured pick and the
// platforms table (plano/plataformas) are the other two views.
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { contagem, estiloDe, IA, iaSub, porConversa, type Test } from '../dados';
import { CartoesIa } from './Cartoes';

const H3 = 'm-0 mt-1 text-[21px] leading-tight';
const H4 = 'm-0 text-[18px] leading-tight';
const LINK = 'inline-flex min-h-11 items-center text-lab underline underline-offset-2';

export function IaDestaque() {
  const todos = IA.platforms.flatMap((p) => p.tests);
  return (
    <div className="grid gap-4">
      <p className="m-0 max-w-[72ch] text-apagado">
        Geradores de imagem testados em 14/11 com a cena e a interface do jogo, separados por plataforma, com o prompt
        de cada imagem. Servem como referência de estilo: a resolução é baixa e o texto às vezes sai errado, então a
        interface final é refeita em HTML e CSS.
      </p>
      <p className="m-0 max-w-[72ch] text-apagado">
        Folha sóbria, degradê azul, borda fina branca, mão apontando e retratos em pixel art, nas proporções do FFT
        (interface pequena, cena protagonista). Base para a direção do jogo.
      </p>
      <CartoesIa tests={IA.featured.map((f) => todos.find((t) => t.file === f)!)} />
    </div>
  );
}

function PorConversa({ tests }: { tests: Test[] }) {
  const { juntas, soltas } = porConversa(tests);
  return (
    <>
      {juntas.map((g) => {
        const estilo = estiloDe(g[0]!.link!);
        return (
          <div key={g[0]!.link} className="grid gap-3">
            <h4 className={H4}>
              {estilo ? `Estilo: ${estilo}` : 'Mesma conversa'} · {contagem(g.length)}{' '}
              <a href={g[0]!.link} target="_blank" rel="noreferrer" className={LINK}>
                abrir conversa
              </a>
            </h4>
            <CartoesIa tests={g} />
          </div>
        );
      })}
      {soltas.length > 0 && (
        <div className="grid gap-3">
          {juntas.length > 0 && <h4 className={H4}>Outras imagens · {contagem(soltas.length)}</h4>}
          <CartoesIa tests={soltas} />
        </div>
      )}
    </>
  );
}

/** the images of one or more subjects (ids of IA.subs), a heading per platform; with several subjects each gets its own title */
export function IaAssunto({ ids }: { ids: string[] }) {
  const desconhecido = ids.find((id) => !IA.subs.some(([s]) => s === id));
  if (desconhecido) return <p className="m-0 text-stop">Assunto desconhecido: {desconhecido}</p>;
  return (
    <div className="grid gap-5">
      {ids.map((id) => {
        const titulo = IA.subs.find(([s]) => s === id)![1];
        const porPlat = IA.platforms
          .map((p) => ({ p, tests: p.tests.filter((t) => iaSub(t) === id) }))
          .filter((x) => x.tests.length);
        return (
          <div key={id} className="grid gap-5">
            {ids.length > 1 && <h3 className={H3}>{titulo}</h3>}
            {porPlat.map(({ p, tests }) => (
              <div key={p.name} className="grid gap-4">
                <h3 className={H3}>
                  {p.name} · {contagem(tests.length)}
                </h3>
                <PorConversa tests={tests} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** account, output and limits of each platform, and the ones not tested yet; the images stay in the subject pages */
export function IaPlataformas() {
  return (
    <div className="grid gap-4">
      <Rolagem>
        <table className={TABELA}>
          <thead>
            <tr>
              {['Plataforma', 'Imagens', 'Conta, saída e limites'].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IA.platforms.map((p) => (
              <tr key={p.name}>
                <td>
                  <strong>{p.name}</strong>
                </td>
                <td>{p.tests.length}</td>
                <td>{p.plan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Rolagem>
      <h3 className={H3}>Ainda sem imagem</h3>
      <Rolagem>
        <table className={TABELA}>
          <thead>
            <tr>
              {['Plataforma', 'Por quê'].map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
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
    </div>
  );
}
