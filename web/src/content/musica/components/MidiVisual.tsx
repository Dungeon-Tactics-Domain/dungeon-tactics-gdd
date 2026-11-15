// Visual MIDI view of a track: a piano roll that follows the page's <audio>, plus which instruments play right now.
// It draws the notes of the .mid next to the rendered audio; it does not synthesise anything (no dependency, no soundfont).
import { useEffect, useRef, useState } from 'react';
import { lerMidi, nomeNota, cor, rotuloCanal, type Midi } from './midi';
import { relogio } from './relogio';

const JANELA = 14; // seconds on screen
const ALTURA = 240;

export function MidiVisual({ src }: { src: string }) {
  const [midi, setMidi] = useState<Midi | null>(null);
  const [erro, setErro] = useState(false);
  const [ocultos, setOcultos] = useState<Set<number>>(new Set());
  const [tocando, setTocando] = useState<Map<number, string[]>>(new Map());
  const tela = useRef<HTMLCanvasElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    fetch(src)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => vivo && setMidi(lerMidi(b)))
      .catch(() => vivo && setErro(true));
    return () => {
      vivo = false;
    };
  }, [src]);

  useEffect(() => {
    const c = tela.current;
    const audio = caixa.current?.closest('main, body')?.querySelector('audio');
    if (!midi || !c) return;
    const g = c.getContext('2d')!;
    const ps = midi.notas.map((n) => n.p);
    const pMin = Math.min(...ps) - 1;
    const pMax = Math.max(...ps) + 1;
    let raf = 0;
    let ultimo = '';
    const quadro = () => {
      const w = c.clientWidth;
      if (c.width !== w) c.width = w;
      c.height = ALTURA;
      const agora = relogio.atual?.() ?? audio?.currentTime ?? 0;
      // the playhead sits a quarter in; the loop length wraps nothing, the audio just restarts at 0
      const ini = Math.max(0, agora - JANELA * 0.25);
      const px = (t: number) => ((t - ini) / JANELA) * w;
      const py = (p: number) => ALTURA - ((p - pMin + 0.5) / (pMax - pMin + 1)) * ALTURA;
      const alt = Math.max(2, ALTURA / (pMax - pMin + 1) - 1);
      g.fillStyle = '#f7f1e3';
      g.fillRect(0, 0, w, ALTURA);
      const vivas = new Map<number, string[]>();
      for (const n of midi.notas) {
        if (n.fim < ini || n.t > ini + JANELA || ocultos.has(n.ch)) continue;
        const ativa = n.t <= agora && agora < n.fim;
        g.globalAlpha = ativa ? 1 : 0.55;
        g.fillStyle = cor(n.ch);
        g.fillRect(px(n.t), py(n.p) - alt / 2, Math.max(2, px(n.fim) - px(n.t)), alt);
        if (ativa) vivas.set(n.ch, [...(vivas.get(n.ch) ?? []), nomeNota(n.p)]);
      }
      g.globalAlpha = 1;
      g.fillStyle = '#222';
      g.fillRect(px(agora), 0, 2, ALTURA);
      const chave = [...vivas].map(([ch, v]) => `${ch}:${v.sort().join(',')}`).join('|');
      if (chave !== ultimo) {
        ultimo = chave;
        setTocando(vivas);
      }
      raf = requestAnimationFrame(quadro);
    };
    raf = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(raf);
  }, [midi, ocultos]);

  if (erro) return <p className="m-0 text-apagado">MIDI não disponível para esta faixa.</p>;
  if (!midi) return <p className="m-0 text-apagado">Carregando as notas…</p>;
  const canais = [...new Set(midi.notas.map((n) => n.ch))].sort((a, b) => a - b);
  const alternar = (ch: number) =>
    setOcultos((s) => {
      const novo = new Set(s);
      if (!novo.delete(ch)) novo.add(ch);
      return novo;
    });
  return (
    <div ref={caixa} className="grid gap-2">
      <canvas ref={tela} className="w-full border border-traco" style={{ height: ALTURA }} aria-hidden="true" />
      <p className="m-0 text-[15px] text-apagado">
        Notas do MIDI desta faixa, seguindo o áudio acima (a linha escura é o instante tocando). Desmarque um
        instrumento para ver o resto.
      </p>
      <ul className="m-0 grid list-none gap-1 p-0">
        {canais.map((ch) => (
          <li key={ch}>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={!ocultos.has(ch)} onChange={() => alternar(ch)} />
              <span className="inline-block size-3" style={{ background: cor(ch) }} />
              <span>{rotuloCanal(ch, midi.programas.get(ch))}</span>
              <span className="text-apagado">{tocando.get(ch)?.join(' ') ?? ''}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
