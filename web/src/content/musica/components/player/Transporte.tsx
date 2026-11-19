// Top of the right side: the loading bar while the sounds download, then play/pause, time, position bar, which version
// sounds and the master volume.
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
  const carregando = !!engine?.loading;
  const pos = engine?.position ?? 0;
  const total = engine?.duration || versao?.duration || 0;
  const volume = engine?.masterVolume ?? 1;
  const pecas = engine?.song ? engine.channels.map((c) => engine.stemStatus(c.channel)) : [];
  const prontas = pecas.filter((p) => p === 'ready').length;
  const falhou = pecas.includes('error');
  // the stems being waited for, which for a change of version are not yet the ones on stage
  const carga = engine?.loadProgress;
  const porcento = Math.round((carga?.fraction ?? 0) * 100);
  // the live synthesizer downloads one file with no progress to report: the bar stays empty beside its text
  const textoCarga = carga?.total
    ? `Baixando os sons: ${carga.done} de ${carga.total}`
    : 'Baixando o soundfont (30 MB)…';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 bg-couro px-4 py-3">
      {carregando && (
        <div className="flex basis-full flex-wrap items-center gap-x-3 gap-y-2 border-2 border-ouro-claro bg-couro-escuro px-3 py-2">
          {/* with reduced motion there is no spinner: the bar alone shows the progress */}
          <span
            aria-hidden="true"
            className="size-6 flex-none rounded-full border-4 border-apagado border-t-ouro-claro motion-safe:animate-spin motion-reduce:hidden"
          />
          <span id="carga-texto" className="flex-none text-lg font-bold">
            {textoCarga}
          </span>
          <div
            role="progressbar"
            aria-labelledby="carga-texto"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={carga?.total ? porcento : undefined}
            aria-valuetext={textoCarga}
            className="h-4 min-w-24 flex-1 border-2 border-apagado bg-couro"
          >
            <div className="h-full bg-ouro-claro" style={{ width: `${porcento}%` }} />
          </div>
        </div>
      )}
      <Button
        icone={tocando ? 'pausar' : 'tocar'}
        data-tocar
        disabled={!versao || carregando}
        onClick={aoAlternar}
        className="min-w-28 bg-ouro-claro text-couro-escuro hover:bg-ouro-brilho"
      >
        {carregando ? 'Carregando…' : tocando ? 'Pausar' : 'Tocar'}
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
        !carregando &&
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
