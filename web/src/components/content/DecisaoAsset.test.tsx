import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DecisaoAsset } from './DecisaoAsset';

const salva = {
  id: 'modelos/carrocas-high/D',
  lab: 'modelos',
  escolha: 'talvez',
  nota: 'rodas tortas',
  atualizadoEm: '2026-11-15T10:00:00-03:00',
};

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('DecisaoAsset', () => {
  it('shows the saved decision and saves a new choice with the note', async () => {
    const fetch = vi.fn((_url: string, init?: RequestInit) =>
      init?.method === 'PUT'
        ? json({ ...salva, ...JSON.parse(String(init.body)), atualizadoEm: '2026-11-15T11:00:00-03:00' })
        : json([{ ...salva, id: 'musica/a' }, salva]),
    );
    vi.stubGlobal('fetch', fetch);
    render(<DecisaoAsset id="modelos/carrocas-high/D" rotulo="Carroça 1" />);

    expect(await screen.findByRole('button', { name: 'Talvez' })).toHaveAttribute('aria-pressed', 'true');
    const nota = screen.getByRole('textbox', { name: 'Nota sobre Carroça 1' });
    expect(nota).toHaveValue('rodas tortas');

    await userEvent.clear(nota);
    await userEvent.type(nota, 'refazer as rodas');
    await userEvent.click(screen.getByRole('button', { name: 'Refazer' }));

    const [url, init] = fetch.mock.calls.at(-1)!;
    expect(url).toBe('/api/decisoes/modelos/carrocas-high/D');
    expect(JSON.parse(String(init!.body))).toEqual({ lab: 'modelos', escolha: 'refazer', nota: 'refazer as rodas' });
    expect(await screen.findByText(/^Salvo às/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refazer' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the note and shows the server message when saving fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        init?.method === 'PUT' ? Promise.resolve(new Response('nota longa demais', { status: 400 })) : json([]),
      ),
    );
    render(<DecisaoAsset id="musica/batalha-c" rotulo="Batalha · C" />);
    expect(await screen.findByText('Sem decisão ainda.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar nota' })).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), 'texto');
    await userEvent.click(screen.getByRole('button', { name: 'Usar' }));
    expect(await screen.findByText('Não salvou: nota longa demais')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('texto');
  });

  it('turns itself off when the server has no decisions API (old server answers index.html)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<!doctype html>', { status: 200 }))),
    );
    render(<DecisaoAsset id="musica/batalha-c" rotulo="Batalha · C" />);
    expect(await screen.findByText(/Decisões fora do ar/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Usar' })).toBeDisabled();
  });
});
