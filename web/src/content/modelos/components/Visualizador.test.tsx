import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Blender, Visualizador } from './Visualizador';

const B = 'http://localhost:5205/eval.html';

describe('Visualizador', () => {
  it('switches piece and style', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response())),
    );
    render(<Visualizador conjunto="carrocas-high">intro</Visualizador>);
    const iframe = screen.getByTitle('Visualizador 3D');
    expect(iframe).toHaveAttribute('src', `${B}?zoom=2.2&m=D`);
    await userEvent.click(screen.getByRole('button', { name: 'Carroça 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'PSX' }));
    expect(iframe).toHaveAttribute('src', `${B}?zoom=2.2&m=cart-7&ps1=1&pixel=3&keep=0.35`);
    expect(screen.getByRole('button', { name: 'PSX' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Pintado (jogo)' }));
    expect(iframe).toHaveAttribute('src', `${B}?zoom=2.2&m=cart-7&pixel=3`);
  });

  it('gives trees their own zoom', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response())),
    );
    render(<Visualizador conjunto="arvores-high" />);
    expect(screen.getByTitle('Visualizador 3D')).toHaveAttribute('src', `${B}?zoom=3.2&m=tree-1`);
  });

  it('warns when the bench does not answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('down'))),
    );
    render(<Visualizador conjunto="guerreiro-codigo" />);
    expect(await screen.findByText(/A bancada 3D não respondeu/)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Peça' })).toBeNull();
  });
});

describe('Blender', () => {
  it('shows the Blender model with no style buttons when the file is there', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
    );
    render(<Blender modelo="opus">intro</Blender>);
    expect(await screen.findByTitle('Visualizador 3D')).toHaveAttribute(
      'src',
      `${B}?zoom=1.6&glb=${encodeURIComponent('http://localhost:5205/eval/blender-opus/char.glb')}`,
    );
    expect(screen.getByText('intro')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Estilo' })).toBeNull();
  });

  it('says the model is in progress when the file is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 404 }))),
    );
    render(<Blender modelo="fable">intro</Blender>);
    expect(await screen.findByText(/Em andamento/)).toBeInTheDocument();
    expect(screen.queryByText('intro')).toBeNull();
  });
});
