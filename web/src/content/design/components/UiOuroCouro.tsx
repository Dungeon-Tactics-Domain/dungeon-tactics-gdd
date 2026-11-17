// Test of 15/11: every interface asset in the "Ouro e couro" style, made with Gemini (painted sheets) and PixelLab
// (real pixel art). Each batch shows what went in and what came out; batches not run yet say so.
import { ASSETS } from '../dados';

const PASTA = `${ASSETS}/pixellab`;
interface Resultado {
  arquivo: string;
  legenda: string;
}
interface Lote {
  titulo: string;
  pecas: string;
  gemini?: Resultado;
  pixellab?: Resultado;
  nota?: string;
  links?: [rotulo: string, url: string][];
}
const GEMINI = 'https://gemini.google.com/app/';
const PIXELLAB_UI = 'https://www.pixellab.ai/create?tool=create_ui_pro';

const LOTES: Lote[] = [
  {
    titulo: 'Lote 1: painéis e molduras',
    links: [
      ['Conversa no Gemini', `${GEMINI}f89699541bc67f34`],
      ['Ferramenta no PixelLab (UI Elements Pro)', PIXELLAB_UI],
    ],
    pecas:
      'painel grande, painel pequeno, moldura de retrato, aba da fila de turnos, caixa de diálogo, banner, divisor.',
    gemini: {
      arquivo: 'ui-gem-lote1-paineis-full.png',
      legenda:
        'Gemini, folha 16:9 em tamanho original (1376×768; a prévia da conversa é só 1024×572), referência anexada. Sem texto, fundo liso, peças separadas e discretas.',
    },
    pixellab: {
      arquivo: 'ui-pl-painel-1.png',
      legenda:
        'PixelLab UI Elements Pro, 256×256, 10 gerações: moldura de couro com filete de ouro e cantos de aço azul, centro vazio (serve para 9-slice).',
    },
    nota: 'Gemini: peças em pintura; versão com fundo recortado (PNG transparente, 1376×768): ui-gem-lote1-paineis-alfa.png, na pasta pixellab. PixelLab: pixel art de verdade, uma peça por geração.',
  },
  {
    titulo: 'Lote 2: botões e menu',
    links: [
      ['Conversa no Gemini', `${GEMINI}f6dd7f4523c7cc40`],
      ['Ferramenta no PixelLab (UI Elements Pro, menu de ações)', PIXELLAB_UI],
    ],
    pecas:
      'botão primário e secundário (normal, hover, pressionado, desativado), linha de menu com foco, botão de ícone, seta de foco.',
    gemini: {
      arquivo: 'ui-gem-lote2-botoes-full.png',
      legenda:
        'Gemini, folha 16:9 (1376×768), referência anexada. Em cima, botão dourado nos 4 estados; no meio, botão de couro nos 4 estados; embaixo, seta de foco (normal e foco) e botões redondos de X e de menu. Sem texto.',
    },
    pixellab: {
      arquivo: 'ui-pl-menu-acoes-1.png',
      legenda:
        'PixelLab UI Elements Pro, 256×256, fundo transparente, 10 gerações (conta nova): menu de ações do lado direito do HUD, com o recorte da captura como conceito. Quatro linhas com ícone (bota, espada, ampulheta, pergaminho), primeira em ouro com a mão apontando, cantos de aço azul.',
    },
    nota: 'Versão com fundo recortado do Gemini (PNG transparente): ui-gem-lote2-botoes-alfa.png, na pasta pixellab. O PixelLab não faz o texto, então as linhas saem sem rótulo.',
  },
  {
    titulo: 'Lote 3: barras, marcadores e ícones',
    pecas: 'barras de PV/PM/TC com gema, marcadores de casa, ícones de habilidade e status, nós do mapa-múndi.',
  },
  { titulo: 'Lote 4: telas montadas', pecas: 'batalha, mapa e ficha com os elementos acima sobre a captura do jogo.' },
];

function Figura({ r }: { r: Resultado }) {
  return (
    <figure className="m-0 grid max-w-[620px] gap-1.5">
      <img
        src={`${PASTA}/${r.arquivo}`}
        alt={r.legenda}
        loading="lazy"
        className="block max-w-full bg-[#7a7a7a] [image-rendering:auto]"
      />
      <figcaption className="text-[13px] text-apagado">{r.legenda}</figcaption>
    </figure>
  );
}

export function UiOuroCouro() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <section className="grid gap-2 border border-borda bg-folha px-3.5 py-3">
        <strong className="text-[17px]">Referência de estilo enviada às duas ferramentas</strong>
        <img
          src={`${PASTA}/ui-ref-ouro-aplicado.png`}
          alt="Referência Ouro e couro aplicado sobre o jogo"
          loading="lazy"
          className="block max-w-[520px]"
        />
        <span className="text-[14px] text-apagado">
          Aplicado sobre o jogo, Ouro e couro (2ª versão, Copilot): proporção discreta, couro, ouro e aço azulado.
        </span>
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
          {l.links && (
            <span className="flex flex-wrap gap-x-4 text-[14px]">
              {l.links.map(([rot, url]) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="underline">
                  {rot}
                </a>
              ))}
            </span>
          )}
          {l.nota && <span className="text-[14px]">{l.nota}</span>}
        </section>
      ))}
    </div>
  );
}
