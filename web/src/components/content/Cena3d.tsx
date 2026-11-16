// Box for any 3D scene in the lab: loads the scene on demand (`criar`), keeps it drawing every frame, follows the box when
// it is resized (the viewer can be dragged bigger or smaller by its bottom-right corner; Fernando's rule: every 3D view is
// resizable) and cleans up on unmount. The scene code stays out of this component: it only needs the three methods below.
import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface CenaHandle {
  desenhar: (dt?: number) => void;
  redimensionar: (w: number, h: number) => void;
  destruir: () => void;
}

interface Props<T extends CenaHandle> {
  /** Builds the scene on the canvas (import the Three.js code here, so it loads only when the page opens). */
  criar: (canvas: HTMLCanvasElement) => Promise<T>;
  /** The scene is rebuilt when this changes. */
  chave: string;
  /** Accessible name of the canvas. */
  rotulo: string;
  /** Called with the scene once ready, and with null when it goes away. */
  aoPronta?: (cena: T | null) => void;
  /** Pointer down inside the canvas, in CSS pixels from its top-left corner. */
  aoPonteiro?: (x: number, y: number) => void;
  /** Initial height class; the user can drag the corner to change it. */
  altura?: string;
  /** Drawn over the canvas (HTML overlays). */
  children?: ReactNode;
}

export function Cena3d<T extends CenaHandle>({
  criar,
  chave,
  rotulo,
  aoPronta,
  aoPonteiro,
  altura = 'h-[min(72vh,640px)]',
  children,
}: Props<T>) {
  const caixa = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');
  // the latest callbacks without rebuilding the scene when the parent re-renders
  const criarRef = useRef(criar);
  const prontaRef = useRef(aoPronta);
  criarRef.current = criar;
  prontaRef.current = aoPronta;

  useEffect(() => {
    let vivo = true;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    let cena: T | undefined;
    setEstado('carregando');
    (async () => {
      try {
        if (!canvas.current || !caixa.current) return;
        cena = await criarRef.current(canvas.current);
        if (!vivo) return cena.destruir();
        const el = caixa.current;
        const medir = () => cena?.redimensionar(el.clientWidth, el.clientHeight);
        ro = new ResizeObserver(medir);
        ro.observe(el);
        medir();
        const laco = () => {
          cena?.desenhar();
          raf = requestAnimationFrame(laco);
        };
        laco();
        prontaRef.current?.(cena);
        setEstado('ok');
      } catch (e) {
        console.error('Cena 3D:', e);
        if (vivo) setEstado('erro');
      }
    })();
    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      prontaRef.current?.(null);
      cena?.destruir();
    };
  }, [chave]);

  return (
    <div
      ref={caixa}
      className={`relative ${altura} min-h-[200px] min-w-[280px] max-w-[min(100%,1280px)] overflow-hidden rounded-lg border border-borda bg-[#1d2a38] [resize:both]`}
    >
      <canvas
        ref={canvas}
        className="block h-full w-full touch-manipulation"
        role="img"
        aria-label={rotulo}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          aoPonteiro?.(e.clientX - r.left, e.clientY - r.top);
        }}
      />
      {children}
      {estado === 'carregando' && (
        <p className="absolute inset-0 grid place-items-center text-white/80">Carregando a cena 3D…</p>
      )}
      {estado === 'erro' && (
        <p className="absolute inset-0 grid place-items-center p-4 text-center text-white/90">
          Este navegador não conseguiu abrir o WebGL; a cena 3D precisa dele.
        </p>
      )}
    </div>
  );
}
