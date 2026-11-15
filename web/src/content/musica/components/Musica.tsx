// Pages of the music lab, read from batalha.json and pastoral.json (one file per old page, format in the old lab's
// musica/data/LEIA-ME.md). Same pieces as dungeon-tactics-lab/musica/src/main.ts: references with a YouTube player on
// click, one track per page with player, stars and sections, and the checks.
/* eslint-disable react-refresh/only-export-components -- PAGINAS is data the manifest reads; the components never hot-reload alone */
import { Fragment, useState, type ReactNode } from 'react';
import { Player } from '@/components/content/Player';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed';
import { Estudio } from './Estudio';
import { MidiVisual } from './MidiVisual';
import batalha from '../batalha.json';
import pastoral from '../pastoral.json';
import temaDark from '../tema-dark.json';
import trisection from '../trisection.json';

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

export const PAGINAS: Record<'batalha' | 'pastoral' | 'trisection' | 'tema-dark', PaginaMusica> = {
  batalha,
  pastoral,
  trisection,
  'tema-dark': temaDark,
};
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

// which .mid holds the notes of a track (the "-t", "-tfg" and "-cru" twins are the same notes in another render)
const midiDe = (id: string) => {
  const m = /^(batalha|pastoral)-([a-f])/.exec(id);
  if (m) return `${m[1]}_${m[2]!.toUpperCase()}`;
  if (id.startsWith('ref-trisection-midi-transcricao')) return 'trisection_transcricao';
  if (id.startsWith('ref-trisection-midi-fa')) return 'trisection_fa';
  if (id.startsWith('dark-') && !id.startsWith('dark-v1')) return id.includes('intenso') ? 'dark_intenso' : 'dark'; // v1 has no matching .mid
};

// tracks with one rendered .ogg per instrument (public/content/musica/stems/<name>/); the rest use the synthesizer mixer
const stemsDe = (id: string) => {
  if (/^dark-(intenso|principal)(-cru)?$/.test(id)) return id.includes('intenso') ? 'dark_intenso' : 'dark';
  const tri = /^ref-trisection-midi-(fa(?:-\w+?)?|transcricao)(-cru)?$/.exec(id);
  if (tri) return `trisection_${tri[1]!.replace('-', '_')}`;
  const f = /^(batalha|pastoral)-([a-f])(-tfg)?(-t)?$/.exec(id);
  if (f) return `${f[1]}_${f[2]!.toUpperCase()}${f[3] ? '_tfg' : ''}`;
};

// the sounds one track is offered in; "faixa" is the page whose text describes that sound
const SONS_TRISECTION = [
  ['fa', 'MuseScore General'],
  ['fa-gugs', 'GeneralUser GS'],
  ['fa-fluidr3', 'FluidR3'],
  ['fa-sgm', 'SGM'],
  ['fa-neo', 'Neo Orchestra'],
  ['fa-tfg', 'Tactical Fantasy Guy'],
  ['fa-sonatina', 'Sonatina'],
  ['transcricao', 'Transcrição do áudio'],
] as const;
const versoesDe = (id: string) => {
  const f = /^(batalha|pastoral)-[a-f](-tfg)?(-t)?$/.exec(id);
  if (f) {
    const raiz = id.replace(/(-tfg)?(-t)?$/, '');
    return {
      raiz,
      atual: f[2] ? 1 : 0,
      opcoes: [
        { rotulo: 'MuseScore General', faixa: raiz },
        { rotulo: 'Tactical Fantasy Guy', faixa: `${raiz}-tfg` },
      ],
    };
  }
  const tri = /^ref-trisection-midi-(fa(?:-\w+?)?|transcricao)(-cru)?$/.exec(id);
  if (tri)
    return {
      raiz: 'ref-trisection-midi',
      atual: Math.max(
        0,
        SONS_TRISECTION.findIndex(([k]) => k === tri[1]),
      ),
      opcoes: SONS_TRISECTION.map(([k, rotulo]) => ({ rotulo, faixa: `ref-trisection-midi-${k}` })),
    };
};

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
  const [versao, setVersao] = useState(() => versoesDe(faixa)?.atual ?? 0);
  if (!t) return <p className="m-0 text-stop">Faixa desconhecida: {faixa}.</p>;
  // one track, several sounds: the page switches in place (batalha-a and batalha-a-tfg; the Trisection fan MIDI per soundfont)
  const grupo = versoesDe(t.id);
  const alvo = grupo ? (pagina(id)?.faixas?.find((f) => f.id === grupo.opcoes[versao]?.faixa) ?? t) : t;
  const stems = stemsDe(grupo ? alvo.id : t.id);
  const midi = stems ?? midiDe(t.id);
  const secoes = secoesDe(alvo);
  return (
    <>
      <Selo ligado={t.exemplo} />
      {grupo && (
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Som">
          <span className="text-apagado">Som:</span>
          {grupo.opcoes.map((o, k) => (
            <button
              key={o.rotulo}
              aria-pressed={versao === k}
              onClick={() => setVersao(k)}
              className={`min-h-10 rounded border border-traco px-3 ${versao === k ? 'bg-lab font-bold text-white' : 'bg-white'}`}
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      )}
      {stems && midi ? (
        <Estudio
          key={stems}
          base={stems}
          midiSrc={`/content/musica/midi/${midi}.mid`}
          tratadaInicial={
            t.id.startsWith('ref-trisection') ? !t.id.endsWith('-cru') : /-t$|^dark-(principal|intenso)$/.test(t.id)
          }
          chave={grupo?.raiz ?? t.id}
        />
      ) : (
        <>
          <Player src={t.audio && `/content/musica/${t.audio}`} titulo={t.titulo} />
          {midi && (
            <>
              <MidiVisual src={`/content/musica/midi/${midi}.mid`} />
              <details>
                <summary className="min-h-11 cursor-pointer py-2">
                  Mixer ao vivo: tocar o MIDI com volume e mudo por instrumento
                </summary>
                {/* static page with its own synthesizer (spessasynth): keeps the dependency out of the shared package.json */}
                <iframe
                  title={`Mixer ao vivo de ${t.titulo}`}
                  src={`/content/musica/teste-spessasynth/index.html?faixa=${midi}`}
                  className="h-[640px] w-full border border-traco"
                  loading="lazy"
                />
              </details>
            </>
          )}
        </>
      )}
      {secoes.length > 0 && (
        <details open className="rounded-md border border-traco bg-white/40 px-4 py-2">
          <summary className="min-h-11 cursor-pointer py-2 font-bold">Sobre esta faixa</summary>
          <div className="grid gap-4 pb-3">
            {secoes.map((s) => (
              <section key={s.titulo} className="grid gap-2">
                <h3 className="m-0 text-[19px] leading-tight">{s.titulo}</h3>
                <Texto texto={s.texto} />
              </section>
            ))}
          </div>
        </details>
      )}
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
