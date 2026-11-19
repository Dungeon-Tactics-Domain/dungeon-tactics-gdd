import { act, fireEvent, render as montar, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeContext, fakeFetch } from '@/lib/player/fake-audio';
import { PlayerEngine } from '@/lib/player/PlayerEngine';
import type { Catalog, Song } from '@/lib/player/schema';
import {
  ALTURA_MAXIMA,
  ALTURA_MINIMA,
  CHAVE_ALTURA,
  CHAVE_ZOOM,
  FADE_NOTA,
  PASSO_ALTURA,
  PASSO_RODA,
} from './constantes';
import { ajusteEtiquetas, alturaNecessaria, escreverLink, lerLink, nomeDaNota, notasEm, passoNotas } from './hooks';
import { Mixer } from './Mixer';
import { PlayerApp } from './PlayerApp';
import { Transporte } from './Transporte';

// the app reads and writes the address, so it needs a router; `em` is the address the page opens at
const Busca = () => <span data-testid="busca">{useLocation().search}</span>;
const render = (ui: ReactElement, em = '/') =>
  montar(
    <MemoryRouter initialEntries={[em]}>
      {ui}
      <Busca />
    </MemoryRouter>,
  );

const musica = (id: string, title: string, category: string): Song => ({
  id,
  title,
  category,
  authorship: 'teste',
  channels: [{ channel: 0, program: 42, name: 'Cello' }],
  versions: [
    { id: 'a', label: 'Versão A', stemsBase: `/s/${id}_a`, midi: `/m/${id}.mid`, duration: 60 },
    { id: 'b', label: 'Versão B', stemsBase: `/s/${id}_b`, midi: `/m/${id}.mid`, duration: 60 },
  ],
  references: [{ label: 'Fonte', url: 'https://exemplo.com', study: true }],
  measurements: [],
  checks: [{ text: 'Ouvir', state: 'pending' }],
  story: 'Uma história.',
  storyDraft: true,
});
const catalogo: Catalog = {
  categories: [
    { id: 'batalha', label: 'Batalha', order: 1 },
    { id: 'cidade', label: 'Cidade', order: 2 },
  ],
  songs: [musica('m1', 'Marcha', 'batalha'), musica('m2', 'Brasas', 'batalha'), musica('c1', 'Praça', 'cidade')],
};

// no AudioContext in jsdom: only clicks (no pointerdown), so the engine is never created and the screens show the choice
describe('PlayerApp', () => {
  // jsdom has no canvas: the roll draws nothing, which is the case the drawing code already guards
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    // a fresh in-memory storage per test (the runner's own localStorage is not a full Storage)
    const m = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => m.set(k, v),
      removeItem: (k: string) => m.delete(k),
    });
  });

  it('changes the height from the handle with the keyboard and remembers it', () => {
    const { unmount } = render(<PlayerApp catalogo={catalogo} />);
    const alca = screen.getByRole('separator', { name: 'Altura do player' });
    const padrao = Number(alca.getAttribute('aria-valuenow'));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBeNull();
    fireEvent.keyDown(alca, { key: 'ArrowDown' });
    expect(alca).toHaveAttribute('aria-valuenow', String(padrao + PASSO_ALTURA));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBe(String(padrao + PASSO_ALTURA));
    fireEvent.keyDown(alca, { key: 'ArrowUp' });
    fireEvent.keyDown(alca, { key: 'ArrowUp' });
    expect(localStorage.getItem(CHAVE_ALTURA)).toBe(String(padrao - PASSO_ALTURA));
    // a new visit opens at the stored height
    unmount();
    render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', String(padrao - PASSO_ALTURA));
    // Home and a double click go back to the default and forget the choice
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Home' });
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', String(padrao));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBeNull();
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowDown' });
    fireEvent.doubleClick(screen.getByRole('separator'));
    expect(localStorage.getItem(CHAVE_ALTURA)).toBeNull();
  });

  it('ignores a stored height that is not a number', () => {
    localStorage.setItem(CHAVE_ALTURA, 'banana');
    render(<PlayerApp catalogo={catalogo} />);
    expect(Number(screen.getByRole('separator').getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(ALTURA_MINIMA);
  });

  it('caps the height at what shows every lane, with nothing empty under the last one', () => {
    // a 900 px box whose scrolling area shows 600 px of a 1648 px mixer: 300 px of fixed parts plus the content
    expect(alturaNecessaria(900, 600, 1648)).toBe(1948);
    // a box taller than its content shrinks to it; half a pixel rounds up so nothing is left to scroll
    expect(alturaNecessaria(1200, 900, 448.5)).toBe(749);
    // a short song still gets the minimum, and content that cannot be measured keeps the fixed ceiling
    expect(alturaNecessaria(400, 100, 20)).toBe(ALTURA_MINIMA);
    expect(alturaNecessaria(900, 0, 0)).toBe(ALTURA_MAXIMA);
  });

  it('names the notes sounding on each channel at an instant', () => {
    const notas = [
      { start: 1, end: 2, pitch: 60, channel: 0 },
      { start: 1, end: 2, pitch: 67, channel: 0 }, // a chord: every note, the highest first
      { start: 1.2, end: 2, pitch: 67, channel: 0 }, // the same pitch twice counts once
      { start: 2, end: 3, pitch: 62, channel: 0 },
      { start: 1.5, end: 4, pitch: 36, channel: 9 },
    ];
    expect(notasEm(notas, 0.5).size).toBe(0);
    expect(notasEm(notas, 1).get(0)).toEqual([67, 60]);
    expect(notasEm(notas, 1.5).get(0)).toEqual([67, 60]);
    // the end is not part of the note: at 2 s only the next one sounds
    expect(notasEm(notas, 2).get(0)).toEqual([62]);
    expect([...notasEm(notas, 3.5)]).toEqual([[9, [36]]]);
    expect(nomeDaNota(67)).toBe('Sol 4');
    expect(nomeDaNota(60)).toBe('Dó 4');
    expect(nomeDaNota(61)).toBe('Dó# 4');
  });

  it('keeps a note that stopped for the length of the fade, stamped once on the clock', () => {
    let lista = passoNotas([], [67, 60], 1000);
    expect(lista).toEqual([{ altura: 67 }, { altura: 60 }]);
    // 60 stops and 72 starts: 60 stays, marked with when it left; the highest is first
    lista = passoNotas(lista, [72, 67], 1100);
    expect(lista).toEqual([{ altura: 72 }, { altura: 67 }, { altura: 60, saiu: 1100 }]);
    // still fading a moment before the end, with the first stamp
    lista = passoNotas(lista, [72, 67], 1100 + FADE_NOTA - 1);
    expect(lista.at(-1)).toEqual({ altura: 60, saiu: 1100 });
    // a note that sounds again while fading loses its stamp
    expect(passoNotas(lista, [60], 1200).find((n) => n.altura === 60)).toEqual({ altura: 60 });
    // once the fade is over it is gone
    expect(passoNotas(lista, [72, 67], 1100 + FADE_NOTA)).toEqual([{ altura: 72 }, { altura: 67 }]);
    // nothing sounding: every label leaves together, then the list is empty
    lista = passoNotas([{ altura: 67 }], [], 5000);
    expect(lista).toEqual([{ altura: 67, saiu: 5000 }]);
    expect(passoNotas(lista, [], 5000 + FADE_NOTA)).toEqual([]);
  });

  it('shrinks the stacked labels to fit the strip, down to 11 px, then leaves the lowest out', () => {
    expect(ajusteEtiquetas(0)).toEqual({ fonte: 16, visiveis: 0 });
    expect(ajusteEtiquetas(1)).toEqual({ fonte: 16, visiveis: 1 });
    expect(ajusteEtiquetas(5)).toEqual({ fonte: 16, visiveis: 5 });
    expect(ajusteEtiquetas(6)).toEqual({ fonte: 13, visiveis: 6 });
    expect(ajusteEtiquetas(7)).toEqual({ fonte: 11, visiveis: 7 });
    expect(ajusteEtiquetas(12)).toEqual({ fonte: 11, visiveis: 7 });
    // whatever the count, the labels shown fit the 115 px inside the strip
    for (let n = 1; n <= 20; n++) {
      const { fonte, visiveis } = ajusteEtiquetas(n);
      expect(visiveis * (fonte * 1.2 + 2) + (visiveis - 1)).toBeLessThanOrEqual(115);
    }
  });

  it('reads the song and the version from a link and falls back when an id does not exist', () => {
    const ler = (q: string) => lerLink(catalogo, new URLSearchParams(q));
    expect(ler('musica=c1&som=b')).toEqual({ musica: catalogo.songs[2], versaoId: 'b' });
    expect(ler('musica=c1')).toEqual({ musica: catalogo.songs[2], versaoId: undefined });
    expect(ler('musica=c1&som=nada')).toEqual({ musica: catalogo.songs[2], versaoId: undefined });
    expect(ler('musica=nada&som=b')).toEqual({ musica: undefined, versaoId: undefined });
    expect(ler('som=b')).toEqual({ musica: undefined, versaoId: undefined });
    expect(ler('')).toEqual({ musica: undefined, versaoId: undefined });
    // writing keeps the other parameters and replaces the old choice
    expect(escreverLink(new URLSearchParams('x=1&musica=m1&som=a'), 'c1', 'b').toString()).toBe('x=1&musica=c1&som=b');
    expect(escreverLink(new URLSearchParams('som=a'), 'c1', undefined).toString()).toBe('musica=c1');
  });

  it('opens on the song and version of the link, with the style select on its category', () => {
    render(<PlayerApp catalogo={catalogo} />, '/?musica=c1&som=b');
    expect(screen.getByRole('button', { name: /Praça/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Estilo')).toHaveValue('cidade');
    expect(screen.getByLabelText('Versões')).toHaveValue('b');
    expect(screen.getByText('Versão B', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tocar' })).toBeEnabled(); // stopped
    expect(screen.getByTestId('busca')).toHaveTextContent('?musica=c1&som=b');
  });

  it('opens on the default song when the link names ids that do not exist', () => {
    render(<PlayerApp catalogo={catalogo} />, '/?musica=nada&som=nada');
    expect(screen.getByRole('button', { name: /Marcha/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Versões')).toHaveValue('a');
  });

  it('writes the song and the version into the address when either is picked', () => {
    render(<PlayerApp catalogo={catalogo} />, '/?x=1');
    expect(screen.getByTestId('busca')).toHaveTextContent('?x=1'); // nothing written before a choice
    fireEvent.click(screen.getByRole('button', { name: /Brasas/ }));
    expect(screen.getByTestId('busca')).toHaveTextContent('?x=1&musica=m2&som=a');
    fireEvent.change(screen.getByLabelText('Versões'), { target: { value: 'b' } });
    expect(screen.getByTestId('busca')).toHaveTextContent('?x=1&musica=m2&som=b');
  });

  it('another song takes the screen at once, shows the loading bar and plays by itself when loaded', async () => {
    // an AudioContext and a network for the engine the app makes on the first press
    class Contexto extends FakeContext {
      async close() {}
    }
    vi.stubGlobal('AudioContext', Contexto);
    let abrir!: () => void;
    const porta = new Promise<void>((r) => (abrir = r));
    const rede = fakeFetch({ '/s/m1_a/0.ogg': 60, '/s/m2_a/0.ogg': 60, '/s/c1_a/0.ogg': 60 });
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.startsWith('/s/m2')) await porta;
      return rede.fetch(url);
    });
    const { unmount } = render(<PlayerApp catalogo={catalogo} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: /Brasas/ }));
    fireEvent.click(screen.getByRole('button', { name: /Brasas/ }));
    // at once, with nothing downloaded: the list, the address and the bar
    expect(screen.getByRole('button', { name: /Brasas/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('busca')).toHaveTextContent('?musica=m2&som=a');
    const barra = await screen.findByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuenow', '0');
    expect(barra).toHaveAccessibleName('Baixando os sons: 0 de 1');
    expect(screen.getByRole('button', { name: 'Carregando…' })).toBeDisabled();
    // a third song while the second loads: the second never plays
    fireEvent.change(screen.getByLabelText('Estilo'), { target: { value: 'cidade' } });
    fireEvent.click(screen.getByRole('button', { name: /Praça/ }));
    expect(screen.getByRole('button', { name: /Praça/ })).toHaveAttribute('aria-pressed', 'true');
    await screen.findByRole('button', { name: 'Pausar' }); // loaded: it plays by itself
    expect(screen.queryByRole('progressbar')).toBeNull();
    await act(async () => abrir());
    expect(rede.requested).toContain('/s/m2_a/0.ogg');
    expect(screen.getByRole('button', { name: /Praça/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Versão A', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeEnabled(); // still the third one playing
    unmount();
    vi.unstubAllGlobals();
  });

  it('the first press on Play of a visit loads the song and plays it, without a second click', async () => {
    class Contexto extends FakeContext {
      async close() {}
    }
    vi.stubGlobal('AudioContext', Contexto);
    vi.stubGlobal('fetch', fakeFetch({ '/s/c1_b/0.ogg': 60 }).fetch);
    const { unmount } = render(<PlayerApp catalogo={catalogo} />, '/?musica=c1&som=b');
    const tocar = screen.getByRole('button', { name: 'Tocar' });
    // the press must not start loading: a button disabled between the press and the click gets no click
    fireEvent.pointerDown(tocar);
    expect(tocar).toBeEnabled();
    fireEvent.click(tocar);
    await screen.findByRole('button', { name: 'Pausar' }); // the version of the link, loaded and playing
    expect(screen.getByText('Versão B', { selector: 'strong' })).toBeInTheDocument();
    unmount();
    vi.unstubAllGlobals();
  });

  it('shows the loading bar with the stems downloaded so far and takes it away when all are', async () => {
    const m = catalogo.songs[0]!;
    const dois = { ...m, channels: [...m.channels, { channel: 1, program: 0, name: 'Piano' }] };
    let abrir!: () => void;
    const porta = new Promise<void>((r) => (abrir = r));
    const rede = fakeFetch({ '/s/m1_a/0.ogg': 60, '/s/m1_a/1.ogg': 60 });
    const engine = new PlayerEngine({
      context: new FakeContext().asContext(),
      fetch: async (url) => {
        if (url.endsWith('1.ogg')) await porta;
        return rede.fetch(url);
      },
    });
    render(<Transporte engine={engine} versao={dois.versions[0]} aoAlternar={() => undefined} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    let carga!: Promise<void>;
    await act(async () => {
      carga = engine.setSong(dois, 'a');
      await new Promise((r) => setTimeout(r, 0));
    });
    const barra = screen.getByRole('progressbar');
    expect(barra).toHaveAttribute('aria-valuemin', '0');
    expect(barra).toHaveAttribute('aria-valuemax', '100');
    expect(barra).toHaveAttribute('aria-valuenow', '50');
    expect(barra).toHaveAttribute('aria-valuetext', 'Baixando os sons: 1 de 2');
    expect(barra).toHaveAccessibleName('Baixando os sons: 1 de 2');
    expect(barra.firstElementChild).toHaveStyle({ width: '50%' });
    await act(async () => {
      abrir();
      await carga;
    });
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('button', { name: 'Tocar' })).toBeEnabled();
  });

  it('says an instrument did not load, without the bar and without playing', async () => {
    const m = catalogo.songs[0]!;
    const engine = new PlayerEngine({ context: new FakeContext().asContext(), fetch: fakeFetch({}).fetch });
    render(<Transporte engine={engine} versao={m.versions[0]} aoAlternar={() => undefined} />);
    await act(() => engine.setSong(m, 'a', { play: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Um instrumento não carregou.');
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(engine.state).toBe('idle');
  });

  it('gives every effect tag of the mixer its icon and keeps the label', () => {
    const m = catalogo.songs[0]!;
    const comEfeitos: Song = {
      ...m,
      channels: [{ ...m.channels[0]!, effects: ['reverb', 'release', 'sustain', 'eco'] }],
    };
    const { container } = render(
      <Mixer
        engine={undefined}
        musica={comEfeitos}
        versao={comEfeitos.versions[0]}
        canais={comEfeitos.channels}
        aoTrocarVersao={() => undefined}
      />,
    );
    const tags = [...screen.getByRole('list', { name: 'Efeitos de Cello' }).children];
    expect(tags.map((t) => t.textContent)).toEqual(['Reverb', 'Release longo', 'Sustain (pedal)', 'Eco']);
    const tracos = tags.map((t) => t.querySelector('svg[aria-hidden="true"] path')?.getAttribute('d'));
    expect(new Set(tracos).size).toBe(4); // four icons, none the fallback repeated
    expect(tracos.every(Boolean)).toBe(true);
    // the notes column is there for the roll to fill, and the old label beside the name is gone
    expect(container.querySelector('[data-notas="0"]')).toBeInTheDocument();
    expect(container.querySelector('[data-nota]')).toBeNull();
  });

  it('zooms the lanes from the buttons and marks the stretch on screen over the overview', () => {
    const { container } = render(<PlayerApp catalogo={catalogo} />);
    const notas = screen.getByRole('slider', { name: /Notas de cada canal/ });
    const menos = screen.getByRole('button', { name: 'Diminuir o zoom das notas' });
    // jsdom lays nothing out, so the box keeps the whole width; the lanes open at twice the room they have
    expect(container.querySelector('[data-roll="janela"]')).toHaveStyle({ left: '0%', width: '100%' });
    expect(notas).toHaveStyle({ width: '200%' });
    expect(screen.getByText('Zoom 2×')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar o zoom das notas' }));
    expect(notas).toHaveStyle({ width: '400%' });
    fireEvent.click(menos);
    fireEvent.click(menos);
    fireEvent.click(menos);
    expect(notas).toHaveStyle({ width: '100%' });
    expect(menos).toBeDisabled();
  });

  it('remembers the zoom between visits and ignores a stored value that is not a zoom', () => {
    const { unmount } = render(<PlayerApp catalogo={catalogo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar o zoom das notas' }));
    expect(localStorage.getItem(CHAVE_ZOOM)).toBe('4');
    unmount();
    const outra = render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getByText('Zoom 4×')).toBeInTheDocument();
    outra.unmount();
    for (const ruim of ['banana', '0', '99', '']) {
      localStorage.setItem(CHAVE_ZOOM, ruim);
      const r = render(<PlayerApp catalogo={catalogo} />);
      expect(screen.getByText('Zoom 2×')).toBeInTheDocument();
      r.unmount();
    }
  });

  it('zooms with the plain wheel over the overview, and only with Ctrl over the lanes', () => {
    const { container } = render(<PlayerApp catalogo={catalogo} />);
    const notas = screen.getByRole('slider', { name: /Notas de cada canal/ });
    const visao = container.querySelector('[data-roll="visao"]')!;
    // fireEvent returns false when the listener called preventDefault: the page must not scroll
    expect(fireEvent.wheel(visao, { deltaY: -100 })).toBe(false);
    expect(notas).toHaveStyle({ width: `${200 * PASSO_RODA}%` });
    expect(localStorage.getItem(CHAVE_ZOOM)).toBe(String(2 * PASSO_RODA));
    fireEvent.wheel(visao, { deltaY: 100 });
    fireEvent.wheel(visao, { deltaY: 100 });
    expect(notas).toHaveStyle({ width: `${200 / PASSO_RODA}%` });
    // over the lanes the plain wheel scrolls them
    expect(fireEvent.wheel(notas, { deltaY: -100 })).toBe(true);
    expect(notas).toHaveStyle({ width: `${200 / PASSO_RODA}%` });
    expect(fireEvent.wheel(notas, { deltaY: -100, ctrlKey: true })).toBe(false);
    expect(notas).toHaveStyle({ width: '200%' });
  });

  it('lists categories, filters by search and switches the song', () => {
    render(<PlayerApp catalogo={catalogo} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain('Batalha (2)');
    expect(screen.getByLabelText('Estilo')).toHaveValue('batalha');
    fireEvent.change(screen.getByLabelText('Buscar música'), { target: { value: 'brasa' } });
    expect(screen.getByText('Mostrando 1 de 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Brasas/ }));
    expect(screen.getByRole('button', { name: /Brasas/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('picks the version of the whole song from the mixer header', () => {
    render(<PlayerApp catalogo={catalogo} />);
    const seletor = screen.getByLabelText('Versões');
    fireEvent.change(seletor, { target: { value: 'b' } });
    expect(screen.getByText('Versão B', { selector: 'strong' })).toBeInTheDocument();
  });

  it('asks what to do with the per-instrument choices before changing the version of the whole song', async () => {
    const m = catalogo.songs[0]!;
    const arquivos = { '/s/m1_a/0.ogg': 60, '/s/m1_b/0.ogg': 60 };
    const engine = new PlayerEngine({ context: new FakeContext().asContext(), fetch: fakeFetch(arquivos).fetch });
    await engine.setSong(m, 'a');
    const trocar = vi.fn();
    render(<Mixer engine={engine} musica={m} versao={m.versions[0]} canais={m.channels} aoTrocarVersao={trocar} />);
    const seletor = screen.getByLabelText('Versões');

    // no instrument on a version of its own: it changes at once
    fireEvent.change(seletor, { target: { value: 'b' } });
    expect(trocar).toHaveBeenLastCalledWith('b');
    expect(screen.queryByRole('alertdialog')).toBeNull();

    act(() => engine.setChannelVersion(0, 'b'));
    const pedir = () => {
      trocar.mockClear();
      fireEvent.change(seletor, { target: { value: 'b' } });
      return screen.getByRole('alertdialog', { name: 'Trocar para Versão B?' });
    };
    pedir();
    expect(trocar).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Manter minhas trocas' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Manter minhas trocas' }));
    expect(trocar).toHaveBeenLastCalledWith('b', true);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await waitFor(() => expect(seletor).toHaveFocus()); // Radix gives the focus back a tick after it closes

    pedir();
    fireEvent.click(screen.getByRole('button', { name: 'Trocar tudo' }));
    expect(trocar).toHaveBeenLastCalledWith('b', false);

    // Cancel and Esc change nothing and the select shows the version in use again
    pedir();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.keyDown(pedir(), { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(trocar).not.toHaveBeenCalled();
    expect(seletor).toHaveValue('a');
  });

  it('collapses the list and shows the notes with the draft badge and study reference', () => {
    render(<PlayerApp catalogo={catalogo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Recolher a lista de músicas' }));
    expect(screen.getByRole('button', { name: 'Mostrar a lista de músicas' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Fonte/ })).toHaveAttribute('target', '_blank');
  });
});
