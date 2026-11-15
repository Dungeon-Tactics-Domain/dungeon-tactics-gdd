// The game's KayKit characters on the 3D bench (Nov 15, Fernando's request: "a new bench for the KayKit characters"): pick a
// base character, swap its parts with other classes, play the 17 game clips or any clip of the full KayKit animation pack
// (listed by the bench's clips.json) and put weapons in each hand like the Animações pages.
import { useEffect, useState } from 'react';
import {
  alterna,
  type Botao,
  DUAS_MAOS,
  Grupo,
  LadoALado,
  MAO_PRINCIPAL,
  MAO_SECUNDARIA,
  urlDaAnimacao,
} from './Animacoes';
import { BANCADA, CLASSE_OPCOES, CLASSE_VIEWER_LADO } from './bancada';
import { Botoes } from './Visualizador';

export const PERSONAGENS: readonly Botao[] = [
  ['knight', 'Cavaleiro'],
  ['mage', 'Mago'],
  ['ranger', 'Arqueiro'],
  ['rogue', 'Ladino'],
  ['rogue_hooded', 'Ladino encapuzado'],
  ['barbarian', 'Bárbaro'],
  ['lancer', 'Lanceiro'],
  ['skeleton_warrior', 'Esqueleto guerreiro'],
  ['skeleton_minion', 'Esqueleto lacaio'],
  ['skeleton_mage', 'Esqueleto mago'],
  ['skeleton_rogue', 'Esqueleto ladino'],
];
// the 5 KayKit Adventurers classes the parts come from
const CLASSES: readonly Botao[] = [
  ['', 'Do personagem'],
  ['knight', 'Cavaleiro'],
  ['mage', 'Mago'],
  ['rogue', 'Ladino'],
  ['rogue_hooded', 'Ladino encapuzado'],
  ['barbarian', 'Bárbaro'],
  ['none', 'Nenhum'],
];
export const PARTES = [
  ['head', '🙂 Cabeça'],
  ['hat', '🎩 Chapéu ou elmo'],
  ['body', '👕 Corpo'],
  ['arms', '💪 Braços'],
  ['legs', '🦵 Pernas'],
  ['cape', '🧣 Capa'],
] as const;
type Parte = (typeof PARTES)[number][0];
const CATEGORIAS: Record<string, string> = {
  MovementBasic: '🚶 Movimento básico',
  MovementAdvanced: '🏃 Movimento avançado',
  General: '🧍 Geral (parado, golpe sofrido, morte)',
  CombatMelee: '⚔️ Combate corpo a corpo',
  CombatRanged: '🏹 Combate à distância e magia',
  Special: '✨ Especiais',
  Simulation: '🏡 Dia a dia',
  Tools: '🔨 Ferramentas',
};
// KayKit Adventurers weapons (CC0), made for the characters' hand bone, beside the Fantasy Weapons ones
const KK_PRINCIPAL: readonly Botao[] = [
  ['sword_1handed', 'Espada do cavaleiro'],
  ['axe_1handed', 'Machado do bárbaro'],
  ['dagger', 'Faca do ladino'],
  ['wand', 'Varinha'],
  ['crossbow_1handed', 'Besta de mão'],
];
const KK_SECUNDARIA: readonly Botao[] = [
  ['shield_round', 'Escudo redondo'],
  ['shield_spikes', 'Escudo de cravos'],
  ['shield_square', 'Escudo quadrado'],
  ['shield_badge', 'Escudo com brasão'],
  ['spellbook_open', 'Livro de magias'],
];
const KK_DUAS: readonly Botao[] = [
  ['sword_2handed', 'Espadão'],
  ['axe_2handed', 'Machado grande'],
  ['staff', 'Cajado de mago'],
  ['crossbow_2handed', 'Besta'],
];

// the game's movement and combat scenes, the same the Animações pages use: walk 0.6 s per tile, the 3-part jump, reactions
const CENAS: readonly (readonly [string, readonly Botao[]])[] = [
  [
    '🚶 Andar',
    [
      ['walk:flat', 'Andando no plano'],
      ['walk:ramp', 'Andando numa rampa'],
    ],
  ],
  [
    '🦘 Saltos',
    [
      ['jump:full', 'Salto completo'],
      ['jump:up', 'Para cima de um obstáculo'],
      ['jump:down', 'Caindo de um obstáculo'],
      ['jump:over', 'Por cima de uma casa vazia'],
    ],
  ],
  [
    '💥 Reações e combate sofrido',
    [
      ['act:hit', 'Cena: sendo atacado'],
      ['act:fall', 'Cena: caindo'],
      ['act:wall', 'Cena: batendo na parede'],
    ],
  ],
  ['🌊 Água', [['act:swim', 'Cena: nadando na água (de quatro, afundado)']]],
];
const CENA = /^(walk|jump|act):/;

interface Clipe {
  name: string;
  dur: number | null;
}
export interface ListaDeClipes {
  jogo: Clipe[];
  pacote: { categoria: string; clipes: Clipe[] }[];
}

const nome = (c: string) => c.replace(/_/g, ' ');

/** Bench URL: the game's model by parts, at game scale, with a KayKit clip or a scene ("walk:flat") and the weapons. */
export function urlKayKit(
  base: string,
  partes: Partial<Record<Parte, string>>,
  clipe: string,
  principal: string,
  secundaria: string,
  duas: string,
) {
  const url = new URL(
    urlDaAnimacao(base, `/models/${base}.glb`, CENA.test(clipe) ? clipe : `clip:${clipe}`, principal, secundaria, duas),
  );
  const q = url.searchParams;
  q.set('char', base);
  q.set('kaykit', '1');
  q.set('solo', '1');
  // the bench puts them at the game's 0.85 height, smaller than the Animações models; a scene spans 3 to 4 tiles
  q.set('zoom', CENA.test(clipe) ? '2.6' : '1.2');
  // jumping down starts on a 2-level block: the view aims higher or the head leaves the frame
  if (clipe === 'jump:down') q.set('fy', '0.8');
  for (const [parte, de] of Object.entries(partes)) if (de) q.set(parte, de);
  return url.toString();
}

/** The KayKit bench page: character, parts, clips (game and full pack) and weapons. */
export function KayKit() {
  const [lista, setLista] = useState<ListaDeClipes | 'carregando' | 'falta'>('carregando');
  const [base, setBase] = useState('knight');
  const [partes, setPartes] = useState<Partial<Record<Parte, string>>>({});
  const [clipe, setClipe] = useState('Idle');
  const [principal, setPrincipal] = useState('');
  const [secundaria, setSecundaria] = useState('');
  const [duas, setDuas] = useState('');
  useEffect(() => {
    let vivo = true;
    fetch(`${BANCADA}/eval/kaykit-anim/clips.json`)
      .then((r) => r.json() as Promise<ListaDeClipes>)
      .then((j) => {
        if (!Array.isArray(j?.jogo) || !Array.isArray(j?.pacote)) throw new Error('lista inválida');
        if (vivo) setLista(j);
      })
      .catch(() => vivo && setLista('falta'));
    return () => {
      vivo = false;
    };
  }, []);
  if (lista === 'carregando') return <p className="m-0 text-apagado">Carregando…</p>;
  if (lista === 'falta')
    return (
      <p className="m-0 border border-dashed border-traco bg-folha px-4 py-3 text-apagado">
        A bancada 3D não respondeu: a lista de animações não carregou.
      </p>
    );
  const doJogo = new Set(lista.jogo.map((c) => c.name));
  const tocando = [
    ...lista.jogo.map((c) => [c.name, c] as const),
    ...lista.pacote.flatMap((g) => g.clipes.map((c) => [`${g.categoria}/${c.name}`, c] as const)),
  ].find(([id]) => id === clipe)?.[1];
  const cena = CENAS.flatMap(([, b]) => b).find(([id]) => id === clipe)?.[1];
  return (
    <LadoALado
      viewer={
        <>
          <iframe
            src={urlKayKit(base, partes, clipe, principal, secundaria, duas)}
            title="Personagem KayKit 3D"
            className={CLASSE_VIEWER_LADO}
          />
          <p className="m-0 mt-2 text-apagado">
            Tocando: {cena ?? nome(clipe.replace(/^.*\//, ''))}
            {tocando?.dur ? ` (${tocando.dur.toLocaleString('pt-BR')} s)` : ''}
          </p>
        </>
      }
    >
      <div className={CLASSE_OPCOES}>
        <Grupo titulo="🧍 Personagem" botoes={PERSONAGENS} atual={base} escolher={setBase} />
        {PARTES.map(([parte, titulo]) => (
          <Grupo
            key={parte}
            titulo={titulo}
            botoes={CLASSES}
            atual={partes[parte] ?? ''}
            escolher={(de) => setPartes({ ...partes, [parte]: de })}
          />
        ))}
        <Grupo
          titulo="⭐ Os 17 gestos que o jogo usa"
          botoes={lista.jogo.map((c) => [c.name, nome(c.name)] as const)}
          atual={clipe}
          escolher={setClipe}
        />
        {CENAS.map(([titulo, botoes]) => (
          <Grupo key={titulo} titulo={titulo} botoes={botoes} atual={clipe} escolher={setClipe} />
        ))}
        <div className="mt-2.5 font-bold">📦 Pacote completo de animações KayKit</div>
        <p className="m-0 mb-1 text-apagado">★ marca os que o jogo já usa.</p>
        {lista.pacote.map((g) => (
          <details key={g.categoria} className="mt-1">
            <summary className="cursor-pointer">
              {CATEGORIAS[g.categoria] ?? g.categoria} ({g.clipes.length})
            </summary>
            <Botoes
              rotulo={CATEGORIAS[g.categoria] ?? g.categoria}
              itens={g.clipes.map(
                (c) => [`${g.categoria}/${c.name}`, `${nome(c.name)}${doJogo.has(c.name) ? ' ★' : ''}`] as const,
              )}
              atual={clipe}
              escolher={setClipe}
            />
          </details>
        ))}
        <Grupo
          titulo="🗡️ Mão principal (direita)"
          botoes={[...MAO_PRINCIPAL, ...KK_PRINCIPAL]}
          atual={principal}
          escolher={(id) => {
            setPrincipal(alterna(principal, id));
            setDuas('');
          }}
        />
        <Grupo
          titulo="🛡️ Mão secundária (esquerda)"
          botoes={[...MAO_SECUNDARIA, ...KK_SECUNDARIA]}
          atual={secundaria}
          escolher={(id) => {
            setSecundaria(alterna(secundaria, id));
            setDuas('');
          }}
        />
        <Grupo
          titulo="🙌 Duas mãos"
          botoes={[...DUAS_MAOS, ...KK_DUAS]}
          atual={duas}
          escolher={(id) => {
            setDuas(alterna(duas, id));
            setPrincipal('');
            setSecundaria('');
          }}
        />
      </div>
    </LadoALado>
  );
}
