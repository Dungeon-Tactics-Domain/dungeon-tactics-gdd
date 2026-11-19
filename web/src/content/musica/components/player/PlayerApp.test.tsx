import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Catalog, Song } from '@/lib/player/schema';
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
  });

  it('lists categories, filters by search and switches the song', () => {
    render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Batalha2', 'Cidade1']);
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
