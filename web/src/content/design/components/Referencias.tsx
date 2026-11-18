// Reference pages of the old lab (main.ts): the overview with screen and game filters in blocks of PER_PAGE, the intro of
// each game and each block of its captures.
import { useState } from 'react';
import { blocos, GAMES, NOTICE, PER_PAGE, SCREENS } from '../dados';
import { CartoesRef } from './Cartoes';

const BOTAO =
  'min-h-11 cursor-pointer rounded-[3px] border border-borda bg-folha px-3 text-[14px] text-tinta aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white disabled:cursor-default disabled:opacity-60';
const TODAS = GAMES.flatMap((g) => g.shots.map((s) => ({ ...s, game: g.game, slug: g.slug })));
const jogo = (slug: string) => GAMES.find((g) => g.slug === slug);

// the filter lives in the module, like the old lab: it survives leaving the page and coming back
const filtro = { screen: 'todas', game: 'todos', from: 0 };

export function VisaoGeral() {
  const [f, setF] = useState(filtro);
  const muda = (n: Partial<typeof filtro>) => setF({ ...Object.assign(filtro, n) });
  const lista = TODAS.filter(
    (s) => (f.screen === 'todas' || s.screen === f.screen) && (f.game === 'todos' || s.slug === f.game),
  );
  const from = Math.min(f.from, Math.max(0, lista.length - 1));
  const to = Math.min(from + PER_PAGE, lista.length);
  const pill = (id: string, name: string) => {
    const n = id === 'todas' ? TODAS.length : TODAS.filter((s) => s.screen === id).length;
    return n || id === 'todas' ? (
      <button
        key={id}
        type="button"
        className={BOTAO}
        aria-pressed={f.screen === id}
        onClick={() => muda({ screen: id, from: 0 })}
      >
        {name} ({n})
      </button>
    ) : null;
  };
  return (
    <>
      <p className="m-0 max-w-[72ch] text-apagado">
        {TODAS.length} capturas de {GAMES.length} {GAMES.length === 1 ? 'jogo' : 'jogos'}, descritas por quem olhou a
        imagem. {NOTICE}
      </p>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {pill('todas', 'Todas')}
          {SCREENS.map(([id, name]) => pill(id, name))}
          <label htmlFor="jogo" className="ml-2 text-[14px] text-apagado">
            Jogo
          </label>
          <select
            id="jogo"
            value={f.game}
            onChange={(e) => muda({ game: e.target.value, from: 0 })}
            className="min-h-11 max-w-full border border-borda bg-folha px-2 text-[14px]"
          >
            <option value="todos">Todos os jogos</option>
            {GAMES.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.game} ({g.shots.length})
              </option>
            ))}
          </select>
        </div>
        {lista.length > 0 ? (
          <>
            <div role="group" aria-label="Bloco de capturas" className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className={BOTAO}
                disabled={from === 0}
                onClick={() => muda({ from: Math.max(0, from - PER_PAGE) })}
              >
                ← Anteriores
              </button>
              <span role="status">
                Capturas {from + 1} a {to} de {lista.length}
              </span>
              <button
                type="button"
                className={BOTAO}
                disabled={to >= lista.length}
                onClick={() => muda({ from: from + PER_PAGE })}
              >
                Seguintes →
              </button>
            </div>
            <CartoesRef shots={lista.slice(from, to)} />
          </>
        ) : (
          <p className="m-0 border border-dashed border-borda bg-folha p-7 text-apagado">
            {TODAS.length
              ? 'Nenhuma captura com este filtro.'
              : 'A pesquisa visual ainda está rodando: as capturas aparecem aqui quando cada jogo terminar.'}
          </p>
        )}
      </div>
    </>
  );
}

export function Jogo({ slug }: { slug: string }) {
  const g = jogo(slug);
  if (!g) return <p className="m-0 text-erro">Jogo desconhecido: {slug}</p>;
  return (
    <>
      <p className="m-0 max-w-[72ch]">
        <strong>{g.game}</strong> ({g.year}): {g.shots.length} capturas. {NOTICE}
      </p>
      {g.notFound.length > 0 && (
        <section className="grid gap-2">
          <h3 className="m-0 text-[21px] leading-tight">O que a pesquisa procurou e não achou</h3>
          <ul className="m-0 grid max-w-[72ch] list-disc gap-1 pl-6">
            {g.notFound.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export function CapturasJogo({ slug, bloco }: { slug: string; bloco: number }) {
  const g = jogo(slug);
  const c = g && blocos(g)[bloco - 1];
  if (!g || !c)
    return (
      <p className="m-0 text-erro">
        Bloco desconhecido: {slug} {bloco}
      </p>
    );
  return <CartoesRef shots={c.map((s) => ({ ...s, game: g.game }))} />;
}
