// The narrative lab's pages: game and work sheets, the loop track, the moodboard, the marks and the plan.
// Same content and behaviour as dungeon-tactics-lab/narrativa/src/main.ts, rendered from dados.ts.
import * as Dialog from '@radix-ui/react-dialog';
import { type ReactNode, useRef, useState } from 'react';
import { Rolagem, TABELA } from '@/components/content/DataTable';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed';
import { DECISOES_ATIVAS } from '@/lib/recursos';
import { cn } from '@/lib/utils';
import {
  CAMADAS,
  EIXOS,
  type Game,
  IMAGENS,
  type Imagem,
  JOGOS,
  type Lesson,
  OBRAS,
  PLANO,
  TEMAS,
  type Work,
  urlImagem,
} from '../dados';
import { lerMarcas, type Marca, useMarca } from './marcas';

const TAG: Record<string, string> = {
  feito: 'border-run text-run',
  fazendo: 'border-lab bg-lab-soft text-lab',
  aberto: 'border-warn bg-warn-soft text-warn',
  bloqueado: 'border-stop bg-stop-soft text-stop',
};
const Tag = ({ s }: { s: string }) => (
  <span className={cn('inline-block rounded-sm border bg-folha px-2 text-[14px] font-bold whitespace-nowrap', TAG[s])}>
    {s}
  </span>
);
const Lede = ({ children }: { children: ReactNode }) => <p className="m-0 max-w-[72ch] text-apagado">{children}</p>;
const Vazio = ({ children }: { children: ReactNode }) => <p className="m-0 text-apagado italic">{children}</p>;
const Fonte = ({ href }: { href: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="inline-flex min-h-11 items-center justify-self-start text-lab underline underline-offset-2"
  >
    Fonte
  </a>
);
const CARTAO = 'grid content-start gap-1.5 border border-borda bg-folha p-3';
const GRADE = 'm-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3 p-0';

// ---------- marks ----------

const BOTAO =
  'min-h-11 cursor-pointer rounded-sm border border-borda bg-folha px-3 text-[14px] text-tinta hover:bg-lab-soft';

function BotoesMarca({ m }: { m: ReturnType<typeof useMarca> }) {
  if (!DECISOES_ATIVAS) return null;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-pressed={m.marca?.v === 'quero'}
        onClick={() => m.alternar('quero')}
        className={cn(BOTAO, 'aria-pressed:border-run aria-pressed:bg-run aria-pressed:text-white')}
      >
        Quero
      </button>
      <button
        type="button"
        aria-pressed={m.marca?.v === 'nao'}
        onClick={() => m.alternar('nao')}
        className={cn(BOTAO, 'aria-pressed:border-stop aria-pressed:bg-stop aria-pressed:text-white')}
      >
        Não quero
      </button>
      {m.marca && (
        <input
          type="text"
          placeholder="nota (opcional)"
          aria-label="Nota"
          value={m.marca.note}
          onChange={(e) => m.anotar(e.target.value)}
          className="min-h-11 min-w-[120px] flex-1 border border-traco bg-folha px-2 text-[14px]"
        />
      )}
    </div>
  );
}

function MarcaSolta({ chave, label }: { chave: string; label: string }) {
  return <BotoesMarca m={useMarca(chave, label)} />;
}

// ---------- image with zoom (one dialog per image; focus goes back to it on close) ----------

function Ampliavel({ src, titulo }: { src: string; titulo: string }) {
  const botao = useRef<HTMLButtonElement>(null);
  const [aberta, setAberta] = useState(false);
  return (
    <Dialog.Root open={aberta} onOpenChange={setAberta}>
      <Dialog.Trigger asChild>
        <button
          ref={botao}
          type="button"
          aria-label={`Ampliar: ${titulo}`}
          className="block min-h-11 w-full cursor-zoom-in bg-tinta"
        >
          <img src={src} alt={titulo} loading="lazy" className="block aspect-[16/10] w-full object-cover" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-tinta/80" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            botao.current?.focus();
          }}
          className="fixed inset-2 z-50 m-auto grid h-fit max-h-[calc(100dvh-16px)] w-fit max-w-[calc(100vw-16px)] gap-2 overflow-auto bg-folha p-3"
        >
          <img src={src} alt={titulo} className="block max-h-[78dvh] max-w-full object-contain" />
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="m-0 font-sans text-[15px] font-normal">{titulo}</Dialog.Title>
            <Dialog.Close className="min-h-11 min-w-11 cursor-pointer rounded-md border-2 border-tinta px-3 font-bold">
              Fechar
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------- moodboard ----------

const chaveImagem = (s: { slug: string; file: string }) => `${s.slug}:i:${s.file}`;

function Figura({ s }: { s: Imagem }) {
  const m = useMarca(chaveImagem(s), `${s.nome} · ${s.title}`);
  return (
    // green outline on the ones marked "Quero", as in the old moodboard
    <li
      className={cn(
        'border border-borda bg-folha',
        DECISOES_ATIVAS && m.marca?.v === 'quero' && 'outline-3 -outline-offset-3 outline-run',
      )}
    >
      <figure className="m-0 grid gap-1.5">
        <Ampliavel src={urlImagem(s.file)} titulo={s.title} />
        <figcaption className="grid gap-1 px-2.5 pb-2.5 text-[15px]">
          <span>
            <span className="font-bold text-lab">{s.nome}</span> {s.title}
          </span>
          <BotoesMarca m={m} />
        </figcaption>
      </figure>
    </li>
  );
}

/** `slug` = one work's images; "quero" = the images marked "Quero" in this browser. */
export function Moodboard({ slug }: { slug: string }) {
  const [marcas] = useState(lerMarcas);
  if (slug !== 'quero' && !IMAGENS.some((s) => s.slug === slug))
    return <p className="m-0 text-stop">Slug desconhecido no moodboard: {slug}.</p>;
  const lista = IMAGENS.filter((s) => (slug === 'quero' ? marcas[chaveImagem(s)]?.v === 'quero' : s.slug === slug));
  return lista.length ? (
    <ul className={GRADE}>
      {lista.map((s) => (
        <Figura key={chaveImagem(s)} s={s} />
      ))}
    </ul>
  ) : (
    <Vazio>Nenhuma imagem com este filtro ainda.</Vazio>
  );
}

// ---------- sheets ----------

const ytId = (url: string) => url.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/)?.[1];

function Ficha({ e, nome, licoes, extra }: { e: Game | Work; nome: string; licoes: Lesson[]; extra?: ReactNode }) {
  return (
    <div className="grid gap-4">
      <p className="m-0 max-w-[72ch]">{e.why}</p>
      {extra}
      <h2 className="m-0 mt-2 text-[26px] leading-tight">Lições</h2>
      <ul className={GRADE}>
        {licoes.map((l) => (
          <li key={l.name} className={CARTAO}>
            <strong>{l.name}</strong>
            <span>{l.what}</span>
            {l.story && (
              <span>
                <em>Na história: </em>
                {l.story}
              </span>
            )}
            {l.take && <span className="text-run">Aproveitar: {l.take}</span>}
            {l.avoid && <span className="text-stop">Evitar: {l.avoid}</span>}
            <Fonte href={l.source} />
            <MarcaSolta chave={`${e.slug}:l:${l.name}`} label={`${nome} · ${l.name}`} />
          </li>
        ))}
      </ul>
      {/* collapsed as in the old lab: the page fits a screen and a half and nothing loads until opened */}
      {e.videos.length > 0 && (
        <details className="border border-borda bg-folha">
          <summary className="flex min-h-11 cursor-pointer items-center px-3 font-bold">
            Vídeos ({e.videos.length})
          </summary>
          <ul className={cn(GRADE, 'p-3')}>
            {e.videos.map((v) => {
              const id = ytId(v.url);
              return (
                <li key={v.url} className={CARTAO}>
                  {id && (
                    // the shared button keeps its label on one line; long video titles must wrap inside the card
                    <div className="min-w-0 [&_button]:h-auto [&_button]:py-2 [&_button]:text-left [&_button]:whitespace-normal">
                      <YouTubeEmbed id={id} titulo={v.title} />
                    </div>
                  )}
                  <span className="font-bold text-lab">{v.kind}</span>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center text-lab underline underline-offset-2"
                  >
                    <strong>{v.title}</strong>
                  </a>
                  <span>{v.note}</span>
                </li>
              );
            })}
          </ul>
        </details>
      )}
      {e.shots.length > 0 && (
        <details className="border border-borda bg-folha">
          <summary className="flex min-h-11 cursor-pointer items-center px-3 font-bold">
            Imagens ({e.shots.length})
          </summary>
          <ul className={cn(GRADE, 'p-3')}>
            {e.shots.map((s) => (
              <li key={s.file} className="grid content-start border border-borda bg-folha">
                <Ampliavel src={urlImagem(s.file)} titulo={s.title} />
                <div className="grid gap-1.5 p-3">
                  <span className="font-bold text-lab">{TEMAS[s.theme] ?? s.theme}</span>
                  <strong>{s.title}</strong>
                  <span>{s.note}</span>
                  {s.take && <span className="text-run">Aproveitar: {s.take}</span>}
                  <Fonte href={s.source} />
                  <MarcaSolta chave={`${e.slug}:i:${s.file}`} label={`${nome} · ${s.title}`} />
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
      {e.notFound.length > 0 && <Lede>Procurado e não achado: {e.notFound.join(' · ')}</Lede>}
    </div>
  );
}

const jogo = (slug: string) => JOGOS.find((g) => g.slug === slug);
const Desconhecido = ({ slug }: { slug: string }) => <p className="m-0 text-stop">Slug desconhecido: {slug}.</p>;

export function FichaJogo({ slug }: { slug: string }) {
  const g = jogo(slug);
  return g ? <Ficha e={g} nome={g.game} licoes={g.mechanics} /> : <Desconhecido slug={slug} />;
}

export function FichaObra({ slug }: { slug: string }) {
  const w = OBRAS.find((o) => o.slug === slug);
  if (!w) return <Desconhecido slug={slug} />;
  const eixos = (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
      {EIXOS.filter(([k]) => w.axes[k]).map(([k, n]) => (
        <div key={k} className={CARTAO}>
          <strong>{n}</strong>
          <span>{w.axes[k]}</span>
        </div>
      ))}
    </div>
  );
  return <Ficha e={w} nome={`${w.work} · ${w.kind}`} licoes={w.lessons} extra={eixos} />;
}

/** Each game on the same 4 layers, to compare how the story crosses the loop. */
export function Loop({ slug }: { slug: string }) {
  const g = jogo(slug);
  if (!g) return <Desconhecido slug={slug} />;
  return (
    <div className="grid gap-4">
      <ol className="m-0 grid list-none gap-2 p-0 desk:grid-cols-4">
        {CAMADAS.map(([k, n]) => (
          <li
            key={k}
            className={cn(
              'grid content-start gap-1 border border-borda border-t-[6px] border-t-lab bg-folha p-3',
              !g.loop[k] && 'text-apagado',
            )}
          >
            <strong>{n}</strong>
            <span>{g.loop[k] || 'Não tem.'}</span>
          </li>
        ))}
      </ol>
      <ul className="m-0 grid max-w-[72ch] list-disc gap-1 pl-6">
        {g.gives.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

export function MinhasMarcas() {
  const [linhas] = useState(() => Object.entries(lerMarcas()));
  const lista = (v: Marca['v']) => linhas.filter(([, m]) => m.v === v);
  const tabela = (v: Marca['v']) =>
    lista(v).length ? (
      <Rolagem>
        <table className={TABELA}>
          <tbody>
            {lista(v).map(([k, m]) => (
              <tr key={k}>
                <td>{m.label}</td>
                <td className="text-apagado">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Rolagem>
    ) : (
      <Vazio>Nada ainda.</Vazio>
    );
  return (
    <div className="grid gap-3">
      <h2 className="m-0 mt-2 text-[26px] leading-tight">Quero ({lista('quero').length})</h2>
      {tabela('quero')}
      <h2 className="m-0 mt-2 text-[26px] leading-tight">Não quero ({lista('nao').length})</h2>
      {tabela('nao')}
    </div>
  );
}

// ---------- plan ----------

export function Agora() {
  const a = PLANO.agora;
  return (
    <div className="grid gap-3 border border-borda border-t-[6px] border-t-lab bg-folha px-5 py-4">
      {a ? (
        <>
          <p className="m-0">
            <strong>{a.question}</strong>
          </p>
          <p className="m-0">{a.why}</p>
          <Lede>{a.example}</Lede>
          <ul className="m-0 grid list-disc gap-1 pl-6">
            {a.options.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          <p className="m-0">
            <strong>Recomendação: </strong>
            {a.pick}
          </p>
        </>
      ) : (
        <>
          <p className="m-0">
            <strong>Nenhuma decisão pendente.</strong>
          </p>
          <p className="m-0">
            <strong>Próximo passo: </strong>
            {PLANO.proximoPasso}
          </p>
        </>
      )}
    </div>
  );
}

export function Fases() {
  return (
    <ul className="m-0 grid list-none gap-2 p-0">
      {PLANO.fases.map((f) => (
        <li
          key={f.id}
          className="grid items-center gap-2 border border-borda bg-folha p-3 desk:grid-cols-[90px_1fr_auto]"
        >
          <b>{f.id}</b>
          <span>
            {f.nome}
            <span className="text-apagado"> · {f.portao}</span>
          </span>
          <span>
            <Tag s={f.estado} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Pedidos() {
  return (
    <Rolagem>
      <table className={TABELA}>
        <thead>
          <tr>
            {['Data', 'Pedido', 'Dono', 'Estado', 'Prova ou próximo passo'].map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PLANO.pedidos.map((p) => (
            <tr key={p.pedido}>
              <td className="whitespace-nowrap">{p.data}</td>
              <td>{p.pedido}</td>
              <td>{p.dono}</td>
              <td>
                <Tag s={p.estado} />
              </td>
              <td>{p.proximo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  );
}

export function DecisoesTomadas() {
  return PLANO.decisoes.length ? (
    <Rolagem>
      <table className={TABELA}>
        <tbody>
          {PLANO.decisoes.map((d, i) => (
            <tr key={d.tema}>
              <td>{i + 1}</td>
              <td>
                <strong>{d.tema}</strong>
              </td>
              <td>{d.decisao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Rolagem>
  ) : (
    <Vazio>Nenhuma ainda.</Vazio>
  );
}
