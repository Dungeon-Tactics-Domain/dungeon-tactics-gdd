// Remodelled KayKit characters beside the original on the 3D bench (Nov 15, Fernando's request: "is it on the site yet?"):
// same clip and weapons in every viewer. The models come from the remodel agent's proporcoes.json (original, 3 to 7
// heads as they appear); compare two or three side by side, each window with its sheet.
import { useState } from 'react';
import { type Ficha, fichaKayKit } from '../fichas';
import { BENCH, CLASSE_OPCOES, CLASSE_VIEWER } from './bancada';
import { FichaPreview } from './FichaPreview';
import { JanelaRedimensionavel } from './JanelaRedimensionavel';
import { fichaDaProporcao, useProporcoes } from './proporcoes';
import { BOTAO, Botoes } from './Visualizador';

// the remodel only exists for the knight; its rest pose, Idle and scale come from char=knight
const CHAR = 'knight';
const MAXIMO = 3;
interface Modelo {
  id: string;
  nome: string;
  arquivo: string;
  ficha: Ficha | 'medindo';
}
// while proporcoes.json is not on the bench: the two files that already exist (knight-5h.md, Nov 15)
const RESERVA: Modelo[] = [
  { id: 'original', nome: 'Original (KayKit)', arquivo: `/models/${CHAR}.glb`, ficha: fichaKayKit(CHAR) },
  { id: '5h', nome: '5 cabeças', arquivo: `/eval/kaykit-remodel/${CHAR}-5h.glb`, ficha: 'medindo' },
];

const GESTOS = [
  ['Idle', 'Parado'],
  ['Walking_A', 'Andar'],
  ['Melee_1H_Attack_Chop', 'Golpe de cima'],
  ['Melee_1H_Attack_Slice_Diagonal', 'Golpe diagonal'],
  ['Melee_1H_Attack_Stab', 'Estocada'],
  ['Melee_2H_Attack_Chop', 'Golpe de duas mãos'],
  ['Melee_Block_Attack', 'Bloquear'],
  ['Jump_Idle', 'No ar'],
  ['Use_Item', 'Usar item'],
] as const;
const ARMAS = [
  ['sword_1handed', 'shield_round', 'Espada e escudo'],
  ['sword_2handed', '', 'Espada de duas mãos'],
  ['', '', 'Sem arma'],
] as const;

const url = (glb: string, char: string, anim: string, principal: string, secundaria: string) => {
  const q = new URLSearchParams({ glb, char, kaykit: '1', solo: '1', anim, zoom: '1.2', fy: '0.42', fx0: '0' });
  if (principal) q.set('weapon', principal);
  if (secundaria) q.set('off', secundaria);
  return `${BENCH}?${q}`;
};

export function Remodelagem() {
  const lista = useProporcoes();
  const [escolhidos, setEscolhidos] = useState<string[] | null>(null);
  const [anim, setAnim] = useState<string>(GESTOS[0][0]);
  const [arma, setArma] = useState<number>(0);
  const [principal, secundaria] = ARMAS[arma] ?? ARMAS[0];
  if (lista === 'carregando') return <p className="m-0 text-apagado">Carregando…</p>;
  const modelos: Modelo[] =
    lista === 'medindo'
      ? RESERVA
      : lista.map((p) => ({ id: p.id, nome: p.nome, arquivo: p.arquivo, ficha: fichaDaProporcao(p) }));
  // until the user picks: the first (the original) beside the 5-head one, the proportion the page is about, else the
  // second; ids no longer in the file drop out
  const cinco = lista === 'medindo' ? undefined : lista.find((p) => p.cabecas === 5)?.id;
  const padrao = [modelos[0]?.id, cinco ?? modelos[1]?.id].filter((id): id is string => !!id);
  const ativos = (escolhidos ?? padrao).filter((id) => modelos.some((m) => m.id === id));
  const alternar = (id: string) =>
    setEscolhidos(
      ativos.includes(id)
        ? ativos.length > 1
          ? ativos.filter((x) => x !== id)
          : ativos
        : [...ativos, id].slice(-MAXIMO),
    );
  return (
    <div className="grid gap-4">
      <div className={CLASSE_OPCOES}>
        <div className="mb-1 font-bold">Comparar (até {MAXIMO})</div>
        <div role="group" aria-label="Modelos para comparar" className="mb-2.5 flex flex-wrap gap-1.5">
          {modelos.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={ativos.includes(m.id)}
              onClick={() => alternar(m.id)}
              className={BOTAO}
            >
              {m.nome}
            </button>
          ))}
        </div>
        {lista === 'medindo' && (
          <p className="m-0 mb-2.5 text-apagado">
            As medidas dos modelos ainda não chegaram à bancada (medindo… ainda não disponível); por enquanto, o
            original e o de 5 cabeças.
          </p>
        )}
        <Botoes rotulo="Gesto" itens={GESTOS} atual={anim} escolher={setAnim} />
        <Botoes rotulo="Arma" itens={ARMAS.map(([, , n], i) => [i, n] as const)} atual={arma} escolher={setArma} />
      </div>
      <div className="flex flex-wrap items-start gap-4">
        {modelos
          .filter((m) => ativos.includes(m.id))
          .map((m) => (
            <figure key={m.id} className="m-0 grid max-w-full gap-1 max-[1023px]:w-full">
              <figcaption className="font-bold">{m.nome}</figcaption>
              <JanelaRedimensionavel
                tipo="remodelagem"
                rotulo={`Tamanho da janela: ${m.nome}`}
                ficha={<FichaPreview ficha={m.ficha} titulo={`Ficha: ${m.nome}`} />}
              >
                <iframe
                  src={url(m.arquivo, CHAR, anim, principal, secundaria)}
                  title={m.nome}
                  className={CLASSE_VIEWER}
                />
              </JanelaRedimensionavel>
            </figure>
          ))}
      </div>
    </div>
  );
}
