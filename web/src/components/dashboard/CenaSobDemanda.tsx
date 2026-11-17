// A heavy live view (WebGL scene, iframe of a game) that loads only when the reader presses "Rodar": a static preview and
// the download size come first, and "Parar" unmounts the view so its memory and GPU are released. Nothing autoplays.
import { type ReactNode, useState } from 'react';
import { numero } from './series';

const BOTAO =
  'min-h-11 cursor-pointer rounded-md border border-couro bg-couro px-4 text-[15px] font-bold text-creme hover:bg-couro-claro';

export function CenaSobDemanda({
  titulo,
  previa,
  tamanhoMB,
  notaTamanho,
  children,
}: {
  titulo: string;
  previa?: { src: string; alt: string };
  /** approximate download when it runs; null = not known yet */
  tamanhoMB?: number | null;
  /** what the size covers, e.g. which parts are included */
  notaTamanho?: string;
  /** rendered only while running */
  children: () => ReactNode;
}) {
  const [rodando, setRodando] = useState(false);
  const tamanho = typeof tamanhoMB === 'number' ? `cerca de ${numero(tamanhoMB)} MB` : 'tamanho ainda não medido';
  if (rodando)
    return (
      <div className="grid gap-2">
        <div>
          <button type="button" className={BOTAO} onClick={() => setRodando(false)}>
            Parar e descarregar
          </button>
        </div>
        {children()}
      </div>
    );
  return (
    <div className="grid gap-2">
      <div className="relative grid aspect-video max-w-full place-items-center overflow-hidden rounded-lg border border-borda bg-[#1d2a38]">
        {previa ? (
          <img src={previa.src} alt={previa.alt} className="absolute inset-0 h-full w-full object-cover opacity-80" />
        ) : (
          <span className="text-white/80">Sem imagem de prévia</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={BOTAO} onClick={() => setRodando(true)} aria-label={`Rodar ${titulo}`}>
          ▶ Rodar
        </button>
        <span className="text-[15px] text-apagado">
          Download: {tamanho}
          {notaTamanho ? ` (${notaTamanho})` : ''}.
        </span>
      </div>
    </div>
  );
}
