// Studio view of a track: one lane per instrument (controls on the left, that instrument's notes on the right), a bar ruler,
// an overview strip to seek, and the live mixer. The sound is the pre-rendered stems (one .ogg per instrument) played together,
// so it is the real render; "Tratada" puts a filter chain in the browser that approximates the ffmpeg treatment.
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Icone } from '@/components/layout/Icone';
import { DICAS_SOM, DICAS_UI, funcaoDe } from './dicas';
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
const CORES = ['#7a5523', '#7048e8', '#0c8599', '#2b8a3e', '#e8590c', '#c2255c', '#9c6b00', '#495057'];
const LARGURA_ROTULOS = 230;
const ALTURA_LINHA = 58;
const ALTURA_LINHA_COM_SOM = 96; // name, volume and the per-instrument sound menu, one row each
const ALTURA_LINHA_ESTREITA = 124; // a third row for the per-instrument sound menu on a phone
const ALTURA_REGUA = 26;
const JANELA = 24; // seconds visible in the lanes
const BEATS_POR_COMPASSO = 4;
const ALTURA_RESUMO = 34;

const CHAVE_PRESETS = 'dt:lab:presets-som';
// saved presets: name -> (instrument key -> sound name). The key is the General MIDI program ("drums" for the kit), so a preset
// made on one piece applies to any other that uses the same instruments.
const lerPresets = (): Record<string, Record<string, string>> => {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(CHAVE_PRESETS) ?? '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Record<string, string>>) : {};
  } catch {
    return {};
  }
};
const chaveInstr = (s: Stem) => (s.canal === 10 ? 'drums' : String(s.programa));

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
  musica,
  sfs,
  descricao,
  papeis,
}: {
  base: string;
  midiSrc: string;
  tratadaInicial: boolean;
  chave: string; // same for every sound version of one track
  musica?: {
    opcoes: { valor: string; rotulo: string; familia: string; dica?: string }[];
    atual: string;
    aoTrocar: (v: string) => void;
  };
  sfs?: { rotulo: string; stems: string }[]; // the sounds (soundfonts) the piece has stems for; the first is the default
  descricao?: ReactNode; // the text about the selected piece, shown inside the studio
  papeis?: Partial<Record<string, string>>; // why each instrument is in this piece, by channel number (1-based)
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
  const [geral, setGeral] = useState(1);
  const consulta =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 639px)')
      : null;
  const [estreito, setEstreito] = useState(consulta?.matches ?? false);
  useEffect(() => {
    const f = () => setEstreito(consulta?.matches ?? false);
    consulta?.addEventListener('change', f);
    return () => consulta?.removeEventListener('change', f);
  }, [consulta]);
  const linha = sfs && sfs.length > 1 ? (estreito ? ALTURA_LINHA_ESTREITA : ALTURA_LINHA_COM_SOM) : ALTURA_LINHA;
  const [preset, setPreset] = useState('sf:0'); // 'sf:<i>' (one soundfont everywhere), 'u:<name>' (saved) or 'custom'
  const [atrib, setAtrib] = useState<Record<number, number>>({}); // channel -> index in sfs
  const [disp, setDisp] = useState<Set<number>[]>([]); // channels each sound has stems for
  const [usuario, setUsuario] = useState<Record<string, Record<string, string>>>(lerPresets);
  const cache = useRef(new Map<string, Promise<AudioBuffer>>());
  const carregado = useRef<number[]>([]); // which sound each playing stem was loaded from
  const [agora, setAgora] = useState(0);
  const ctx = useRef<AudioContext | null>(null);
  const buffers = useRef<AudioBuffer[]>([]);
  const [prog, setProg] = useState<Record<number, number>>({}); // channel -> share of its stem downloaded (1 = ready)
  const carga = info?.stems.length ? info.stems.reduce((t, st) => t + (prog[st.canal] ?? 1), 0) / info.stems.length : 1;
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
    Promise.all(
      (sfs ?? []).map((sf) =>
        fetch(`/content/musica/stems/${sf.stems}/stems.json`)
          .then((r) => (r.ok ? (r.json() as Promise<Info>) : Promise.reject(new Error(String(r.status)))))
          .then((i) => new Set(i.stems.map((x) => x.canal)))
          .catch(() => new Set<number>()),
      ),
    ).then((d) => vivo && setDisp(d));
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
  }, [dir, midiSrc, chave]); // eslint-disable-line react-hooks/exhaustive-deps -- sfs is rebuilt every render; its stems follow base

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

  // master volume: the gain every stem goes through before the treatment chain
  useEffect(() => {
    if (mestre.current) mestre.current.entrada.gain.value = geral;
  }, [geral, estado]);

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

  const atribRef = useRef(atrib);
  useEffect(() => {
    atribRef.current = atrib;
  });
  // stems download and decode as soon as the piece is chosen: one shared promise per stem, so a repeated request waits for it
  const buf = useCallback(
    (c: BaseAudioContext, sf: number, canal: number) => {
      const k = `${sf}:${canal}`;
      const feito = cache.current.get(k);
      if (feito) return feito;
      const d = `/content/musica/stems/${sfs?.[sf]?.stems ?? base}`;
      setProg((p) => ({ ...p, [canal]: 0 }));
      const novo = (async () => {
        const r = await fetch(`${d}/${canal - 1}.ogg`);
        const tot = Number(r.headers.get('content-length')) || 0;
        const partes: Uint8Array[] = [];
        let lido = 0;
        const leitor = r.body?.getReader();
        // read in chunks to show progress; without a length (compressed answer) the bar jumps from 0 to done
        for (let l = await leitor?.read(); l && !l.done; l = await leitor?.read()) {
          partes.push(l.value);
          lido += l.value.length;
          if (tot) setProg((p) => ({ ...p, [canal]: Math.min(0.99, lido / tot) }));
        }
        const dados = leitor ? await new Blob(partes as BlobPart[]).arrayBuffer() : await r.arrayBuffer();
        const b = await c.decodeAudioData(dados);
        setProg((p) => ({ ...p, [canal]: 1 }));
        return b;
      })();
      cache.current.set(k, novo);
      return novo;
    },
    [sfs, base],
  );

  // preload: an offline context decodes without the user gesture a live AudioContext waits for; the buffers play in any context
  const pre = useRef<OfflineAudioContext | null>(null);
  useEffect(() => {
    if (!info) return;
    const c = ctx.current ?? (pre.current ??= new OfflineAudioContext(2, 1, 44100));
    for (const s of info.stems) void buf(c, atrib[s.canal] ?? 0, s.canal).catch(() => setEstado('erro'));
  }, [info, atrib, buf]);

  // a channel changed sound while playing: load that stem and swap only its source, at the current position
  useEffect(() => {
    const c = ctx.current;
    const stems = live.current.info?.stems;
    if (!c || !stems) return;
    stems.forEach((s, i) => {
      const quer = atrib[s.canal] ?? 0;
      if (carregado.current[i] === undefined || carregado.current[i] === quer) return;
      carregado.current[i] = quer;
      void buf(c, quer, s.canal).then((b) => {
        buffers.current[i] = b;
        const velha = fontes.current[i];
        if (!velha) return;
        try {
          velha.stop();
        } catch {
          /* already stopped */
        }
        const src = c.createBufferSource();
        src.buffer = b;
        src.loop = true;
        src.connect(ganhos.current.get(s.canal - 1)!);
        src.start(c.currentTime + 0.03, posicao());
        fontes.current[i] = src;
      });
    });
  }, [atrib, buf, posicao]);

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
      carregado.current = info.stems.map((s) => atribRef.current[s.canal] ?? 0);
      buffers.current = await Promise.all(info.stems.map((s, i) => buf(c, carregado.current[i]!, s.canal)));
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

  const usaSom = (i: number, canal: number) => (i === 0 ? 0 : disp[i]?.has(canal) ? i : 0);
  const aplicar = (v: string) => {
    setPreset(v);
    if (v === 'custom' || !info) return;
    const n: Record<number, number> = {};
    for (const st of info.stems) {
      if (v.startsWith('sf:')) n[st.canal] = usaSom(Number(v.slice(3)), st.canal);
      else {
        const nome = usuario[v.slice(2)]?.[chaveInstr(st)];
        n[st.canal] = usaSom(Math.max(0, sfs?.findIndex((x) => x.rotulo === nome) ?? 0), st.canal);
      }
    }
    setAtrib(n);
  };
  const trocarCanal = (canal: number, i: number) => {
    setAtrib({ ...atrib, [canal]: i });
    setPreset('custom');
  };
  const gravarPresets = (novo: Record<string, Record<string, string>>) => {
    setUsuario(novo);
    try {
      localStorage.setItem(CHAVE_PRESETS, JSON.stringify(novo));
    } catch {
      /* private window: the preset lasts until the page closes */
    }
  };
  const salvarPreset = () => {
    const nome = window.prompt('Nome do novo preset de som (guarda o som de cada instrumento):')?.trim();
    if (!nome || !info || !sfs) return;
    const mapa: Record<string, string> = {};
    for (const st of info.stems) mapa[chaveInstr(st)] = sfs[atrib[st.canal] ?? 0]?.rotulo ?? '';
    gravarPresets({ ...usuario, [nome]: mapa });
    setPreset(`u:${nome}`);
  };
  const excluirPreset = () => {
    const resto = { ...usuario };
    delete resto[preset.slice(2)];
    gravarPresets(resto);
    aplicar('sf:0');
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
    const H = ALTURA_REGUA + nL * linha;
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
      g.fillStyle = '#fbf5e6';
      g.fillRect(0, 0, w, ALTURA_REGUA);
      g.font = '12px Karla, system-ui, sans-serif';
      g.textBaseline = 'middle';
      const primeiro = Math.floor(ini / seg);
      for (let b = primeiro; b * seg < ini + JANELA + seg; b++) {
        const x = px(b * seg);
        g.fillStyle = b % 4 === 0 ? '#99713d' : '#e0cfa8';
        g.fillRect(x, b % 4 === 0 ? 0 : ALTURA_REGUA - 8, 1, b % 4 === 0 ? H : 8);
        if (b % 2 === 0) {
          g.fillStyle = '#5f4e3a';
          g.fillText(String(b + 1), x + 4, 13);
        }
      }
      canais.forEach((ch, i) => {
        const y0 = ALTURA_REGUA + i * linha;
        const calado = m.has(ch) || (so.size > 0 && !so.has(ch)) || (v[ch] ?? 1) === 0;
        g.fillStyle = i % 2 ? '#e9dab8' : '#fbf5e6';
        g.fillRect(0, y0, w, linha);
        g.fillStyle = '#d8c8a0';
        g.fillRect(0, y0 + linha - 1, w, 1);
        const [pMin, pMax] = limites.get(ch)!;
        const span = Math.max(12, pMax - pMin + 2);
        const alt = Math.max(3, Math.min(8, (linha - 10) / span));
        const py = (p: number) => y0 + linha - 5 - ((p - pMin + 1) / span) * (linha - 10);
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
      g.fillStyle = '#a3262a';
      g.fillRect(px(t) - 1, 0, 2, H);
      g.beginPath();
      g.moveTo(px(t) - 6, 0);
      g.lineTo(px(t) + 6, 0);
      g.lineTo(px(t), 8);
      g.fill();
      // overview strip
      gr.setTransform(dpr, 0, 0, dpr, 0, 0);
      gr.clearRect(0, 0, rw, ALTURA_RESUMO);
      gr.fillStyle = '#e9dab8';
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
      gr.strokeStyle = '#7a5523';
      gr.lineWidth = 1.5;
      gr.strokeRect(rx(ini) + 0.5, 0.5, rx(JANELA) - 1, ALTURA_RESUMO - 1);
      gr.fillStyle = '#a3262a';
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
  }, [info, midi, posicao, seg, total, linha]); // eslint-disable-line react-hooks/exhaustive-deps

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
      className="grid gap-0 overflow-hidden rounded-md border border-ouro bg-pergaminho text-tinta"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ouro bg-pergaminho-escuro px-4 py-2">
        {musica && (
          <label className="flex flex-wrap items-center gap-2" title={DICAS_UI.musica}>
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
                      <option key={o.valor} value={o.valor} title={o.dica}>
                        {o.rotulo}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        )}
        {sfs && sfs.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex flex-wrap items-center gap-2" title={DICAS_UI.som}>
              <span className="text-apagado">Som:</span>
              <select
                value={preset}
                onChange={(e) => aplicar(e.target.value)}
                className="min-h-11 rounded border border-ouro bg-folha px-2"
              >
                <optgroup label="Um som em todos os instrumentos">
                  {sfs.map((sf, i) => (
                    <option key={sf.rotulo} value={`sf:${i}`} title={DICAS_SOM[sf.rotulo]}>
                      {sf.rotulo}
                    </option>
                  ))}
                </optgroup>
                {Object.keys(usuario).length > 0 && (
                  <optgroup label="Meus presets">
                    {Object.keys(usuario).map((n) => (
                      <option key={n} value={`u:${n}`}>
                        {n}
                      </option>
                    ))}
                  </optgroup>
                )}
                {preset === 'custom' && <option value="custom">Personalizado</option>}
              </select>
            </label>
            <button
              onClick={salvarPreset}
              title={DICAS_UI.salvar}
              className="inline-flex min-h-11 items-center gap-2 rounded border border-ouro bg-folha px-3"
            >
              <Icone id="salvar" /> Salvar preset
            </button>
            {preset.startsWith('u:') && (
              <button
                onClick={excluirPreset}
                title={DICAS_UI.excluir}
                className="inline-flex min-h-11 items-center gap-2 rounded border border-ouro bg-folha px-3"
              >
                <Icone id="excluir" /> Excluir
              </button>
            )}
          </div>
        )}
        <label className="flex flex-wrap items-center gap-2" title={DICAS_UI.acabamento}>
          <span className="text-apagado">Acabamento:</span>
          <select
            value={tratada ? 'tratada' : 'original'}
            onChange={(e) => setTratada(e.target.value === 'tratada')}
            className="min-h-11 rounded border border-ouro bg-folha px-2"
          >
            <option value="tratada" title={DICAS_UI.tratada}>
              Tratada
            </option>
            <option value="original" title={DICAS_UI.original}>
              Original
            </option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-b border-ouro bg-folha px-4 py-3">
        <button
          title={DICAS_UI.tocar}
          onClick={estado === 'tocando' ? pausar : tocar}
          disabled={estado === 'carregando' || carga < 1}
          className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded bg-couro px-4 font-bold text-creme disabled:opacity-60"
        >
          {estado !== 'carregando' && carga >= 1 && <Icone id={estado === 'tocando' ? 'pausar' : 'tocar'} />}
          {estado === 'tocando' ? 'Pausar' : estado === 'carregando' || carga < 1 ? 'Carregando…' : 'Tocar'}
        </button>
        {info && carga < 1 && (
          <div
            role="progressbar"
            aria-label="Carregando a trilha"
            aria-valuenow={Math.round(carga * 100)}
            title="Carregamento dos instrumentos desta trilha"
            className="flex items-center gap-2 text-apagado"
          >
            <span className="h-2 w-32 overflow-hidden rounded bg-traco">
              <span className="block h-full bg-ouro transition-[width]" style={{ width: `${carga * 100}%` }} />
            </span>
            <span className="tabular-nums">{Math.round(carga * 100)}%</span>
          </div>
        )}
        <span className="tabular-nums" aria-live="off">
          <b>{mmss(agora)}</b> <span className="text-apagado">/ {mmss(total)}</span>
        </span>
        <span className="tabular-nums text-apagado">
          compasso {Math.min(Math.floor(agora / seg) + 1, Math.round(total / seg))} de {Math.round(total / seg)}
        </span>
        <span className="tabular-nums text-apagado">{Math.round(bpm)} bpm</span>
        <label className="flex items-center gap-2 text-apagado sm:ml-auto" title={DICAS_UI.geral}>
          Volume geral
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={geral}
            onChange={(ev) => setGeral(Number(ev.target.value))}
            className="h-11 w-32 accent-couro sm:h-auto"
          />
          <span className="w-10 tabular-nums">{Math.round(geral * 100)}%</span>
        </label>
        {estado === 'erro' && <span className="text-erro">Não consegui carregar os instrumentos.</span>}
      </div>
      {info && (
        <>
          <div className="grid" style={{ gridTemplateColumns: `clamp(150px, 28vw, ${LARGURA_ROTULOS}px) 1fr` }}>
            <div
              className="flex items-center border-b border-r border-ouro bg-folha px-3 text-[13px] text-apagado"
              title={DICAS_UI.visao}
            >
              Visão geral
            </div>
            <canvas
              ref={resumo}
              onClick={(e) => clicar(e, 'resumo')}
              className="block w-full cursor-pointer border-b border-ouro"
              style={{ height: ALTURA_RESUMO }}
              aria-label="Visão geral da música: clique para ir a esse ponto"
            />
            <div
              className="border-r border-ouro bg-folha"
              style={{ height: ALTURA_REGUA, gridColumn: 1, gridRow: 2 }}
            />
            <div className="relative row-span-1" style={{ gridColumn: 2, gridRow: '2 / span 2' }}>
              <canvas
                ref={tela}
                onClick={(e) => clicar(e, 'lanes')}
                className="block w-full cursor-pointer"
                style={{ height: ALTURA_REGUA + canais.length * linha }}
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
                    className={`relative grid content-center gap-1 border-b border-r border-ouro px-3 ${i % 2 ? 'bg-pergaminho-escuro' : 'bg-folha'}`}
                    style={{ height: linha, opacity: calado ? 0.55 : 1 }}
                  >
                    {(prog[s.canal] ?? 1) < 1 && (
                      <div
                        role="progressbar"
                        aria-label={`Carregando ${s.nome}`}
                        aria-valuenow={Math.round((prog[s.canal] ?? 0) * 100)}
                        className="absolute inset-x-0 bottom-0 h-1 bg-traco"
                      >
                        <div
                          className="h-full bg-ouro transition-[width]"
                          style={{ width: `${(prog[s.canal] ?? 0) * 100}%` }}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="size-3 shrink-0 rounded-sm" style={{ background: CORES[i % CORES.length] }} />
                      <span
                        className="truncate text-[14px] font-bold"
                        title={`${rotuloCanal(ch, s.programa ?? undefined)}. ${funcaoDe(s.programa, s.canal)}${papeis?.[String(s.canal)] ? ` Nesta faixa: ${papeis[String(s.canal)]}` : ''}`}
                      >
                        {s.nome}
                      </span>
                      <span className="ml-auto hidden truncate text-[12px] tabular-nums text-apagado lg:inline">
                        {ativas(ch)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={1.5}
                        step={0.05}
                        value={vol[ch] ?? 1}
                        aria-label={`Volume: ${s.nome}`}
                        title={DICAS_UI.volume}
                        onChange={(e) => setVol({ ...vol, [ch]: Number(e.target.value) })}
                        className="h-11 w-0 min-w-0 flex-1 accent-ouro sm:h-4"
                      />
                      <button
                        onClick={() => setMudo(alterna(mudo, ch))}
                        aria-pressed={mudo.has(ch)}
                        title={DICAS_UI.mudo}
                        className={`flex size-11 items-center justify-center rounded text-[12px] font-bold sm:size-7 ${mudo.has(ch) ? 'bg-erro text-white' : 'border border-ouro bg-folha'}`}
                      >
                        <Icone id="mudo" className="size-4 flex-none" aria-label="Mudo" />
                      </button>
                      <button
                        onClick={() => setSolo(alterna(solo, ch))}
                        aria-pressed={solo.has(ch)}
                        title={DICAS_UI.solo}
                        className={`flex size-11 items-center justify-center rounded text-[12px] font-bold sm:size-7 ${solo.has(ch) ? 'bg-ouro-claro text-tinta' : 'border border-ouro bg-folha'}`}
                      >
                        <Icone id="solo" className="size-4 flex-none" aria-label="Solo" />
                      </button>
                    </div>
                    {sfs && sfs.length > 1 && (
                      <select
                        aria-label={`Som de ${s.nome}`}
                        title={DICAS_UI.somInstrumento}
                        value={atrib[s.canal] ?? 0}
                        onChange={(e) => trocarCanal(s.canal, Number(e.target.value))}
                        className="h-11 w-full rounded border border-ouro bg-folha px-1 text-[13px] sm:h-7"
                      >
                        {sfs.map((sf, i) =>
                          i === 0 || disp[i]?.has(s.canal) ? (
                            <option key={sf.rotulo} value={i}>
                              {sf.rotulo}
                            </option>
                          ) : null,
                        )}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="m-0 border-t border-ouro bg-folha px-4 py-2 text-[13px] text-apagado">
            M silencia, S toca só aquele instrumento, espaço toca e pausa, clique nas notas ou na visão geral para ir a
            um ponto. Tratada é uma aproximação feita no navegador, não o arquivo do ffmpeg.
          </p>
        </>
      )}
      {descricao && <div className="grid gap-4 border-t border-ouro bg-folha px-4 py-4">{descricao}</div>}
    </section>
  );
}
