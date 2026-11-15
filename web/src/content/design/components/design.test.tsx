import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CONTEUDO } from '../../registry';
import { blocos, GAMES, IA, iaSub, mouthFrame, PER_PAGE } from '../dados';
import { CartoesIa } from './Cartoes';
import { Direcao } from './Direcao';
import { VisaoGeral } from './Referencias';

describe('design lab data', () => {
  it('keeps the old tree: 5 groups, 112 captures of 10 games, every capture in exactly one block', () => {
    const s = CONTEUDO.design!.sumario;
    expect(s.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'decisoes:4',
      'referencias:11',
      'maquetes:5',
      'testes-de-ia:7',
      'pecas:1',
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

  it('steps the mouth at 8 Hz through 4 frames and keeps it still when silent (old fft-kit.html self-check)', () => {
    expect([mouthFrame(5000, false), mouthFrame(0, true), mouthFrame(124, true), mouthFrame(125, true)]).toEqual([
      0, 0, 0, 1,
    ]);
    expect([mouthFrame(375, true), mouthFrame(500, true)]).toEqual([3, 0]);
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
});
