// Image cards of the old lab (.shots/.shot in shared/lab.css): the image opens the reader, which walks the page's list.
// References show layout, pieces, take and avoid; AI tests show size, attachment, source chat, hit, miss and the prompt.
import { type ReactNode, useState } from 'react';
import { ASSETS, screenName, type Shot, type Test } from '../dados';
import { Leitor } from './Leitor';

const LINK = 'inline-flex min-h-11 items-center self-start text-[14px] text-lab underline underline-offset-2';

function Grade({ itens }: { itens: { src: string; title: string; corpo: ReactNode }[] }) {
  const [aberta, setAberta] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(400px,100%),1fr))] gap-[18px]">
        {itens.map((it, n) => (
          <article key={it.src} className="grid content-start border border-borda bg-folha">
            <button
              type="button"
              aria-label={`Ampliar: ${it.title}`}
              onClick={() => setAberta(n)}
              className="block cursor-zoom-in bg-pergaminho-escuro p-2.5"
            >
              <img src={it.src} alt={it.title} loading="lazy" className="block aspect-video w-full object-contain" />
            </button>
            <div className="grid gap-1.5 px-3.5 py-3 text-[15px]">{it.corpo}</div>
          </article>
        ))}
      </div>
      {aberta !== null && <Leitor lista={itens} inicio={aberta} onFechar={() => setAberta(null)} />}
    </>
  );
}

const Rotulo = ({ children }: { children: ReactNode }) => (
  <span className="text-[14px] font-bold text-apagado">{children}</span>
);

export function CartoesRef({ shots }: { shots: (Shot & { game: string })[] }) {
  return (
    <Grade
      itens={shots.map((s) => ({
        // the old JSON paths are relative to the /design/ page
        src: `${ASSETS}/${s.file}`,
        title: s.title,
        corpo: (
          <>
            <Rotulo>
              {s.game} · {screenName(s.screen)}
            </Rotulo>
            <strong>{s.title}</strong>
            <span>{s.layout}</span>
            <ul className="m-0 list-disc pl-[18px]">
              {s.pieces.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
            {s.take && <span className="text-sucesso">Aproveitar: {s.take}</span>}
            {s.avoid && <span className="text-erro">Evitar: {s.avoid}</span>}
            <a href={s.source} target="_blank" rel="noreferrer" className={LINK}>
              Fonte
            </a>
          </>
        ),
      }))}
    />
  );
}

export function CartoesIa({ tests }: { tests: Test[] }) {
  return (
    <Grade
      itens={tests.map((t) => ({
        src: `${ASSETS}/ia/${t.file}`,
        title: t.title,
        corpo: (
          <>
            <Rotulo>{t.size}</Rotulo>
            <strong>{t.title}</strong>
            {t.attached && <span>Anexo: {t.attached}</span>}
            {t.link && (
              <a href={t.link} target="_blank" rel="noreferrer" className={LINK}>
                Conversa de origem
              </a>
            )}
            <span className="text-sucesso">Acertou: {t.good}</span>
            <span className="text-erro">Errou: {t.bad}</span>
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center">Prompt usado</summary>
              <pre className="m-0 mt-2 max-h-[260px] overflow-auto font-sans text-[14px] leading-normal whitespace-pre-wrap">
                {t.prompt}
              </pre>
            </details>
          </>
        ),
      }))}
    />
  );
}
