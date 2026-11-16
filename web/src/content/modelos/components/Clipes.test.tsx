import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lerMapa, lerSequencias } from './Clipes';
import { KayKit, type ListaDeClipes } from './KayKit';

const LISTA: ListaDeClipes = {
  jogo: [
    { name: 'Idle', dur: 1 },
    { name: 'Walking_A', dur: 2 },
  ],
  pacote: [{ categoria: 'Tools', clipes: [{ name: 'Chop', dur: 1.5 }] }],
};

let guardado: Map<string, string>;
// Node's own localStorage global shadows jsdom's in Vitest and has no methods, so each test brings its storage
beforeEach(() => {
  guardado = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => guardado.get(k) ?? null,
    setItem: (k: string, v: string) => void guardado.set(k, v),
    removeItem: (k: string) => void guardado.delete(k),
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json(LISTA))),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const iframe = () => screen.getByTitle('Personagem KayKit 3D');
const anim = () => new URL(iframe().getAttribute('src')!).searchParams.get('anim');

describe('clip tools', () => {
  it('searches clips ignoring accents and case, and keeps favourites', async () => {
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');
    await userEvent.type(screen.getByRole('searchbox'), 'CHOP');
    const resultados = screen.getByRole('group', { name: 'Resultados da busca' });
    await userEvent.click(within(resultados).getByRole('button', { name: 'Chop' }));
    expect(anim()).toBe('Tools/Chop');

    await userEvent.click(screen.getByRole('button', { name: '☆ Favoritar o clipe tocando' }));
    expect(JSON.parse(guardado.get('modelos:favoritos:kaykit')!)).toEqual(['Tools/Chop']);
    await userEvent.clear(screen.getByRole('searchbox'));
    expect(within(screen.getByRole('group', { name: 'Favoritos' })).getByRole('button', { name: 'Chop' })).toBeTruthy();
  });

  it('assigns the playing clip to a game action per character, plays it back and exports the map', async () => {
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');
    await userEvent.click(screen.getByRole('button', { name: 'Walking A' }));
    await userEvent.click(screen.getByRole('button', { name: 'Usar o clipe tocando em Andar' }));
    expect(JSON.parse(guardado.get('modelos:acoes')!)).toEqual({ knight: { andar: 'Walking_A' } });

    await userEvent.click(screen.getByRole('button', { name: 'Idle' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tocar Andar: Walking A' }));
    expect(anim()).toBe('Walking_A');

    // another character has its own map
    await userEvent.click(screen.getByRole('button', { name: 'Esqueleto mago' }));
    expect(screen.queryByRole('button', { name: /^Tocar Andar/ })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Exportar e copiar' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Copiado|selecionado/);
    expect(JSON.parse((screen.getByLabelText('Mapa de ações em JSON') as HTMLTextAreaElement).value)).toEqual({
      knight: { andar: 'Walking_A' },
    });
  });

  it('imports a pasted map and refuses broken JSON', async () => {
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');
    const campo = screen.getByLabelText('Mapa de ações em JSON');
    fireEvent.change(campo, { target: { value: '{"knight": {"morte": "General/Death_A", "voar": "x"}}' } });
    await userEvent.click(screen.getByRole('button', { name: 'Importar o JSON colado' }));
    expect(screen.getByRole('status')).toHaveTextContent('Importado: 1 personagem.');
    expect(screen.getByRole('button', { name: 'Tocar Morte: Death A' })).toBeInTheDocument();
    fireEvent.change(campo, { target: { value: '{quebrado' } });
    await userEvent.click(screen.getByRole('button', { name: 'Importar o JSON colado' }));
    expect(screen.getByRole('status')).toHaveTextContent('Não é um JSON válido');
  });

  it('plays a sequence in order, one step per clip length after each load, and saves it by name', async () => {
    render(<KayKit />);
    await screen.findByTitle('Personagem KayKit 3D');
    await userEvent.click(screen.getByRole('button', { name: 'Walking A' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar o clipe tocando' }));
    await userEvent.click(screen.getByRole('button', { name: 'Idle' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar o clipe tocando' }));
    await userEvent.click(screen.getByRole('button', { name: '+ Adicionar o clipe tocando' }));
    await userEvent.type(screen.getByLabelText('Nome da sequência'), 'andar e parar');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(JSON.parse(guardado.get('modelos:sequencias')!)).toEqual([
      { nome: 'andar e parar', clipes: ['Walking_A', 'Idle', 'Idle'] },
    ]);

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole('button', { name: '▶ Tocar a sequência' }));
    expect(anim()).toBe('Walking_A');
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
    fireEvent.load(iframe());
    act(() => vi.advanceTimersByTime(3400)); // 2 s clip + 1.5 s of loading: not yet
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.getByText('Passo 2 de 3')).toBeInTheDocument();
    expect(anim()).toBe('Idle');
    // the same clip twice still restarts: the iframe is a new one per step
    const antes = iframe();
    fireEvent.load(antes);
    act(() => vi.advanceTimersByTime(2500));
    expect(iframe()).not.toBe(antes);
    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument();
    fireEvent.load(iframe());
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.queryByText(/Passo/)).toBeNull();
    expect(anim()).toBe('Idle');
  });

  it('rebuilds stored maps and sequences field by field', () => {
    expect(lerMapa({ a: { parado: 'Idle', voar: 'x', morte: 3 }, b: 'x', c: { pulo: '' } })).toEqual({
      a: { parado: 'Idle' },
    });
    expect(lerMapa([1])).toEqual({});
    expect(
      lerSequencias([{ nome: ' s ', clipes: ['Idle', 2] }, { nome: '', clipes: ['Idle'] }, { nome: 'v' }]),
    ).toEqual([{ nome: 's', clipes: ['Idle'] }]);
  });
});
