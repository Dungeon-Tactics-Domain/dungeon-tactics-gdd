import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CONTEUDO } from '../../registry';
import { blocos, GAMES, IA, iaSub, mouthFrame, PER_PAGE, porConversa, ROSTO, rostoFim, type Test } from '../dados';
import { CHAVE, LUGARES, MAPA, NPCS } from '../cidade';
import { CartoesIa } from './Cartoes';
import { Cidade } from './Cidade';
import { Direcao } from './Direcao';
import { Expressoes } from './Expressoes';
import { IaAssunto } from './Ia';
import { VisaoGeral } from './Referencias';
import { Telas } from './Telas';

describe('design lab data', () => {
  it('keeps the old lab tabs as groups (same ids as its routes): 5 groups, 112 captures of 10 games, every capture in exactly one block', () => {
    const s = CONTEUDO.design!.sumario;
    expect(s.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'interface:9',
      'personagens:6',
      'mapa:2',
      'plano:5',
      'referencias:11',
    ]);
    expect(GAMES).toHaveLength(10);
    const files = GAMES.flatMap((g) =>
      blocos(g)
        .flat()
        .map((s) => s.file),
    );
    expect(files).toHaveLength(112);
    expect(new Set(files).size).toBe(112);
    expect(GAMES.every((g) => blocos(g).every((b) => b.length <= PER_PAGE))).toBe(true);
  });

  it('puts every Gemini and Copilot image in one subpage', () => {
    const subs = new Set(IA.subs.map(([id]) => id));
    for (const p of IA.platforms) expect(p.tests.every((t) => subs.has(iaSub(t)))).toBe(true);
  });

  it('steps the mouth at 5 Hz through closed, half, open, half and keeps it still when silent', () => {
    expect([mouthFrame(5000, false), mouthFrame(0, true), mouthFrame(199, true), mouthFrame(200, true)]).toEqual([
      0, 1, 1, 2,
    ]);
    expect([mouthFrame(400, true), mouthFrame(600, true), mouthFrame(800, true)]).toEqual([3, 2, 1]);
  });

  it('picks the end-of-battle face: hurt when fallen or below 30%, smiling on a victory, neutral on a defeat', () => {
    expect([rostoFim(0, 30, true), rostoFim(11, 38, true), rostoFim(12, 38, true), rostoFim(20, 36, false)]).toEqual([
      ROSTO.ferido,
      ROSTO.ferido,
      ROSTO.sorrindo,
      ROSTO.neutro,
    ]);
  });

  it('groups the images of one conversation and leaves the single ones loose', () => {
    const t = (file: string, link?: string) => ({ file, link }) as Test;
    const { juntas, soltas } = porConversa([t('a', 'x'), t('b', 'x'), t('c', 'y'), t('d')]);
    expect(juntas.map((g) => g.map((i) => i.file))).toEqual([['a', 'b']]);
    expect(soltas.map((i) => i.file)).toEqual(['c', 'd']);
  });

  it('draws a 40x30 town where every door and every NPC tile is reachable from the start, lots matching their letters', () => {
    expect(MAPA).toHaveLength(30);
    expect(MAPA.every((r) => r.length === 40 && [...r].every((c) => CHAVE[c]))).toBe(true);
    const at = (x: number, y: number) => CHAVE[MAPA[y]?.[x] ?? '']!;
    const anda = (x: number, y: number) => at(x, y)?.terrain === 'floor' && (at(x, y).depth ?? 0) < 2;
    const inicio = MAPA.flatMap((r, y) => (r.includes('@') ? [[r.indexOf('@'), y]] : []));
    expect(inicio).toHaveLength(1);
    // walking: 4 directions, deep water blocks, a step of at most 1 level (the ramp)
    const visto = new Set([String(inicio[0])]);
    for (const fila = [inicio[0]!]; fila.length;) {
      const [x, y] = fila.shift()!;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const [nx, ny] = [x! + dx, y! + dy];
        if (visto.has(`${nx},${ny}`) || !anda(nx, ny) || Math.abs(at(nx, ny).h - at(x!, y!).h) > 1) continue;
        visto.add(`${nx},${ny}`);
        fila.push([nx, ny]);
      }
    }
    expect(LUGARES).toHaveLength(10);
    for (const l of LUGARES) {
      const lote = l.lotes.flatMap((o) =>
        Array.from({ length: o.w * o.h }, (_, i) => `${o.x + (i % o.w)},${o.y + Math.floor(i / o.w)}`),
      );
      const letras = MAPA.flatMap((r, y) => [...r].flatMap((c, x) => (c === l.letra ? [`${x},${y}`] : [])));
      expect(new Set(lote), l.letra).toEqual(new Set(letras));
      expect(visto.has(`${l.porta.x},${l.porta.y}`), `porta ${l.letra}`).toBe(true);
    }
    expect(NPCS).toHaveLength(10);
    for (const n of NPCS) for (const p of [n.em, n.ate ?? n.em]) expect(visto.has(`${p.x},${p.y}`), n.id).toBe(true);
  });
});

describe('design lab components', () => {
  it('filters the overview by screen and walks it in blocks of 2', async () => {
    const user = userEvent.setup();
    render(<VisaoGeral />);
    expect(screen.getByRole('status')).toHaveTextContent('Capturas 1 a 2 de 112');
    await user.click(screen.getByRole('button', { name: 'Seguintes →' }));
    expect(screen.getByRole('status')).toHaveTextContent('Capturas 3 a 4 de 112');
    await user.click(screen.getByRole('button', { name: /^Loja \(/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/Capturas 1 a 2 de \d+/);
    expect(screen.getByRole('button', { name: '← Anteriores' })).toBeDisabled();
  });

  it('draws each direction with an empty MP bar for 0/0 and switches the scene behind', async () => {
    const user = userEvent.setup();
    const { container } = render(<Direcao id="c" />);
    expect(container.querySelector('.dz-maquetes .dir-c .stage')).not.toBeNull();
    expect(container.querySelector<HTMLElement>('.mp .bar-track i')!.style.width).toBe('0%');
    await user.click(screen.getByRole('button', { name: /Cripta/ }));
    expect(container.querySelector<HTMLElement>('.stage')!.style.getPropertyValue('--cena')).toContain(
      'cena-cripta.jpg',
    );
  });

  it('opens the reader on the clicked card and walks the list with the arrows', async () => {
    const user = userEvent.setup();
    render(<CartoesIa tests={IA.platforms[0]!.tests.slice(0, 2)} />);
    await user.click(screen.getAllByRole('button', { name: /^Ampliar/ })[1]!);
    const leitor = screen.getByRole('dialog');
    expect(within(leitor).getByRole('img')).toHaveAttribute(
      'src',
      `/content/design/ia/${IA.platforms[0]!.tests[1]!.file}`,
    );
    await user.click(within(leitor).getByRole('button', { name: 'Próxima imagem' }));
    expect(within(leitor).getByRole('img')).toHaveAttribute(
      'src',
      `/content/design/ia/${IA.platforms[0]!.tests[0]!.file}`,
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lists a subject per platform with the conversation heading and its link', () => {
    render(<IaAssunto ids={['rostos']} />);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'abrir conversa' })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('http'),
    );
    render(<IaAssunto ids={['nada']} />);
    expect(screen.getByText('Assunto desconhecido: nada')).toBeInTheDocument();
  });

  it('plays an expression on the bench: damage takes life and shows the hit frame, neutral restores it', async () => {
    const user = userEvent.setup();
    render(<Expressoes />);
    expect(screen.getByText('42/42')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Levar dano' }));
    expect(screen.getByText('28/42')).toBeInTheDocument();
    expect(screen.getByText('Tomando dano (−14)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Neutro (parado)' }));
    expect(screen.getByText('42/42')).toBeInTheDocument();
  });

  it('opens on the official version D and keeps the chosen moment when the character changes, without new damage', async () => {
    const user = userEvent.setup();
    render(<Expressoes />);
    expect(screen.getByRole('button', { name: /^D · / })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Levar dano' }));
    await user.click(screen.getByRole('button', { name: 'Maga' }));
    expect(screen.getByText('28/42')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Levar dano' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('walks the screen mock-ups through every state in both languages and both sizes', async () => {
    const user = userEvent.setup();
    const { container } = render(<Telas />);
    const [fim, mapa, titulo] = screen.getAllByRole('region').filter((r) => r.tagName === 'SECTION');
    expect(within(fim!).getByRole('img', { name: 'Bran: sorrindo' })).toBeInTheDocument();
    expect(within(fim!).getByRole('img', { name: 'Tess: ferido' })).toBeInTheDocument();
    expect(within(fim!).getByRole('img', { name: 'Odo: caído, rosto ferido' })).toBeInTheDocument();
    await user.click(within(fim!).getByRole('button', { name: 'Derrota' }));
    expect(within(fim!).getByRole('img', { name: 'Lia: neutro' })).toBeInTheDocument();
    for (const estado of ['Loja', 'Taverna', 'Ficha do grupo']) {
      await user.click(within(mapa!).getByRole('button', { name: estado }));
      expect(within(mapa!).getByRole('region', { name: estado })).toBeInTheDocument();
    }
    expect(within(mapa!).getAllByRole('img', { name: /: neutro$/ })).toHaveLength(5);
    await user.click(within(mapa!).getByRole('button', { name: 'Mapa' }));
    expect(within(mapa!).getByText('Enter entra · setas movem · Esc volta')).toBeInTheDocument();
    await user.click(within(titulo!).getByRole('button', { name: 'Opções' }));
    expect(within(titulo!).getByRole('group', { name: 'Ângulo da câmera' })).toBeInTheDocument();
    // English everywhere, from any mock-up's switch; the options panel and the screen size follow
    await user.click(within(fim!).getByRole('button', { name: 'English' }));
    expect(within(fim!).getByText('Defeat')).toBeInTheDocument();
    expect(within(titulo!).getByRole('group', { name: 'Camera angle' })).toBeInTheDocument();
    expect(within(mapa!).getByText('Enter goes in · arrows move · Esc back')).toBeInTheDocument();
    await user.click(within(titulo!).getByRole('button', { name: '1280×720' }));
    expect([...container.querySelectorAll<HTMLElement>('.fft-stage')].map((s) => s.style.width)).toEqual([
      '1280px',
      '1280px',
      '1280px',
    ]);
  });

  it('switches the town level, showing the NPCs of that level, and the lines in both languages', async () => {
    const user = userEvent.setup();
    render(<Cidade />);
    expect(screen.getAllByRole('button', { name: /^\d+\. .+, / })).toHaveLength(7);
    await user.hover(screen.getByRole('button', { name: '1. Hilde, guarda do portão' }));
    expect(screen.getByText(/A névoa chegou à estrada/)).toBeInTheDocument();
    expect(screen.getByText('Depois da fala abre: Escolher dungeon')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '3 · Farol aceso' }));
    expect(screen.getAllByRole('button', { name: /^\d+\. .+, / })).toHaveLength(10);
    await user.click(screen.getByRole('button', { name: 'English' }));
    await user.hover(screen.getByRole('button', { name: '10. Amaro, beacon archivist' }));
    expect(screen.getByText(/The beacon lit again/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Beacon lit');
  });
});
