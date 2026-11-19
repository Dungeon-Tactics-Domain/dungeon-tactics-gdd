// The whole player on the lab's night theme: one black box (song list on the left, collapsible; transport, roll and
// mixer on the right) and, apart, the light box with the track notes.
// It owns the PlayerEngine and its AudioContext, created on the first pointer or key press inside it (or Space anywhere),
// because browsers keep a context made earlier suspended and warn about it.
import { useEffect, useRef, useState } from 'react';
import { Toggle } from '@/components/ui/toggle';
import { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Catalog, Song } from '@/lib/player/schema';
import { createSpessaVoice } from '@/lib/player/spessa-voice';
import { Biblioteca } from './Biblioteca';
import { useMotor } from './hooks';
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
  const [musica, setMusica] = useState(() => primeira(catalogo));
  const [versaoId, setVersaoId] = useState(() => musica?.versions[0]?.id);
  const [listaAberta, setListaAberta] = useState(true);
  const [engine, setEngine] = useState<PlayerEngine>();
  const contexto = useRef<AudioContext>(undefined);
  const motor = useRef<PlayerEngine>(undefined);
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
    setMusica(s);
    setVersaoId(id);
    void engine?.setSong(s, id);
  };

  const trocarVersao = (id: string) => {
    setVersaoId(id);
    engine?.setVersion(id);
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
    <div className="grid min-w-0 gap-6" onPointerDownCapture={iniciar} onKeyDownCapture={iniciar}>
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] border-2 border-couro bg-couro-escuro text-creme shadow-couro max-[700px]:grid-cols-1">
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
          <div
            hidden={!listaAberta}
            className="absolute inset-x-0 bottom-0 top-14 overflow-y-auto px-3 pb-3 pt-3 [scrollbar-color:var(--color-apagado)_transparent] [scrollbar-width:thin] max-[700px]:static max-[700px]:max-h-80"
          >
            <Biblioteca catalogo={catalogo} musica={musica} aoEscolher={escolher} />
          </div>
        </aside>
        <section aria-label="Piano roll e mixer" className="min-w-0">
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
      </div>
      <NotasFaixa musica={musica} />
    </div>
  );
}
