// Home (B-2, Stitch 18/11): a card per lab with its groups, straight from each lab's table of contents.
import { useEffect } from 'react';
import { Link } from 'react-router';
import { Marca } from '@/features/paginas/parts';
import { CONTEUDO } from '@/content/registry';
import { HUB, LABS, type Place, SITE } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';
import { cn } from '@/lib/utils';

// the first pages of each group show on the card; the rest are one "Ver todas" link away (Fernando, 18/11)
const MOSTRAR = 3;
const LINK = 'flex min-h-11 items-center px-1 text-base no-underline hover:bg-lab-soft';

function CartaoLab({ lab }: { lab: Place }) {
  const grupos = CONTEUDO[lab.id]?.sumario.grupos ?? [];
  return (
    // the card's own --lab colours its marker and hover
    <article
      style={{ '--lab': lab.cor, '--lab-soft': lab.corSuave } as React.CSSProperties}
      className="grid content-start gap-3 border-2 border-couro-escuro bg-folha p-5 shadow-folha"
    >
      <h2 className="m-0 text-(length:--h2) leading-tight">
        <Link to={lab.href ?? '/'} className="flex min-h-11 items-center gap-2.5 no-underline hover:underline">
          <Marca />
          {lab.nome}
        </Link>
      </h2>
      <p className="m-0 text-base">{lab.descricao}.</p>
      {grupos.length > 0 && (
        <div className="grid gap-3 border-t-2 border-couro-escuro pt-2">
          {grupos.map((g) => (
            <section key={g.id} aria-label={g.titulo}>
              <h3 className="m-0 flex items-baseline justify-between gap-3 px-1 text-base">
                <span>{g.titulo}</span>
                <span className="font-sans font-normal text-apagado">{g.paginas.length}</span>
              </h3>
              <ul className="m-0 grid list-none p-0">
                {g.paginas.slice(0, MOSTRAR).map((p) => (
                  <li key={p.id}>
                    <Link to={`${lab.href}/${g.id}/${p.id}`} className={LINK}>
                      {p.titulo}
                    </Link>
                  </li>
                ))}
                {g.paginas.length > MOSTRAR && (
                  <li>
                    <Link to={`${lab.href}/${g.id}`} className={cn(LINK, 'font-bold text-lab')}>
                      Ver todas ({g.paginas.length})
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}

export function Home() {
  useLabAccent(HUB.cor, HUB.corSuave);
  useEffect(() => {
    document.title = SITE;
  }, []);
  return (
    <main className="mx-auto grid max-w-[1800px] content-start gap-6 px-(--margem) pt-7 pb-16">
      <header className="grid gap-1.5 border-b-2 border-couro-escuro pb-3">
        <h1 className="m-0 text-(length:--h1) leading-none">{SITE}</h1>
        <p className="m-0 text-[17px] text-apagado">Os laboratórios do jogo. Escolha um.</p>
      </header>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6 p-0">
        {LABS.map((lab) => (
          <li key={lab.id} className="grid">
            <CartaoLab lab={lab} />
          </li>
        ))}
      </ul>
    </main>
  );
}
