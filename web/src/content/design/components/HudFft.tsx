// Test of 15/11: the HUD of the Final Fantasy Tactics screen redone in "Ouro e couro", one element per Gemini
// conversation. Slots without a file yet say "aguardando".
import { useState } from 'react';
import { ASSETS } from '../dados';

const PASTA = `${ASSETS}/pixellab`;
const GEMINI = 'https://gemini.google.com/app/';

function Slot({ arquivo, nome }: { arquivo: string; nome: string }) {
  const [falhou, setFalhou] = useState(false);
  return falhou ? (
    <div className="grid h-40 max-w-[620px] place-items-center border border-dashed border-borda bg-folha text-[13px] text-apagado">
      aguardando: {nome}
    </div>
  ) : (
    <img
      src={`${PASTA}/${arquivo}`}
      alt={nome}
      loading="lazy"
      onError={() => setFalhou(true)}
      className="block max-w-[620px] bg-[#7a7a7a]"
    />
  );
}

export function HudFft() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">Tela de referência (layout)</strong>
        <img
          src={`${PASTA}/hud-ref-fft-tela.jpg`}
          alt="Tela de batalha do Final Fantasy Tactics"
          loading="lazy"
          className="block max-w-full w-[720px]"
        />
        <span className="text-[14px] text-apagado">
          Só o layout e os tipos de elemento servem de referência; o visual é o Ouro e couro, sem copiar arte.
        </span>
      </section>
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">Tentativa 1: folha com todos os elementos de uma vez</strong>
        <span className="text-[14px]">
          Gemini, 16:9 (1376×768). Ficou bom no conjunto, mas escreveu PV/PM/TC e o número 11 apesar do pedido de "sem
          texto". Versão recortada: hud-fft-folha-alfa.png.
        </span>
        <div className="flex flex-wrap gap-4">
          <img
            src={`${PASTA}/ui-gem-lote5-hud-fft-full.jpg`}
            alt="Folha do HUD do FFT em couro e ouro"
            loading="lazy"
            className="block max-w-[620px] bg-[#7a7a7a]"
          />
        </div>
        <a href={`${GEMINI}646cdf534d0f3014`} target="_blank" rel="noreferrer" className="text-[14px] underline">
          Conversa no Gemini
        </a>
      </section>
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">Peça 1: ficha do personagem (canto inferior esquerdo)</strong>
        <span className="text-[14px]">
          Retrato, nome e nível, barras de PV, PM e TC, bravura e fé. Uma peça por conversa do Gemini.
        </span>
        <Slot arquivo="hud-ficha-1.jpg" nome="ficha do personagem" />
      </section>
    </div>
  );
}
