// Minimal Standard MIDI File reader: notes in seconds (tempo map applied), the first tempo and the program of each channel.
export interface Nota {
  t: number;
  fim: number;
  p: number;
  ch: number;
}
export interface Midi {
  notas: Nota[];
  bpm: number;
  programas: Map<number, number>;
  duracao: number;
}

// General MIDI families, by program >> 3
export const FAMILIAS = [
  'Piano', 'Percussão melódica', 'Órgão', 'Violão/guitarra', 'Baixo', 'Cordas', 'Conjunto de cordas', 'Metais',
  'Palhetas', 'Flautas', 'Lead', 'Pad', 'Efeitos', 'Étnicos', 'Percussão', 'Efeitos sonoros',
]; // prettier-ignore
export const NOMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const nomeNota = (p: number) => `${NOMES[p % 12]}${Math.floor(p / 12) - 1}`;
export const cor = (ch: number) => `hsl(${(ch * 47) % 360} 65% 42%)`;
export const rotuloCanal = (ch: number, prog?: number) =>
  ch === 9 ? 'Bateria' : prog === undefined ? `Canal ${ch + 1}` : `${FAMILIAS[prog >> 3]} (programa ${prog})`;

export function lerMidi(buf: ArrayBuffer): Midi {
  const d = new DataView(buf);
  const u32 = (o: number) => d.getUint32(o);
  const ppq = d.getUint16(12);
  const ntrk = d.getUint16(10);
  const tempos: [number, number][] = [[0, 500000]];
  const brutas: { tick: number; p: number; ch: number; on: boolean }[] = [];
  const programas = new Map<number, number>();
  let o = 14;
  for (let k = 0; k < ntrk; k++) {
    const fimTrk = o + 8 + u32(o + 4);
    o += 8;
    let tick = 0;
    let status = 0;
    while (o < fimTrk) {
      let delta = 0;
      let b: number;
      do {
        b = d.getUint8(o++);
        delta = (delta << 7) | (b & 0x7f);
      } while (b & 0x80);
      tick += delta;
      if (d.getUint8(o) & 0x80) status = d.getUint8(o++);
      if (status === 0xff) {
        const tipo = d.getUint8(o++);
        let len = 0;
        do {
          b = d.getUint8(o++);
          len = (len << 7) | (b & 0x7f);
        } while (b & 0x80);
        if (tipo === 0x51) tempos.push([tick, (d.getUint8(o) << 16) | (d.getUint8(o + 1) << 8) | d.getUint8(o + 2)]);
        o += len;
      } else if (status === 0xf0 || status === 0xf7) {
        let len = 0;
        do {
          b = d.getUint8(o++);
          len = (len << 7) | (b & 0x7f);
        } while (b & 0x80);
        o += len;
      } else {
        const tipo = status & 0xf0;
        const ch = status & 15;
        const a = d.getUint8(o++);
        const v = tipo === 0xc0 || tipo === 0xd0 ? 0 : d.getUint8(o++);
        if (tipo === 0xc0 && !programas.has(ch)) programas.set(ch, a);
        if (tipo === 0x90 || tipo === 0x80) brutas.push({ tick, p: a, ch, on: tipo === 0x90 && v > 0 });
      }
    }
    o = fimTrk;
  }
  tempos.sort((x, y) => x[0] - y[0]);
  const seg = (tick: number) => {
    let s = 0;
    let [ult, us] = tempos[0]!;
    for (const [tk, novo] of tempos.slice(1)) {
      if (tk >= tick) break;
      s += ((tk - ult) * us) / ppq / 1e6;
      [ult, us] = [tk, novo];
    }
    return s + ((tick - ult) * us) / ppq / 1e6;
  };
  brutas.sort((x, y) => x.tick - y.tick || Number(x.on) - Number(y.on));
  const abertas = new Map<number, number>(); // ch*128+pitch -> start in seconds
  const notas: Nota[] = [];
  for (const e of brutas) {
    const chave = e.ch * 128 + e.p;
    if (e.on) abertas.set(chave, seg(e.tick));
    else if (abertas.has(chave)) {
      notas.push({ t: abertas.get(chave)!, fim: seg(e.tick), p: e.p, ch: e.ch });
      abertas.delete(chave);
    }
  }
  const inicial = tempos.filter((x) => x[0] === 0).pop()![1]; // the last tempo set at tick 0 wins over the default
  return { notas, bpm: 6e7 / inicial, programas, duracao: Math.max(0, ...notas.map((n) => n.fim)) };
}
