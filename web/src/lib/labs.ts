// Places of the Reino dos Laboratórios (direction B, the kingdom map, chosen by Fernando on 14/11). The top bar, the map
// and each lab's accent colour read only from here: a new lab is one new line. x and y are the flag's foot on the map, in %.

export interface Place {
  id: string;
  nome: string;
  curto: string;
  /** route in this app; undefined = no page yet (greyed out in the bar) */
  href?: string;
  /** flag colour, also the lab accent (white text on it stays above 4.5:1) */
  cor: string;
  corSuave: string;
  x: number;
  y: number;
  descricao: string;
  /** page in the old lab (port 5190) while the content is not migrated */
  antigo?: string;
}

export const OLD_LAB = 'http://localhost:5190';
/** the old lab only exists on the dev PC; on the public site its links would be dead */
export const ehLocal = () => ['localhost', '127.0.0.1'].includes(location.hostname);

// the Fábrica is the port; its state comes from the orchestrator sessions (isTower in lib/fabrica.ts)
export const PORT: Place = {
  id: 'fabrica',
  nome: 'Fábrica de games',
  curto: 'Fábrica',
  href: '/fabrica',
  cor: '#7a4a12',
  corSuave: '#f6ead8',
  x: 50,
  y: 78,
  descricao: 'Sessões e subagentes ao vivo',
};

export const LABS: Place[] = [
  {
    id: 'design',
    nome: 'Design system e UX',
    curto: 'Design',
    href: '/design',
    cor: '#8c2f52',
    corSuave: '#f6e4eb',
    x: 14,
    y: 37,
    descricao: 'Interface, direções visuais e peças',
    antigo: '/design/',
  },
  {
    id: 'mecanicas',
    nome: 'Mecânicas e game feel',
    curto: 'Mecânicas',
    href: '/mecanicas',
    cor: '#2d6a4b',
    corSuave: '#e0efe6',
    x: 43,
    y: 33,
    descricao: 'Regras da batalha e sensação',
    antigo: '/mecanicas/',
  },
  {
    id: 'narrativa',
    nome: 'Narrativa e loop',
    curto: 'Narrativa',
    href: '/narrativa',
    cor: '#1d5fa6',
    corSuave: '#e1ebf6',
    x: 80,
    y: 37,
    descricao: 'Tom, grupo, morte e o loop',
    antigo: '/narrativa/',
  },
  {
    id: 'modelos',
    nome: 'Modelos 3D',
    curto: '3D',
    href: '/modelos',
    cor: '#6b4a9a',
    corSuave: '#ece4f6',
    x: 22,
    y: 76,
    descricao: 'Árvores, objetos e carroça pintados',
    antigo: '/modelos/',
  },
  {
    id: 'musica',
    nome: 'Música PSX',
    curto: 'Música',
    href: '/musica',
    cor: '#14595c',
    corSuave: '#dcefef',
    x: 81,
    y: 91,
    descricao: 'Trilha no estilo FFT e BoF4',
    antigo: '/musica/',
  },
];

// the decisions page is not a town: its own quiet accent
export const DECISOES_COR = {
  cor: '#5e5a48',
  corSuave: '#ecebe3',
};

// where towns go for stations the board knows but this list does not; only the first spot is fully clear of the fixed
// towns, the next ones overlap a neighbour's corner (measured with the real board on 14/11, two unknown labs)
export const SPARE_SLOTS = [
  { x: 62, y: 42 },
  { x: 63, y: 99 },
  { x: 32, y: 99 },
  { x: 94, y: 62 },
];
export const GENERIC_COLOR = '#5e5a48';
