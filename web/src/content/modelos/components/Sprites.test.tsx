import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sprites } from './Sprites';

const BASE = 'http://localhost:5205/eval/sprites-opus';
const pedidas: string[] = [];
const desenhar = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  pedidas.length = 0;
  desenhar.mockClear();
  // a loaded sheet 256 px wide
  vi.stubGlobal(
    'Image',
    class {
      complete = true;
      naturalWidth = 256;
      set src(v: string) {
        pedidas.push(v);
      }
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: desenhar } as never);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Sprites', () => {
  it('animates the row of the chosen direction, frame by frame', () => {
    render(<Sprites modelo="opus">intro</Sprites>);
    expect(pedidas).toEqual([`${BASE}/hd-idle.png`]);
    expect(screen.getByAltText('Folha de contato')).toHaveAttribute('src', `${BASE}/contato.png`);
    // idle: 4 frames of 64 px, row 0 (S), at 4 fps
    act(() => vi.advanceTimersByTime(250));
    expect(desenhar).toHaveBeenLastCalledWith(expect.anything(), 128, 0, 64, 64, 0, 0, 64, 64);
    fireEvent.click(screen.getByRole('button', { name: 'E' }));
    act(() => vi.advanceTimersByTime(250));
    expect(desenhar).toHaveBeenLastCalledWith(expect.anything(), expect.any(Number), 128, 64, 64, 0, 0, 64, 64);
  });

  it('loads the sheet of the action and the finish', () => {
    render(<Sprites modelo="opus" />);
    fireEvent.click(screen.getByRole('button', { name: 'Atacar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pixel art' }));
    expect(pedidas.at(-1)).toBe(`${BASE}/pixel-attack.png`);
    expect(screen.getByRole('button', { name: 'Pixel art' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'HD pintado' })).toHaveAttribute('aria-pressed', 'false');
  });
});
