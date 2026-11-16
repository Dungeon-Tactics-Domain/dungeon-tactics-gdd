// Full-screen image reader of the old design lab (leitor.ts): zoom (wheel, buttons, pinch), drag, arrows walk the
// page's list, Esc closes. Mounted only while open, so each opening starts fitted on the clicked image. Radix Dialog gives the focus trap, Esc and focus back to the card that opened it.
import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface ImagemLeitor {
  src: string;
  title: string;
}

const BOTAO =
  'min-h-11 min-w-11 cursor-pointer rounded-[4px] border border-borda bg-pergaminho px-3 text-tinta hover:border-lab focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab';

export function Leitor({ lista, inicio, onFechar }: { lista: ImagemLeitor[]; inicio: number; onFechar: () => void }) {
  const [i, setI] = useState(inicio);
  const [v, setV] = useState({ s: 1, x: 0, y: 0 });
  const [tam, setTam] = useState<[number, number] | null>(null);
  const tela = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  const centro = useCallback((s: number) => {
    const t = tela.current;
    const im = img.current;
    if (!t || !im?.naturalWidth) return;
    setV({ s, x: (t.clientWidth - im.naturalWidth * s) / 2, y: (t.clientHeight - im.naturalHeight * s) / 2 });
  }, []);
  const ajustar = useCallback(() => {
    const t = tela.current;
    const im = img.current;
    if (t && im?.naturalWidth) centro(Math.min(t.clientWidth / im.naturalWidth, t.clientHeight / im.naturalHeight));
  }, [centro]);
  // zoom keeping the screen point (cx, cy) still; 5% to 800%
  const zoomEm = (f: (s: number) => number, cx: number, cy: number) =>
    setV(({ s, x, y }) => {
      const ns = Math.min(8, Math.max(0.05, f(s)));
      const k = ns / s;
      return { s: ns, x: cx - (cx - x) * k, y: cy - (cy - y) * k };
    });
  const mais = (f: number) => {
    const t = tela.current;
    if (t) zoomEm((s) => s * f, t.clientWidth / 2, t.clientHeight / 2);
  };
  const mostrar = (n: number) => {
    setTam(null);
    setI((n + lista.length) % lista.length);
  };

  useEffect(() => {
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [ajustar]);

  // the wheel needs a non-passive listener to stop the page from scrolling
  useEffect(() => {
    const t = tela.current;
    if (!t) return;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      const r = t.getBoundingClientRect();
      zoomEm((s) => s * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    t.addEventListener('wheel', roda, { passive: false });
    return () => t.removeEventListener('wheel', roda);
  });

  // pointers: one finger or the mouse drags, two fingers pinch
  const pts = useRef(new Map<number, [number, number]>());
  const dist = useRef(0);
  const moveu = useRef(false);
  const dois = () => {
    const [a, b] = [...pts.current.values()] as [[number, number], [number, number]];
    return [Math.hypot(a[0] - b[0], a[1] - b[1]), (a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as const;
  };

  const im = lista[i];
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onFechar()}>
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') mostrar(i - 1);
            else if (e.key === 'ArrowRight') mostrar(i + 1);
            else if (e.key === '+' || e.key === '=') mais(1.25);
            else if (e.key === '-') mais(0.8);
            else return;
            e.preventDefault();
          }}
          className="fixed inset-0 z-[1000] flex flex-col bg-[rgba(10,14,20,.94)] text-[14px]"
        >
          <Dialog.Title className="sr-only">Leitor de imagens</Dialog.Title>
          <div
            ref={tela}
            className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden"
            onPointerDown={(e) => {
              pts.current.set(e.pointerId, [e.clientX, e.clientY]);
              moveu.current = false;
              if (pts.current.size === 2) dist.current = dois()[0];
            }}
            onPointerMove={(e) => {
              const p = pts.current.get(e.pointerId);
              const t = tela.current;
              if (!p || !t) return;
              // capture only while dragging: capturing on pointerdown would make every click look like it hit the backdrop
              if (!t.hasPointerCapture(e.pointerId)) t.setPointerCapture(e.pointerId);
              const r = t.getBoundingClientRect();
              pts.current.set(e.pointerId, [e.clientX, e.clientY]);
              if (pts.current.size === 2) {
                const [d, mx, my] = dois();
                zoomEm((s) => (s * d) / dist.current, mx - r.left, my - r.top);
                dist.current = d;
                moveu.current = true;
                return;
              }
              if (e.clientX !== p[0] || e.clientY !== p[1]) moveu.current = true;
              setV((o) => ({ ...o, x: o.x + e.clientX - p[0], y: o.y + e.clientY - p[1] }));
            }}
            onPointerUp={(e) => pts.current.delete(e.pointerId)}
            onPointerCancel={(e) => pts.current.delete(e.pointerId)}
            // a click on the backdrop (outside the image) closes; a drag does not; double click toggles fit and 100%
            onClick={(e) => {
              if (!moveu.current && e.target === tela.current) onFechar();
            }}
            onDoubleClick={(e) => {
              if (e.target === img.current) {
                if (Math.abs(v.s - 1) < 0.01) ajustar();
                else centro(1);
              }
            }}
          >
            {im && (
              <img
                ref={img}
                src={im.src}
                alt={im.title}
                draggable={false}
                onLoad={(e) => {
                  setTam([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight]);
                  ajustar();
                }}
                className="absolute top-0 left-0 max-w-none origin-top-left select-none"
                style={{ transform: `translate(${v.x}px,${v.y}px) scale(${v.s})` }}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-borda bg-folha px-4 py-2 text-tinta">
            <div className="min-w-0 flex-[1_1_220px]">
              <strong>{im?.title}</strong>
              <span className="text-apagado">
                {tam && ` · ${tam[0]}×${tam[1]} px · ${i + 1}/${lista.length}`} · {Math.round(v.s * 100)}%
              </span>
            </div>
            {lista.length > 1 && (
              <>
                <button type="button" className={BOTAO} aria-label="Imagem anterior" onClick={() => mostrar(i - 1)}>
                  ←
                </button>
                <button type="button" className={BOTAO} aria-label="Próxima imagem" onClick={() => mostrar(i + 1)}>
                  →
                </button>
              </>
            )}
            <button type="button" className={BOTAO} aria-label="Reduzir" onClick={() => mais(0.8)}>
              −
            </button>
            <button type="button" className={BOTAO} aria-label="Ampliar" onClick={() => mais(1.25)}>
              +
            </button>
            <button type="button" className={BOTAO} aria-label="Tamanho real" onClick={() => centro(1)}>
              100%
            </button>
            <button type="button" className={BOTAO} aria-label="Ajustar à tela" onClick={ajustar}>
              Ajustar
            </button>
            <Dialog.Close className={BOTAO} aria-label="Fechar (Esc)">
              Fechar
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
