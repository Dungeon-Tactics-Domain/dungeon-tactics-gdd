import { useEffect } from 'react';
import { ARCHIVE, OLD_LAB } from '@/lib/labs';
import { useLabAccent } from '@/lib/useLabAccent';
import { ARQUIVO } from './itens';

export function Arquivo() {
  useLabAccent(ARCHIVE.cor, ARCHIVE.corSuave);
  useEffect(() => {
    document.title = 'Arquivo · Reino dos Laboratórios';
  }, []);
  return (
    <main className="mx-auto grid max-w-[980px] gap-7 px-4 pt-7 pb-16 sm:px-10">
      <header className="grid gap-2">
        <h1 className="m-0 text-[40px] leading-none">Arquivo</h1>
        <p className="m-0 max-w-[72ch] text-[17px]">
          Cópias locais dos artefatos do claude.ai, lidas em 14/11/2026. As cópias abrem no lab atual (porta 5190); aqui
          fica só o índice. <span className="bg-terra px-1.5 font-bold">histórico</span> = já superado, guardado para
          não perder nada.
        </p>
      </header>
      {ARQUIVO.map((sec) => (
        <section key={sec.id} aria-labelledby={`arq-${sec.id}`} className="grid gap-3">
          <h2 id={`arq-${sec.id}`} className="m-0 text-[30px]">
            {sec.titulo}
          </h2>
          <ul className="m-0 grid list-none gap-3 p-0">
            {sec.itens.map((it) => (
              <li key={it.titulo} className="grid gap-1 border border-l-8 border-borda border-l-lab bg-folha px-4 py-3">
                <h3 className="m-0 flex flex-wrap items-center gap-2 text-[21px]">
                  {it.slug ? (
                    <a
                      href={`${OLD_LAB}/arquivo/${it.slug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center"
                    >
                      {it.titulo} ↗
                    </a>
                  ) : (
                    it.titulo
                  )}
                  {it.historico && <span className="bg-terra px-1.5 font-sans text-sm">histórico</span>}
                </h3>
                <span className="text-[15px] text-apagado">
                  {it.data} · {it.resumo}
                </span>
                <span className="text-[15px]">{it.copia}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
