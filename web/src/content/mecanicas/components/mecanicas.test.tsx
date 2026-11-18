import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import manifesto from '../manifest';
import { Pedidos } from './Plano';
import { descida, PESO, TRAJETORIAS, turnosDe, vidaDe } from '../dados';
import equipamento from '../equipamento.json';
import fichas from '../fichas.json';
import habilidades from '../habilidades.json';
import itens from '../itens.json';
import { Habilidades, Itens } from './HabilidadesItens';

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
  it('keeps the old lab tree plus the descent and equipment groups: 6 groups and 71 pages and subpages', () => {
    expect(manifesto.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'decisoes:4',
      'descida:4',
      'equipamento:6',
      'regras:11',
      'sensacao:6',
      'referencias:10',
    ]);
    const n = manifesto.grupos.flatMap((g) => g.paginas.flatMap((p) => [p, ...(p.subpaginas ?? [])])).length;
    expect(n).toBe(71);
    expect((manifesto.linksAntigos as Record<string, string>)._geral).toBe('referencias/geral');
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
  it('keeps the 6 decisions of the weight grill plus the 7 game-feel ones of 16/11, each with its origin', () => {
    expect(PESO).toHaveLength(13);
    for (const r of PESO)
      expect(r.origem).toMatch(
        /grill do peso de 15\/11 com o Fernando|grill da sessão Mecânicas de 16\/11 com o Fernando/,
      );
  });
});

describe('decisions of 16/11', () => {
  it('has the Colosso at 680 and no pending-decision marker left', () => {
    expect(equipamento.inimigos.find((c) => c.nome === 'Colosso de Ossos')?.vida).toBe(680);
    const textos = import.meta.glob('../**/*.{json,mdx}', { query: '?raw', import: 'default', eager: true });
    expect(Object.keys(textos).length).toBeGreaterThan(20);
    for (const [arq, t] of Object.entries(textos))
      expect(String(t).toLowerCase(), arq).not.toContain('decisão pendente do fernando (16/11)');
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
