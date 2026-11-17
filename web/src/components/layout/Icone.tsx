// Line icons of the shell (24-box, stroke follows the text colour), one per place; decorative: the name stays the accessible text.
import type { SVGProps } from 'react';

const TRACOS: Record<string, string> = {
  inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  design:
    'M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 004-4c0-5-4-9.5-9-9.5zM7.5 11h.01M10 7.5h.01M14.5 7.5h.01',
  mecanicas:
    'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M9.5 6.5L21 18v3h-3L6.5 9.5M11 5L5 11M8 8L4 4M5 3L3 5',
  narrativa: 'M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5',
  modelos: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12L3 7M12 12v10',
  musica: 'M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z',
  engine: 'M12 9a3 3 0 100 6 3 3 0 000-6zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  decisoes: 'M5 12l4.5 4.5L19 7',
  // actions: one family for every clickable label in the labs (rule from Fernando, 16/11)
  menu: 'M4 6h16M4 12h16M4 18h16',
  fechar: 'M6 6l12 12M18 6L6 18',
  lupa: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
  voltar: 'M19 12H5M11 6l-6 6 6 6',
  avancar: 'M5 12h14M13 6l6 6-6 6',
  recolher: 'M11 7l-5 5 5 5M18 7l-5 5 5 5',
  expandir: 'M13 7l5 5-5 5M6 7l5 5-5 5',
  copiar: 'M9 9h11v11H9zM5 15V4h11',
  abrir: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  filtrar: 'M3 5h18l-7 8v6l-4 2v-8z',
  ordenar: 'M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4',
  tocar: 'M7 4l13 8-13 8z',
  pausar: 'M8 5v14M16 5v14',
  baixar: 'M12 4v11M7 11l5 5 5-5M4 20h16',
  mais: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  ajustar: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  tamanhoreal: 'M5 5h14v14H5zM9 12h6',
  salvar: 'M5 4h12l3 3v13H5zM8 4v5h8V4M8 20v-6h8v6',
  excluir: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  mudo: 'M11 5L6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6',
  solo: 'M4 15v-3a8 8 0 0116 0v3M4 15h3v5H4zM20 15h-3v5h3z',
  velocidade: 'M12 14l4-5M3.5 18a9.5 9.5 0 1117 0zM12 7V5M6 9L4.5 7.5M18 9l1.5-1.5',
  camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 11a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  animacao: 'M4 4h16v16H4zM4 9h16M4 15h16M9 4v16M15 4v16',
  recarregar: 'M20 11a8 8 0 10-2.3 6.3M20 4v7h-7',
};

export function Icone({ id, ...p }: { id: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 flex-none"
      {...p}
    >
      <path d={TRACOS[id] ?? TRACOS.inicio} />
    </svg>
  );
}
