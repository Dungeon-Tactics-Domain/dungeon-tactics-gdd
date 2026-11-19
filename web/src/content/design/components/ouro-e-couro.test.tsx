import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { contraste, CORES, misturar, PARES } from '../ouro-e-couro';
import { OuroECouro } from './OuroECouro';

describe('ouro e couro tokens', () => {
  it('computes WCAG contrast and every pair reaches its minimum in both themes', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    const falhas = (['claro', 'escuro'] as const).flatMap((t) =>
      PARES.filter(([f, b, m]) => contraste(CORES[t][f]!, CORES[t][b]!) < m).map(([f, b]) => `${t} ${f}/${b}`),
    );
    expect(falhas).toEqual([]);
  });

  it('reads both themes from src/index.css, aliases resolved, and the dark one turns the pairs over', () => {
    expect(CORES.claro.pergaminho).toBe('#e5e9f0');
    expect(CORES.escuro.pergaminho).toBe('#0f1624');
    expect(CORES.claro.borda).toBe(CORES.claro.ouro);
    expect(CORES.escuro.borda).toBe(CORES.escuro.ouro);
    for (const t of ['claro', 'escuro'] as const) {
      expect(Object.values(CORES[t]).every((h) => /^#[0-9a-f]{6}$/.test(h))).toBe(true);
    }
    expect(Object.keys(CORES.claro)).toEqual(Object.keys(CORES.escuro));
    expect(misturar('#000000', 0.45, '#ffffff')).toBe('#8c8c8c');
  });

  it('renders every section', () => {
    render(<OuroECouro />);
    expect(screen.getAllByRole('heading', { level: 2, name: /^\d\. / })).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Desligado' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens with an index that links to each of its 6 sections', () => {
    render(<OuroECouro />);
    const links = within(screen.getByRole('navigation', { name: 'Índice da página' })).getAllByRole('link');
    expect(links).toHaveLength(6);
    for (const a of links) {
      const alvo = document.getElementById(a.getAttribute('href')!.slice(1));
      expect(alvo?.tagName).toBe('H2');
      expect(alvo).toHaveTextContent(a.textContent!);
    }
  });
});
