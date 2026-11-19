// The music studio: the player (React, src/lib/player) over the lab's catalog, on the "Noite" scheme.
import { useEffect, useState } from 'react';
import type { ParseResult } from '@/lib/player/parse-catalog';
import type { Catalog } from '@/lib/player/schema';
import { PlayerApp } from './player/PlayerApp';

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
  return <PlayerApp catalogo={catalogo.value} />;
}
