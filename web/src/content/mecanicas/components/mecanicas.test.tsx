import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import manifesto from '../manifest';
import { Cena } from './Cena';
import { sceneUrl, type Spec } from './cena-url';
import { Pedidos } from './Plano';
import { descida, PESO, TRAJETORIAS, turnosDe, vidaDe } from '../dados';
import equipamento from '../equipamento.json';
import fichas from '../fichas.json';
import habilidades from '../habilidades.json';
import itens from '../itens.json';
import { Habilidades, Itens } from './HabilidadesItens';

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
  it('keeps the old lab tree plus the descent and equipment groups: 7 groups and 89 pages and subpages', () => {
    expect(manifesto.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'decisoes:4',
      'descida:4',
      'equipamento:6',
      'clipes:4',
      'regras:11',
      'sensacao:6',
      'referencias:10',
    ]);
    const n = manifesto.grupos.flatMap((g) => g.paginas.flatMap((p) => [p, ...(p.subpaginas ?? [])])).length;
    expect(n).toBe(89);
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
  it('splits open and done requests like the old lab (6 open, 14 done)', () => {
    const { unmount } = render(<Pedidos />);
    expect(screen.getAllByRole('row')).toHaveLength(7);
    unmount();
    render(<Pedidos feitos />);
    expect(screen.getAllByRole('row')).toHaveLength(15);
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

describe('trajetorias', () => {
  it('keeps the 12 decisions of the trajectory grill, each with its origin, with no tile exception', () => {
    expect(TRAJETORIAS).toHaveLength(12);
    for (const r of TRAJETORIAS) expect(r.origem).toMatch(/grill de trajetórias de 15\/11|proposta do lab \(15\/11\)/);
    const regras = TRAJETORIAS.map((r) => r.regra);
    expect(regras).toContain('Bloqueio realista');
    expect(regras).not.toContain('Casas vizinhas na curva');
  });
});

describe('peso', () => {
  it('keeps the 6 decisions of the weight grill, each with its origin', () => {
    expect(PESO).toHaveLength(6);
    for (const r of PESO) expect(r.origem).toBe('grill do peso de 15/11 com o Fernando');
  });
});

describe('fichas.json', () => {
  it('has one sheet for every class and enemy of equipamento.json, in the right group', () => {
    const lab = [
      ...equipamento.classes.map((c) => `classe:${c.nome}`),
      ...equipamento.inimigos.map((c) => `inimigo:${c.nome}`),
    ];
    expect(fichas.fichas.map((f) => `${f.grupo}:${f.nome}`).sort()).toEqual(lab.sort());
    expect(fichas.fonte.commit).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe('habilidades.json and itens.json', () => {
  it('render one card per ability of the game, and every ability of every unit has one', () => {
    const { container } = render(<Habilidades />);
    const cartoes = [...container.querySelectorAll('article')].map((a) => a.id);
    expect(cartoes).toEqual(habilidades.habilidades.map((h) => h.id));
    for (const id of Object.values(habilidades.unidades).flat()) expect(cartoes).toContain(id);
    expect(habilidades.fonte.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it('match each ability of the lab table to one game ability', () => {
    for (const l of equipamento.habilidades) {
      const nome = l.habilidade.slice(0, l.habilidade.indexOf(' (')).toLowerCase();
      expect(
        habilidades.habilidades.filter((h) => h.nome.toLowerCase() === nome),
        l.habilidade,
      ).toHaveLength(1);
    }
  });

  it('render one card per game item and put every lab piece either in the game or in Só no lab', () => {
    const { container } = render(<Itens />);
    expect([...container.querySelectorAll('article')].map((a) => a.id)).toEqual(itens.itens.map((i) => i.id));
    const nomes = [...itens.itens.map((i) => i.nome), ...itens.soNoLab.map((p) => p.nome)];
    expect(nomes.sort()).toEqual(equipamento.pecas.map((p) => p.nome).sort());
  });

  it('filters by class chip and by search, and says so when nothing matches', async () => {
    const { container } = render(<Habilidades />);
    await userEvent.click(screen.getByRole('button', { name: 'Mago' }));
    expect(screen.getByRole('button', { name: 'Mago' })).toHaveAttribute('aria-pressed', 'true');
    const mago = habilidades.habilidades.filter((h) => h.quem.some((q) => q.nome === 'Mago'));
    expect(container.querySelectorAll('article')).toHaveLength(mago.length);
    await userEvent.click(screen.getByRole('button', { name: 'Todas' }));
    await userEvent.type(screen.getByLabelText('Buscar por nome ou por quem usa'), 'explosao');
    expect([...container.querySelectorAll('article')].map((a) => a.id)).toEqual(['blast']);
    await userEvent.type(screen.getByLabelText('Buscar por nome ou por quem usa'), 'zzz');
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(screen.getByText(/Nenhuma habilidade com esse nome/)).toBeInTheDocument();
  });
});
