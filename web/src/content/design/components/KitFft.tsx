// "FFT Clássico" kit (Fernando's pick, 14/11): navy gradient panels, thin light border, plain white text and pixel-art
// portraits, small over the scene (~17-20% of the screen). Same piece names and classes as the game (design-system.md).
// Ported from dungeon-tactics-lab/design/src/fft-kit.ts (DOM) to JSX with the same markup; the CSS (fft-kit.css) hangs
// on .fft and fft-* classes only, so nothing leaks into the app.
import './fft-kit.css';
import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { ASSETS, carregarFonte, FONTE_FFT, mouthFrame } from '../dados';

// the game's sprite (public/icons.svg, game-icons.net CC BY 3.0) copied next to the lab images
const SPRITE = `${ASSETS}/icons.svg`;
const css = (v: Record<string, string>) => v as CSSProperties;

// approved ability icons (32 px atlas, 6 columns); what is not in the atlas falls back to the game's game-icons sprite
const ATLAS: Record<string, number> = {
  'knife-thrust': 0,
  flail: 1,
  'checked-shield': 2,
  cycle: 3,
  'on-target': 6,
  'fire-ray': 12,
  'chalice-drops': 15,
  'wind-slap': 14,
  run: 22,
  'pocket-watch': 23,
};
function Icon({ id }: { id: string }) {
  const n = ATLAS[id];
  if (n !== undefined)
    return (
      <span
        className="gi"
        aria-hidden="true"
        style={{
          background: `url(${ASSETS}/ia/icones/atlas-32.png) -${(n % 6) * 32}px -${Math.floor(n / 6) * 32}px/192px 128px no-repeat`,
          imageRendering: 'pixelated',
        }}
      />
    );
  return (
    <svg className="gi" viewBox="0 0 512 512" aria-hidden="true">
      <use href={`${SPRITE}#${id}`} />
    </svg>
  );
}
const IconButton = ({ name, children }: { name: string; children: ReactNode }) => (
  <button type="button" className="icon" title={name} aria-label={name}>
    {children}
  </button>
);
const Kbd = ({ k }: { k: string }) => (
  <span className="kbd" aria-hidden="true">
    {k}
  </span>
);

// ---------- portrait with an animated mouth ----------

// the game's real faces (chars/px, 4 frames per sheet); the speakers are the mage and the barbarian
const px = (id: string) => `url(${ASSETS}/chars/px/${id}.png)`;
const SHEETS = {
  aria: px('ranger'),
  tess: px('mage'),
  odo: px('barbarian'),
  lacaio: px('skeleton_minion'),
  acolito: px('rogue_hooded'),
};
type Who = keyof typeof SHEETS;

// the game's portrait(), now in pixel art: the sheet is the background and --q picks the frame
function Portrait({ who, size = 'md', q = 0 }: { who: Who; size?: 'sm' | 'md' | 'lg'; q?: number }) {
  return (
    <span className={`portrait ${size}`} style={css({ '--sheet': SHEETS[who], '--q': String(q) })} aria-hidden="true" />
  );
}

// ---------- bars, unit card, queue, forecast ----------

type Change = { from: number; to: number; kind: 'loss' | 'gain' };
// the game's gauge(); max 0 gives an empty bar (it used to draw width:NaN% and look full)
function Gauge({
  cls,
  label,
  value,
  max,
  change,
}: {
  cls: string;
  label: string;
  value: number;
  max: number;
  change?: Change;
}) {
  const pct = (v: number) => (max > 0 ? Math.round(Math.max(0, Math.min(1, v / max)) * 100) : 0);
  return (
    <div className={`gauge ${cls}`}>
      <span className="gauge-label">{label}</span>
      <span className="gauge-bar">
        <i style={{ width: `${pct(value)}%` }} />
        {change && (
          <b
            className={`gauge-change ${change.kind}`}
            style={{ left: `${pct(change.from)}%`, width: `${pct(change.to) - pct(change.from)}%` }}
          />
        )}
      </span>
      <span className="gauge-num">
        {Math.max(0, value)}/{max}
      </span>
    </div>
  );
}

interface Unit {
  who: Who;
  name: string;
  cls: string;
  team: 'hero' | 'enemy';
  hp: [number, number];
  mp?: [number, number];
  ct?: number;
}
const ARIA: Unit = { who: 'aria', name: 'Aria', cls: 'Guerreira', team: 'hero', hp: [42, 42], mp: [8, 12], ct: 100 };
const LACAIO: Unit = { who: 'lacaio', name: 'Lacaio de osso', cls: 'Morto-vivo', team: 'enemy', hp: [31, 38], ct: 40 };

function UnitPanel({ u }: { u: Unit }) {
  return (
    <div className={`panel unit-panel ${u.team}`}>
      <Portrait who={u.who} size="lg" />
      <div className="unit-body">
        <strong className="unit-name">
          {u.name}
          <span className="unit-side">{u.team === 'hero' ? 'Aliada' : 'Inimigo'}</span>
        </strong>
        <span className="unit-class">{u.cls}</span>
        <Gauge cls="hp" label="VIDA" value={u.hp[0]} max={u.hp[1]} />
        {u.mp && <Gauge cls="mp" label="MP" value={u.mp[0]} max={u.mp[1]} />}
        {u.ct !== undefined && <Gauge cls="ct" label="CT" value={u.ct} max={100} />}
      </div>
    </div>
  );
}

// FFT turn queue: a narrow column on the left; side by colour AND shape (● ally, ◆ enemy), never colour alone
const QUEUE: [Who, string, Unit['team']][] = [
  ['aria', 'Aria', 'hero'],
  ['lacaio', 'Lacaio', 'enemy'],
  ['tess', 'Tess', 'hero'],
  ['odo', 'Odo', 'hero'],
  ['acolito', 'Acólito', 'enemy'],
];
const Queue = () => (
  <ol className="panel queue" aria-label="Ordem dos turnos">
    {QUEUE.map(([who, name, team], i) => (
      <li
        key={who}
        className={`queue-row ${team}${i === 0 ? ' now' : ''}`}
        aria-label={`${i === 0 ? 'Agora' : `${i}º`}: ${name}, ${team === 'hero' ? 'aliado' : 'inimigo'}`}
      >
        <span className="queue-n" aria-hidden="true">
          {i === 0 ? 'AGORA' : String(i)}
        </span>
        <Portrait who={who} size="sm" />
        <span className="queue-name" aria-hidden="true">
          <i>{team === 'hero' ? '●' : '◆'}</i>
          {name}
        </span>
      </li>
    ))}
  </ol>
);

// forecast strip (strike): action and numbers on the ally side, target with VIDA and the part the blow takes in stripes
const Strike = () => (
  <div
    className="strike"
    role="status"
    aria-label="Previsão: Golpe pesado no Lacaio de osso, 19 a 26 de dano, 75% de acerto, vida 31 vai a 5 a 12"
  >
    <div className="strike-main">
      <Portrait who="aria" />
      <div>
        <span className="strike-info">Golpe pesado</span>
        <span className="strike-row">
          <strong className="strike-pts">−19 a 26</strong>
          <span className="strike-hit">
            75%<small> acerto</small>
          </span>
        </span>
      </div>
    </div>
    <div className="strike-target">
      <div>
        <span className="strike-info">
          Lacaio de osso<span className="unit-side">Inimigo</span>
        </span>
        <Gauge cls="hp" label="VIDA" value={31} max={38} change={{ from: 5, to: 31, kind: 'loss' }} />
        <span className="strike-hp">31 → 5 a 12</span>
      </div>
      <Portrait who="lacaio" />
    </div>
  </div>
);

// ---------- command menu and submenu ----------

interface Row {
  label: string;
  icon?: string;
  orb?: 'gold' | 'blue' | 'bronze';
  cost?: string;
  state?: 'focus' | 'disabled' | 'picked';
  why?: string;
}
// the game's .panel .item; arrows move the focus between rows, and mouse and keyboard move the same .focus mark
function Menu({ cls, title, rows }: { cls: string; title: string; rows: Row[] }) {
  const [foco, setFoco] = useState(rows.findIndex((r) => r.state === 'focus'));
  return (
    <div
      className={`panel ${cls}`}
      role="menu"
      aria-label={title}
      onKeyDown={(e) => {
        const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        const items = [...e.currentTarget.querySelectorAll<HTMLElement>('.item')];
        items[(items.indexOf(document.activeElement as HTMLElement) + d + items.length) % items.length]!.focus();
      }}
    >
      <div className="panel-head">{title}</div>
      {rows.map((r, i) => (
        <button
          key={r.label}
          type="button"
          className={`item${i === foco ? ' focus' : ''}${r.state === 'picked' ? ' picked' : ''}`}
          role="menuitem"
          aria-disabled={r.state === 'disabled' ? true : undefined}
          aria-expanded={r.state === 'picked' ? true : undefined}
          onFocus={() => setFoco(i)}
        >
          {r.icon ? (
            <Icon id={r.icon} />
          ) : (
            <span className={`orb ${r.state === 'disabled' ? 'off' : (r.orb ?? 'blue')}`} aria-hidden="true" />
          )}
          <span className="item-label">{r.label}</span>
          {r.why && <span className="item-why">{r.why}</span>}
          {r.cost && <span className="item-cost">{r.cost}</span>}
        </button>
      ))}
    </div>
  );
}
const COMMANDS: Row[] = [
  { label: 'Mover', orb: 'gold', state: 'disabled', why: 'já moveu' },
  { label: 'Agir', state: 'focus' },
  { label: 'Esperar', orb: 'bronze' },
  { label: 'Status', orb: 'gold' },
];
const ABILITIES: Row[] = [
  { label: 'Golpe', icon: 'knife-thrust', cost: '—' },
  { label: 'Golpe pesado', icon: 'flail', cost: '3 MP', state: 'focus' },
  { label: 'Escudada', icon: 'checked-shield', cost: '4 MP' },
  { label: 'Giro', icon: 'cycle', cost: '10 MP', state: 'disabled', why: 'faltam 2' },
];

// ---------- smaller pieces ----------

// the game's choice() and slider()
function Choice<T extends string>({ label, options, value }: { label: string; options: [T, string][]; value: T }) {
  const [v, setV] = useState(value);
  return (
    <div className="choice" role="group" aria-label={label}>
      <span className="choice-label">{label}</span>
      <div className="choice-row">
        {options.map(([o, text]) => (
          <button key={o} type="button" className="secondary" aria-pressed={o === v} onClick={() => setV(o)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
function Slider({ label, value }: { label: string; value: number }) {
  const [v, setV] = useState(value);
  return (
    <label className="slider">
      <span className="choice-label">{label}</span>
      <span className="slider-row">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={v}
          aria-valuetext={`${v}%`}
          onChange={(e) => setV(Number(e.target.value))}
        />
        <output className="slider-value">{v}%</output>
      </span>
    </label>
  );
}

// tip: a new piece (the game only uses title); opens on hover and on the target's focus, tied by aria-describedby
function Tip({ icone, name, text, open = false }: { icone: string; name: string; text: string; open?: boolean }) {
  const id = useId();
  return (
    <span className={`has-tip${open ? ' open' : ''}`}>
      <button type="button" className="icon" title={name} aria-label={name} aria-describedby={id}>
        <Icon id={icone} />
      </button>
      <span className="panel tip" role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}

const Counter = ({ cls, label, value }: { cls: string; label: string; value: string }) => (
  <div className={`panel counter ${cls}`}>
    <span className="counter-label">{label}</span>
    <strong>{value}</strong>
  </div>
);

// charge meter (a CT charged action): one cell per tick, the ones already gone filled
const Charge = ({ ability, ticks, done }: { ability: string; ticks: number; done: number }) => (
  <div
    className="panel charge"
    role="meter"
    aria-valuemin={0}
    aria-valuemax={ticks}
    aria-valuenow={done}
    aria-label={`${ability}: dispara em ${ticks - done} tiques`}
  >
    <span className="charge-name">
      <Icon id="fire-ray" />
      {ability}
    </span>
    <span className="charge-cells">
      {Array.from({ length: ticks }, (_, i) => (
        <i key={i} className={i < done ? 'on' : ''} />
      ))}
    </span>
    <span className="charge-left">{ticks - done} tiques</span>
  </div>
);

const Botao = ({ cls, label, k, state = '' }: { cls: string; label: string; k: string; state?: string }) => (
  <button type="button" className={`${cls} ${state}`.trim()} disabled={state === 'disabled'}>
    {label}
    <Kbd k={k} />
  </button>
);

// story window (talk.ts): portrait with a mouth, name and text letter by letter (28 ms per letter, the game's "Normal")
const LINES: [Who, string, string][] = [
  [
    'tess',
    'Tess',
    'O farol caiu ontem à noite. Se os mortos chegarem à vila antes do amanhecer, ninguém vai sobrar para acendê-lo.',
  ],
  ['odo', 'Odo', 'Então vamos acendê-lo de novo antes que escureça. Peguem as lanças e sigam a estrada.'],
];
function TalkBox() {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const [q, setQ] = useState(0);
  const [who, name, s] = LINES[i]!;
  const done = shown >= s.length;
  // the text types itself; the mouth moves at 5 Hz while it types and stops at the end (reduced motion: still)
  useEffect(() => {
    if (done) return;
    const t = window.setInterval(() => setShown((n) => n + 1), 28);
    return () => clearInterval(t);
  }, [done, i]);
  useEffect(() => {
    if (done || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      setQ(mouthFrame(t - t0, true));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [done, i]);
  return (
    <button
      type="button"
      className={`panel talk${done ? ' done' : ''}`}
      onClick={() => {
        if (!done) return setShown(s.length);
        setI((i + 1) % LINES.length);
        setShown(0);
      }}
    >
      <span className="talk-face">
        <Portrait who={who} size="lg" q={done ? 0 : q} />
      </span>
      <span className="talk-body">
        <strong className="talk-name">{name}</strong>
        <p className="talk-text" aria-live="polite">
          {s.slice(0, shown)}
        </p>
      </span>
      <span className="talk-next" aria-hidden="true">
        ▼
      </span>
      <span className="talk-keys">Enter segue</span>
    </button>
  );
}

// tile marks (same colours as MARK in scene.ts) and the cursor, on a piece of isometric board
const MARKS = [
  '',
  'move',
  'move',
  '',
  'move',
  'move',
  'range',
  'range',
  'move',
  'blocked',
  'target',
  'range',
  '',
  'move',
  'range',
  '',
];
const Board = () => (
  <div
    className="board-demo"
    role="img"
    aria-label="Casas: azul liso = mover, laranja listrado = alcance, vermelho cheio = alvo, roxo com X = tiro bloqueado; cursor amarelo sobre o alvo"
  >
    <div className="board-grid">
      {MARKS.map((m, i) => (
        <i key={i} className={`tile-mark ${m}${i === 10 ? ' cursor' : ''}`} />
      ))}
    </div>
    <span className="cursor-arrow" aria-hidden="true">
      ▼
    </span>
  </div>
);

const BAU = [
  'Poção',
  'Éter',
  'Fênix',
  'Espada de ferro',
  'Lança curta',
  'Arco longo',
  'Cota de malha',
  'Capuz',
  'Botas leves',
  'Anel de osso',
  'Amuleto',
  'Tocha',
];
const List = () => (
  <div className="panel list" role="menu" aria-label="Baú">
    <div className="panel-head">
      Baú<span className="item-cost">12 itens</span>
    </div>
    <div className="list-scroll">
      {BAU.map((n, i) => (
        <button key={n} type="button" className={`item${i === 1 ? ' focus' : ''}`} role="menuitem">
          <span className="item-label">{n}</span>
          <span className="item-cost">×{(i % 4) + 1}</span>
        </button>
      ))}
    </div>
  </div>
);

const ICONS: [string, string][] = [
  ['knife-thrust', 'Golpe'],
  ['flail', 'Golpe pesado'],
  ['checked-shield', 'Escudada'],
  ['cycle', 'Giro'],
  ['on-target', 'Tiro'],
  ['fire-ray', 'Raio de fogo'],
  ['chalice-drops', 'Cura'],
  ['wind-slap', 'Rajada'],
  ['run', 'Mover'],
  ['pocket-watch', 'Esperar'],
];

// ---------- page ----------

const Piece = ({ title, note, children }: { title: string; note: string; children: ReactNode }) => (
  <section className="fft-piece">
    <h3>{title}</h3>
    <p className="fft-note">{note}</p>
    <div className="fft-row">{children}</div>
  </section>
);

// 1920x1080 stage at scale: the kit's sizes are full-screen ones, the page only shrinks the drawing
function Scene() {
  const frame = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.5);
  useEffect(() => {
    const f = frame.current;
    // jsdom (tests) has no ResizeObserver; the browser always does
    if (!f || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setK(f.clientWidth / 1920));
    ro.observe(f);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="fft-scene" ref={frame}>
      <div className="fft-stage" style={css({ '--k': String(k) })}>
        <Queue />
        <UnitPanel u={ARIA} />
        <Strike />
        <div className="fft-cmds">
          <Menu cls="commands" title="Comandos" rows={COMMANDS} />
        </div>
        <Counter cls="turn" label="Turno" value="3" />
      </div>
    </div>
  );
}

const ESTADOS = ['', 'h', 'f', 'p', 'disabled'];

export function KitFft() {
  useEffect(() => carregarFonte(FONTE_FFT), []);
  return (
    // min-w-0: as a grid item the kit would grow to its widest piece and scroll the page at 375px
    <div className="fft min-w-0">
      <p className="fft-note">
        Medidas em pixels da tela 1920×1080 (a montagem no fim encolhe para caber). Tokens com os nomes do :root do
        jogo, redefinidos em .fft.
      </p>
      <Piece
        title="Painéis"
        note="Base, pequeno e com cabeçalho: degradê azul-marinho, borda fina clara, sombra interna."
      >
        <div className="panel" style={{ width: 360, height: 120 }} />
        <div className="panel" style={{ width: 200, height: 120 }} />
        <div className="panel" style={{ width: 360, height: 160 }}>
          <div className="panel-head">Nome da seção</div>
        </div>
      </Piece>
      <Piece
        title="Ficha da unidade"
        note="Retrato 64 px em 2× (pixel art), nome, lado escrito, classe, VIDA, MP e CT."
      >
        <UnitPanel u={ARIA} />
        <UnitPanel u={{ ...LACAIO, ct: 40 }} />
      </Piece>
      <Piece title="Barras" note="Cheia, vazia (inclui 0/0, sem NaN), dano previsto em listras e cura prevista.">
        <div className="panel gauges">
          <Gauge cls="hp" label="VIDA" value={42} max={42} />
          <Gauge cls="hp" label="VIDA" value={0} max={42} />
          <Gauge cls="mp" label="MP" value={0} max={0} />
          <Gauge cls="hp" label="VIDA" value={31} max={38} change={{ from: 5, to: 31, kind: 'loss' }} />
          <Gauge cls="hp" label="VIDA" value={20} max={42} change={{ from: 20, to: 30, kind: 'gain' }} />
          <Gauge cls="ct" label="CT" value={60} max={100} />
        </div>
      </Piece>
      <Piece
        title="Menu de comandos e habilidades"
        note="Normal, foco (faixa clara + ▶), desativado (apagado + motivo), selecionado (Agir com o submenu aberto). Setas ↑↓ movem o foco."
      >
        <Menu cls="commands" title="Comandos" rows={COMMANDS} />
        <Menu
          cls="commands"
          title="Comandos"
          rows={COMMANDS.map((r) =>
            r.label === 'Agir' ? { ...r, state: 'picked' } : { ...r, state: r.state === 'focus' ? undefined : r.state },
          )}
        />
        <Menu cls="abilities" title="Habilidades" rows={ABILITIES} />
      </Piece>
      <Piece
        title="Fila de turnos"
        note="Coluna de ~96 px: atual com moldura amarela e AGORA; aliado ● azul, inimigo ◆ vinho."
      >
        <Queue />
      </Piece>
      <Piece
        title="Previsão de ataque"
        note="Ação, dano −19 a 26, chance 75%, VIDA do alvo 31/38 com a parte que sai em listras."
      >
        <Strike />
      </Piece>
      <Piece
        title="Botões"
        note="Normal, hover, foco (anel amarelo), pressionado, desativado. O primário é preenchido; o foco é o anel, nunca o preenchimento."
      >
        <div className="fft-grid">
          {ESTADOS.map((s) => (
            <Botao key={`p${s}`} cls="primary" label="Executar" k="Enter" state={s} />
          ))}
          {ESTADOS.map((s) => (
            <Botao key={`s${s}`} cls="secondary" label="Voltar" k="Esc" state={s} />
          ))}
        </div>
      </Piece>
      <Piece title="Diálogo de confirmação" note="O dialog() do jogo: cabeçalho, ✕, texto e um primário.">
        <div className="dialog" role="dialog" aria-label="Executar?">
          <header className="dialog-head">
            <h2>Executar?</h2>
            <IconButton name="Fechar">✕</IconButton>
          </header>
          <p>Golpe pesado no Lacaio de osso: 75% de acerto, 19 a 26 de dano.</p>
          <div className="dialog-actions">
            <Botao cls="secondary" label="Voltar" k="Esc" />
            <Botao cls="primary" label="Executar" k="Enter" />
          </div>
        </div>
      </Piece>
      <Piece
        title="Janela de história"
        note="Boca troca de quadro a 5 Hz enquanto o texto digita e para no fim (movimento reduzido: parada). Clique ou Enter: completa, depois segue."
      >
        <TalkBox />
      </Piece>
      <Piece
        title="Dica, ícones e contadores"
        note="Dica abre no hover e no foco. Ícones: os aprovados do atlas de 32 px e, no resto, o sprite do jogo (SVG, cor do texto)."
      >
        <div className="panel icons">
          <Tip icone="flail" name="Golpe pesado" text="Golpe pesado: 3 MP, 19 a 26 de dano" open />
        </div>
        <div className="panel icons">
          {ICONS.map(([id, n]) => (
            <Tip key={id} icone={id} name={n} text={n} />
          ))}
        </div>
        <Counter cls="gold" label="Ouro" value="1.250" />
        <Counter cls="turn" label="Turno" value="3" />
        <Charge ability="Raio de fogo" ticks={4} done={1} />
      </Piece>
      <Piece
        title="Lista com rolagem, escolha e valor"
        note="Lista com barra de rolagem fina; choice() com aria-pressed; slider() nativo."
      >
        <List />
        <div className="panel" style={{ padding: 16, display: 'grid', gap: 16, width: 420 }}>
          <Choice
            label="Velocidade do texto"
            options={[
              ['normal', 'Normal'],
              ['fast', 'Rápida'],
              ['instant', 'Instantânea'],
            ]}
            value="normal"
          />
          <Slider label="Música" value={40} />
        </div>
      </Piece>
      <Piece
        title="Marcadores de casa e cursor"
        note="Mesmas cores e padrões do MARK de scene.ts; cursor amarelo com seta que pulsa."
      >
        <Board />
      </Piece>
      <section className="fft-piece">
        <h3>Montagem 1920×1080 sobre a Colina</h3>
        <p className="fft-note">
          Fila à esquerda, ficha embaixo à esquerda, previsão embaixo no meio, comandos embaixo à direita.
        </p>
        <Scene />
      </section>
    </div>
  );
}
