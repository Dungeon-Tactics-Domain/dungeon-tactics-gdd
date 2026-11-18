// The walkable town draft (moved from the design lab on 17/11): the map is walkable and the page switches levels.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CHAVE, LUGARES, MAPA, NPCS } from '../cidade';
import { Cidade } from './Cidade';

describe('walkable town', () => {
  it('draws a 40x30 town where every door and every NPC tile is reachable from the start, lots matching their letters', () => {
    expect(MAPA).toHaveLength(30);
    expect(MAPA.every((r) => r.length === 40 && [...r].every((c) => CHAVE[c]))).toBe(true);
    const at = (x: number, y: number) => CHAVE[MAPA[y]?.[x] ?? '']!;
    const anda = (x: number, y: number) => at(x, y)?.terrain === 'floor' && (at(x, y).depth ?? 0) < 2;
    const inicio = MAPA.flatMap((r, y) => (r.includes('@') ? [[r.indexOf('@'), y]] : []));
    expect(inicio).toHaveLength(1);
    // walking: 4 directions, deep water blocks, a step of at most 1 level (the ramp)
    const visto = new Set([String(inicio[0])]);
    for (const fila = [inicio[0]!]; fila.length;) {
      const [x, y] = fila.shift()!;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const [nx, ny] = [x! + dx, y! + dy];
        if (visto.has(`${nx},${ny}`) || !anda(nx, ny) || Math.abs(at(nx, ny).h - at(x!, y!).h) > 1) continue;
        visto.add(`${nx},${ny}`);
        fila.push([nx, ny]);
      }
    }
    expect(LUGARES).toHaveLength(10);
    for (const l of LUGARES) {
      const lote = l.lotes.flatMap((o) =>
        Array.from({ length: o.w * o.h }, (_, i) => `${o.x + (i % o.w)},${o.y + Math.floor(i / o.w)}`),
      );
      const letras = MAPA.flatMap((r, y) => [...r].flatMap((c, x) => (c === l.letra ? [`${x},${y}`] : [])));
      expect(new Set(lote), l.letra).toEqual(new Set(letras));
      expect(visto.has(`${l.porta.x},${l.porta.y}`), `porta ${l.letra}`).toBe(true);
    }
    expect(NPCS).toHaveLength(10);
    for (const n of NPCS) for (const p of [n.em, n.ate ?? n.em]) expect(visto.has(`${p.x},${p.y}`), n.id).toBe(true);
  });

  it('switches the town level, showing the NPCs of that level, and the lines in both languages', async () => {
    const user = userEvent.setup();
    render(<Cidade />);
    expect(screen.getAllByRole('button', { name: /^\d+\. .+, / })).toHaveLength(7);
    await user.hover(screen.getByRole('button', { name: '1. Hilde, guarda do portão' }));
    expect(screen.getByText(/A névoa chegou à estrada/)).toBeInTheDocument();
    expect(screen.getByText('Depois da fala abre: Escolher dungeon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '3 · Farol aceso' }));
    expect(screen.getAllByRole('button', { name: /^\d+\. .+, / })).toHaveLength(10);
    await user.click(screen.getByRole('button', { name: 'English' }));
    await user.hover(screen.getByRole('button', { name: '10. Amaro, beacon archivist' }));
    expect(screen.getByText(/The beacon lit again/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Beacon lit');
  });
});
