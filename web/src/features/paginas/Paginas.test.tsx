import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Paginas } from './Paginas';
import type { Sumario } from './types';

const sair = vi.fn();
const SUMARIO: Sumario = {
  lab: 'teste',
  titulo: 'Lab de teste',
  linksAntigos: { fases: 'decisoes/fases', 'testes-de-ia': 'refs/ogre', 'mapa/cidade': '/fora' },
  grupos: [
    {
      id: 'decisoes',
      titulo: 'Decisões',
      resumo: 'Um resumo longo que precisa aparecer inteiro no cartão do grupo, sem corte nenhum.',
      paginas: [
        { id: 'agora', titulo: 'Agora', conteudo: () => <p>conteúdo agora</p> },
        { id: 'jogo', titulo: 'Jogo embutido', conteudo: () => <p>iframe</p>, aoSair: sair },
        { id: 'fases', titulo: 'Fases', subpaginas: [{ id: 'agua', titulo: 'Água', conteudo: () => <p>água</p> }] },
      ],
    },
    { id: 'refs', titulo: 'Referências', paginas: [{ id: 'ogre', titulo: 'Tactics Ogre' }] },
  ],
};

function Onde() {
  const l = useLocation();
  return <output data-testid="onde">{l.pathname + l.hash}</output>;
}

function montar(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route
          path="/lab/*"
          element={
            <>
              <Paginas sumario={SUMARIO} base="/lab" />
              <Link to="#fases">link antigo</Link>
              <Link to="/fora">sair do lab</Link>
            </>
          }
        />
        <Route path="/fora" element={<p>fora</p>} />
      </Routes>
      <Onde />
    </MemoryRouter>,
  );
}
const onde = () => screen.getByTestId('onde').textContent;
const menu = () => screen.getByRole('navigation', { name: 'Sumário: Lab de teste' });

describe('Paginas', () => {
  it('renders the page of the route with breadcrumbs and previous/next', () => {
    montar('/lab/decisoes/jogo');
    expect(screen.getByRole('heading', { level: 1, name: 'Jogo embutido' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Você está em' })).toHaveTextContent(
      'Lab de teste›Decisões›Jogo embutido',
    );
    expect(screen.getByRole('link', { name: /Anterior.*Agora/ })).toHaveAttribute('href', '/lab/decisoes/agora');
    expect(screen.getByRole('link', { name: /Próxima.*Fases/ })).toHaveAttribute('href', '/lab/decisoes/fases');
    expect(within(menu()).getByRole('link', { name: 'Jogo embutido' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the full group summary on the lab home', () => {
    montar('/lab');
    expect(screen.getByText(SUMARIO.grupos[0]!.resumo!)).toBeVisible();
  });

  it('sends an unknown route to the lab home with a notice', () => {
    montar('/lab/nada/aqui');
    expect(onde()).toBe('/lab/');
    expect(screen.getByText(/Não existe/)).toHaveTextContent('Não existe página em “nada/aqui”');
    expect(screen.getByRole('heading', { level: 1, name: 'Lab de teste' })).toBeInTheDocument();
  });

  it('maps old paths of the first copy by the whole path, the last segment or the first', () => {
    const { unmount } = montar('/lab/antigo/fases');
    expect(onde()).toBe('/lab/decisoes/fases');
    unmount();
    montar('/lab/testes-de-ia/qualquer');
    expect(onde()).toBe('/lab/refs/ogre');
    expect(screen.queryByText(/Não existe página/)).toBeNull();
  });

  it('sends an old path to another lab when its target starts with /', () => {
    montar('/lab/mapa/cidade');
    expect(onde()).toBe('/fora');
  });

  it('turns the old hash routes into real routes, and #/inicio into the lab home', () => {
    const { unmount } = montar('/lab#/decisoes/jogo');
    expect(onde()).toBe('/lab/decisoes/jogo');
    unmount();
    montar('/lab#/inicio');
    expect(onde()).toBe('/lab/');
    expect(screen.queryByText(/Não existe página/)).toBeNull();
  });

  it('moves focus to the title when navigating', async () => {
    const user = userEvent.setup();
    montar('/lab/decisoes/agora');
    await user.click(within(menu()).getByRole('link', { name: 'Jogo embutido' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  });

  it('searches without accents, opens the first match on Enter and clears the search after navigating', async () => {
    const user = userEvent.setup();
    montar('/lab');
    const busca = within(menu()).getByRole('searchbox');
    await user.type(busca, 'AGUA');
    expect(within(menu()).getByRole('link', { name: 'Água' })).toBeVisible();
    expect(within(menu()).queryByRole('link', { name: 'Agora' })).toBeNull();
    await user.keyboard('{Enter}');
    expect(onde()).toBe('/lab/decisoes/fases/agua');
    expect(within(menu()).getByRole('searchbox')).toHaveValue('');
  });

  it('says so when nothing matches', async () => {
    const user = userEvent.setup();
    montar('/lab');
    await user.type(within(menu()).getByRole('searchbox'), 'zzz');
    expect(within(menu()).getByRole('status')).toHaveTextContent('Nenhuma página com esse nome.');
  });

  it('walks the menu with arrows and opens and closes groups with right and left', async () => {
    const user = userEvent.setup();
    montar('/lab/decisoes/agora');
    within(menu()).getByRole('searchbox').focus();
    await user.keyboard('{ArrowDown}');
    const decisoes = within(menu()).getByRole('button', { name: /Decisões/ });
    expect(decisoes).toHaveFocus();
    expect(decisoes).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowLeft}');
    expect(decisoes).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{ArrowDown}');
    const refs = within(menu()).getByRole('button', { name: /Referências/ });
    expect(refs).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(within(menu()).getByRole('link', { name: 'Tactics Ogre' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(within(menu()).getByRole('searchbox')).toHaveFocus();
  });

  it('runs the exit hook when leaving the page and when leaving the lab', async () => {
    const user = userEvent.setup();
    montar('/lab/decisoes/jogo');
    sair.mockClear();
    await user.click(within(menu()).getByRole('link', { name: 'Agora' }));
    expect(sair).toHaveBeenCalledTimes(1);
    await user.click(within(menu()).getByRole('link', { name: 'Jogo embutido' }));
    await user.click(screen.getByRole('link', { name: 'sair do lab' }));
    expect(screen.getByText('fora')).toBeInTheDocument();
    expect(sair).toHaveBeenCalledTimes(2);
  });

  it('does not run the exit hook while the reader stays on the page', async () => {
    const user = userEvent.setup();
    montar('/lab/decisoes/jogo');
    sair.mockClear();
    // typing re-renders the whole pattern, like every live board update does
    await user.type(within(menu()).getByRole('searchbox'), 'ag');
    expect(sair).not.toHaveBeenCalled();
  });

  it('redirects old links on entry and while the lab is already open', async () => {
    const user = userEvent.setup();
    const { unmount } = montar('/lab#/refs/ogre');
    expect(onde()).toBe('/lab/refs/ogre');
    await user.click(screen.getByRole('link', { name: 'link antigo' }));
    expect(onde()).toBe('/lab/decisoes/fases');
    expect(screen.getByRole('heading', { level: 1, name: 'Fases' })).toBeInTheDocument();
    unmount();
    montar('/lab#fases');
    expect(onde()).toBe('/lab/decisoes/fases');
  });

  it('keeps unknown hashes as in-page anchors', () => {
    montar('/lab/decisoes/agora#detalhe');
    act(() => {});
    expect(onde()).toBe('/lab/decisoes/agora#detalhe');
  });
});
