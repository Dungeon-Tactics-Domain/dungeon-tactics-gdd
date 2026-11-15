// Local pixelizers test (research of 15/11): each tool converted the neutral, talking 1 and talking 2 frames of 3
// characters. The rows animate the speech in the 0-1-2-1 cycle (180 ms) to show the jitter; 4x, no smoothing.
// Ported from dungeon-tactics-lab/design/src/pixelizar.ts.
import { useEffect, useState } from 'react';
import { ASSETS } from '../dados';

// so: the SDXL rows only ran on the knight and the mage
const FERRAMENTAS: [pasta: string, nome: string, nota: string, so?: string[]][] = [
  ['controle-pillow', 'Controle (Pillow: reduzir 4x + paleta comum)', 'Referência simples, sem ferramenta.'],
  [
    'proper-pixel-art-grade-fixa',
    'proper-pixel-art, grade fixa de 4 px (recomendada)',
    'MIT, sem GPU. Mesma grade 64x64 e paleta de 32 cores em todos os quadros; nota 4/5.',
  ],
  [
    'proper-pixel-art',
    'proper-pixel-art, grade detectada',
    'A detecção sozinha gera grades diferentes por quadro (65x64, 69x72): treme.',
  ],
  ['unfake', 'unfake (manual_scale 4)', 'MIT, sem GPU. Grade e paleta iguais; boca e sombras mais borradas; nota 3/5.'],
  [
    'pixel-snapper',
    'Pixel Snapper (Rust)',
    'MIT. O visual mais plano e limpo, mas cada quadro sai de um tamanho (60, 61, 64): não serve para animar.',
  ],
  ['pixeloe', 'PixelOE', 'Apache-2.0. Grade ok, mas a paleta passa de 1.000 cores; nota 3/5.'],
  ['perfect-pixel', 'perfect-pixel', 'MIT. Grade reposicionada a cada quadro e cerca de 5.000 cores; nota 2/5.'],
  [
    '../sdxl/s000-controle',
    'Controle do SDXL (só reduzir, sem IA)',
    'Fonte reduzida a 128 px com 32 cores: o melhor deste teste. Só cavaleiro e maga.',
    ['knight', 'mage'],
  ],
  [
    '../sdxl/s035-seed7',
    'SDXL + Pixel Art XL, força 0.35',
    'RTX 5070, 12 a 16 s por imagem. Rosto fica sujo e a boca aberta vira borrão; nota 3/5. Só cavaleiro e maga.',
    ['knight', 'mage'],
  ],
  [
    '../sdxl/s035-seed7-boca',
    'SDXL 0.35 com só a boca colada',
    'Elimina o tremor da fala, mas não conserta o rosto sujo. Só cavaleiro e maga.',
    ['knight', 'mage'],
  ],
];
const PERSONAGENS: [id: string, nome: string][] = [
  ['knight', 'Cavaleiro'],
  ['mage', 'Maga'],
  ['barbarian', 'Bárbaro'],
];
const CICLO = [0, 1, 2, 1];

export function Pixelizar() {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setN((x) => x + 1), 180);
    return () => clearInterval(t);
  }, []);
  const q = CICLO[n % CICLO.length];
  return (
    <div className="grid gap-3.5">
      {FERRAMENTAS.map(([pasta, nome, nota, so]) => (
        <section key={pasta} className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
          <strong className="text-[17px] leading-tight">{nome}</strong>
          <span className="text-[14px] text-apagado">{nota}</span>
          <div className="flex flex-wrap gap-4">
            {PERSONAGENS.filter(([i]) => !so || so.includes(i)).map(([id, nomeP]) => (
              <figure key={id} className="m-0 grid justify-items-center gap-1">
                <div className="p-1.5" style={{ background: 'linear-gradient(#1c3a78,#0b1a3e)' }}>
                  <img
                    src={`${ASSETS}/ia/pixelizar/${pasta}/${id}-q${q}.png`}
                    alt={`${nomeP} (${nome})`}
                    className="block size-48 object-contain [image-rendering:pixelated]"
                  />
                </div>
                <figcaption className="text-[13px]">{nomeP}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
