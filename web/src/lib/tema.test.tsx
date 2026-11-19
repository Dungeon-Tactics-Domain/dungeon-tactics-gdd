import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeletorTema } from '@/components/layout/TopBar';

const tema = () => document.documentElement.dataset.theme;

describe('theme switch', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    // a fresh in-memory storage per test (the runner's own localStorage is not a full Storage)
    const dados = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => dados.get(k) ?? null,
      setItem: (k: string, v: string) => void dados.set(k, v),
      removeItem: (k: string) => void dados.delete(k),
    });
  });

  it('walks system, light, dark and back, setting data-theme and keeping the choice', async () => {
    render(<SeletorTema />);
    expect(tema()).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: /^Tema do sistema/ }));
    expect(tema()).toBe('light');
    expect(localStorage.getItem('casca:tema')).toBe('light');

    fireEvent.click(await screen.findByRole('button', { name: /^Tema claro/ }));
    expect(tema()).toBe('dark');
    expect(localStorage.getItem('casca:tema')).toBe('dark');

    fireEvent.click(await screen.findByRole('button', { name: /^Tema escuro/ }));
    expect(tema()).toBeUndefined();
    expect(localStorage.getItem('casca:tema')).toBeNull();
    expect(await screen.findByRole('button', { name: /^Tema do sistema/ })).toBeInTheDocument();
  });

  it('shows a choice applied before React started (the inline script of index.html)', () => {
    document.documentElement.dataset.theme = 'dark';
    render(<SeletorTema />);
    expect(screen.getByRole('button', { name: /^Tema escuro/ })).toBeInTheDocument();
  });

  it('still switches when the browser refuses storage', () => {
    const falha = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('localStorage', { getItem: falha, setItem: falha, removeItem: falha });
    render(<SeletorTema />);
    fireEvent.click(screen.getByRole('button', { name: /^Tema do sistema/ }));
    expect(tema()).toBe('light');
  });

  it('index.html reads the same key and index.css keeps its two dark blocks equal', async () => {
    const { readFileSync } = await vi.importActual<{ readFileSync: (arquivo: string, c: 'utf8') => string }>('node:fs');
    expect(readFileSync('index.html', 'utf8')).toContain("localStorage.getItem('casca:tema')");
    const css = readFileSync('src/index.css', 'utf8');
    const linhas = (bloco: string | undefined) =>
      bloco
        ?.split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    const peloSistema = /:root:not\(\[data-theme='light'\]\) \{([^}]+)\}/.exec(css)?.[1];
    const peloBotao = /:root\[data-theme='dark'\] \{([^}]+)\}/.exec(css)?.[1];
    expect(linhas(peloSistema)?.length).toBeGreaterThan(20);
    expect(linhas(peloSistema)).toEqual(linhas(peloBotao));
  });
});
