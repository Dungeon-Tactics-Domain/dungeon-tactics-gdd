import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Icones } from './Icones';
import { Rostos } from './Rostos';

const telaEstreita = (reduzir = false) =>
  vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((q) => ({ matches: q.includes('reduce') ? reduzir : false, media: q }) as MediaQueryList);

describe('icons magnifier below 1024 px', () => {
  it('goes back from the magnifier to the card that opened it', async () => {
    telaEstreita();
    const ver = vi.fn();
    Element.prototype.scrollIntoView = ver;
    const user = userEvent.setup();
    render(<Icones />);
    const cartao = screen.getAllByRole('button', { name: 'Lupa 8x' })[5]!;
    await user.click(cartao);
    expect(ver.mock.contexts.at(-1)).toBe(screen.getByRole('complementary', { name: 'Lupa' }));
    const voltar = screen.getByRole('button', { name: 'Voltar ao ícone' });
    expect(voltar.querySelector('svg')).not.toBeNull();
    await user.click(voltar);
    expect(ver.mock.contexts.at(-1)).toBe(cartao);
    expect(cartao).toHaveFocus();
  });
});

describe('talking faces', () => {
  // the speech is one 180 ms interval: a running timer means the faces move
  it('pauses and resumes the speech with an icon button', () => {
    telaEstreita();
    vi.useFakeTimers();
    render(<Rostos />);
    expect(vi.getTimerCount()).toBe(1);
    const botao = screen.getByRole('button', { name: 'Pausar a fala' });
    expect(botao.querySelector('svg')).not.toBeNull();
    act(() => botao.click());
    expect(vi.getTimerCount()).toBe(0);
    act(() => screen.getByRole('button', { name: 'Retomar a fala' }).click());
    expect(vi.getTimerCount()).toBe(1);
    vi.useRealTimers();
  });

  it('starts still with prefers-reduced-motion', () => {
    telaEstreita(true);
    vi.useFakeTimers();
    render(<Rostos />);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole('button', { name: 'Retomar a fala' })).toHaveAttribute('aria-pressed', 'true');
    vi.useRealTimers();
  });
});
