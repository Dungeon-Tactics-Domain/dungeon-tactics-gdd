import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FichaJogo, Moodboard } from './Narrativa';
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
  it('marks a lesson, keeps the note and clears on a second click, with the old keys', async () => {
    render(<FichaJogo slug="fft" />);
    const licao = screen.getByText('Sistema de classes (jobs) com JP').closest('li')!;
    const quero = within(licao).getByRole('button', { name: 'Quero' });
    await userEvent.click(quero);
    expect(quero).toHaveAttribute('aria-pressed', 'true');
    await userEvent.type(within(licao).getByRole('textbox', { name: 'Nota' }), 'sim');
    expect(lerMarcas()['fft:l:Sistema de classes (jobs) com JP']).toEqual({
      v: 'quero',
      note: 'sim',
      label: 'Final Fantasy Tactics · Sistema de classes (jobs) com JP',
    });
    await userEvent.click(quero);
    expect(lerMarcas()).toEqual({});
  });

  it('shows on "O que eu quero" only the images marked Quero', () => {
    const file = 'refs/fft/01-batalha-fila.jpg';
    localStorage.setItem(CHAVE, JSON.stringify({ [`fft:i:${file}`]: { v: 'quero', note: '', label: 'x' } }));
    render(<Moodboard slug="quero" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('img')).toHaveAttribute('src', `/content/narrativa/${file}`);
  });

  it('drops anything malformed in storage', () => {
    localStorage.setItem(CHAVE, JSON.stringify({ a: { v: 'talvez' }, b: { v: 'nao' } }));
    expect(lerMarcas()).toEqual({ b: { v: 'nao', note: '', label: 'b' } });
  });

  it('names an unknown work instead of an empty page', () => {
    render(<Moodboard slug="nada" />);
    expect(screen.getByText(/desconhecido/)).toBeInTheDocument();
  });
});
