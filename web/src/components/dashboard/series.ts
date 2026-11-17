// Shared bits of the dashboard components: a series (one colour per entity, never per rank) and the pt-BR number format.
export interface Serie {
  id: string;
  nome: string;
  /** fill colour; check it with the palette validator (≥ 3:1 on the card, CVD-safe next to its neighbours) */
  cor: string;
}

const NUM = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
export const numero = (v: number) => NUM.format(v);

/** "não medido" for a value that does not exist, never a blank */
export const NAO_MEDIDO = 'não medido';
