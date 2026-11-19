// Places of the labs app. The navigation, the home cards and each lab's accent colour read only from here: a new lab is
// one new line. (The kingdom map of 14/11 was replaced by the B-2 cards on 18/11.)

/** The site's name (Fernando, 15/11): the header and every tab title. */
export const SITE = 'GDD Dungeon Tactics';

export interface Place {
  id: string;
  nome: string;
  curto: string;
  /** route in this app; undefined = no page yet (greyed out in the bar) */
  href?: string;
  /** flag colour, also the lab accent (white text on it stays above 4.5:1) */
  cor: string;
  corSuave: string;
  descricao: string;
  /** page in the old lab (port 5190) while the content is not migrated */
  antigo?: string;
}

export const OLD_LAB = 'http://localhost:5190';
/** the old lab only exists on the dev PC; on the public site its links would be dead */
export const ehLocal = () => ['localhost', '127.0.0.1'].includes(location.hostname);

// the home's accent; not a lab
export const HUB = { cor: '#7a4a12', corSuave: '#f6ead8' };

export const LABS: Place[] = [
  {
    id: 'design',
    nome: 'Design system e UX',
    curto: 'Design',
    href: '/design',
    cor: '#8c2f52',
    corSuave: '#f6e4eb',
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
    descricao: 'Tom, grupo, morte e o loop',
    antigo: '/narrativa/',
  },
  {
    id: 'modelos',
    nome: 'Modelos 3D',
    curto: 'Modelos',
    href: '/modelos',
    cor: '#6b4a9a',
    corSuave: '#ece4f6',
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
    descricao: 'Trilha no estilo FFT e BoF4',
    antigo: '/musica/',
  },
  {
    id: 'engine',
    nome: 'Engine: Godot x Three.js',
    curto: 'Engine',
    href: '/engine',
    cor: '#3b5a78',
    corSuave: '#e3eaf1',
    descricao: 'Qual motor, com medições e cenas ao vivo',
  },
];

// the decisions page is not a town: its own quiet accent
export const DECISOES_COR = {
  cor: '#5e5a48',
  corSuave: '#ecebe3',
};
