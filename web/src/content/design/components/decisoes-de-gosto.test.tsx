import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DECISOES, DecisoesDeGosto } from './DecisoesDeGosto';

describe('taste decisions page', () => {
  it('has 10 decisions, each with one recommended option and the answer to send', () => {
    expect(DECISOES).toHaveLength(10);
    expect(DECISOES.every((d) => d.opcoes.filter((o) => o.rec).length === 1)).toBe(true);
    render(<DecisoesDeGosto />);
    for (const d of DECISOES) {
      const s = screen.getByRole('region', { name: d.titulo });
      const rec = d.opcoes.find((o) => o.rec)!.letra;
      expect(s).toHaveTextContent(`«${d.titulo}: Opção ${rec}»`);
      expect(within(s).getAllByText('Recomendada')).toHaveLength(1);
    }
  });

  it('draws every option on every screen and moment, and one drawing where the options look the same', async () => {
    const user = userEvent.setup();
    render(<DecisoesDeGosto />);
    const hud = screen.getByRole('region', { name: 'HUD no ultrawide' });
    expect(within(hud).getAllByText(/3440 × 1440 px/)).toHaveLength(3);
    await user.click(within(hud).getByRole('button', { name: 'Cidade (Loja)' }));
    expect(within(hud).getAllByText('Vila de Vauclair')).toHaveLength(6); // 3 frames and their 100% crops
    await user.click(within(hud).getByRole('button', { name: /^Celular/ }));
    expect(within(hud).getAllByRole('img', { name: /390×844: Loja/ })).toHaveLength(1);

    const voltar = screen.getByRole('region', { name: 'Lugar do botão Voltar na batalha' });
    expect(within(voltar).getAllByRole('img', { name: /390×844 com toque/ })).toHaveLength(3);
    await user.click(within(voltar).getByRole('button', { name: /^Tablet/ }));
    expect(within(voltar).getAllByText('‹ Voltar')).toHaveLength(1);
  });
});
