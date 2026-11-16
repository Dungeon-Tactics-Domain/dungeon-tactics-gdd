// Data of the "Ouro e couro" tokens page: the colours are read from the tokens file itself (one source), the contrast is
// WCAG 2.x relative luminance, and the map says where each token of src/index.css goes when the shell migrates.
import TOKENS_CSS from './ouro-e-couro.tokens.css?raw';

export { TOKENS_CSS };

/** Google Fonts link written in the tokens file's header. */
export const FONTES = /https:\/\/fonts\.googleapis\.com\/\S+/.exec(TOKENS_CSS)![0];

// the header comment names "@theme" and ":root" too
const CSS = TOKENS_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

/** `--color-*` of the @theme block, aliases (`var(--color-x)`) resolved. */
export const CORES: Record<string, string> = (() => {
  const tema = CSS.slice(CSS.indexOf('@theme {'), CSS.indexOf(':root {'));
  const cru = Object.fromEntries([...tema.matchAll(/--color-([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]));
  const valor = (v: string): string => {
    const alias = /^var\(--color-([\w-]+)\)$/.exec(v);
    return alias ? valor(cru[alias[1]!]!) : v;
  };
  return Object.fromEntries(Object.entries(cru).map(([k, v]) => [k, valor(v)]));
})();

/** The tokens file scoped to a wrapper class, so the page previews it without touching the shell's own tokens. */
export const tokensEm = (classe: string) => CSS.replace('@theme {', `${classe} {`).replaceAll(':root', classe);

/** Text, title, margin and gap sizes (px) per screen band: the :root values, then each @media block on top. */
export const FAIXAS_TOKENS: Record<string, number>[] = (() => {
  let atual: Record<string, number> = {};
  return CSS.split('@media').map(
    (bloco) =>
      (atual = {
        ...atual,
        ...Object.fromEntries(
          [...bloco.matchAll(/--(texto|h[123]|legenda|margem|respiro):\s*(\d+)px/g)].map((m) => [m[1]!, +m[2]!]),
        ),
      }),
  );
})();

function luz(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
export function contraste(a: string, b: string) {
  const [x, y] = [luz(a), luz(b)].sort((p, q) => p - q);
  return (y! + 0.05) / (x! + 0.05);
}

/** Colour of a token name, or the hex itself (for the lab colours of lib/labs.ts). */
export const cor = (nome: string) => (nome.startsWith('#') ? nome : CORES[nome]!);

// [text or element, background, minimum, what it is]; 4.5 for text, 3 for borders and focus (WCAG 1.4.3 and 1.4.11)
export const PARES: [frente: string, fundo: string, minimo: number, uso: string][] = [
  ['tinta', 'pergaminho', 4.5, 'texto da página'],
  ['tinta', 'folha', 4.5, 'texto do card'],
  ['tinta', 'pergaminho-escuro', 4.5, 'etiqueta, linha zebrada da tabela'],
  ['apagado', 'pergaminho', 4.5, 'texto secundário'],
  ['apagado', 'folha', 4.5, 'texto secundário no card'],
  ['apagado', 'pergaminho-escuro', 4.5, 'botão desligado'],
  ['ouro-escuro', 'pergaminho', 4.5, 'título na página'],
  ['ouro-escuro', 'folha', 4.5, 'título no card'],
  ['link', 'pergaminho', 4.5, 'link na página'],
  ['link', 'folha', 4.5, 'link no card'],
  ['creme', 'couro', 4.5, 'texto da barra lateral, botão'],
  ['creme', 'couro-escuro', 4.5, 'texto do cabeçalho'],
  ['creme', 'couro-claro', 4.5, 'item da barra lateral com o mouse em cima'],
  ['creme-apagado', 'couro', 4.5, 'texto secundário no couro'],
  ['creme-apagado', 'couro-escuro', 4.5, 'texto secundário no cabeçalho'],
  ['ouro-claro', 'couro', 4.5, 'título e link no couro'],
  ['ouro-claro', 'couro-escuro', 4.5, 'título do cabeçalho, cabeça da tabela'],
  ['ouro-claro', 'couro-claro', 4.5, 'botão com o mouse em cima'],
  ['couro-escuro', 'ouro-claro', 4.5, 'botão pressionado (base)'],
  ['couro-escuro', 'ouro-brilho', 4.5, 'botão pressionado (topo do degradê)'],
  ['sucesso', 'sucesso-suave', 4.5, 'aviso de sucesso'],
  ['erro', 'erro-suave', 4.5, 'aviso de erro'],
  ['aviso', 'aviso-suave', 4.5, 'aviso de atenção'],
  ['sucesso', 'folha', 4.5, 'estado no card'],
  ['erro', 'folha', 4.5, 'erro de campo no card'],
  ['aviso', 'folha', 4.5, 'atenção no card'],
  ['sucesso', 'pergaminho', 4.5, 'estado na página'],
  ['sucesso', 'pergaminho-escuro', 4.5, 'estado na linha zebrada'],
  ['erro', 'pergaminho-escuro', 4.5, 'erro na linha zebrada'],
  ['aviso', 'pergaminho-escuro', 4.5, 'atenção na linha zebrada'],
  ['erro', 'pergaminho', 4.5, 'erro na página'],
  ['aviso', 'pergaminho', 4.5, 'atenção na página'],
  ['ouro', 'pergaminho', 3, 'borda na página'],
  ['ouro', 'folha', 3, 'borda do card e do campo'],
  ['ouro', 'couro', 3, 'borda no couro'],
  ['ouro', 'couro-escuro', 3, 'borda no cabeçalho'],
  ['couro-escuro', 'pergaminho', 3, 'foco: contorno escuro na página'],
  ['couro-escuro', 'folha', 3, 'foco: contorno escuro no card'],
  ['ouro-claro', 'couro', 3, 'foco: anel dourado no couro'],
  ['ouro-claro', 'couro-escuro', 3, 'foco: anel dourado no cabeçalho'],
];

// measured on the reference images: median of the box, of its brightest or darkest 5% ("claros", "escuros"), or of its
// gold-hued pixels (hue 22° to 54°, saturation and value above 35%)
const COP = 'copilot-ui-ouro-aplicado.png';
const GPT = 'chatgpt-ui-ouro.png';
export const MEDIDAS: [hex: string, imagem: string, caixa: string, metodo: string, oQue: string, token: string][] = [
  ['#18130e', COP, '560,770 → 600,800', 'mediana', 'couro do painel do Alren', 'couro-escuro'],
  ['#17130e', COP, '1420,620 → 1490,640', 'mediana', 'couro do menu Mover/Agir', 'couro-escuro'],
  ['#2e2424', GPT, '420,180 → 620,380', 'mediana', 'couro da moldura quadrada', 'couro'],
  ['#302727', GPT, '1120,90 → 1290,120', 'mediana', 'couro do botão escuro', 'couro'],
  ['#99713d', COP, '970,825 → 1512,835', 'mediana dos dourados', 'moldura do painel Previsão', 'ouro'],
  ['#806034', COP, '30,690 → 620,705', 'mediana dos dourados', 'moldura do painel do Alren', 'ouro (mais escuro)'],
  ['#e0b268', COP, '995,838 → 1090,858', 'claros', 'rótulo "PREVISÃO"', 'ouro-claro'],
  ['#cfa464', COP, '52,36 → 118,54', 'claros', 'rótulo "TURNO"', 'ouro-claro (variante)'],
  ['#f2d489', GPT, '1100,55 → 1300,75', 'quinto mais claro dos dourados', 'aro do botão', 'ouro-brilho'],
  ['#f8dda4', COP, '240,708 → 320,740', 'claros', 'nome "Alren"', 'creme'],
  ['#ecd6b8', COP, '1290,750 → 1370,782', 'claros', 'item "Status"', 'creme (variante)'],
  ['#d5b881', COP, '1355,880 → 1490,900', 'claros', '"Custo de Movimento"', 'creme-apagado'],
  ['#8a6f41', COP, '1380,575 → 1480,610', 'mediana', 'fundo do botão Mover ativo', 'base do degradê ativo'],
  ['#0a0703', COP, '1292,578 → 1370,606', 'escuros', 'texto "Mover" no botão ativo', 'couro-escuro no ouro'],
  ['#d09a42', COP, '290,876 → 455,886', 'mediana', 'barra TC', 'origem de aviso'],
  ['#598c48', COP, '290,810 → 455,820', 'mediana', 'barra PV', 'origem de sucesso'],
  ['#3c7cc6', COP, '290,843 → 455,853', 'mediana', 'barra PM', 'origem de link'],
  ['#fc4240', GPT, '345,550 → 420,565', 'mediana', 'barra vermelha', 'origem de erro'],
  [
    '#645b56',
    GPT,
    '1120,270 → 1290,300',
    'mediana',
    'botão desligado (cinza)',
    'não usado: creme nele dá 5,0:1, creme-apagado 3,5:1',
  ],
];

// what each token of src/index.css becomes; usage counts are a grep of src (class names and var()), on 15/11
export const MAPA: [atual: string, novo: string, como: 'mesmo nome' | 'renomear' | 'novo' | 'fica', usos: string][] = [
  ['papel #f7f2e2', 'pergaminho', 'renomear', '7 classes, 6 var()'],
  ['folha #fbf8ee', 'folha #fbf5e6', 'mesmo nome', '76 classes, 7 var()'],
  ['bilhete #fbf7e8', 'folha', 'renomear', '8 classes'],
  ['cortica #efe6c8', 'pergaminho-escuro', 'renomear', '1 classe'],
  ['terra #e8e2c7', 'pergaminho-escuro', 'renomear', '11 classes, 4 var()'],
  ['mar #cfe0e0', 'mar (só o mapa dos reinos)', 'fica', '3 classes, 2 var()'],
  ['tinta #2b2a22 (texto)', 'tinta #2b2117', 'mesmo nome', '56 classes, 32 var()'],
  [
    'tinta como fundo (bg-tinta, border-tinta)',
    'couro-escuro (fotos, sobreposições) ou couro (botão ativo)',
    'renomear',
    '≈ 12 classes',
  ],
  ['apagado #57533f', 'apagado #5f4e3a', 'mesmo nome', '99 classes, 4 var()'],
  ['sobre-tinta #f3efe4', 'sobre-tinta = creme', 'mesmo nome', '11 classes, 1 var()'],
  ['borda #cfc5a5', 'borda = ouro', 'mesmo nome', '79 classes, 2 var()'],
  ['traco #8a8264', 'traco = ouro-escuro', 'mesmo nome', '21 classes, 5 var()'],
  ['run #1f6a3a', 'sucesso', 'renomear', '17 classes, 1 var()'],
  ['stop #9b2f2f', 'erro', 'renomear', '29 classes, 11 var()'],
  ['stop-soft #f8e4e1', 'erro-suave', 'renomear', '3 classes, 3 var()'],
  ['warn #8a4a00', 'aviso', 'renomear', '17 classes, 6 var()'],
  ['warn-soft #fbeedb', 'aviso-suave', 'renomear', '7 classes'],
  [
    'call #d98a2b (foco, ponto pulsando)',
    'ouro-claro; o foco passa a --foco-contorno + --foco-anel',
    'renomear',
    '5 classes, 4 var()',
  ],
  ['wait #2f5f8a', 'link', 'renomear', '1 classe'],
  ['subs #1d5fa6', 'link', 'renomear', '1 classe, 3 var()'],
  ['idle #6b665a', 'apagado', 'renomear', '2 classes'],
  ['(novo)', 'couro, couro-escuro, couro-claro: cabeçalho e barra lateral', 'novo', '0'],
  ['(novo)', 'ouro, ouro-claro, ouro-brilho, ouro-escuro, creme, creme-apagado', 'novo', '0'],
  ['--lab, --lab-soft (lib/labs.ts)', 'iguais; ver contraste abaixo', 'fica', '109 + 21 classes'],
  [
    '--font-serif Cormorant Garamond',
    '--font-serif Cinzel (Cormorant de reserva)',
    'mesmo nome',
    'h1 a h3 e font-serif',
  ],
  ['--font-sans Karla', '--font-sans Alegreya Sans', 'mesmo nome', 'o corpo todo'],
  ['--radius 3px', '--radius 2px', 'mesmo nome', 'shadcn (rounded-sm/md/lg)'],
  ['--breakpoint-desk/wide/ultra, --reino-h, --nav-h', 'iguais', 'fica', 'casca'],
  ['--margem, --h1 (por faixa)', 'iguais; somam --texto, --h2, --h3, --legenda, --respiro', 'mesmo nome', 'casca'],
  ['--casca-topo = tinta', '= couro-escuro', 'mesmo nome', 'cabeçalho (TopBar)'],
  ['--casca-topo-texto = sobre-tinta', '= creme', 'mesmo nome', 'cabeçalho'],
  [
    '--casca-lateral = folha',
    '= couro; o texto do menu (text-tinta, text-apagado, hover:bg-lab-soft em Paginas.tsx e Navegacao.tsx) precisa ir para creme, creme-apagado e couro-claro',
    'mesmo nome',
    'barra lateral',
  ],
  ['--casca-borda = --lab', '= ouro', 'mesmo nome', 'borda da barra lateral'],
  ['--casca-titulo = tinta', '= ouro-claro', 'mesmo nome', 'título da barra lateral'],
  ['--ring = call', '--ring = couro-escuro', 'mesmo nome', 'shadcn'],
  ['--primary = tinta', '--primary = couro', 'mesmo nome', 'botão shadcn'],
  ['--secondary/--muted/--accent = terra', '= pergaminho-escuro', 'mesmo nome', 'shadcn'],
  ['--border/--input = borda/traco', '= ouro', 'mesmo nome', 'shadcn'],
];
