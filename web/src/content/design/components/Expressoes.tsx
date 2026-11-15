// Bench of the AI portraits' expressions (Fernando's request of 15/11): 8 frames per character, cut from the Copilot sheets
// by the game's scripts (rembg, transparent background) into chars/<version>/<id>.png, one row of 8 frames of 256 px.
// Ported from dungeon-tactics-lab/design/src/expressoes.ts.
import './fft-kit.css';
import './expressoes.css';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { ASSETS, carregarFonte, FONTE_FFT } from '../dados';

// frame order in the sheet = order of the Copilot sheets
const Q = { neutro: 0, falando1: 1, falando2: 2, gritando: 3, dano: 4, ferido: 5, sorrindo: 6, bravo: 7 } as const;
const NOMES = ['Neutro', 'Falando 1', 'Falando 2', 'Gritando ao atacar', 'Tomando dano', 'Ferido', 'Sorrindo', 'Bravo'];
// folha: has an 8-frame sheet; without it the minion and the skeleton rogue and warrior have no expressions yet
const ROSTOS: [id: string, nome: string, folha: boolean][] = [
  ['barbarian', 'Bárbaro', true],
  ['knight', 'Cavaleiro', true],
  ['lancer', 'Lanceiro', true],
  ['mage', 'Maga', true],
  ['ranger', 'Arqueira', true],
  ['rogue_hooded', 'Ladino encapuzado', true],
  ['skeleton_mage', 'Esqueleto mago', true],
  ['skeleton_minion', 'Lacaio de osso', false],
  ['skeleton_rogue', 'Esqueleto ladino', false],
  ['skeleton_warrior', 'Esqueleto guerreiro', false],
];
const FALA =
  'O farol caiu ontem à noite. Se os mortos chegarem à vila antes do amanhecer, ninguém vai sobrar para acendê-lo.';
const MOMENTOS = ['falar', 'dano', 'atacar', 'ferido', 'vitoria', 'provocar', 'neutro'] as const;
type Momento = (typeof MOMENTOS)[number];
const ROTULO: Record<Momento, string> = {
  falar: 'Falar',
  dano: 'Levar dano',
  atacar: 'Atacar',
  ferido: 'Ficar ferido',
  vitoria: 'Vitória',
  provocar: 'Provocar',
  neutro: 'Neutro (parado)',
};
const MAX_HP = 42;
// versions of the sheet for the jitter test (the game's ia-variantes script): folder chars/<folder>/<id>.png
const VERSOES: [pasta: string, nome: string, nota: string][] = [
  [
    'ia-alinhado-rosto',
    'D · Alinhado + capacete parado (oficial)',
    'Oficial por enquanto (escolha do Fernando, 15/11), é o que está no jogo. Quadros alinhados e só o rosto (olhos e boca) vem do quadro novo; capacete, chapéu e capuz ficam do neutro, então a cabeça não muda de formato.',
  ],
  ['ia', 'Original (IA)', 'Quadros como a IA entregou: o rosto inteiro muda a cada quadro e treme.'],
  ['ia-boca', 'A · Só a boca colada', 'Rosto parado do quadro neutro; só a boca vem dos quadros de fala.'],
  [
    'ia-pixel2',
    'C · A + pixel art 128 px (proper-pixel-art)',
    'Versão A passada pelo proper-pixel-art com grade de 2 px (128x128, 48 cores): borda de pixel real, perde menos detalhe que a grade de 4 px.',
  ],
  [
    'ia-alinhado',
    'B · Quadros alinhados',
    'Cada quadro deslocado para casar com a silhueta do neutro; desenho da IA intacto.',
  ],
];
const reduz = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const posicao = (q: number) => `${(q * 100) / 7}%`; // 8 frames in background-size 800%
const sheet = (pasta: string, id: string) => `url(${ASSETS}/chars/${pasta}/${id}.png)`;
const css = (v: Record<string, string>) => v as CSSProperties;

function Barra({
  rotulo,
  itens,
  ativo,
  onPick,
}: {
  rotulo: string;
  itens: [id: string, texto: string][];
  ativo: (id: string) => boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div className="expr-bar" role="group" aria-label={rotulo}>
      <span className="rot">{rotulo}</span>
      {itens.map(([id, texto]) => (
        <button key={id} type="button" aria-pressed={ativo(id)} onClick={() => onPick(id)}>
          {texto}
        </button>
      ))}
    </div>
  );
}

function Quadro({ pasta, id, n, lado }: { pasta: string; id: string; n: number; lado: number }) {
  return (
    <span
      className="expr-f"
      style={css({
        width: `${lado}px`,
        height: `${lado}px`,
        '--sheet': sheet(pasta, id),
        backgroundPositionX: posicao(n),
      })}
    />
  );
}

export function Expressoes() {
  const [pasta, setPasta] = useState('ia-alinhado-rosto');
  const [escolhido, setEscolhido] = useState<Momento>('neutro');
  const [id, setId] = useState('barbarian');
  const [zoom, setZoom] = useState(1);
  const [q, setQ] = useState<number>(Q.neutro);
  const [hp, setHp] = useState(MAX_HP);
  const [momento, setMomento] = useState('Parado');
  const [fala, setFala] = useState('');
  const [fx, setFx] = useState({ cls: '', key: 0 });
  const hpRef = useRef(MAX_HP);
  const timers = useRef<number[]>([]);
  useEffect(() => carregarFonte(FONTE_FFT), []);

  const parar = () => {
    for (const t of timers.current) {
      clearTimeout(t);
      clearInterval(t);
    }
    timers.current = [];
  };
  const baixa = () => hpRef.current <= MAX_HP * 0.3;
  // resting frame: hurt at low life (up to 30%), neutral otherwise
  const repouso = () => (baixa() ? Q.ferido : Q.neutro);
  const vida = (v: number) => {
    hpRef.current = v;
    setHp(v);
  };
  const marca = (m: string, texto = '') => {
    setMomento(m);
    setFala(texto);
  };
  const volta = (ms: number) =>
    timers.current.push(
      window.setTimeout(() => {
        setQ(repouso());
        marca(baixa() ? 'Ferido (vida baixa)' : 'Parado');
      }, ms),
    );
  // a new key restarts the CSS animation if the button is clicked again
  const efeito = (cls: string, ms: number) => {
    setFx((f) => ({ cls, key: f.key + 1 }));
    timers.current.push(window.setTimeout(() => setFx((f) => ({ ...f, cls: '' })), ms));
  };

  const acao: Record<Momento, () => void> = {
    falar() {
      // letter by letter at 28 ms (the game's "Normal"); the mouth cycles neutral, talking 1, talking 2, talking 1, one frame
      // per 180 ms; reduced motion: the mouth stays on frame 1
      marca('Falando');
      let n = 0;
      let passo = 0;
      setQ(Q.falando1);
      if (!reduz())
        timers.current.push(
          window.setInterval(() => setQ([Q.neutro, Q.falando1, Q.falando2, Q.falando1][++passo % 4]!), 180),
        );
      timers.current.push(
        window.setInterval(() => {
          setFala(FALA.slice(0, ++n));
          if (n >= FALA.length) {
            parar();
            setQ(repouso());
            marca('Parado', FALA);
          }
        }, 28),
      );
    },
    dano() {
      vida(Math.max(0, hpRef.current - 14));
      setQ(Q.dano);
      marca('Tomando dano (−14)');
      if (!reduz()) efeito('hit', 960);
      volta(900);
    },
    atacar() {
      setQ(Q.gritando);
      marca('Atacando');
      if (!reduz()) efeito('lunge', 500);
      volta(700);
    },
    ferido() {
      vida(12);
      setQ(Q.ferido);
      marca('Ferido (vida baixa)');
    },
    vitoria() {
      setQ(Q.sorrindo);
      marca('Vitória');
      volta(2200);
    },
    provocar() {
      setQ(Q.bravo);
      marca('Provocando');
      volta(2200);
    },
    neutro() {
      vida(MAX_HP);
      setQ(Q.neutro);
      marca('Parado');
    },
  };
  const toca = (m: Momento) => {
    parar();
    setFx((f) => ({ ...f, cls: '' }));
    setEscolhido(m);
    acao[m]();
  };
  // switching character or version keeps the chosen moment; damage is not applied again (only the frame is repainted)
  const refaz = () => {
    if (escolhido !== 'dano') toca(escolhido);
    else {
      parar();
      setQ(Q.dano);
    }
  };
  // leaving the page stops every timer
  useEffect(() => {
    const ativos = timers;
    return () => {
      for (const t of ativos.current) {
        clearTimeout(t);
        clearInterval(t);
      }
    };
  }, []);

  const nome = ROSTOS.find(([i]) => i === id)![1];
  return (
    <div className="expr">
      <div className="expr-col">
        <Barra
          rotulo="Versão"
          itens={VERSOES.map(([p, n]) => [p, n])}
          ativo={(p) => p === pasta}
          onPick={(p) => {
            setPasta(p);
            refaz();
          }}
        />
        <p className="expr-nota">{VERSOES.find(([p]) => p === pasta)![2]}</p>
        <Barra
          rotulo="Personagem"
          itens={ROSTOS.filter(([, , f]) => f).map(([i, n]) => [i, n])}
          ativo={(i) => i === id}
          onPick={(i) => {
            setId(i);
            refaz();
          }}
        />
        <div className="expr-bar" role="group" aria-label="Momento">
          <span className="rot">Momento</span>
          {MOMENTOS.map((m) => (
            <button key={m} type="button" aria-pressed={m === escolhido} onClick={() => toca(m)}>
              {ROTULO[m]}
            </button>
          ))}
        </div>
        <div className="fft expr-scene">
          <div className="panel talk">
            <span
              key={fx.key}
              className={`expr-face ${fx.cls}`.trim()}
              role="img"
              aria-label={`Retrato de ${nome}`}
              style={css({ '--sheet': sheet(pasta, id), backgroundPositionX: posicao(q) })}
            />
            <div className="expr-info">
              <strong>{nome}</strong>
              <span className="expr-moment" aria-live="polite">
                {momento}
              </span>
              <p className="expr-line">{fala}</p>
              <div className="gauge hp">
                <span className="gauge-label">VIDA</span>
                <span className="gauge-bar">
                  <i style={{ width: `${(hp / MAX_HP) * 100}%` }} />
                </span>
                <span className="gauge-num">
                  {hp}/{MAX_HP}
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="expr-nota">
          Mini-cena no kit FFT Clássico: a boca faz o ciclo neutro, Falando 1, Falando 2, Falando 1 (180 ms por quadro);
          dano treme e pisca; vida abaixo de 30% mantém o quadro Ferido. Lacaio de osso, esqueleto ladino e esqueleto
          guerreiro ainda não têm folha.
        </p>
      </div>
      <div className="expr-col">
        <Barra
          rotulo="Tamanho"
          itens={[1, 2, 4].map((z) => [String(z), `${z}x (${64 * z} px)`])}
          ativo={(z) => z === String(zoom)}
          onPick={(z) => setZoom(Number(z))}
        />
        <div className="expr-tabela">
          <table>
            <thead>
              <tr>
                <th>Personagem</th>
                {NOMES.map((n) => (
                  <th key={n} scope="col">
                    {n}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROSTOS.map(([i, n, f]) => (
                <tr key={i}>
                  <th scope="row">{n}</th>
                  {f ? (
                    NOMES.map((qn, k) => (
                      <td key={qn}>
                        <Quadro pasta={pasta} id={i} n={k} lado={64 * zoom} />
                      </td>
                    ))
                  ) : (
                    <td className="vazio" colSpan={8}>
                      sem folha ainda
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
