// Game clips (animations.glb plus the knight Idle) and extras (reactions, water) playing on each model's rigged
// character, on the 3D bench. Same buttons, scenes and URLs as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
import { type ReactNode, useEffect, useState } from 'react';
import { fichaAnimacao } from '../fichas';
import { BANCADA, BENCH, CLASSE_OPCOES, CLASSE_VIEWER } from './bancada';
import { AcoesDoJogo, PainelDeClipes, Sequencias, useSequencia } from './Clipes';
import { FichaPreview } from './FichaPreview';
import { JanelaRedimensionavel } from './JanelaRedimensionavel';
import { Botoes, LadoALado } from './Visualizador';

// id "clip:<name>" plays one clip; "walk:", "jump:" and "act:" assemble a scene on the bench
export type Botao = readonly [id: string, nome: string];
const clipe = (c: string, nome = c.replace(/_/g, ' ')): Botao => [`clip:${c}`, nome];
const SETORES: readonly (readonly [string, readonly Botao[]])[] = [
  [
    '🚶 Movimento',
    [
      clipe('Idle', 'Parado'),
      clipe('Walking_A', 'Andar (clipe)'),
      ['walk:flat', 'Andando no plano'],
      ['walk:ramp', 'Andando numa rampa'],
    ],
  ],
  [
    '🦘 Saltos',
    [
      clipe('Jump_Start', 'Agachar'),
      clipe('Jump_Idle', 'No ar'),
      clipe('Jump_Land', 'Pousar'),
      ['jump:full', 'Salto completo'],
      ['jump:up', 'Para cima de um obstáculo'],
      ['jump:down', 'Caindo de um obstáculo'],
      ['jump:over', 'Por cima de uma casa vazia'],
    ],
  ],
  [
    '⚔️ Ataques corpo a corpo',
    [
      clipe('Melee_1H_Attack_Slice_Diagonal', 'Corte diagonal (1 mão)'),
      clipe('Melee_1H_Attack_Chop', 'Golpe de cima (1 mão)'),
      clipe('Melee_1H_Attack_Stab', 'Estocada (1 mão)'),
      clipe('Melee_2H_Attack_Chop', 'Golpe de cima (2 mãos)'),
      clipe('Melee_Unarmed_Attack_Punch_A', 'Soco'),
      clipe('Melee_Block_Attack', 'Bloquear e golpear'),
    ],
  ],
  [
    '🏹 À distância e magia',
    [
      clipe('Ranged_Bow_Aiming_Idle', 'Mirar o arco'),
      clipe('Ranged_Bow_Release', 'Soltar a flecha'),
      clipe('Ranged_Magic_Raise', 'Erguer a magia'),
      clipe('Ranged_Magic_Shoot', 'Disparar a magia'),
      clipe('Ranged_Magic_Spellcasting', 'Conjurar'),
      clipe('Use_Item', 'Usar item'),
    ],
  ],
  [
    '💥 Reações e combate sofrido',
    [
      clipe('Hit_A', 'Levar golpe A'),
      clipe('Hit_B', 'Levar golpe B'),
      clipe('Melee_Block_Hit', 'Defender golpe'),
      clipe('Death_A', 'Cair morto A'),
      clipe('Death_B', 'Cair morto B'),
      ['act:hit', 'Cena: sendo atacado'],
      ['act:fall', 'Cena: caindo'],
      ['act:wall', 'Cena: batendo na parede'],
    ],
  ],
  ['🌊 Água', [clipe('Swim', 'Nado'), clipe('Crawling', 'Engatinhar'), ['act:swim', 'Cena: nadando na água']]],
];
// KayKit Fantasy Weapons (CC0), attached to the hand bone, tip down: [file, name]
export const MAO_PRINCIPAL: readonly Botao[] = [
  ['sword_A', 'Espada'],
  ['sword_C', 'Espada longa'],
  ['axe_A', 'Machado'],
  ['hammer_A', 'Martelo'],
  ['dagger_A', 'Adaga'],
];
export const MAO_SECUNDARIA: readonly Botao[] = [
  ['shield_A', 'Escudo'],
  ['dagger_B', 'Adaga curta'],
];
export const DUAS_MAOS: readonly Botao[] = [
  ['spear_A', 'Lança'],
  ['halberd', 'Alabarda'],
  ['staff_A', 'Cajado'],
  ['bow_A_withString', 'Arco'],
];

/** Bench URL for the chosen clip or scene and weapons. */
export function urlDaAnimacao(
  modelo: string,
  glb: string,
  escolha: string,
  principal: string,
  secundaria: string,
  duas: string,
) {
  const q = new URLSearchParams({ glb, zoom: /^(walk|jump|act):/.test(escolha) ? '3.4' : '1.6' });
  const [tipo, valor] = escolha.split(':');
  q.set(tipo === 'clip' ? 'anim' : tipo!, valor!);
  if (modelo.startsWith('fable')) q.set('fx', '1');
  if (principal) q.set('weapon', principal);
  if (secundaria) q.set('off', secundaria);
  // the bow goes in the off hand, the other two-handed weapons in the main one
  if (duas) q.set(duas.startsWith('bow') ? 'off' : 'weapon', duas);
  return `${BENCH}?${q}`;
}

const NOMES = new Map(SETORES.flatMap(([, b]) => b));
const nomeDe = (id: string) => NOMES.get(id) ?? id.replace(/^clip:/, '').replace(/_/g, ' ');

export const alterna = (atual: string, id: string) => (atual === id ? '' : id);

export function Grupo({
  titulo,
  botoes,
  atual,
  escolher,
}: {
  titulo: string;
  botoes: readonly Botao[];
  atual: string;
  escolher: (id: string) => void;
}) {
  return (
    <div className="mt-2.5 first:mt-0">
      <div className="mb-1 font-bold">{titulo}</div>
      <Botoes rotulo={titulo} itens={botoes} atual={atual} escolher={escolher} />
    </div>
  );
}

/** Rigged character of one model with all the clips; says so if the model is not on the bench yet. */
export function Animacoes({ modelo, children }: { modelo: string; children?: ReactNode }) {
  const glb = `${BANCADA}/eval/anim-${modelo}/char.glb`;
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'falta'>('carregando');
  const [escolha, setEscolha] = useState('clip:Idle');
  const [principal, setPrincipal] = useState('');
  const [secundaria, setSecundaria] = useState('');
  const [duas, setDuas] = useState('');
  // clip lengths for the sequences: the same game clips as the KayKit bench's clips.json (the rigged characters
  // were retargeted at the same lengths, notes anim-*.md); a missing list falls back to a fixed step
  const [duracoes, setDuracoes] = useState<Map<string, number>>(new Map());
  const sequencia = useSequencia(setEscolha, (id) => duracoes.get(id.replace(/^clip:/, '')));
  const escolher = (id: string) => {
    sequencia.parar();
    setEscolha(id);
  };
  useEffect(() => {
    fetch(`${BANCADA}/eval/kaykit-anim/clips.json`)
      .then((r) => r.json() as Promise<{ jogo?: unknown }>)
      .then((j) => {
        if (!Array.isArray(j?.jogo)) return;
        const m = new Map<string, number>();
        for (const c of j.jogo as { name?: unknown; dur?: unknown }[])
          if (typeof c?.name === 'string' && typeof c.dur === 'number') m.set(c.name, c.dur);
        setDuracoes(m);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    let vivo = true;
    // the dev server answers 200 with the page for a missing file: HTML means "not there"
    fetch(glb, { method: 'HEAD' })
      .then((r) => {
        if (!r.ok || r.headers.get('content-type')?.includes('html')) throw new Error('sem arquivo');
        if (vivo) setEstado('ok');
      })
      .catch(() => vivo && setEstado('falta'));
    return () => {
      vivo = false;
    };
  }, [glb]);
  const ficha = fichaAnimacao(modelo);
  if (estado === 'carregando') return <p className="m-0 text-apagado">Carregando…</p>;
  if (estado === 'falta')
    return (
      <p className="m-0 border border-dashed border-traco bg-folha px-4 py-3 text-apagado">
        Em andamento: o personagem rigado com as animações ainda não está na bancada (ou a bancada 3D está fora do ar).
      </p>
    );
  return (
    <>
      {children}
      <LadoALado
        viewer={
          <JanelaRedimensionavel tipo="animacoes" ficha={ficha && <FichaPreview ficha={ficha} />}>
            <iframe
              key={sequencia.chave}
              src={urlDaAnimacao(modelo, glb, escolha, principal, secundaria, duas)}
              title="Animação 3D"
              className={CLASSE_VIEWER}
              onLoad={sequencia.aoCarregar}
            />
          </JanelaRedimensionavel>
        }
      >
        <div className={CLASSE_OPCOES}>
          <PainelDeClipes
            tipo="animacoes"
            categorias={SETORES.map(([titulo, itens], i) => ({ titulo, itens, aberta: i === 0 }))}
            atual={escolha}
            escolher={escolher}
          />
          {/* a weapon in one hand, the other hand or both: two hands clears the others and the reverse; clicking the active one removes it */}
          <Grupo
            titulo="🗡️ Mão principal (direita)"
            botoes={MAO_PRINCIPAL}
            atual={principal}
            escolher={(id) => {
              setPrincipal(alterna(principal, id));
              setDuas('');
            }}
          />
          <Grupo
            titulo="🛡️ Mão secundária (esquerda)"
            botoes={MAO_SECUNDARIA}
            atual={secundaria}
            escolher={(id) => {
              setSecundaria(alterna(secundaria, id));
              setDuas('');
            }}
          />
          <Grupo
            titulo="🙌 Duas mãos"
            botoes={DUAS_MAOS}
            atual={duas}
            escolher={(id) => {
              setDuas(alterna(duas, id));
              setPrincipal('');
              setSecundaria('');
            }}
          />
        </div>
        <AcoesDoJogo
          personagem={`anim-${modelo}`}
          nomePersonagem={modelo}
          atual={escolha}
          prefixo="clip:"
          nomeDe={nomeDe}
          escolher={escolher}
        />
        <Sequencias atual={escolha} prefixo="clip:" nomeDe={nomeDe} sequencia={sequencia} />
      </LadoALado>
    </>
  );
}
