// Headless player for pre-rendered stems: one audio file per MIDI channel and per version, all started on the same
// audio-clock tick so they play as one mix. The host injects the AudioContext (shared with its own audio, or a fake in
// tests) and may inject fetch and the frame scheduler. A version with `live` set is not played from stems but by a
// LiveVoice (a MIDI synthesizer) the host provides; the engine keeps the clock, the loop and the mixer for both.
import type { Channel, Song, Version } from './schema';

export type PlayerState = 'idle' | 'playing' | 'paused';

export interface PlayerEvents {
  /** position in seconds, once per frame while playing */
  time: { position: number };
  state: { state: PlayerState };
  /** share of one stem downloaded, 0..1 (1 = decoded and ready) */
  progress: { versionId: string; channel: number; loaded: number };
  error: { error: unknown; versionId: string; channel: number };
  /** song, version, mixer, loop, treatment or a seek changed: views sharing the engine redraw */
  change: object;
}

/** The part of the Web Audio API the engine uses, so a test can pass a fake. */
export type AudioContextLike = Pick<
  BaseAudioContext,
  | 'currentTime'
  | 'destination'
  | 'createGain'
  | 'createBiquadFilter'
  | 'createDynamicsCompressor'
  | 'createBufferSource'
  | 'createBuffer'
  | 'decodeAudioData'
> & { resume?: () => Promise<void> };

/** A live MIDI synthesizer playing the song's MIDI through a SoundFont; the engine drives it like a set of stems. */
export interface LiveVoice {
  /** fetches both files and gets them ready; resolves when the voice can start */
  load(midiUrl: string, soundfontUrl: string): Promise<void>;
  /** plays from `position` seconds, now */
  start(position: number): void;
  /** silences and stops */
  stop(): void;
  /** the channel's gain (1 = as written in the MIDI); 0 mutes it */
  setGain(channel: number, gain: number): void;
  dispose(): void;
}

export interface PlayerEngineOptions {
  context: AudioContextLike;
  fetch?: (url: string) => Promise<Response>;
  /** runs the callback on the next frame and returns a cancel function; drives the `time` event */
  requestFrame?: (callback: () => void) => () => void;
  /** makes the voice for versions with `live`, sounding into `output`; called once, when the first one is needed */
  live?: (output: AudioNode) => LiveVoice;
}

// every source starts this far ahead of now, so all stems (and a swapped one) land on the same scheduled tick
const START_LEAD = 0.05;

const defaultFrame = (cb: () => void) => {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(cb, 16);
  return () => clearTimeout(id);
};

const stopQuietly = (src: AudioBufferSourceNode | undefined, when?: number) => {
  try {
    src?.stop(when);
  } catch {
    /* already stopped */
  }
};

export class PlayerEngine {
  readonly #ctx: AudioContextLike;
  readonly #fetch: (url: string) => Promise<Response>;
  readonly #frame: (cb: () => void) => () => void;
  readonly #listeners = new Map<keyof PlayerEvents, Set<(e: never) => void>>();

  #song: Song | null = null;
  #version: Version | null = null;
  readonly #channelVersion = new Map<number, string>(); // channel -> version id, overriding the active version
  readonly #loading = new Map<string, Promise<AudioBuffer>>(); // `${versionId}:${channel}`
  readonly #ready = new Map<string, AudioBuffer>();
  readonly #failed = new Set<string>();
  readonly #padded = new WeakMap<AudioBuffer, { key: string; buffer: AudioBuffer }>(); // by loop length
  readonly #makeLive: PlayerEngineOptions['live'];
  #liveVoice: LiveVoice | undefined;
  readonly #liveLoading = new Map<string, Promise<void>>(); // `${midi}|${soundfont}`
  readonly #liveReady = new Set<string>();
  readonly #liveFailed = new Set<string>();
  readonly #sources = new Map<number, AudioBufferSourceNode>();
  readonly #gains = new Map<number, GainNode>();
  readonly #volume = new Map<number, number>();
  readonly #muted = new Set<number>();
  readonly #soloed = new Set<number>();
  readonly #master: GainNode;
  readonly #chain: AudioNode[];
  #treated = false;
  #loop = true;
  #state: PlayerState = 'idle';
  #startedAt = 0; // context time at which position 0 played
  #pausedAt = 0;
  #lastPosition = 0;
  #cancelFrame: (() => void) | undefined;

  constructor(options: PlayerEngineOptions) {
    this.#ctx = options.context;
    this.#fetch = options.fetch ?? ((url) => fetch(url));
    this.#frame = options.requestFrame ?? defaultFrame;
    this.#makeLive = options.live;
    const c = this.#ctx;
    this.#master = c.createGain();
    // "treated": an approximation in the browser of the offline ffmpeg treatment (highpass, softer highs, compression,
    // makeup gain, a ceiling). It changes the sound only; the stems and the mixer are the same in both modes.
    const highpass = c.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 32;
    const shelf = c.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 2500;
    shelf.gain.value = -6;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.12;
    const makeup = c.createGain();
    makeup.gain.value = 1.4; // about +3 dB: the stems sum near -17 LUFS, the treated files sit at -14
    const ceiling = c.createDynamicsCompressor();
    ceiling.threshold.value = -3;
    ceiling.ratio.value = 20;
    ceiling.attack.value = 0.001;
    ceiling.release.value = 0.05;
    this.#chain = [highpass, shelf, comp, makeup, ceiling];
    this.#route();
  }

  // ---- events

  on<K extends keyof PlayerEvents>(type: K, listener: (event: PlayerEvents[K]) => void): () => void {
    const set = this.#listeners.get(type) ?? new Set();
    set.add(listener as (e: never) => void);
    this.#listeners.set(type, set);
    return () => set.delete(listener as (e: never) => void);
  }

  #emit<K extends keyof PlayerEvents>(type: K, event: PlayerEvents[K]) {
    for (const l of this.#listeners.get(type) ?? []) (l as (e: PlayerEvents[K]) => void)(event);
  }

  #setState(state: PlayerState) {
    if (state === this.#state) return;
    this.#state = state;
    this.#emit('state', { state });
  }

  // ---- read-only state

  get state() {
    return this.#state;
  }
  get song() {
    return this.#song;
  }
  /** the version that sets the lanes, the loop length and the piano roll MIDI */
  get version() {
    return this.#version;
  }
  get treated() {
    return this.#treated;
  }
  get loop() {
    return this.#loop;
  }
  /** loop length in seconds: the active version's duration */
  get duration() {
    return this.#version?.duration ?? 0;
  }
  /** the lanes: the active version's channels */
  get channels(): Channel[] {
    return this.#version && this.#song ? this.#channelsOf(this.#version) : [];
  }
  get position() {
    return this.#state === 'playing' ? this.#positionAt(this.#ctx.currentTime) : this.#pausedAt;
  }
  /** the version a channel's stem comes from: its own choice when that version has the channel, else the active one */
  versionOf(channel: number): Version | undefined {
    if (this.#version?.live) return this.#version; // the synthesizer plays the whole song
    const id = this.#channelVersion.get(channel);
    const chosen = id === undefined ? undefined : this.#song?.versions.find((v) => v.id === id);
    return chosen && this.#channelsOf(chosen).some((c) => c.channel === channel)
      ? chosen
      : (this.#version ?? undefined);
  }
  /** whether the stem the channel plays now is decoded, still loading or failed */
  stemStatus(channel: number): 'ready' | 'loading' | 'error' {
    const v = this.versionOf(channel);
    if (v?.live) {
      const k = this.#liveKey(v);
      return this.#liveReady.has(k) ? 'ready' : this.#liveFailed.has(k) ? 'error' : 'loading';
    }
    const key = `${v?.id}:${channel}`;
    return this.#ready.has(key) ? 'ready' : this.#failed.has(key) ? 'error' : 'loading';
  }
  /** what the channel's gain is set to after volume, mute and solo */
  effectiveGain(channel: number) {
    // only a soloed lane counts: a solo left on a channel the active version lacks must not silence every lane
    const soloing = this.channels.some((c) => this.#soloed.has(c.channel));
    const silent = this.#muted.has(channel) || (soloing && !this.#soloed.has(channel));
    return silent ? 0 : (this.#volume.get(channel) ?? 1);
  }

  // ---- loading

  /**
   * Loads a song and starts downloading the stems of its version; resolves when every stem settled. The mixer (volume,
   * mute, solo, per-channel versions) starts fresh, since channel numbers mean other instruments in another song.
   */
  async setSong(song: Song, versionId?: string): Promise<void> {
    this.pause();
    this.#song = song;
    this.#version = song.versions.find((v) => v.id === versionId) ?? song.versions[0] ?? null;
    this.#channelVersion.clear();
    this.#volume.clear();
    this.#muted.clear();
    this.#soloed.clear();
    this.#applyGains();
    this.#pausedAt = 0;
    this.#setState('idle');
    this.#emit('change', {});
    await this.#loadLanes();
  }

  #liveKey(v: Version) {
    return `${v.midi}|${v.live!.soundfont}`;
  }

  // one shared load per MIDI and SoundFont; the voice itself is made on the first use
  #loadLive(v: Version): Promise<void> {
    const key = this.#liveKey(v);
    const known = this.#liveLoading.get(key);
    if (known) return known;
    if (!this.#makeLive) return Promise.reject(new Error('This player has no live synthesizer'));
    this.#liveVoice ??= this.#makeLive(this.#master);
    const p = this.#liveVoice.load(v.midi, v.live!.soundfont).then(
      () => {
        this.#liveReady.add(key);
        this.#liveFailed.delete(key);
        this.#emit('progress', { versionId: v.id, channel: -1, loaded: 1 });
      },
      (error: unknown) => {
        this.#liveLoading.delete(key); // let a later request retry
        this.#liveFailed.add(key);
        this.#emit('error', { error, versionId: v.id, channel: -1 });
        throw error;
      },
    );
    this.#liveLoading.set(key, p);
    return p;
  }

  #pushLiveGains() {
    if (this.#version?.live)
      for (const c of this.channels) this.#liveVoice?.setGain(c.channel, this.effectiveGain(c.channel));
  }

  // starts the voice at `position` now if it is loaded, else when it is (it joins in sync, since the clock is ours)
  #startLive(v: Version, position: number) {
    const go = (at: number) => {
      this.#pushLiveGains();
      this.#liveVoice!.start(at);
    };
    if (this.#liveReady.has(this.#liveKey(v))) return go(position);
    this.#loadLive(v).then(
      () => {
        if (this.#state === 'playing' && this.#version === v) go(this.position);
      },
      () => undefined, // reported through the error event
    );
  }

  async #loadLanes() {
    if (this.#version?.live) {
      await this.#loadLive(this.#version).catch(() => undefined);
      return;
    }
    await Promise.allSettled(this.channels.map((c) => this.#buffer(c.channel)));
  }

  #channelsOf(v: Version) {
    return v.channels ?? this.#song?.channels ?? [];
  }

  // one shared promise per stem, so a second request for it waits for the first download
  #buffer(channel: number): Promise<AudioBuffer> {
    const v = this.versionOf(channel)!;
    const key = `${v.id}:${channel}`;
    const known = this.#loading.get(key);
    if (known) return known;
    const p = this.#download(v, channel).then(
      (b) => {
        this.#ready.set(key, b);
        this.#failed.delete(key);
        this.#emit('progress', { versionId: v.id, channel, loaded: 1 });
        return b;
      },
      (error: unknown) => {
        this.#loading.delete(key); // let a later request retry
        this.#failed.add(key);
        this.#emit('error', { error, versionId: v.id, channel });
        throw error;
      },
    );
    this.#loading.set(key, p);
    return p;
  }

  async #download(v: Version, channel: number): Promise<AudioBuffer> {
    const url = `${v.stemsBase.replace(/\/$/, '')}/${channel}.ogg`;
    this.#emit('progress', { versionId: v.id, channel, loaded: 0 });
    const res = await this.#fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const total = Number(res.headers.get('content-length')) || 0;
    let data: ArrayBuffer;
    if (res.body && total) {
      // read in chunks to report progress; without a length (compressed response) progress jumps from 0 to 1
      const parts: Uint8Array[] = [];
      let read = 0;
      const reader = res.body.getReader();
      for (let r = await reader.read(); !r.done; r = await reader.read()) {
        parts.push(r.value);
        read += r.value.length;
        this.#emit('progress', { versionId: v.id, channel, loaded: Math.min(0.99, read / total) });
      }
      data = await new Blob(parts as BlobPart[]).arrayBuffer();
    } else data = await res.arrayBuffer();
    return this.#ctx.decodeAudioData(data);
  }

  // ---- transport

  async play(): Promise<void> {
    if (!this.#version || this.#state === 'playing') return;
    await this.#ctx.resume?.();
    // a second play() may have started while this one waited (the cast undoes narrowing from before the await)
    if ((this.#state as PlayerState) === 'playing') return;
    this.#restartAll(this.#pausedAt);
    this.#setState('playing');
    this.#tick();
  }

  pause() {
    if (this.#state !== 'playing') return;
    this.#pausedAt = this.position;
    this.#stopAll();
    this.#cancelFrame?.();
    this.#setState('paused');
  }

  seek(position: number) {
    const t = Math.max(0, Math.min(position, this.duration));
    if (this.#state === 'playing') this.#restartAll(t);
    else this.#pausedAt = t;
    this.#emit('change', {});
  }

  setLoop(on: boolean) {
    this.#loop = on;
    for (const s of this.#sources.values()) s.loop = on;
    this.#emit('change', {});
  }

  /**
   * A/B: switch the whole render to another version at the same position. The position stays in absolute seconds (wrapped
   * to the new loop when it is shorter): the versions share the MIDI timing and differ only in render tail.
   */
  setVersion(versionId: string) {
    const v = this.#song?.versions.find((x) => x.id === versionId);
    if (!v || v === this.#version) return;
    const pos = this.position;
    const wasLive = this.#version?.live;
    this.#version = v;
    this.#channelVersion.clear();
    const next = this.#wrap(pos);
    this.#applyGains(); // solo counts only on the new lanes
    if (this.#state === 'playing' && (v.live || wasLive)) {
      this.#restartAll(next); // the synthesizer and the stems do not swap one by one: start over on the new kind
    } else if (this.#state === 'playing') {
      const lanes = new Set(this.channels.map((c) => c.channel));
      for (const [ch, src] of this.#sources) {
        if (lanes.has(ch)) continue;
        stopQuietly(src);
        this.#sources.delete(ch);
      }
      this.#startedAt = this.#ctx.currentTime - next;
      // each lane keeps its old stem until the new one is ready, then swaps on a scheduled tick
      for (const c of this.channels) this.#swapIn(c.channel);
    } else this.#pausedAt = next;
    this.#emit('change', {});
    void this.#loadLanes();
  }

  /** Plays one channel from another version's stem (null returns it to the active version). */
  setChannelVersion(channel: number, versionId: string | null) {
    // the synthesizer plays the whole song, so a channel neither takes it nor leaves it
    if (this.#version?.live || this.#song?.versions.find((v) => v.id === versionId)?.live) return;
    if (versionId === null) this.#channelVersion.delete(channel);
    else this.#channelVersion.set(channel, versionId);
    if (this.#state === 'playing') this.#swapIn(channel);
    else void this.#buffer(channel).catch(() => undefined); // reported through the error event
    this.#emit('change', {});
  }

  // ---- mixer

  setMasterVolume(volume: number) {
    this.#master.gain.value = volume;
    this.#emit('change', {});
  }
  get masterVolume() {
    return this.#master.gain.value;
  }
  setVolume(channel: number, volume: number) {
    this.#volume.set(channel, volume);
    this.#applyGains();
  }
  setMuted(channel: number, muted: boolean) {
    if (muted) this.#muted.add(channel);
    else this.#muted.delete(channel);
    this.#applyGains();
  }
  /** Solo is exclusive: while any channel is soloed, only soloed channels sound. Several can be soloed; mute wins. */
  setSoloed(channel: number, soloed: boolean) {
    if (soloed) this.#soloed.add(channel);
    else this.#soloed.delete(channel);
    this.#applyGains();
  }
  /** the channel's own volume, before mute and solo */
  volumeOf(channel: number) {
    return this.#volume.get(channel) ?? 1;
  }
  isMuted(channel: number) {
    return this.#muted.has(channel);
  }
  isSoloed(channel: number) {
    return this.#soloed.has(channel);
  }

  setTreated(on: boolean) {
    this.#treated = on;
    this.#route();
    this.#emit('change', {});
  }

  /** Stops playback and detaches from the context. The context belongs to the host, so it is not closed. */
  dispose() {
    this.pause();
    this.#master.disconnect();
    this.#chain.forEach((n) => n.disconnect());
    for (const g of this.#gains.values()) g.disconnect();
    this.#liveVoice?.dispose();
    this.#listeners.clear();
  }

  // ---- internals

  #route() {
    this.#master.disconnect();
    this.#chain.forEach((n) => n.disconnect());
    if (!this.#treated) {
      this.#master.connect(this.#ctx.destination);
      return;
    }
    let node: AudioNode = this.#master;
    for (const next of this.#chain) node = node.connect(next);
    node.connect(this.#ctx.destination);
  }

  #applyGains() {
    for (const [ch, g] of this.#gains) g.gain.value = this.effectiveGain(ch);
    this.#pushLiveGains();
    this.#emit('change', {});
  }

  #gain(channel: number) {
    let g = this.#gains.get(channel);
    if (!g) {
      g = this.#ctx.createGain();
      g.gain.value = this.effectiveGain(channel);
      g.connect(this.#master);
      this.#gains.set(channel, g);
    }
    return g;
  }

  #wrap(t: number) {
    const len = this.duration;
    if (len <= 0) return 0;
    return this.#loop ? ((t % len) + len) % len : Math.min(t, len);
  }

  #positionAt(when: number) {
    return this.#wrap(when - this.#startedAt);
  }

  #restartAll(from: number) {
    this.#stopAll();
    this.#lastPosition = from;
    const live = this.#version?.live;
    // the synthesizer starts at once, so the clock has no lead for it; the stems start on a scheduled tick
    this.#startedAt = this.#ctx.currentTime + (live ? 0 : START_LEAD) - from;
    if (live) return this.#startLive(this.#version!, from);
    for (const c of this.channels) this.#swapIn(c.channel);
  }

  #stopAll() {
    this.#liveVoice?.stop();
    for (const s of this.#sources.values()) stopQuietly(s);
    this.#sources.clear();
  }

  // starts the channel's stem now if it is decoded, else when it arrives (a late stem joins in sync with the rest)
  #swapIn(channel: number) {
    const v = this.versionOf(channel);
    if (!v) return;
    const ready = this.#ready.get(`${v.id}:${channel}`);
    if (ready) return this.#start(channel, ready);
    this.#buffer(channel).then(
      (b) => {
        if (this.#state === 'playing' && this.versionOf(channel) === v) this.#start(channel, b);
      },
      () => undefined, // reported through the error event
    );
  }

  #start(channel: number, buffer: AudioBuffer) {
    const c = this.#ctx;
    const when = c.currentTime + START_LEAD;
    const src = c.createBufferSource();
    src.buffer = this.#fit(buffer);
    src.loop = this.#loop;
    src.loopStart = 0;
    src.loopEnd = this.duration; // one loop length for every stem, so stems of different versions never drift apart
    src.connect(this.#gain(channel));
    src.start(when, this.#positionAt(when));
    stopQuietly(this.#sources.get(channel), when); // the old stem ends on the tick the new one starts
    this.#sources.set(channel, src);
  }

  // a stem shorter than the loop is padded with silence; Web Audio clamps loopEnd to the buffer, which would drift.
  // Under 1 ms short is resampling rounding (durations are written at 44.1 kHz, contexts often run at 48 kHz): no copy.
  #fit(buffer: AudioBuffer): AudioBuffer {
    const len = this.duration;
    if (buffer.duration >= len - 0.001) return buffer;
    const key = `${len}`;
    const cached = this.#padded.get(buffer);
    if (cached?.key === key) return cached.buffer;
    const out = this.#ctx.createBuffer(buffer.numberOfChannels, Math.ceil(len * buffer.sampleRate), buffer.sampleRate);
    for (let i = 0; i < buffer.numberOfChannels; i++) out.copyToChannel(buffer.getChannelData(i), i);
    this.#padded.set(buffer, { key, buffer: out });
    return out;
  }

  #tick() {
    this.#cancelFrame = this.#frame(() => {
      if (this.#state !== 'playing') return;
      const position = this.position;
      // the loop wrapped: the synthesizer runs to the end of the MIDI on its own clock, so bring it back with ours
      if (this.#version?.live && position < this.#lastPosition) this.#liveVoice?.start(position);
      this.#lastPosition = position;
      this.#emit('time', { position });
      if (!this.#loop && position >= this.duration) {
        this.pause();
        this.#pausedAt = 0;
        return;
      }
      this.#tick();
    });
  }
}
