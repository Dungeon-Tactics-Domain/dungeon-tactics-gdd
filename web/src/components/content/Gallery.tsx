// Images with captions; a click opens the full image in a dialog (Radix: focus trap, Esc, focus returns to the thumbnail).
import * as Dialog from '@radix-ui/react-dialog';
import { useRef, useState } from 'react';

export interface Imagem {
  src: string;
  /** what the image shows, for screen readers */
  alt: string;
  legenda?: string;
}

export function Gallery({ imagens }: { imagens: Imagem[] }) {
  const [aberta, setAberta] = useState<Imagem | null>(null);
  // one dialog for all thumbnails, so focus goes back by hand to the one that opened it
  const origem = useRef<HTMLButtonElement | null>(null);
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 p-0">
        {imagens.map((img) => (
          <li key={img.src}>
            <figure className="m-0 grid gap-1.5 border border-borda bg-folha p-2">
              <button
                type="button"
                onClick={(e) => {
                  origem.current = e.currentTarget;
                  setAberta(img);
                }}
                aria-label={`Ampliar: ${img.legenda ?? img.alt}`}
                className="block min-h-11 cursor-zoom-in"
              >
                <img src={img.src} alt={img.alt} loading="lazy" className="block aspect-[4/3] w-full object-cover" />
              </button>
              {img.legenda && <figcaption className="text-[15px]">{img.legenda}</figcaption>}
            </figure>
          </li>
        ))}
      </ul>
      <Dialog.Root open={!!aberta} onOpenChange={(o) => !o && setAberta(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-tinta/80" />
          <Dialog.Content
            aria-describedby={undefined}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              origem.current?.focus();
            }}
            className="fixed inset-2 z-50 m-auto grid h-fit max-h-[calc(100dvh-16px)] w-fit max-w-[calc(100vw-16px)] gap-2 overflow-auto bg-folha p-3"
          >
            {aberta && (
              <>
                <img src={aberta.src} alt={aberta.alt} className="block max-h-[78dvh] max-w-full object-contain" />
                <div className="flex items-start justify-between gap-3">
                  <Dialog.Title className="m-0 font-sans text-[15px] font-normal">
                    {aberta.legenda ?? aberta.alt}
                  </Dialog.Title>
                  <Dialog.Close className="min-h-11 min-w-11 cursor-pointer rounded-md border-2 border-tinta px-3 font-bold">
                    Fechar
                  </Dialog.Close>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
