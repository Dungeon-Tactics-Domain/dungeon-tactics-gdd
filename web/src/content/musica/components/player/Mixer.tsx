// Left of the lanes: one strip per channel (colour, name, Mute, Solo, volume, the version it plays) under a header that
// picks the version of the whole song. Strips are as tall as the lanes and the header as tall as the ruler, so they line up.
import { Toggle } from '@/components/ui/toggle';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Channel, Song, Version } from '@/lib/player/schema';
import { ALTURA_FAIXA, ALTURA_REGUA, corDoCanal } from './constantes';
import { useMotor } from './hooks';

const SELECT = 'min-h-11 min-w-0 border-2 border-apagado bg-couro-escuro px-2 text-base text-creme';

export function Mixer({
  engine,
  musica,
  versao,
  canais,
  aoTrocarVersao,
}: {
  engine: PlayerEngine | undefined;
  musica: Song;
  versao: Version | undefined;
  canais: Channel[];
  aoTrocarVersao: (id: string) => void;
}) {
  useMotor(engine);

  // M and S on a focused strip; keys typed into its version select belong to the select
  const teclas = (e: React.KeyboardEvent, canal: number) => {
    if (!engine || (e.target as HTMLElement).tagName === 'SELECT') return;
    const k = e.key.toLowerCase();
    if (k === 'm') engine.setMuted(canal, !engine.isMuted(canal));
    else if (k === 's') engine.setSoloed(canal, !engine.isSoloed(canal));
    else return;
    e.preventDefault();
  };

  return (
    <div className="w-[420px] border-2 border-r-0 border-couro bg-couro-escuro text-creme max-[700px]:w-auto max-[700px]:border-r-2">
      <div
        style={{ height: ALTURA_REGUA }}
        className="flex items-center justify-between gap-2 bg-couro px-3 font-serif text-lg font-bold uppercase"
      >
        <span>Mixer</span>
        <select
          aria-label="Versões"
          value={versao?.id}
          onChange={(e) => aoTrocarVersao(e.target.value)}
          className={`${SELECT} max-w-[220px]`}
        >
          {musica.versions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>
      {canais.map((c, i) => {
        const volume = engine ? Math.round(engine.volumeOf(c.channel) * 100) : 100;
        const propria = engine?.versionOf(c.channel)?.id ?? versao?.id;
        // only renders that have this channel can play it; the live synthesizer plays the whole song, never one channel
        const aoVivo = !!versao?.live;
        const versoes = aoVivo
          ? [versao]
          : musica.versions.filter(
              (v) => !v.live && (v.channels ?? musica.channels).some((x) => x.channel === c.channel),
            );
        return (
          <div
            key={c.channel}
            role="group"
            tabIndex={0}
            aria-label={`${c.name}. M silencia, S toca só este canal`}
            onKeyDown={(e) => teclas(e, c.channel)}
            style={{ minHeight: ALTURA_FAIXA }}
            className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-1.5 gap-y-0.5 border-t border-apagado px-2.5 py-1 min-[701px]:h-[100px] ${i % 2 ? 'bg-couro' : ''}`}
          >
            <span className="flex min-w-0 items-center gap-2 font-bold" title={c.name}>
              <span className="size-3.5 flex-none" style={{ background: corDoCanal(i) }} />
              <span className="truncate">{c.name}</span>
            </span>
            <Toggle
              aria-pressed={engine?.isMuted(c.channel) ?? false}
              onClick={() => engine?.setMuted(c.channel, !engine.isMuted(c.channel))}
              className="px-2"
            >
              Mudo
            </Toggle>
            <Toggle
              aria-pressed={engine?.isSoloed(c.channel) ?? false}
              onClick={() => engine?.setSoloed(c.channel, !engine.isSoloed(c.channel))}
              className="px-2"
            >
              Solo
            </Toggle>
            <label className="flex min-w-0 items-center gap-1.5">
              Vol
              <input
                type="range"
                min={0}
                max={150}
                step={1}
                value={volume}
                aria-label={`Volume de ${c.name}`}
                aria-valuetext={`${volume}%`}
                onChange={(e) => engine?.setVolume(c.channel, Number(e.target.value) / 100)}
                className="min-h-11 min-w-15 flex-1 accent-ouro-claro"
              />
              <span className="w-[3ch] text-right font-mono tabular-nums">{volume}</span>
            </label>
            <select
              aria-label={`Versão de ${c.name}`}
              value={propria}
              disabled={aoVivo}
              onChange={(e) =>
                engine?.setChannelVersion(c.channel, e.target.value === engine.version?.id ? null : e.target.value)
              }
              className={`${SELECT} col-span-2 max-w-40 max-[700px]:max-w-none`}
            >
              {versoes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
