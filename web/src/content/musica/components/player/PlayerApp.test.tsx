import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Catalog, Song } from '@/lib/player/schema';
import { ALTURA_MINIMA, CHAVE_ALTURA, PASSO_ALTURA } from './constantes';
import { PlayerApp } from './PlayerApp';

const musica = (id: string, title: string, category: string): Song => ({
  id,
  title,
  category,
  authorship: 'teste',
  channels: [{ channel: 0, program: 42, name: 'Cello' }],
  versions: [
    { id: 'a', label: 'Versão A', stemsBase: `/s/${id}_a`, midi: `/m/${id}.mid`, duration: 60 },
    { id: 'b', label: 'Versão B', stemsBase: `/s/${id}_b`, midi: `/m/${id}.mid`, duration: 60 },
  ],
  references: [{ label: 'Fonte', url: 'https://exemplo.com', study: true }],
  measurements: [],
  checks: [{ text: 'Ouvir', state: 'pending' }],
  story: 'Uma história.',
  storyDraft: true,
});
const catalogo: Catalog = {
  categories: [
    { id: 'batalha', label: 'Batalha', order: 1 },
    { id: 'cidade', label: 'Cidade', order: 2 },
  ],
  songs: [musica('m1', 'Marcha', 'batalha'), musica('m2', 'Brasas', 'batalha'), musica('c1', 'Praça', 'cidade')],
};

// no AudioContext in jsdom: only clicks (no pointerdown), so the engine is never created and the screens show the choice
describe('PlayerApp', () => {
  // jsdom has no canvas: the roll draws nothing, which is the case the drawing code already guards
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    // a fresh in-memory storage per test (the runner's own localStorage is not a full Storage)
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => m.set(k, v),
      removeItem: (k: string) => m.delete(k),
    });
  });

  it('changes the height from the handle with the keyboard and remembers it', () => {
    const { unmount } = render(<PlayerApp catalogo={catalogo} />);
    const alca = screen.getByRole('separator', { name: 'Altura do player' });
    const padrao = Number(alca.getAttribute('aria-valuenow'));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBeNull();
    fireEvent.keyDown(alca, { key: 'ArrowDown' });
    expect(alca).toHaveAttribute('aria-valuenow', String(padrao + PASSO_ALTURA));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBe(String(padrao + PASSO_ALTURA));
    fireEvent.keyDown(alca, { key: 'ArrowUp' });
    fireEvent.keyDown(alca, { key: 'ArrowUp' });
    expect(localStorage.getItem(CHAVE_ALTURA)).toBe(String(padrao - PASSO_ALTURA));
    // a new visit opens at the stored height
    unmount();
    render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', String(padrao - PASSO_ALTURA));
    // Home and a double click go back to the default and forget the choice
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Home' });
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', String(padrao));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBeNull();
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowDown' });
    fireEvent.doubleClick(screen.getByRole('separator'));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBeNull();
  });

  it('ignores a stored height that is not a number', () => {
    localStorage.setItem(CHAVE_ALTURA, 'banana');
    render(<PlayerApp catalogo={catalogo} />);
    expect(Number(screen.getByRole('separator').getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(ALTURA_MINIMA);
  });

  it('lists categories, filters by search and switches the song', () => {
    render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain('Batalha (2)');
    expect(screen.getByLabelText('Estilo')).toHaveValue('batalha');
    fireEvent.change(screen.getByLabelText('Buscar música'), { target: { value: 'brasa' } });
    expect(screen.getByText('Mostrando 1 de 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Brasas/ }));
    expect(screen.getByRole('button', { name: /Brasas/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('picks the version of the whole song from the mixer header', () => {
    render(<PlayerApp catalogo={catalogo} />);
    const seletor = screen.getByLabelText('Versões');
    fireEvent.change(seletor, { target: { value: 'b' } });
    expect(screen.getByText('Versão B', { selector: 'strong' })).toBeInTheDocument();
  });

  it('collapses the list and shows the notes with the draft badge and study reference', () => {
    render(<PlayerApp catalogo={catalogo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Recolher a lista de músicas' }));
    expect(screen.getByRole('button', { name: 'Mostrar a lista de músicas' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Fonte/ })).toHaveAttribute('target', '_blank');
  });
});
