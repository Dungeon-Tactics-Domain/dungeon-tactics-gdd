// The music studio: the midi-studio-player app over the lab's catalog, in its night theme (the lab's "Noite" scheme,
// Fernando, 18/11).
import { useEffect, useState } from 'react';
import 'midi-studio-player';
import type { Catalog, ParseResult } from 'midi-studio-player';

// the package loads no fonts (a @font-face inside a shadow root is ignored); no `precedence` on the link, because
// React then suspends the page until the stylesheet loads, and a blocked font host would leave it on "Carregando…"
const FONTES =
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Space+Mono:wght@400;700&display=swap';

export function PlayerMusicas() {
  // loaded apart: its ~420 stems.json modules take seconds in dev and tests, and the page shell should not wait on them
  const [catalogo, setCatalogo] = useState<ParseResult<Catalog>>();
  useEffect(() => {
    let vivo = true;
    void import('./catalogo').then((m) => vivo && setCatalogo(m.catalogo));
    return () => {
      vivo = false;
    };
  }, []);
  if (!catalogo) return <p className="m-0 text-apagado">Carregando as músicas…</p>;
  if (!catalogo.ok)
    return (
      <ul role="alert" className="m-0 text-erro">
        {catalogo.errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    );
  return (
    <>
      <link rel="stylesheet" href={FONTES} />
      <dt-music-app theme="night" catalog={catalogo.value} />
    </>
  );
}
