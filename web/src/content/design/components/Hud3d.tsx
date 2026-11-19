// Test page: combat bar built in 3D (Three.js) over a 3D scene of the game; the same bar in HTML/CSS over the same scene;
// and the exact FFT bar in 3D, with a version selector to follow its evolution. The viewer box is the shared Cena3d
// component (resizable); the scene code lives in cena-hud.ts / cena-fft.ts and is loaded on demand.
import { FILTRO } from '@/components/ui/toggle';
import { useEffect, useRef, useState } from 'react';
import { Cena3d } from '@/components/content/Cena3d';
import { HudCss } from './HudCss';
import type { Cena } from './cena-hud';
import { VERSOES_FFT } from './versoes-fft';

function CenaHud({
  comHud,
  fft = false,
  versao = 4,
  altura,
  aplicado,
  aoTocar,
  rotulo,
}: {
  comHud: boolean;
  fft?: boolean;
  versao?: number;
  altura?: string;
  aplicado: boolean;
  aoTocar: () => void;
  rotulo: string;
}) {
  const cena = useRef<Cena | null>(null);
  const [pronta, setPronta] = useState(false);
  // keep the scene in step with the page without rebuilding it
  useEffect(() => cena.current?.versao(versao), [pronta, versao]);
  useEffect(() => cena.current?.confirmar(aplicado), [pronta, aplicado]);
  return (
    <Cena3d<Cena>
      chave={`${comHud}-${fft}`}
      altura={altura}
      rotulo={rotulo}
      criar={async (canvas) => (await import('./cena-hud')).criarCena(canvas, comHud, fft)}
      aoPronta={(c) => {
        cena.current = c;
        setPronta(c !== null);
      }}
      aoPonteiro={(x, y) => {
        if (cena.current?.hit(x, y)) aoTocar();
      }}
    >
      {!comHud && <HudCss aplicado={aplicado} aoTocar={aoTocar} />}
    </Cena3d>
  );
}

export function Hud3d() {
  const [aplicado, setAplicado] = useState(false);
  const [versao, setVersao] = useState(4);
  const alternar = () => setAplicado((a) => !a);
  return (
    <div className="my-4 max-w-[1280px]">
      <p className="mb-3 text-sm text-tinta-suave">
        Cada visor 3D desta página pode ser redimensionado: arraste o canto inferior direito.
      </p>
      <h2 className="mb-2 mt-0 text-xl">1. A barra em 3D (Three.js)</h2>
      <p className="mb-2 mt-0 text-xs text-tinta-suave">Gerado por: Sonnet 5.5, esforço médio</p>
      <CenaHud
        comHud
        aplicado={aplicado}
        aoTocar={alternar}
        rotulo="Cena 3D do jogo com a barra de combate desenhada em 3D por cima"
      />
      <button type="button" onClick={alternar} aria-pressed={aplicado} className={`mt-3 ${FILTRO}`}>
        {aplicado ? 'Desfazer o golpe' : 'Confirmar o golpe (36 de dano)'}
      </button>
      <p className="mt-2 text-sm text-tinta-suave">
        Também vale tocar no bloco do meio da barra. O botão vale para as três versões desta página.
      </p>
      <h2 className="mb-2 mt-8 text-xl">2. A mesma barra em HTML/CSS</h2>
      <p className="mb-2 mt-0 text-xs text-tinta-suave">Gerado por: Sonnet 5.5, esforço médio</p>
      <CenaHud
        comHud={false}
        aplicado={aplicado}
        aoTocar={alternar}
        rotulo="Cena 3D do jogo com a barra de combate em HTML e CSS por cima"
      />
      <h2 className="mb-2 mt-8 text-xl">3. A barra exata do FFT, em 3D</h2>
      <p className="mb-2 mt-0 text-xs text-tinta-suave">Gerado por: Sonnet 5.5, esforço médio (versões v1 a v5)</p>
      <p className="mb-2 text-sm text-tinta-suave">
        Em cima, o recorte da captura de referência (Final Fantasy Tactics, tela de prévia de golpe, Ramza contra
        Thomas). Embaixo, a recriação em 3D com as mesmas medidas, sobre a nossa cena. Escolha a versão para ver a
        evolução.
      </p>
      <div
        role="img"
        aria-label="Recorte da barra de combate do Final Fantasy Tactics: Ramza, 36 de dano, Thomas"
        className="mb-2 w-full rounded-lg border border-borda bg-no-repeat"
        style={{
          aspectRatio: '1760 / 215',
          backgroundImage: 'url(/content/design/refs/fft-ivalice/01-previa.jpg)',
          backgroundSize: `${(1920 / 1760) * 100}% auto`,
          backgroundPosition: '40.6% 93.4%',
        }}
      />
      <div role="radiogroup" aria-label="Versão da recriação" className="mb-2 flex flex-wrap gap-1.5">
        {VERSOES_FFT.map(([n, nome]) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={versao === n}
            onClick={() => setVersao(n)}
            className="min-h-11 cursor-pointer rounded-md border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-checked:border-lab aria-checked:bg-lab aria-checked:text-creme"
          >
            {nome}
          </button>
        ))}
      </div>
      <p className="mb-2 mt-0 text-xs text-tinta-suave">
        Versão v{versao} gerada por: Sonnet 5.5, esforço médio (todas as versões de v1 a v5).
      </p>
      <CenaHud
        comHud
        fft
        versao={versao}
        altura="h-[min(88vh,900px)]"
        aplicado={aplicado}
        aoTocar={alternar}
        rotulo="Cena 3D do jogo com a barra do FFT recriada em 3D por cima"
      />
      <p className="mt-2 text-sm text-tinta-suave">
        Referência inteira:{' '}
        <a href="/content/design/refs/fft-ivalice/01-previa.jpg" target="_blank" rel="noreferrer" className="underline">
          01-previa.jpg
        </a>
        . No celular esta barra fica pequena demais (é a barra do console, desenhada para 1920 px).
      </p>
      <h2 className="mb-2 mt-8 text-xl">4. A mesma barra, recriada pelo Opus 5.5 (do zero)</h2>
      <p className="mb-2 mt-0 text-xs text-tinta-suave">Gerado por: Opus 5.5, esforço alto (subagente independente)</p>
      <p className="mb-2 text-sm text-tinta-suave">
        Uma segunda implementação, feita sem olhar a da seção 3, para comparar. Os painéis são vidro fosco de verdade (a
        cena é desfocada e lida por baixo deles), as barras são desenhadas por shader, e o golpe se repete em laço: o
        trecho vermelho do HP do Thomas escoa, o número desce de 54 para 18 e os retratos reagem.
      </p>
      <Cena3d
        chave="opus"
        altura="h-[min(88vh,900px)]"
        rotulo="Cena 3D: o cavaleiro golpeia o esqueleto mago, com a barra de combate do FFT recriada em 3D pelo Opus 5.5"
        criar={async (c) => (await import('./cena-fft-opus')).criarCenaOpus(c)}
      />
    </div>
  );
}
