// "Em uso agora" (lab home): what the game uses today (theme, icons, faces) as thumbnails that open the right page.
// Ported from dungeon-tactics-lab/design/src/inicio.ts.
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ASSETS } from '../dados';

const ROSTOS = [
  'barbarian',
  'knight',
  'lancer',
  'mage',
  'ranger',
  'rogue_hooded',
  'skeleton_mage',
  'skeleton_minion',
  'skeleton_rogue',
  'skeleton_warrior',
];
const ICONES = [0, 1, 2, 6, 12, 15, 17, 22, 23]; // strike, heavy strike, shield bash, shot, fire ray, heal, deadly strike, move, wait
const AZUL = 'linear-gradient(#1c3a78,#0b1a3e)';

function Peca({ fundo, borda = '#0003', largo }: { fundo: string; borda?: string; largo?: boolean }) {
  return (
    <div
      className={`h-16 flex-none [image-rendering:pixelated] ${largo ? 'w-[120px]' : 'w-16'}`}
      style={{ border: `1px solid ${borda}`, background: fundo }}
    />
  );
}

function Bloco({
  titulo,
  detalhe,
  para,
  children,
}: {
  titulo: string;
  detalhe: string;
  para: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={para}
      className="grid min-w-0 content-start gap-2.5 border border-t-[6px] border-borda border-t-lab bg-folha px-[18px] py-4 text-tinta no-underline"
    >
      <strong className="text-[20px] leading-tight">{titulo}</strong>
      <div className="flex flex-wrap gap-1.5">{children}</div>
      <span className="text-[15px] text-apagado">{detalhe}</span>
    </Link>
  );
}

export function EmUso() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
      <Bloco
        titulo="Tema: FFT Clássico"
        detalhe="Painéis em degradê azul-marinho, borda fina clara, retratos em pixel art. Entra no jogo em 5 blocos."
        para="/design/interface/em-uso"
      >
        <Peca fundo={AZUL} borda="#dfe8ff" largo />
        <Peca fundo={AZUL} borda="#dfe8ff" />
      </Bloco>
      <Bloco
        titulo="Ícones de habilidade (32 px)"
        detalhe="24 habilidades aprovadas, no atlas de 32 px."
        para="/design/interface/icones"
      >
        {ICONES.map((n) => (
          <Peca
            key={n}
            fundo={`url(${ASSETS}/ia/icones/atlas-32.png) -${(n % 6) * 64}px -${Math.floor(n / 6) * 64}px/384px 256px`}
          />
        ))}
      </Bloco>
      <Bloco
        titulo="Rostos dos 10 bonecos"
        detalhe="4 falam (bárbaro, cavaleiro, lanceiro, maga); os outros 6 ficam parados até haver folha de expressões."
        para="/design/personagens/em-uso"
      >
        {ROSTOS.map((id) => (
          <Peca key={id} fundo={`url(${ASSETS}/chars/px/${id}.png) 0 0/256px 64px`} />
        ))}
      </Bloco>
    </div>
  );
}
