// The live version (a MIDI synthesizer instead of stems), with a recording fake voice. Real audio is not tested here:
// jsdom has no AudioWorklet, so SpessaSynth itself only runs in a browser.
import { describe, expect, it } from 'vitest';
import { FakeContext, fakeFetch } from './fake-audio';
import { PlayerEngine, type LiveVoice } from './PlayerEngine';
import type { Song } from './schema';

const song: Song = {
  id: 'battle-a',
  title: 'Embers in the Pass',
  category: 'battle',
  authorship: 'test',
  channels: [
    { channel: 0, program: 48, name: 'Strings' },
    { channel: 9, program: null, name: 'Drums' },
  ],
  versions: [
    { id: 'gm', label: 'MuseScore General', stemsBase: '/s/a', midi: '/m/a.mid', duration: 100 },
    { id: 'live', label: 'Live', stemsBase: '/s/a', midi: '/m/a.mid', duration: 100, live: { soundfont: '/sf/a.sf2' } },
  ],
  references: [],
  measurements: [],
  checks: [],
};
const files = { '/s/a/0.ogg': 100, '/s/a/9.ogg': 100 };

function setup(failLoad = false) {
  const log: string[] = [];
  const gains = new Map<number, number>();
  const voice: LiveVoice = {
    load: async (midi, sf) => {
      log.push(`load ${midi} ${sf}`);
      if (failLoad) throw new Error('no soundfont');
    },
    start: (p) => log.push(`start ${p}`),
    stop: () => log.push('stop'),
    setGain: (c, g) => gains.set(c, g),
    dispose: () => log.push('dispose'),
  };
  const ctx = new FakeContext();
  const frames: (() => void)[] = [];
  const engine = new PlayerEngine({
    context: ctx.asContext(),
    fetch: fakeFetch(files).fetch,
    requestFrame: (cb) => {
      frames.push(cb);
      return () => undefined;
    },
    live: () => voice,
  });
  return { ctx, engine, log, gains, frames };
}

describe('PlayerEngine live version', () => {
  it('loads the MIDI and the SoundFont instead of stems, and reports ready', async () => {
    const { engine, log, ctx } = setup();
    await engine.setSong(song, 'live');
    expect(log).toEqual(['load /m/a.mid /sf/a.sf2']);
    expect(engine.stemStatus(0)).toBe('ready');
    await engine.play();
    expect(log.at(-1)).toBe('start 0');
    expect(ctx.sources).toHaveLength(0); // no stem was fetched or played
  });

  it('reports an error status when the SoundFont cannot load', async () => {
    const { engine } = setup(true);
    const errors: unknown[] = [];
    engine.on('error', (e) => errors.push(e.error));
    await engine.setSong(song, 'live');
    expect(engine.stemStatus(0)).toBe('error');
    expect(errors).toHaveLength(1);
  });

  it('pushes mute, solo and volume as the channel gain', async () => {
    const { engine, gains } = setup();
    await engine.setSong(song, 'live');
    await engine.play();
    engine.setVolume(0, 0.5);
    engine.setSoloed(9, true);
    expect([gains.get(0), gains.get(9)]).toEqual([0, 1]);
    engine.setSoloed(9, false);
    engine.setMuted(9, true);
    expect([gains.get(0), gains.get(9)]).toEqual([0.5, 0]);
  });

  it('seeks and pauses through the voice, and restarts it when the loop wraps', async () => {
    const { engine, log, ctx, frames } = setup();
    await engine.setSong(song, 'live');
    await engine.play();
    ctx.currentTime = 10;
    engine.seek(30);
    expect(log.at(-1)).toBe('start 30');
    ctx.currentTime = 10 + 71; // 30 + 71 = 101 s: wrapped to 1 s
    frames.shift()!();
    expect(log.at(-1)).toBe('start 1');
    engine.pause();
    expect(log.at(-1)).toBe('stop');
  });

  it('switches between stems and live while playing, keeping the position', async () => {
    const { engine, log, ctx } = setup();
    await engine.setSong(song, 'gm');
    await engine.play();
    ctx.currentTime = 20;
    engine.setVersion('live');
    expect(engine.version?.id).toBe('live');
    expect(ctx.live()).toHaveLength(0); // the stems stopped
    await new Promise((r) => setTimeout(r, 0)); // the voice was not loaded yet: it joins at the clock's position when it is
    expect(Number(log.at(-1)?.replace('start ', ''))).toBeCloseTo(20, 1);
    engine.setVersion('gm');
    expect(log.at(-1)).toBe('stop');
    expect(ctx.live().length).toBeGreaterThan(0);
  });

  it('keeps channels out of the live version and the live version out of the channels', async () => {
    const { engine } = setup();
    await engine.setSong(song, 'gm');
    engine.setChannelVersion(0, 'live');
    expect(engine.versionOf(0)?.id).toBe('gm');
    await engine.setSong(song, 'live');
    engine.setChannelVersion(0, 'gm');
    expect(engine.versionOf(0)?.id).toBe('live');
  });

  it('loads the MIDI again when the listener returns to a song, since the voice holds one MIDI at a time', async () => {
    const { engine, log } = setup();
    const other: Song = {
      ...song,
      id: 'battle-b',
      versions: [{ ...song.versions[1]!, midi: '/m/b.mid' }],
    };
    await engine.setSong(song, 'live');
    await engine.setSong(other, 'live');
    await engine.setSong(song, 'live');
    expect(log.filter((l) => l.startsWith('load'))).toEqual([
      'load /m/a.mid /sf/a.sf2',
      'load /m/b.mid /sf/a.sf2',
      'load /m/a.mid /sf/a.sf2',
    ]);
    expect(engine.stemStatus(0)).toBe('ready');
  });

  it('disposes the voice with the engine', async () => {
    const { engine, log } = setup();
    await engine.setSong(song, 'live');
    engine.dispose();
    expect(log.at(-1)).toBe('dispose');
  });
});
