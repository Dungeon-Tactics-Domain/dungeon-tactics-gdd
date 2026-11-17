// Test of 15/11: the "Ouro e couro" panels rebuilt in plain CSS, next to the Gemini sheet they imitate.
// Gold rim = outer element with the gold gradient; leather = ::before inset by the rim width, both with the same
// chamfered clip-path, so the rim follows the corner cuts (a plain border would be clipped away).
import { useState } from 'react';
import { ASSETS } from '../dados';

const CSS = `
.oc { --ouro: linear-gradient(135deg,#d9b866,#9b7a35 45%,#c9a752 70%,#7d6126); --corte: 9px; --aro: 3px;
  position: relative; display: grid; place-items: center; color: #e8d7a8;
  background: radial-gradient(ellipse at 50% 40%,rgba(255,235,190,.05),transparent 70%),
    repeating-linear-gradient(37deg,rgba(255,255,255,.012) 0 2px,transparent 2px 5px),
    linear-gradient(rgba(33,26,19,var(--alfa,.7)),rgba(23,18,13,var(--alfa,.7)));
  box-shadow: inset 0 0 22px rgba(0,0,0,.55); backdrop-filter: blur(3px);
  clip-path: polygon(var(--corte) 0,calc(100% - var(--corte)) 0,100% var(--corte),100% calc(100% - var(--corte)),calc(100% - var(--corte)) 100%,var(--corte) 100%,0 calc(100% - var(--corte)),0 var(--corte)); }
/* gold rim = ring cut out of a gold layer by a mask, so the leather behind it can be translucent */
.oc::before { content:''; position:absolute; inset:0; padding:var(--aro); background:var(--ouro);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; }
.oc::after { content:''; position:absolute; inset:calc(var(--aro) + 4px); border:1px solid rgba(201,167,82,.55);
  clip-path: polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px); pointer-events:none; }
.oc > * { position: relative; z-index: 1; }
.oc-retrato { --corte: 2px; --aro: 4px; }
.oc-retrato::after { border-width: 2px; inset: 12px; }
/* odd outlines (tab, banner) keep the old solid build: a mask ring cannot follow a polygon */
.oc-aba, .oc-banner { background: var(--ouro); backdrop-filter: none; box-shadow: none; }
.oc-aba::before, .oc-banner::before { inset: 3px; padding: 0; -webkit-mask: none; mask: none; background: linear-gradient(#211a13,#17120d); box-shadow: inset 0 0 22px #000; }
.oc-aba::after, .oc-banner::after { display:none; }
.oc-aba { --corte: 0px; clip-path: polygon(14% 0,86% 0,100% 50%,86% 100%,14% 100%,0 50%); }
.oc-aba::before { clip-path: polygon(14% 0,86% 0,100% 50%,86% 100%,14% 100%,0 50%); }
.oc-gema { position:absolute; width:22px; height:22px; background: linear-gradient(135deg,#9db8cf,#3f607c 55%,#243b52); border:2px solid #b89a4a; transform: rotate(45deg); z-index:2; }
.oc-banner { --corte: 0px; clip-path: polygon(0 50%,6% 18%,16% 14%,38% 14%,45% 0,55% 0,62% 14%,84% 14%,94% 18%,100% 50%,94% 82%,84% 86%,62% 86%,55% 100%,45% 100%,38% 86%,16% 86%,6% 82%); }
.oc-banner::before { clip-path: polygon(0 50%,6% 18%,16% 14%,38% 14%,45% 0,55% 0,62% 14%,84% 14%,94% 18%,100% 50%,94% 82%,84% 86%,62% 86%,55% 100%,45% 100%,38% 86%,16% 86%,6% 82%); }
.oc-divisor { height: 14px; background:
  linear-gradient(90deg,transparent,#9b7a35 18%,#4f7090 46%,#4f7090 54%,#9b7a35 82%,transparent) center/100% 3px no-repeat; position: relative; }
.oc-divisor::after { content:''; position:absolute; left:50%; top:50%; width:11px; height:11px; transform:translate(-50%,-50%) rotate(45deg); background:linear-gradient(135deg,#9db8cf,#3f607c); border:2px solid #c9a752; }

.mn { position:relative; width:386px; padding:6px; clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px); }
.mn::before { content:''; position:absolute; inset:0; padding:6px; background:var(--ouro); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none; }
.mn-in { position:relative; padding:6px 8px; background:radial-gradient(ellipse at 50% 30%,rgba(255,235,190,.04),transparent 70%),linear-gradient(rgba(29,23,17,var(--alfa,.7)),rgba(19,15,10,var(--alfa,.7))); box-shadow:inset 0 0 0 1px #5c4a22, inset 0 0 20px rgba(0,0,0,.5); backdrop-filter:blur(3px);
  clip-path:polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px); }
.mn-in::before,.mn-in::after { content:''; position:absolute; width:16px; height:16px; border:2px solid #b8923f; pointer-events:none; }
.mn-in::before { left:3px; top:3px; border-right:0; border-bottom:0; border-top-left-radius:6px; }
.mn-in::after { right:3px; bottom:3px; border-left:0; border-top:0; border-bottom-right-radius:6px; }
.mn-li { position:relative; display:flex; align-items:center; gap:22px; height:62px; padding-left:22px; font:600 30px/1 Georgia,'Times New Roman',serif; color:#e9dcc0; border-bottom:1px solid rgba(184,146,63,.45); }
.mn-li:last-child { border-bottom:0; }
.mn-li img { width:36px; image-rendering:pixelated; }
.mn-li.on { color:#2a1d0c; border:0; border-radius:3px; background:linear-gradient(#d8b862,#b08a38 55%,#9a7630); box-shadow:inset 0 0 0 1px #f0d98a, inset 0 -3px 6px rgba(80,50,10,.5), 0 0 0 1px #3a2a10; }
.mn-mao { position:absolute; left:-34px; top:34px; width:46px; image-rendering:pixelated; z-index:3; filter:drop-shadow(0 2px 0 rgba(0,0,0,.5)); }
`;

const ITENS: [icone: string, nome: string][] = [
  ['bota', 'Mover'],
  ['espada', 'Agir'],
  ['ampulheta', 'Esperar'],
  ['pergaminho', 'Status'],
];

function Painel({
  nome,
  classe = '',
  estilo,
  filhos,
}: {
  nome: string;
  classe?: string;
  estilo: React.CSSProperties;
  filhos?: React.ReactNode;
}) {
  return (
    <div className={`oc ${classe}`} style={estilo} role="img" aria-label={nome}>
      {filhos}
    </div>
  );
}

export function PaineisCss() {
  const [alfa, setAlfa] = useState(0.7);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5" style={{ ['--alfa' as string]: alfa }}>
      <style>{CSS}</style>
      <label className="flex flex-wrap items-center gap-3 border border-borda bg-folha px-3.5 py-2.5 text-[15px]">
        <strong>Opacidade do couro (jogo no celular: painéis mais transparentes)</strong>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.05"
          value={alfa}
          onChange={(e) => setAlfa(Number(e.target.value))}
        />
        <span>{Math.round(alfa * 100)}%</span>
      </label>
      <section className="grid gap-2">
        <strong className="text-[17px]">Em CSS puro (sem imagem)</strong>
        <span className="text-[14px] text-apagado">
          Aro dourado com gradiente, couro com gradiente e ruído leve, cantos cortados com clip-path, filete interno e
          gemas de aço em losango. Tudo escala sem perder nitidez e aceita estados por variável.
        </span>
        <div
          className="grid gap-5 overflow-x-auto bg-[#8a8a8a] p-6"
          style={{ gridTemplateColumns: 'repeat(12,1fr)', gridAutoRows: 'min-content' }}
        >
          <div style={{ gridColumn: 'span 6' }}>
            <Painel nome="Painel grande" estilo={{ height: 190 }} />
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <Painel nome="Painel pequeno" estilo={{ height: 120 }} />
          </div>
          <div style={{ gridColumn: 'span 3' }}>
            <Painel nome="Moldura de retrato" classe="oc-retrato" estilo={{ height: 150, width: 150 }} />
          </div>
          <div style={{ gridColumn: 'span 6', display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'relative', width: 230 }}>
              <Painel nome="Aba da fila de turnos" classe="oc-aba" estilo={{ height: 46 }} />
              <i className="oc-gema" style={{ left: -8, top: 12 }} />
              <i className="oc-gema" style={{ right: -8, top: 12 }} />
            </div>
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <Painel nome="Caixa de diálogo" estilo={{ height: 100 }} />
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <Painel nome="Banner" classe="oc-banner" estilo={{ height: 74 }} />
          </div>
          <div style={{ gridColumn: 'span 6', alignSelf: 'center' }}>
            <div className="oc-divisor" />
          </div>
        </div>
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Menu de ações: painel em CSS, ícones e mão do PixelLab</strong>
        <span className="text-[14px] text-apagado">
          Alvo: a captura do jogo. Moldura, fundo de couro, filete, cantos dourados, linha em ouro e divisórias são CSS;
          as quatro figuras (bota, espada, ampulheta, pergaminho) e a mão são recortes da geração do PixelLab, ampliados
          sem suavização. O texto é fonte serifada real, que o PixelLab não faz.
        </span>
        <div className="flex flex-wrap items-center gap-8 overflow-x-auto bg-[#3f5a35] p-3 sm:p-8">
          <div className="relative" role="img" aria-label="Menu de ações em CSS">
            <div className="mn">
              <div className="mn-in">
                {ITENS.map(([ic, nome], i) => (
                  <div key={nome} className={`mn-li ${i === 0 ? 'on' : ''}`}>
                    <img src={`${ASSETS}/pixellab/ui-pl-menu-${ic}-v2.png`} alt="" />
                    {nome}
                  </div>
                ))}
              </div>
            </div>
            <img className="mn-mao" src={`${ASSETS}/pixellab/ui-pl-menu-mao-v2.png`} alt="" />
          </div>
          <figure className="m-0 grid gap-1">
            <img
              src={`${ASSETS}/pixellab/ui-ref-menu-acoes.png`}
              alt="Captura do menu de ações do jogo"
              className="block w-[386px] max-w-full"
            />
            <figcaption className="text-[13px] text-white">Alvo (captura do HUD)</figcaption>
          </figure>
          <figure className="m-0 grid gap-1">
            <img
              src={`${ASSETS}/pixellab/ui-pl-menu-acoes-1.png`}
              alt="Menu de ações gerado pelo PixelLab"
              className="block size-[256px] [image-rendering:pixelated]"
            />
            <figcaption className="text-[13px] text-white">Geração inteira do PixelLab</figcaption>
          </figure>
        </div>
      </section>
      <section className="grid gap-2">
        <strong className="text-[17px]">Referência: folha do Gemini (lote 1, recortada)</strong>
        <img
          src={`${ASSETS}/pixellab/ui-gem-lote1-paineis-alfa.png`}
          alt="Painéis do Gemini, lote 1"
          className="block w-full max-w-[1376px] bg-[#8a8a8a]"
        />
      </section>
    </div>
  );
}
