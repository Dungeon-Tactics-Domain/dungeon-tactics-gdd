import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Remodelagem } from './Remodelagem';

const bancada = (resposta: Response) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(resposta)),
  );
const glb = (titulo: string) => new URL(screen.getByTitle(titulo).getAttribute('src')!).searchParams.get('glb');

afterEach(() => vi.unstubAllGlobals());

describe('Remodelagem', () => {
  it('shows the original and the 5-head knight while the measures are not on the bench', async () => {
    // the bench answers its HTML page for a missing file
    bancada(new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }));
    render(<Remodelagem />);
    await screen.findByTitle('5 cabeças');
    expect(glb('5 cabeças')).toBe('/eval/kaykit-remodel/knight-5h.glb');
    expect(glb('Original (KayKit)')).toBe('/models/knight.glb');
    expect(screen.getAllByText('Medindo… ainda não disponível.')).toHaveLength(1);
  });

  it('builds the buttons from proporcoes.json and compares up to three models', async () => {
    bancada(
      Response.json([
        { id: 'original', arquivo: '/models/knight.glb', nome: 'Original', cabecas: 2.11 },
        { id: '4h', arquivo: 'knight-4h.glb', nome: '4 cabeças', cabecas: 4 },
        { id: '5h', arquivo: 'knight-5h.glb', nome: '5 cabeças', cabecas: 5 },
        { id: '6h', arquivo: 'knight-6h.glb', nome: '6 cabeças', cabecas: 6 },
      ]),
    );
    render(<Remodelagem />);
    // the original beside the 5-head one by default
    await screen.findByTitle('Original');
    expect(screen.getByTitle('5 cabeças')).toBeInTheDocument();
    expect(screen.queryByTitle('4 cabeças')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '4 cabeças' }));
    await userEvent.click(screen.getByRole('button', { name: '6 cabeças' }));
    // a fourth pushes the oldest out
    expect(screen.queryByTitle('Original')).toBeNull();
    expect(glb('6 cabeças')).toBe('/eval/kaykit-remodel/knight-6h.glb');
    expect(screen.getByText('6,0 cabeças = 1 de cabeça + 5,0 de corpo')).toBeInTheDocument();

    // the last one cannot be removed
    await userEvent.click(screen.getByRole('button', { name: '4 cabeças' }));
    await userEvent.click(screen.getByRole('button', { name: '5 cabeças' }));
    await userEvent.click(screen.getByRole('button', { name: '6 cabeças' }));
    expect(screen.getByTitle('6 cabeças')).toBeInTheDocument();
  });
});
