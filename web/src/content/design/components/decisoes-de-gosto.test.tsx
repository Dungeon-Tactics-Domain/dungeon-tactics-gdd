import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GOSTO_ABERTAS, PLANO } from '../dados';
import manifesto from '../manifest';
import { Agora } from './Decisoes';
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

  it('opens with an index that links to every decision and says whether it is answered or open', () => {
    render(<DecisoesDeGosto />);
    const links = within(screen.getByRole('navigation', { name: 'Índice das decisões' })).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(DECISOES.map((d) => `#${d.id}`));
    for (const [i, d] of DECISOES.entries())
      expect(links[i]).toHaveTextContent(d.resposta ? `respondida: ${d.resposta}` : 'aberta');
    // an id that is an old anchor would be redirected by the router instead of scrolling
    expect(DECISOES.filter((d) => d.id in (manifesto.linksAntigos ?? {}))).toEqual([]);
  });

  it('shows the open taste decisions on the lab home, with a link to the page, and a next step with real menu labels', () => {
    expect(GOSTO_ABERTAS).toBe(DECISOES.filter((d) => !d.resposta).length);
    render(
      <MemoryRouter>
        <Agora />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: `${GOSTO_ABERTAS} decisões de gosto abertas` })).toHaveAttribute(
      'href',
      '/design/interface/decisoes-de-gosto',
    );
    const interface_ = manifesto.grupos.find((g) => g.id === 'interface')!;
    const pagina = interface_.paginas.find((p) => p.id === 'decisoes-de-gosto')!;
    expect(PLANO.nextStep).toContain(`${interface_.titulo} › ${pagina.titulo}`);
    expect(PLANO.nextStep).not.toContain('Maquetes');
  });
});

describe('scaled frame', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('scales to the column at mount even when the observer never calls back (hidden tab)', () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(344);
    render(<DecisoesDeGosto />);
    // 344 / 3440 = 10%, not the 25% guess that drew an 860 px frame on a 390 px phone
    const hud = screen.getByRole('region', { name: 'HUD no ultrawide' });
    expect(within(hud).getAllByText(/3440 × 1440 px · mostrado a 10%/)).toHaveLength(3);
  });
});
