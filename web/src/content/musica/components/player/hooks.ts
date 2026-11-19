import { useEffect, useState } from 'react';
import type { PlayerEngine } from '@/lib/player/PlayerEngine';

/**
 * Redraws the component on every engine change (song, mixer, state, download progress). With `quadro` it also redraws
 * once per frame while playing, for the parts that follow the position.
 */
export function useMotor(engine: PlayerEngine | undefined, quadro = false) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!engine) return;
    const bump = () => setN((n) => n + 1);
    const off = [
      engine.on('change', bump),
      engine.on('state', bump),
      engine.on('progress', bump),
      engine.on('error', bump),
      ...(quadro ? [engine.on('time', bump)] : []),
    ];
    return () => off.forEach((f) => f());
  }, [engine, quadro]);
}
