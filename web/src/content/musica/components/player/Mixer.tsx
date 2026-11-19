// Left of the lanes: one strip per channel (colour, name, the note sounding now, Mute, Solo, volume, the version it
// plays) under a header that picks the version of the whole song. Strips are as tall as the lanes and the header as
// tall as the ruler, so they line up. Picking a version of the whole song while some instrument plays another one asks
// first what to do with those choices.
import * as Dialog from '@radix-ui/react-dialog';
import { type CSSProperties, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Channel, Song, Version } from '@/lib/player/schema';
import { ALTURA_FAIXA, ALTURA_REGUA, ROTULO_EFEITO, varDoCanal } from './constantes';
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
  /** `manter`: the instruments that play another version by their own choice stay as they are */
  aoTrocarVersao: (id: string, manter?: boolean) => void;
}) {
  useMotor(engine);
  // the version picked in the header while it waits for the answer about the per-instrument choices
  const [pedido, setPedido] = useState<string>();
  const seletor = useRef<HTMLSelectElement>(null);
  const manter = useRef<HTMLButtonElement>(null);
  const responder = (manterTrocas: boolean) => {
    if (pedido) aoTrocarVersao(pedido, manterTrocas);
    setPedido(undefined);
  };

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
    // sticky in the scroll box it shares with the lanes: the mixer stays at the left when the lanes scroll sideways and
    // its header at the top, beside the ruler, when the strips scroll
    <div className="w-[420px] border-2 border-r-0 border-couro bg-couro-escuro text-creme max-[700px]:w-auto max-[700px]:border-r-2 min-[701px]:sticky min-[701px]:left-0 min-[701px]:z-10">
      <div
        style={{ height: ALTURA_REGUA }}
        className="flex items-center justify-between gap-2 bg-couro px-3 font-serif text-lg font-bold uppercase min-[701px]:sticky min-[701px]:top-0 min-[701px]:z-10"
      >
        <span>Mixer</span>
        <select
          ref={seletor}
          aria-label="Versões"
          value={versao?.id}
          // not answered or cancelled: the select is controlled, so it shows the version in use again
          onChange={(e) => (engine?.hasChannelVersions ? setPedido(e.target.value) : aoTrocarVersao(e.target.value))}
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
        const vc = engine?.versionOf(c.channel) ?? versao;
        const efeitos = (vc?.channels ?? musica.channels).find((x) => x.channel === c.channel)?.effects ?? [];
        return (
          <div
            key={c.channel}
            role="group"
            tabIndex={0}
            aria-label={`${c.name}. M silencia, S toca só este canal`}
            onKeyDown={(e) => teclas(e, c.channel)}
            style={{ minHeight: ALTURA_FAIXA }}
            className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-1.5 gap-y-0.5 border-t border-apagado px-2.5 py-1 min-[701px]:h-[124px] ${i % 2 ? 'bg-couro' : ''}`}
          >
            <span
              className="flex min-w-0 items-center gap-x-2 font-bold max-[700px]:flex-wrap max-[700px]:leading-5"
              title={c.name}
            >
              <span className="size-3.5 flex-none" style={{ background: `var(${varDoCanal(i)})` }} />
              {/* on a phone the name fills the line beside the 22 px swatch, so the note label wraps under it */}
              <span className="truncate max-[700px]:w-[calc(100%-22px)] max-[700px]:flex-none">{c.name}</span>
              {/* The note sounding now on this channel. PianoRoll writes the text and data-on as the needle moves (it
                  has the MIDI and the position), so the span has no children here. Fixed width: the name beside it
                  must not move as notes change. The channel colour goes on the border, not behind the text: it is only
                  3:1 against the strip. */}
              <span
                data-nota={c.channel}
                aria-hidden="true"
                style={{ '--cor': `var(${varDoCanal(i)})` } as CSSProperties}
                className="ml-auto w-[8ch] max-[700px]:ml-0 flex-none border-2 border-l-8 border-apagado text-center font-mono font-normal text-creme-apagado data-on:border-(--cor) data-on:font-bold data-on:text-creme"
              />
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
            {/* effects added to the render of the sound this channel plays now; none listed = none added */}
            <ul
              className="col-span-3 m-0 flex min-h-6 list-none flex-wrap items-center gap-1 p-0"
              aria-label={`Efeitos de ${c.name}`}
            >
              {efeitos.map((e) => (
                <li key={e} className="border border-apagado px-1.5 leading-5 text-creme-apagado">
                  {ROTULO_EFEITO[e]}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {/* Radix: focus trap, Esc and a press outside cancel. In a portal, outside .daw, so it wears the page's colours. */}
      <Dialog.Root open={!!pedido} onOpenChange={(o) => !o && setPedido(undefined)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-tinta/60" />
          <Dialog.Content
            role="alertdialog"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              manter.current?.focus();
            }}
            // there is no trigger to go back to: the select asked
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              seletor.current?.focus();
            }}
            className="fixed inset-2 z-50 m-auto grid h-fit max-h-[calc(100dvh-16px)] w-fit max-w-[min(560px,calc(100vw-16px))] gap-3 overflow-auto border-2 border-couro-escuro bg-folha p-4 text-base text-tinta shadow-couro"
          >
            <Dialog.Title className="m-0 font-serif text-xl font-bold">
              Trocar para {musica.versions.find((v) => v.id === pedido)?.label}?
            </Dialog.Title>
            <Dialog.Description className="m-0">
              Você já escolheu o som de alguns instrumentos um a um. O que fazer com essas trocas?
            </Dialog.Description>
            <div className="flex flex-wrap gap-2 max-[700px]:grid">
              <Button ref={manter} onClick={() => responder(true)}>
                Manter minhas trocas
              </Button>
              <Button variant="outline" onClick={() => responder(false)}>
                Trocar tudo
              </Button>
              <Dialog.Close asChild>
                <Button variant="outline">Cancelar</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
