// Ability and item cards, rendered from habilidades.json and itens.json, which scripts/mecanicas/habilidades-itens.mjs
// generates from the game's origin/master: nothing here is typed by hand, so the cards cannot drift from the game.
import { useId, useState, type ReactNode } from 'react';
import { Icone } from '@/components/layout/Icone';
import { Tabela } from './Descida';
import HAB from '../habilidades.json';
import ITENS from '../itens.json';

type Habilidade = (typeof HAB.habilidades)[number] & {
  dano?: string;
  cura?: string;
  raio?: number;
  empurra?: number;
  carga?: number;
  travaNaCasa?: boolean;
  sobeComAltura?: boolean;
  elemento?: string;
};
type Item = (typeof ITENS.itens)[number];

const CHIP =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[3px] border border-ouro bg-folha px-3 text-[15px] text-tinta hover:bg-pergaminho-escuro aria-pressed:border-ouro-escuro aria-pressed:bg-ouro-claro aria-pressed:text-couro-escuro';
const GRADE = 'grid gap-3 md:grid-cols-2 lg:grid-cols-3 ultra:grid-cols-4';
const TODAS = 'Todas';
// accents and case do not matter in the search: "explosao" finds "Explosão"
const simples = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

function Filtro<T>({
  itens,
  classes,
  classesDe,
  textoDe,
  nome,
  vazio,
  children,
}: {
  itens: T[];
  classes: string[];
  classesDe: (x: T) => string[];
  textoDe: (x: T) => string;
  nome: [um: string, varios: string];
  vazio: string;
  children: (x: T) => ReactNode;
}) {
  const id = useId();
  const [busca, setBusca] = useState('');
  const [classe, setClasse] = useState(TODAS);
  const lista = itens.filter(
    (x) => (classe === TODAS || classesDe(x).includes(classe)) && simples(textoDe(x)).includes(simples(busca.trim())),
  );
  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <label htmlFor={id} className="inline-flex items-center gap-1.5 font-bold">
          <Icone id="lupa" />
          Buscar por nome ou por quem usa
        </label>
        <input
          id={id}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="min-h-11 w-full max-w-[40ch] rounded-[3px] border border-ouro bg-folha px-3 text-tinta"
        />
      </div>
      <div role="group" aria-label="Filtrar por classe" className="flex flex-wrap items-center gap-1.5">
        <span className="text-apagado">Classe:</span>
        {[TODAS, ...classes].map((c) => (
          <button key={c} type="button" aria-pressed={c === classe} onClick={() => setClasse(c)} className={CHIP}>
            <Icone id="filtrar" />
            {c}
          </button>
        ))}
      </div>
      <p role="status" className="m-0 text-apagado">
        {lista.length === itens.length
          ? `${itens.length} ${nome[1]}`
          : `${lista.length} de ${itens.length} ${lista.length === 1 ? nome[0] : nome[1]}`}
      </p>
      {lista.length ? (
        <div className={GRADE}>{lista.map(children)}</div>
      ) : (
        <p className="m-0 border border-ouro bg-folha px-5 py-4">{vazio}</p>
      )}
    </div>
  );
}

function Cartao({
  id,
  topo,
  nome,
  en,
  linhas,
}: {
  id: string;
  topo: string;
  nome: string;
  en: string;
  linhas: [string, ReactNode][];
}) {
  return (
    <article
      id={id}
      className="grid content-start gap-3 border border-ouro bg-folha px-5 py-4 [overflow-wrap:anywhere]"
    >
      <div>
        <p className="m-0 text-[15px] text-apagado">{topo}</p>
        <h3 className="m-0 text-[21px] leading-tight text-ouro-escuro">{nome}</h3>
        <p className="m-0 text-[15px] text-apagado" lang="en">
          {en}
        </p>
      </div>
      <dl className="m-0 grid gap-1.5">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo}>
            <dt className="inline font-bold">{rotulo}: </dt>
            <dd className="m-0 inline">{valor}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

const casas = (s: string | number) => `${s} ${String(s) === '1' ? 'casa' : 'casas'}`;
const quemUsa = (h: Habilidade) => h.quem.map((q) => q.nome);

function CartaoHabilidade({ h }: { h: Habilidade }) {
  const classes = h.quem.filter((q) => q.grupo === 'classe').map((q) => q.nome);
  const inimigos = h.quem.filter((q) => q.grupo === 'inimigo').map((q) => q.nome);
  const linhas: [string, ReactNode][] = [
    ['Alcance', `${casas(h.alcance)}${h.sobeComAltura ? ', +1 por nível acima do alvo' : ''}`],
    ...(h.dano ? ([['Dano', h.dano]] as [string, string][]) : []),
    ...(h.cura ? ([['Cura', h.cura]] as [string, string][]) : []),
    ['Acerto', `${h.acerto}%`],
    ['Área', h.raio ? `raio ${h.raio}` : 'só o alvo'],
    ...(h.empurra ? ([['Empurra', casas(h.empurra)]] as [string, string][]) : []),
    ['Carga', h.carga ? `${h.carga} tiques${h.travaNaCasa ? ', mira a casa' : ''}` : 'sai na hora'],
    ['Linha de visão', h.linhaDeVisao ? 'precisa' : 'não precisa'],
    ['Elemento', h.elemento ?? 'nenhum'],
    ['Custo', HAB.fonte.semCusto],
    ['Classes', classes.length ? classes.join(', ') : 'nenhuma'],
    ['Inimigos', inimigos.length ? inimigos.join(', ') : 'nenhum'],
  ];
  return (
    <Cartao
      id={h.id}
      topo={`${h.tipo === 'magia' ? 'Magia' : 'Físico'} · ${h.distancia}`}
      nome={h.nome}
      en={h.en}
      linhas={linhas}
    />
  );
}

// the chips come from the data: the classes that appear among who uses an ability (enemies are found by the search)
const CLASSES_HAB = [
  ...new Set(HAB.habilidades.flatMap((h) => h.quem.filter((q) => q.grupo === 'classe').map((q) => q.nome))),
];

export function Habilidades() {
  return (
    <Filtro
      itens={HAB.habilidades as Habilidade[]}
      classes={CLASSES_HAB}
      classesDe={quemUsa}
      textoDe={(h) => [h.nome, h.en, ...quemUsa(h)].join(' ')}
      nome={['habilidade', 'habilidades']}
      vazio="Nenhuma habilidade com esse nome ou classe. Limpe a busca ou escolha Todas."
    >
      {(h) => <CartaoHabilidade key={h.id} h={h} />}
    </Filtro>
  );
}

const sinal = (v: number) => (v > 0 ? `+${v}` : `−${-v}`);
const CLASSES_ITEM = [...new Set(ITENS.itens.flatMap((i) => i.quem))];

export function Itens() {
  return (
    <Filtro
      itens={ITENS.itens}
      classes={CLASSES_ITEM}
      classesDe={(i: Item) => i.quem}
      textoDe={(i) => [i.nome, i.en, ...i.quem].join(' ')}
      nome={['item', 'itens']}
      vazio="Nenhum item com esse nome. Limpe a busca ou escolha Todas."
    >
      {(i) => (
        <Cartao
          key={i.id}
          id={i.id}
          topo={i.espaco[0]!.toUpperCase() + i.espaco.slice(1)}
          nome={i.nome}
          en={i.en}
          linhas={[
            ['Preço', `${i.preco} de ouro`],
            [
              'Dá',
              Object.entries<number | undefined>(i.atributos)
                .flatMap(([k, v]) => (v ? [`${sinal(v)} ${k}`] : []))
                .join(', '),
            ],
            ['Quem usa', `qualquer classe (${i.quem.join(', ')})`],
          ]}
        />
      )}
    </Filtro>
  );
}

export function SoNoLab() {
  return (
    <Tabela
      colunas={['Peça', 'Espaço no lab', 'Raridade', 'Atributos']}
      linhas={ITENS.soNoLab.map((p) => [p.nome, p.espaco, p.raridade, p.atributos])}
    />
  );
}

export function Diferencas({ de }: { de: 'habilidades' | 'itens' }) {
  const lista = (de === 'habilidades' ? HAB : ITENS).diferencas;
  if (!lista.length) return <p className="m-0">Nenhuma diferença: o lab e o jogo batem.</p>;
  return (
    <Tabela
      colunas={['Onde', 'Campo', 'No lab', 'No jogo (vale este)']}
      linhas={lista.map((d) => [d.onde, d.campo, String(d.lab), String(d.jogo)])}
    />
  );
}
