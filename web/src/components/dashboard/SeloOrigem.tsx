// Where a number or a claim comes from: a small labelled badge; when it has a detail, the badge is a button that shows it
// (keyboard and touch, no hover). Only phrasing elements, so it can sit inside a sentence.
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type TipoOrigem = 'medido' | 'documentacao' | 'deducao' | 'nao-confirmado';

const ROTULO: Record<TipoOrigem, string> = {
  medido: 'Medido',
  documentacao: 'Documentação',
  deducao: 'Dedução',
  'nao-confirmado': 'Não confirmado',
};
const COR: Record<TipoOrigem, string> = {
  medido: 'bg-sucesso-suave text-sucesso',
  documentacao: 'bg-link-suave text-link',
  deducao: 'bg-aviso-suave text-aviso',
  'nao-confirmado': 'bg-erro-suave text-erro',
};

export function SeloOrigem({ tipo, texto }: { tipo: TipoOrigem; texto?: string }) {
  const [aberto, setAberto] = useState(false);
  const selo = (
    <span className={cn('inline-block rounded-sm px-2 py-0.5 text-base font-bold leading-tight', COR[tipo])}>
      {ROTULO[tipo]}
    </span>
  );
  if (!texto) return selo;
  return (
    <span className="text-base">
      <button
        type="button"
        aria-expanded={aberto}
        aria-label={`Origem: ${ROTULO[tipo]}. ${aberto ? 'Fechar' : 'Abrir'} detalhe`}
        onClick={() => setAberto(!aberto)}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1 align-middle"
      >
        {selo}
        <span aria-hidden="true" className="text-apagado">
          ⓘ
        </span>
      </button>
      {aberto && <span className="mt-1 block max-w-[72ch] border-l-2 border-borda pl-3 text-apagado">{texto}</span>}
    </span>
  );
}
