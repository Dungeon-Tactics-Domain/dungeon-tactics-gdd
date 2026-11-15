import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import manifesto from '../manifest';
import { Cena } from './Cena';
import { sceneUrl, type Spec } from './cena-url';
import { Pedidos } from './Plano';
import { descida, turnosDe, vidaDe } from '../dados';

const G = 'http://localhost:5291';
// arena-wall.json as served by the game bench on 14/11; the expected URLs came from the old lab's sceneUrl
const ARENA_WALL: Spec = {
  name: 'arena-wall',
  scenario: 'arena',
  seed: 1,
  units: { 'a-hero': { x: 9, y: 4, facing: 1 }, 'a-foe': { x: 10, y: 4, facing: 3 } },
  camera: { fixed: 'side', zoom: 3.5, focus: { x: 10, y: 4 } },
  hide: ['all'],
  loop: true,
  steps: [{ act: { unit: 'a-hero', ability: 'shield_bash', target: { x: 10, y: 4 } } }],
};

// Node's own localStorage global shadows jsdom's in Vitest and has no methods, so each test brings its storage
const guardado = new Map<string, string>();
beforeEach(() => {
  guardado.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => guardado.set(k, v),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('mecanicas manifest', () => {
  it('keeps the old lab tree plus the descent group: 6 groups and 79 pages and subpages', () => {
    expect(manifesto.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'decisoes:4',
      'descida:4',
      'clipes:4',
      'regras:8',
      'sensacao:5',
      'referencias:10',
    ]);
    const n = manifesto.grupos.flatMap((g) => g.paginas.flatMap((p) => [p, ...(p.subpaginas ?? [])])).length;
    expect(n).toBe(79);
    expect((manifesto.linksAntigos as Record<string, string>)['cena-walk']).toBe('clipes/movimento/walk');
    expect((manifesto.linksAntigos as Record<string, string>)._geral).toBe('referencias/geral');
  });
});

describe('sceneUrl', () => {
  it('matches the old lab URLs', () => {
    expect(sceneUrl(G, 'arena-wall', ARENA_WALL, { bare: true, speed: 1, camera: 'side' })).toBe(
      `${G}/?scenario=arena&extension=none&sandbox=bench/arena-wall.json`,
    );
    expect(sceneUrl(G, 'arena-wall', ARENA_WALL, { bare: false, speed: 2, camera: 'three-quarter' })).toBe(
      `${G}/?scenario=arena&extension=none&sandbox=eyJuYW1lIjoiYXJlbmEtd2FsbCIsInNjZW5hcmlvIjoiYXJlbmEiLCJzZWVkIjoxLCJ1bml0cyI6eyJhLWhlcm8iOnsieCI6OSwieSI6NCwiZmFjaW5nIjoxfSwiYS1mb2UiOnsieCI6MTAsInkiOjQsImZhY2luZyI6M319LCJjYW1lcmEiOnsiem9vbSI6My41LCJmb2N1cyI6eyJ4IjoxMCwieSI6NH0sImZpeGVkIjoidGhyZWUtcXVhcnRlciJ9LCJoaWRlIjpbImZwcyIsInRvb2xzIiwiaGVscCJdLCJsb29wIjp0cnVlLCJzdGVwcyI6W3siYWN0Ijp7InVuaXQiOiJhLWhlcm8iLCJhYmlsaXR5Ijoic2hpZWxkX2Jhc2giLCJ0YXJnZXQiOnsieCI6MTAsInkiOjR9fX1dLCJzcGVlZCI6Mn0`,
    );
    expect(sceneUrl(G, 'arena-wall', ARENA_WALL, { bare: true, speed: 1, camera: 'acao' })).toBe(
      `${G}/?scenario=arena&extension=none&sandbox=eyJuYW1lIjoiYXJlbmEtd2FsbCIsInNjZW5hcmlvIjoiYXJlbmEiLCJzZWVkIjoxLCJ1bml0cyI6eyJhLWhlcm8iOnsieCI6OSwieSI6NCwiZmFjaW5nIjoxfSwiYS1mb2UiOnsieCI6MTAsInkiOjQsImZhY2luZyI6M319LCJjYW1lcmEiOnsiem9vbSI6My41LCJmb2N1cyI6eyJ4IjoxMCwieSI6NH19LCJoaWRlIjpbImFsbCJdLCJsb29wIjp0cnVlLCJzdGVwcyI6W3siYWN0Ijp7InVuaXQiOiJhLWhlcm8iLCJhYmlsaXR5Ijoic2hpZWxkX2Jhc2giLCJ0YXJnZXQiOnsieCI6MTAsInkiOjR9fX1dfQ`,
    );
  });
});

describe('Cena', () => {
  it('never starts by itself; Ver ao vivo loads one iframe and Parar removes it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(ARENA_WALL)))),
    );
    const { container } = render(<Cena nome="arena-wall" />);
    expect(container.querySelector('iframe')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Ver ao vivo' }));
    const iframe = await screen.findByTitle('Escudada contra a parede, hoje');
    expect(iframe).toHaveAttribute('src', `${G}/?scenario=arena&extension=none&sandbox=bench/arena-wall.json`);
    await userEvent.click(screen.getByRole('button', { name: '2x' }));
    expect(screen.getByTitle('Escudada contra a parede, hoje').getAttribute('src')).toContain('&sandbox=eyJ');
    await userEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(screen.getByRole('button', { name: 'Pausar' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('button', { name: 'Pausar' })).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: 'Parar' }));
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('warns when the game bench does not answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('down'))),
    );
    render(<Cena nome="walk" />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver ao vivo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('O jogo não está rodando em localhost:5291');
  });

  it('remembers "Só a animação" in the browser', async () => {
    render(<Cena nome="walk" />);
    await userEvent.click(screen.getByRole('button', { name: 'Só a animação' }));
    expect(guardado.get('mecanicas:so-animacao')).toBe('0');
    expect(screen.getByRole('button', { name: 'Só a animação' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('Pedidos', () => {
  it('splits open and done requests like the old lab (6 open, 11 done)', () => {
    const { unmount } = render(<Pedidos />);
    expect(screen.getAllByRole('row')).toHaveLength(7);
    unmount();
    render(<Pedidos feitos />);
    expect(screen.getAllByRole('row')).toHaveLength(12);
  });
});

describe('descida', () => {
  it('keeps every room in the 5 to 8 hero-turn target and the boss in 12 to 18', () => {
    const { turnosSala: sala, turnosChefe: chefe } = descida.ritmo;
    for (const s of descida.salas) {
      const t = turnosDe(vidaDe(s.inimigos));
      expect(t >= sala.min && t <= sala.max, `${s.nome}: ${t}`).toBe(true);
    }
    const t = turnosDe(vidaDe(descida.chefeInimigos));
    expect(t >= chefe.min && t <= chefe.max, `chefe: ${t}`).toBe(true);
  });
});
