// Data of the combat bar test, shared by the 3D version (cena-hud.ts) and the CSS version (HudCss.tsx).
export interface Lado {
  nome: string;
  turno: string;
  hp: [number, number];
  mp: [number, number];
  ct: [number, number];
  bravura: number;
  fe: number;
  classe: string;
  nv: number;
  prox: number;
  ph: number;
  inimigo?: boolean;
  /** red stretch: damage preview, as HP it would remove */
  previa?: number;
}

export const ATACANTE: Lado = {
  nome: 'Cavaleiro', turno: '3', hp: [84, 84], mp: [30, 30], ct: [100, 100], bravura: 74, fe: 70,
  classe: 'Guerreiro', nv: 8, prox: 62, ph: 410,
};
export const ALVO: Lado = {
  nome: 'Esqueleto', turno: '5', hp: [54, 82], mp: [0, 10], ct: [62, 100], bravura: 60, fe: 40,
  classe: 'Guarda', nv: 7, prox: 38, ph: 290, inimigo: true, previa: 36,
};

