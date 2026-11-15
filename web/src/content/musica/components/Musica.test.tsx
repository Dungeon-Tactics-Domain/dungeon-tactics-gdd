import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checagens, FaixaMusica, Referencias, Texto } from './Musica';

vi.mock('@/lib/recursos', () => ({ DECISOES_ATIVAS: true }));

describe('music lab', () => {
  it('renders the old markdown as text: lists, bold and code, never HTML', () => {
    const { container } = render(<Texto texto={'**Forte** e `<slot_A.mid>` ~80-90\n\n- um\n- dois'} />);
    expect(container.querySelector('strong')).toHaveTextContent('Forte');
    expect(container.querySelector('code')).toHaveTextContent('<slot_A.mid>');
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('shows a track with its audio and its sections inside the "about" panel, with no rating', () => {
    render(<FaixaMusica pagina="batalha" faixa="batalha-c" />);
    expect(screen.getByText('Sobre esta faixa')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
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
});
