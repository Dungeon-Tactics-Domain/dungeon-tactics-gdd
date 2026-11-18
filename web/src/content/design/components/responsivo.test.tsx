import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { faixa, FAIXAS, RedesignResponsivo } from './Responsivo';

describe('responsive redesign mock-ups', () => {
  it('puts every test screen in its own band, cut at 640, 1024, 1440 and 2560 px, text never below 14 px', () => {
    expect(FAIXAS.map((f) => faixa(f.tela[0]).id)).toEqual(['celular', 'tablet', 'deitado', 'desktop', 'ultrawide']);
    expect([639, 640, 1023, 1024, 1439, 1440, 2559, 2560].map((w) => faixa(w).id)).toEqual([
      'celular',
      'tablet',
      'tablet',
      'deitado',
      'deitado',
      'desktop',
      'desktop',
      'ultrawide',
    ]);
    expect(FAIXAS.every((f) => f.legenda >= 14 && f.base >= 16)).toBe(true);
  });

  it('navigates the real labs in each variant and keeps the icon detail beside the cards, or in a tab on the phone', async () => {
    const user = userEvent.setup();
    render(<RedesignResponsivo />);
    const nav = screen.getByRole('region', { name: '1. Navegação' });
    await user.click(within(nav).getByRole('button', { name: /Mecânicas e game feel/ }));
    expect(within(nav).getByRole('heading', { level: 1 })).toHaveTextContent('Decisões');
    await user.click(within(nav).getByRole('button', { name: 'Menu inferior no celular' }));
    await user.click(within(nav).getByRole('button', { name: /^Celular/ }));
    await user.click(within(nav).getByRole('button', { name: 'Música' }));
    expect(within(nav).getByRole('button', { name: 'Música' })).toHaveAttribute('aria-current', 'page');

    const ultra = screen.getByRole('region', { name: '2. Ultrawide em 3 painéis' });
    await user.click(within(ultra).getByRole('button', { name: 'Explosão' }));
    expect(within(ultra).getByRole('heading', { level: 2, name: 'Explosão' })).toBeInTheDocument();
    await user.click(within(ultra).getByRole('button', { name: /^Celular/ }));
    await user.click(within(ultra).getByRole('button', { name: 'Cura' }));
    expect(within(ultra).getByRole('tab', { name: 'Lupa' })).toHaveAttribute('aria-selected', 'true');
    expect(within(ultra).getByRole('heading', { level: 2, name: 'Cura' })).toBeInTheDocument();
  });

  it('scales each frame to the column at mount even when the observer never calls back (hidden tab)', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(344);
    render(<RedesignResponsivo />);
    // 344 / 1920 = 18%, not the 25% guess (480 px wide on a 390 px phone)
    expect(screen.getAllByText(/1920 × 1080 px · mostrado a 18%/).length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/mostrado a 25%/)).toEqual([]);
    vi.unstubAllGlobals();
  });
});
