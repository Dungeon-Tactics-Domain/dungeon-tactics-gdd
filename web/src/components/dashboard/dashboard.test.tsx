import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BarrasComparativas } from './BarrasComparativas';
import { CartaoMetrica } from './CartaoMetrica';
import { CenaSobDemanda } from './CenaSobDemanda';
import { ListaPendencias } from './ListaPendencias';
import { SeloOrigem } from './SeloOrigem';
import { pontuar, TabelaPontuacao } from './TabelaPontuacao';

const SERIES = [
  { id: 'a', nome: 'Motor A', cor: '#2f6aa8' },
  { id: 'b', nome: 'Motor B', cor: '#b8561c' },
];

describe('BarrasComparativas', () => {
  it('prints every value with its unit, a legend, and "não medido" for a missing one', () => {
    render(
      <BarrasComparativas
        titulo="Fps"
        series={SERIES}
        unidade=" fps"
        linhas={[{ rotulo: 'Base', valores: { a: 99.2, b: null } }]}
      />,
    );
    expect(screen.getByText('99,2 fps')).toBeInTheDocument();
    expect(screen.getByText('não medido')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Legenda' })).getAllByRole('listitem')).toHaveLength(2);
  });

  it('says so when there is nothing to draw', () => {
    render(<BarrasComparativas titulo="Fps" series={SERIES} linhas={[]} />);
    expect(screen.getByText('Sem dados para mostrar.')).toBeInTheDocument();
  });
});

describe('TabelaPontuacao', () => {
  const crit = [
    { id: 'x', nome: 'X', peso: 60, notas: { a: 5, b: 0 } },
    { id: 'y', nome: 'Y', peso: 40, notas: { a: 0, b: 5 } },
  ];
  it('computes weight x score / scale, and the total without one criterion back on base 100', () => {
    expect(pontuar(crit, SERIES)).toEqual({ a: 60, b: 40 });
    expect(pontuar(crit, SERIES, 5, 'y')).toEqual({ a: 100, b: 0 });
  });
  it('renders the rows and the totals, and an empty state', () => {
    const { rerender } = render(<TabelaPontuacao criterios={crit} series={SERIES} />);
    const total = screen.getByRole('row', { name: /Total/ });
    expect(within(total).getByText('60')).toBeInTheDocument();
    expect(within(total).getByText('40')).toBeInTheDocument();
    rerender(<TabelaPontuacao criterios={[]} series={SERIES} />);
    expect(screen.getByText('Nenhum critério para pontuar.')).toBeInTheDocument();
  });
});

describe('CartaoMetrica', () => {
  it('formats the number in pt-BR, or says "não medido"', () => {
    const { rerender } = render(<CartaoMetrica rotulo="Fps" valor={1623.8} unidade=" fps" />);
    expect(screen.getByText('1.623,8 fps')).toBeInTheDocument();
    rerender(<CartaoMetrica rotulo="Fps" valor={null} />);
    expect(screen.getByText('não medido')).toBeInTheDocument();
  });
});

describe('SeloOrigem', () => {
  it('names the source and opens the detail with the keyboard', async () => {
    render(<SeloOrigem tipo="medido" texto="Bancada de 17/11" />);
    expect(screen.queryByText('Bancada de 17/11')).toBeNull();
    screen.getByRole('button', { name: 'Origem: Medido. Abrir detalhe' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Bancada de 17/11')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Origem: Medido. Fechar detalhe' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});

describe('CenaSobDemanda', () => {
  it('shows only the preview and the size until "Rodar", and unmounts the view on "Parar"', async () => {
    render(
      <CenaSobDemanda titulo="a cena" tamanhoMB={3.4} previa={{ src: '/p.png', alt: 'Prévia' }}>
        {() => <p>cena viva</p>}
      </CenaSobDemanda>,
    );
    expect(screen.queryByText('cena viva')).toBeNull();
    expect(screen.getByText('Download: cerca de 3,4 MB.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Rodar a cena' }));
    expect(screen.getByText('cena viva')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Parar e descarregar' }));
    expect(screen.queryByText('cena viva')).toBeNull();
  });
});

describe('ListaPendencias', () => {
  it('writes each state in words, and an empty state', () => {
    const { rerender } = render(
      <ListaPendencias itens={[{ id: 'deck', titulo: 'Steam Deck', estado: 'nao-testado', porQue: 'portátil' }]} />,
    );
    expect(screen.getByText('Não testado')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /Como rodar/ })).toBeNull();
    rerender(
      <ListaPendencias
        itens={[{ id: 'fps', titulo: 'Medir', estado: 'nao-testado', passos: ['npm run build', 'node medir.mjs'] }]}
      />,
    );
    expect(within(screen.getByRole('list', { name: 'Como rodar: Medir' })).getAllByRole('listitem')).toHaveLength(2);
    rerender(<ListaPendencias itens={[]} />);
    expect(screen.getByText('Nada pendente.')).toBeInTheDocument();
  });
});
