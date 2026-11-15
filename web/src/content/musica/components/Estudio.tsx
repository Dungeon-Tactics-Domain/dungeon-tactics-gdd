// Studio view of a track: one lane per instrument (controls on the left, that instrument's notes on the right), a bar ruler,
// an overview strip to seek, and the live mixer. The sound is the pre-rendered stems (one .ogg per instrument) played together,
// so it is the real render; "Tratada" puts a filter chain in the browser that approximates the ffmpeg treatment.
import { useCallback, useEffect, useRef, useState } from 'react';
import { lerMidi, nomeNota, rotuloCanal, type Midi } from './midi';

interface Stem {
  canal: number;
  programa: number | null;
  nome: string;
}
interface Info {
  duracao: number;
  stems: Stem[];
}

// one colour per lane, picked to stay readable on the light panel and apart from each other
const CORES = ['#3b5bdb', '#7048e8', '#0c8599', '#2b8a3e', '#e8590c', '#c2255c', '#9c6b00', '#495057'];
const LARGURA_ROTULOS = 230;
const ALTURA_LINHA = 58;
const ALTURA_REGUA = 26;
const JANELA = 24; // seconds visible in the lanes
const BEATS_POR_COMPASSO = 4;
const ALTURA_RESUMO = 34;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

interface Retomada {
  t: number;
  tocando: boolean;
  quando: number;
}
// where the previous sound version of the same track stopped (valid for 3 s, so only a version switch resumes)
const memoria = new Map<string, Retomada>();

export function Estudio({
  base,
  midiSrc,
  tratadaInicial,
  chave,
}: {
  base: string;
  midiSrc: string;
  tratadaInicial: boolean;
  chave: string; // same for every sound version of one track
}) {
  const retomada = useRef<Retomada>(undefined); // read once the previous version's cleanup has run
  const dir = `/content/musica/stems/${base}`;
  const [info, setInfo] = useState<Info | null>(null);
  const [midi, setMidi] = useState<Midi | null>(null);
  const [estado, setEstado] = useState<'parado' | 'carregando' | 'tocando' | 'pausado' | 'erro'>('parado');
  const [vol, setVol] = useState<Record<number, number>>({});
  const [mudo, setMudo] = useState<Set<number>>(new Set());
  const [solo, setSolo] = useState<Set<number>>(new Set());
  const [tratada, setTratada] = useState(tratadaInicial);
  const [agora, setAgora] = useState(0);
  const ctx = useRef<AudioContext | null>(null);
  const buffers = useRef<AudioBuffer[]>([]);
  const fontes = useRef<AudioBufferSourceNode[]>([]);
  const ganhos = useRef<Map<number, GainNode>>(new Map());
  const mestre = useRef<{ entrada: GainNode; cadeia: AudioNode[] } | null>(null);
  const inicio = useRef(0); // ctx time at which the loop position was 0
  const tela = useRef<HTMLCanvasElement>(null);
  const resumo = useRef<HTMLCanvasElement>(null);
  const live = useRef({ vol, mudo, solo, info, midi });
  const tocandoRef = useRef(false);
  useEffect(() => {
    live.current = { vol, mudo, solo, info, midi }; // the draw loop reads these without restarting
    tocandoRef.current = estado === 'tocando';
  });

  useEffect(() => {
    let vivo = true;
    fetch(`${dir}/stems.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Info>) : Promise.reject(new Error(String(r.status)))))
      .then((i) => vivo && setInfo(i))
      .catch(() => vivo && setInfo(null));
    fetch(midiSrc)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => vivo && setMidi(lerMidi(b)))
      .catch(() => vivo && setMidi(null));
    return () => {
      vivo = false;
      const c = ctx.current;
      const dur = live.current.info?.duracao ?? 1;
      if (c)
        memoria.set(chave, {
          t: (((c.currentTime - inicio.current) % dur) + dur) % dur,
          tocando: tocandoRef.current,
          quando: Date.now(),
        });
      void c?.close();
    };
  }, [dir, midiSrc, chave]);

  const posicao = useCallback(() => {
    const c = ctx.current;
    const dur = live.current.info?.duracao ?? 1;
    return c ? (((c.currentTime - inicio.current) % dur) + dur) % dur : 0;
  }, []);

  // volume, mute and solo all end in one gain per stem
  useEffect(() => {
    for (const [ch, g] of ganhos.current) {
      g.gain.value = mudo.has(ch) || (solo.size > 0 && !solo.has(ch)) ? 0 : (vol[ch] ?? 1);
    }
  }, [vol, mudo, solo]);

  // treatment: bypass, or highpass + softer highs + compressor + makeup + a ceiling (close to the ffmpeg chain, not identical)
  useEffect(() => {
    const c = ctx.current;
    const m = mestre.current;
    if (!c || !m) return;
    m.entrada.disconnect();
    m.cadeia.forEach((n) => n.disconnect());
    if (!tratada) {
      m.entrada.connect(c.destination);
      return;
    }
    const [hp, prateleira, comp, ganho, teto] = m.cadeia as [
      BiquadFilterNode,
      BiquadFilterNode,
      DynamicsCompressorNode,
      GainNode,
      DynamicsCompressorNode,
    ];
    m.entrada.connect(hp).connect(prateleira).connect(comp).connect(ganho).connect(teto).connect(c.destination);
  }, [tratada, estado]);

  const arrancar = useCallback((de: number) => {
    const c = ctx.current;
    const m = mestre.current;
    if (!c || !m || !live.current.info) return;
    fontes.current.forEach((f) => {
      try {
        f.stop();
      } catch {
        /* already stopped */
      }
    });
    const t0 = c.currentTime + 0.05; // every stem starts on the same tick
    fontes.current = live.current.info.stems.map((s, i) => {
      const src = c.createBufferSource();
      src.buffer = buffers.current[i]!;
      src.loop = true;
      src.connect(ganhos.current.get(s.canal - 1)!);
      src.start(t0, de);
      return src;
    });
    inicio.current = t0 - de;
  }, []);

  const tocar = async () => {
    if (estado === 'carregando') return;
    try {
      if (ctx.current) {
        await ctx.current.resume();
        setEstado('tocando');
        return;
      }
      if (!info) return;
      setEstado('carregando');
      const c = new AudioContext();
      buffers.current = await Promise.all(
        info.stems.map(async (s) => c.decodeAudioData(await (await fetch(`${dir}/${s.canal - 1}.ogg`)).arrayBuffer())),
      );
      const entrada = c.createGain();
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 32;
      const prateleira = c.createBiquadFilter();
      prateleira.type = 'highshelf';
      prateleira.frequency.value = 2500;
      prateleira.gain.value = -6;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -22;
      comp.ratio.value = 3.5;
      comp.attack.value = 0.004;
      comp.release.value = 0.12;
      const ganho = c.createGain();
      ganho.gain.value = 1.4; // about +3 dB: the stems sum near -17 LUFS, the treated files sit at -14
      const teto = c.createDynamicsCompressor();
      teto.threshold.value = -3;
      teto.ratio.value = 20;
      teto.attack.value = 0.001;
      teto.release.value = 0.05;
      mestre.current = { entrada, cadeia: [hp, prateleira, comp, ganho, teto] };
      info.stems.forEach((s) => {
        const g = c.createGain();
        g.connect(entrada);
        ganhos.current.set(s.canal - 1, g);
      });
      ctx.current = c;
      arrancar(retomada.current?.t ?? 0);
      document.querySelector('audio')?.pause(); // never two copies of the music at once
      setEstado('tocando'); // the effect above wires the master chain once the state changes
    } catch {
      setEstado('erro');
    }
  };
  const pausar = async () => {
    await ctx.current?.suspend();
    setEstado('pausado');
  };
  const buscar = (t: number) => {
    if (!ctx.current) return;
    arrancar(Math.max(0, Math.min(t, (info?.duracao ?? 1) - 0.01)));
    setAgora(t);
  };
  const alterna = (s: Set<number>, ch: number) => {
    const n = new Set(s);
    if (!n.delete(ch)) n.add(ch);
    return n;
  };

  const retomou = useRef(false);
  useEffect(() => {
    if (!info || retomou.current) return;
    retomou.current = true;
    const r = memoria.get(chave);
    if (!r || Date.now() - r.quando > 3000) return;
    retomada.current = r;
    // the click on the version selector counts as the user's gesture, so the sound can resume on its own
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (r.tocando) void tocar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.code !== 'Space' || /INPUT|BUTTON|SUMMARY|TEXTAREA/.test(alvo.tagName)) return;
      e.preventDefault();
      if (estado === 'tocando') void pausar();
      else if (estado !== 'carregando') void tocar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  const canais = info?.stems.map((s) => s.canal - 1) ?? [];
  const bpm = midi?.bpm ?? 90;
  const seg = (BEATS_POR_COMPASSO * 60) / bpm;
  const total = info?.duracao ?? 0;

  // drawing: lanes and ruler follow the position; the overview strip shows the whole loop
  useEffect(() => {
    const c = tela.current;
    const r = resumo.current;
    if (!c || !r || !midi || !info) return;
    const g = c.getContext('2d')!;
    const gr = r.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const nL = canais.length;
    const H = ALTURA_REGUA + nL * ALTURA_LINHA;
    const ps = midi.notas.map((n) => n.p);
    const faixa = (ch: number) => {
      const p = midi.notas.filter((n) => n.ch === ch).map((n) => n.p);
      return [Math.min(...p), Math.max(...p)] as const;
    };
    const limites = new Map(canais.map((ch) => [ch, faixa(ch)] as const));
    void ps;
    let raf = 0;
    let ultimoTexto = -1;
    const quadro = () => {
      const w = c.clientWidth;
      const rw = r.clientWidth;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(H * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(H * dpr);
      }
      if (r.width !== Math.round(rw * dpr) || r.height !== Math.round(ALTURA_RESUMO * dpr)) {
        r.width = Math.round(rw * dpr);
        r.height = Math.round(ALTURA_RESUMO * dpr);
      }
      const { vol: v, mudo: m, solo: so } = live.current;
      const t = ctx.current ? posicao() : 0;
      const ini = Math.max(0, Math.min(t - JANELA * 0.25, total - JANELA));
      const px = (x: number) => ((x - ini) / JANELA) * w;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, H);
      // ruler: bar numbers (one every 4 bars when the lanes are packed) and beat ticks
      g.fillStyle = '#f6f8fa';
      g.fillRect(0, 0, w, ALTURA_REGUA);
      g.font = '12px Karla, system-ui, sans-serif';
      g.textBaseline = 'middle';
      const primeiro = Math.floor(ini / seg);
      for (let b = primeiro; b * seg < ini + JANELA + seg; b++) {
        const x = px(b * seg);
        g.fillStyle = b % 4 === 0 ? '#9aa5b4' : '#d5dbe3';
        g.fillRect(x, b % 4 === 0 ? 0 : ALTURA_REGUA - 8, 1, b % 4 === 0 ? H : 8);
        if (b % 2 === 0) {
          g.fillStyle = '#5b6675';
          g.fillText(String(b + 1), x + 4, 13);
        }
      }
      canais.forEach((ch, i) => {
        const y0 = ALTURA_REGUA + i * ALTURA_LINHA;
        const calado = m.has(ch) || (so.size > 0 && !so.has(ch)) || (v[ch] ?? 1) === 0;
        g.fillStyle = i % 2 ? '#f1f4f7' : '#f7f9fb';
        g.fillRect(0, y0, w, ALTURA_LINHA);
        g.fillStyle = '#e1e6ec';
        g.fillRect(0, y0 + ALTURA_LINHA - 1, w, 1);
        const [pMin, pMax] = limites.get(ch)!;
        const span = Math.max(12, pMax - pMin + 2);
        const alt = Math.max(3, Math.min(8, (ALTURA_LINHA - 10) / span));
        const py = (p: number) => y0 + ALTURA_LINHA - 5 - ((p - pMin + 1) / span) * (ALTURA_LINHA - 10);
        g.fillStyle = CORES[i % CORES.length]!;
        for (const n of midi.notas) {
          if (n.ch !== ch || n.fim < ini || n.t > ini + JANELA) continue;
          const ativa = n.t <= t && t < n.fim && !calado;
          g.globalAlpha = calado ? 0.18 : ativa ? 1 : 0.62;
          g.fillRect(px(n.t), py(n.p) - alt / 2, Math.max(2, px(n.fim) - px(n.t) - 1), alt);
        }
        g.globalAlpha = 1;
      });
      // playhead
      g.fillStyle = '#e03131';
      g.fillRect(px(t) - 1, 0, 2, H);
      g.beginPath();
      g.moveTo(px(t) - 6, 0);
      g.lineTo(px(t) + 6, 0);
      g.lineTo(px(t), 8);
      g.fill();
      // overview strip
      gr.setTransform(dpr, 0, 0, dpr, 0, 0);
      gr.clearRect(0, 0, rw, ALTURA_RESUMO);
      gr.fillStyle = '#f1f4f7';
      gr.fillRect(0, 0, rw, ALTURA_RESUMO);
      const rx = (x: number) => (x / total) * rw;
      canais.forEach((ch, i) => {
        const [pMin, pMax] = limites.get(ch)!;
        const span = Math.max(12, pMax - pMin + 2);
        gr.fillStyle = CORES[i % CORES.length]!;
        gr.globalAlpha = m.has(ch) || (so.size > 0 && !so.has(ch)) ? 0.08 : 0.5;
        const h = ALTURA_RESUMO / nL;
        for (const n of midi.notas) {
          if (n.ch !== ch) continue;
          gr.fillRect(rx(n.t), i * h + h - 1 - ((n.p - pMin + 1) / span) * (h - 1), Math.max(1, rx(n.fim - n.t)), 1);
        }
      });
      gr.globalAlpha = 1;
      gr.strokeStyle = '#3b5bdb';
      gr.lineWidth = 1.5;
      gr.strokeRect(rx(ini) + 0.5, 0.5, rx(JANELA) - 1, ALTURA_RESUMO - 1);
      gr.fillStyle = '#e03131';
      gr.fillRect(rx(t) - 1, 0, 2, ALTURA_RESUMO);
      if (Math.floor(t * 4) !== ultimoTexto) {
        ultimoTexto = Math.floor(t * 4);
        setAgora(t);
      }
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(raf);
    // canais is derived from info; the loop reads everything else from refs
  }, [info, midi, posicao, seg, total]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!info) return null;
  const ativas = (ch: number) => {
    if (!midi) return '';
    const vivas = midi.notas.filter((n) => n.ch === ch && n.t <= agora && agora < n.fim).map((n) => nomeNota(n.p));
    return [...new Set(vivas)].join(' ');
  };
  const clicar = (e: React.MouseEvent<HTMLCanvasElement>, alvo: 'resumo' | 'lanes') => {
    const r = e.currentTarget.getBoundingClientRect();
    const f = (e.clientX - r.left) / r.width;
    if (alvo === 'resumo') buscar(f * total);
    else {
      const ini = Math.max(0, Math.min(agora - JANELA * 0.25, total - JANELA));
      buscar(ini + f * JANELA);
    }
  };

  return (
    <section
      aria-label="Estúdio"
      className="grid gap-0 overflow-hidden rounded-md border border-[#c9d1db] bg-[#eef1f4] text-[#1c2430] shadow-[0_1px_0_#fff_inset]"
    >
      <div className="flex flex-wrap items-center gap-4 border-b border-[#c9d1db] bg-[#f7f9fb] px-4 py-3">
        <button
          onClick={estado === 'tocando' ? pausar : tocar}
          disabled={estado === 'carregando'}
          className="h-10 min-w-28 rounded bg-[#1c2430] px-4 font-bold text-white disabled:opacity-60"
        >
          {estado === 'tocando' ? 'Pausar' : estado === 'carregando' ? 'Carregando…' : 'Tocar'}
        </button>
        <span className="tabular-nums" aria-live="off">
          <b>{mmss(agora)}</b> <span className="text-[#5b6675]">/ {mmss(total)}</span>
        </span>
        <span className="tabular-nums text-[#5b6675]">
          compasso {Math.min(Math.floor(agora / seg) + 1, Math.round(total / seg))} de {Math.round(total / seg)}
        </span>
        <span className="tabular-nums text-[#5b6675]">{Math.round(bpm)} bpm</span>
        <div
          className="ml-auto flex overflow-hidden rounded border border-[#c9d1db]"
          role="group"
          aria-label="Versão do som"
        >
          {(
            [
              [false, 'Original'],
              [true, 'Tratada'],
            ] as const
          ).map(([v, rotulo]) => (
            <button
              key={rotulo}
              aria-pressed={tratada === v}
              onClick={() => setTratada(v)}
              className={`h-10 px-4 ${tratada === v ? 'bg-[#3b5bdb] font-bold text-white' : 'bg-white'}`}
            >
              {rotulo}
            </button>
          ))}
        </div>
        {estado === 'erro' && <span className="text-[#c92a2a]">Não consegui carregar os instrumentos.</span>}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `${LARGURA_ROTULOS}px 1fr` }}>
        <div className="flex items-center border-b border-r border-[#c9d1db] bg-[#f7f9fb] px-3 text-[13px] text-[#5b6675]">
          Visão geral
        </div>
        <canvas
          ref={resumo}
          onClick={(e) => clicar(e, 'resumo')}
          className="block w-full cursor-pointer border-b border-[#c9d1db]"
          style={{ height: ALTURA_RESUMO }}
          aria-label="Visão geral da música: clique para ir a esse ponto"
        />
        <div
          className="border-r border-[#c9d1db] bg-[#f7f9fb]"
          style={{ height: ALTURA_REGUA, gridColumn: 1, gridRow: 2 }}
        />
        <div className="relative row-span-1" style={{ gridColumn: 2, gridRow: '2 / span 2' }}>
          <canvas
            ref={tela}
            onClick={(e) => clicar(e, 'lanes')}
            className="block w-full cursor-pointer"
            style={{ height: ALTURA_REGUA + canais.length * ALTURA_LINHA }}
            aria-label="Notas de cada instrumento: clique para ir a esse ponto"
          />
        </div>
        <div style={{ gridColumn: 1, gridRow: 3 }}>
          {info.stems.map((s, i) => {
            const ch = s.canal - 1;
            const calado = mudo.has(ch) || (solo.size > 0 && !solo.has(ch));
            return (
              <div
                key={ch}
                className={`grid content-center gap-1 border-b border-r border-[#c9d1db] px-3 ${i % 2 ? 'bg-[#f1f4f7]' : 'bg-[#f7f9fb]'}`}
                style={{ height: ALTURA_LINHA, opacity: calado ? 0.55 : 1 }}
              >
                <div className="flex items-center gap-2">
                  <span className="size-3 shrink-0 rounded-sm" style={{ background: CORES[i % CORES.length] }} />
                  <span className="truncate text-[14px] font-bold" title={rotuloCanal(ch, s.programa ?? undefined)}>
                    {s.nome}
                  </span>
                  <span className="ml-auto truncate text-[12px] tabular-nums text-[#5b6675]">{ativas(ch)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={vol[ch] ?? 1}
                    aria-label={`Volume: ${s.nome}`}
                    onChange={(e) => setVol({ ...vol, [ch]: Number(e.target.value) })}
                    className="h-4 min-w-0 flex-1 accent-[#3b5bdb]"
                  />
                  <button
                    onClick={() => setMudo(alterna(mudo, ch))}
                    aria-pressed={mudo.has(ch)}
                    title="Mudo"
                    className={`size-7 rounded text-[12px] font-bold ${mudo.has(ch) ? 'bg-[#c92a2a] text-white' : 'border border-[#c9d1db] bg-white'}`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => setSolo(alterna(solo, ch))}
                    aria-pressed={solo.has(ch)}
                    title="Solo"
                    className={`size-7 rounded text-[12px] font-bold ${solo.has(ch) ? 'bg-[#e8a400] text-[#1c2430]' : 'border border-[#c9d1db] bg-white'}`}
                  >
                    S
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="m-0 border-t border-[#c9d1db] bg-[#f7f9fb] px-4 py-2 text-[13px] text-[#5b6675]">
        M silencia, S toca só aquele instrumento, espaço toca e pausa, clique nas notas ou na visão geral para ir a um
        ponto. Tratada é uma aproximação feita no navegador, não o arquivo do ffmpeg.
      </p>
    </section>
  );
}
