// One live scene, Three.js on the left and the Godot web export on the right, driven by the same parameters (query string
// of the scene contract). Nothing loads before "Rodar". With ?tela=1 the Three.js side fills the window at its own size
// for the FPS measurement (window.__bench), and only then it starts by itself.
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Callout } from '@/components/content/Callout';
import { Cena3d } from '@/components/content/Cena3d';
import { DataTable } from '@/components/content/DataTable';
import { CartaoMetrica } from '@/components/dashboard/CartaoMetrica';
import { CenaSobDemanda } from '@/components/dashboard/CenaSobDemanda';
import { SeloOrigem, type TipoOrigem } from '@/components/dashboard/SeloOrigem';
import { numero } from '@/components/dashboard/series';
import cenas from '../cenas.json';
import downloads from '../downloads.json';
import medidos from '../fps-medido.json';
import godotWeb from '../godot-web.json';
import type { CenaThree, Segundo } from './cenas-three';
import { faixa, lerParams, type NomeCena, type Params, paraBusca, passo, USADOS } from './parametros';
import { GODOT, THREE } from './Painel';
import { FILTRO } from '@/components/ui/toggle';

interface Medido {
  fps: number;
  origem: string;
}
type Tabela = Record<string, Record<string, Medido> | undefined>;
const MEDIDOS = medidos as unknown as Record<'threejs' | 'godotWeb' | 'godotNativo', Tabela>;

const DOWNLOAD = downloads as {
  threejsMB: Record<NomeCena, number>;
  godotMotorMB: number;
  godotMB: Record<NomeCena, number>;
};

interface Diferenca {
  texto: string;
  origem: { tipo: TipoOrigem; texto: string; link?: string };
}
interface Fumaca {
  caso: string;
  web: number | null;
  web1pct: number | null;
  compat: number;
  forward: number;
  razaoCompat: number | null;
  razaoForward: number | null;
}
const GODOT_WEB = godotWeb as {
  fumacaNota: string;
  fumacaMetodo: string;
  geral: Diferenca[];
  cenas: Record<NomeCena, { fumaca: Fumaca; diferencas: Diferenca[] }>;
};

const NOMES: Record<keyof Params, string> = {
  qtd: 'Quantidade',
  luzes: 'Luzes de ponto',
  otimizado: 'Montagem',
  modo: 'Névoa',
  passos: 'Amostras por pixel',
  sombras: 'Sombras',
  seed: 'Semente',
  segundos: 'Segundos',
  ui: 'Contador',
};
const valorNome = (k: keyof Params, v: number) =>
  k === 'sombras'
    ? v
      ? 'ligadas'
      : 'desligadas'
    : k === 'otimizado'
      ? v
        ? 'instâncias'
        : 'um objeto por peça'
      : k === 'modo'
        ? ['sem névoa', 'de distância', 'volumétrica', 'FogVolume (só nativo)'][v]!
        : v.toLocaleString('pt-BR');

const BOTAO = FILTRO;

// one shared engine (index.wasm) for the four scenes; ?cena= picks the scene's .pck
export const godotUrl = (cena: NomeCena, p: Params) =>
  `/content/engine/godot/index.html?cena=${cena}&${paraBusca(cena, p)}`;

/** The Godot export is there when its .pck answers with something that is not the app's HTML fallback. */
function useGodotExportado(cena: NomeCena) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch(`/content/engine/godot/${cena}.pck`, { method: 'HEAD' })
      .then(
        // a .pck may come with no content type at all; only the app's HTML fallback means "missing"
        (r) => vivo && setOk(r.ok && !/html/.test(r.headers.get('content-type') ?? '')),
      )
      .catch(() => vivo && setOk(false));
    return () => {
      vivo = false;
    };
  }, [cena]);
  return ok;
}

function LadoGodot({ cena, p, aoFps }: { cena: NomeCena; p: Params; aoFps: (n: number | null) => void }) {
  const exportado = useGodotExportado(cena);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (!exportado) return;
    // same origin: the export writes window.__fps once a second (scene contract, proposal 1)
    const id = setInterval(() => {
      const f = (frame.current?.contentWindow as unknown as { __fps?: { fps: number } } | null)?.__fps;
      aoFps(f ? f.fps : null);
    }, 1000);
    return () => {
      clearInterval(id);
      aoFps(null);
    };
  }, [exportado, aoFps]);
  if (exportado === null) return <p className="m-0 p-4 text-white/80">Procurando o export do Godot…</p>;
  if (!exportado)
    return (
      <p className="m-0 grid h-full place-items-center p-4 text-center text-white/90">
        Godot ainda exportando: a versão web desta cena ainda não foi publicada aqui.
      </p>
    );
  return (
    <iframe
      ref={frame}
      key={godotUrl(cena, p)}
      src={godotUrl(cena, p)}
      title={`Cena ${cenas[cena].titulo} no Godot (navegador)`}
      className="block h-full w-full border-0"
    />
  );
}

const nm = (v: number | null) => (v === null ? 'não medido' : numero(v));
const pct = (v: number | null) => (v === null ? '—' : `${v}%`);

function ItemDiferenca({ d }: { d: Diferenca }) {
  return (
    <li className="grid gap-1">
      <span>{d.texto}</span>
      <span className="flex flex-wrap items-center gap-2">
        <SeloOrigem tipo={d.origem.tipo} texto={d.origem.texto} />
        {d.origem.link && (
          <a href={d.origem.link} target="_blank" rel="noreferrer" className="text-link underline underline-offset-2">
            fonte ↗
          </a>
        )}
      </span>
    </li>
  );
}

/** What the Godot web export changes for this scene, and the smoke-test numbers (always flagged as noisy). */
function GodotNoNavegador({ cena }: { cena: NomeCena }) {
  const { fumaca: f, diferencas } = GODOT_WEB.cenas[cena];
  return (
    <section aria-labelledby={`godot-web-${cena}`} className="grid max-w-[110ch] gap-3">
      <h3 id={`godot-web-${cena}`} className="m-0 text-[20px]">
        Godot no navegador contra o Godot nativo
      </h3>
      <Callout tom="aviso" titulo="1 rodada, PC em uso, ruído alto">
        <p className="m-0">{GODOT_WEB.fumacaNota}</p>
      </Callout>
      <DataTable
        legenda={`Teste de fumaça: ${f.caso} (fps médio)`}
        colunas={[
          'Godot web',
          '1% mais lentos (web)',
          'Nativo Compatibility',
          'Nativo Forward+',
          'Web / Compatibility',
          'Web / Forward+',
        ]}
        linhas={[
          [nm(f.web), nm(f.web1pct), numero(f.compat), numero(f.forward), pct(f.razaoCompat), pct(f.razaoForward)],
        ]}
      />
      <span className="flex flex-wrap items-center gap-2 text-base text-apagado">
        <SeloOrigem tipo="medido" texto={GODOT_WEB.fumacaMetodo} />
        Medido uma vez com o PC em uso; serve para ver a ordem de grandeza, não para decidir.
      </span>
      <ul className="m-0 grid list-disc gap-3 pl-6 text-base">
        {[...GODOT_WEB.geral, ...diferencas].map((d) => (
          <ItemDiferenca key={d.texto} d={d} />
        ))}
      </ul>
    </section>
  );
}

function Medida({
  titulo,
  serie,
  vivo,
  medido,
  nota,
}: {
  titulo: string;
  serie: string;
  vivo?: number | null;
  medido?: Medido;
  nota?: string;
}) {
  return (
    <CartaoMetrica
      rotulo={titulo}
      cor={serie}
      valor={medido?.fps ?? null}
      unidade=" fps"
      detalhe={
        <>
          {vivo !== undefined && <>Ao vivo agora: {vivo === null ? '—' : `${vivo} fps`}. </>}
          {medido ? `Medido neste PC: ${medido.origem}.` : nota}
        </>
      }
    />
  );
}

export function CenaMotores({ cena }: { cena: NomeCena }) {
  const [busca, setBusca] = useSearchParams();
  const { p, avisos } = lerParams(cena, busca);
  const chave = paraBusca(cena, p).toString();
  const [nonce, setNonce] = useState(0);
  const [fpsThree, setFpsThree] = useState<number | null>(null);
  const [fpsGodot, setFpsGodot] = useState<number | null>(null);
  const [tecnica, setTecnica] = useState('');
  const tela = busca.get('tela') === '1';
  const texto = cenas[cena];

  const mudar = (novo: Params) => setBusca(paraBusca(cena, novo), { replace: true });
  const criar = useCallback(
    async (canvas: HTMLCanvasElement) => {
      const { criarCena } = await import('./cenas-three');
      return criarCena(cena, lerParams(cena, new URLSearchParams(chave)).p, avisos, canvas, (s: Segundo) =>
        setFpsThree(s.fps),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuilt only when the parameters change (chave)
    [cena, chave],
  );
  const pronta = useCallback((c: CenaThree | null) => {
    setTecnica(c?.tecnica ?? '');
    if (!c) setFpsThree(null); // unloaded or rebuilding: the last live number is no longer live
  }, []);
  const teclas = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      mudar(passo(cena, p, e.key === 'ArrowUp' ? 1 : -1));
    } else if (e.key === 's' || e.key === 'S') mudar({ ...p, sombras: p.sombras ? 0 : 1 });
    else if (e.key === 'r' || e.key === 'R') setNonce((n) => n + 1);
  };

  const viva = (altura: string) => (
    <Cena3d
      criar={criar}
      chave={`${chave}#${nonce}`}
      rotulo={`Cena ${texto.titulo} no Three.js`}
      aoPronta={pronta}
      altura={altura}
    >
      {p.ui === 1 && (
        <p className="absolute left-2 top-2 m-0 bg-black/60 px-2 py-1 font-mono text-base text-white">
          FPS {fpsThree ?? '—'} | {cena} | {chave}
        </p>
      )}
    </Cena3d>
  );

  if (tela)
    return (
      <div className="fixed inset-0 z-[100] bg-black" onKeyDown={teclas} tabIndex={-1}>
        <div className="[&>div]:!h-screen [&>div]:!w-screen [&>div]:!max-w-none [&>div]:!rounded-none [&>div]:!border-0">
          {viva('h-screen')}
        </div>
      </div>
    );

  const k = chave;
  return (
    <div className="grid gap-4">
      <p className="m-0 max-w-[110ch]">{texto.testa}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Medida
          titulo="Three.js no navegador"
          serie={THREE.cor}
          vivo={fpsThree}
          medido={MEDIDOS.threejs[cena]?.[k]}
          nota="Medição deste caso ainda não feita."
        />
        <Medida
          titulo="Godot no navegador"
          serie={GODOT.cor}
          vivo={fpsGodot}
          medido={MEDIDOS.godotWeb[cena]?.[k]}
          nota="Medição deste caso ainda não feita."
        />
        <Medida
          titulo="Godot nativo"
          serie={GODOT.cor}
          medido={MEDIDOS.godotNativo[cena]?.[k]}
          nota="A bancada nativa não tem exatamente este caso."
        />
      </div>
      <p className="m-0 max-w-[110ch] text-base text-apagado">
        A comparação justa no navegador é Three.js contra Godot web; o número nativo mostra o que o Godot faria como
        jogo de Steam. Ao vivo, o navegador costuma travar o fps na taxa do monitor (vsync); os números medidos foram
        tirados sem esse limite.
      </p>
      <CenaSobDemanda
        titulo={`a cena ${texto.titulo}`}
        tamanhoMB={DOWNLOAD.threejsMB[cena] + DOWNLOAD.godotMB[cena] + DOWNLOAD.godotMotorMB}
        notaTamanho={`os dois lados; ${numero(DOWNLOAD.godotMotorMB)} MB são o motor do Godot, que baixa só na primeira cena e depois fica no cache do navegador`}
        previa={{ src: `/content/engine/previas/${cena}.png`, alt: `Prévia estática da cena ${texto.titulo}` }}
      >
        {() => (
          <div className="grid gap-3" onKeyDown={teclas}>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {USADOS[cena].map((chaveP) => (
                <div key={chaveP} role="group" aria-label={NOMES[chaveP]} className="grid gap-1">
                  <span className="text-base font-bold">{NOMES[chaveP]}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {faixa(cena, chaveP)!.map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={p[chaveP] === v}
                        className={BOTAO}
                        onClick={() => mudar({ ...p, [chaveP]: v })}
                      >
                        {valorNome(chaveP, v)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="m-0 text-base text-apagado">
              Teclado com a cena em foco: setas para cima e para baixo trocam {NOMES[USADOS[cena][0]!].toLowerCase()}, S
              liga ou desliga sombras, R recarrega. Cada troca recarrega os dois lados.
            </p>
            {avisos.length > 0 && (
              <Callout tom="aviso">
                <ul className="m-0 list-disc pl-6">
                  {avisos.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Callout>
            )}
            <div className="grid gap-3 lg:grid-cols-2">
              <section aria-label="Three.js" className="grid content-start gap-1" tabIndex={0}>
                <h3 className="m-0 flex items-center gap-2 text-[18px]">
                  <span
                    aria-hidden="true"
                    className="inline-block size-3.5 rounded-sm"
                    style={{ background: THREE.cor }}
                  />
                  Three.js r186 · ao vivo: {fpsThree ?? '—'} fps
                </h3>
                {viva('h-[min(56vh,460px)]')}
                {tecnica && <p className="m-0 text-base text-apagado">{tecnica}</p>}
              </section>
              <section aria-label="Godot" className="grid content-start gap-1">
                <h3 className="m-0 flex items-center gap-2 text-[18px]">
                  <span
                    aria-hidden="true"
                    className="inline-block size-3.5 rounded-sm"
                    style={{ background: GODOT.cor }}
                  />
                  Godot 4.7 web · ao vivo: {fpsGodot ?? '—'} fps
                </h3>
                <div className="h-[min(56vh,460px)] min-h-[200px] overflow-hidden border-2 border-couro-escuro bg-[#1d2a38]">
                  <LadoGodot cena={cena} p={p} aoFps={setFpsGodot} />
                </div>
                <p className="m-0 text-base text-apagado">
                  Export web do Godot, renderizador Compatibility (WebGL 2), sem threads.
                </p>
              </section>
            </div>
          </div>
        )}
      </CenaSobDemanda>
      <GodotNoNavegador cena={cena} />
      <div className="grid gap-3 lg:grid-cols-2">
        {(
          [
            ['Godot', GODOT.cor, texto.godot],
            ['Three.js', THREE.cor, texto.threejs],
          ] as const
        ).map(([nome, cor, t]) => (
          <article
            key={nome}
            className="grid content-start gap-2 border-2 border-couro-escuro bg-folha shadow-folha px-4 py-3 text-base"
          >
            <h3 className="m-0 flex items-center gap-2 text-[18px]">
              <span aria-hidden="true" className="inline-block size-3.5 rounded-sm" style={{ background: cor }} />
              {nome}
            </h3>
            <p className="m-0">
              <b>Vem pronto:</b> {t.pronto}
            </p>
            <p className="m-0">
              <b>Precisa montar:</b> {t.monta}
            </p>
            <span className="flex flex-wrap items-center gap-2">
              <SeloOrigem tipo={t.origem.tipo as TipoOrigem} texto={t.origem.texto} />
              {'link' in t.origem && (
                <a
                  href={t.origem.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link underline underline-offset-2"
                >
                  fonte ↗
                </a>
              )}
            </span>
          </article>
        ))}
      </div>
      <Callout tom="aviso" titulo="Antes de comparar os números">
        <ul className="m-0 grid list-disc gap-1 pl-6">
          <li>FPS de navegador sem vsync conta chamadas de requestAnimationFrame, não quadros na tela.</li>
          <li>
            O Godot no navegador usa o renderizador Compatibility (WebGL 2) e roda em WebAssembly sem threads; perde
            desempenho frente ao Godot nativo. Os números oficiais da decisão continuam sendo os da bancada nativa.
          </li>
          <li>Cada lado roda num contexto WebGL próprio; com os dois ligados juntos, um disputa a GPU com o outro.</li>
        </ul>
      </Callout>
    </div>
  );
}
