// 1 to 5 stars kept in this browser only. Storage can be missing (private tab), so every access is guarded.
// Clicking the star that is already the rating clears it (same rule as the old music lab).
import { useState } from 'react';
import { cn } from '@/lib/utils';

const ler = (k: string) => {
  try {
    const n = Number(localStorage.getItem(k));
    return n >= 1 && n <= 5 ? n : 0;
  } catch {
    return 0;
  }
};
const gravar = (k: string, n: number) => {
  try {
    if (n) localStorage.setItem(k, String(n));
    else localStorage.removeItem(k);
  } catch {
    // no storage: the rating lasts until reload
  }
};

/** `chave` is the full storage key, e.g. "musica:nota:faixa-1"; `notaSessao` is the rating the lab session recorded. */
export function Stars({ chave, rotulo, notaSessao }: { chave: string; rotulo: string; notaSessao?: number }) {
  const [nota, setNota] = useState(() => ler(chave));
  const escolher = (i: number) => {
    const n = nota === i ? 0 : i;
    gravar(chave, n);
    setNota(n);
  };
  return (
    <div className="grid gap-1">
      <div role="group" aria-label={`Sua nota para ${rotulo}`} className="flex flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i} de 5`}
            aria-pressed={i <= nota}
            onClick={() => escolher(i)}
            className={cn(
              'size-11 cursor-pointer rounded-md text-[26px] leading-none hover:bg-lab-soft',
              i <= nota ? 'text-lab' : 'text-apagado',
            )}
          >
            {i <= nota ? '★' : '☆'}
          </button>
        ))}
      </div>
      <p className="m-0 text-[15px] text-apagado">
        {nota ? `Sua nota: ${nota} de 5 (salva neste navegador).` : 'Sem nota sua ainda.'}
        {notaSessao ? ` Nota registrada pela sessão: ${notaSessao} de 5.` : ''}
      </p>
    </div>
  );
}
