import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checagens, FaixaMusica, Referencias, Texto } from './Musica';

describe('music lab', () => {
  it('renders the old markdown as text: lists, bold and code, never HTML', () => {
    const { container } = render(<Texto texto={'**Forte** e `<slot_A.mid>` ~80-90\n\n- um\n- dois'} />);
    expect(container.querySelector('strong')).toHaveTextContent('Forte');
    expect(container.querySelector('code')).toHaveTextContent('<slot_A.mid>');
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('shows a track with its audio, sections and stars under the old key', async () => {
    // Node's localStorage global has no methods in Vitest: a map stands in
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    });
    render(<FaixaMusica pagina="batalha" faixa="batalha-c" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('CBatalha · C');
    expect(screen.getByLabelText('Ouvir Batalha · C')).toHaveAttribute('src', '/content/musica/audio/batalha_C.ogg');
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Resumo',
      'Forma e instrumentos',
      'Crítica',
      'Como regenerar',
    ]);
    await userEvent.click(screen.getByRole('button', { name: '4 de 5' }));
    expect(m.get('musica:nota:batalha-c')).toBe('4');
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
