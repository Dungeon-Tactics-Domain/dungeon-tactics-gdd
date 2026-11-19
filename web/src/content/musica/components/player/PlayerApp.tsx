// The whole player on the lab's night theme: one black box (song list on the left, collapsible; transport, roll and
// mixer on the right) and, apart, the light box with the track notes.
// It owns the PlayerEngine and its AudioContext, created on the first pointer or key press inside it (or Space anywhere),
// because browsers keep a context made earlier suspended and warn about it.
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Icone } from '@/components/layout/Icone';
import { Toggle } from '@/components/ui/toggle';
import { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Catalog, Song } from '@/lib/player/schema';
import { createSpessaVoice } from '@/lib/player/spessa-voice';
import { Biblioteca } from './Biblioteca';
import { ALTURA_MINIMA, PASSO_ALTURA } from './constantes';
import { escreverLink, lerLink, useAlturaDaw, useMotor } from './hooks';
import { Mixer } from './Mixer';
import { NotasFaixa } from './NotasFaixa';
import { PianoRoll } from './PianoRoll';
import { Transporte } from './Transporte';

// keys typed into a control belong to it, not to the player
const ehControle = (el: Element) =>
  /^(INPUT|BUTTON|SELECT|TEXTAREA|A)$/.test(el.tagName) || (el as HTMLElement).isContentEditable;

// the song that opens: the first of the first category that has one
const primeira = (c: Catalog): Song | undefined => {
  const ordem = new Map(c.categories.map((x) => [x.id, x.order]));
  return [...c.songs].sort((a, b) => ordem.get(a.category)! - ordem.get(b.category)!)[0];
};

export function PlayerApp({ catalogo }: { catalogo: Catalog }) {
  // a shared link names the song and the version (?musica=&som=); the page opens on them, stopped, since browsers
  // allow no sound before a click. Ids that do not exist fall back to the default.
  const [params, setParams] = useSearchParams();
  const [musica, setMusica] = useState(() => lerLink(catalogo, params).musica ?? primeira(catalogo));
  const [versaoId, setVersaoId] = useState(() => lerLink(catalogo, params).versaoId ?? musica?.versions[0]?.id);
  // replace: picking songs must not pile up entries for the Back button
  const gravarLink = (musicaId: string, id: string | undefined) =>
    setParams((p) => escreverLink(p, musicaId, id), { replace: true });
  const [listaAberta, setListaAberta] = useState(true);
  const [engine, setEngine] = useState<PlayerEngine>();
  const contexto = useRef<AudioContext>(undefined);
  const motor = useRef<PlayerEngine>(undefined);
  const caixa = useRef<HTMLDivElement>(null);
  const arrasto = useRef({ y: 0, altura: 0 });
  const { altura, maximo, mudar: mudarAltura } = useAlturaDaw(caixa);
  useMotor(engine);

  // before the engine exists the screens show the chosen song and version; after, the engine is the truth
  const versao = engine?.version ?? musica?.versions.find((v) => v.id === versaoId) ?? musica?.versions[0];
  const canais = engine?.song ? engine.channels : (versao?.channels ?? musica?.channels ?? []);
  const duracao = engine?.duration || versao?.duration || 0;

  const iniciar = () => {
    if (motor.current) return motor.current;
    contexto.current = new AudioContext();
    const ctx = contexto.current;
    const e = new PlayerEngine({ context: ctx, live: (saida) => createSpessaVoice(ctx, saida) });
    e.setTreated(true); // the treated finish is the one to hear; the original is no longer offered
    if (musica) void e.setSong(musica, versaoId);
    motor.current = e;
    setEngine(e);
    return e;
  };

  const alternar = () => {
    const e = iniciar();
    if (e.state === 'playing') e.pause();
    else void e.play();
  };

  const escolher = (s: Song) => {
    if (s === musica) return;
    const id = s.versions[0]?.id;
    // the screen goes to the new song at once; the engine pauses the old one, loads the new one and plays it by itself.
    // The ref, not the state: on the first click of a visit the engine was made a moment ago, by the same press.
    setMusica(s);
    setVersaoId(id);
    gravarLink(s.id, id);
    void motor.current?.setSong(s, id, { play: true });
  };

  const trocarVersao = (id: string, manter = false) => {
    setVersaoId(id);
    if (musica) gravarLink(musica.id, id);
    void engine?.setVersion(id, { keepChannels: manter });
  };

  // resizing the box is no reason to start the audio. Nor is the press on Play: its click starts the engine itself,
  // and starting it here would disable the button (loading) between the press and the click, which the browser then drops
  const acordar = (e: React.SyntheticEvent) => {
    if (!(e.target as Element).closest('[role=separator], [data-tocar]')) iniciar();
  };

  const teclasAltura = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') mudarAltura(altura + PASSO_ALTURA);
    else if (e.key === 'ArrowUp') mudarAltura(altura - PASSO_ALTURA);
    else if (e.key === 'Home') mudarAltura();
    else return;
    e.preventDefault(); // the arrows would scroll the page
  };

  // Space plays and pauses from anywhere on the page, except where a control owns the key
  const espaco = useRef(alternar);
  useEffect(() => {
    espaco.current = alternar;
  });
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.composedPath()[0];
      if (e.key !== ' ' || e.defaultPrevented || (alvo instanceof Element && ehControle(alvo))) return;
      e.preventDefault();
      espaco.current();
    };
    globalThis.addEventListener('keydown', aoTeclar);
    return () => globalThis.removeEventListener('keydown', aoTeclar);
  }, []);

  // the app made the context, so it closes it
  useEffect(
    () => () => {
      motor.current?.dispose();
      void contexto.current?.close();
      motor.current = undefined;
      contexto.current = undefined;
    },
    [],
  );

  return (
    <div className="grid min-w-0 gap-6" onPointerDownCapture={acordar} onKeyDownCapture={acordar}>
      {/* --daw-altura: the box's height on a desktop; on a phone, where the parts stack, the cap of the lanes alone */}
      <div
        ref={caixa}
        style={{ '--daw-altura': `${altura}px` } as CSSProperties}
        className="daw grid min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] border-2 border-couro bg-couro-escuro text-creme shadow-couro max-[700px]:grid-cols-1 max-[700px]:grid-rows-none min-[701px]:h-(--daw-altura)"
      >
        <aside
          className={`relative border-r-2 border-apagado max-[700px]:w-auto max-[700px]:border-b-2 max-[700px]:border-r-0 ${listaAberta ? 'w-80' : 'w-[52px]'}`}
        >
          <Toggle
            icone={listaAberta ? 'recolher' : 'expandir'}
            aria-expanded={listaAberta}
            aria-label={listaAberta ? 'Recolher a lista de músicas' : 'Mostrar a lista de músicas'}
            onClick={() => setListaAberta(!listaAberta)}
            className={`h-14 w-full justify-start border-0 border-b border-apagado font-serif text-lg uppercase ${listaAberta ? 'px-3.5' : 'justify-center px-0'}`}
          >
            {listaAberta && 'Músicas'}
          </Toggle>
          {/* absolute, so a long list scrolls inside the column instead of making the stage taller */}
          <div hidden={!listaAberta} className="absolute inset-x-0 bottom-0 top-14 px-3 pb-3 pt-3 max-[700px]:static">
            <Biblioteca catalogo={catalogo} musica={musica} aoEscolher={escolher} />
          </div>
        </aside>
        {/* a column with min-h-0 all the way down, so the height above reaches the scrolling lanes */}
        <section aria-label="Piano roll e mixer" className="flex min-h-0 min-w-0 flex-col">
          <Transporte engine={engine} versao={versao} aoAlternar={alternar} />
          {musica && (
            <PianoRoll
              engine={engine}
              versao={versao}
              canais={canais}
              duracao={duracao}
              mixer={
                <Mixer engine={engine} musica={musica} versao={versao} canais={canais} aoTrocarVersao={trocarVersao} />
              }
            />
          )}
        </section>
        {/* a focusable separator is the ARIA window splitter; the drag counts from where the pointer went down, so a
            click that does not move (the first of a double click) changes nothing */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Altura do player"
          aria-valuenow={altura}
          aria-valuemin={ALTURA_MINIMA}
          aria-valuemax={maximo}
          tabIndex={0}
          title="Arraste ou use as setas para mudar a altura; duplo clique volta ao padrão"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture?.(e.pointerId); // jsdom has no capture
            arrasto.current = { y: e.clientY, altura };
          }}
          onPointerMove={(e) => {
            const dy = e.clientY - arrasto.current.y;
            if (e.currentTarget.hasPointerCapture?.(e.pointerId) && dy) mudarAltura(arrasto.current.altura + dy);
          }}
          onDoubleClick={() => mudarAltura()}
          onKeyDown={teclasAltura}
          className="relative col-span-full grid h-3.5 cursor-row-resize touch-none select-none place-items-center border-t-2 border-apagado text-creme-apagado hover:bg-couro focus-visible:bg-couro pointer-coarse:before:absolute pointer-coarse:before:-inset-y-4 pointer-coarse:before:inset-x-0"
        >
          <Icone id="arrastar" className="size-3 flex-none" />
        </div>
      </div>
      <NotasFaixa musica={musica} />
    </div>
  );
}
