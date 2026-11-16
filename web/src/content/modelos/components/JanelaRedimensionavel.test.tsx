import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JanelaRedimensionavel, LARGURA_MINIMA, LARGURA_PADRAO } from './JanelaRedimensionavel';

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

const janela = (tipo = 'teste') =>
  render(
    <JanelaRedimensionavel tipo={tipo}>
      <iframe title="3D" />
    </JanelaRedimensionavel>,
  );

describe('JanelaRedimensionavel', () => {
  it('starts at the default width and resizes from the keyboard, remembering it per kind of page', async () => {
    const { unmount } = janela();
    const alca = screen.getByRole('slider', { name: 'Tamanho da janela 3D' });
    expect(alca).toHaveAttribute('aria-valuenow', String(LARGURA_PADRAO));

    alca.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(alca).toHaveAttribute('aria-valuenow', String(LARGURA_PADRAO + 40));
    expect(localStorage.getItem('modelos:janela:teste')).toBe(String(LARGURA_PADRAO + 40));
    unmount();

    janela();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', String(LARGURA_PADRAO + 40));
  });

  it('makes the other windows of the same kind follow', async () => {
    render(
      <>
        <JanelaRedimensionavel tipo="par" rotulo="A">
          <iframe title="A" />
        </JanelaRedimensionavel>
        <JanelaRedimensionavel tipo="par" rotulo="B">
          <iframe title="B" />
        </JanelaRedimensionavel>
      </>,
    );
    screen.getByRole('slider', { name: 'A' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('slider', { name: 'B' })).toHaveAttribute('aria-valuenow', String(LARGURA_PADRAO - 20));
  });

  it('never goes under the minimum and ignores a broken stored value', async () => {
    localStorage.setItem('modelos:janela:outra', 'banana');
    janela('outra');
    const alca = screen.getByRole('slider');
    expect(alca).toHaveAttribute('aria-valuenow', String(LARGURA_PADRAO));
    alca.focus();
    await userEvent.keyboard('{Home}{ArrowDown}');
    expect(alca).toHaveAttribute('aria-valuenow', String(LARGURA_MINIMA));
  });
});
