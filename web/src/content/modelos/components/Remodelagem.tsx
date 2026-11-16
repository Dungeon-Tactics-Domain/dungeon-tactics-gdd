// Remodelled KayKit characters beside the original on the 3D bench (Nov 15, Fernando's request: "is it on the site yet?"):
// same clip and weapons in both viewers, original on the left and the new proportion on the right.
import { useState } from 'react';
import { BENCH, CLASSE_OPCOES, CLASSE_VIEWER } from './bancada';
import { JanelaRedimensionavel } from './JanelaRedimensionavel';
import { Botoes } from './Visualizador';

const MODELOS = [['knight', 'Cavaleiro · 5 cabeças']] as const;
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
  const [modelo, setModelo] = useState<string>(MODELOS[0][0]);
  const [anim, setAnim] = useState<string>(GESTOS[0][0]);
  const [arma, setArma] = useState<number>(0);
  const [principal, secundaria] = ARMAS[arma] ?? ARMAS[0];
  return (
    <div className="grid gap-4">
      <div className={CLASSE_OPCOES}>
        <Botoes
          rotulo="Personagem"
          itens={MODELOS.map(([v, n]) => [v, n] as const)}
          atual={modelo}
          escolher={setModelo}
        />
        <Botoes rotulo="Gesto" itens={GESTOS} atual={anim} escolher={setAnim} />
        <Botoes rotulo="Arma" itens={ARMAS.map(([, , n], i) => [i, n] as const)} atual={arma} escolher={setArma} />
      </div>
      <div className="flex flex-wrap items-start gap-4">
        {[
          ['Original (KayKit)', `/models/${modelo}.glb`],
          ['5 cabeças', `/eval/kaykit-remodel/${modelo}-5h.glb`],
        ].map(([titulo, glb]) => (
          <figure key={titulo} className="m-0 grid max-w-full gap-1 max-[1023px]:w-full">
            <figcaption className="font-bold">{titulo}</figcaption>
            <JanelaRedimensionavel tipo="remodelagem" rotulo={`Tamanho da janela: ${titulo}`}>
              <iframe
                src={url(glb!, modelo, anim, principal, secundaria)}
                title={`${titulo}`}
                className={CLASSE_VIEWER}
              />
            </JanelaRedimensionavel>
          </figure>
        ))}
      </div>
    </div>
  );
}
