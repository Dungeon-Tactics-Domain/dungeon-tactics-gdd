import { describe, expect, it } from 'vitest';
import type { Song } from './schema';
import { PlayerEngine, type PlayerEvents } from './PlayerEngine';
import { FakeBiquad, FakeCompressor, FakeContext, FakeGain, type FakeNode, fakeFetch } from './fake-audio';

const song: Song = {
  id: 'battle-a',
  title: 'Embers in the Pass',
  category: 'battle',
  authorship: 'test',
  channels: [
    { channel: 0, program: 48, name: 'Strings' },
    { channel: 1, program: 43, name: 'Contrabass' },
    { channel: 9, program: null, name: 'Drums' },
  ],
  versions: [
    { id: 'gm', label: 'MuseScore General', stemsBase: '/s/a', midi: '/m/a.mid', duration: 100 },
    { id: 'sc88p', label: 'SC-88Pro', stemsBase: '/s/a_sc88p/', midi: '/m/a.mid', duration: 100 },
    {
      id: 'tfg',
      label: 'TFG',
      stemsBase: '/s/a_tfg',
      midi: '/m/a_tfg.mid',
      duration: 100,
      // no General MIDI drum kit: the drums live on melodic channels
      channels: [
        { channel: 0, program: 6, name: 'Strings' },
        { channel: 1, program: 5, name: 'Celli' },
        { channel: 7, program: 22, name: 'Snare' },
      ],
    },
    { id: 'short', label: 'Short tail', stemsBase: '/s/a_short', midi: '/m/a.mid', duration: 90 },
  ],
  references: [],
  measurements: [],
  checks: [],
};

const files = {
  '/s/a/0.ogg': 100,
  '/s/a/1.ogg': 100,
  '/s/a/9.ogg': 100,
  '/s/a_sc88p/0.ogg': 100,
  '/s/a_sc88p/1.ogg': 100,
  '/s/a_sc88p/9.ogg': 100,
  '/s/a_tfg/0.ogg': 100,
  '/s/a_tfg/1.ogg': 100,
  '/s/a_tfg/7.ogg': 100,
  '/s/a_short/0.ogg': 90,
  '/s/a_short/1.ogg': 88, // shorter than its version's loop: must be padded
  '/s/a_short/9.ogg': 90,
};

async function setup(versionId?: string) {
  const ctx = new FakeContext();
  const net = fakeFetch(files);
  const frames: (() => void)[] = [];
  const engine = new PlayerEngine({
    context: ctx.asContext(),
    fetch: net.fetch,
    requestFrame: (cb) => {
      frames.push(cb);
      return () => undefined;
    },
  });
  await engine.setSong(song, versionId);
  return { ctx, net, engine, frames };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('PlayerEngine mixer', () => {
  it('solo is exclusive, several channels can be soloed and mute wins', async () => {
    const { engine } = await setup();
    engine.setVolume(1, 0.5);
    expect([0, 1, 9].map((c) => engine.effectiveGain(c))).toEqual([1, 0.5, 1]);
    engine.setSoloed(1, true);
    expect([0, 1, 9].map((c) => engine.effectiveGain(c))).toEqual([0, 0.5, 0]);
    engine.setSoloed(9, true);
    expect([0, 1, 9].map((c) => engine.effectiveGain(c))).toEqual([0, 0.5, 1]);
    engine.setMuted(9, true);
    expect([0, 1, 9].map((c) => engine.effectiveGain(c))).toEqual([0, 0.5, 0]);
    engine.setSoloed(1, false);
    engine.setSoloed(9, false);
    engine.setMuted(9, false);
    expect([0, 1, 9].map((c) => engine.effectiveGain(c))).toEqual([1, 0.5, 1]);
  });

  it('writes the effective gain into the gain node each stem plays through', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    engine.setMuted(0, true);
    engine.setSoloed(9, true);
    // sources start in lane order (channels 0, 1, 9), each into its own gain
    expect(ctx.live().map((s) => (s.outputs[0] as FakeGain).gain.value)).toEqual([0, 0, 1]);
  });
});

describe('PlayerEngine treatment', () => {
  const path = (from: FakeNode): string[] => {
    const out: string[] = [];
    let n: FakeNode | undefined = from;
    while (n) {
      out.push(n.kind);
      n = n.outputs[0];
    }
    return out;
  };

  it('routes master straight to the output when off and through the filter chain when on', async () => {
    const { ctx, engine } = await setup();
    const master = ctx.gains[0]!;
    expect(path(master)).toEqual(['gain', 'destination']);
    engine.setTreated(true);
    expect(path(master)).toEqual(['gain', 'biquad', 'biquad', 'compressor', 'gain', 'compressor', 'destination']);
    let n = master.outputs[0] as FakeBiquad;
    expect([n.type, n.frequency.value]).toEqual(['highpass', 32]);
    n = n.outputs[0] as FakeBiquad;
    expect([n.type, n.frequency.value, n.gain.value]).toEqual(['highshelf', 2500, -6]);
    const comp = n.outputs[0] as FakeCompressor;
    expect([comp.threshold.value, comp.ratio.value, comp.attack.value, comp.release.value]).toEqual([
      -22, 3.5, 0.004, 0.12,
    ]);
    const makeup = comp.outputs[0] as FakeGain;
    expect(makeup.gain.value).toBe(1.4);
    const ceiling = makeup.outputs[0] as FakeCompressor;
    expect([ceiling.threshold.value, ceiling.ratio.value, ceiling.attack.value, ceiling.release.value]).toEqual([
      -3, 20, 0.001, 0.05,
    ]);
    engine.setTreated(false);
    expect(path(master)).toEqual(['gain', 'destination']);
  });

  it('keeps the mixer working in both modes', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    engine.setMuted(1, true);
    const channelGains = () => ctx.live().map((s) => (s.outputs[0] as FakeGain).gain.value);
    const before = channelGains();
    engine.setTreated(true);
    expect(channelGains()).toEqual(before);
    expect(before).toEqual([1, 0, 1]);
    // every channel gain still feeds the master
    for (const s of ctx.live()) expect(s.outputs[0]!.outputs[0]).toBe(ctx.gains[0]);
  });
});

describe('PlayerEngine transport', () => {
  it('starts every stem on the same tick at the same offset, with one loop length', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    const live = ctx.live();
    expect(live).toHaveLength(3);
    expect(new Set(live.map((s) => s.started!.when)).size).toBe(1);
    expect(live.every((s) => s.started!.offset === 0 && s.loop && s.loopEnd === 100)).toBe(true);
  });

  it('wraps the position at the loop end, and stops at the end when the loop is off', async () => {
    const { ctx, engine, frames } = await setup();
    await engine.play();
    ctx.currentTime = 0.05 + 130;
    expect(engine.position).toBeCloseTo(30);
    engine.setLoop(false);
    expect(ctx.live().every((s) => !s.loop)).toBe(true);
    expect(engine.position).toBeCloseTo(100);
    frames.at(-1)!();
    expect(engine.state).toBe('paused');
    expect(engine.position).toBe(0);
  });

  it('pauses and resumes at the same point, and seeks', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    ctx.currentTime = 0.05 + 12;
    engine.pause();
    expect(ctx.live()).toHaveLength(0);
    ctx.currentTime = 50;
    expect(engine.position).toBeCloseTo(12);
    await engine.play();
    expect(ctx.live().map((s) => s.started!.offset)).toEqual([12, 12, 12].map((x) => expect.closeTo(x, 6)));
    engine.seek(40);
    expect(ctx.live().map((s) => s.started!.offset)).toEqual([40, 40, 40].map((x) => expect.closeTo(x, 6)));
  });
});

describe('PlayerEngine versions', () => {
  it('A/B keeps the position and swaps each stem on a scheduled tick', async () => {
    const { ctx, engine, net } = await setup();
    await engine.play();
    ctx.currentTime = 0.05 + 42;
    const old = ctx.live();
    await engine.setVersion('sc88p');
    await flush();
    await flush();
    expect(engine.version?.id).toBe('sc88p');
    expect(engine.position).toBeCloseTo(42);
    const fresh = ctx.live();
    expect(fresh).toHaveLength(3);
    for (const s of fresh) {
      expect(s.started!.when).toBeCloseTo(ctx.currentTime + 0.05);
      expect(s.started!.offset).toBeCloseTo(42.05); // the position at the tick it starts on
    }
    // the old stems end exactly where the new ones begin
    for (const s of old) expect(s.stoppedAt).toBeCloseTo(ctx.currentTime + 0.05);
    expect(net.requested.filter((u) => u.startsWith('/s/a_sc88p/'))).toHaveLength(3);
  });

  it('A/B to a shorter version keeps the same seconds, wrapped to its loop', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    ctx.currentTime = 0.05 + 95;
    await engine.setVersion('short');
    expect(engine.position).toBeCloseTo(5);
    engine.pause();
    await engine.setVersion('gm');
    expect(engine.position).toBeCloseTo(5);
  });

  it('A/B while paused moves the stored position only', async () => {
    const { engine, ctx } = await setup();
    engine.seek(30);
    await engine.setVersion('sc88p');
    expect(engine.position).toBe(30);
    expect(ctx.live()).toHaveLength(0);
  });

  it('switching to a version with other channels changes the lanes and stops the missing ones', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    const drums = ctx.live()[2]!;
    await engine.setVersion('tfg');
    expect(engine.channels.map((c) => c.channel)).toEqual([0, 1, 7]);
    expect(drums.stoppedAt).toBeDefined();
  });

  it('pads a stem shorter than the loop so no stem drifts', async () => {
    const { ctx, engine } = await setup('short');
    await engine.play();
    const live = ctx.live();
    expect(live.map((s) => s.loopEnd)).toEqual([90, 90, 90]);
    expect(live.map((s) => s.buffer!.duration)).toEqual([90, 90, 90]);
    expect(live[1]!.buffer!.copied).toBe(true);
  });

  it('plays one channel from another version, falling back when that version lacks the channel', async () => {
    const { ctx, engine, net } = await setup();
    engine.setChannelVersion(1, 'tfg');
    engine.setChannelVersion(9, 'tfg'); // tfg has no channel 9
    await flush();
    await flush();
    expect(engine.versionOf(1)?.id).toBe('tfg');
    expect(engine.versionOf(9)?.id).toBe('gm');
    expect(net.requested).toContain('/s/a_tfg/1.ogg');
    expect(net.requested).not.toContain('/s/a_tfg/9.ogg');
    await engine.play();
    expect(ctx.live()).toHaveLength(3);
    engine.setChannelVersion(1, null);
    expect(engine.versionOf(1)?.id).toBe('gm');
  });

  it('a new version drops the per-channel choices, or keeps the ones that still apply when asked', async () => {
    const { engine } = await setup();
    expect(engine.hasChannelVersions).toBe(false);
    engine.setChannelVersion(9, 'tfg'); // no effect: tfg has no channel 9
    expect(engine.hasChannelVersions).toBe(false);
    engine.setChannelVersion(0, 'sc88p');
    engine.setChannelVersion(1, 'short');
    engine.setChannelVersion(9, 'short');
    expect(engine.hasChannelVersions).toBe(true);

    await engine.setVersion('sc88p', { keepChannels: true });
    expect(engine.version?.id).toBe('sc88p');
    expect(engine.versionOf(0)?.id).toBe('sc88p'); // its choice became the version itself
    expect(engine.versionOf(1)?.id).toBe('short');
    expect(engine.versionOf(9)?.id).toBe('short');

    // tfg has no channel 9, so that choice goes; coming back, channel 9 follows the version again
    await engine.setVersion('tfg', { keepChannels: true });
    expect(engine.versionOf(1)?.id).toBe('short');
    await engine.setVersion('gm', { keepChannels: true });
    expect(engine.versionOf(0)?.id).toBe('gm'); // was dropped when it matched sc88p
    expect(engine.versionOf(1)?.id).toBe('short');
    expect(engine.versionOf(9)?.id).toBe('gm');

    await engine.setVersion('sc88p');
    expect(engine.hasChannelVersions).toBe(false);
    expect(engine.versionOf(1)?.id).toBe('sc88p');
  });

  it('keeping the choices while playing leaves every lane sounding from its own version', async () => {
    const { ctx, engine } = await setup();
    engine.setChannelVersion(1, 'short');
    await engine.play();
    await engine.setVersion('sc88p', { keepChannels: true });
    await flush();
    expect(engine.versionOf(1)?.id).toBe('short');
    expect(ctx.live()).toHaveLength(3);
  });
});

describe('PlayerEngine events', () => {
  it('reports progress, state and errors', async () => {
    const ctx = new FakeContext();
    const net = fakeFetch({ '/s/a/0.ogg': 100, '/s/a/1.ogg': 100 }); // 9.ogg missing
    const engine = new PlayerEngine({
      context: ctx.asContext(),
      fetch: net.fetch,
      requestFrame: () => () => undefined,
    });
    const seen: { [K in keyof PlayerEvents]: PlayerEvents[K][] } = {
      time: [],
      state: [],
      progress: [],
      error: [],
      change: [],
    };
    engine.on('progress', (e) => seen.progress.push(e));
    engine.on('error', (e) => seen.error.push(e));
    engine.on('state', (e) => seen.state.push(e));
    await engine.setSong(song);
    expect(seen.progress.filter((p) => p.loaded === 1).map((p) => p.channel)).toEqual([0, 1]);
    expect(seen.error).toHaveLength(1);
    expect(seen.error[0]).toMatchObject({ versionId: 'gm', channel: 9 });
    expect([0, 9].map((c) => engine.stemStatus(c))).toEqual(['ready', 'error']);
    await engine.play();
    expect(ctx.live()).toHaveLength(2); // the missing stem never blocks the others
    expect(seen.state.map((s) => s.state)).toEqual(['playing']);
  });
});

describe('PlayerEngine change event', () => {
  it('fires on every setter and on a seek while paused, so shared views redraw', async () => {
    const { engine } = await setup();
    let n = 0;
    engine.on('change', () => n++);
    const calls: (() => void)[] = [
      () => engine.setMuted(0, true),
      () => engine.setSoloed(1, true),
      () => engine.setVolume(0, 0.5),
      () => engine.setMasterVolume(0.8),
      () => engine.setTreated(true),
      () => engine.setLoop(false),
      () => engine.seek(12),
      () => engine.setVersion('sc88p'),
      () => engine.setChannelVersion(0, 'gm'),
    ];
    for (const call of calls) {
      const before = n;
      call();
      expect(n).toBeGreaterThan(before);
    }
  });
});

describe('PlayerEngine regressions', () => {
  it('a solo on a channel the new version lacks does not silence every lane', async () => {
    const { ctx, engine } = await setup();
    await engine.play();
    engine.setSoloed(9, true);
    expect([0, 1].map((c) => engine.effectiveGain(c))).toEqual([0, 0]);
    await engine.setVersion('tfg'); // tfg has no channel 9
    await flush();
    await flush();
    expect([0, 1, 7].map((c) => engine.effectiveGain(c))).toEqual([1, 1, 1]);
    expect(ctx.live().map((s) => (s.outputs[0] as FakeGain).gain.value)).toEqual([1, 1, 1]);
  });

  it('a new song starts with a fresh mixer', async () => {
    const { engine } = await setup();
    engine.setMuted(0, true);
    engine.setSoloed(1, true);
    engine.setVolume(9, 0.2);
    await engine.setSong(song);
    expect([0, 1, 9].map((c) => engine.effectiveGain(c))).toEqual([1, 1, 1]);
  });

  it('does not copy a stem that is short of the loop by resampling rounding only', async () => {
    const ctx = new FakeContext();
    const net = fakeFetch({ '/s/a/0.ogg': 99.9999, '/s/a/1.ogg': 100, '/s/a/9.ogg': 100 });
    const engine = new PlayerEngine({
      context: ctx.asContext(),
      fetch: net.fetch,
      requestFrame: () => () => undefined,
    });
    await engine.setSong(song);
    await engine.play();
    expect(ctx.live()[0]!.buffer!.duration).toBe(99.9999);
  });

  it('reuses the padded copy of a short stem on the next start', async () => {
    const { ctx, engine } = await setup('short');
    await engine.play();
    const padded = ctx.live()[1]!.buffer;
    engine.seek(10);
    expect(ctx.live()[1]!.buffer).toBe(padded);
  });

  it('sets the master volume on the master gain and ignores a second play while the first waits', async () => {
    const { ctx, engine, frames } = await setup();
    engine.setMasterVolume(0.7);
    expect(ctx.gains[0]!.gain.value).toBe(0.7);
    expect(engine.masterVolume).toBe(0.7);
    await Promise.all([engine.play(), engine.play()]);
    expect(ctx.live()).toHaveLength(3);
    expect(frames).toHaveLength(1);
  });

  it('another song with the same version ids plays its own stems', async () => {
    // every song of the lab names its versions alike ('sc88p', 'musescore'): the id alone does not tell stems apart
    const other: Song = {
      ...song,
      id: 'battle-b',
      versions: [{ id: 'gm', label: 'MuseScore General', stemsBase: '/s/b', midi: '/m/b.mid', duration: 50 }],
    };
    const ctx = new FakeContext();
    const net = fakeFetch({ ...files, '/s/b/0.ogg': 50, '/s/b/1.ogg': 50, '/s/b/9.ogg': 50 });
    const engine = new PlayerEngine({
      context: ctx.asContext(),
      fetch: net.fetch,
      requestFrame: () => () => undefined,
    });
    await engine.setSong(song);
    await engine.setSong(other);
    expect(net.requested.filter((u) => u.startsWith('/s/b/'))).toEqual(['/s/b/0.ogg', '/s/b/1.ogg', '/s/b/9.ogg']);
    await engine.play();
    expect(ctx.live().map((s) => s.buffer?.duration)).toEqual([50, 50, 50]);
  });

  // a second song whose stems wait behind a gate, so a test decides when (and whether) they arrive
  const gated = (extra: Record<string, number> = {}) => {
    const other: Song = {
      ...song,
      id: 'battle-b',
      versions: [{ id: 'gm', label: 'MuseScore General', stemsBase: '/s/b', midi: '/m/b.mid', duration: 50 }],
    };
    const ctx = new FakeContext();
    const net = fakeFetch({ ...files, '/s/b/0.ogg': 50, '/s/b/1.ogg': 50, '/s/b/9.ogg': 50, ...extra });
    let open!: () => void;
    const gate = new Promise<void>((r) => (open = r));
    const engine = new PlayerEngine({
      context: ctx.asContext(),
      fetch: async (...a: Parameters<typeof net.fetch>) => {
        if (String(a[0]).startsWith('/s/b/')) await gate;
        return net.fetch(...a);
      },
      requestFrame: () => () => undefined,
    });
    return { other, ctx, engine, open: () => open() };
  };

  it('another song pauses the one on stage at once, takes the screen and plays by itself when loaded', async () => {
    const { other, ctx, engine, open } = gated();
    await engine.setSong(song);
    await engine.play();
    const switching = engine.setSong(other, undefined, { play: true });
    // before anything is downloaded: the old song is silent and the new one is on stage
    expect(engine.song).toBe(other);
    expect(engine.state).toBe('idle');
    expect(engine.position).toBe(0);
    expect(ctx.live()).toHaveLength(0);
    await flush();
    expect(engine.loading).toBe(true);
    expect(engine.loadProgress).toEqual({ done: 0, total: 3, fraction: 0 });
    open();
    await switching;
    expect(engine.loading).toBe(false);
    expect(engine.loadProgress).toEqual({ done: 3, total: 3, fraction: 1 });
    expect(engine.state).toBe('playing');
    expect(ctx.live().map((s) => s.buffer?.duration)).toEqual([50, 50, 50]); // all three lanes start together
  });

  it('plays by itself even when the song before was stopped, and stays stopped when not asked to play', async () => {
    const { other, engine, open } = gated();
    open();
    await engine.setSong(song);
    expect(engine.state).toBe('idle'); // the first song of a visit, or one opened from a link
    await engine.setSong(other, undefined, { play: true });
    expect(engine.state).toBe('playing');
  });

  it('never plays a song whose request was overtaken while it loaded', async () => {
    const { other, ctx, engine, open } = gated();
    const overtaken = engine.setSong(other, undefined, { play: true });
    await flush();
    const latest = engine.setSong(song, 'sc88p', { play: true });
    await latest;
    expect(engine.loading).toBe(false); // the overtaken download goes on but holds nothing
    open();
    await Promise.all([overtaken, latest]);
    expect(engine.song).toBe(song);
    expect(engine.state).toBe('playing');
    expect(ctx.live().map((s) => s.buffer?.duration)).toEqual([100, 100, 100]); // only the latest song sounds
  });

  it('does not play a song with an instrument that failed to load', async () => {
    const { other, ctx, engine, open } = gated({ '/s/b/9.ogg': undefined as unknown as number });
    open();
    await engine.setSong(other, undefined, { play: true });
    expect(engine.stemStatus(9)).toBe('error');
    expect(engine.state).toBe('idle');
    expect(ctx.live()).toHaveLength(0);
  });

  it('counts the stems of the version being loaded, not of the one on stage', async () => {
    const { engine } = gated();
    await engine.setSong(song, 'gm');
    expect(engine.loadProgress).toEqual({ done: 3, total: 3, fraction: 1 });
    const seen: number[] = [];
    engine.on('progress', () => seen.push(engine.loadProgress.done));
    await engine.setVersion('tfg');
    expect(seen[0]).toBe(0); // the first stem of the other version starts from none ready
    expect(engine.loadProgress).toEqual({ done: 3, total: 3, fraction: 1 });
  });
});
