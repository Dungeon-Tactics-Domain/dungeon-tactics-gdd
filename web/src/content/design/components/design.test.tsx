import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CONTEUDO } from '../../registry';
import { blocos, GAMES, IA, iaSub, mouthFrame, PER_PAGE, porConversa, type Test } from '../dados';
import { CHAVE, LUGARES, MAPA, NPCS } from '../cidade';
import { CartoesIa } from './Cartoes';
import { Cidade } from './Cidade';
import { Expressoes } from './Expressoes';
import { IaAssunto } from './Ia';
import { VisaoGeral } from './Referencias';
import { Marcacoes } from './Marcacoes';
import { Vozes } from './Vozes';

describe('design lab data', () => {
  it('keeps the old lab tabs as groups (same ids as its routes): 5 groups, 16 captures of 1 game, every capture in exactly one block', () => {
    const s = CONTEUDO.design!.sumario;
    expect(s.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'interface:11',
      'personagens:2',
      'mapa:1',
      'plano:3',
      'referencias:2',
    ]);
    expect(GAMES).toHaveLength(1);
    const files = GAMES.flatMap((g) =>
      blocos(g)
        .flat()
        .map((s) => s.file),
    );
    expect(files).toHaveLength(16);
    expect(new Set(files).size).toBe(16);
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
    expect(screen.getByRole('status')).toHaveTextContent('Capturas 1 a 2 de 16');
    await user.click(screen.getByRole('button', { name: 'Seguintes →' }));
    expect(screen.getByRole('status')).toHaveTextContent('Capturas 3 a 4 de 16');
    await user.click(screen.getByRole('button', { name: /^Batalha \(/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/Capturas 1 a 2 de \d+/);
    expect(screen.getByRole('button', { name: '← Anteriores' })).toBeDisabled();
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

describe('voices test page', () => {
  it('shows a labelled audio player per model for every line and marks the cloud models as coming soon', () => {
    const { container } = render(<Vozes />);
    expect(container.querySelectorAll('audio[controls][aria-label]')).toHaveLength(83);
    expect(container.querySelectorAll('audio[data-modelo="ming"]')).toHaveLength(19);
    expect(container.querySelectorAll('audio[data-modelo="ming-clone"]')).toHaveLength(4);
    expect(container.querySelectorAll('audio[data-modelo="qwen-clone"]')).toHaveLength(20);
    expect(screen.getAllByLabelText(/Qwen3 clonado, referência do timbre/)).toHaveLength(4);
    expect(screen.getByRole('button', { name: /Ouvir tudo: Qwen3 clonado/ })).toBeInTheDocument();
    expect(container.querySelector('audio[data-modelo="ming"][data-fala="odo_03"]')).toBeNull();
    expect(screen.getAllByText('falhou: não gerou áudio')).toHaveLength(1);
    expect(screen.getByText(/ainda não foi ouvida/)).toBeInTheDocument();
    expect(screen.getAllByText('em breve')).toHaveLength(60);
    expect(screen.getByRole('button', { name: /Ouvir tudo: Maya1/ })).toBeInTheDocument();
  });
});

describe('floor marks page', () => {
  it('shows 4 styles in 2 scenes plus the sheets, and only loads the game after "Ver ao vivo"', async () => {
    const { container } = render(<Marcacoes />);
    expect(container.querySelectorAll('img')).toHaveLength(12);
    expect(container.querySelector('iframe')).toBeNull();
    await userEvent.click(screen.getByRole('radio', { name: 'Degraus' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Neon' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ver ao vivo' }));
    expect(container.querySelector('iframe')!.getAttribute('src')).toBe(
      'http://localhost:5364/?scenario=beacon_hill&marks=neon&sandbox=bench/marks-degraus-neon.json',
    );
  });
});
