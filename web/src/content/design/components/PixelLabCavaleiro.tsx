// PixelLab test of 15/11: what goes in (references) and where the results land (slots filled by dropping the file in
// public/content/design/pixellab/). A slot with no file yet shows "aguardando".
import { useState } from 'react';
import { ASSETS } from '../dados';

const PASTA = `${ASSETS}/pixellab`;
const REFS: [arquivo: string, titulo: string, uso: string][] = [
  [
    'ref-2-rosto-px-8q.png',
    'Rosto em uso no jogo (8 expressões)',
    'Rosto oficial atual (versão D, 8 quadros de 256 px), pasta px do jogo. Vai como style reference: traço, cores e olhar.',
  ],
];
// the camera sees units on the 4 diagonals (grid axes at a 45° yaw); the other 4 directions are mirrors
const ANGULOS = [
  'Sudeste (frente-direita)',
  'Nordeste (costas-direita)',
  'Noroeste (costas-esquerda)',
  'Sudoeste (frente-esquerda)',
];
const DIRECOES = ['Sul', 'Sudoeste', 'Oeste', 'Noroeste', 'Norte', 'Nordeste', 'Leste', 'Sudeste'];
const FILEIRAS: [prefixo: string, titulo: string][] = [
  ['res-parado', 'Parado, 8 direções (128 px)'],
  ['res-andar', 'Andando, 8 direções'],
];

function Quadro({ src, nome }: { src: string; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <figure className="m-0 grid w-32 justify-items-center gap-1">
      <div className="grid size-32 place-items-center border border-dashed border-borda bg-folha text-center text-[14px] text-apagado">
        {falhou ? (
          'aguardando'
        ) : (
          <img
            src={src}
            alt={nome}
            loading="lazy"
            onError={() => setFalhou(true)}
            className="block size-32 object-contain [image-rendering:pixelated]"
          />
        )}
      </div>
      <figcaption className="text-[14px]">{nome}</figcaption>
    </figure>
  );
}

export function PixelLabCavaleiro() {
  return (
    <div className="grid gap-5">
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">O que vamos pedir</strong>
        <ul className="m-0 grid gap-1 pl-5 text-[15px]">
          <li>
            Cavaleiro nas 4 diagonais (resto por espelho), 128 px, câmera a 32° de inclinação como o jogo, fundo
            transparente, <strong>sem arma e sem escudo</strong>: armas e escudos serão peças separadas e trocáveis.
          </li>
          <li>Depois, ciclo de andar nas 8 direções. Só parado e andar; ataque e dano ficam para outro teste.</li>
          <li>
            Plano grátis primeiro: 40 gerações rápidas e 5 lentas por dia. Se uma ferramenta Pro travar, paro e aviso.
          </li>
          <li>Ferramentas: "Create 8-directional sprite (Pro)" ou Rotate; "style references (Pro)" para o rosto.</li>
        </ul>
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Cavaleiro 3D nas 4 diagonais do jogo (sem arma e escudo)</strong>
        <span className="text-[14px] text-apagado">
          Ângulo medido em scene.ts: câmera ortográfica a 32° de inclinação (ângulo do FFT), girando de 45° em 45°; as
          unidades andam nos eixos da grade, então aparecem sempre nas 4 diagonais (as outras 4 viram espelho). Renders
          do modelo KayKit em pose parada, 512 px, fundo transparente.
        </span>
        <div className="flex flex-wrap gap-3">
          {ANGULOS.map((d, i) => (
            <figure key={d} className="m-0 grid w-40 justify-items-center gap-1">
              <img
                src={`${PASTA}/ref-diagonal-${i + 1}.png`}
                alt={`Cavaleiro 3D, ${d}`}
                loading="lazy"
                className="block h-52 w-40 bg-[#10285a] object-contain"
              />
              <figcaption className="text-[14px]">{d}</figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Referência de rosto</strong>
        <div className="flex flex-wrap gap-4">
          {REFS.map(([arq, titulo, uso]) => (
            <figure key={arq} className="m-0 grid max-w-[340px] gap-1.5 border border-borda bg-folha p-3">
              <img
                src={`${PASTA}/${arq}`}
                alt={titulo}
                className="block max-h-[200px] max-w-full self-center justify-self-center bg-[#10285a] object-contain [image-rendering:pixelated]"
              />
              <figcaption className="grid gap-1 text-[14px]">
                <strong>{titulo}</strong>
                <span className="text-apagado">{uso}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Resultado 1: personagem-base Sudeste (128 px, 4 variações)</strong>
        <span className="text-[14px] text-apagado">
          Create image (Pro), plano grátis, 10 gerações, 15/11. Refs: render diagonal SE + rosto neutro. Prompt: câmera
          32° acima, ortográfica, estilo FFT, Cavaleiro virado para a diagonal inferior direita, sem arma e escudo. Em
          cima à esquerda e embaixo à direita estão na diagonal certa; em cima à direita fica de frente com viseira
          baixa e embaixo à esquerda tem a viseira fechada.
        </span>
        <img
          src={`${PASTA}/res-base-se-folha.png`}
          alt="Cavaleiro Sudeste, 4 variações"
          className="block size-[512px] max-w-full bg-[#10285a] [image-rendering:pixelated]"
        />
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Resultado 2: folha de andar Sudeste (4 quadros, 128 px)</strong>
        <span className="text-[14px] text-apagado">
          Animate exige plano pago, então saiu pelo Create image (Pro) com o personagem-base (cima à esquerda do
          resultado 1) e o rosto como referências, 10 gerações, 15/11. Prompt: folha 2x2 de 4 quadros, passo com o pé
          esquerdo, parado, pé direito, parado, mesmo ângulo de 32° e sem arma. Quadros consistentes entre si; o balanço
          do corpo é pequeno. À direita, o ciclo a 180 ms por quadro, 3x.
        </span>
        <div className="flex flex-wrap gap-4">
          <img
            src={`${PASTA}/res-andar-se-folha.png`}
            alt="Folha de andar Sudeste"
            className="block size-[384px] max-w-full bg-[#10285a] [image-rendering:pixelated]"
          />
          <img
            src={`${PASTA}/res-andar-se.gif`}
            alt="Ciclo de andar Sudeste"
            className="block size-[384px] max-w-full [image-rendering:pixelated]"
          />
        </div>
      </section>
      <section className="grid gap-3">
        <strong className="text-[17px]">Resultados (espaços vazios até gerar)</strong>
        {FILEIRAS.map(([pre, titulo]) => (
          <div key={pre} className="grid gap-2">
            <span className="text-[15px]">{titulo}</span>
            <div className="flex flex-wrap gap-3">
              {DIRECOES.map((d, i) => (
                <Quadro key={d} src={`${PASTA}/${pre}-${i + 1}.png`} nome={d} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
