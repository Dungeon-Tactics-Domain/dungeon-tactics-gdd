import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { COLUNAS, TesteSkills } from './TesteSkills';

describe('design skills comparison page', () => {
  it('draws the two pieces in the four columns, with an icon on every changed button, and opens the magnifier', async () => {
    const user = userEvent.setup();
    const { container } = render(<TesteSkills />);
    for (const nome of ['1. Botão e lupa de ícone', '2. Cartão de ícone']) {
      const s = screen.getByRole('region', { name: nome });
      expect(
        within(s)
          .getAllByRole('heading', { level: 3 })
          .map((h) => h.textContent),
      ).toEqual(COLUNAS.map((c) => c.titulo));
    }
    // the copies of today keep their icon-less button; every finalist column gets one
    for (const col of ['a', 'b', 'c'])
      for (const b of container.querySelectorAll(`.ts-${col} .ts-botao`)) expect(b.querySelector('svg')).not.toBeNull();
    const botao = within(screen.getByRole('region', { name: '1. Botão e lupa de ícone' })).getAllByRole('button')[0]!;
    // the finalist columns keep the panel mounted (for the exit transition) and mark it open; today's copy mounts it
    expect(container.querySelectorAll('.ts-lupa[data-aberto]')).toHaveLength(0);
    await user.click(botao);
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('.ts-atual .ts-lupa[data-aberto]')).toHaveLength(1);
  });

  it('ends with the open question, the three options and the ranking pick', () => {
    render(<TesteSkills />);
    const s = screen.getByRole('region', { name: 'Agora estamos decidindo' });
    expect(
      within(s)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(COLUNAS.filter((c) => c.id !== 'atual').map((c) => c.titulo));
    expect(s).toHaveTextContent('Recomendação: A (Jakub + Emil).');
    expect(s).toHaveTextContent('A (Jakub + Emil), depois C (Impeccable) e por último B (Google)');
  });
});
