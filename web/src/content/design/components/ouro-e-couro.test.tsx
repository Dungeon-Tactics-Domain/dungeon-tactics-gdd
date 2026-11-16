import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { contraste, cor, CORES, FAIXAS_TOKENS, MAPA, PARES, tokensEm } from '../ouro-e-couro';
import { OuroECouro } from './OuroECouro';
import { FAIXAS } from './Responsivo';

// Vitest turns every .css import into an empty string (test.css is off), ?raw included: read the real file instead
vi.mock('../ouro-e-couro.tokens.css?raw', async () => {
  const fs = await vi.importActual<{ readFileSync: (arquivo: string, codificacao: 'utf8') => string }>('node:fs');
  return { default: fs.readFileSync('src/content/design/ouro-e-couro.tokens.css', 'utf8') };
});

describe('ouro e couro tokens', () => {
  it('computes WCAG contrast and every pair of the page reaches its minimum', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contraste('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    const falhas = PARES.filter(([f, b, m]) => contraste(cor(f), cor(b)) < m).map(([f, b]) => `${f}/${b}`);
    expect(falhas).toEqual([]);
  });

  it('reads the colours from the tokens file, aliases resolved, and scopes it without leaking :root or @theme', () => {
    expect(CORES.borda).toBe(CORES.ouro);
    expect(Object.values(CORES).every((h) => /^#[0-9a-f]{6}$/.test(h))).toBe(true);
    const escopo = tokensEm('.oc');
    expect(escopo).not.toMatch(/:root|@theme/);
    expect(escopo).toContain('.oc :focus-visible');
  });

  it('keeps the band sizes of the responsive redesign and maps every colour of src/index.css', () => {
    expect(FAIXAS_TOKENS).toEqual(
      FAIXAS.map((f) => ({
        texto: f.base,
        h1: f.h1,
        h2: f.h2,
        h3: f.h3,
        legenda: f.legenda,
        margem: f.margem,
        respiro: f.espaco,
      })),
    );
    const atuais =
      'tinta papel mar terra cortica bilhete folha traco borda apagado sobre-tinta run call wait idle warn warn-soft stop stop-soft subs';
    expect(atuais.split(' ').filter((t) => !MAPA.some(([a]) => a.startsWith(`${t} `)))).toEqual([]);
  });

  it('renders every section', () => {
    render(<OuroECouro />);
    expect(screen.getAllByRole('heading', { level: 2, name: /^\d\. / })).toHaveLength(8);
    expect(screen.getByRole('button', { name: 'Desligado' })).toHaveAttribute('aria-disabled', 'true');
  });
});
