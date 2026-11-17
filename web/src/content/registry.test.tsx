import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Paginas } from '@/features/paginas/Paginas';
import type { Pagina } from '@/features/paginas/types';
import { LABS } from '@/lib/labs';
import { DECISOES_ATIVAS } from '@/lib/recursos';
import { CONTEUDO, montarLab } from './registry';
import type { Manifesto } from './types';

const texto = (t: string) => () => Promise.resolve({ default: () => <p>{t}</p> });

const MANIFESTO: Manifesto = {
  titulo: 'Lab falso',
  origem: { caminho: '/falso/', fonte: 'teste', copiadoEm: '2026-11-14T23:23:00-03:00' },
  grupos: [
    {
      id: 'g',
      titulo: 'Grupo',
      paginas: [
        { id: 'a', titulo: 'A' },
        { id: 'b', titulo: 'B', subpaginas: [{ id: 'c', titulo: 'C' }] },
        { id: 'sem', titulo: 'Sem texto' },
      ],
    },
  ],
};

function montar(sumario: ReturnType<typeof montarLab>['sumario'], rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/x/*" element={<Paginas sumario={sumario} base="/x" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('montarLab', () => {
  const mdx = {
    './x/inicio.mdx': texto('texto do início'),
    './x/g/a.mdx': texto('texto de A'),
    './x/g/b/c.mdx': texto('texto de C'),
    './x/g/perdida.mdx': texto('ninguém usa'),
    './outro/g/a.mdx': texto('de outro lab'),
  };
  const lab = montarLab('x', MANIFESTO, mdx);

  it('takes each page text from the .mdx file at its route, subpages one folder deeper', async () => {
    montar(lab.sumario, '/x/g/b/c');
    expect(await screen.findByText('texto de C')).toBeInTheDocument();
  });

  it('lists files no page uses and pages with no text, only for its own lab', () => {
    expect(lab.orfaos).toEqual(['./x/g/perdida.mdx']);
    expect(lab.vazias).toEqual(['g/sem']);
  });

  it('shows the home text and the link back to the old lab', async () => {
    montar(lab.sumario, '/x');
    expect(await screen.findByText('texto do início')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver no lab antigo/ })).toHaveAttribute(
      'href',
      'http://localhost:5190/falso/',
    );
  });

  it('hides that link on a public hostname', async () => {
    vi.stubGlobal('location', { hostname: 'dungeon-tactics-lab.fernandorffdev.com' });
    montar(lab.sumario, '/x');
    expect(await screen.findByText('texto do início')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver no lab antigo/ })).toBeNull();
    vi.unstubAllGlobals();
  });
});

// pages that only exist for the paused decision UI: the manifest hides them, so they are orphans on purpose
const PAUSADAS = DECISOES_ATIVAS ? [] : ['./narrativa/marcas/minhas.mdx', './narrativa/moodboard/quero.mdx'];

describe('registered labs', () => {
  it.each(Object.entries(CONTEUDO))('%s: matches a place in lib/labs.ts, no orphan files, no empty pages', (id, c) => {
    expect(LABS.map((l) => l.id)).toContain(id);
    expect(c.orfaos.filter((f) => !PAUSADAS.includes(f))).toEqual([]);
    expect(c.vazias).toEqual([]);
  });

  it('modelos keeps the old lab tree plus the KayKit bench: 8 groups, 27 pages', () => {
    const s = CONTEUDO.modelos!.sumario;
    expect(s.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'personagens:4',
      'animacoes:6',
      'kaykit:3',
      'sprites:2',
      'carrocas:4',
      'arvores:5',
      'estilos:2',
      'evals:1',
    ]);
  });

  // every page of every lab renders its MDX without a "missing" message from a component
  const paginas = Object.entries(CONTEUDO).flatMap(([id, c]) =>
    c.sumario.grupos.flatMap((g) =>
      g.paginas.flatMap((p: Pagina) => [
        [id, `${g.id}/${p.id}`, p] as const,
        ...(p.subpaginas ?? []).map((sp) => [id, `${g.id}/${p.id}/${sp.id}`, sp] as const),
      ]),
    ),
  );
  it.each(paginas)('%s/%s renders', async (_id, _rota, p) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(null, { status: 200 }))),
    );
    if (!p.conteudo) return;
    const { container } = render(<MemoryRouter>{p.conteudo()}</MemoryRouter>);
    await vi.waitFor(() => expect(container.textContent).not.toMatch(/^Carregando…$/));
    expect(container.textContent).not.toMatch(/\b(desconhecido|inválido):/);
    vi.unstubAllGlobals();
  });
});
