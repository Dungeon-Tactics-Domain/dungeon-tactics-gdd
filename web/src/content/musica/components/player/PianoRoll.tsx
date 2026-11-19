// Tempo line, the clickable overview, the bar ruler and one lane per channel with the real MIDI notes of the active
// version across the whole song. Canvas, not SVG: a piece has thousands of notes, and one canvas per lane is drawn only
// when the song, the mute/solo state or the size changes; the needle is a plain element that moves each frame.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { barAt, barCount, barSeconds, pitchRanges, rulerBars, timeToX, xToTime } from '@/lib/player/math';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import { readMidi, type Midi } from '@/lib/player/read-midi';
import type { Channel, Version } from '@/lib/player/schema';
import { ALTURA_FAIXA, ALTURA_REGUA, corDoCanal, ESTREITO } from './constantes';
import { useMotor } from './hooks';

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
  const url = versao?.midi;
  // the result carries its url, so a late answer for a previous song is ignored without resetting state in an effect
  const [lido, setLido] = useState<{ url: string; midi?: Midi; falhou?: boolean }>();
  const midi = lido?.url === url ? lido?.midi : undefined;
  const falhou = lido?.url === url && lido?.falhou;
  const [largura, setLargura] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const faixas = useRef<HTMLDivElement>(null);

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
    const ro = new ResizeObserver(() => setLargura(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bpm = midi?.bpm ?? 120;
  const compassos = barCount(duracao, bpm);
  const posicao = engine?.position ?? 0;
  // a muted lane (or one silenced by another's solo) is drawn faded
  const somando = canais.map((c) => (!engine || engine.effectiveGain(c.channel) > 0 ? 1 : 0)).join('');

  useEffect(() => {
    if (raiz.current) desenhar(raiz.current, { midi, canais, duracao, bpm, compassos, somando, estreito });
  }, [midi, canais, duracao, bpm, compassos, somando, estreito, largura]);

  const irPara = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    engine?.seek(xToTime(e.clientX - r.left, duracao, r.width));
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
    <div ref={raiz} className="grid min-w-0 bg-couro-escuro text-creme">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <span className="border-2 border-apagado px-2.5 py-0.5">
          {midi ? `${Math.round(bpm)} bpm · ${compassos} compassos` : '…'}
        </span>
        <span aria-hidden="true" className="font-mono tabular-nums text-ouro-claro">
          {textoCompasso}
        </span>
      </div>
      {falhou && (
        <p role="status" className="m-0 px-3 pb-2 text-creme-apagado">
          O MIDI desta versão não carregou.
        </p>
      )}
      <div className="relative">
        <canvas
          data-roll="visao"
          role="img"
          aria-label="Visão geral: clique para ir a esse ponto"
          onClick={irPara}
          className="block h-10 w-full cursor-pointer border-y-2 border-couro bg-couro-escuro"
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-px bg-ouro-claro" style={agulha} />
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start max-[700px]:grid-cols-1 max-[700px]:gap-2">
        {mixer}
        <div className="overflow-x-auto">
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
            className="relative min-w-full cursor-pointer border-2 border-couro bg-couro-escuro max-[700px]:min-w-[640px]"
          >
            <canvas data-roll="regua" className="block w-full" style={{ height: ALTURA_REGUA }} />
            {canais.map((c) => (
              <div key={c.channel} style={{ height: ALTURA_FAIXA }} className="border-t border-apagado">
                <canvas data-roll="faixa" data-channel={c.channel} className="block size-full" />
              </div>
            ))}
            <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-px bg-ouro-claro" style={agulha}>
              <span className="absolute -left-1.5 top-0 border-[7px] border-transparent border-t-[10px] border-t-ouro-claro" />
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

// Paints the ruler, every lane and the overview. Colours come from the theme variables (read at draw time, so the
// canvas follows the lab scheme without a copy of its hex values).
function desenhar(raiz: HTMLElement, q: Quadro) {
  const estilo = getComputedStyle(raiz);
  const cor = (nome: string, reserva: string) => estilo.getPropertyValue(nome).trim() || reserva;
  const fundo = cor('--color-couro-escuro', '#141c2b');
  const alterno = cor('--color-couro', '#1f2a3d');
  const grade = cor('--color-apagado', '#4a5568');
  const texto = cor('--color-creme', '#eef1f7');
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
        g.fillRect(timeToX(n.start, d, w), y, Math.max(1, timeToX(n.end - n.start, d, w)), 1.5);
      }
    });
    g.globalAlpha = 1;
  }
}
