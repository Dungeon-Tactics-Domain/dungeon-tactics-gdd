// A 3D preview that grows and shrinks from a handle on its bottom-right corner (Nov 15, Fernando's request: the previews
// were too big). Square, so dragging keeps the proportion; the width is remembered per kind of page.
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { gravar, ler } from '@/lib/utils';

export const LARGURA_PADRAO = 420;
export const LARGURA_MINIMA = 240;
const PASSO = 20;
const chave = (tipo: string) => `modelos:janela:${tipo}`;
// windows of the same kind on one page (the remodel comparison) follow the one the user resized
const EVENTO = 'modelos:janela';

function larguraGuardada(tipo: string) {
  const n = Number(ler(chave(tipo)));
  return Number.isFinite(n) && n >= LARGURA_MINIMA ? Math.round(n) : LARGURA_PADRAO;
}

/**
 * The stored width is a wish: CSS caps it at 80% of the screen height (or the square would leave the screen) and at
 * the column (`max-w-full`, kept out of the `min()` so the grid sizes its track by the capped width), so a size saved
 * on an ultrawide never overflows a laptop; a drag or a key that hits the cap stores what is on screen. Below 1024 px
 * the window is full width and the handle is gone (phones keep the pinned viewer of LadoALado); the wrapper and the
 * box dissolve (`contents`) so only the viewer box is pinned and the ficha scrolls with the options.
 */
export function JanelaRedimensionavel({
  tipo,
  children,
  ficha,
  rotulo = 'Tamanho da janela 3D',
}: {
  tipo: string;
  children: ReactNode;
  ficha?: ReactNode;
  rotulo?: string;
}) {
  const [largura, setLargura] = useState(() => larguraGuardada(tipo));
  const [arrastando, setArrastando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const inicio = useRef({ x: 0, y: 0, largura: 0 });

  // starts from what is on screen, not the stored wish, or the first pixels of a drag would only undo the cap
  const naTela = () => caixa.current?.offsetWidth || largura;
  const mudar = (n: number) => {
    const nova = Math.max(LARGURA_MINIMA, Math.round(n));
    setLargura(nova);
    gravar(chave(tipo), String(nova));
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: { tipo, largura: nova } }));
  };
  useEffect(() => {
    const seguir = (e: Event) => {
      const { detail } = e as CustomEvent<{ tipo: string; largura: number }>;
      if (detail.tipo === tipo) setLargura(detail.largura);
    };
    window.addEventListener(EVENTO, seguir);
    return () => window.removeEventListener(EVENTO, seguir);
  }, [tipo]);

  const comecar = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    // capture keeps the gesture when the pointer crosses the iframe; jsdom has no capture
    e.currentTarget.setPointerCapture?.(e.pointerId);
    inicio.current = { x: e.clientX, y: e.clientY, largura: naTela() };
    setArrastando(true);
  };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (!arrastando) return;
    const dx = e.clientX - inicio.current.x;
    const dy = e.clientY - inicio.current.y;
    // square box: the axis moved the most decides, so a drag down grows it as much as a drag right
    setLargura(Math.max(LARGURA_MINIMA, Math.round(inicio.current.largura + (Math.abs(dx) > Math.abs(dy) ? dx : dy))));
  };
  const soltar = () => {
    if (!arrastando) return;
    setArrastando(false);
    mudar(naTela());
  };
  const teclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowRight: PASSO, ArrowUp: PASSO, ArrowLeft: -PASSO, ArrowDown: -PASSO }[e.key];
    const alvo =
      e.key === 'Home'
        ? LARGURA_MINIMA
        : e.key === 'End'
          ? window.innerWidth
          : delta && Math.min(naTela(), largura) + delta;
    if (!alvo) return;
    e.preventDefault();
    mudar(alvo);
    // past the cap the box stops growing: keep the width it reached, not the key's (jsdom measures 0 and skips); a
    // timeout, not requestAnimationFrame, which a background tab never runs
    setTimeout(() => {
      const visto = caixa.current?.offsetWidth;
      if (visto && visto < alvo) mudar(visto);
    });
  };

  return (
    <div
      style={{ '--janela': `${largura}px` } as CSSProperties}
      className="max-[1023px]:contents min-[1024px]:grid min-[1024px]:w-[min(var(--janela),80vh)] min-[1024px]:max-w-full min-[1024px]:gap-2"
    >
      <div
        ref={caixa}
        className="relative max-[1023px]:sticky max-[1023px]:top-(--reino-h) max-[1023px]:z-10 max-[1023px]:bg-pergaminho max-[1023px]:pb-2"
      >
        {children}
        {/* over the iframe while dragging: the bench would otherwise swallow the pointer */}
        {arrastando && <div className="absolute inset-0 cursor-nwse-resize" />}
        <div
          role="slider"
          tabIndex={0}
          aria-label={rotulo}
          aria-valuemin={LARGURA_MINIMA}
          aria-valuemax={Math.max(largura, typeof window === 'undefined' ? largura : window.innerWidth)}
          aria-valuenow={largura}
          aria-valuetext={`${largura} px de largura`}
          title="Arraste para aumentar ou diminuir (ou use as setas)"
          onPointerDown={comecar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onKeyDown={teclado}
          className="absolute right-0 bottom-0 grid size-11 cursor-nwse-resize touch-none place-items-end rounded-br-lg p-1.5 focus-visible:outline-2 focus-visible:outline-lab max-[1023px]:hidden"
        >
          <svg viewBox="0 0 12 12" aria-hidden="true" className="size-4 text-couro">
            <path d="M11 3 3 11M11 7 7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      {ficha}
    </div>
  );
}
