# Arquivo dos assets de IA do lab de design (páginas retiradas em 17/11)

Em 17/11 o Fernando pediu para enxugar o site para a revisão de design. As cinco páginas de testes de IA saíram do site
e ficam guardadas aqui, provisoriamente: depois elas serão reunidas num componente único "Assets de IA", por
categorias, no novo design system. Esta pasta fica fora do build: o app só lê `web/src/content`.

## O que saiu

5 páginas do lab Design (rotas `/design/...`), commit base `db8cebd`:

- `interface/testes`: Testes de IA: interface (destaque FFT Clássico, folhas, aplicados, FFT, ícones)
- `personagens/testes`: Testes de IA: rostos
- `personagens/sprites`: Testes de IA: sprites
- `mapa/testes`: Testes de IA: cenas e terreno
- `plano/plataformas`: Plataformas de IA (tabela de contas e limites, sem imagens)

Mais tarde no mesmo dia, 3 páginas de assets Ouro e couro (commit base `4590546`):

- `interface/ui-ouro-couro`: Ouro e couro: assets (Gemini e PixelLab), os lotes de painéis e botões
- `interface/paineis-css`: Painéis e menu Ouro e couro em CSS (CSS puro ao lado da folha do Gemini)
- `interface/hud-fft`: HUD do FFT em couro e ouro (a tela do FFT peça por peça)

## O que tem aqui

- `MANIFESTO.md`: uma seção por página, com rota antiga, título, resumo, posição no manifest, componente e props,
  dados e campos usados, o corpo `.mdx` completo e a lista de imagens (plataforma, assunto, tamanho).
- `manifesto.json`: os mesmos dados em formato de máquina, mais os totais.
- `paginas/<grupo>/<id>.mdx`: cópias idênticas dos `.mdx` originais.
- `dados/ia.json`: cópia de `web/src/content/design/ia.json` como estava. O original continua no código, porque os
  componentes ainda o leem.

## O que continua no código

Base do futuro componente "Assets de IA", só sem página:

- `web/src/content/design/components/Ia.tsx`: `IaDestaque`, `IaAssunto({ ids })`, `IaPlataformas`.
- `web/src/content/design/components/Cartoes.tsx` (`CartoesIa`) e `Leitor.tsx` (leitor em tela cheia).
- `web/src/content/design/dados.ts`: `IA`, `iaSub` (assunto pelo nome do arquivo), `porConversa`, `estiloDe`, `contagem`.
- Os testes desses componentes em `design.test.tsx` continuam rodando.
- `web/src/content/design/components/UiOuroCouro.tsx` (`UiOuroCouro`: lotes, legendas e links das conversas),
  `PaineisCss.tsx` (`PaineisCss`: os painéis e o menu em CSS puro, com o CSS dentro do componente) e `HudFft.tsx`
  (`HudFft`). Sem teste próprio. O `ouro-e-couro.css` não é delas: é da página viva `interface/ouro-e-couro`.

## Onde estão as imagens (nada foi apagado)

As imagens não estão no git (`web/public/content/design/.gitignore` ignora `.png` e `.jpg`) e ficaram no disco, intactas,
em `D:\Projetos\dungeon-tactics-labs\web\public\content\design\ia\`: 98 imagens distintas, 97,7 MB, todas presentes em
17/11. A pasta inteira tem 100,5 MB porque inclui `icones/` e `atlas/`, que outras páginas (ícones, kit FFT) usam.
O `MANIFESTO.md` lista cada arquivo por página.

As imagens Ouro e couro ficam, também fora do git, em
`D:\Projetos\dungeon-tactics-labs\web\public\content\design\pixellab\`: 15 imagens distintas nas 3 páginas, 5,5 MB;
a pasta tem 18 arquivos e 8,9 MB (3 recortes `*-alfa.png` sem página, 2 deles só citados no texto).

## Como recolocar uma página

1. Copie `paginas/<grupo>/<id>.mdx` (as 3 de Ouro e couro estão em `paginas/interface/`) para `web/src/content/design/<grupo>/<id>.mdx`.
2. Em `web/src/content/design/manifest.ts`, devolva a entrada da página ao grupo, na posição indicada no `MANIFESTO.md`,
   com o `id`, `titulo` e `resumo` de `manifesto.json`.
3. Para `interface/testes`, se quiser os links antigos de volta, aponte `testes-de-ia` e `ia` em `linksAntigos` para
   `interface/testes` (hoje apontam para `interface`).
4. Ajuste a contagem de páginas por grupo em `web/src/content/design/components/design.test.tsx`.
5. Rode `npx tsc -b` e `npx vitest run src/content`: o `registry.test.tsx` falha se uma página não tiver `.mdx` ou se
   um `.mdx` sobrar sem página.
