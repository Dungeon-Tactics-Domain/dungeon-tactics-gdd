// Home of the kingdom (grill of 14/11, direction B): the map with every lab as a town.
import { useEffect } from 'react';
import { HUB, LABS, SITE } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';
import { Mapa } from './Mapa';

export function Home() {
  useLabAccent(HUB.cor, HUB.corSuave);
  useEffect(() => {
    document.title = SITE;
  }, []);
  return (
    <main className="mx-auto grid max-w-[1440px] content-start gap-6 px-(--margem) pt-6 pb-16">
      <header className="grid gap-1.5">
        <h1 className="m-0 text-(length:--h1) leading-none">{SITE}</h1>
        <p className="m-0 text-[17px]">Cada lab é uma cidade. Escolha uma.</p>
      </header>
      <section aria-labelledby="mapa-titulo">
        <h2 id="mapa-titulo" className="sr-only">
          Mapa do reino
        </h2>
        <Mapa labs={LABS} />
      </section>
    </main>
  );
}
