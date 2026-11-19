import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Arvore, Lateral } from './Navegacao';

const montar = (recolhida = false) =>
  render(
    <MemoryRouter>
      <Lateral recolhida={recolhida} alternar={() => {}} setSlot={() => {}} />
    </MemoryRouter>,
  );

describe('Lateral', () => {
  // a fresh in-memory storage per test (the runner's own localStorage is not a full Storage)
  beforeEach(() => {
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => m.set(k, v),
    });
  });

  it('resizes with the arrows within its limits and remembers the width', async () => {
    const user = userEvent.setup();
    montar();
    const alca = screen.getByRole('separator', { name: 'Largura da barra lateral' });
    // jsdom matches no media query: the ultrawide band, 320 px by default
    expect(alca).toHaveAttribute('aria-valuenow', '320');
    alca.focus();
    await user.keyboard('{ArrowRight}');
    expect(alca).toHaveAttribute('aria-valuenow', '336');
    expect(localStorage.getItem('casca:largura')).toBe('336');
    await user.keyboard('{End}{ArrowRight}');
    expect(alca).toHaveAttribute('aria-valuenow', '480');
    await user.keyboard('{Home}{ArrowLeft}');
    expect(alca).toHaveAttribute('aria-valuenow', '220');
  });

  it('ignores a bad stored width and has no handle as an icon rail', () => {
    localStorage.setItem('casca:largura', 'abc');
    const { unmount } = montar();
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '320');
    unmount();
    montar(true);
    expect(screen.queryByRole('separator')).toBeNull();
    expect(screen.getByRole('button', { name: 'Abrir a barra lateral' })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Arvore', () => {
  const ver = (rota: string, setSlot = vi.fn()) =>
    render(
      <MemoryRouter initialEntries={[rota]}>
        <Arvore setSlot={setSlot} />
      </MemoryRouter>,
    );

  it('lists home and every lab, opening only the lab of the route', () => {
    const setSlot = vi.fn();
    ver('/mecanicas/regras', setSlot);
    const arvore = screen.getByRole('navigation', { name: 'Laboratórios' });
    expect(arvore.querySelectorAll('a')).toHaveLength(7);
    expect(screen.getByRole('link', { name: /Mecânicas/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Design/ })).not.toHaveAttribute('aria-current');
    // the open lab hands its slot to the lab's own menu
    expect(setSlot).toHaveBeenCalledWith(expect.any(HTMLElement));
  });

  it('opens no lab on the home', () => {
    const setSlot = vi.fn();
    ver('/', setSlot);
    expect(screen.getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page');
    expect(setSlot).not.toHaveBeenCalled();
  });
});
