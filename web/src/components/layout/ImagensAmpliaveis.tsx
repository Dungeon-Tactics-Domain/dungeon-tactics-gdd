// Every content image opens the zoom/drag reader (wheel, buttons, pinch, arrows walk the page's images). Images inside a
// button or link keep their own action (the cards already open the reader); small ones (icons) are left alone.
import { type MouseEvent, type ReactNode, useState } from 'react';
import { Leitor, type ImagemLeitor } from '@/content/design/components/Leitor';

const MIN = 64;
const ampliavel = (im: HTMLImageElement) =>
  !im.closest('button, a, [role=dialog]') && im.clientWidth >= MIN && im.clientHeight >= MIN;

export function ImagensAmpliaveis({ children }: { children: ReactNode }) {
  const [aberta, setAberta] = useState<{ lista: ImagemLeitor[]; inicio: number } | null>(null);
  const aoClicar = (e: MouseEvent<HTMLDivElement>) => {
    const alvo = e.target;
    if (!(alvo instanceof HTMLImageElement) || !ampliavel(alvo)) return;
    const imgs = [...e.currentTarget.querySelectorAll('img')].filter(ampliavel);
    const inicio = imgs.indexOf(alvo);
    if (inicio < 0) return;
    setAberta({ lista: imgs.map((im) => ({ src: im.currentSrc || im.src, title: im.alt })), inicio });
  };
  return (
    // the click is delegated from the images; keyboard users reach the zoom through the cards' buttons
    <div onClick={aoClicar} className="[&_img:not(button_img):not(a_img)]:cursor-zoom-in">
      {children}
      {aberta && <Leitor lista={aberta.lista} inicio={aberta.inicio} onFechar={() => setAberta(null)} />}
    </div>
  );
}
