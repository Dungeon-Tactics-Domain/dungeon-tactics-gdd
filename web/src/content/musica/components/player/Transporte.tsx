// Top of the right side: play/pause, time, position bar, which version sounds and the master volume.
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/player/math';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Version } from '@/lib/player/schema';
import { useMotor } from './hooks';

export function Transporte({
  engine,
  versao,
  aoAlternar,
}: {
  engine: PlayerEngine | undefined;
  versao: Version | undefined;
  aoAlternar: () => void;
}) {
  useMotor(engine, true);
  const tocando = engine?.state === 'playing';
  const pos = engine?.position ?? 0;
  const total = engine?.duration || versao?.duration || 0;
  const volume = engine?.masterVolume ?? 1;
  const pecas = engine?.song ? engine.channels.map((c) => engine.stemStatus(c.channel)) : [];
  const prontas = pecas.filter((p) => p === 'ready').length;
  const falhou = pecas.includes('error');

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-couro px-4 py-3">
      <Button
        icone={tocando ? 'pausar' : 'tocar'}
        disabled={!versao}
        onClick={aoAlternar}
        className="min-w-28 bg-ouro-claro text-couro-escuro hover:bg-ouro-brilho"
      >
        {tocando ? 'Pausar' : 'Tocar'}
      </Button>
      <span>
        Versão soando: <strong className="font-serif text-lg uppercase text-ouro-claro">{versao?.label ?? '—'}</strong>
      </span>
      <span className="flex min-w-0 flex-[1_1_260px] items-center gap-2.5">
        <span className="font-mono tabular-nums">{formatTime(pos)}</span>
        <input
          type="range"
          min={0}
          max={total}
          step={0.1}
          value={pos}
          aria-label="Posição na música"
          aria-valuetext={`${formatTime(pos)} de ${formatTime(total)}`}
          onChange={(e) => engine?.seek(Number(e.target.value))}
          className="min-h-11 min-w-30 flex-1 accent-ouro-claro"
        />
        <span className="font-mono tabular-nums">{formatTime(total)}</span>
      </span>
      <label className="inline-flex items-center gap-2">
        Volume
        <input
          type="range"
          min={0}
          max={1.5}
          step={0.05}
          value={volume}
          aria-valuetext={`${Math.round(volume * 100)}%`}
          onChange={(e) => engine?.setMasterVolume(Number(e.target.value))}
          className="min-h-11 accent-ouro-claro"
        />
      </label>
      {falhou ? (
        <p role="status" className="m-0 basis-full">
          {versao?.live ? 'O soundfont ou o MIDI não carregou.' : 'Um instrumento não carregou.'}
        </p>
      ) : (
        prontas < pecas.length && (
          <p role="status" className="m-0 basis-full">
            {versao?.live
              ? 'Carregando o soundfont (30 MB)…'
              : `Carregando instrumentos: ${prontas} de ${pecas.length}`}
          </p>
        )
      )}
    </div>
  );
}
