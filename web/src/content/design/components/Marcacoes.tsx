// Floor marks in 3D (4 styles): static captures side by side + live iframe of the game bench (npm run bench in the
// marcas-3d worktree). Same idea as MenuJogo: "Ver ao vivo" mounts the iframe, "Parar" unloads it; the bench only allows localhost.
import { useState } from 'react';

const BASE = '/content/design/marcacoes';
const ESTILOS = [
  ['simples', 'Simples'],
  ['luz', 'Luz'],
  ['pedra', 'Pedra'],
  ['neon', 'Neon'],
] as const;
type Estilo = (typeof ESTILOS)[number][0];
const CENARIOS = [
  { id: 'ash', nome: 'Ash Wood', prefixo: 'marks', scenario: 'ash_wood' },
  { id: 'degraus', nome: 'Degraus', prefixo: 'marks-degraus', scenario: 'beacon_hill' },
] as const;
const PORTA = 5364;

const ESCOLHA =
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-checked:border-lab aria-checked:bg-lab aria-checked:text-creme';
const BOTAO =
  'min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-4 text-[15px] text-tinta hover:bg-lab-soft';

export function Marcacoes() {
  const [aoVivo, setAoVivo] = useState(false);
  const [estilo, setEstilo] = useState<Estilo>('luz');
  const [cenarioId, setCenarioId] = useState<(typeof CENARIOS)[number]['id']>('ash');
  const cenario = CENARIOS.find((c) => c.id === cenarioId)!;
  const arquivo = `${cenario.prefixo}-${estilo}`;
  const src = `http://localhost:${PORTA}/?scenario=${cenario.scenario}&marks=${estilo}&sandbox=bench/${arquivo}.json`;
  return (
    <div className="my-4 grid gap-6">
      {CENARIOS.map((c) => (
        <section key={c.id} aria-label={`Comparação, ${c.nome}`} className="grid gap-2">
          <h3 className="m-0 text-base font-semibold">{c.nome}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {ESTILOS.map(([id, nome]) => (
              <figure key={id} className="m-0 grid gap-1">
                <img
                  src={`${BASE}/${c.prefixo}-${id}.webp`}
                  alt={`Marcações do chão, estilo ${nome}, cenário ${c.nome}`}
                  loading="lazy"
                  className="block aspect-video w-full rounded-md border border-borda object-cover"
                />
                <figcaption className="text-sm text-tinta-suave">{nome}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
      <section aria-label="Folhas de comparação" className="grid gap-2">
        <h3 className="m-0 text-base font-semibold">Folhas lado a lado</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['folha-ash-wood', 'Ash Wood, os 4 estilos'],
            ['folha-degraus', 'Degraus, os 4 estilos'],
            ['recorte-folha-ash-wood', 'Ash Wood, recorte aproximado'],
            ['recorte-folha-degraus', 'Degraus, recorte aproximado'],
          ].map(([id, nome]) => (
            <figure key={id} className="m-0 grid gap-1">
              <img src={`${BASE}/${id}.webp`} alt={nome} loading="lazy" className="block w-full rounded-md border border-borda" />
              <figcaption className="text-sm text-tinta-suave">{nome}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section aria-label="Ao vivo" className="grid gap-2">
        <div role="radiogroup" aria-label="Cenário" className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm text-tinta-suave">Cenário</span>
          {CENARIOS.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={c.id === cenarioId} onClick={() => setCenarioId(c.id)} className={ESCOLHA}>
              {c.nome}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Estilo" className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm text-tinta-suave">Estilo</span>
          {ESTILOS.map(([id, nome]) => (
            <button key={id} type="button" role="radio" aria-checked={id === estilo} onClick={() => setEstilo(id)} className={ESCOLHA}>
              {nome}
            </button>
          ))}
        </div>
        <div>
          <button type="button" onClick={() => setAoVivo((v) => !v)} className={BOTAO}>
            {aoVivo ? 'Parar' : 'Ver ao vivo'}
          </button>
        </div>
        {aoVivo ? (
          <iframe
            key={src}
            src={src}
            title={`Jogo com marcações ${estilo}, cenário ${cenario.nome}`}
            allow="fullscreen"
            className="mx-auto block aspect-video w-full max-w-[min(160vh,1280px)] rounded-lg border border-borda bg-tinta"
          />
        ) : (
          <p className="m-0 rounded-lg border border-borda bg-folha px-4 py-3 text-sm">
            Suba a bancada (<code>npm run bench -- --port {PORTA}</code> no worktree <code>marcas-3d</code> do jogo) e clique em
            &laquo;Ver ao vivo&raquo;. Dentro do jogo: mouse e teclado.
          </p>
        )}
      </section>
    </div>
  );
}
