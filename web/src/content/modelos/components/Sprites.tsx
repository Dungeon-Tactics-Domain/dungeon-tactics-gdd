// Sprites rendered from the Blender character: a sheet with 8 directions (rows) x frames (columns), animated on a
// canvas. Same actions, rates and files as the old lab (dungeon-tactics-lab/modelos/src/main.ts).
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { BANCADA } from './bancada';
import { Botoes } from './Visualizador';

const DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'] as const;
// id, name, frames, fps
const ACOES = [
  ['idle', 'Parado', 4, 4],
  ['walk', 'Andar', 8, 8],
  ['attack', 'Atacar', 8, 10],
] as const;
const ACABAMENTOS = [
  [false, 'HD pintado'],
  [true, 'Pixel art'],
] as const;

export function Sprites({ modelo, children }: { modelo: string; children?: ReactNode }) {
  const base = `${BANCADA}/eval/sprites-${modelo}`;
  const [acao, setAcao] = useState(0);
  const [pixel, setPixel] = useState(false);
  const [dir, setDir] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const imgs = useRef(new Map<string, HTMLImageElement>());

  useEffect(() => {
    const [a, , frames, taxa] = ACOES[acao]!;
    const k = `${pixel ? 'pixel' : 'hd'}-${a}`;
    if (!imgs.current.has(k)) {
      const novo = new Image();
      novo.src = `${base}/${k}.png`;
      imgs.current.set(k, novo);
    }
    const folha = imgs.current.get(k)!;
    let quadro = 0;
    let t: ReturnType<typeof setTimeout>;
    const passo = () => {
      const c = canvas.current;
      if (c && folha.complete && folha.naturalWidth) {
        const lado = folha.naturalWidth / frames; // square frames: one column per frame
        quadro = (quadro + 1) % frames;
        c.width = c.height = lado;
        c.getContext('2d')?.drawImage(folha, quadro * lado, dir * lado, lado, lado, 0, 0, lado, lado);
      }
      t = setTimeout(passo, 1000 / taxa);
    };
    passo();
    return () => clearTimeout(t);
  }, [acao, pixel, dir, base]);

  return (
    <>
      {children}
      <div className="grid gap-2 border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4">
        <Botoes rotulo="Ação" itens={ACOES.map((a, i) => [i, a[1]] as const)} atual={acao} escolher={setAcao} />
        <Botoes rotulo="Acabamento" itens={ACABAMENTOS} atual={pixel} escolher={setPixel} />
        <Botoes rotulo="Direção" itens={DIRS.map((d, i) => [i, d] as const)} atual={dir} escolher={setDir} />
      </div>
      <canvas
        ref={canvas}
        aria-label="Sprite animado"
        className="block aspect-square h-auto w-[min(70vh,100%)] rounded-lg bg-terra [image-rendering:pixelated]"
      />
      <h3>Folha de contato</h3>
      <img src={`${base}/contato.png`} alt="Folha de contato" className="mt-3 max-w-full rounded-lg" />
    </>
  );
}
