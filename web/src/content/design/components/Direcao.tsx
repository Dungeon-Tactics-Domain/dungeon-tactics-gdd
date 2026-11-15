// Phase 2, step 1 (14/11): style sample of the 3 directions, the SAME battle moment in each (Aria aims the Heavy blow at
// the Bone minion), so the comparison is only about drawing. Ported from dungeon-tactics-lab/design/src/directions.ts:
// same DOM and classes, now JSX; the CSS lives under .dz-maquetes (maquetes.css) and does not leak into the app.
import './maquetes.css';
import { type CSSProperties, useEffect, useState } from 'react';
import { ASSETS, carregarFonte, DIRECOES, type Direcao as Dados } from '../dados';

// the 6 typefaces of the directions (all OFL), loaded once into <head>
const FONTES =
  'https://fonts.googleapis.com/css2?family=Barlow:wght@500;600&family=Big+Shoulders+Display:wght@600;700&family=Cormorant+Garamond:wght@600&family=IBM+Plex+Mono:wght@400;600&family=Karla:wght@400;700&family=Spectral:wght@500;700&display=swap';

const QUEUE = ['Aria', 'Lacaio', 'Tess', 'Odo', 'Acólito'];
const COMMANDS: [name: string, key: string][] = [
  ['Mover', 'M'],
  ['Agir', 'A'],
  ['Esperar', 'P'],
  ['Status', 'C'],
];
const lado = (i: number) => (i === 0 ? 'now' : i % 2 ? 'foe' : '');

function Bar({ cls, label, v, max }: { cls: string; label: string; v: number; max: number }) {
  return (
    <div className={`bar ${cls}`}>
      <span className="bar-label">{label}</span>
      <span className="bar-track">
        {/* max 0 gives an empty bar (the old code once drew NaN% and the bar looked full) */}
        <i style={{ width: `${max ? Math.round((v / max) * 100) : 0}%` }} />
      </span>
      <span className="bar-num">
        {v}/{max}
      </span>
    </div>
  );
}

function Unit(p: { side: string; name: string; cls: string; hp: [number, number]; mp: [number, number] }) {
  return (
    <div className={`unit ${p.side}`}>
      <div className="face" aria-hidden="true" />
      <div className="unit-body">
        <div className="unit-name">
          {p.name}
          <span className="unit-class">{p.cls}</span>
        </div>
        <Bar cls="hp" label="Vida" v={p.hp[0]} max={p.hp[1]} />
        <Bar cls="mp" label="MP" v={p.mp[0]} max={p.mp[1]} />
      </div>
    </div>
  );
}
const Aria = ({ cls = 'Guerreira' }: { cls?: string }) => (
  <Unit side="hero" name="Aria" cls={cls} hp={[42, 42]} mp={[8, 12]} />
);
const Lacaio = () => <Unit side="foe" name="Lacaio de osso" cls="Morto-vivo" hp={[31, 38]} mp={[0, 0]} />;

function Menu({ teclaAntes }: { teclaAntes?: boolean }) {
  return (
    <div className="menu" role="menu" aria-label="Comandos">
      {COMMANDS.map(([n, k], i) => (
        <div key={n} className={`row${i === 1 ? ' focus' : ''}`} role="menuitem">
          {teclaAntes ? (
            <>
              <kbd>{k}</kbd>
              <span>{n}</span>
            </>
          ) : (
            <>
              <span>{n}</span>
              <kbd>{k}</kbd>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
const Botoes = () => (
  <div className="buttons">
    <button type="button" className="primary">
      Executar
    </button>
    <button type="button" className="secondary">
      Voltar
    </button>
    <button type="button" className="secondary" disabled>
      Sem MP
    </button>
  </div>
);

// A · Vitral: the HUD is leaded glass in the corners; what is lit (focus) is an amber pane
const StageA = () => (
  <>
    <ol className="queue">
      {QUEUE.map((n, i) => (
        <li key={n} className={lado(i)}>
          <b>{i + 1}</b>
          {n}
        </li>
      ))}
    </ol>
    <Menu />
    <div className="preview">
      <div className="preview-title">Golpe pesado</div>
      <div className="preview-nums">
        <span className="hit">
          75<small>% acerto</small>
        </span>
        <span className="dmg">
          −19 a 26<small> de vida</small>
        </span>
      </div>
      <div className="preview-after">Lacaio de osso fica com 5 a 12 de vida</div>
      <Botoes />
    </div>
    <Aria />
    <Lacaio />
  </>
);

// B · Ferro e cinza: an iron bench along the bottom; commands on plates with the key engraved
const StageB = () => (
  <>
    <ol className="queue">
      {QUEUE.map((n, i) => (
        <li key={n} className={lado(i)}>
          {n}
        </li>
      ))}
    </ol>
    <div className="bench">
      <Aria />
      <div className="mid">
        <div className="preview">
          <span className="preview-title">Golpe pesado</span>
          <span className="hit">
            75%<small> acerto</small>
          </span>
          <span className="dmg">−19 a 26</span>
          <span className="preview-after">fica com 5 a 12 de vida</span>
        </div>
        <Menu teclaAntes />
        <Botoes />
      </div>
      <Lacaio />
    </div>
  </>
);

// C · Carta de campo (winner of the Opus critique of 14/11, 7/10), with its 3 fixes: the target's life is ONE bar in 3
// bands and red only means damage; with the forecast open the menu folds into the "Agir › Golpe pesado" trail; forecast
// and enemy card in one panel beside the Bone minion, with a short line and a red ring on it.
// Life 31/38, damage 19 to 26: 5 left for sure (0–5), maybe 5–12, the blow takes 12–31, 31–38 was already missing.
const pct = (v: number) => `${((v / 38) * 100).toFixed(2)}%`;
const StageC = () => (
  <>
    {/* 1280x720 scene coordinates (the stage is 16:9); the minion's blue ring is painted in the Colina JPG at ~(639, 204) */}
    <svg className="marks" viewBox="0 0 1280 720" aria-hidden="true">
      <ellipse cx={639} cy={204} rx={35} ry={17} fill="none" stroke="#26241f" strokeWidth={8} />
      <ellipse cx={639} cy={204} rx={35} ry={17} fill="none" stroke="#e0352b" strokeWidth={4.5} />
      <path d="M 674 204 L 704 204" stroke="#f2ecdc" strokeWidth={2} />
      <circle cx={676} cy={204} r={4} fill="#f2ecdc" />
    </svg>
    <ol className="queue">
      {QUEUE.map((n, i) => (
        <li key={n} className={lado(i)}>
          {n}
          {i === 0 ? ' · agora' : ''}
        </li>
      ))}
    </ol>
    <div className="anchor">
      <section className="forecast" aria-label="Previsão: Aria usa Golpe pesado no Lacaio de osso">
        <div className="fc-head">
          <span className="fc-name">Lacaio de osso</span>
          <span className="tag">Inimigo</span>
        </div>
        <div className="fc-sub">Morto-vivo · nível 3</div>
        <div className="fc-nums">
          <span className="dmg">−19 a 26</span>
          <span className="hit">
            75%<small> de acerto</small>
          </span>
        </div>
        <div className="bar hp-forecast" role="img" aria-label="Vida 31 de 38; depois do golpe fica com 5 a 12">
          <span className="bar-label">Vida</span>
          <span className="bar-track">
            <i className="sure" style={{ width: pct(5) }} />
            <i className="maybe" style={{ left: pct(5), width: pct(7) }} />
            <i className="dmg-band" style={{ left: pct(12), width: pct(19) }} />
          </span>
          <span className="bar-num">31 → 5 a 12</span>
        </div>
        <ul className="legend" aria-hidden="true">
          <li className="sure">sobra</li>
          <li className="maybe">talvez sobre</li>
          <li className="dmg-band">dano</li>
          <li className="gone">já faltava</li>
        </ul>
        <Bar cls="mp" label="MP" v={0} max={0} />
        <div className="buttons">
          <button type="button" className="primary">
            Executar golpe pesado <kbd>Enter</kbd>
          </button>
          <button type="button" className="secondary">
            Voltar <kbd>Esc</kbd>
          </button>
        </div>
      </section>
      <div className="trail">
        Agir<span aria-hidden="true"> › </span>Golpe pesado
      </div>
    </div>
    <Aria cls="Guerreira · nível 4" />
  </>
);

const STAGES = { a: StageA, b: StageB, c: StageC };
const CENAS: [id: string, label: string][] = [
  ['colina', 'Colina (verde, dia escuro)'],
  ['passo', 'Passo gelado (neve clara)'],
  ['cripta', 'Cripta (pedra e tochas)'],
];
// the chosen scene lives in the module: each direction is a page and the choice holds when moving between them
let cenaEscolhida = 'colina';

const LEDE =
  'Passo 1 da Fase 2: uma amostra de estilo de cada direção, com o mesmo momento da batalha. Ainda não são telas inteiras. O fundo é uma captura real do jogo (Colina do Farol, sem interface); os retratos são blocos vazios de propósito.';

export function Direcao({ id }: { id: string }) {
  const [cena, setCena] = useState(cenaEscolhida);
  useEffect(() => carregarFonte(FONTES), []);
  const d: Dados | undefined = DIRECOES.find((x) => x.id === id);
  if (!d) return <p className="m-0 text-stop">Direção desconhecida: {id}</p>;
  const Stage = STAGES[d.id];
  const fundo = { '--cena': `url(${ASSETS}/cenas/cena-${cena}.jpg)` } as CSSProperties;
  return (
    <div className="dz-maquetes grid gap-3">
      <p className="m-0 max-w-[72ch] text-apagado">{LEDE}</p>
      <div className="cenas" role="group" aria-label="Cena de fundo">
        <span>Cena atrás:</span>
        {CENAS.map(([cid, label]) => (
          <button key={cid} type="button" aria-pressed={cid === cena} onClick={() => setCena((cenaEscolhida = cid))}>
            {label}
          </button>
        ))}
      </div>
      <section className={`tile dir-${d.id}`} id={`dir-${d.id}`}>
        <div className="stage" style={fundo}>
          <Stage />
        </div>
        <div className="tile-notes">
          <div>
            <strong>Cores</strong>
            <ul className="swatches">
              {d.palette.map(([n, hex, use]) => (
                <li key={n}>
                  <i style={{ background: hex }} />
                  <span>
                    {n} <code>{hex}</code> · {use}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Letras</strong>
            {d.type.map(([role, fam, sample]) => (
              <p key={role} className="specimen">
                <span className="specimen-sample" style={{ fontFamily: `'${fam}'` }}>
                  {sample}
                </span>
                <span>
                  {fam} · {role}
                </span>
              </p>
            ))}
            <strong>Disposição</strong>
            <p>{d.hud}</p>
            <strong>De onde vem</strong>
            <p>{d.from}</p>
            <strong>Risco</strong>
            <p>{d.risk}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/** the three directions one after the other, a title each (the old interface/alternativas section) */
export function Alternativas() {
  return (
    <div className="grid gap-8">
      {DIRECOES.map((d) => (
        <div key={d.id} className="grid gap-3">
          <h3 className="m-0 mt-1 text-[21px] leading-tight">{d.name}</h3>
          <Direcao id={d.id} />
        </div>
      ))}
    </div>
  );
}
