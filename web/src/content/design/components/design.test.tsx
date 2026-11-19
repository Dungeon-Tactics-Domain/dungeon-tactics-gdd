import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CONTEUDO } from '../../registry';
import { blocos, GAMES, IA, iaSub, mouthFrame, PER_PAGE, porConversa, type Test } from '../dados';
import { CartoesIa } from './Cartoes';
import { IaAssunto } from './Ia';
import { VisaoGeral } from './Referencias';
import { ITENS, PaletaNosso, Pares } from './ComparacaoFft';
import { Marcacoes } from './Marcacoes';
import { Vozes } from './Vozes';

describe('design lab data', () => {
  it('keeps the old lab tabs as groups (same ids as its routes): 3 groups, 16 captures of 1 game, every capture in exactly one block', () => {
    const s = CONTEUDO.design!.sumario;
    expect(s.grupos.map((g) => `${g.id}:${g.paginas.length}`)).toEqual([
      'interface:9',
      'personagens:1',
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

describe('3D versus FFT page', () => {
  it('lists every element in the palette and shows a pair of images per element', () => {
    const palette = render(<PaletaNosso />);
    expect(palette.container.querySelectorAll('li')).toHaveLength(ITENS.length);
    const images = (['batalha', 'telas', 'cidade'] as const).map(
      (g) => render(<Pares grupo={g} />).container.querySelectorAll('img').length,
    );
    expect(images.reduce((a, b) => a + b, 0)).toBe(ITENS.length * 2 + 2);
    expect(ITENS.filter((i) => i.semEquivalente).map((i) => i.id)).toEqual([
      'executar',
      'derrota',
      'ferramentas',
      'status',
      'loja',
    ]);
  });
});
