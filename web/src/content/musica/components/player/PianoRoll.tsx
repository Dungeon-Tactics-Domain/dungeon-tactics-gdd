// Tempo line with the zoom, the overview of the whole song (click to go to a point, drag to move the stretch the lanes
// show, which a box marks on it), the bar ruler and one lane per channel with the real MIDI notes of the active
// version. Canvas, not SVG: a piece has thousands of notes, and one canvas per lane is drawn only when the song, the
// mute/solo state or the size changes; the needle is a plain element that moves each frame.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { useTemaNaTela } from '@/lib/tema';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { barAt, barCount, barSeconds, pitchRanges, rulerBars, timeToX, xToTime } from '@/lib/player/math';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import { readMidi, type Midi } from '@/lib/player/read-midi';
import type { Channel, Version } from '@/lib/player/schema';
import { gravar, ler } from '@/lib/utils';
import {
  ALTURA_FAIXA,
  ALTURA_REGUA,
  CHAVE_ZOOM,
  ESTREITO,
  FADE_NOTA,
  LARGURA_CANVAS,
  PASSO_RODA,
  varDoCanal,
  ZOOM_MAXIMO,
  ZOOM_PADRAO,
} from './constantes';
import { ajusteEtiquetas, type NotaAtiva, nomeDaNota, notasEm, passoNotas, useMotor } from './hooks';

// A label of the mixer's notes column, made here by hand (see the effect that writes them). The fade is the opacity
// transition; with reduced motion the label just goes.
const ETIQUETA =
  'border border-l-[6px] border-(--cor) px-1 text-center text-creme transition-opacity duration-300 data-saindo:opacity-0 motion-reduce:transition-none';

const cacheMidi = new Map<string, Promise<Midi>>();
const carregarMidi = (url: string) => {
  let p = cacheMidi.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${url}: HTTP ${r.status}`))))
      .then(readMidi);
    p.catch(() => cacheMidi.delete(url)); // a later render may retry
    cacheMidi.set(url, p);
  }
  return p;
};

export function PianoRoll({
  engine,
  versao,
  canais,
  duracao,
  mixer,
}: {
  engine: PlayerEngine | undefined;
  versao: Version | undefined;
  canais: Channel[];
  duracao: number;
  /** the mixer, drawn left of the lanes */
  mixer: ReactNode;
}) {
  useMotor(engine, true);
  const estreito = useMediaQuery(ESTREITO);
  const tema = useTemaNaTela();
  const url = versao?.midi;
  // the result carries its url, so a late answer for a previous song is ignored without resetting state in an effect
  const [lido, setLido] = useState<{ url: string; midi?: Midi; falhou?: boolean }>();
  const midi = lido?.url === url ? lido?.midi : undefined;
  const falhou = lido?.url === url && lido?.falhou;
  const [largura, setLargura] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const faixas = useRef<HTMLDivElement>(null);
  const rolagem = useRef<HTMLDivElement>(null);
  const pista = useRef<HTMLDivElement>(null);
  const visao = useRef<HTMLDivElement>(null);
  // the zoom of the last visit; a stored value that is not a zoom falls back to the default
  const [zoom, setZoom] = useState(() => {
    const n = Number(ler(CHAVE_ZOOM));
    return n >= 1 && n <= ZOOM_MAXIMO ? n : ZOOM_PADRAO;
  });
  // the stretch of the song the lanes show, as fractions of its length
  const [janela, setJanela] = useState({ inicio: 0, tamanho: 1 });
  // the point that stays under the pointer (or in the middle) across a zoom change
  const ancora = useRef<{ fracao: number; px: number }>(undefined);
  const pega = useRef<{ x: number; desvio: number; moveu: boolean }>(undefined);
  // the labels of the notes column, per channel, with the ones fading out
  const ativas = useRef(new Map<number, NotaAtiva[]>());
  const anterior = useRef(0);

  // the lanes scroll sideways in the box they share with the mixer on a desktop and in their own wrapper on a phone
  const rolador = useCallback(() => (matchMedia(ESTREITO).matches ? pista.current : rolagem.current), []);
  const medirJanela = useCallback(() => {
    const total = faixas.current?.offsetWidth;
    const r = rolador();
    if (!total || !r || !pista.current) return;
    const j = { inicio: r.scrollLeft / total, tamanho: Math.min(1, pista.current.clientWidth / total) };
    setJanela((a) => (a.inicio === j.inicio && a.tamanho === j.tamanho ? a : j));
  }, [rolador]);
  const rolarPara = useCallback(
    (fracao: number) => {
      const r = rolador();
      if (r && faixas.current) r.scrollLeft = fracao * faixas.current.offsetWidth; // the browser keeps it in range
    },
    [rolador],
  );

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    carregarMidi(url).then(
      (m) => vivo && setLido({ url, midi: m }),
      () => vivo && setLido({ url, falhou: true }),
    );
    return () => {
      vivo = false;
    };
  }, [url]);

  // the lanes are redrawn when the box changes size (jsdom has no ResizeObserver: it keeps its first size)
  useEffect(() => {
    const el = faixas.current;
    if (!el || !globalThis.ResizeObserver) return;
    const ro = new ResizeObserver(() => {
      setLargura(el.clientWidth);
      medirJanela();
    });
    ro.observe(el);
    if (pista.current) ro.observe(pista.current);
    return () => ro.disconnect();
  }, [medirJanela]);

  // largura is the zoomed width, so largura / zoom is what fits on screen
  const teto = largura
    ? Math.max(1, Math.min(ZOOM_MAXIMO, (LARGURA_CANVAS * zoom) / (largura * (globalThis.devicePixelRatio || 1))))
    : ZOOM_MAXIMO;
  // `px` is the point of the lanes on screen that stays still (the middle when not given); with `fracao`, a point of
  // the song given as a share of its length stays where it is instead, on screen or not
  const mudarZoom = (z: number, px?: number, fracao?: number) => {
    const r = rolador();
    const total = faixas.current?.offsetWidth;
    const x = px ?? (pista.current?.clientWidth ?? 0) / 2;
    if (r && total)
      ancora.current =
        fracao === undefined
          ? { fracao: (r.scrollLeft + x) / total, px: x }
          : { fracao, px: fracao * total - r.scrollLeft };
    const novo = Math.max(1, Math.min(teto, z));
    setZoom(novo);
    gravar(CHAVE_ZOOM, String(novo));
  };
  // layout effect: the lanes are already at the new width and the scroll is set before the paint, so nothing jumps
  useLayoutEffect(() => {
    const a = ancora.current;
    const r = rolador();
    if (a && r && faixas.current) r.scrollLeft = a.fracao * faixas.current.offsetWidth - a.px;
    ancora.current = undefined;
    medirJanela();
  }, [zoom, rolador, medirJanela]);

  // Ctrl + wheel over the lanes zooms around the pointer; over the overview the wheel alone does, around the point of
  // the song under the pointer, so the box grows and shrinks about it. Native listeners, because React's wheel handler
  // is passive and could not stop the browser from zooming or scrolling the page.
  const rodar = useRef((e: WheelEvent, geral: boolean) => void [e, geral]);
  useEffect(() => {
    rodar.current = (e, geral) => {
      if (!e.deltaY) return;
      const z = e.deltaY < 0 ? zoom * PASSO_RODA : zoom / PASSO_RODA;
      const caixa = (geral ? visao : pista).current?.getBoundingClientRect();
      const x = Math.max(0, e.clientX - (caixa?.left ?? 0));
      // a box with no width (not laid out, jsdom) has no point to hold: the middle of the lanes stays
      if (!geral) mudarZoom(z, x);
      else mudarZoom(z, undefined, caixa?.width ? Math.min(1, x / caixa.width) : undefined);
    };
  });
  useEffect(() => {
    const el = rolagem.current;
    const ev = visao.current;
    if (!el || !ev) return;
    const aoRodar = (e: WheelEvent) => {
      const geral = e.currentTarget === ev;
      if (!geral && !e.ctrlKey) return;
      e.preventDefault();
      rodar.current(e, geral);
    };
    el.addEventListener('wheel', aoRodar, { passive: false });
    ev.addEventListener('wheel', aoRodar, { passive: false });
    return () => {
      el.removeEventListener('wheel', aoRodar);
      ev.removeEventListener('wheel', aoRodar);
    };
  }, []);

  const bpm = midi?.bpm ?? 120;
  const compassos = barCount(duracao, bpm);
  const posicao = engine?.position ?? 0;
  // a muted lane (or one silenced by another's solo) is drawn faded
  const somando = canais.map((c) => (!engine || engine.effectiveGain(c.channel) > 0 ? 1 : 0)).join('');

  useEffect(() => {
    if (raiz.current) desenhar(raiz.current, { midi, canais, duracao, bpm, compassos, somando, estreito });
    // tema: the canvases copy their colours from the CSS, so a theme change repaints them
  }, [midi, canais, duracao, bpm, compassos, somando, estreito, largura, tema]);

  // The notes sounding on each channel under the needle, written as labels into the mixer's notes column
  // ([data-notas], empty in its JSX): only the labels that come or go are touched, so the mixer is not rendered again
  // every frame. A note that stops keeps its label for FADE_NOTA, fading; while paused no frame comes to take it
  // away, so a timer runs this once more.
  useEffect(() => {
    let poda: ReturnType<typeof setTimeout> | undefined;
    const escrever = () => {
      const agora = performance.now();
      const soando = notasEm(midi?.notes ?? [], posicao);
      let saindo = false;
      for (const caixa of raiz.current?.querySelectorAll<HTMLElement>('[data-notas]') ?? []) {
        const canal = Number(caixa.dataset.notas);
        // drums (channel 9 in General MIDI) have no pitch to name: one label, whatever is hit
        const alturas = canal === 9 ? (soando.has(9) ? [0] : []) : (soando.get(canal) ?? []);
        const lista = passoNotas(ativas.current.get(canal) ?? [], alturas, agora);
        ativas.current.set(canal, lista);
        saindo ||= lista.some((n) => n.saiu !== undefined);
        const { fonte, visiveis } = ajusteEtiquetas(lista.length);
        const mostradas = lista.slice(0, visiveis);
        caixa.style.fontSize = `${fonte}px`;
        const filhos = new Map([...caixa.children].map((el) => [Number((el as HTMLElement).dataset.altura), el]));
        for (const [altura, el] of filhos) if (!mostradas.some((n) => n.altura === altura)) el.remove();
        mostradas.forEach((n, i) => {
          let el = filhos.get(n.altura);
          if (!el) {
            el = document.createElement('span');
            (el as HTMLElement).dataset.altura = String(n.altura);
            el.className = ETIQUETA;
            el.textContent = canal === 9 ? '♪' : nomeDaNota(n.altura);
          }
          if (caixa.children[i] !== el) caixa.insertBefore(el, caixa.children[i] ?? null);
          el.toggleAttribute('data-saindo', n.saiu !== undefined);
        });
      }
      if (saindo) poda = setTimeout(escrever, FADE_NOTA + 20);
    };
    escrever();
    return () => clearTimeout(poda);
  }, [midi, posicao, canais]);

  // The lanes follow the needle: when it leaves the stretch on screen (playing on, the loop going back to the start, a
  // jump from the position bar), that stretch moves to it. Only if it was on screen before, so scrolling away to look
  // at another part is not undone, and never during a drag on the overview.
  useEffect(() => {
    const antes = anterior.current;
    anterior.current = posicao;
    if (pega.current || !duracao || janela.tamanho >= 1) return;
    const naTela = (p: number) => p / duracao >= janela.inicio && p / duracao <= janela.inicio + janela.tamanho;
    if (naTela(antes) && !naTela(posicao)) rolarPara(posicao / duracao);
  }, [posicao, duracao, janela, rolarPara]);

  const irPara = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    engine?.seek(xToTime(e.clientX - r.left, duracao, r.width));
  };

  // On the overview a press that moves drags the box (held where it was grabbed, or by its middle when the press was
  // outside it) and a press that does not move goes to that point and centres the lanes on it.
  const naVisao = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, w: r.width };
  };
  const pegar = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId); // jsdom has no capture
    const { x, w } = naVisao(e);
    const dentro = x >= janela.inicio * w && x <= (janela.inicio + janela.tamanho) * w;
    pega.current = { x: e.clientX, desvio: dentro ? x - janela.inicio * w : (janela.tamanho * w) / 2, moveu: false };
  };
  const arrastar = (e: React.PointerEvent<HTMLElement>) => {
    const p = pega.current;
    if (!p) return;
    // 3 px: a click with a shaky hand is still a click
    if (Math.abs(e.clientX - p.x) > 3) p.moveu = true;
    const { x, w } = naVisao(e);
    if (p.moveu && w) rolarPara((x - p.desvio) / w);
  };
  const soltar = (e: React.PointerEvent<HTMLElement>) => {
    const p = pega.current;
    pega.current = undefined;
    const { x, w } = naVisao(e);
    if (!p || p.moveu || !w) return;
    engine?.seek(xToTime(x, duracao, w));
    rolarPara(x / w - janela.tamanho / 2);
  };

  const teclas = (e: React.KeyboardEvent) => {
    if (!engine) return;
    const compasso = barSeconds(bpm);
    const para =
      e.key === 'ArrowRight'
        ? posicao + compasso
        : e.key === 'ArrowLeft'
          ? posicao - compasso
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? duracao - compasso
              : undefined;
    if (e.key === ' ') {
      if (engine.state === 'playing') engine.pause();
      else void engine.play();
    } else if (para === undefined) return;
    else engine.seek(Math.max(0, Math.min(duracao, para)));
    e.preventDefault();
    e.stopPropagation(); // the app also listens for Space on the window
  };

  if (!versao) return null;
  const textoCompasso = `Compasso ${barAt(posicao, bpm, compassos)} de ${compassos}`;
  const agulha = { left: `${(duracao ? posicao / duracao : 0) * 100}%` };

  return (
    <div ref={raiz} className="flex min-h-0 min-w-0 flex-1 flex-col bg-couro-escuro text-creme">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="border-2 border-apagado px-2.5 py-0.5">
          {midi ? `${Math.round(bpm)} bpm · ${compassos} compassos` : '…'}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="font-mono tabular-nums text-ouro-claro">
            {textoCompasso}
          </span>
          <Toggle
            icone="menos"
            aria-label="Diminuir o zoom das notas"
            title="Diminuir o zoom (Ctrl + roda do mouse)"
            disabled={zoom <= 1}
            onClick={() => mudarZoom(zoom / 2)}
            className="min-w-11 px-0"
          />
          <span role="status" className="min-w-[9ch] text-center font-mono tabular-nums">
            Zoom {Number(zoom.toFixed(1))}×
          </span>
          <Toggle
            icone="mais"
            aria-label="Aumentar o zoom das notas"
            title="Aumentar o zoom (Ctrl + roda do mouse)"
            disabled={zoom >= teto}
            onClick={() => mudarZoom(zoom * 2)}
            className="min-w-11 px-0"
          />
        </span>
      </div>
      {falhou && (
        <p role="status" className="m-0 px-3 pb-2 text-creme-apagado">
          O MIDI desta versão não carregou.
        </p>
      )}
      {/* touch-none: a finger on the overview drags the box instead of scrolling the page */}
      <div
        ref={visao}
        title="Role a roda do mouse para mudar o zoom"
        className="relative cursor-pointer touch-none select-none"
        onPointerDown={pegar}
        onPointerMove={arrastar}
        onPointerUp={soltar}
        onPointerCancel={() => (pega.current = undefined)}
      >
        <canvas
          data-roll="visao"
          role="img"
          aria-label="Visão geral: clique para ir a esse ponto; arraste para mover o trecho que as notas mostram"
          className="block h-20 w-full border-y-2 border-couro bg-couro-escuro"
        />
        {/* the stretch of the song on screen in the lanes; the whole width while the zoom is 1 */}
        <div
          data-roll="janela"
          className="pointer-events-none absolute inset-y-0 border-2 border-ouro-claro bg-ouro-claro/20"
          style={{ left: `${janela.inicio * 100}%`, width: `${janela.tamanho * 100}%` }}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-px bg-ouro-claro" style={agulha} />
      </div>
      {/* One scroll box for the mixer and the lanes, so a strip never leaves its lane; the mixer header and the ruler
          stick to its top and the mixer to its left. On a phone the parts stack and only the lanes scroll, up to the
          height the handle sets. */}
      <div
        ref={rolagem}
        data-roll="rolagem"
        onScroll={medirJanela}
        className="grid min-h-0 flex-1 scroll-pt-12 grid-cols-[auto_minmax(0,1fr)] content-start items-start [scrollbar-color:var(--color-apagado)_transparent] max-[700px]:grid-cols-1 max-[700px]:gap-2 min-[701px]:overflow-auto"
      >
        {mixer}
        <div
          ref={pista}
          data-roll="pista"
          onScroll={medirJanela}
          className="max-[700px]:max-h-(--daw-altura) max-[700px]:overflow-auto"
        >
          <div
            ref={faixas}
            role="slider"
            tabIndex={0}
            aria-label="Notas de cada canal: clique para ir a esse ponto; setas movem um compasso"
            aria-valuemin={0}
            aria-valuemax={Number(duracao.toFixed(1))}
            aria-valuenow={Number(posicao.toFixed(1))}
            aria-valuetext={textoCompasso}
            onClick={irPara}
            onKeyDown={teclas}
            // the zoom: the lanes are this many times as wide as the room they have
            style={{ width: `${zoom * 100}%` }}
            className="relative min-w-full cursor-pointer border-2 border-couro bg-couro-escuro max-[700px]:min-w-[640px]"
          >
            {/* opaque: the lanes pass under it, and before the MIDI loads nothing is painted on it */}
            <canvas
              data-roll="regua"
              className="sticky top-0 block w-full bg-couro-escuro"
              style={{ height: ALTURA_REGUA }}
            />
            {canais.map((c) => (
              <div key={c.channel} style={{ height: ALTURA_FAIXA }} className="border-t border-apagado">
                <canvas data-roll="faixa" data-channel={c.channel} className="block size-full" />
              </div>
            ))}
            <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-px bg-ouro-claro" style={agulha}>
              {/* sticky, so the needle's head stays on the ruler while the lanes scroll */}
              <span className="sticky top-0 -ml-1.5 block w-max border-[7px] border-transparent border-t-[10px] border-t-ouro-claro" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Quadro {
  midi: Midi | undefined;
  canais: Channel[];
  duracao: number;
  bpm: number;
  compassos: number;
  somando: string;
  estreito: boolean;
}

// Paints the ruler, every lane and the overview. Colours come from the player's variables in index.css (read at draw
// time, so the canvas follows the theme without a copy of its hex values); the fallbacks are the dark theme's.
function desenhar(raiz: HTMLElement, q: Quadro) {
  const estilo = getComputedStyle(raiz);
  const cor = (nome: string, reserva: string) => estilo.getPropertyValue(nome).trim() || reserva;
  const fundo = cor('--roll-fundo', '#141c2b');
  const alterno = cor('--roll-alt', '#1f2a3d');
  const grade = cor('--roll-grade', '#6f7c95');
  const texto = cor('--roll-texto', '#eef1f7');
  const corDoCanal = (i: number) => cor(varDoCanal(i), '#9aa4ab');
  const dpr = globalThis.devicePixelRatio || 1;
  const { duracao: d, bpm } = q;
  const notas = q.midi?.notes ?? [];
  const faixas = pitchRanges(notas);

  // sizes the backing store to the CSS box and returns a context in CSS pixels, or null where canvas is missing
  const preparar = (c: HTMLCanvasElement | null) => {
    const g = c?.getContext('2d');
    if (!c || !g) return null;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    return { g, w, h };
  };

  const regua = preparar(raiz.querySelector('[data-roll="regua"]'));
  if (regua && q.midi) {
    const { g, w, h } = regua;
    g.fillStyle = alterno;
    g.fillRect(0, 0, w, h);
    g.font = '700 16px ui-monospace, monospace';
    g.textBaseline = 'middle';
    g.fillStyle = texto;
    const compasso = barSeconds(bpm);
    for (const b of rulerBars(q.compassos, w)) {
      const x = timeToX((b - 1) * compasso, d, w);
      g.fillRect(x, h - 8, 1, 8);
      g.fillText(String(b), Math.min(x + 4, w - 28), h / 2);
    }
  }

  q.canais.forEach((canal, i) => {
    const caixa = preparar(raiz.querySelector(`[data-roll="faixa"][data-channel="${canal.channel}"]`));
    if (!caixa) return;
    const { g, w, h } = caixa;
    g.fillStyle = i % 2 ? alterno : fundo;
    g.fillRect(0, 0, w, h);
    // a grid line every 4 bars, as on the ruler's longer ticks
    g.fillStyle = grade;
    const cada = barSeconds(bpm) * 4;
    for (let t = cada; t < d; t += cada) g.fillRect(timeToX(t, d, w), 0, 1, h);
    const [lo, hi] = faixas.get(canal.channel) ?? [60, 60];
    const amplitude = Math.max(12, hi - lo + 1);
    const altura = Math.max(3, Math.min(10, (h - 12) / amplitude));
    g.fillStyle = corDoCanal(i);
    g.globalAlpha = q.somando[i] === '1' ? 1 : 0.25;
    for (const n of notas) {
      if (n.channel !== canal.channel) continue;
      const x = timeToX(n.start, d, w);
      const y = h - 6 - ((n.pitch - lo + 0.5) / amplitude) * (h - 12);
      g.fillRect(x, y - altura / 2, Math.max(2, timeToX(n.end - n.start, d, w) - 1), altura);
    }
    g.globalAlpha = 1;
    if (q.estreito) {
      // on a phone the mixer sits above the roll, so each lane names its channel
      g.font = '16px sans-serif';
      g.textBaseline = 'top';
      g.fillStyle = texto;
      g.fillText(canal.name, 6, 4);
    }
  });

  const visao = preparar(raiz.querySelector('[data-roll="visao"]'));
  if (visao && q.canais.length) {
    const { g, w, h } = visao;
    const faixa = h / q.canais.length;
    q.canais.forEach((canal, i) => {
      const [lo, hi] = faixas.get(canal.channel) ?? [60, 60];
      const amplitude = Math.max(12, hi - lo + 1);
      g.fillStyle = corDoCanal(i);
      g.globalAlpha = q.somando[i] === '1' ? 0.9 : 0.2;
      for (const n of notas) {
        if (n.channel !== canal.channel) continue;
        const y = i * faixa + faixa - ((n.pitch - lo + 0.5) / amplitude) * faixa;
        g.fillRect(timeToX(n.start, d, w), y, Math.max(1, timeToX(n.end - n.start, d, w)), 2);
      }
    });
    g.globalAlpha = 1;
  }
}
