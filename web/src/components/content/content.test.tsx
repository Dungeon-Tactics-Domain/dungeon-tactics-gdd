import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Callout } from './Callout';
import { DataTable } from './DataTable';
import { Gallery } from './Gallery';
import { MDX_COMPONENTS } from './mdx';
import { Player } from './Player';
import { Stars } from './Stars';
import { YouTubeEmbed } from './YouTubeEmbed';

vi.mock('@/lib/recursos', () => ({ DECISOES_ATIVAS: true }));

// Node's own localStorage global shadows jsdom's in Vitest and has no methods, so each test brings its storage
function memoria() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe('Stars', () => {
  it('saves the rating, and clicking the same star clears it', async () => {
    const storage = memoria();
    vi.stubGlobal('localStorage', storage);
    render(<Stars chave="t:nota" rotulo="Faixa" />);
    await userEvent.click(screen.getByRole('button', { name: '3 de 5' }));
    expect(storage.getItem('t:nota')).toBe('3');
    expect(screen.getByRole('button', { name: '3 de 5' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '4 de 5' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: '3 de 5' }));
    expect(storage.getItem('t:nota')).toBeNull();
    expect(screen.getByText('Sem nota sua ainda.')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('works without storage (private tab)', async () => {
    const falha = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', { getItem: falha, setItem: falha, removeItem: falha });
    render(<Stars chave="t:nota" rotulo="Faixa" notaSessao={4} />);
    await userEvent.click(screen.getByRole('button', { name: '2 de 5' }));
    expect(screen.getByText(/Sua nota: 2 de 5/)).toHaveTextContent('Nota registrada pela sessão: 4 de 5.');
    vi.unstubAllGlobals();
  });
});

describe('Player', () => {
  it('never autoplays and says when the file is missing', () => {
    const { container } = render(<Player src="/content/x/faixa.ogg" titulo="Faixa" />);
    const audio = container.querySelector('audio')!;
    expect(audio).not.toHaveAttribute('autoplay');
    expect(audio).toHaveAttribute('controls');
    audio.dispatchEvent(new Event('error'));
    return vi.waitFor(() => expect(screen.getByText(/Áudio ainda não copiado/)).toBeInTheDocument());
  });
});

describe('YouTubeEmbed', () => {
  it('loads the nocookie player only after the click', async () => {
    const { container } = render(<YouTubeEmbed id="dQw4w9WgXcQ" titulo="Tema" />);
    expect(container.querySelector('iframe')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Carregar vídeo/ }));
    expect(container.querySelector('iframe')?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('refuses ids that are not YouTube ids', () => {
    const { container } = render(<YouTubeEmbed id="x/../../evil" titulo="Mau" />);
    expect(container.querySelector('iframe, button')).toBeNull();
    expect(screen.getByText(/id inválido/)).toBeInTheDocument();
  });
});

describe('Gallery', () => {
  it('opens the full image with its caption and closes with Escape, back on the thumbnail', async () => {
    render(<Gallery imagens={[{ src: '/content/x/a.png', alt: 'Uma árvore', legenda: 'Árvore 1' }]} />);
    const miniatura = screen.getByRole('button', { name: 'Ampliar: Árvore 1' });
    await userEvent.click(miniatura);
    expect(screen.getByRole('dialog', { name: 'Árvore 1' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(miniatura).toHaveFocus();
  });
});

describe('DataTable and Callout', () => {
  it('renders headers, rows and caption', () => {
    render(<DataTable colunas={['Peça', 'Triângulos']} linhas={[['Carroça D', 1422]]} legenda="Contagem" />);
    expect(screen.getByRole('columnheader', { name: 'Triângulos' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '1422' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Contagem' })).toBeInTheDocument();
  });

  it('renders a titled callout', () => {
    render(<Callout titulo="Veredito">texto</Callout>);
    expect(screen.getByRole('heading', { name: 'Veredito' })).toBeInTheDocument();
  });
});

describe('MDX links', () => {
  const A = MDX_COMPONENTS.a as ComponentType<{ href: string; children: string }>;
  it('keeps internal links in the router and opens external ones in a new tab', () => {
    render(
      <MemoryRouter>
        <A href="/modelos/carrocas/high">dentro</A>
        <A href="https://claude.ai/x">fora</A>
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'dentro' })).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'fora' })).toHaveAttribute('target', '_blank');
  });
});
