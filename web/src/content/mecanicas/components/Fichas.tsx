// One card per class and enemy, rendered from fichas.json, which scripts/mecanicas/fichas.mjs generates from the game's
// origin/master: nothing here is typed by hand, so the cards cannot drift from the game.
import { Tabela } from './Descida';
import FICHAS from '../fichas.json';

type Frase = { texto: string; regra: string };
type Ficha = (typeof FICHAS.fichas)[number] & { forcas?: Frase[]; fraquezas?: Frase[]; comoEnfrentar?: Frase[] };

const REGRA = 'text-base text-apagado';
const RESIST: Record<string, string> = {
  phys: 'física',
  mag: 'mágica',
  fire: 'fogo',
  ice: 'gelo',
  lightning: 'raio',
  shadow: 'sombra',
  wind: 'vento',
  light: 'luz',
};
// a resistance as the change in damage taken, the same sign the card's sentences use
const pct = (v: number) => (v > 0 ? `−${v}%` : `+${-v}%`);

function Lista({ titulo, frases }: { titulo: string; frases?: Frase[] }) {
  if (!frases) return null;
  return (
    <div>
      <h4 className="m-0 text-[17px] leading-tight">{titulo}</h4>
      <ul className="m-0 grid list-disc gap-1 pl-6">
        {frases.map((f) => (
          <li key={f.texto}>
            {f.texto} <span className={REGRA}>(regra: {f.regra})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cartao({ f }: { f: Ficha }) {
  const res = Object.entries(f.resistencias as Record<string, number>);
  const numeros: [string, string | number][] = [
    ['Vida', f.vida],
    ['Velocidade', f.velocidade],
    ['Movimento', f.movimento === 0 ? 'não anda' : `${f.movimento} casas`],
    ['Pulo', `${f.pulo} ${f.pulo === 1 ? 'nível' : 'níveis'}`],
    [
      'Ataque básico',
      `${f.alcanceBasico.habilidade}, ${f.alcanceBasico.casas} ${f.alcanceBasico.casas === '1' ? 'casa' : 'casas'}`,
    ],
    ...(f.alcanceMaximo
      ? ([
          [
            'Maior alcance',
            `${f.alcanceMaximo.casas} casas (${f.alcanceMaximo.habilidade})${f.alcanceMaximo.sobeComAltura ? ', +1 por nível acima' : ''}`,
          ],
        ] as [string, string][])
      : []),
    ...(f.tamanho > 1 ? ([['Tamanho', `${f.tamanho}x${f.tamanho} casas`]] as [string, string][]) : []),
    ['Esquiva', `${f.esquiva}%`],
    ['Dano recebido', res.length ? res.map(([k, v]) => `${RESIST[k] ?? k} ${pct(v)}`).join(', ') : 'normal'],
  ];
  return (
    <article
      id={f.id}
      className="grid content-start gap-3 border-2 border-couro-escuro bg-folha shadow-folha px-5 py-4 [overflow-wrap:anywhere]"
    >
      <div>
        <p className="m-0 text-base text-apagado">{f.grupo === 'classe' ? 'Classe' : 'Inimigo'}</p>
        <h3 className="m-0 text-[21px] leading-tight text-ouro-escuro">{f.nome}</h3>
        <p className="m-0">
          <strong>{f.papel.texto}</strong> <span className={REGRA}>(regra: {f.papel.regra})</span>
        </p>
      </div>
      <dl className="m-0 grid gap-1.5">
        {numeros.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt className="inline font-bold">{rotulo}: </dt>
            <dd className="m-0 inline">{valor}</dd>
          </div>
        ))}
      </dl>
      <Lista titulo="Forte em" frases={f.forcas} />
      <Lista titulo="Fraco em" frases={f.fraquezas} />
      <Lista titulo="Como enfrentar" frases={f.comoEnfrentar} />
      <div>
        <h4 className="m-0 text-[17px] leading-tight">Habilidades</h4>
        <ul className="m-0 grid list-disc gap-1 pl-6">
          {f.habilidades.map((h) => (
            <li key={h.nome}>
              <strong>{h.nome}</strong>: alcance {h.alcance}
              {'dano' in h && `, dano ${h.dano}`}
              {'cura' in h && `, cura ${h.cura}`}
              {`, acerto ${h.acerto}%`}
              {'raio' in h && `, raio ${h.raio}`}
              {'empurra' in h && `, empurra ${h.empurra}`}
              {'carga' in h && `, carga ${h.carga} tiques`}
              {'elemento' in h && `, ${h.elemento}`}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

export function Fichas({ grupo }: { grupo: 'classe' | 'inimigo' }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 ultra:grid-cols-4">
      {(FICHAS.fichas as Ficha[])
        .filter((f) => f.grupo === grupo)
        .map((f) => (
          <Cartao key={f.id} f={f} />
        ))}
    </div>
  );
}

export function Diferencas() {
  if (!FICHAS.diferencas.length) return <p className="m-0">Nenhuma diferença: o lab e o jogo batem.</p>;
  return (
    <Tabela
      colunas={['Onde', 'Campo', 'No lab', 'No jogo (vale este)']}
      linhas={FICHAS.diferencas.map((d) => [d.onde, d.campo, String(d.lab), String(d.jogo)])}
    />
  );
}
