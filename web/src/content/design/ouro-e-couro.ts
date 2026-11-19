// Data of the "Ouro e couro" page: the site's own tokens. The colours are read from src/index.css (the only source: the
// @theme block is the light theme, the [data-theme='dark'] block redefines the same names), and the contrast is WCAG 2.x
// relative luminance computed here for both themes.
import INDEX_CSS from '../../index.css?raw';

// the header and the blocks carry comments with "@theme" and ":root" in them
const CSS = INDEX_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

type Mapa = Record<string, string>;
const tokens = (bloco: string, prefixo: string): Mapa =>
  Object.fromEntries(
    [...bloco.matchAll(new RegExp(String.raw`--${prefixo}-([\w-]+):\s*([^;]+);`, 'g'))].map((m) => [
      m[1]!,
      m[2]!.trim(),
    ]),
  );

// the first @theme block (surfaces, text, states) and the dark block of the header switch; a name the dark block leaves out
// keeps its light value
const LUZ = CSS.slice(CSS.indexOf('@theme {'), CSS.indexOf(':root {'));
const ESCURO = CSS.slice(CSS.indexOf(":root[data-theme='dark'] {"), CSS.indexOf('.daw {'));

function resolver(cru: Mapa): Mapa {
  const valor = (v: string): string => {
    const alias = /^var\(--color-([\w-]+)\)$/.exec(v);
    return alias ? valor(cru[alias[1]!]!) : v;
  };
  return Object.fromEntries(Object.entries(cru).map(([k, v]) => [k, valor(v)]));
}
const claro = tokens(LUZ, 'color');

/** `--color-*` per theme, aliases (`var(--color-x)`) resolved. */
export const CORES: { claro: Mapa; escuro: Mapa } = {
  claro: resolver(claro),
  escuro: resolver({ ...claro, ...tokens(ESCURO, 'color') }),
};

/** Text, title, margin and gap sizes (px) per screen band: the :root values, then each min-width @media block on top. */
export const FAIXAS_TOKENS: Record<string, number>[] = (() => {
  const blocos = [CSS.slice(CSS.indexOf(':root {'), CSS.indexOf('@media'))].concat(
    [...CSS.matchAll(/@media \(min-width: \d+px\) \{([\s\S]*?\n\})/g)].map((m) => m[1]!),
  );
  let atual: Record<string, number> = {};
  return blocos.map(
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

/** `color-mix(in srgb, a pct%, b)` as hex: the dark lab tones of index.css are built this way. */
export function misturar(a: string, pct: number, b: string) {
  const canal = (i: number) =>
    Math.round(parseInt(a.slice(i, i + 2), 16) * pct + parseInt(b.slice(i, i + 2), 16) * (1 - pct))
      .toString(16)
      .padStart(2, '0');
  return `#${canal(1)}${canal(3)}${canal(5)}`;
}

// [text or element, background, minimum, what it is]; 4.5 for text, 3 for borders and focus (WCAG 1.4.3 and 1.4.11).
// A gold border on leather is not a pair: the dark theme turns leather light, where gold drops to about 2:1 (measured
// 19/11), so the shell's edges there are the --roll-grade and --casca-borda lines, not a contrast claim.
// Pairs follow the roles of the names, not the shade: in the dark theme "couro" is the light one and "creme" the dark.
export const PARES: [frente: string, fundo: string, minimo: number, uso: string][] = [
  ['tinta', 'pergaminho', 4.5, 'texto da página'],
  ['tinta', 'folha', 4.5, 'texto do card'],
  ['tinta', 'campo', 4.5, 'texto digitado no campo'],
  ['tinta', 'pergaminho-escuro', 4.5, 'etiqueta, linha zebrada da tabela'],
  ['apagado', 'pergaminho', 4.5, 'texto secundário'],
  ['apagado', 'folha', 4.5, 'texto secundário no card'],
  ['apagado', 'pergaminho-escuro', 4.5, 'botão desligado'],
  ['ouro-escuro', 'pergaminho', 4.5, 'título na página'],
  ['ouro-escuro', 'folha', 4.5, 'título no card'],
  ['link', 'pergaminho', 4.5, 'link na página'],
  ['link', 'folha', 4.5, 'link no card'],
  ['link', 'link-suave', 4.5, 'rótulo em fundo de link'],
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
  ['erro', 'pergaminho', 4.5, 'erro na página'],
  ['aviso', 'pergaminho', 4.5, 'atenção na página'],
  ['ouro', 'pergaminho', 3, 'borda na página'],
  ['ouro', 'folha', 3, 'borda do card e do campo'],
  ['couro', 'folha', 3, 'borda escura do card e do campo (--input)'],
  ['couro-escuro', 'pergaminho', 3, 'foco: contorno na página'],
  ['couro-escuro', 'folha', 3, 'foco: contorno no card'],
  ['ouro-claro', 'couro', 3, 'foco: anel no couro'],
  ['ouro-claro', 'couro-escuro', 3, 'foco: anel no cabeçalho'],
];
