// One headline number with its label, an optional series swatch and a detail line. A missing value says "não medido".
import type { ReactNode } from 'react';
import { NAO_MEDIDO, numero } from './series';

export function CartaoMetrica({
  rotulo,
  valor,
  unidade = '',
  cor,
  detalhe,
}: {
  rotulo: string;
  valor: number | string | null | undefined;
  unidade?: string;
  /** series colour shown as a swatch next to the label (identity, never the only cue) */
  cor?: string;
  detalhe?: ReactNode;
}) {
  const vazio = valor === null || valor === undefined || valor === '';
  return (
    <div className="grid min-w-[10rem] content-start gap-1 border-2 border-couro-escuro bg-folha shadow-folha px-4 py-3">
      <span className="inline-flex items-center gap-1.5 text-base text-apagado">
        {cor && <span aria-hidden="true" className="inline-block size-3 rounded-sm" style={{ background: cor }} />}
        {rotulo}
      </span>
      <span className={vazio ? 'text-[18px] italic text-apagado' : 'font-serif text-[28px] leading-none tabular-nums'}>
        {vazio ? NAO_MEDIDO : `${typeof valor === 'number' ? numero(valor) : valor}${unidade}`}
      </span>
      {detalhe && <span className="text-base text-apagado">{detalhe}</span>}
    </div>
  );
}
