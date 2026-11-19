// The live voice on SpessaSynth (Apache-2.0): an AudioWorklet synthesizer plus its MIDI sequencer, loaded on first use so
// the rest of the player does not pay for the library. Not testable in jsdom (no AudioWorklet): the engine tests use a fake.
import type { Sequencer, WorkletSynthesizer } from 'spessasynth_lib';
import processorUrl from 'spessasynth_lib/dist/spessasynth_processor.min.js?url';
import type { LiveVoice } from './PlayerEngine';

const BANK = 'live';

const download = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.arrayBuffer();
};

export function createSpessaVoice(context: BaseAudioContext, output: AudioNode): LiveVoice {
  const gains = new Map<number, number>(); // kept here: the channels exist only once the synthesizer is up
  let booted: Promise<{ synth: WorkletSynthesizer; seq: Sequencer }> | undefined;
  let soundfont = '';
  let midi = '';
  let current: { synth: WorkletSynthesizer; seq: Sequencer } | undefined;

  const boot = async () => {
    const lib = await import('spessasynth_lib');
    await context.audioWorklet.addModule(processorUrl);
    const synth = new lib.WorkletSynthesizer(context);
    synth.connect(output);
    const seq = new lib.Sequencer(synth);
    seq.loopCount = 0; // the engine owns the loop
    seq.skipToFirstNoteOn = false; // the engine's clock counts the silent lead-in too
    await synth.isReady;
    current = { synth, seq };
    return current;
  };

  const applyGain = (channel: number, gain: number) =>
    current?.synth.midiChannels[channel]?.setSystemParameter('gain', gain);

  return {
    async load(midiUrl, soundfontUrl) {
      const { synth, seq } = await (booted ??= boot());
      if (soundfontUrl !== soundfont) {
        const data = await download(soundfontUrl);
        if (soundfont) await synth.soundBankManager.deleteSoundBank(BANK);
        await synth.soundBankManager.addSoundBank(data, BANK);
        soundfont = soundfontUrl;
      }
      if (midiUrl !== midi) {
        const data = await download(midiUrl);
        // the song loads asynchronously in the worklet: wait for its announcement before anyone seeks
        await new Promise<void>((resolve) => {
          seq.eventHandler.addEvent('songChange', 'voice-load', () => {
            seq.eventHandler.removeEvent('songChange', 'voice-load');
            resolve();
          });
          seq.loadNewSongList([{ binary: data }]);
        });
        midi = midiUrl;
      }
      await synth.isReady;
      for (const [channel, gain] of gains) applyGain(channel, gain);
    },
    start(position) {
      const seq = current?.seq;
      if (!seq) return;
      // the render tail outlasts the MIDI: past its end there is nothing to play (and the sequencer would restart at 0)
      if (position >= seq.duration) return seq.pause();
      seq.currentTime = position;
      seq.play();
    },
    stop() {
      current?.seq.pause();
    },
    setGain(channel, gain) {
      gains.set(channel, gain);
      applyGain(channel, gain);
    },
    dispose() {
      current?.seq.pause();
      current?.synth.destroy();
      current = undefined;
    },
  };
}
