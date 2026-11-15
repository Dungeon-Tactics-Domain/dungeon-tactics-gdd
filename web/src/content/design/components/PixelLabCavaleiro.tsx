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
// the render turns clockwise from the front, so the order differs from the result slots'
const ANGULOS = ['Sul', 'Sudeste', 'Leste', 'Nordeste', 'Norte', 'Noroeste', 'Oeste', 'Sudoeste'];
const DIRECOES = ['Sul', 'Sudoeste', 'Oeste', 'Noroeste', 'Norte', 'Nordeste', 'Leste', 'Sudeste'];
const FILEIRAS: [prefixo: string, titulo: string][] = [
  ['res-parado', 'Parado, 8 direções (128 px)'],
  ['res-andar', 'Andando, 8 direções'],
];

function Quadro({ src, nome }: { src: string; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <figure className="m-0 grid w-32 justify-items-center gap-1">
      <div className="grid size-32 place-items-center border border-dashed border-borda bg-folha text-center text-[12px] text-apagado">
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
      <figcaption className="text-[13px]">{nome}</figcaption>
    </figure>
  );
}

export function PixelLabCavaleiro() {
  return (
    <div className="grid gap-5">
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">O que vamos pedir</strong>
        <ul className="m-0 grid gap-1 pl-5 text-[15px]">
          <li>Cavaleiro em 8 direções, 128 px, vista alta (câmera de tática), fundo transparente, <strong>sem arma e sem escudo</strong>: armas e escudos serão peças separadas e trocáveis.</li>
          <li>Depois, ciclo de andar nas 8 direções. Só parado e andar; ataque e dano ficam para outro teste.</li>
          <li>Plano grátis primeiro: 40 gerações rápidas e 5 lentas por dia. Se uma ferramenta Pro travar, paro e aviso.</li>
          <li>Ferramentas: "Create 8-directional sprite (Pro)" ou Rotate; "style references (Pro)" para o rosto.</li>
        </ul>
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Cavaleiro 3D em 8 ângulos (sem arma e escudo)</strong>
        <span className="text-[14px] text-apagado">
          Renders do modelo KayKit do jogo em pose parada, câmera alta (35°), 512 px, fundo transparente. Servem de base de identidade em cada direção.
        </span>
        <div className="flex flex-wrap gap-3">
          {ANGULOS.map((d, i) => (
            <figure key={d} className="m-0 grid w-40 justify-items-center gap-1">
              <img
                src={`${PASTA}/ref-cavaleiro-3d-${i + 1}.png`}
                alt={`Cavaleiro 3D, ${d}`}
                loading="lazy"
                className="block h-52 w-40 bg-[#10285a] object-contain"
              />
              <figcaption className="text-[13px]">{d}</figcaption>
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
