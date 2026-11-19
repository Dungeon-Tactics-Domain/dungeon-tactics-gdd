// Adapter from the lab's music data to the player catalog (src/lib/player). A song is one composition; its versions are
// the SoundFont renders found in public/content/musica/stems/<base>[_<soundfont>]/, each with its own stems.json and MIDI.
// The per-channel SoundFont mix and the saved presets of the old studio are left out for now (decided 18/11).
import { parseCatalog, parseStemsManifest, type ParseResult } from '@/lib/player/parse-catalog';
import type { Catalog, Song, Version } from '@/lib/player/schema';
import { PAGINAS, type Faixa, type IdPagina } from './Musica';

// eager: the player needs every duration and channel list before it draws; in the build they become one chunk
// (~38 kB gzip). Keys are paths, /public/content/musica/stems/<folder>/stems.json.
const MANIFESTOS = Object.fromEntries(
  Object.entries(import.meta.glob('/public/content/musica/stems/*/stems.json', { eager: true, import: 'default' })).map(
    ([caminho, json]) => [caminho.split('/').at(-2)!, json],
  ),
);

interface Historia {
  storyDraft?: string;
  ondeToca?: string;
}

// written by another session; the glob yields {} while the file does not exist, where a static import would break the build
const HISTORIAS = Object.values(import.meta.glob('../historias.json', { eager: true, import: 'default' }))[0] as
  Record<string, Historia> | undefined;

const CATEGORIAS = [
  ['batalha', 'Batalha'],
  ['cidade', 'Cidade'],
  ['jingles', 'Jingles'],
  ['referencias', 'Referências'],
  ['testes', 'Testes'],
] as const;

// folder suffix -> label, in the old studio's order: SC-88Pro opens when the piece has it, then MuseScore ('')
const SOUNDFONTS: [string, string][] = [
  ['sc88p', 'SC-88Pro (teste privado)'],
  ['', 'MuseScore General'],
  ['gugs', 'GeneralUser GS'],
  ['fluidr3', 'FluidR3'],
  ['sgm', 'SGM'],
  ['neo', 'Neo Orchestra'],
  ['tfg', 'Tactical Fantasy Guy'],
  ['sonatina', 'Sonatina'],
  ['sc88', 'SC-88 (teste privado)'],
];
// lazy base and the suffix anchored at the end, so cc_another_world_extended stays one base
const PASTA = /^(.*?)(?:_(sc88p|sc88|gugs|fluidr3|sgm|neo|tfg|sonatina))?$/;

// Trisection's piano transcription is another MIDI of the same piece, rendered once: it joins the fan MIDI's song as a version
const FUNDIDAS: Record<string, { base: string; id: string; label: string }> = {
  trisection_transcricao: {
    base: 'trisection_fa',
    id: 'transcricao',
    label: 'Transcrição em piano · MuseScore General',
  },
};

// the live version: the song's MIDI synthesized in the browser with this SoundFont, which is not in git (see .gitignore)
const AO_VIVO = { id: 'ao-vivo', label: 'Ao vivo · GeneralUser GS', soundfont: '/soundfonts/GeneralUser-GS.sf2' };

// the lab track that describes a stems base: batalha_A -> batalha-a, cc_another_world -> ref-cc-another-world
export const idDaFaixa = (base: string) => {
  if (base === 'dark') return 'dark-principal';
  const id = base.toLowerCase().replace(/_/g, '-');
  return /^(bof4|cc|ff8|ff9|trisection)-/.test(id) ? `ref-${id.replace(/^trisection-/, 'trisection-midi-')}` : id;
};

const acharFaixa = (id: string): [IdPagina, Faixa] | undefined => {
  for (const [pagina, p] of Object.entries(PAGINAS) as [IdPagina, (typeof PAGINAS)[IdPagina]][]) {
    const t = p.faixas?.find((f) => f.id === id);
    if (t) return [pagina, t];
  }
};

const categoria = (id: string, pagina: IdPagina) =>
  /-(lofi|vapor)$/.test(id)
    ? 'testes'
    : id.startsWith('ref-')
      ? 'referencias'
      : pagina === 'jingles'
        ? 'jingles'
        : pagina === 'batalha' || pagina === 'tema-dark'
          ? 'batalha'
          : 'cidade';

const titulo = (pagina: IdPagina, t: Faixa) =>
  pagina === 'jingles'
    ? t.titulo.replace(/ \(.*\)$/, '') // "A · Chefe caiu": the letter tells the six themes apart
    : pagina === 'bof4'
      ? t.titulo
      : (t.nome ?? t.titulo);

export function montarCatalogo(
  manifestos: Record<string, unknown>,
  historias: Record<string, Historia> = {},
): ParseResult<Catalog> {
  const versoes = new Map<string, Version[]>();
  for (const [pasta, json] of Object.entries(manifestos)) {
    const [, pasta0, sufixo = ''] = PASTA.exec(pasta)!;
    const fundida = FUNDIDAS[pasta];
    const base = fundida?.base ?? pasta0!;
    const m = parseStemsManifest(json);
    const sf = fundida ? [fundida.id, fundida.label] : SOUNDFONTS.find(([k]) => k === sufixo);
    if (!m.ok || !sf) continue; // a broken manifest drops that render only
    const lista = versoes.get(base) ?? [];
    lista.push({
      id: fundida?.id ?? (sufixo || 'musescore'),
      label: sf[1]!,
      stemsBase: `/content/musica/stems/${pasta}`,
      midi: `/content/musica/midi/${pasta}.mid`,
      duration: m.value.duration,
      channels: m.value.channels,
    });
    versoes.set(base, lista);
  }
  // renders of the SoundFont list first, in its order; the merged ones after them
  const ordem = (v: Version) => {
    const i = SOUNDFONTS.findIndex(([k]) => (k || 'musescore') === v.id);
    return i < 0 ? SOUNDFONTS.length : i;
  };
  const songs: Song[] = [];
  for (const [base, lista] of versoes) {
    const id = idDaFaixa(base);
    const achada = acharFaixa(id);
    if (!achada) continue; // stems without a lab page: nothing to say about them
    const [pagina, t] = achada;
    const p = PAGINAS[pagina];
    lista.sort((a, b) => ordem(a) - ordem(b));
    // the live synthesizer plays the plain General MIDI file (the other SoundFonts' MIDIs have their drums moved)
    const gm = lista.find((v) => v.id === 'musescore') ?? lista[0]!;
    const comVivo = [...lista, { ...gm, id: AO_VIVO.id, label: AO_VIVO.label, live: { soundfont: AO_VIVO.soundfont } }];
    // versions of one composition share its story: the Trisection renders take the parent's
    const h = historias[id] ?? historias[id.replace(/-midi-.*$/, '')];
    const song: Song = {
      id,
      title: titulo(pagina, t),
      category: categoria(id, pagina),
      authorship: t.versao ?? t.jogo ?? 'autoria não registrada',
      versions: comVivo,
      channels: lista[0]!.channels ?? [],
      references: (p.referencias ?? [])
        .filter((r) => !r.exemplo)
        .map((r) => ({ label: r.rotulo, url: r.href, study: true })),
      // soundfont renders differ by tenths of a second; a version that differs by more is another MIDI and gets its own line
      measurements: lista
        .filter((v, i) => i === 0 || Math.abs(v.duration - lista[0]!.duration) > 1)
        .map((v, i) => ({
          label: i ? `Duração · ${v.label}` : 'Duração',
          value: `${v.duration.toFixed(1)} s`,
          source: `stems.json de ${v.label}`,
        })),
      checks: (p.checagens ?? [])
        .filter((c) => !c.exemplo)
        .map((c) => ({ text: c.texto, state: c.estado === 'feito' ? 'done' : 'pending' })),
    };
    if (h?.storyDraft) Object.assign(song, { story: h.storyDraft, storyDraft: true });
    if (h?.ondeToca) song.whereItPlays = h.ondeToca;
    songs.push(song);
  }
  songs.sort((a, b) => a.id.localeCompare(b.id)); // the lab's order: batalha A to F, jingles by theme letter
  return parseCatalog({ categories: CATEGORIAS.map(([id, label], order) => ({ id, label, order })), songs });
}

export const catalogo = montarCatalogo(MANIFESTOS, HISTORIAS);
