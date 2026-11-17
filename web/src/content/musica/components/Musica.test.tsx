import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checagens, EstudioMusicas, FaixaMusica, Referencias, Texto } from './Musica';

vi.mock('@/lib/recursos', () => ({ DECISOES_ATIVAS: true }));

describe('music lab', () => {
  it('renders the old markdown as text: lists, bold and code, never HTML', () => {
    const { container } = render(<Texto texto={'**Forte** e `<slot_A.mid>` ~80-90\n\n- um\n- dois'} />);
    expect(container.querySelector('strong')).toHaveTextContent('Forte');
    expect(container.querySelector('code')).toHaveTextContent('<slot_A.mid>');
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('shows a track with its sections inside the studio, with no rating', () => {
    render(<FaixaMusica pagina="batalha" faixa="batalha-c" />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Quem fez',
      'Resumo',
      'Forma e instrumentos',
      'Crítica',
      'Como regenerar',
      'Mudança do trompete',
    ]);
    expect(screen.queryByRole('button', { name: /de 5/ })).toBeNull();
  });

  it('keeps the plain audio player for a track without stems', () => {
    render(<FaixaMusica pagina="trisection" faixa="ref-trisection" />);
    expect(screen.getByLabelText(/^Ouvir /)).toHaveAttribute('src', '/content/musica/audio/ref_trisection.ogg');
  });

  it('says so for an unknown track', () => {
    render(<FaixaMusica pagina="batalha" faixa="nada" />);
    expect(screen.getByText(/Faixa desconhecida/)).toBeInTheDocument();
  });

  it('lists references (video on click, plain link otherwise) and checks', () => {
    render(
      <>
        <Referencias pagina="batalha" />
        <Checagens pagina="batalha" />
      </>,
    );
    expect(screen.getAllByRole('button', { name: /Carregar vídeo/ })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /busca por outras faixas/ })).toHaveAttribute('target', '_blank');
    expect(screen.getAllByText('○ Pendente')).toHaveLength(3);
    expect(screen.getAllByText('✓ Feito')).toHaveLength(4);
  });

  it('lists every piece in one studio and filters it by category and search', () => {
    render(<EstudioMusicas />);
    const lista = screen.getByRole('complementary', { name: /Lista de músicas/ });
    const itens = () =>
      within(lista)
        .getAllByRole('button')
        .filter((b) => b.hasAttribute('aria-current'));
    const todas = itens().length;
    expect(todas).toBeGreaterThan(30);
    fireEvent.click(within(lista).getByRole('button', { name: /Jingles/ }));
    expect(itens()).toHaveLength(18);
    fireEvent.click(within(lista).getByRole('button', { name: /Todas/ }));
    fireEvent.change(within(lista).getByRole('searchbox'), { target: { value: 'chefe' } });
    expect(itens().length).toBeGreaterThan(0);
    expect(itens().length).toBeLessThan(todas);
  });
});
