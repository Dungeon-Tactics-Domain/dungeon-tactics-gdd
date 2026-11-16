// Small tile diagrams of the "Como jogar" page (Nov 16: Fernando's wife did not follow the game on a tablet). Theme
// colours only; the game's own mark colours appear just in the swatches of the marks table, always next to a text label.
import type { ReactNode } from 'react';

function Figura({
  titulo,
  legenda,
  viewBox,
  children,
}: {
  titulo: string;
  legenda: string;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <figure className="m-0 grid max-w-[560px] gap-2">
      <svg role="img" viewBox={viewBox} className="h-auto w-full border border-borda bg-folha">
        <title>{titulo}</title>
        {children}
      </svg>
      <figcaption className="max-w-[72ch] text-[15px] text-apagado">{legenda}</figcaption>
    </figure>
  );
}

const TEXTO = 'fill-tinta text-[18px]';

// one board tile seen from above, with an optional label in the middle
function Casa({
  x,
  y,
  tom = 'fill-pergaminho-escuro',
  rotulo,
}: {
  x: number;
  y: number;
  tom?: string;
  rotulo?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={70} height={70} className={`${tom} stroke-ouro`} strokeWidth={2} />
      {rotulo && (
        <text x={x + 35} y={y + 42} textAnchor="middle" className={TEXTO}>
          {rotulo}
        </text>
      )}
    </g>
  );
}

export function FilaDeTurnos() {
  const nomes = ['Ladino', 'Arqueiro', 'Esqueleto', 'Guerreiro'];
  return (
    <Figura
      viewBox="0 0 480 120"
      titulo="Fila de turnos: o Ladino joga agora, depois o Arqueiro, o Esqueleto e o Guerreiro"
      legenda="A lista ao lado da tela: quem está no topo joga agora. Quem é mais rápido aparece mais vezes."
    >
      {nomes.map((n, i) => (
        <g key={n}>
          <rect
            x={10 + i * 118}
            y={30}
            width={104}
            height={56}
            className={i === 0 ? 'fill-aviso-suave stroke-ouro-escuro' : 'fill-pergaminho-escuro stroke-ouro'}
            strokeWidth={i === 0 ? 4 : 2}
          />
          <text x={62 + i * 118} y={64} textAnchor="middle" className={TEXTO}>
            {n}
          </text>
        </g>
      ))}
      <text x={62} y={20} textAnchor="middle" className="fill-ouro-escuro text-[16px] font-bold">
        agora
      </text>
      <text x={240} y={110} textAnchor="middle" className="fill-apagado text-[15px]">
        depois, da esquerda para a direita →
      </text>
    </Figura>
  );
}

export function LadoECostas() {
  return (
    <Figura
      viewBox="0 0 260 260"
      titulo="Inimigo no meio olhando para cima: de frente sem bônus, de lado mais 15, pelas costas mais 30"
      legenda="O inimigo do meio olha para cima (seta). De frente: sem bônus. De lado: +15 de acerto. Pelas costas: +30."
    >
      <Casa x={95} y={10} rotulo="frente" />
      <Casa x={10} y={95} tom="fill-aviso-suave" rotulo="+15" />
      <Casa x={95} y={95} tom="fill-erro-suave" />
      <Casa x={180} y={95} tom="fill-aviso-suave" rotulo="+15" />
      <Casa x={95} y={180} tom="fill-sucesso-suave" rotulo="+30" />
      <path d="M130 150 L130 110 M118 124 L130 108 L142 124" className="fill-none stroke-erro" strokeWidth={5} />
      <text x={130} y={170} textAnchor="middle" className="fill-erro text-[14px]">
        inimigo
      </text>
    </Figura>
  );
}

export function Altura() {
  return (
    <Figura
      viewBox="0 0 480 220"
      titulo="Arqueiro dois níveis acima do inimigo: mais acerto e, com arco, mais alcance; quem é empurrado de lá cai e se machuca"
      legenda="Visto de lado. Quem está 2 níveis acima ganha +10 de acerto (5 por nível). Ser empurrado dali: 1 nível é de graça, cada nível a mais tira 45 de vida."
    >
      <rect x={10} y={90} width={180} height={120} className="fill-pergaminho-escuro stroke-ouro" strokeWidth={2} />
      <rect x={190} y={170} width={280} height={40} className="fill-pergaminho-escuro stroke-ouro" strokeWidth={2} />
      <text x={100} y={150} textAnchor="middle" className={TEXTO}>
        2 níveis
      </text>
      <circle cx={100} cy={70} r={18} className="fill-link" />
      <text x={100} y={40} textAnchor="middle" className={TEXTO}>
        você
      </text>
      <circle cx={380} cy={150} r={18} className="fill-erro" />
      <text x={380} y={120} textAnchor="middle" className={TEXTO}>
        inimigo
      </text>
      <path d="M125 70 L355 145" className="stroke-ouro-escuro" strokeWidth={3} strokeDasharray="8 6" />
      <text x={250} y={92} textAnchor="middle" className="fill-ouro-escuro text-[16px] font-bold">
        +10 de acerto
      </text>
    </Figura>
  );
}

export function LinhaDeTiro() {
  return (
    <Figura
      viewBox="0 0 480 200"
      titulo="Tiro reto para no caixote do meio, marcado com X; o tiro curvo passaria por cima, mas ainda está em teste"
      legenda="Tiro reto: para na primeira coisa do caminho (o X). Tiro curvo (tracejado): sobe e passa por cima de coisas baixas. O curvo ainda está em teste."
    >
      <rect x={10} y={170} width={460} height={20} className="fill-pergaminho-escuro stroke-ouro" strokeWidth={2} />
      <circle cx={50} cy={140} r={18} className="fill-link" />
      <rect x={210} y={130} width={50} height={40} className="fill-aviso-suave stroke-ouro-escuro" strokeWidth={2} />
      <circle cx={420} cy={140} r={18} className="fill-erro" />
      <path d="M70 140 L205 140" className="stroke-link" strokeWidth={4} />
      <path d="M200 125 L220 155 M220 125 L200 155" className="stroke-erro" strokeWidth={5} />
      <path d="M70 130 Q235 0 400 130" className="fill-none stroke-ouro-escuro" strokeWidth={3} strokeDasharray="8 6" />
      <text x={235} y={45} textAnchor="middle" className="fill-ouro-escuro text-[16px]">
        curvo (em teste)
      </text>
      <text x={135} y={125} textAnchor="middle" className="fill-link text-[16px]">
        reto
      </text>
    </Figura>
  );
}

export function ContraAtaque() {
  return (
    <Figura
      viewBox="0 0 400 140"
      titulo="Você bate no inimigo e depois anda para longe; ao sair do alcance dele, ele revida com metade do dano"
      legenda="1: você bate. 2: você anda para longe. Ao sair do alcance dele, o inimigo revida com metade do dano."
    >
      <Casa x={10} y={35} tom="fill-erro-suave" rotulo="inimigo" />
      <Casa x={80} y={35} rotulo="1 você" />
      <Casa x={150} y={35} />
      <Casa x={220} y={35} />
      <Casa x={290} y={35} rotulo="2 você" />
      <path d="M150 70 L280 70 M268 60 L282 70 L268 80" className="fill-none stroke-link" strokeWidth={4} />
      <text x={115} y={128} textAnchor="middle" className="fill-erro text-[16px] font-bold">
        revide: metade do dano
      </text>
    </Figura>
  );
}

/** Colour swatch of a game mark (marks.ts), always beside its name: colour is never the only signal. */
export function Cor({ hex, nome }: { hex: string; nome: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block size-5 shrink-0 border border-tinta"
        style={{ background: hex }}
      />
      {nome}
    </span>
  );
}
