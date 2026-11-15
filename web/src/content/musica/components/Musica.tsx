// Pages of the music lab, read from batalha.json and pastoral.json (one file per old page, format in the old lab's
// musica/data/LEIA-ME.md). Same pieces as dungeon-tactics-lab/musica/src/main.ts: references with a YouTube player on
// click, one track per page with player, stars and sections, and the checks.
/* eslint-disable react-refresh/only-export-components -- PAGINAS is data the manifest reads; the components never hot-reload alone */
import { Fragment, type ReactNode } from 'react';
import { Callout } from '@/components/content/Callout';
import { Player } from '@/components/content/Player';
import { Stars } from '@/components/content/Stars';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed';
import batalha from '../batalha.json';
import pastoral from '../pastoral.json';

interface Ref {
  rotulo: string;
  href: string;
  youtube?: string;
  nota?: string;
  exemplo?: boolean;
}
interface Secao {
  titulo: string;
  texto: string;
}
export interface Faixa {
  id: string;
  letra?: string;
  titulo: string;
  audio?: string;
  nota?: number;
  critica?: string;
  secoes?: Secao[];
  exemplo?: boolean;
}
interface Checagem {
  texto: string;
  estado: string;
  exemplo?: boolean;
}
export interface PaginaMusica {
  titulo?: string;
  descricao?: string;
  referencias?: Ref[];
  faixas?: Faixa[];
  checagens?: Checagem[];
}

export const PAGINAS: Record<'batalha' | 'pastoral', PaginaMusica> = { batalha, pastoral };
export type IdPagina = keyof typeof PAGINAS;

/** Tracks in the old page order: by letter. */
export const faixasDe = (p: PaginaMusica) =>
  [...(p.faixas ?? [])].sort((a, b) => (a.letra ?? a.id).localeCompare(b.letra ?? b.id));
// "critica" is the old format: shown only when the track has no "secoes"
const secoesDe = (t: Faixa) =>
  t.secoes?.length ? t.secoes : t.critica ? [{ titulo: 'Crítica', texto: t.critica }] : [];

const Selo = ({ ligado }: { ligado?: boolean }) =>
  ligado ? <span className="ml-2 border border-traco px-1.5 text-[14px] text-apagado">EXEMPLO</span> : null;
const Vazio = ({ texto }: { texto: string }) => <p className="m-0 text-apagado">{texto}</p>;
const LINK = 'text-lab underline underline-offset-2';

// the old lab's small markdown: paragraphs, "- " lists, **bold**, *italic* and `code`; plain text, never HTML
function inline(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : p.startsWith('*') && p.endsWith('*') && p.length > 2 ? (
      <em key={i}>{p.slice(1, -1)}</em>
    ) : p.startsWith('`') && p.endsWith('`') && p.length > 2 ? (
      <code key={i} className="bg-terra px-1 text-[15px] break-words">
        {p.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

export function Texto({ texto }: { texto: string }) {
  return (
    <div className="grid max-w-[72ch] gap-3">
      {texto
        .trim()
        .split(/\n\s*\n/)
        .map((bloco, i) => {
          const linhas = bloco.split('\n');
          return linhas.every((l) => /^\s*- /.test(l)) ? (
            <ul key={i} className="m-0 grid list-disc gap-1 pl-6">
              {linhas.map((l, j) => (
                <li key={j}>{inline(l.replace(/^\s*- /, ''))}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className="m-0">
              {inline(linhas.join(' '))}
            </p>
          );
        })}
    </div>
  );
}

const pagina = (id: string) => PAGINAS[id as IdPagina] as PaginaMusica | undefined;
const Desconhecida = ({ id }: { id: string }) => <p className="m-0 text-stop">Página de música desconhecida: {id}.</p>;

export function Referencias({ pagina: id }: { pagina: IdPagina }) {
  const p = pagina(id);
  if (!p) return <Desconhecida id={id} />;
  return (
    <>
      <p className="m-0 max-w-[72ch]">
        Players e links do YouTube: a música das obras de referência não fica hospedada aqui.
      </p>
      {p.referencias?.length ? (
        <ul className="m-0 grid list-none gap-4 p-0">
          {p.referencias.map((r) => (
            <li key={r.href} className="grid gap-2">
              {r.youtube && /^[\w-]{11}$/.test(r.youtube) ? (
                <>
                  <strong>
                    {r.rotulo}
                    <Selo ligado={r.exemplo} />
                  </strong>
                  {r.nota && <span className="text-apagado">{r.nota}</span>}
                  {/* the shared button never wraps and its label carries the whole title: wrap it here, or it is wider than a phone */}
                  <div className="min-w-0 [&_button]:text-left [&_button]:whitespace-normal">
                    <YouTubeEmbed id={r.youtube} titulo={r.rotulo} />
                  </div>
                </>
              ) : (
                <span>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    className={`${LINK} inline-flex min-h-11 items-center`}
                  >
                    {r.rotulo} ↗
                  </a>
                  <Selo ligado={r.exemplo} />
                  {r.nota && <span className="text-apagado"> · {r.nota}</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Vazio texto="Nenhuma referência ainda." />
      )}
    </>
  );
}

export function FaixaMusica({ pagina: id, faixa }: { pagina: IdPagina; faixa: string }) {
  const t = pagina(id)?.faixas?.find((f) => f.id === faixa);
  if (!t) return <p className="m-0 text-stop">Faixa desconhecida: {faixa}.</p>;
  return (
    <>
      <h2 className="m-0 text-[26px] leading-tight">
        {t.letra && <span className="mr-2 inline-block bg-lab px-2 text-white">{t.letra}</span>}
        {t.titulo}
        <Selo ligado={t.exemplo} />
      </h2>
      <Callout tom="simples">
        <Player src={t.audio && `/content/musica/${t.audio}`} titulo={t.titulo} />
        <Stars chave={`musica:nota:${t.id}`} rotulo={t.titulo} notaSessao={t.nota} />
      </Callout>
      {secoesDe(t).map((s) => (
        <section key={s.titulo} className="grid gap-2">
          <h3 className="m-0 mt-1 text-[21px] leading-tight">{s.titulo}</h3>
          <Texto texto={s.texto} />
        </section>
      ))}
    </>
  );
}

export function Checagens({ pagina: id }: { pagina: IdPagina }) {
  const p = pagina(id);
  if (!p) return <Desconhecida id={id} />;
  return p.checagens?.length ? (
    <ul className="m-0 grid max-w-[72ch] list-none gap-2 p-0">
      {p.checagens.map((c) => (
        <li key={c.texto} className="flex flex-wrap gap-x-3">
          <span className={c.estado === 'feito' ? 'font-bold text-run' : 'font-bold text-warn'}>
            {c.estado === 'feito' ? '✓ Feito' : '○ Pendente'}
          </span>
          <span>
            {c.texto}
            <Selo ligado={c.exemplo} />
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <Vazio texto="Nenhuma checagem ainda." />
  );
}
