// "Decisões de gosto: escolha olhando" (16/11): Fernando's pending taste decisions on the game's interface, each one with
// its options drawn side by side, so he picks by looking. The text of every option (pros, cons, recommendation) comes from
// PENDENCIAS-GRILL.md (sections "Toque e tablet", "Game feel", "Design system: decisões de gosto" and "Interface: vidro
// dos painéis"); the sizes and positions from audits C and D (C-medidas-uw.json, C-medidas-cel.json, D-toque-mobile.md).
// Two kinds of drawing: the HUD redrawn in HTML over a clean scene (so the options compare on equal terms), and a real
// capture of the game with only the new piece drawn on top.
/* eslint-disable react-refresh/only-export-components -- DECISOES is exported for the test; a mock-up page, never hot-reloaded alone */
import './fft-kit.css';
import './responsivo.css';
import './decisoes-de-gosto.css';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { ASSETS, carregarFonte, FONTE_FFT } from '../dados';
import { Choice, Gauge } from './KitFft';

const css = (v: Record<string, string | number>) => v as CSSProperties;

// ---------- screens ----------

type TelaId = 'ultrawide' | 'celular' | 'tablet';
const TELAS: Record<TelaId, { nome: string; w: number; h: number }> = {
  ultrawide: { nome: 'Ultrawide', w: 3440, h: 1440 },
  celular: { nome: 'Celular', w: 390, h: 844 },
  tablet: { nome: 'Tablet', w: 820, h: 1180 },
};
// tallest a frame is drawn, as in Responsivo.tsx: a whole screen stays in view on a 1080 monitor
const ALTURA_MAX = 760;

/** The real screen (w x h CSS px) scaled to the column's width (Responsivo.tsx's Moldura, which is not exported). */
function Moldura({ tela, children }: { tela: TelaId; children: ReactNode }) {
  const caixa = useRef<HTMLElement>(null);
  const [largura, setLargura] = useState(0);
  const { nome, w, h } = TELAS[tela];
  useEffect(() => {
    const c = caixa.current;
    // jsdom (tests) has no ResizeObserver; the browser always does
    if (!c || typeof ResizeObserver === 'undefined') return;
    // measured now too: a hidden or throttled tab delivers no observer callback and the frame kept its 25% guess (860 px)
    setLargura(c.clientWidth);
    const ro = new ResizeObserver(() => setLargura(c.clientWidth));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  const k = largura ? Math.min(1, largura / w, Math.max(ALTURA_MAX, innerHeight * 0.8) / h) : 0.25;
  return (
    <figure ref={caixa} className="rr-moldura">
      <figcaption>
        <strong>{nome}</strong> · {w} × {h} px · mostrado a {Math.round(k * 100)}%
      </figcaption>
      <div className="rr-janela" style={{ width: w * k, height: h * k }}>
        <div className="rr-tela" style={{ width: w, height: h, transform: `scale(${k})` }}>
          {children}
        </div>
      </div>
    </figure>
  );
}

type Retangulo = [x: number, y: number, w: number, h: number];

/** One piece of the screen at 100%: the same drawing, shifted behind a window of the rectangle's size. */
function Recorte({ tela, r, children }: { tela: TelaId; r: Retangulo; children: ReactNode }) {
  const { w, h } = TELAS[tela];
  return (
    <figure className="rr-moldura">
      <figcaption>Recorte a 100% (tamanho real na tela)</figcaption>
      <div className="dg-recorte" style={{ maxWidth: r[2], height: r[3] }}>
        <div style={{ left: -r[0], top: -r[1], width: w, height: h }}>{children}</div>
      </div>
    </figure>
  );
}

// ---------- the game's pieces ----------

const FUNDOS = {
  cena: `url(${ASSETS}/cenas/cena-colina.jpg)`,
  // the contrast test's worst case (tests/glass.test.ts in the game): a white sky behind the panel
  ceu: 'linear-gradient(#ffffff, #dfeaf5)',
};
const CAPTURAS = `${ASSETS}/decisoes`;

function Tela({ tela, fundo = 'cena', children }: { tela: TelaId; fundo?: keyof typeof FUNDOS; children: ReactNode }) {
  const { w, h } = TELAS[tela];
  return (
    <div
      className={`fft dg-tela${tela === 'celular' ? ' dg-cel' : ''}`}
      style={{ width: w, height: h, backgroundImage: FUNDOS[fundo] }}
    >
      {children}
    </div>
  );
}

/** A real capture of the game (audits C and D), with whatever the option adds drawn on top. */
function Captura({
  tela,
  arquivo,
  alt,
  children,
}: {
  tela: TelaId;
  arquivo: string;
  alt: string;
  children?: ReactNode;
}) {
  const { w, h } = TELAS[tela];
  return (
    <Tela tela={tela}>
      <img src={`${CAPTURAS}/${arquivo}`} alt={alt} width={w} height={h} loading="lazy" />
      {children}
    </Tela>
  );
}

const Rosto = ({ id }: { id: string }) => (
  <span className="portrait" style={css({ '--sheet': `url(${ASSETS}/chars/px/${id}.png)` })} aria-hidden="true" />
);

// the queue of the audit's capture (C-batalha-executar): name, face, side, round
const FILA: [nome: string, rosto: string, lado: 'hero' | 'enemy', rodada: number][] = [
  ['Arqueiro', 'ranger', 'hero', 1],
  ['Ladino', 'rogue_hooded', 'hero', 1],
  ['Arqueiro esquel…', 'skeleton_rogue', 'enemy', 1],
  ['Soldado', 'skeleton_warrior', 'enemy', 1],
  ['Guerreiro', 'barbarian', 'hero', 1],
  ['Mago sombrio', 'skeleton_mage', 'enemy', 2],
  ['Mago', 'mage', 'hero', 2],
];

function Fila({ linhas = FILA.length }: { linhas?: number }) {
  return (
    <div className="panel dg-fila" role="list" aria-label="Turnos">
      <span className="dg-fila-t">Turnos</span>
      {FILA.slice(0, linhas).map(([nome, rosto, lado, rodada], i) => (
        <div key={nome} role="listitem" className={`dg-fila-l ${lado}${i ? '' : ' agora'}`}>
          <Rosto id={rosto} />
          <span className="dg-rodada">{rodada}</span>
          <span>
            <b>{i || 'AGORA'}</b>
            <i>{lado === 'hero' ? '●' : '◆'}</i> {nome}
          </span>
        </div>
      ))}
    </div>
  );
}

interface Unidade {
  nome: string;
  rosto: string;
  lado: 'hero' | 'enemy';
  vida: number;
  ct?: number;
}
const ARQUEIRO: Unidade = { nome: 'Arqueiro', rosto: 'ranger', lado: 'hero', vida: 140, ct: 90 };
const LADINO: Unidade = { nome: 'Lia', rosto: 'rogue_hooded', lado: 'hero', vida: 130, ct: 100 };
const SOLDADO: Unidade = { nome: 'Soldado', rosto: 'skeleton_warrior', lado: 'enemy', vida: 225 };

function Ficha({ u }: { u: Unidade }) {
  return (
    <div className={`panel dg-unid ${u.lado}`}>
      <Rosto id={u.rosto} />
      <div>
        <span className="dg-nome">
          {u.nome}
          <span className="dg-lado">
            <i>{u.lado === 'hero' ? '●' : '◆'}</i> {u.lado === 'hero' ? 'Herói' : 'Inimigo'}
          </span>
        </span>
        <Gauge cls="hp" label="VIDA" value={u.vida} max={u.vida} />
        {u.ct !== undefined && <Gauge cls="ct" label="CT" value={u.ct} max={100} />}
      </div>
    </div>
  );
}

const Tira = ({ centro }: { centro: boolean }) => (
  <div className={`dg-tira${centro ? ' centro' : ''}`}>
    <div>
      <span>Tiro</span>
      <span className="dg-pts">
        −33–52 <small>PTS</small>
        <span>⊕ 72%</span>
      </span>
    </div>
    <div>
      <span>
        Soldado <i>◆</i> INIMIGO
      </span>
      <Gauge cls="hp" label="VIDA" value={225} max={225} change={{ from: 173, to: 225, kind: 'loss' }} />
      <span>vida 225 → 173–192</span>
    </div>
  </div>
);

const Confirma = ({ dicas = true }: { dicas?: boolean }) => (
  <div className="panel dg-confirma">
    <div className="panel-head">Tiro: executar?</div>
    <p>
      <b>Soldado</b> acerto 72% · dano 33–52 · vida 225 → 173–192
    </p>
    <div>
      <span className="item focus">Sim{dicas && <kbd className="dg-dica">Enter</kbd>}</span>
      <span className="item">Não{dicas && <kbd className="dg-dica">Esc</kbd>}</span>
    </div>
  </div>
);

const Linhas = ({ linhas, foco, marcado }: { linhas: [string, string][]; foco?: number; marcado?: number }) =>
  linhas.map(([rotulo, orbe], i) => (
    <span key={rotulo} className={`item${i === foco ? ' focus' : ''}${i === marcado ? ' picked' : ''}`}>
      <span className={`orb ${orbe}`} aria-hidden="true" />
      <span className="item-label">{rotulo}</span>
    </span>
  ));

// the kit's orbs stand for the game's ability icons here: the icons are not what is being decided
const COMANDOS: [string, string][] = [
  ['Mover', 'gold'],
  ['Agir', 'blue'],
  ['Esperar', 'bronze'],
  ['Status', 'gold'],
];
const HABILIDADES: [string, string][] = [
  ['Facada', 'blue'],
  ['Faca arremessada', 'blue'],
  ['Rasteira', 'blue'],
  ['Golpe mortal', 'blue'],
];

function Menus({ sub }: { sub: 'lado' | 'lugar' | 'nenhum' }) {
  return (
    <>
      {sub !== 'lugar' && (
        <div className="panel dg-menu">
          <div className="panel-head">Comandos</div>
          <Linhas linhas={COMANDOS} marcado={sub === 'lado' ? 1 : undefined} foco={sub === 'nenhum' ? 1 : undefined} />
        </div>
      )}
      {sub !== 'nenhum' && (
        <div className={`panel dg-menu sub${sub === 'lugar' ? ' lugar' : ''}`}>
          <div className="panel-head">Habilidades</div>
          <Linhas linhas={HABILIDADES} foco={0} />
        </div>
      )}
    </>
  );
}

const FPS = '131 fps · 7.7 ms\n355 desenhos · 302.3 mil triângulos\n109 geometrias · 73 texturas\nJS 150 MB';
const AJUDA = {
  executar: 'Tiro: executar?',
  mover: 'Mover: escolha uma casa marcada.',
  menu: 'Facada: alcance 1 · dano 45–60 · acerto 95%',
};

interface Vidro {
  /** panel opacity, percent (the game's slider goes from 40 to 100) */
  alpha: number;
  /** dark veil under the panel, percent (75 in the game) */
  veu: number;
  /** blur of what is behind, px (6 light, 12 strong; off on touch) */
  blur: number;
}

interface HudP {
  tela: TelaId;
  estado: keyof typeof AJUDA;
  /** scale of the whole HUD (1.333 = scaled by height at 1440) */
  k?: number;
  fundo?: keyof typeof FUNDOS;
  fps?: boolean;
  /** colour of the enemy's ◆ on the blue panels */
  marca?: string;
  tiraCentro?: boolean;
  alvo?: boolean;
  sub?: 'lado' | 'lugar' | 'nenhum';
  vidro?: Vidro;
  children?: ReactNode;
}

// the game's glassVars() (glass.ts): translucent stops over the dark veil, a light rim at half the transparency, the blur
const vidroVars = (v: Vidro) => ({
  '--g-hi': `rgb(42 76 140 / ${v.alpha}%)`,
  '--g': `rgb(33 64 124 / ${v.alpha}%)`,
  '--g-lo': `rgb(15 29 64 / ${v.alpha}%)`,
  '--veu': `rgb(5 10 24 / ${v.veu}%)`,
  '--filtro': v.blur ? `blur(${v.blur}px) saturate(1.2)` : 'none',
  '--paper-frame': `0 0 0 1px #050a18, inset 0 0 0 1px rgb(223 230 248 / ${(100 - v.alpha) / 2}%), inset 0 0 0 1px rgba(5, 10, 24, 0.7), inset 0 2px 8px rgba(255, 255, 255, 0.14), 0 3px 0 rgba(0, 0, 0, 0.45)`,
});

/** The battle HUD at the game's px. On the phone the unit panel takes the screen's width (audit C's fix, not in the game). */
function Hud({ tela, estado, k = 1, fundo, fps, marca, tiraCentro = false, alvo, sub, vidro, children }: HudP) {
  const { w, h } = TELAS[tela];
  const cel = tela === 'celular';
  const quem = estado === 'executar' ? ARQUEIRO : LADINO;
  return (
    <Tela tela={tela} fundo={fundo}>
      <div
        className="dg-hud"
        style={css({
          width: w / k,
          height: h / k,
          transform: `scale(${k})`,
          ...(marca && { '--marca': marca }),
          ...(vidro && vidro.alpha < 100 && vidroVars(vidro)),
        })}
      >
        <div className="panel dg-chip dg-casa">Casa 10,6 · altura 0 · grama</div>
        <div className="panel dg-chip dg-ajuda">{AJUDA[estado]}</div>
        <span className="dg-burger" aria-hidden="true">
          ☰
        </span>
        {fps && <span className="dg-fps">{FPS}</span>}
        <Fila linhas={cel ? 5 : 7} />
        {sub && <Menus sub={sub} />}
        {estado === 'executar' && !cel && <Confirma />}
        {!(cel && alvo) && <Ficha u={quem} />}
        {estado === 'executar' && !cel && <Tira centro={tiraCentro} />}
        {alvo && <Ficha u={SOLDADO} />}
        {children}
      </div>
    </Tela>
  );
}

const LOJA: [nome: string, tipo: string, preco: number][] = [
  ['Lâmina de ferro', 'Arma · +10 poder físico', 120],
  ['Arco de caça', 'Arma · +5 poder físico · +8 acerto', 140],
  ['Cajado de freixo', 'Arma · +15 poder mágico', 150],
  ['Gibão de couro', 'Armadura · +30 vida', 100],
  ['Cota de malha', 'Armadura · +60 vida · −1 velocidade', 220],
  ['Manto guardado', 'Armadura · +40 vida', 160],
  ['Botas ligeiras', 'Acessório · +2 movimento', 200],
  ['Grevas de mola', 'Acessório · +2 salto', 180],
  ['Amuleto ligeiro', 'Acessório · +1 velocidade', 240],
];
const VILA: [string, string][] = [
  ['Ir para a quest', 'gold'],
  ['Loja', 'gold'],
  ['Taverna', 'blue'],
  ['Grupo', 'blue'],
  ['Tela de título', 'bronze'],
];

/** The town with the shop open, as measured at 3440: the shop pinned beside the town menu, on the right. */
function Cidade({ k = 1, centro = false }: { k?: number; centro?: boolean }) {
  const { w, h } = TELAS.ultrawide;
  return (
    <Tela tela="ultrawide">
      <div className="dg-hud" style={{ width: w / k, height: h / k, transform: `scale(${k})` }}>
        <div className={`panel dg-loja${centro ? ' centro' : ''}`}>
          <div className="dg-loja-t">
            Loja <small>OURO NO BAÚ ● 0</small> ✕
          </div>
          <div className="dg-loja-abas">
            <button type="button" className="secondary" aria-pressed="true">
              Comprar
            </button>
            <button type="button" className="secondary">
              Vender (0)
            </button>
          </div>
          {LOJA.map(([nome, tipo, preco]) => (
            <div key={nome} className="dg-loja-linha">
              <span>
                {nome}
                <small>{tipo}</small>
              </span>
              <b>● {preco}</b>
              <span>
                <button type="button" className="secondary" disabled>
                  Comprar
                </button>
                <em>faltam {preco}</em>
              </span>
            </div>
          ))}
        </div>
        <div className="panel dg-vila">
          <div className="panel-head">Vila de Vauclair</div>
          <Linhas linhas={VILA} marcado={1} />
        </div>
      </div>
    </Tela>
  );
}

function Conversa({ tela, pular, texto }: { tela: TelaId; pular: boolean; texto: string }) {
  return (
    <Tela tela={tela}>
      <div className="panel dg-fala">
        <Rosto id="barbarian" />
        <div>
          <strong>Hugo</strong>
          {/* the capture cuts the line after "Volte mais": the rest of the sentence was not read */}
          <span>A forja está fria até o ferro chegar. Volte mais…</span>
          <small>
            {texto}
            {pular && (
              <button type="button" className="secondary">
                Pular
              </button>
            )}
          </small>
        </div>
      </div>
    </Tela>
  );
}

// ---------- "Voltar" drawn over a capture ----------

const MOVER: Record<TelaId, { arquivo: string; alt: string; ajuda: string; heroi: [number, number] }> = {
  ultrawide: {
    arquivo: 'C-batalha-executar-3440x1440.jpg',
    alt: 'Captura do jogo a 3440×1440: batalha com a janela Executar?',
    ajuda: AJUDA.executar,
    heroi: [1505, 690],
  },
  celular: {
    arquivo: 'D-toque-390x844-batalha-mover.jpg',
    alt: 'Captura do jogo a 390×844 com toque: mapa de Mover',
    ajuda: AJUDA.mover,
    heroi: [222, 385],
  },
  tablet: {
    arquivo: 'D-toque-820x1180-batalha-mover.jpg',
    alt: 'Captura do jogo a 820×1180 com toque: mapa de Mover',
    ajuda: AJUDA.mover,
    heroi: [410, 455],
  },
};

function Voltar({ tela, onde }: { tela: TelaId; onde: 'menu' | 'ajuda' | 'heroi' | 'nenhum' }) {
  const m = MOVER[tela];
  return (
    <Captura tela={tela} arquivo={m.arquivo} alt={m.alt}>
      {onde === 'menu' && (
        <span className="dg-voltar" role="img" aria-label="Botão Voltar ao lado do menu">
          ↩
        </span>
      )}
      {onde === 'ajuda' && (
        <div className="panel dg-chip dg-ajuda">
          <span className="dg-voltar-dentro">‹ Voltar</span>
          {m.ajuda}
        </div>
      )}
      {onde === 'heroi' && (
        <span className="dg-toque" style={{ left: m.heroi[0], top: m.heroi[1] }}>
          <span>tocar aqui volta (nada aparece no jogo)</span>
        </span>
      )}
    </Captura>
  );
}

// ---------- pieces at 100% ----------

function AmostraTexto({ rodada, dica, fps }: { rodada: number; dica?: number; fps: number }) {
  return (
    <div
      className="fft dg-amostra dg-hud"
      style={css({ '--rodada': `${rodada}px`, '--dica': `${dica ?? 11}px`, '--fps': `${fps}px` })}
    >
      <Fila linhas={3} />
      <Confirma dicas={dica !== undefined} />
      <span className="dg-fps">{FPS}</span>
      <p style={{ color: '#f4f6ff', fontSize: 16 }}>
        Etiqueta da rodada {rodada} px{dica ? ` · dica de tecla ${dica} px` : ' · sem dica de tecla no toque'} ·
        contador {fps} px
      </p>
    </div>
  );
}

function AmostraMovimento({ opcoes }: { opcoes?: [string, string][] }) {
  return (
    <div className="fft dg-amostra">
      <div className="panel dg-opcoes">
        <div className="panel-head">Opções · Vídeo e efeitos</div>
        {opcoes ? (
          <Choice label="Reduzir movimento" options={opcoes} value={opcoes.at(-1)![0]} />
        ) : (
          <p style={{ fontSize: 16 }}>Nada novo em Opções: o jogo só lê a preferência do sistema.</p>
        )}
      </div>
    </div>
  );
}

// ---------- the decisions ----------

interface Opcao {
  letra: string;
  nome: string;
  rec?: boolean;
  /** reference column (today), not something to pick */
  ref?: boolean;
  pros: string[];
  contras: string[];
}

interface Decisao {
  id: string;
  titulo: string;
  pergunta: string;
  contexto: string;
  /** where the full text is in PENDENCIAS-GRILL.md */
  origem: string;
  telas: TelaId[];
  /** label of each screen button, when it stands for something else (PC and touch) */
  rotulos?: Partial<Record<TelaId, string>>;
  momentos?: string[];
  opcoes: Opcao[];
  desenho: (letra: string, tela: TelaId, momento: string) => ReactNode;
  /** the options look the same on this screen: one drawing and why */
  igual?: (tela: TelaId, momento: string) => string | undefined;
  recorte?: (letra: string, tela: TelaId, momento: string) => Retangulo | undefined;
  /** pieces shown at 100%, outside a scaled frame */
  semMoldura?: boolean;
  nota?: string;
  recomendacao: string;
  /** the letter Fernando answered; none yet (17/11), so every item shows as open */
  resposta?: string;
}

const HOJE: Opcao = { letra: 'Hoje', nome: 'como está no jogo', ref: true, pros: [], contras: [] };
const K_ALTURA = 1440 / 1080; // option "scaled by height": 20 px up to 1080 of height, about 27 px at 1440

export const DECISOES: Decisao[] = [
  {
    id: 'hud-ultrawide',
    titulo: 'HUD no ultrawide',
    pergunta:
      'No monitor 3440×1440, o HUD cresce com a altura da tela, fica do tamanho de 1920 ou só se aproxima do centro?',
    contexto:
      'Medido a 3440×1440 (auditoria C): todas as peças ficam com o tamanho de 1920 (texto de 16 a 24 px, painéis de 672), a tira de previsão fica em x 696, longe do alvo, e a Loja fica presa à direita (x 1876 a 2976). Dedução, sem medição física: num 34" um texto de 20 px parece cerca de 16% menor que num 24" 1080p.',
    origem: 'Design system: decisões de gosto do documento, item 1',
    telas: ['ultrawide', 'celular'],
    momentos: ['Batalha', 'Cidade (Loja)'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Escalado pela altura',
        rec: true,
        pros: ['Texto e painéis do mesmo tamanho aparente em qualquer monitor.'],
        contras: ['Mexe em todos os tokens de tamanho.', 'Precisa conferir 1280×720 e 1920×1080 de novo.'],
      },
      {
        letra: 'B',
        nome: 'Px fixos (como hoje)',
        pros: ['Zero trabalho.'],
        contras: ['No ultrawide o HUD fica pequeno e espalhado.'],
      },
      {
        letra: 'C',
        nome: 'Px fixos, tira e janela aproximadas',
        pros: ['Pouco CSS, reversível.'],
        contras: ['Não resolve o texto pequeno.'],
      },
    ],
    desenho: (l, tela, m) => {
      if (tela === 'celular')
        return m === 'Batalha' ? (
          <Captura tela={tela} arquivo="C-batalha-executar-390x844.jpg" alt="Captura do jogo a 390×844: Executar?" />
        ) : (
          <Captura tela={tela} arquivo="C-cidade-loja-390x844.jpg" alt="Captura do jogo a 390×844: Loja" />
        );
      const k = l === 'A' ? K_ALTURA : 1;
      return m === 'Batalha' ? (
        <Hud tela={tela} estado="executar" k={k} tiraCentro={l === 'C'} />
      ) : (
        <Cidade k={k} centro={l === 'C'} />
      );
    },
    igual: (tela) =>
      tela === 'celular'
        ? 'No celular as três opções são iguais a hoje (captura real): a opção A só cresce acima de 1080 px de altura e a C só vale acima de 2560 px de largura.'
        : undefined,
    recorte: (l, tela, m) => {
      if (tela !== 'ultrawide') return undefined;
      if (m === 'Batalha') return [l === 'C' ? 960 : 0, 1200, 1500, 240];
      // the shop's top left corner in each option
      return [l === 'A' ? 1340 : l === 'C' ? 918 : 1856, 0, 1200, 300];
    },
    nota: 'A opção A está desenhada com fontes e larguras multiplicadas por 1440/1080 (20 px viram ~27 px). A pendência recomenda começar só pelas fontes; larguras junto é a versão completa da opção.',
    recomendacao:
      'Começando só pelas fontes: você joga num ultrawide e o tamanho do texto é o que mais pesa (dedução).',
  },
  {
    id: 'texto-minimo',
    titulo: 'Texto mínimo',
    pergunta: 'O menor texto do jogo é 16 px no PC e 14 px no toque, ou 16 px em tudo, sem exceção?',
    contexto:
      'O documento dizia 16 px com exceções de 11 e 12 px. A regra de toque pede 14 px e nada de 12 px no toque. Hoje a etiqueta de rodada da fila (12 px) e o contador de fps (12 px) aparecem no toque; a dica de tecla (11 px) só aparece com teclado e mouse (medido, auditoria D).',
    origem: 'Design system: decisões de gosto do documento, item 2',
    telas: ['ultrawide', 'celular'],
    rotulos: { ultrawide: 'PC (teclado e mouse)', celular: 'Toque (tablet e celular)' },
    semMoldura: true,
    opcoes: [
      {
        letra: 'A',
        nome: '16 px no PC, 14 px no toque',
        rec: true,
        pros: ['Mantém o PC como está.', 'Protege o tablet: nada abaixo de 14 px no toque.'],
        contras: ['Duas regras.'],
      },
      {
        letra: 'B',
        nome: '16 px em tudo',
        pros: ['Uma regra só.'],
        contras: ['A dica de tecla de 11 px e a etiqueta de rodada precisam crescer e ocupam espaço na fila.'],
      },
      HOJE,
    ],
    desenho: (l, tela) => {
      const toque = tela === 'celular';
      if (l === 'B') return <AmostraTexto rodada={16} dica={toque ? undefined : 16} fps={16} />;
      if (l === 'A' && toque) return <AmostraTexto rodada={14} fps={14} />;
      return <AmostraTexto rodada={12} dica={toque ? undefined : 11} fps={12} />;
    },
    nota: 'As peças estão em tamanho real (100%). Na opção A o PC fica igual a hoje: as exceções de 11 e 12 px continuam valendo só com teclado e mouse.',
    recomendacao: 'É a recomendação da pendência, sem motivo extra escrito lá.',
  },
  {
    id: 'losango-inimigo',
    titulo: 'Cor do ◆ do inimigo no painel azul',
    pergunta: 'O ◆ do inimigo sobre o painel azul fica no vermelho de hoje ou no rosa claro que passa no contraste?',
    contexto:
      'Calculado pela auditoria B: o vermelho de hoje (#e0525a) sobre o azul do painel dá 2,2:1 e a faixa lateral 2,6:1, abaixo de 3:1 para uma marca. A palavra INIMIGO ao lado carrega o lado, então a regra "cor nunca sozinha" é cumprida. O rosa claro (#ff9aa2, 4,1:1) já é usado na metade vinho da tira de previsão.',
    origem: 'Design system: decisões de gosto do documento, item 3',
    telas: ['ultrawide', 'celular'],
    opcoes: [
      {
        letra: 'B',
        nome: '◆ em rosa claro (--enemy-hi), faixa lateral mantida',
        rec: true,
        pros: ['A marca passa de 3:1 (4,1:1).'],
        contras: ['O inimigo fica rosado no painel azul.'],
      },
      {
        letra: 'A',
        nome: 'Manter o vermelho de hoje (--enemy)',
        pros: ['É o tom atual do inimigo.'],
        contras: ['Marca abaixo de 3:1 (2,2:1).'],
      },
    ],
    desenho: (l, tela) => <Hud tela={tela} estado="menu" alvo marca={l === 'B' ? '#ff9aa2' : undefined} />,
    recorte: (_l, tela) => (tela === 'ultrawide' ? [2744, 1290, 696, 150] : undefined),
    nota: 'O desenho troca o ◆ da ficha e também o ◆ da fila de turnos, que fica sobre o mesmo azul; a pendência fala só do "painel azul", a fila é dedução minha. No celular a ficha está na largura da tela (ajuste da auditoria C, ainda fora do jogo).',
    recomendacao: 'Só no ◆ (texto pequeno), mantendo a faixa lateral, que é decorativa.',
  },
  {
    id: 'vidro',
    titulo: 'Vidro nos painéis',
    pergunta:
      'O vidro dos painéis fica como foi feito (opcional, com véu escuro forte), ganha um véu mais fraco ou sai?',
    contexto:
      'Opções > Vídeo e efeitos ganhou "Opacidade dos painéis" (40 a 100%) e "Desfoque" (Desligado, Leve 6 px, Forte 12 px). O padrão 100% é o visual de hoje. Abaixo de 100% entra uma camada escura de 75% para segurar o contraste até num céu branco; por isso o cenário aparece pouco. O desfoque fica desligado no toque. As duas entradas da pendência discordam sobre onde o código está (worktree sem commit ou commit 7468a5e no master local); o desenho segue o glass.ts do commit 7468a5e.',
    origem: 'Design system: decisões de gosto, item 4; e Interface (16/11, noite): vidro dos painéis, itens 1 a 3',
    telas: ['ultrawide', 'celular'],
    momentos: ['Cena escura', 'Céu claro (pior caso)'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Como foi feito: vidro opcional, véu de 75%',
        rec: true,
        pros: ['Contraste garantido até num céu branco.', 'O padrão 100% é o visual de hoje; reversível.'],
        contras: ['Pouco "vidro": abaixo de ~70% parece vidro escuro, não azul claro.'],
      },
      {
        letra: 'B',
        nome: 'Véu mais fraco',
        pros: ['O vidro aparece de verdade.'],
        contras: ['A garantia de 4,5:1 fica mais frágil num céu muito claro.'],
      },
      {
        letra: 'C',
        nome: 'Descartar o vidro (painel opaco)',
        pros: ['Nada a manter.'],
        contras: ['Perde a opção pedida em 16/11.'],
      },
    ],
    desenho: (l, tela, m) => (
      <Hud
        tela={tela}
        estado="menu"
        sub={tela === 'celular' ? 'nenhum' : 'lado'}
        fundo={m === 'Cena escura' ? 'cena' : 'ceu'}
        vidro={l === 'C' ? undefined : { alpha: 60, veu: l === 'A' ? 75 : 40, blur: tela === 'celular' ? 0 : 6 }}
      />
    ),
    recorte: (_l, tela) => (tela === 'ultrawide' ? [1860, 230, 940, 340] : undefined),
    nota: 'A e B estão desenhadas com o slider em 60% e desfoque Leve (a predefinição "Vidro" proposta na pendência); no celular sem desfoque, como no jogo. O véu de 40% da opção B é um valor de exemplo meu: a pendência só diz "mais fraca, calibrada para a cena mais clara". O "pró" e o "contra" da opção C são dedução minha. Se gostar do efeito, a pendência pergunta também se entra um botão "Vidro" (60% + Leve) e se o mínimo do slider fica em 40%.',
    recomendacao: 'Manter o véu de 75% até você ver na tela; revisar e juntar, com o padrão em 100%.',
  },
  {
    id: 'tablet-alvo',
    titulo: 'Tablet como alvo',
    pergunta: 'O tablet jogável vira regra do design system, ou só se destrava o que trava hoje?',
    contexto:
      'Três textos dizem que o celular "só precisa abrir" (PC first). Medido em 16/11: no tablet o jogo trava na batalha porque não há voltar na tela; os botões Comprar e Recrutar têm 36 px de altura e dois textos têm 12 px.',
    origem: 'Toque e tablet, item 1',
    telas: ['tablet', 'celular', 'ultrawide'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Tablet jogável vira regra',
        rec: true,
        pros: ['Atende o pedido de 16/11.', 'Cada tela nova já nasce com 44 px, 14 px e sem hover.'],
        contras: [
          'Toda mudança de interface passa a ter mais um teste (as medidas de toque).',
          'Cerca de 9 correções de interface, 3 delas urgentes.',
        ],
      },
      {
        letra: 'B',
        nome: 'Só destravar agora',
        pros: ['Pouco trabalho: corrige os 3 bloqueios e mantém "PC first".'],
        contras: ['O próximo componente pode quebrar o toque de novo.'],
      },
      {
        letra: 'C',
        nome: 'Manter como está',
        pros: [],
        contras: ['O tablet continua injogável.'],
      },
    ],
    desenho: (l, tela) => <Voltar tela={tela} onde={l === 'C' || tela === 'ultrawide' ? 'nenhum' : 'menu'} />,
    igual: (tela) =>
      tela === 'ultrawide' ? 'No PC nada muda em nenhuma das três opções (captura real a 3440×1440).' : undefined,
    nota: 'Captura real com o botão Voltar desenhado por cima (no lugar da recomendação da próxima seção). Na batalha, A e B ficam iguais; a diferença de A é a regra para as outras telas: por exemplo, o botão Comprar passa de 112×36 para 112×44 px e a etiqueta de rodada de 12 para 14 px.',
    recomendacao: 'O bloqueio principal (o voltar) é um botão só, e a regra escrita evita que volte a acontecer.',
  },
  {
    id: 'botao-voltar',
    titulo: 'Lugar do botão Voltar na batalha',
    pergunta:
      'Onde fica o Voltar dos mapas de Mover e de Agir: ao lado do ☰, dentro da faixa de ajuda ou tocando no herói?',
    contexto:
      'Nos mapas de Mover e de Agir o único controle visível é o ☰, e o toque longo não volta (medido). A ação cancel() já existe no HUD, mas nenhum controle a chama (lido). Quem entra num modo por engano só sai gastando o movimento ou a ação (dedução).',
    origem: 'Toque e tablet, item 2',
    telas: ['celular', 'tablet', 'ultrawide'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Botão fixo ao lado do ☰',
        rec: true,
        pros: ['Um lugar só, igual em todas as telas.', 'Perto do ☰ que ela já usa.'],
        contras: ['Longe do personagem e do dedo da mão que segura o tablet.'],
      },
      {
        letra: 'B',
        nome: 'Dentro da faixa de ajuda do topo',
        pros: ['O voltar fica junto da instrução.'],
        contras: ['A faixa muda de largura e fica mais cheia no celular.'],
      },
      {
        letra: 'C',
        nome: 'Tocar no próprio herói',
        pros: ['Nada novo na tela.'],
        contras: ['Invisível: ninguém descobre.', 'Hoje esse toque só limpa o tile marcado.'],
      },
    ],
    desenho: (l, tela) => <Voltar tela={tela} onde={l === 'A' ? 'menu' : l === 'B' ? 'ajuda' : 'heroi'} />,
    recorte: (l, tela) =>
      tela !== 'ultrawide'
        ? undefined
        : l === 'A'
          ? [2900, 0, 540, 110]
          : l === 'B'
            ? [1440, 0, 560, 110]
            : [1245, 560, 520, 300],
    nota: 'Capturas reais com a peça nova desenhada por cima. No celular, o botão da opção A (x 282 a 326) encosta 11 px na faixa de ajuda de hoje (até x 293): visto no desenho, não medido no jogo. O anel tracejado da opção C só marca onde seria o toque; no jogo não apareceria nada. No PC o Esc já volta; a captura de 3440 mostra onde o botão ficaria se também aparecer com mouse.',
    recomendacao: 'É visível, previsível e reaproveita o botão de ícone de 44 px (dedução da pendência).',
  },
  {
    id: 'celular-em-pe',
    titulo: 'Celular em pé',
    pergunta: 'No celular em pé o jogo se ajusta, pede para girar ou fica como está por enquanto?',
    contexto:
      'Em 390×844 quase tudo funciona, mas o submenu de habilidades sai da tela (184 a 504 px numa tela de 390) e a expedição esconde o "Voltar à cidade" (y 1106 numa tela de 844) (medido).',
    origem: 'Toque e tablet, item 3',
    telas: ['celular', 'ultrawide'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Ajustar: submenu no lugar do menu',
        rec: true,
        pros: ['O celular fica jogável sem aviso.'],
        contras: ['Mais um caso de layout para manter.'],
      },
      {
        letra: 'B',
        nome: 'Aviso "Gire o celular"',
        pros: ['Um aviso só.'],
        contras: ['Deitado (844×390) a tela tem 390 de altura e cai na faixa "tela baixa", não testada.'],
      },
      {
        letra: 'C',
        nome: 'Ignorar o celular por enquanto',
        pros: ['Foco no tablet.'],
        contras: ['O submenu continua cortado (captura real).'],
      },
    ],
    desenho: (l, tela) => {
      if (tela === 'ultrawide')
        return (
          <Captura
            tela={tela}
            arquivo="C-batalha-submenu-3440x1440.jpg"
            alt="Captura do jogo a 3440×1440: submenu de habilidades"
          />
        );
      if (l === 'C')
        return (
          <Captura
            tela={tela}
            arquivo="D-toque-390x844-batalha-habilidades.jpg"
            alt="Captura do jogo a 390×844: submenu de habilidades cortado na borda direita"
          />
        );
      return (
        <Hud tela={tela} estado="menu" sub={l === 'A' ? 'lugar' : 'lado'}>
          {l === 'B' && (
            <div className="dg-girar">
              <div className="panel">Gire o celular para jogar.</div>
            </div>
          )}
        </Hud>
      );
    },
    igual: (tela) =>
      tela === 'ultrawide'
        ? 'No ultrawide nada muda nas três opções: a regra só vale abaixo de 600 px de largura.'
        : undefined,
    nota: 'A e B são desenhos sobre uma cena limpa; C é a captura real. O texto do aviso da opção B é meu (a pendência só diz "Gire o celular"). A opção A inclui também a janela da expedição rolar por dentro, que não está desenhada. O "pró" e o "contra" da opção C são dedução minha: a pendência não lista nenhum.',
    recomendacao: 'São duas regras de CSS e posição, e o resto do fluxo já passou no celular.',
  },
  {
    id: 'contador-fps',
    titulo: 'Contador de fps',
    pergunta: 'O contador de fps nasce desligado em todo lugar, desligado só no toque ou continua ligado?',
    contexto:
      'O contador aparece em toda batalha, só desliga pelo F3 e no celular cobre a faixa de ajuda (lido e medido). Tem 12 px de letra e contraste de 4,08 sobre o céu branco (calculado).',
    origem: 'Toque e tablet, item 4',
    telas: ['ultrawide', 'celular'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Desligado de fábrica, item no ☰ para ligar',
        rec: true,
        pros: ['Tela limpa para quem joga.', 'O desenvolvedor liga quando quer.'],
        contras: ['Um item a mais no ☰.'],
      },
      {
        letra: 'B',
        nome: 'Desligado só no toque',
        pros: ['No PC nada muda.'],
        contras: ['Duas regras para a mesma peça.'],
      },
      {
        letra: 'C',
        nome: 'Manter ligado',
        pros: [],
        contras: ['No celular continua cobrindo a faixa de ajuda.'],
      },
    ],
    desenho: (l, tela) => <Hud tela={tela} estado="mover" fps={l === 'C' || (l === 'B' && tela === 'ultrawide')} />,
    recorte: (_l, tela) => (tela === 'ultrawide' ? [2900, 0, 540, 180] : undefined),
    nota: 'O item novo do ☰ (opção A) não está desenhado. O "contra" da opção C é o que a auditoria mediu, não está na lista da pendência.',
    recomendacao: 'O contador é ferramenta de desenvolvimento.',
  },
  {
    id: 'pular-conversa',
    titulo: 'Pular conversa no toque',
    pergunta: 'No toque, a conversa ganha um botão Pular, pula com toque longo ou não pula?',
    contexto:
      'A caixa de fala avança a cada toque, mas pular a conversa inteira só funciona com Esc. O texto da caixa diz "Enter segue · Esc pula" também no tablet (lido e medido).',
    origem: 'Toque e tablet, item 5',
    telas: ['celular', 'ultrawide'],
    opcoes: [
      {
        letra: 'A',
        nome: 'Botão "Pular" de 44 px e "Toque para seguir"',
        rec: true,
        pros: ['Claro.'],
        contras: ['Mais um botão na caixa.'],
      },
      {
        letra: 'B',
        nome: 'Toque longo pula',
        pros: ['Nada novo na tela.'],
        contras: ['Invisível.', 'No iPad o toque longo pode abrir outra coisa.'],
      },
      {
        letra: 'C',
        nome: 'Sem pular no toque',
        pros: [],
        contras: [],
      },
    ],
    desenho: (l, tela) =>
      tela === 'ultrawide' || l === 'A' ? (
        <Conversa
          tela={tela}
          pular={tela === 'celular'}
          texto={tela === 'celular' ? 'Toque para seguir' : 'Enter segue · Esc pula'}
        />
      ) : (
        <Captura
          tela={tela}
          arquivo="D-toque-390x844-conversa.jpg"
          alt='Captura do jogo a 390×844: caixa de conversa com o texto "Enter segue · Esc pula"'
        />
      ),
    igual: (tela) =>
      tela === 'ultrawide'
        ? 'No PC nada muda nas três opções: Enter segue e Esc pula (caixa redesenhada, não é captura).'
        : undefined,
    nota: 'A é um desenho; B e C mostram a captura real de hoje, porque nada muda na tela (a pendência não diz se o texto "Enter segue · Esc pula" mudaria nessas duas). O rosto do desenho é o pixel art do lab, não o rosto pintado do jogo, e a fala está cortada onde a captura corta.',
    recomendacao: 'Segue a regra "nada só no teclado" da seção nova de toque.',
  },
  {
    id: 'reduzir-movimento',
    titulo: 'Reduzir movimento',
    pergunta:
      'O jogo reduz o movimento sozinho pela preferência do sistema, ganha também um item em Opções, ou só o item?',
    contexto:
      'O design system diz que com prefers-reduced-motion nada anima, mas a cena não consulta a preferência: tremor de câmera, tremor do alvo, giro e zoom da câmera de ação e o salto do número seguem iguais (lido no código). O lab pede câmera lenta com zoom em toda morte, com opção para desligar.',
    origem: 'Game feel no toque e em tela pequena, item 5',
    telas: ['ultrawide', 'celular'],
    rotulos: { ultrawide: 'PC', celular: 'Toque' },
    semMoldura: true,
    opcoes: [
      {
        letra: 'B',
        nome: 'Automático + item em Opções (Sim / Não / Do sistema)',
        rec: true,
        pros: ['Um só lugar para tudo que mexe a tela.', 'O lab já pede um item para a câmera lenta.'],
        contras: ['Mais um campo salvo.'],
      },
      {
        letra: 'A',
        nome: 'Só automático, pela preferência do sistema',
        pros: ['Cumpre o design system sem tela nova.'],
        contras: ['Quem tem a preferência ligada por outro motivo perde o "peso" sem saber por quê.'],
      },
      {
        letra: 'C',
        nome: 'Só o item em Opções, sem ler o sistema',
        pros: ['Nada automático.'],
        contras: ['Contradiz o design system.'],
      },
    ],
    desenho: (l) =>
      l === 'A' ? (
        <AmostraMovimento />
      ) : (
        <AmostraMovimento
          opcoes={
            l === 'B'
              ? [
                  ['s', 'Sim'],
                  ['n', 'Não'],
                  ['sis', 'Do sistema'],
                ]
              : [
                  ['s', 'Sim'],
                  ['n', 'Não'],
                ]
          }
        />
      ),
    nota: 'Peça em tamanho real, igual no PC e no toque. Perfil reduzido (o mesmo nas três opções): a pausa do impacto fica; tremor de câmera e do alvo zerados (só o clarão branco); câmera de ação sem giro nem zoom; câmera lenta da morte desligada; o número só aparece e some. Em B o padrão é "Do sistema"; em C a pendência não diz o padrão ("Não" marcado é escolha do desenho).',
    recomendacao: 'Junta o pedido do lab (desligar a câmera lenta) e a regra do design system num item só.',
  },
];

// ---------- page ----------

const BOTAO =
  'min-h-11 cursor-pointer border border-borda bg-folha px-3.5 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-couro aria-pressed:bg-couro aria-pressed:text-sobre-tinta';

function Escolha<T extends string>({
  rotulo,
  itens,
  valor,
  onPick,
}: {
  rotulo: string;
  itens: [T, string][];
  valor: T;
  onPick: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-bold tracking-wide text-apagado uppercase">{rotulo}</span>
      {itens.map(([v, texto]) => (
        <button key={v} type="button" aria-pressed={v === valor} onClick={() => onPick(v)} className={BOTAO}>
          {texto}
        </button>
      ))}
    </div>
  );
}

const Lista = ({ titulo, itens }: { titulo: string; itens: string[] }) =>
  itens.length > 0 && (
    <div>
      <strong>{titulo}</strong>
      <ul className="m-0 list-disc pl-5">
        {itens.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );

function Secao({ d, n }: { d: Decisao; n: number }) {
  const [tela, setTela] = useState(d.telas[0]!);
  const [momento, setMomento] = useState(d.momentos?.[0] ?? '');
  const igual = d.igual?.(tela, momento);
  const rec = d.opcoes.find((o) => o.rec)!;
  const desenhar = (o: Opcao) => {
    const peca = d.desenho(o.letra, tela, momento);
    const r = d.recorte?.(o.letra, tela, momento);
    return d.semMoldura ? (
      peca
    ) : (
      <>
        <Moldura tela={tela}>{peca}</Moldura>
        {r && (
          <Recorte tela={tela} r={r}>
            {peca}
          </Recorte>
        )}
      </>
    );
  };
  return (
    <section id={d.id} aria-label={d.titulo} className="grid min-w-0 gap-4 border-t border-borda pt-6">
      <h2 className="m-0 font-serif text-[28px] leading-tight font-bold">
        {n}. {d.titulo}
      </h2>
      <p className="m-0 max-w-[80ch] text-[19px] font-bold">{d.pergunta}</p>
      <p className="m-0 max-w-[80ch] text-[16px] text-apagado">
        {d.contexto} <em>Texto completo em PENDENCIAS-GRILL.md: «{d.origem}».</em>
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-2">
        <Escolha
          rotulo="Tela"
          itens={d.telas.map((t): [TelaId, string] => [
            t,
            d.rotulos?.[t] ?? `${TELAS[t].nome} ${TELAS[t].w}×${TELAS[t].h}`,
          ])}
          valor={tela}
          onPick={setTela}
        />
        {d.momentos && (
          <Escolha
            rotulo="Momento"
            itens={d.momentos.map((m): [string, string] => [m, m])}
            valor={momento}
            onPick={setMomento}
          />
        )}
      </div>
      {igual && (
        <div className="grid min-w-0 gap-2">
          <p className="m-0 max-w-[80ch] border-l-[6px] border-borda bg-folha px-4 py-2 text-[16px]">{igual}</p>
          {desenhar(rec)}
        </div>
      )}
      <div
        className="grid min-w-0 items-start gap-6"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${tela === 'ultrawide' && !d.semMoldura ? 720 : 320}px), 1fr))`,
        }}
      >
        {d.opcoes.map((o) => (
          <article
            key={o.letra}
            aria-label={o.ref ? 'Hoje' : `Opção ${o.letra}`}
            className="grid min-w-0 content-start gap-3"
          >
            <h3 className="m-0 flex flex-wrap items-center gap-2 text-[19px] font-bold">
              {o.ref ? 'Hoje' : `Opção ${o.letra}`} · {o.nome}
              {o.rec && (
                <span className="bg-couro px-2 py-0.5 text-[14px] font-bold text-sobre-tinta">Recomendada</span>
              )}
            </h3>
            {!igual && desenhar(o)}
            <div className="grid gap-2 text-[16px]">
              <Lista titulo="Prós" itens={o.pros} />
              <Lista titulo="Contras" itens={o.contras} />
            </div>
          </article>
        ))}
      </div>
      {d.nota && <p className="m-0 max-w-[80ch] text-[15px] text-apagado">Sobre o desenho: {d.nota}</p>}
      <div className="max-w-[80ch] border-l-[6px] border-lab bg-lab-soft px-5 py-3 text-[17px]">
        <strong>Recomendação: Opção {rec.letra}.</strong> {d.recomendacao}
        <br />
        Para responder no chat:{' '}
        <strong>
          «{d.titulo}: Opção {rec.letra}»
        </strong>{' '}
        (troque a letra se preferir outra).
      </div>
    </section>
  );
}

export function DecisoesDeGosto() {
  useEffect(() => carregarFonte(FONTE_FFT), []);
  return (
    <div className="grid min-w-0 gap-8">
      <p className="m-0 max-w-[80ch] text-[17px]">
        {DECISOES.length} decisões de gosto pendentes da interface do jogo. Em cada uma, as opções estão desenhadas lado
        a lado; troque a tela no seletor e responda só com a letra. Nada aqui mudou o jogo.
      </p>
      <nav aria-label="Índice das decisões">
        <ol className="m-0 grid list-none gap-1 p-0">
          {DECISOES.map((d, i) => (
            <li key={d.id}>
              {/* the lab's router keeps an unknown hash (not in linksAntigos) as an in-page anchor */}
              <a href={`#${d.id}`} className="inline-flex min-h-11 items-center gap-2 text-[16px]">
                {i + 1}. {d.titulo}
                <span
                  className={`px-2 py-0.5 text-[16px] font-bold ${d.resposta ? 'bg-sucesso-suave text-sucesso' : 'bg-aviso-suave text-aviso'}`}
                >
                  {d.resposta ? `respondida: ${d.resposta}` : 'aberta'}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      {DECISOES.map((d, i) => (
        <Secao key={d.id} d={d} n={i + 1} />
      ))}
    </div>
  );
}
