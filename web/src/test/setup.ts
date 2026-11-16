import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(cleanup);

// jsdom has no matchMedia; desktop by default, tests that need the phone layout override it
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Vitest turns every .css import into an empty string (test.css is off), ?raw included: read the real tokens file instead
vi.mock('../content/design/ouro-e-couro.tokens.css?raw', async () => {
  const fs = await vi.importActual<{ readFileSync: (arquivo: string, codificacao: 'utf8') => string }>('node:fs');
  return { default: fs.readFileSync('src/content/design/ouro-e-couro.tokens.css', 'utf8') };
});
