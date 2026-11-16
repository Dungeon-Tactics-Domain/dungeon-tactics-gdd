// Test of 15/11: every interface asset in the "Ouro e couro" style, made with Gemini (painted sheets) and PixelLab
// (real pixel art). Each batch shows what went in and what came out; batches not run yet say so.
import { ASSETS } from '../dados';

const PASTA = `${ASSETS}/pixellab`;
interface Resultado { arquivo: string; legenda: string }
interface Lote { titulo: string; pecas: string; gemini?: Resultado; pixellab?: Resultado; nota?: string }

const LOTES: Lote[] = [
  {
    titulo: 'Lote 1: painéis e molduras',
    pecas: 'painel grande, painel pequeno, moldura de retrato, aba da fila de turnos, caixa de diálogo, banner, divisor.',
    gemini: { arquivo: 'ui-gem-lote1-paineis-full.png', legenda: 'Gemini, folha 16:9 em tamanho original (1376×768; a prévia da conversa é só 1024×572), referência anexada. Sem texto, fundo liso, peças separadas e discretas.' },
    pixellab: { arquivo: 'ui-pl-painel-1.png', legenda: 'PixelLab UI Elements Pro, 256×256, 10 gerações: moldura de couro com filete de ouro e cantos de aço azul, centro vazio (serve para 9-slice).' },
    nota: 'Gemini: peças em pintura (precisam de recorte). PixelLab: pixel art de verdade, uma peça por geração.',
  },
  { titulo: 'Lote 2: botões e menu', pecas: 'botão primário e secundário (normal, hover, pressionado, desativado), linha de menu com foco, botão de ícone, seta de foco.' },
  { titulo: 'Lote 3: barras, marcadores e ícones', pecas: 'barras de PV/PM/TC com gema, marcadores de casa, ícones de habilidade e status, nós do mapa-múndi.' },
  { titulo: 'Lote 4: telas montadas', pecas: 'batalha, mapa e ficha com os elementos acima sobre a captura do jogo.' },
];

function Figura({ r }: { r: Resultado }) {
  return (
    <figure className="m-0 grid max-w-[620px] gap-1.5">
      <img src={`${PASTA}/${r.arquivo}`} alt={r.legenda} loading="lazy" className="block max-w-full bg-[#7a7a7a] [image-rendering:auto]" />
      <figcaption className="text-[13px] text-apagado">{r.legenda}</figcaption>
    </figure>
  );
}

export function UiOuroCouro() {
  return (
    <div className="grid gap-5">
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">Referência de estilo enviada às duas ferramentas</strong>
        <img src={`${PASTA}/ui-ref-ouro-aplicado.png`} alt="Referência Ouro e couro aplicado sobre o jogo" loading="lazy" className="block max-w-[520px]" />
        <span className="text-[14px] text-apagado">Aplicado sobre o jogo, Ouro e couro (2ª versão, Copilot): proporção discreta, couro, ouro e aço azulado.</span>
      </section>
      {LOTES.map((l) => (
        <section key={l.titulo} className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
          <strong className="text-[17px]">{l.titulo}</strong>
          <span className="text-[14px]">{l.pecas}</span>
          {l.gemini || l.pixellab ? (
            <div className="flex flex-wrap gap-4">
              {l.gemini && <Figura r={l.gemini} />}
              {l.pixellab && <Figura r={l.pixellab} />}
            </div>
          ) : (
            <span className="text-[14px] text-apagado">Ainda não gerado.</span>
          )}
          {l.nota && <span className="text-[14px]">{l.nota}</span>}
        </section>
      ))}
    </div>
  );
}
