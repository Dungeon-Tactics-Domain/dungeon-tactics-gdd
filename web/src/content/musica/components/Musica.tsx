// Pages of the music lab, read from batalha.json and pastoral.json (one file per old page, format in the old lab's
// musica/data/LEIA-ME.md). Same pieces as dungeon-tactics-lab/musica/src/main.ts: references with a YouTube player on
// click, one track per page with player, stars and sections, and the checks.
/* eslint-disable react-refresh/only-export-components -- PAGINAS is data the manifest reads; the components never hot-reload alone */
import { Fragment, useState, type ReactNode } from 'react';
import { Player } from '@/components/content/Player';
import { YouTubeEmbed } from '@/components/content/YouTubeEmbed';
import { Icone } from '@/components/layout/Icone';
import { Estudio } from './Estudio';
import { MidiVisual } from './MidiVisual';
import batalha from '../batalha.json';
import pastoral from '../pastoral.json';
import bof4 from '../bof4.json';
import jingles from '../jingles.json';
import pastoralRica from '../pastoral-rica.json';
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
  papeis?: Partial<Record<string, string>>; // channel number (1-based) -> why that instrument is in this piece
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

export const PAGINAS: Record<
  'batalha' | 'pastoral' | 'trisection' | 'tema-dark' | 'jingles' | 'bof4' | 'pastoral-rica',
  PaginaMusica
> = {
  batalha,
  pastoral,
  trisection,
  'tema-dark': temaDark,
  jingles,
  bof4,
  'pastoral-rica': pastoralRica,
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
      <code key={i} className="bg-pergaminho-escuro px-1 text-[15px] break-words">
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
          if (linhas.every((l) => l.startsWith('|'))) {
            // a table: the first row is the head, the second ("|---|") only separates it
            const celulas = (l: string) =>
              l
                .replace(/^\||\|$/g, '')
                .split('|')
                .map((c) => c.trim());
            const [cab, , ...corpo] = linhas;
            return (
              <div key={i} className="overflow-x-auto">
                <table className="w-full border-collapse border border-ouro bg-folha text-[15px]">
                  <thead>
                    <tr className="bg-pergaminho-escuro text-left">
                      {celulas(cab!).map((c, j) => (
                        <th key={j} className={`border border-ouro px-3 py-1.5 ${j ? 'text-right' : ''}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corpo.map((l, j) => (
                      <tr key={j}>
                        {celulas(l).map((c, k) => (
                          <td key={k} className={`border border-ouro px-3 py-1 ${k ? 'text-right tabular-nums' : ''}`}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
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

// study references (BoF4 and Chrono Cross fan MIDIs): the folder name of their stems, from the page id
const estudoDe = (id: string) => {
  const m = /^ref-(bof4|cc|ff9|ff8)-(.+)$/.exec(id);
  return m ? `${m[1]}_${m[2]!.replace(/-/g, '_')}` : undefined;
};

// which .mid holds the notes of a track (the "-t", "-tfg" and "-cru" twins are the same notes in another render)
const midiDe = (id: string) => {
  const e = estudoDe(id);
  if (e) return e;
  const j = /^jingle-([a-z])-(\w+)$/.exec(id);
  if (j) return `jingle_${j[1]!.toUpperCase()}_${j[2]}`;
  const r = /^pastoral-rica-([a-z])$/.exec(id);
  if (r) return `pastoral_rica_${r[1]!.toUpperCase()}`;
  const m = /^(batalha|pastoral)-([a-f])/.exec(id);
  if (m) return `${m[1]}_${m[2]!.toUpperCase()}`;
  if (id.startsWith('ref-trisection-midi-transcricao')) return 'trisection_transcricao';
  if (id.startsWith('ref-trisection-midi-fa')) return 'trisection_fa';
  if (id.startsWith('dark-') && !id.startsWith('dark-v1')) return id.includes('intenso') ? 'dark_intenso' : 'dark'; // v1 has no matching .mid
};

// tracks with one rendered .ogg per instrument (public/content/musica/stems/<name>/); the rest use the synthesizer mixer
const stemsDe = (id: string) => {
  const e = estudoDe(id);
  if (e) return e;
  if (id.startsWith('jingle-') || id.startsWith('pastoral-rica-')) return midiDe(id);
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
  ['fa-sc88', 'SC-88 (teste privado)'],
  ['fa-sc88p', 'SC-88Pro (teste privado)'],
  ['transcricao', 'Transcrição do áudio'],
] as const;
// sounds offered for every battle and pastoral track; the key is the suffix of its stems folder ('' is MuseScore)
const SONS_JOGO = [
  ['', 'MuseScore General'],
  ['gugs', 'GeneralUser GS'],
  ['fluidr3', 'FluidR3'],
  ['sgm', 'SGM'],
  ['neo', 'Neo Orchestra'],
  ['tfg', 'Tactical Fantasy Guy'],
  ['sonatina', 'Sonatina'],
] as const;
// Roland SC-88 soundfont (a fan rip): a listening test for the owner only, on this unadvertised lab site. Its stems are not in
// the repository and its sounds never go into the game, because they are Roland's.
const SC88 = ['sc88', 'SC-88 (teste privado)'] as const;
// SC-88Pro (same private test): rendered for every piece with a MIDI
const SC88P = ['sc88p', 'SC-88Pro (teste privado)'] as const;
const COM_SC88P = new Set([
  'ff8_fishermans_horizon_v1',
  'ff8_fishermans_horizon_v2',
  'ff8_fishermans_horizon_v3',
  'batalha_A',
  'batalha_B',
  'batalha_C',
  'batalha_D',
  'batalha_E',
  'batalha_F',
  'bof4_fim',
  'cc_another_termina',
  'ff9_esto_gaza_v1',
  'ff9_esto_gaza_v2',
  'ff9_esto_gaza_v3',
  'ff9_esto_gaza_v4',
  'cc_another_world_extended',
  'cc_another_world',
  'dark_intenso',
  'dark',
  'jingle_A_chefe',
  'jingle_A_derrota',
  'jingle_A_vitoria',
  'jingle_B_chefe',
  'jingle_B_derrota',
  'jingle_B_vitoria',
  'jingle_C_chefe',
  'jingle_C_derrota',
  'jingle_C_vitoria',
  'jingle_D_chefe',
  'jingle_D_derrota',
  'jingle_D_vitoria',
  'jingle_E_chefe',
  'jingle_E_derrota',
  'jingle_E_vitoria',
  'jingle_F_chefe',
  'jingle_F_derrota',
  'jingle_F_vitoria',
  'pastoral_A',
  'pastoral_B',
  'pastoral_C',
  'pastoral_D',
  'pastoral_E',
  'pastoral_F',
  'pastoral_rica_A',
  'pastoral_rica_B',
  'trisection_fa',
]);
const sonsDe = (base: string) => [...SONS_JOGO, SC88, ...(COM_SC88P.has(base) ? [SC88P] : [])];
const versoesDe = (id: string) => {
  const e = estudoDe(id);
  if (e)
    return {
      raiz: id,
      atual: 0,
      // the Chrono Cross files use instruments the TFG and Sonatina banks lack: those two render the nearest instrument
      opcoes: sonsDe(e).map(([k, rotulo]) => ({
        rotulo,
        faixa: id,
        stems: `${e}${k ? `_${k}` : ''}`,
      })),
    };
  const rica = /^(dark-(principal|intenso)|pastoral-rica-[a-z]|jingle-[a-f]-(vitoria|derrota|chefe))$/.exec(id);
  if (rica)
    return {
      raiz: id,
      atual: 0,
      opcoes: sonsDe(stemsDe(id)).map(([k, rotulo]) => ({
        rotulo,
        faixa: id,
        stems: `${stemsDe(id)}${k ? `_${k}` : ''}`,
      })),
    };
  const f = /^(batalha|pastoral)-[a-f](-tfg)?(-t)?$/.exec(id);
  if (f) {
    const raiz = id.replace(/(-tfg)?(-t)?$/, '');
    return {
      raiz,
      atual: f[2] ? SONS_JOGO.findIndex(([k]) => k === 'tfg') : 0,
      // the text of each sound comes from its own page when there is one (MuseScore and TFG); the others reuse the base page
      opcoes: sonsDe(stemsDe(raiz)).map(([k, rotulo]) => ({
        rotulo,
        faixa: k === 'tfg' ? `${raiz}-tfg` : raiz,
        stems: `${stemsDe(raiz)}${k ? `_${k}` : ''}`,
      })),
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
      opcoes: SONS_TRISECTION.map(([k, rotulo]) => ({
        rotulo,
        faixa: `ref-trisection-midi-${k}`,
        stems: stemsDe(`ref-trisection-midi-${k}`),
      })),
    };
};

const pagina = (id: string) => PAGINAS[id as IdPagina] as PaginaMusica | undefined;
const Desconhecida = ({ id }: { id: string }) => <p className="m-0 text-erro">Página de música desconhecida: {id}.</p>;

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
            <li key={r.href} className="grid max-w-[72ch] gap-2">
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

// one entry of the Música menu: a piece of one of the data pages, grouped by family
export interface ItemMusica {
  valor: string;
  pagina: IdPagina;
  faixa: string;
  rotulo: string;
  familia: string;
  categoria: Estilo;
  estudio: boolean; // false: only a recording (no MIDI, so no separate instruments)
}
export interface SeletorMusica {
  opcoes: ItemMusica[];
  atual: string;
  aoTrocar: (v: string) => void;
}

// the tracks one data page offers in its menu: the "-t", "-tfg" and "-cru" twins are the same notes in another render
const noMenu = (grupo: string, faixa: string) =>
  grupo === 'tema-dark'
    ? !/-cru$|^dark-v1/.test(faixa) || /^dark-v1-(principal|intenso)$/.test(faixa)
    : grupo === 'batalha' || grupo === 'pastoral'
      ? !/-(t|tfg|tfg-t)$/.test(faixa)
      : grupo === 'trisection'
        ? !/^ref-trisection-midi-(fa-|transcricao)|-cru$/.test(faixa)
        : true;

// menu line: letter, invented name and who composed it (read from the "Quem fez" section), e.g. "F · Cantiga do Moinho · Haiku low"
const rotuloFaixa = (grupo: string, t: Faixa) => {
  const quem = t.secoes?.[0]?.texto.match(/Modelo e esforço:\*\* (\w+) [\d.]+ · esforço \*\*(\w+)\*\*/);
  const partes = t.titulo.split(' · ');
  const nome =
    grupo === 'jingles'
      ? t.titulo.replace(/ \(.*\)$/, '')
      : grupo === 'tema-dark'
        ? partes[0] + (t.id.includes('-v1-') ? ' (v1)' : '')
        : partes.slice(1, 3).join(' · ');
  return quem && (grupo === 'tema-dark' || grupo === 'batalha' || grupo === 'pastoral' || grupo === 'jingles')
    ? `${nome} · ${quem[1]} ${quem[2]}`
    : t.titulo.replace(' com a soundfont Tactical Fantasy Guy', ' (TFG)');
};

// the three style pages: each gathers several data pages into one studio with a Música menu
export type Estilo = 'cidade' | 'batalha' | 'jingles';
const ESTILOS: Record<Estilo, { pagina: IdPagina; familia: string }[]> = {
  cidade: [
    { pagina: 'pastoral', familia: 'Pastoral A–F' },
    { pagina: 'pastoral-rica', familia: 'Pastoral rica (a da cidade no jogo é a B)' },
    { pagina: 'bof4', familia: 'Referências de estudo (BoF4, Chrono Cross, FF9 e FF8)' },
  ],
  batalha: [
    { pagina: 'batalha', familia: 'Batalha A–F' },
    { pagina: 'tema-dark', familia: 'Tema dark (batalha do jogo)' },
    { pagina: 'trisection', familia: 'Referências' },
  ],
  jingles: [{ pagina: 'jingles', familia: 'Jingles' }],
};
export const itensDe = (estilo: Estilo): ItemMusica[] =>
  ESTILOS[estilo].flatMap(({ pagina: pg, familia }) =>
    faixasDe(PAGINAS[pg])
      .filter((t) => noMenu(pg, t.id))
      .map((t) => ({
        valor: `${pg}/${t.id}`,
        pagina: pg,
        faixa: t.id,
        rotulo: rotuloFaixa(pg, t),
        familia,
        categoria: estilo,
        estudio: !!(stemsDe(t.id) ?? midiDe(t.id)),
      })),
  );

const CATEGORIAS: { id: Estilo; rotulo: string; icone: string }[] = [
  { id: 'cidade', rotulo: 'Cidade', icone: 'inicio' },
  { id: 'batalha', rotulo: 'Batalha', icone: 'mecanicas' },
  { id: 'jingles', rotulo: 'Jingles', icone: 'musica' },
];
type Ordem = 'categoria' | 'az' | 'za';
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// one studio for every piece: a list on the side (search, category and order) and the studio of the chosen piece beside it
export function EstudioMusicas() {
  // pieces without a studio (audio only, no MIDI) stay out of the list
  const itens = CATEGORIAS.flatMap((c) => itensDe(c.id)).filter((i) => i.estudio);
  const [valor, setValor] = useState(() => {
    const pedido = new URLSearchParams(window.location.search).get('m');
    return itens.some((i) => i.valor === pedido) ? pedido! : itens[0]!.valor;
  });
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState<Estilo | 'todas'>('todas');
  const [ordem, setOrdem] = useState<Ordem>('categoria');
  const item = itens.find((i) => i.valor === valor) ?? itens[0]!;
  const trocar = (v: string) => {
    setValor(v);
    try {
      window.history.replaceState(null, '', `${window.location.pathname}?m=${encodeURIComponent(v)}`);
    } catch {
      /* the address is only a convenience */
    }
  };
  const q = semAcento(busca.trim());
  const visiveis = itens
    .filter(
      (i) => (cat === 'todas' || i.categoria === cat) && (!q || semAcento(`${i.rotulo} ${i.familia}`).includes(q)),
    )
    .sort((a, b) => (ordem === 'categoria' ? 0 : a.rotulo.localeCompare(b.rotulo, 'pt') * (ordem === 'za' ? -1 : 1)));
  // grouped by family in the default order; one flat alphabetical list otherwise
  const grupos =
    ordem === 'categoria'
      ? [...new Set(visiveis.map((i) => i.familia))].map((f) => ({
          titulo: f,
          itens: visiveis.filter((i) => i.familia === f),
        }))
      : [{ titulo: '', itens: visiveis }];
  const botao = (ativo: boolean) =>
    `inline-flex min-h-11 items-center gap-2 rounded border px-3 text-[14px] ${ativo ? 'border-ouro bg-couro font-bold text-creme' : 'border-ouro bg-folha'}`;
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
      <aside className="grid gap-3 rounded-md border border-ouro bg-folha p-3" aria-label="Lista de músicas">
        <label className="flex min-h-11 items-center gap-2 rounded border border-ouro bg-white/60 px-3">
          <Icone id="lupa" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar música"
            aria-label="Buscar música"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categoria">
          <button onClick={() => setCat('todas')} aria-pressed={cat === 'todas'} className={botao(cat === 'todas')}>
            <Icone id="filtrar" /> Todas ({itens.length})
          </button>
          {CATEGORIAS.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={botao(cat === c.id)}>
              <Icone id={c.icone} /> {c.rotulo} ({itens.filter((i) => i.categoria === c.id).length})
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2">
          <Icone id="ordenar" />
          <span className="text-apagado">Ordem:</span>
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="min-h-11 min-w-0 flex-1 rounded border border-ouro bg-folha px-2"
          >
            <option value="categoria">Por família</option>
            <option value="az">Nome, A a Z</option>
            <option value="za">Nome, Z a A</option>
          </select>
        </label>
        <div className="grid max-h-80 content-start gap-3 overflow-auto lg:max-h-[calc(100vh-17rem)]">
          {visiveis.length === 0 && <p className="m-0 text-apagado">Nenhuma música com esse filtro.</p>}
          {grupos.map((g) => (
            <div key={g.titulo} className="grid gap-1">
              {g.titulo && <h3 className="m-0 text-[14px] text-apagado">{g.titulo}</h3>}
              {g.itens.map((i) => (
                <button
                  key={i.valor}
                  onClick={() => trocar(i.valor)}
                  aria-current={i.valor === item.valor}
                  className={`flex min-h-11 items-center gap-2 rounded px-2 text-left text-[14px] ${i.valor === item.valor ? 'bg-couro font-bold text-creme' : 'hover:bg-pergaminho-escuro'}`}
                >
                  <Icone id={i.valor === item.valor ? 'tocar' : 'musica'} className="size-4 flex-none" />
                  <span className="min-w-0 flex-1">{i.rotulo}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
      <div className="grid min-w-0 gap-4">
        <FaixaMusica key={item.valor} pagina={item.pagina} faixa={item.faixa} />
      </div>
    </div>
  );
}

export function FaixaMusica({
  pagina: id,
  faixa,
  musica,
}: {
  pagina: IdPagina;
  faixa: string;
  musica?: SeletorMusica;
}) {
  const t = pagina(id)?.faixas?.find((f) => f.id === faixa);
  if (!t) return <p className="m-0 text-erro">Faixa desconhecida: {faixa}.</p>;
  // one piece, several sounds: the studio switches them in place (the "-t" and "-tfg" pages are only other sounds of the same notes)
  const grupo = versoesDe(t.id);
  const sfs = grupo?.opcoes.flatMap((o) =>
    o.stems && o.rotulo !== 'Transcrição do áudio' ? [{ rotulo: o.rotulo, stems: o.stems }] : [],
  );
  const stems = grupo ? grupo.opcoes[0]?.stems : stemsDe(t.id);
  const midi = stems ?? midiDe(t.id);
  const secoes = secoesDe(t);
  const descricao =
    secoes.length > 0
      ? secoes.map((sc) => (
          <section key={sc.titulo} className="grid gap-2">
            <h3 className="m-0 text-[19px] leading-tight">{sc.titulo}</h3>
            <Texto texto={sc.texto} />
          </section>
        ))
      : undefined;
  return (
    <>
      <Selo ligado={t.exemplo} />
      {stems && midi ? (
        <Estudio
          key={stems}
          base={stems}
          midiSrc={`/content/musica/midi/${midi}.mid`}
          tratadaInicial={!t.id.endsWith('-cru')}
          chave={t.id}
          musica={musica}
          sfs={sfs}
          descricao={descricao}
          papeis={t.papeis}
        />
      ) : (
        <>
          {musica && (
            <label className="flex flex-wrap items-center gap-2">
              <span className="text-apagado">Música:</span>
              <select
                value={musica.atual}
                onChange={(e) => musica.aoTrocar(e.target.value)}
                className="min-h-11 max-w-full rounded border border-ouro bg-folha px-2"
              >
                {[...new Set(musica.opcoes.map((o) => o.familia))].map((f) => (
                  <optgroup key={f} label={f}>
                    {musica.opcoes
                      .filter((o) => o.familia === f)
                      .map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.rotulo}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
          )}
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
          {descricao && (
            <details open className="rounded-md border border-traco bg-white/40 px-4 py-2">
              <summary className="min-h-11 cursor-pointer py-2 font-bold">Sobre esta faixa</summary>
              <div className="grid gap-4 pb-3">{descricao}</div>
            </details>
          )}
        </>
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
          <span className={c.estado === 'feito' ? 'font-bold text-sucesso' : 'font-bold text-aviso'}>
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
