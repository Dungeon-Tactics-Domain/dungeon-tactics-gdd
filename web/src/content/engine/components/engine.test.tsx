import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONTEUDO } from '../../registry';
import { CenaMotores, godotUrl } from './CenaMotores';
import { gerarCidade } from './nucleo';
import { TOTAL, TOTAL_SEM_MIGRACAO } from './Painel';
import { lerParams, paraBusca, passo } from './parametros';

afterEach(() => vi.unstubAllGlobals());

describe('engine lab', () => {
  it('recomputes the matrix totals of the decision (62 x 60,8; without migration 66,7 x 56,4)', () => {
    expect(TOTAL).toEqual({ godot: 62, threejs: 60.8 });
    expect(TOTAL_SEM_MIGRACAO).toEqual({ godot: 66.7, threejs: 56.4 });
  });

  it('has the decision, the measurements and the four live scenes', () => {
    const s = CONTEUDO.engine!.sumario;
    expect(s.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual(['decisao:5', 'medicoes:6', 'cenas:4']);
  });

  it('draws the same city as the Godot bench (signature of banco-threejs/nucleo.js)', () => {
    const sig = (luzes: number) => gerarCidade({ mapa: 64, predios: 200, luzes, seed: 1 }).assinatura;
    expect([sig(0), sig(4), sig(16)]).toEqual([524306495, 2247875618, 2685668845]);
  });
});

describe('scene parameters (contract)', () => {
  it('reads defaults, rejects values out of range with a warning and maps FogVolume to the raymarch', () => {
    expect(lerParams('fisica', new URLSearchParams()).p.qtd).toBe(1000);
    const r = lerParams('fisica', new URLSearchParams('qtd=7'));
    expect(r.p.qtd).toBe(1000);
    expect(r.avisos[0]).toMatch(/qtd=7/);
    const n = lerParams('nevoa', new URLSearchParams('modo=3'));
    expect(n.p.modo).toBe(2);
    expect(n.avisos[0]).toMatch(/FogVolume/);
  });

  it('builds the same query string for both sides and steps the main parameter', () => {
    const { p } = lerParams('sombras', new URLSearchParams('luzes=16'));
    expect(paraBusca('sombras', p).toString()).toBe('luzes=16&otimizado=1&sombras=1');
    expect(godotUrl('sombras', p)).toBe('/content/engine/godot/index.html?cena=sombras&luzes=16&otimizado=1&sombras=1');
    expect(passo('sombras', p, 1).luzes).toBe(16);
    expect(passo('sombras', p, -1).luzes).toBe(4);
  });
});

describe('CenaMotores', () => {
  it('loads nothing before "Rodar", shows the three fps numbers, then says the Godot export is missing', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } })),
    );
    vi.stubGlobal('fetch', fetch);
    render(
      <MemoryRouter initialEntries={['/engine/cenas/fisica']}>
        <CenaMotores cena="fisica" />
      </MemoryRouter>,
    );
    expect(screen.getByText('Three.js no navegador')).toBeInTheDocument();
    expect(screen.getByText('Godot nativo')).toBeInTheDocument();
    expect(screen.getAllByText('não medido')).toHaveLength(3);
    expect(screen.getByText('1 rodada, PC em uso, ruído alto')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole('img', { name: /no Three.js/ })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Rodar a cena Física' }));
    expect(await screen.findByText(/Godot ainda exportando/)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/content/engine/godot/fisica.pck', { method: 'HEAD' });
    expect(screen.getByRole('img', { name: 'Cena Física no Three.js' })).toBeInTheDocument();
  });
});
