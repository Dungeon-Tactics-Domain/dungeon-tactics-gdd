// One live scene of the game's feel bench (scripts/sandbox/bench/<name>.json in the game repo, served by `npm run bench`
// on port 5291). Same behaviour and iframe URLs as the old lab (dungeon-tactics-lab/mecanicas: main.ts scenePage and
// data/scenes.ts): the game never starts by itself, one live iframe at a time (each is the whole WebGL game), and leaving
// the page unmounts the iframe, which unloads the game.
import { useEffect, useState } from 'react';
import { Icone } from '@/components/layout/Icone';
import { cn } from '@/lib/utils';
import { CENAS } from '../dados';
import { benchSpec, type Camera, GAME, PROPOSAL, sceneUrl, type Spec, type View } from './cena-url';

const SO_ANIMACAO = 'mecanicas:so-animacao';
// "Só a animação" starts on and is remembered in the browser (storage can be missing in a private window); speed and
// camera last while the app is open, shared by every scene, like the old lab's module-level view
const vista: View = { bare: true, speed: 1, camera: 'side' };
try {
  vista.bare = localStorage.getItem(SO_ANIMACAO) !== '0';
} catch {
  // no storage: keep the default
}

const BOTAO =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[3px] border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';

function Escolha<T>({
  rotulo,
  icone,
  opcoes,
  atual,
  escolher,
}: {
  rotulo: string;
  icone: string;
  opcoes: [T, string][];
  atual: T;
  escolher: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-1.5">
      <span className="text-apagado">{rotulo}</span>
      {opcoes.map(([v, t]) => (
        <button key={t} type="button" aria-pressed={v === atual} onClick={() => escolher(v)} className={BOTAO}>
          <Icone id={icone} />
          {t}
        </button>
      ))}
    </div>
  );
}

function Quadro({ src, titulo, legenda }: { src: string; titulo: string; legenda?: string }) {
  return (
    <figure className="m-0 bg-tinta">
      <iframe
        src={src}
        title={titulo}
        allow="fullscreen"
        className="mx-auto block aspect-video w-full max-w-[160vh] border-0"
      />
      {legenda && <figcaption className="px-2 py-1 text-[14px] text-sobre-tinta">{legenda}</figcaption>}
    </figure>
  );
}

export function Cena({ nome }: { nome: string }) {
  const s = CENAS.find((c) => c.name === nome);
  const [view, setView] = useState<View>(() => ({ ...vista }));
  const [spec, setSpec] = useState<Spec | null>(null);
  const [erro, setErro] = useState(false);
  const [estado, setEstado] = useState('Carregando a cena…');
  const [pausado, setPausado] = useState(false);

  // the game page reports problems when ready and when the loop stops on a step; only the text changes
  useEffect(() => {
    if (!spec) return;
    const ouvir = (e: MessageEvent) => {
      if (e.origin !== GAME && e.origin !== PROPOSAL) return;
      const d = e.data as { sandbox?: string; problems?: string[] } | null;
      if (d?.sandbox !== 'problems') return;
      setEstado(d.problems?.length ? `Problema no sandbox: ${d.problems.join('; ')}` : 'Cena pronta, tocando em laço.');
    };
    addEventListener('message', ouvir);
    return () => removeEventListener('message', ouvir);
  }, [spec]);

  if (!s) return <p className="m-0 text-erro">Cena desconhecida: {nome}</p>;
  const host = GAME.replace('http://', '');

  // speed, camera and "Só a animação" only apply when the game page loads: the iframe is rebuilt (the scene reloads)
  const mudar = (next: Partial<View>) => {
    Object.assign(vista, next);
    try {
      localStorage.setItem(SO_ANIMACAO, vista.bare ? '1' : '0');
    } catch {
      // only not remembered
    }
    setView({ ...vista });
    setPausado(false);
    setEstado('Carregando a cena…');
  };
  // reading the scene file also proves the game server is up
  const ver = async () => {
    let lido: Spec | null = null;
    try {
      lido = await benchSpec(GAME, s.name);
    } catch {
      // server down: the warning shows on the card
    }
    setSpec(lido);
    setErro(!lido);
    setPausado(false);
    setEstado('Carregando a cena…');
  };
  // pause, step and resume go by postMessage (the iframe is another port) and do not rebuild, which would reload the scene
  const enviar = (m: 'pause' | 'step' | 'resume') => {
    for (const f of document.querySelectorAll<HTMLIFrameElement>(`#cena-${s.name} iframe`))
      f.contentWindow?.postMessage({ sandbox: m }, new URL(f.src).origin);
    // stepping one frame leaves the clock stopped again
    setPausado(m !== 'resume');
  };

  return (
    <article id={`cena-${s.name}`} className="grid gap-2 border border-borda bg-folha px-5 py-4">
      <p className="m-0 text-apagado">
        bench/{s.name}.json, rodando em {host}. Os efeitos sonoros do jogo tocam: abaixe o volume da aba se incomodar.
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" aria-pressed={view.bare} onClick={() => mudar({ bare: !view.bare })} className={BOTAO}>
          <Icone id="filtrar" />
          Só a animação
        </button>
        <span className="text-apagado">
          {view.bare
            ? 'Sem interface: some também o número de dano.'
            : 'Com a interface de partida (sem fps, ferramentas e ajuda).'}
        </span>
      </div>
      {spec && (
        <>
          <div className={cn(PROPOSAL && 'grid grid-cols-2 gap-2 max-[900px]:grid-cols-1')}>
            <Quadro
              key={sceneUrl(GAME, s.name, spec, view)}
              src={sceneUrl(GAME, s.name, spec, view)}
              titulo={`${s.title}, hoje`}
              legenda={PROPOSAL ? 'Hoje' : undefined}
            />
            {PROPOSAL && (
              <Quadro src={sceneUrl(PROPOSAL, s.name, spec, view)} titulo={`${s.title}, proposta`} legenda="Proposta" />
            )}
          </div>
          <p role="status" className="m-0 text-apagado">
            {estado}
          </p>
          <div className="grid gap-2.5">
            <Escolha
              rotulo="Velocidade"
              icone="avancar"
              opcoes={[
                [0.25, '0,25x'],
                [0.5, '0,5x'],
                [1, '1x'],
                [2, '2x'],
              ]}
              atual={view.speed}
              escolher={(speed) => mudar({ speed })}
            />
            <div role="group" aria-label="Relógio da batalha" className="flex flex-wrap gap-1.5">
              <button type="button" aria-pressed={pausado} onClick={() => enviar('pause')} className={BOTAO}>
                <Icone id="pausar" />
                Pausar
              </button>
              <button type="button" onClick={() => enviar('step')} className={BOTAO}>
                <Icone id="avancar" />
                Avançar um quadro
              </button>
              <button type="button" onClick={() => enviar('resume')} className={BOTAO}>
                <Icone id="tocar" />
                Continuar
              </button>
            </div>
            <Escolha<Camera>
              rotulo="Câmera"
              icone="recarregar"
              opcoes={[
                ['acao', 'ação'],
                ['side', 'lado'],
                ['three-quarter', '3/4'],
              ]}
              atual={view.camera}
              escolher={(camera) => mudar({ camera })}
            />
          </div>
        </>
      )}
      {erro && (
        <p role="alert" className="m-0 bg-aviso-suave px-3 py-2 text-aviso">
          O jogo não está rodando em {host}. Suba a bancada do jogo (npm run bench) e tente de novo.
        </p>
      )}
      <button
        type="button"
        onClick={() => (spec ? setSpec(null) : void ver())}
        className={cn(BOTAO, 'justify-self-start')}
      >
        <Icone id={spec ? 'fechar' : 'tocar'} />
        {spec ? 'Parar' : 'Ver ao vivo'}
      </button>
    </article>
  );
}
