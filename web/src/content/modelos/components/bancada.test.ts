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

  it('is the local bench on 127.0.0.1 too, on that same address', async () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1' });
    const { BANCADA, EM_LOCALHOST } = await import('./bancada');
    expect(BANCADA).toBe('http://127.0.0.1:5205');
    expect(EM_LOCALHOST).toBe(true);
  });

  it('is the tunnel anywhere else', async () => {
    vi.stubGlobal('location', { hostname: 'labs.fernandorffdev.com' });
    const { BANCADA, BENCH } = await import('./bancada');
    expect(BANCADA).toBe('https://dungeon-bancada.fernandorffdev.com');
    expect(BENCH).toBe('https://dungeon-bancada.fernandorffdev.com/eval.html');
  });
});
