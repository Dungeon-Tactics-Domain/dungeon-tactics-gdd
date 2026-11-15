import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('BANCADA', () => {
  it('is the local bench on localhost', async () => {
    const { BANCADA } = await import('./bancada');
    expect(BANCADA).toBe('http://localhost:5205');
  });

  it('is the tunnel anywhere else', async () => {
    vi.stubGlobal('location', { hostname: 'labs.fernandorffdev.com' });
    const { BANCADA, BENCH } = await import('./bancada');
    expect(BANCADA).toBe('https://dungeon-bancada.fernandorffdev.com');
    expect(BENCH).toBe('https://dungeon-bancada.fernandorffdev.com/eval.html');
  });
});
