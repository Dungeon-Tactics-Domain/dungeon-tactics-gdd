// YouTube loads only on click (nothing plays or tracks before), from youtube-nocookie. The id goes into a URL, so only
// the YouTube id format is accepted; the plain link stays below because the embed can be blocked.
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const ID = /^[\w-]{11}$/;

export function YouTubeEmbed({ id, titulo }: { id: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);
  if (!ID.test(id)) return <p className="m-0 text-erro">Vídeo com id inválido: {titulo}.</p>;
  return (
    <div className="grid max-w-[720px] gap-2">
      {aberto ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={`Vídeo do YouTube: ${titulo}`}
          allow="encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          className="aspect-video w-full border-0"
        />
      ) : (
        <Button type="button" variant="lab" className="justify-self-start" onClick={() => setAberto(true)}>
          ▶ Carregar vídeo: {titulo}
        </Button>
      )}
      <a
        href={`https://www.youtube.com/watch?v=${id}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center justify-self-start text-lab"
      >
        Abrir no YouTube ↗
      </a>
    </div>
  );
}
