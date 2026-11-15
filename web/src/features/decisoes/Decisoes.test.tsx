import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Decisoes } from './Decisoes';

const d = (id: string, escolha: string) => ({ id, lab: id.split('/')[0], escolha, nota: '', atualizadoEm: '' });

describe('Decisoes', () => {
  it('lists every decision and filters by lab and choice', async () => {
    const lista = [d('musica/a', 'usar'), d('musica/b', 'refazer'), d('modelos/x/1', 'usar')];
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(lista)))),
    );
    render(<Decisoes />);
    expect(await screen.findByText('3 de 3 decisões.')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Escolha'), 'usar');
    expect(screen.getByText('2 de 3 decisões.')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Lab'), 'musica');
    expect(screen.getByText('1 de 3 decisões.')).toBeInTheDocument();
    expect(screen.getByText('musica/a')).toBeInTheDocument();
  });
});
