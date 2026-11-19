import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeContext, fakeFetch } from '@/lib/player/fake-audio';
import { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Catalog, Song } from '@/lib/player/schema';
import { ALTURA_MAXIMA, ALTURA_MINIMA, CHAVE_ALTURA, CHAVE_ZOOM, PASSO_ALTURA, PASSO_RODA } from './constantes';
import { alturaNecessaria, nomeDaNota, notasEm } from './hooks';
import { Mixer } from './Mixer';
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

  it('caps the height at what shows every lane, with nothing empty under the last one', () => {
    // a 900 px box whose scrolling area shows 600 px of a 1648 px mixer: 300 px of fixed parts plus the content
    expect(alturaNecessaria(900, 600, 1648)).toBe(1948);
    // a box taller than its content shrinks to it; half a pixel rounds up so nothing is left to scroll
    expect(alturaNecessaria(1200, 900, 448.5)).toBe(749);
    // a short song still gets the minimum, and content that cannot be measured keeps the fixed ceiling
    expect(alturaNecessaria(400, 100, 20)).toBe(ALTURA_MINIMA);
    expect(alturaNecessaria(900, 0, 0)).toBe(ALTURA_MAXIMA);
  });

  it('names the note sounding on each channel at an instant', () => {
    const notas = [
      { start: 1, end: 2, pitch: 60, channel: 0 },
      { start: 1, end: 2, pitch: 67, channel: 0 }, // a chord: the highest note is the one shown
      { start: 2, end: 3, pitch: 62, channel: 0 },
      { start: 1.5, end: 4, pitch: 36, channel: 9 },
    ];
    expect(notasEm(notas, 0.5).size).toBe(0);
    expect(notasEm(notas, 1).get(0)).toBe(67);
    // the end is not part of the note: at 2 s only the next one sounds
    expect(notasEm(notas, 2).get(0)).toBe(62);
    expect([...notasEm(notas, 3.5)]).toEqual([[9, 36]]);
    expect(nomeDaNota(67)).toBe('Sol 4');
    expect(nomeDaNota(60)).toBe('Dó 4');
    expect(nomeDaNota(61)).toBe('Dó# 4');
  });

  it('zooms the lanes from the buttons and marks the stretch on screen over the overview', () => {
    const { container } = render(<PlayerApp catalogo={catalogo} />);
    const notas = screen.getByRole('slider', { name: /Notas de cada canal/ });
    const menos = screen.getByRole('button', { name: 'Diminuir o zoom das notas' });
    // jsdom lays nothing out, so the box keeps the whole width; the lanes open at twice the room they have
    expect(container.querySelector('[data-roll="janela"]')).toHaveStyle({ left: '0%', width: '100%' });
    expect(notas).toHaveStyle({ width: '200%' });
    expect(screen.getByText('Zoom 2×')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar o zoom das notas' }));
    expect(notas).toHaveStyle({ width: '400%' });
    fireEvent.click(menos);
    fireEvent.click(menos);
    fireEvent.click(menos);
    expect(notas).toHaveStyle({ width: '100%' });
    expect(menos).toBeDisabled();
  });

  it('remembers the zoom between visits and ignores a stored value that is not a zoom', () => {
    const { unmount } = render(<PlayerApp catalogo={catalogo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar o zoom das notas' }));
    expect(localStorage.getItem(CHAVE_ZOOM)).toBe('4');
    unmount();
    const outra = render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getByText('Zoom 4×')).toBeInTheDocument();
    outra.unmount();
    for (const ruim of ['banana', '0', '99', '']) {
      localStorage.setItem(CHAVE_ZOOM, ruim);
      const r = render(<PlayerApp catalogo={catalogo} />);
      expect(screen.getByText('Zoom 2×')).toBeInTheDocument();
      r.unmount();
    }
  });

  it('zooms with the plain wheel over the overview, and only with Ctrl over the lanes', () => {
    const { container } = render(<PlayerApp catalogo={catalogo} />);
    const notas = screen.getByRole('slider', { name: /Notas de cada canal/ });
    const visao = container.querySelector('[data-roll="visao"]')!;
    // fireEvent returns false when the listener called preventDefault: the page must not scroll
    expect(fireEvent.wheel(visao, { deltaY: -100 })).toBe(false);
    expect(notas).toHaveStyle({ width: `${200 * PASSO_RODA}%` });
    expect(localStorage.getItem(CHAVE_ZOOM)).toBe(String(2 * PASSO_RODA));
    fireEvent.wheel(visao, { deltaY: 100 });
    fireEvent.wheel(visao, { deltaY: 100 });
    expect(notas).toHaveStyle({ width: `${200 / PASSO_RODA}%` });
    // over the lanes the plain wheel scrolls them
    expect(fireEvent.wheel(notas, { deltaY: -100 })).toBe(true);
    expect(notas).toHaveStyle({ width: `${200 / PASSO_RODA}%` });
    expect(fireEvent.wheel(notas, { deltaY: -100, ctrlKey: true })).toBe(false);
    expect(notas).toHaveStyle({ width: '200%' });
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

  it('asks what to do with the per-instrument choices before changing the version of the whole song', async () => {
    const m = catalogo.songs[0]!;
    const arquivos = { '/s/m1_a/0.ogg': 60, '/s/m1_b/0.ogg': 60 };
    const engine = new PlayerEngine({ context: new FakeContext().asContext(), fetch: fakeFetch(arquivos).fetch });
    await engine.setSong(m, 'a');
    const trocar = vi.fn();
    render(<Mixer engine={engine} musica={m} versao={m.versions[0]} canais={m.channels} aoTrocarVersao={trocar} />);
    const seletor = screen.getByLabelText('Versões');

    // no instrument on a version of its own: it changes at once
    fireEvent.change(seletor, { target: { value: 'b' } });
    expect(trocar).toHaveBeenLastCalledWith('b');
    expect(screen.queryByRole('alertdialog')).toBeNull();

    act(() => engine.setChannelVersion(0, 'b'));
    const pedir = () => {
      trocar.mockClear();
      fireEvent.change(seletor, { target: { value: 'b' } });
      return screen.getByRole('alertdialog', { name: 'Trocar para Versão B?' });
    };
    pedir();
    expect(trocar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Manter minhas trocas' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Manter minhas trocas' }));
    expect(trocar).toHaveBeenLastCalledWith('b', true);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await waitFor(() => expect(seletor).toHaveFocus()); // Radix gives the focus back a tick after it closes

    pedir();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar tudo' }));
    expect(trocar).toHaveBeenLastCalledWith('b', false);

    // Cancel and Esc change nothing and the select shows the version in use again
    pedir();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.keyDown(pedir(), { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(trocar).not.toHaveBeenCalled();
    expect(seletor).toHaveValue('a');
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
