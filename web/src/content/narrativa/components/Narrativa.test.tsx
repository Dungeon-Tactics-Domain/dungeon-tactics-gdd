import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MinhasMarcas } from './Narrativa';
import { CHAVE, lerMarcas } from './marcas';

// Node's own localStorage global shadows jsdom's in Vitest and has no methods, so each test brings its storage
beforeEach(() => {
  const m = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('narrative lab marks', () => {
  it('lists the saved marks under Quero and Não quero, with the note', () => {
    localStorage.setItem(
      CHAVE,
      JSON.stringify({
        'fft:l:x': { v: 'quero', note: 'sim', label: 'Final Fantasy Tactics · x' },
        'fft:l:y': { v: 'nao', note: '', label: 'Final Fantasy Tactics · y' },
      }),
    );
    render(<MinhasMarcas />);
    expect(screen.getByRole('heading', { name: 'Quero (1)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Não quero (1)' })).toBeInTheDocument();
    expect(screen.getByText('sim')).toBeInTheDocument();
  });

  it('drops anything malformed in storage', () => {
    localStorage.setItem(CHAVE, JSON.stringify({ a: { v: 'talvez' }, b: { v: 'nao' } }));
    expect(lerMarcas()).toEqual({ b: { v: 'nao', note: '', label: 'b' } });
  });
});
