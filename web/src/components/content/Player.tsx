// Audio of a lab page: native controls, never autoplay. A missing file says so instead of showing a dead player.
import { useEffect, useState } from 'react';

export function Player({ src, titulo }: { src?: string; titulo: string }) {
  const [falhou, setFalhou] = useState(false);
  // a HEAD finds a missing file on open without buffering the audio: preload stays "none" so the page loads no audio until play
  useEffect(() => {
    if (src)
      fetch(src, { method: 'HEAD' })
        .then((r) => !r.ok && setFalhou(true))
        .catch(() => undefined);
  }, [src]);
  if (!src || falhou) return <p className="m-0 text-apagado">Áudio ainda não copiado{src ? ` (${src})` : ''}.</p>;
  return (
    <audio
      controls
      preload="none"
      src={src}
      aria-label={`Ouvir ${titulo}`}
      onError={() => setFalhou(true)}
      className="h-11 w-full max-w-[560px]"
    />
  );
}
