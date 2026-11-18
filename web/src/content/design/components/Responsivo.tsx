// Mock-ups of the labs app's responsive redesign (Fernando's decisions of 15/11): the lab is used on a 390x844 phone, an
// 820x1180 tablet (and 1180x820 lying down), 1920x1080 desktop and 3440x1440 ultrawide; on the ultrawide the extra width
// becomes side-by-side panels, never a modal. Each mock-up draws the real screen size and scales it down with a CSS
// transform, so the layout inside follows the frame's width (FAIXAS), not the browser's. Labs and pages are the real
// manifests (CONTEUDO); the casca itself (App.tsx, Paginas) is not touched here.
/* eslint-disable react-refresh/only-export-components -- FAIXAS and faixa are exported for the test; a mock-up page, never hot-reloaded alone */
import './responsivo.css';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LABS } from '@/lib/labs';
import { CONTEUDO } from '../../registry';
import { ASSETS } from '../dados';
import { Expressoes } from './Expressoes';

// ---------- screen bands (breakpoints proposed in section 4) ----------

export interface Faixa {
  id: 'celular' | 'tablet' | 'deitado' | 'desktop' | 'ultrawide';
  nome: string;
  /** first width of the band, in CSS px */
  min: number;
  tela: [w: number, h: number];
  base: number;
  h1: number;
  h2: number;
  h3: number;
  legenda: number;
  margem: number;
  espaco: number;
  /** max width of running text */
  leitura: string;
  paineis: string;
  nav: string;
}

// desktop keeps today's casca numbers (Paginas.tsx: aside 280 px, main px-10, h1 34 px, text 17 px)
export const FAIXAS: Faixa[] = [
  {
    id: 'celular',
    nome: 'Celular',
    min: 0,
    tela: [390, 844],
    base: 16,
    h1: 26,
    h2: 21,
    h3: 18,
    legenda: 14,
    margem: 16,
    espaco: 12,
    leitura: '100%',
    paineis: '1 por vez, em abas',
    nav: 'menu inferior com os 5 labs; páginas numa folha que sobe',
  },
  {
    id: 'tablet',
    nome: 'Tablet',
    min: 640,
    tela: [820, 1180],
    base: 16,
    h1: 30,
    h2: 22,
    h3: 18,
    legenda: 14,
    margem: 24,
    espaco: 16,
    leitura: '68ch',
    paineis: '1 por vez, em abas',
    nav: 'menu inferior com os 5 labs; páginas numa folha que sobe',
  },
  {
    id: 'deitado',
    nome: 'Tablet deitado',
    min: 1024,
    tela: [1180, 820],
    base: 17,
    h1: 32,
    h2: 24,
    h3: 19,
    legenda: 14,
    margem: 32,
    espaco: 20,
    leitura: '72ch',
    paineis: '2: conteúdo | detalhe; lista numa gaveta',
    nav: 'barra lateral recolhida (só ícones, 72 px)',
  },
  {
    id: 'desktop',
    nome: 'Desktop',
    min: 1440,
    tela: [1920, 1080],
    base: 17,
    h1: 34,
    h2: 26,
    h3: 20,
    legenda: 15,
    margem: 40,
    espaco: 24,
    leitura: '72ch',
    paineis: '3: lista | conteúdo | detalhe',
    nav: 'barra lateral aberta (280 px), recolhível',
  },
  {
    id: 'ultrawide',
    nome: 'Ultrawide',
    min: 2560,
    tela: [3440, 1440],
    base: 18,
    h1: 40,
    h2: 28,
    h3: 21,
    legenda: 15,
    margem: 48,
    espaco: 32,
    leitura: '72ch',
    paineis: '3 largos; o conteúdo ganha colunas, o texto não alarga',
    nav: 'barra lateral aberta (320 px), recolhível',
  },
];

export const faixa = (w: number) => FAIXAS.findLast((f) => w >= f.min)!;
const ESPACOS = [4, 8, 12, 16, 20, 24, 32, 48];
// tallest a frame is drawn: a whole screen stays in view on a 1080 monitor; a taller window (the 1440 ultrawide) gets 80%
const ALTURA_MAX = 760;

// ---------- shared pieces ----------

const BOTAO =
  'min-h-11 cursor-pointer border border-borda bg-folha px-3.5 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-couro aria-pressed:bg-couro aria-pressed:text-sobre-tinta';

function Escolha<T extends string>({
  rotulo,
  itens,
  valor,
  onPick,
}: {
  rotulo: string;
  itens: [T, string][];
  valor: T;
  onPick: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-bold tracking-wide text-apagado uppercase">{rotulo}</span>
      {itens.map(([v, texto]) => (
        <button key={v} type="button" aria-pressed={v === valor} onClick={() => onPick(v)} className={BOTAO}>
          {texto}
        </button>
      ))}
    </div>
  );
}

const TAMANHOS = FAIXAS.map((f): [Faixa['id'], string] => [f.id, `${f.nome} ${f.tela[0]}×${f.tela[1]}`]);
const porId = (id: Faixa['id']) => FAIXAS.find((f) => f.id === id)!;

/** The real screen (w x h CSS px) scaled to the page's width, and in height to ALTURA_MAX or 80% of the window. */
function Moldura({ f, children }: { f: Faixa; children: ReactNode }) {
  const caixa = useRef<HTMLElement>(null);
  const [largura, setLargura] = useState(0);
  const [w, h] = f.tela;
  useEffect(() => {
    const c = caixa.current;
    // jsdom (tests) has no ResizeObserver; the browser always does
    if (!c || typeof ResizeObserver === 'undefined') return;
    // measured now too: a hidden or throttled tab delivers no observer callback and the frame kept its 25% guess (860 px)
    setLargura(c.clientWidth);
    const ro = new ResizeObserver(() => setLargura(c.clientWidth));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  const k = largura ? Math.min(1, largura / w, Math.max(ALTURA_MAX, innerHeight * 0.8) / h) : 0.25;
  return (
    <figure ref={caixa} className="rr-moldura">
      <figcaption>
        <strong>{f.nome}</strong> · {w} × {h} px · mostrado a {Math.round(k * 100)}%
      </figcaption>
      <div className="rr-janela" style={{ width: w * k, height: h * k }}>
        <div className="rr-tela" data-faixa={f.id} style={{ width: w, height: h, transform: `scale(${k})` }}>
          {children}
        </div>
      </div>
    </figure>
  );
}

function Secao({
  id,
  titulo,
  nota,
  recomendacao,
  children,
}: {
  id: string;
  titulo: string;
  nota: string;
  recomendacao: [string, string];
  children: ReactNode;
}) {
  return (
    <section id={id} aria-label={titulo} className="grid min-w-0 gap-4 border-t border-borda pt-6">
      <h2 className="m-0 font-serif text-[28px] leading-tight font-bold">{titulo}</h2>
      <p className="m-0 max-w-[72ch] text-[17px]">{nota}</p>
      {children}
      <div className="max-w-[80ch] border-l-[6px] border-lab bg-lab-soft px-5 py-3 text-[17px]">
        <strong>Recomendação.</strong> {recomendacao[0]}
        <br />
        {recomendacao[1]}
      </div>
    </section>
  );
}

// ---------- 1. navigation: the real labs and their pages ----------

type Variante = 'lateral' | 'abas' | 'inferior';
interface Rota {
  lab: string;
  grupo: string;
  pagina?: string;
}

const LAB_DADOS = LABS.flatMap((l) => {
  const s = CONTEUDO[l.id]?.sumario;
  return s ? [{ ...l, s }] : [];
});
const inicioDo = (lab: string): Rota => ({
  lab,
  grupo: LAB_DADOS.find((l) => l.id === lab)?.s.grupos[0]?.id ?? '',
});
const mesma = (a: Rota, b: Rota) => a.lab === b.lab && a.grupo === b.grupo && a.pagina === b.pagina;

function Selo({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 flex-none items-center justify-center rounded-[3px] text-[14px] font-bold text-white"
      style={{ background: cor }}
    >
      {texto}
    </span>
  );
}
const sigla = (curto: string) => curto.slice(0, 2);

const LINHA =
  'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-[3px] px-2.5 text-left text-tinta hover:bg-lab-soft aria-[current=page]:bg-couro aria-[current=page]:text-sobre-tinta';

/** The lab tree: the 5 labs, then the open lab's groups with the pages of the open group. */
function Arvore({
  rota,
  ir,
  recolhida = false,
  comLabs = true,
}: {
  rota: Rota;
  ir: (r: Rota) => void;
  recolhida?: boolean;
  comLabs?: boolean;
}) {
  const lab = LAB_DADOS.find((l) => l.id === rota.lab)!;
  return (
    <nav aria-label="Labs e páginas" className="grid content-start gap-1 p-3">
      {comLabs &&
        LAB_DADOS.map((l) => (
          <button
            key={l.id}
            type="button"
            title={l.nome}
            aria-label={recolhida ? l.nome : undefined}
            aria-current={l.id === rota.lab ? 'page' : undefined}
            onClick={() => ir(inicioDo(l.id))}
            className={LINHA}
          >
            <Selo cor={l.cor} texto={sigla(l.curto)} />
            {!recolhida && <span className="text-[16px] font-bold">{l.nome}</span>}
          </button>
        ))}
      {comLabs && <hr className="my-2 border-borda" />}
      {lab.s.grupos.map((g) => (
        <div key={g.id} className="grid gap-0.5">
          <button
            type="button"
            title={g.titulo}
            aria-label={recolhida ? g.titulo : undefined}
            aria-current={g.id === rota.grupo && !rota.pagina ? 'page' : undefined}
            onClick={() => ir({ lab: lab.id, grupo: g.id })}
            className={`${LINHA} font-serif text-[17px] font-bold`}
          >
            <span aria-hidden="true" className="w-6 flex-none text-center">
              {g.icone ?? '▸'}
            </span>
            {!recolhida && <span className="flex-1">{g.titulo}</span>}
            {/* inherits the row colour: grey text would vanish on the dark current row */}
            {!recolhida && <span className="font-sans text-[14px] font-normal">{g.paginas.length}</span>}
          </button>
          {!recolhida &&
            g.id === rota.grupo &&
            g.paginas.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-current={p.id === rota.pagina ? 'page' : undefined}
                onClick={() => ir({ lab: lab.id, grupo: g.id, pagina: p.id })}
                className={`${LINHA} pl-10 text-[15px]`}
              >
                {p.titulo}
              </button>
            ))}
        </div>
      ))}
    </nav>
  );
}

/** Generic page body: breadcrumb, title, summary and the group's (or page's) cards, at the band's sizes. */
function PaginaExemplo({ rota, ir, f }: { rota: Rota; ir: (r: Rota) => void; f: Faixa }) {
  const lab = LAB_DADOS.find((l) => l.id === rota.lab)!;
  const g = lab.s.grupos.find((x) => x.id === rota.grupo);
  const p = g?.paginas.find((x) => x.id === rota.pagina);
  const cartoes = p ? (p.subpaginas ?? []) : (g?.paginas ?? []);
  return (
    <>
      <Cabecalho lab={lab.curto} grupo={g?.titulo} pagina={p?.titulo} f={f} resumo={(p ?? g)?.resumo} />
      {p && !cartoes.length && (
        <div className="border border-dashed border-traco bg-folha p-5 text-apagado" style={{ maxWidth: f.leitura }}>
          Conteúdo da página «{p.titulo}» (maquete: aqui entra o texto e as peças da página).
        </div>
      )}
      <ul
        className="m-0 grid list-none p-0"
        style={{ gap: f.espaco, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
      >
        {cartoes.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => g && !p && ir({ lab: lab.id, grupo: g.id, pagina: c.id })}
              className="grid h-full min-h-11 w-full cursor-pointer content-start gap-1.5 border border-t-[6px] border-borda border-t-lab bg-folha px-4 py-3 text-left text-tinta hover:bg-lab-soft"
            >
              <span className="font-serif text-[20px] leading-tight font-bold">{c.titulo}</span>
              {c.resumo && <span className="text-[15px]">{c.resumo}</span>}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Cabecalho({
  lab,
  grupo,
  pagina,
  resumo,
  f,
}: {
  lab: string;
  grupo?: string;
  pagina?: string;
  resumo?: string;
  f: Faixa;
}) {
  return (
    <>
      <p className="m-0 text-[15px] text-apagado">{[lab, grupo, pagina].filter(Boolean).join(' › ')}</p>
      <h1 className="m-0 font-serif leading-tight font-bold" style={{ fontSize: f.h1 }}>
        {pagina ?? grupo ?? lab}
      </h1>
      {resumo && (
        <p className="m-0 text-apagado" style={{ maxWidth: f.leitura, fontSize: f.base }}>
          {resumo}
        </p>
      )}
    </>
  );
}

/** The lab's frame in one navigation variant; children replace the generic page while the route is still `inicio`. */
function Casca({
  f,
  variante,
  inicio,
  children,
}: {
  f: Faixa;
  variante: Variante;
  inicio: Rota;
  children?: ReactNode;
}) {
  const [rota, setRota] = useState(inicio);
  const [recolher, setRecolher] = useState<boolean | null>(null);
  const [gaveta, setGaveta] = useState(false);
  const larga = f.min >= 1024;
  // the lying tablet starts with the rail; the button overrides it at any size
  const recolhida = recolher ?? f.id === 'deitado';
  const ir = (r: Rota) => {
    setRota(r);
    setGaveta(false);
  };
  const lab = LAB_DADOS.find((l) => l.id === rota.lab)!;
  const g = lab.s.grupos.find((x) => x.id === rota.grupo);
  const p = g?.paginas.find((x) => x.id === rota.pagina);
  const main = (
    <main
      className="grid min-h-0 min-w-0 content-start overflow-y-auto"
      style={{ padding: `${f.espaco + 8}px ${f.margem}px`, gap: f.espaco, fontSize: f.base }}
    >
      {children && mesma(rota, inicio) ? (
        <>
          <Cabecalho lab={lab.curto} grupo={g?.titulo} pagina={p?.titulo} f={f} />
          {children}
        </>
      ) : (
        <PaginaExemplo rota={rota} ir={ir} f={f} />
      )}
    </main>
  );
  const topo = (extra?: ReactNode) => (
    <header className="flex min-h-14 flex-none items-center gap-3 border-b-4 border-lab bg-folha px-3">
      {extra}
      <Selo cor={lab.cor} texto={sigla(lab.curto)} />
      <strong className="truncate font-serif text-[19px]">{lab.nome}</strong>
    </header>
  );

  if (variante === 'abas') {
    const aba = 'flex min-h-11 flex-none cursor-pointer items-center gap-2 border-b-4 px-3 text-[15px] text-tinta';
    return (
      <div className="flex h-full flex-col">
        <nav aria-label="Labs" className="rr-faixa flex flex-none bg-folha">
          {LAB_DADOS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-current={l.id === rota.lab ? 'page' : undefined}
              onClick={() => ir(inicioDo(l.id))}
              className={`${aba} font-bold`}
              style={{ borderBottomColor: l.id === rota.lab ? l.cor : 'transparent' }}
            >
              <Selo cor={l.cor} texto={sigla(l.curto)} />
              {f.id === 'celular' ? l.curto : l.nome}
            </button>
          ))}
        </nav>
        <nav aria-label="Grupos" className="rr-faixa flex flex-none border-y border-borda bg-pergaminho">
          {lab.s.grupos.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-current={x.id === rota.grupo ? 'page' : undefined}
              onClick={() => ir({ lab: lab.id, grupo: x.id })}
              className={`${aba} aria-[current=page]:border-lab aria-[current=page]:font-bold border-transparent`}
            >
              {x.icone} {x.titulo}
            </button>
          ))}
        </nav>
        {main}
      </div>
    );
  }

  if (larga) {
    return (
      <div className="flex h-full">
        <aside
          className="flex flex-none flex-col overflow-y-auto border-r-[6px] border-lab bg-folha"
          style={{ width: recolhida ? 72 : f.id === 'ultrawide' ? 320 : 280 }}
        >
          <button
            type="button"
            aria-expanded={!recolhida}
            aria-label={recolhida ? 'Abrir a barra lateral' : 'Recolher a barra lateral'}
            onClick={() => setRecolher(!recolhida)}
            className={`${LINHA} mx-3 mt-3 w-auto border border-borda text-[15px]`}
          >
            <span aria-hidden="true">{recolhida ? '»' : '«'}</span>
            {!recolhida && 'Recolher'}
          </button>
          <Arvore rota={rota} ir={ir} recolhida={recolhida} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">{main}</div>
      </div>
    );
  }

  if (variante === 'lateral') {
    return (
      <div className="relative flex h-full flex-col">
        {topo(
          <button
            type="button"
            aria-expanded={gaveta}
            onClick={() => setGaveta(true)}
            className="min-h-11 min-w-11 cursor-pointer border border-borda bg-pergaminho px-3 text-[16px]"
          >
            ☰ Menu
          </button>,
        )}
        {main}
        {gaveta && (
          <div className="absolute inset-0 z-10 flex bg-black/40" onClick={() => setGaveta(false)}>
            <div
              className="h-full w-[85%] max-w-[360px] overflow-y-auto border-r-[6px] border-lab bg-folha"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setGaveta(false)}
                className={`${LINHA} mx-3 mt-3 w-auto border border-borda text-[15px]`}
              >
                ✕ Fechar
              </button>
              <Arvore rota={rota} ir={ir} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // bottom menu: the 5 labs at the thumb, the open lab's pages in a sheet that slides up
  return (
    <div className="relative flex h-full flex-col">
      {topo(
        <button
          type="button"
          aria-expanded={gaveta}
          onClick={() => setGaveta(!gaveta)}
          className="order-last ml-auto min-h-11 flex-none cursor-pointer border border-borda bg-pergaminho px-3 text-[16px]"
        >
          Páginas ▴
        </button>,
      )}
      {main}
      {gaveta && (
        <div
          className="absolute inset-x-0 top-0 bottom-[68px] z-10 flex items-end bg-black/40"
          onClick={() => setGaveta(false)}
        >
          <div
            className="max-h-[75%] w-full overflow-y-auto border-t-[6px] border-lab bg-folha"
            onClick={(e) => e.stopPropagation()}
          >
            <Arvore rota={rota} ir={ir} comLabs={false} />
          </div>
        </div>
      )}
      <nav
        aria-label="Labs"
        className="grid h-[68px] flex-none auto-cols-fr grid-flow-col border-t border-borda bg-folha"
      >
        {LAB_DADOS.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-current={l.id === rota.lab ? 'page' : undefined}
            onClick={() => ir(inicioDo(l.id))}
            className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 border-t-4 text-[14px] text-tinta aria-[current=page]:font-bold"
            style={{ borderTopColor: l.id === rota.lab ? l.cor : 'transparent' }}
          >
            <span aria-hidden="true" className="size-4 rounded-full" style={{ background: l.cor }} />
            {l.curto}
          </button>
        ))}
      </nav>
    </div>
  );
}

const VARIANTES: [Variante, string][] = [
  ['lateral', 'Barra lateral recolhível'],
  ['abas', 'Abas no topo'],
  ['inferior', 'Menu inferior no celular'],
];

function Navegacao() {
  const [variante, setVariante] = useState<Variante>('lateral');
  const [tam, setTam] = useState<Faixa['id']>('desktop');
  const f = porId(tam);
  return (
    <>
      <div className="flex flex-col gap-3">
        <Escolha rotulo="Variante" itens={VARIANTES} valor={variante} onPick={setVariante} />
        <Escolha rotulo="Tela" itens={TAMANHOS} valor={tam} onPick={setTam} />
      </div>
      <Moldura f={f}>
        {/* a new key per size: the lying tablet starts collapsed, the others open */}
        <Casca key={tam} f={f} variante={variante} inicio={{ lab: 'design', grupo: 'interface' }} />
      </Moldura>
    </>
  );
}

// ---------- 2. ultrawide, 3 panels: the icons page ----------

const ICONES = [
  'Golpe',
  'Golpe pesado',
  'Escudada',
  'Giro',
  'Machadada',
  'Pancada',
  'Tiro',
  'Tiro mirado',
  'Tiro de recuo',
  'Adaga',
  'Faca arremessada',
  'Facada',
  'Raio de fogo',
  'Explosão',
  'Rajada',
  'Cura',
  'Onda sombria',
  'Golpe mortal',
  'Rasteira',
  'Derrubar',
  'Estocada longa',
  'Salto',
  'Mover',
  'Esperar',
]; // the order of the atlas (Icones.tsx)
const FUNDOS: [string, string][] = [
  ['Painel azul do jogo', 'linear-gradient(#1c3a78,#0b1a3e)'],
  ['Papel claro', '#ece2c4'],
  ['Fundo escuro', '#282830'],
];

// one cell of the soft 32 px atlas (6 columns x 4 rows), drawn at `e` times
function Icone({ i, e }: { i: number; e: number }) {
  return (
    <span
      aria-hidden="true"
      className="block flex-none"
      style={{
        width: 32 * e,
        height: 32 * e,
        imageRendering: e >= 4 ? 'pixelated' : 'auto',
        background: `url(${ASSETS}/ia/icones/atlas-32-suave.png) -${(i % 6) * 32 * e}px -${Math.floor(i / 6) * 32 * e}px / ${192 * e}px ${128 * e}px no-repeat`,
      }}
    />
  );
}

function TresPaineis({ f }: { f: Faixa }) {
  const [sel, setSel] = useState(0);
  const [aba, setAba] = useState<'paginas' | 'icones' | 'lupa'>('icones');
  const [gaveta, setGaveta] = useState(false);
  const [fundo, setFundo] = useState(0);
  const grupo = CONTEUDO.design!.sumario.grupos.find((g) => g.id === 'interface')!;
  const abas = f.id === 'celular' || f.id === 'tablet';
  const escolher = (i: number) => {
    setSel(i);
    if (abas) setAba('lupa');
  };

  const lista = (
    <nav aria-label="Páginas de Interface" className="grid content-start gap-1 p-3">
      <strong className="px-2.5 py-2 font-serif text-[18px]">🟦 {grupo.titulo}</strong>
      {grupo.paginas.map((p) => (
        <span
          key={p.id}
          aria-current={p.id === 'icones' ? 'page' : undefined}
          className={`${LINHA} cursor-default text-[15px]`}
        >
          {p.titulo}
        </span>
      ))}
    </nav>
  );
  const conteudo = (
    <div className="grid content-start" style={{ gap: f.espaco, padding: `${f.espaco}px ${f.margem}px` }}>
      <Cabecalho
        lab="Design"
        grupo="Interface"
        pagina="Em uso: ícones 32 px"
        resumo="Atlas de 32 px dos ícones de habilidade. Toque num ícone: a lupa mostra o detalhe sem abrir janela."
        f={f}
      />
      <ul
        className="m-0 grid list-none p-0"
        style={{
          gap: f.espaco,
          gridTemplateColumns: `repeat(auto-fill, minmax(${f.id === 'celular' ? 150 : 180}px, 1fr))`,
        }}
      >
        {ICONES.map((nome, i) => (
          <li key={nome}>
            <button
              type="button"
              aria-pressed={i === sel}
              onClick={() => escolher(i)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-3 border border-borda bg-folha p-2.5 text-left text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-couro aria-pressed:outline-3 aria-pressed:outline-lab"
            >
              <span className="flex-none p-1.5" style={{ background: FUNDOS[0]![1] }}>
                <Icone i={i} e={2} />
              </span>
              <span className="font-bold">{nome}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  const todos = f.id === 'ultrawide';
  const lupa = (
    <aside aria-label="Lupa" className="grid content-start gap-3 p-5">
      {abas && (
        <button type="button" onClick={() => setAba('icones')} className={`${BOTAO} justify-self-start`}>
          ← Voltar aos ícones
        </button>
      )}
      <h2 className="m-0 font-serif text-[24px] font-bold">{ICONES[sel]}</h2>
      <p className="m-0 text-[15px] text-apagado">Lupa 8x (256 px), sem suavizar; abaixo, os tamanhos do jogo.</p>
      <div className="flex flex-wrap gap-3">
        {(todos ? FUNDOS : [FUNDOS[fundo]!]).map(([nome, cor]) => (
          <figure key={nome} className="m-0 grid gap-1.5">
            <div className="p-4" style={{ background: cor }}>
              <Icone i={sel} e={8} />
            </div>
            <figcaption className="text-[14px] text-apagado">{nome}</figcaption>
          </figure>
        ))}
      </div>
      {!todos && (
        <Escolha
          rotulo="Fundo"
          itens={FUNDOS.map(([nome], i): [string, string] => [String(i), nome])}
          valor={String(fundo)}
          onPick={(v) => setFundo(Number(v))}
        />
      )}
      <div className="flex items-end gap-4 p-3" style={{ background: FUNDOS[0]![1] }}>
        {[1, 1.5, 2].map((e) => (
          <Icone key={e} i={sel} e={e} />
        ))}
      </div>
      <p className="m-0 text-[14px] text-apagado">32, 48 e 64 px no painel do jogo.</p>
    </aside>
  );

  const cabeca = (extra?: ReactNode) => (
    <header className="flex min-h-14 flex-none items-center gap-3 border-b-4 border-lab bg-folha px-3">
      {extra}
      <Selo cor={LAB_DADOS.find((l) => l.id === 'design')!.cor} texto="De" />
      <strong className="font-serif text-[19px]">Design system e UX</strong>
    </header>
  );

  if (abas) {
    const ABAS: [typeof aba, string][] = [
      ['paginas', 'Páginas'],
      ['icones', 'Ícones'],
      ['lupa', 'Lupa'],
    ];
    return (
      <div className="flex h-full flex-col">
        {cabeca()}
        <div
          role="tablist"
          aria-label="Painéis"
          className="grid flex-none grid-cols-3 border-b border-borda bg-pergaminho"
        >
          {ABAS.map(([id, nome]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={aba === id}
              onClick={() => setAba(id)}
              className="min-h-12 cursor-pointer border-b-4 border-transparent text-[16px] text-tinta aria-selected:border-lab aria-selected:font-bold"
            >
              {nome}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {aba === 'paginas' ? lista : aba === 'icones' ? conteudo : lupa}
        </div>
      </div>
    );
  }
  if (f.id === 'deitado')
    return (
      <div className="relative flex h-full flex-col">
        {cabeca(
          <button
            type="button"
            aria-expanded={gaveta}
            onClick={() => setGaveta(true)}
            className="min-h-11 cursor-pointer border border-borda bg-pergaminho px-3 text-[16px]"
          >
            ☰ Páginas
          </button>,
        )}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_380px]">
          <div className="overflow-y-auto">{conteudo}</div>
          <div className="overflow-y-auto border-l border-borda bg-folha">{lupa}</div>
        </div>
        {gaveta && (
          <div className="absolute inset-0 z-10 flex bg-black/40" onClick={() => setGaveta(false)}>
            <div className="h-full w-[320px] bg-folha" onClick={(e) => e.stopPropagation()}>
              {lista}
            </div>
          </div>
        )}
      </div>
    );
  return (
    <div className="flex h-full flex-col">
      {cabeca()}
      <div
        className="grid min-h-0 flex-1"
        style={{ gridTemplateColumns: todos ? '320px minmax(0,1fr) 980px' : '260px minmax(0,1fr) 400px' }}
      >
        <div className="overflow-y-auto border-r-[6px] border-lab bg-folha">{lista}</div>
        <div className="overflow-y-auto">{conteudo}</div>
        <div className="overflow-y-auto border-l border-borda bg-folha">{lupa}</div>
      </div>
    </div>
  );
}

function Ultrawide() {
  const [tam, setTam] = useState<Faixa['id']>('ultrawide');
  const f = porId(tam);
  return (
    <>
      <Escolha rotulo="Tela" itens={TAMANHOS} valor={tam} onPick={setTam} />
      <Moldura f={f}>
        <TresPaineis key={tam} f={f} />
      </Moldura>
    </>
  );
}

// ---------- 3. dense page: the real expression bench, laid out by its own width (container queries in expressoes.css) ----------

function Densa() {
  const [tam, setTam] = useState<Faixa['id']>('celular');
  const f = porId(tam);
  return (
    <>
      <Escolha rotulo="Tela" itens={TAMANHOS} valor={tam} onPick={setTam} />
      <Moldura f={f}>
        <Casca f={f} variante="inferior" inicio={{ lab: 'design', grupo: 'personagens', pagina: 'expressoes' }}>
          <Expressoes />
        </Casca>
      </Moldura>
    </>
  );
}

// ---------- 4. type, spacing and reading width per band ----------

function Amostra({ f }: { f: Faixa }) {
  const colunas = f.paineis.startsWith('3') ? 3 : f.paineis.startsWith('2') ? 2 : 1;
  return (
    <div className="h-full overflow-y-auto bg-mar/40" style={{ padding: `0 ${f.margem}px` }}>
      <div
        className="grid min-h-full content-start bg-pergaminho"
        style={{ gap: f.espaco, padding: `${f.espaco + 8}px 0` }}
      >
        <p className="m-0 text-apagado" style={{ fontSize: f.legenda }}>
          Margem lateral {f.margem} px (faixa azul) · espaço entre blocos {f.espaco} px
        </p>
        <h1 className="m-0 font-serif leading-tight font-bold" style={{ fontSize: f.h1 }}>
          Título da página, {f.h1} px
        </h1>
        <h2 className="m-0 font-serif leading-tight font-bold" style={{ fontSize: f.h2 }}>
          Seção, {f.h2} px
        </h2>
        <p className="m-0 border-r-4 border-ouro" style={{ fontSize: f.base, maxWidth: f.leitura, lineHeight: 1.55 }}>
          Corpo de texto em {f.base} px, preso em {f.leitura === '100%' ? 'toda a largura' : f.leitura} (a borda dourada
          marca onde a linha para). Linhas longas demais cansam a leitura: no monitor largo, o espaço que sobra vira
          painéis ao lado, não frases mais compridas. O lab mostra decisões, histórias e testes, então o texto precisa
          ler bem em qualquer tela.
        </p>
        <h3 className="m-0 font-serif font-bold" style={{ fontSize: f.h3 }}>
          Subseção, {f.h3} px
        </h3>
        <p className="m-0 text-apagado" style={{ fontSize: f.legenda }}>
          Legenda e nota, {f.legenda} px: o menor texto do lab.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          {ESPACOS.map((e) => (
            <span key={e} className="grid justify-items-center gap-1 text-[14px]">
              <span className={e === f.espaco ? 'bg-lab' : 'bg-traco'} style={{ width: e, height: e }} />
              {e}
            </span>
          ))}
        </div>
        <div className="grid min-h-28" style={{ gap: f.espaco, gridTemplateColumns: `repeat(${colunas}, 1fr)` }}>
          {[['Conteúdo'], ['Conteúdo', 'Detalhe'], ['Lista', 'Conteúdo', 'Detalhe']][colunas - 1]!.map((n) => (
            <span key={n} className="grid place-items-center border border-dashed border-traco bg-folha text-[15px]">
              {n}
            </span>
          ))}
        </div>
        <p className="m-0 text-[15px]">
          Painéis: {f.paineis}. Navegação: {f.nav}.
        </p>
        <button type="button" className={`${BOTAO} justify-self-start`}>
          Botão de 44 px de altura
        </button>
      </div>
    </div>
  );
}

function Tipografia() {
  const [tam, setTam] = useState<Faixa['id']>('celular');
  const f = porId(tam);
  return (
    <>
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-[15px]">
          <caption className="mb-2 text-left text-[15px] text-apagado">
            Faixas propostas (larguras em px CSS). Hoje a casca tem só dois cortes: 700 px (Paginas.tsx, max-[700px]) e
            1100 px (index.css, --breakpoint-desk).
          </caption>
          <thead>
            <tr className="bg-pergaminho-escuro">
              {[
                'Faixa',
                'Larguras',
                'Tela de teste',
                'Margem',
                'Espaço',
                'Corpo',
                'Títulos h1 / h2 / h3',
                'Legenda',
                'Leitura',
                'Painéis',
                'Navegação',
              ].map((t) => (
                <th key={t} scope="col" className="border border-borda px-2.5 py-2">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FAIXAS.map((x, i) => (
              <tr key={x.id} className={x.id === tam ? 'bg-lab-soft' : 'bg-folha'}>
                <th scope="row" className="border border-borda px-2.5 py-2">
                  {x.nome}
                </th>
                {[
                  FAIXAS[i + 1] ? `${x.min} a ${FAIXAS[i + 1]!.min - 1}` : `${x.min} ou mais`,
                  `${x.tela[0]} × ${x.tela[1]}`,
                  `${x.margem} px`,
                  `${x.espaco} px`,
                  `${x.base} px`,
                  `${x.h1} / ${x.h2} / ${x.h3} px`,
                  `${x.legenda} px`,
                  x.leitura === '100%' ? 'toda a largura' : x.leitura,
                  x.paineis,
                  x.nav,
                ].map((v, j) => (
                  <td key={j} className="border border-borda px-2.5 py-2">
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Escolha rotulo="Tela" itens={TAMANHOS} valor={tam} onPick={setTam} />
      <Moldura f={f}>
        <Amostra f={f} />
      </Moldura>
    </>
  );
}

// ---------- the page ----------

export function RedesignResponsivo() {
  return (
    <div className="grid min-w-0 gap-8">
      <p className="m-0 max-w-[72ch] text-[17px]">
        Maquetes do redesenho do app dos labs para as cinco telas em que ele é usado (decisão de 15/11): celular
        390×844, tablet 820×1180 em pé e 1180×820 deitado, desktop 1920×1080 e ultrawide 3440×1440. Cada moldura desenha
        a tela no tamanho real e encolhe para caber; dentro dela, o layout segue a largura da moldura. Os labs e as
        páginas são os de verdade; a casca do app ainda não muda.
      </p>
      <Secao
        id="navegacao"
        titulo="1. Navegação"
        nota="Três jeitos de chegar aos 5 labs e às páginas de cada um. Toque nos labs, grupos e páginas dentro da moldura: a navegação funciona. Abaixo de 1024 px, a barra lateral vira gaveta (☰ Menu) e o menu inferior mostra as páginas numa folha (Páginas ▴); acima, os dois viram barra lateral."
        recomendacao={[
          'Menu inferior com os 5 labs no celular e no tablet em pé (cabe exatamente 5 e o polegar alcança), com as páginas numa folha que sobe.',
          'De 1024 px para cima, barra lateral recolhível. Abas no topo ficam de fora: não comportam os três níveis (grupo, página, subpágina).',
        ]}
      >
        <Navegacao />
      </Secao>
      <Secao
        id="ultrawide"
        titulo="2. Ultrawide em 3 painéis"
        nota="A página de ícones com lista de páginas | cartões | lupa fixa à direita. A lupa deixa de ser janela por cima (modal): tocar num cartão troca o ícone que ela mostra. No ultrawide a lupa mostra os 3 fundos lado a lado; nas telas menores, um fundo por vez."
        recomendacao={[
          '3 painéis a partir de 1440 px (lista | conteúdo | detalhe fixo), 2 no tablet deitado (a lista vira gaveta) e abas Páginas · Ícones · Lupa no celular e no tablet em pé.',
          'O detalhe nunca é modal: em tela larga fica sempre à direita; em tela estreita é a terceira aba, com "← Voltar" para os cartões.',
        ]}
      >
        <Ultrawide />
      </Secao>
      <Secao
        id="pagina-densa"
        titulo="3. Página densa: Bancada de expressões"
        nota="A bancada de verdade (os botões tocam as expressões), dentro da casca recomendada. No celular: uma coluna, botões de 44 px e a tabela vira um cartão por personagem com 4 quadros por linha. No ultrawide: controles | cena grande | tabela inteira, lado a lado."
        recomendacao={[
          'No celular, uma coluna: controles em cima, cena, e a tabela vira um cartão por personagem (4 quadros por linha, tamanho automático).',
          'No ultrawide, 3 colunas fixas: controles | cena grande | tabela inteira, sem rolagem lateral; desktop e tablet deitado ficam como hoje (2 colunas).',
        ]}
      >
        <Densa />
      </Secao>
      <Secao
        id="tema-e-tipografia"
        titulo="4. Tema e tipografia"
        nota="Escala de texto, espaçamento e largura de leitura por faixa de tela. Só modo claro, com as cores do tema Ouro e couro (pergaminho, folha, tinta, apagado, ouro e a cor de cada lab). O desktop mantém os números da casca atual."
        recomendacao={[
          '5 faixas com cortes em 640, 1024, 1440 e 2560 px; corpo de 16 a 18 px, nunca texto abaixo de 14 px, e alvo de toque de 44 px em toda faixa.',
          'Texto corrido preso em 72 caracteres em qualquer tela: a largura extra vira painéis, não linhas mais longas.',
        ]}
      >
        <Tipografia />
      </Secao>
    </div>
  );
}
