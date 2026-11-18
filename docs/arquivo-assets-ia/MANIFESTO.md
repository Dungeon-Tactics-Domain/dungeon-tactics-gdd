# Manifesto: páginas de assets de IA retiradas do lab de design (17/11)

Gerado de `manifesto.json` (mesmos dados). Commit base: `db8cebd`. Revisão de design: as páginas de testes de IA saem do site e serão reunidas num componente único "Assets de IA", por categorias.

Totais: 5 páginas, 98 imagens distintas (97.7 MB); a pasta `web/public/content/design/ia/` inteira tem 100.5 MB, contando `icones/` e `atlas/`, que outras páginas usam.

Segundo lote, mesmo dia (commit base `4590546`): 3 páginas de assets Ouro e couro (Gemini e PixelLab), 15 imagens distintas (5.5 MB). A pasta `web/public/content/design/pixellab/` inteira tem 18 arquivos e 8.9 MB; na pasta e sem página: `hud-fft-folha-alfa.png`, `ui-gem-lote2-botoes-alfa.png`, `ui-gem-lote5-hud-fft-alfa.png`.

## Testes de IA: interface

- Rota antiga: `/design/interface/testes`
- Grupo e id no manifest: `interface` / `testes` (depois de hud-fft, antes de redesign-responsivo)
- Resumo: Folhas de elementos e a interface aplicada sobre o jogo.
- Componentes: `<IaDestaque />`, `<IaAssunto ids={['folhas','aplicados','fft','icones']} />` (de `web/src/content/design/components/Ia.tsx`)
- Dados: web/src/content/design/ia.json (cópia em dados/ia.json); campos: platforms[].tests (file, title, size, attached, link, prompt, good, bad); featured; subs
- Imagens: 35 (28.6 MB), todas no disco

Corpo `.mdx` (cópia em `paginas/interface/testes.mdx`):

```mdx
import { IaAssunto, IaDestaque } from "../components/Ia";

### Destaque: FFT Clássico

<IaDestaque />

<IaAssunto ids={["folhas", "aplicados", "fft", "icones"]} />
```

| Arquivo                                     | Plataforma           | Assunto   | KB   |
| ------------------------------------------- | -------------------- | --------- | ---- |
| `gemini-ui-kit-v1.png`                      | Gemini (Nano Banana) | folhas    | 154  |
| `gemini-ui-estilo1.png`                     | Gemini (Nano Banana) | folhas    | 397  |
| `gemini-ui-estilo2.png`                     | Gemini (Nano Banana) | folhas    | 432  |
| `gemini-ui-estilo3.png`                     | Gemini (Nano Banana) | folhas    | 359  |
| `gemini-ui-ouro-aplicado.png`               | Gemini (Nano Banana) | aplicados | 507  |
| `gemini-ui-vitral-aplicado.png`             | Gemini (Nano Banana) | aplicados | 499  |
| `gemini-ui-grimorio-aplicado.png`           | Gemini (Nano Banana) | aplicados | 525  |
| `gemini-ui-carta-aplicado.png`              | Gemini (Nano Banana) | aplicados | 390  |
| `gemini-fft-ivalice.png`                    | Gemini (Nano Banana) | fft       | 154  |
| `gemini-fft-ivalice-aplicado.png`           | Gemini (Nano Banana) | fft       | 437  |
| `gemini-fft-classico.png`                   | Gemini (Nano Banana) | fft       | 163  |
| `gemini-fft-classico-aplicado.png`          | Gemini (Nano Banana) | fft       | 451  |
| `gemini-fft-1-paineis.png`                  | Gemini (Nano Banana) | fft       | 232  |
| `gemini-fft-2-ficha-unidade.png`            | Gemini (Nano Banana) | fft       | 267  |
| `gemini-fft-3-menu-habilidades.png`         | Gemini (Nano Banana) | fft       | 371  |
| `pixellab-ui-1.png`                         | PixelLab (pixel art) | folhas    | 38   |
| `pixellab-ui-2.png`                         | PixelLab (pixel art) | folhas    | 30   |
| `pixellab-ui-3.png`                         | PixelLab (pixel art) | folhas    | 15   |
| `chatgpt-ui-ouro.png`                       | ChatGPT (GPT Image)  | folhas    | 1726 |
| `copilot-ui-ouro.png`                       | Copilot (Microsoft)  | folhas    | 1951 |
| `copilot-loop-0-ouro-aplicado.png`          | Copilot (Microsoft)  | aplicados | 2183 |
| `copilot-fft-1-paineis.png`                 | Copilot (Microsoft)  | fft       | 1012 |
| `copilot-fft-2-ficha.png`                   | Copilot (Microsoft)  | fft       | 1157 |
| `copilot-fft-3-menu.png`                    | Copilot (Microsoft)  | fft       | 1051 |
| `copilot-icones-1-habilidades.png`          | Copilot (Microsoft)  | icones    | 1159 |
| `copilot-icones-1-habilidades-recorte.png`  | Copilot (Microsoft)  | icones    | 98   |
| `copilot-icones-2-itens-status.png`         | Copilot (Microsoft)  | icones    | 1233 |
| `copilot-icones-2-itens-status-recorte.png` | Copilot (Microsoft)  | icones    | 97   |
| `copilot-ui-ouro-aplicado.png`              | Copilot (Microsoft)  | aplicados | 1845 |
| `copilot-ui-vitral.png`                     | Copilot (Microsoft)  | folhas    | 2537 |
| `copilot-ui-vitral-aplicado.png`            | Copilot (Microsoft)  | aplicados | 1942 |
| `copilot-ui-grimorio.png`                   | Copilot (Microsoft)  | folhas    | 2472 |
| `copilot-ui-carta.png`                      | Copilot (Microsoft)  | folhas    | 1356 |
| `copilot-ui-carta-aplicado.png`             | Copilot (Microsoft)  | aplicados | 1862 |
| `craiyon-fft-1-paineis.png`                 | Craiyon (sem login)  | fft       | 186  |

Caminhos relativos a `web/public/content/design/ia/`.

## Testes de IA: rostos

- Rota antiga: `/design/personagens/testes`
- Grupo e id no manifest: `personagens` / `testes` (depois de expressoes)
- Resumo: Retratos por plataforma e por estilo.
- Componentes: `<IaAssunto ids={['rostos']} />` (de `web/src/content/design/components/Ia.tsx`)
- Dados: web/src/content/design/ia.json (cópia em dados/ia.json); campos: platforms[].tests; subs
- Imagens: 32 (37.9 MB), todas no disco

Corpo `.mdx` (cópia em `paginas/personagens/testes.mdx`):

```mdx
import { IaAssunto } from "../components/Ia";

<IaAssunto ids={["rostos"]} />
```

| Arquivo                                              | Plataforma           | Assunto | KB   |
| ---------------------------------------------------- | -------------------- | ------- | ---- |
| `gemini-fft-rostos-1-folha.png`                      | Gemini (Nano Banana) | rostos  | 905  |
| `gemini-rostos-conversa-errada-ivalice.png`          | Gemini (Nano Banana) | rostos  | 845  |
| `gemini-fft-rostos-2-barbaro.png`                    | Gemini (Nano Banana) | rostos  | 908  |
| `gemini-fft-rostos-3-cavaleiro.png`                  | Gemini (Nano Banana) | rostos  | 972  |
| `gemini-fft-rostos-4-lanceiro.png`                   | Gemini (Nano Banana) | rostos  | 814  |
| `gemini-fft-rostos-3b-cavaleiro.png`                 | Gemini (Nano Banana) | rostos  | 818  |
| `copilot-ref-retratos-1-folha.png`                   | Copilot (Microsoft)  | rostos  | 1295 |
| `copilot-ref-retratos-2-barbaro.png`                 | Copilot (Microsoft)  | rostos  | 1276 |
| `copilot-ref-retratos-3-cavaleiro.png`               | Copilot (Microsoft)  | rostos  | 1289 |
| `copilot-ref-retratos-4-lanceiro.png`                | Copilot (Microsoft)  | rostos  | 1307 |
| `copilot-ref-retratos-5-maga.png`                    | Copilot (Microsoft)  | rostos  | 1238 |
| `copilot-ref-retratos-6-arqueira.png`                | Copilot (Microsoft)  | rostos  | 1278 |
| `copilot-ref-retratos-7-ladino.png`                  | Copilot (Microsoft)  | rostos  | 1134 |
| `copilot-ref-retratos-8-esqueleto-mago.png`          | Copilot (Microsoft)  | rostos  | 1272 |
| `copilot-ref-retratos-9-lacaio-de-osso.png`          | Copilot (Microsoft)  | rostos  | 1187 |
| `copilot-ref-retratos-10-esqueleto-ladino.png`       | Copilot (Microsoft)  | rostos  | 1130 |
| `copilot-ref-retratos-11-esqueleto-guerreiro.png`    | Copilot (Microsoft)  | rostos  | 1366 |
| `copilot-ref-retratos-12-folha-moldura-fina.png`     | Copilot (Microsoft)  | rostos  | 1384 |
| `copilot-ref-retratos-13-maga-rotulos.png`           | Copilot (Microsoft)  | rostos  | 1286 |
| `copilot-ref-retratos-13-maga-rotulos-fala-anim.gif` | Copilot (Microsoft)  | rostos  | 275  |
| `copilot-ref-retratos-14-barbaro.png`                | Copilot (Microsoft)  | rostos  | 1599 |
| `copilot-ref-retratos-15-cavaleiro.png`              | Copilot (Microsoft)  | rostos  | 1374 |
| `copilot-ref-retratos-16-lanceiro.png`               | Copilot (Microsoft)  | rostos  | 1408 |
| `copilot-ref-retratos-17-arqueira.png`               | Copilot (Microsoft)  | rostos  | 1455 |
| `copilot-ref-retratos-18-ladino.png`                 | Copilot (Microsoft)  | rostos  | 1247 |
| `copilot-ref-retratos-19-esqueleto-mago.png`         | Copilot (Microsoft)  | rostos  | 1341 |
| `copilot-vitral-rostos-1-folha.png`                  | Copilot (Microsoft)  | rostos  | 1557 |
| `copilot-vitral-rostos-2-barbaro.png`                | Copilot (Microsoft)  | rostos  | 1608 |
| `copilot-vitral-rostos-3-cavaleiro.png`              | Copilot (Microsoft)  | rostos  | 1554 |
| `copilot-vitral-rostos-4-lanceiro.png`               | Copilot (Microsoft)  | rostos  | 1530 |
| `copilot-vitral-rostos-5-maga.png`                   | Copilot (Microsoft)  | rostos  | 1441 |
| `copilot-rosto-mage.png`                             | Copilot (Microsoft)  | rostos  | 695  |

Caminhos relativos a `web/public/content/design/ia/`.

## Testes de IA: sprites

- Rota antiga: `/design/personagens/sprites`
- Grupo e id no manifest: `personagens` / `sprites` (depois de testes)
- Resumo: Bonecos andando e atacando (prova de conceito).
- Componentes: `<IaAssunto ids={['sprites']} />` (de `web/src/content/design/components/Ia.tsx`)
- Dados: web/src/content/design/ia.json (cópia em dados/ia.json); campos: platforms[].tests; subs
- Imagens: 24 (24.4 MB), todas no disco

Corpo `.mdx` (cópia em `paginas/personagens/sprites.mdx`):

```mdx
import { IaAssunto } from "../components/Ia";

<IaAssunto ids={["sprites"]} />
```

| Arquivo                                         | Plataforma          | Assunto | KB   |
| ----------------------------------------------- | ------------------- | ------- | ---- |
| `copilot-sprite-1-cavaleiro.png`                | Copilot (Microsoft) | sprites | 1349 |
| `copilot-sprite-1-cavaleiro-anim.gif`           | Copilot (Microsoft) | sprites | 550  |
| `copilot-sprite-2-maga.png`                     | Copilot (Microsoft) | sprites | 1475 |
| `copilot-sprite-2-maga-anim.gif`                | Copilot (Microsoft) | sprites | 577  |
| `copilot-sprite-3-esqueleto-guerreiro.png`      | Copilot (Microsoft) | sprites | 1569 |
| `copilot-sprite-3-esqueleto-guerreiro-anim.gif` | Copilot (Microsoft) | sprites | 647  |
| `copilot-sprite-4-arqueira.png`                 | Copilot (Microsoft) | sprites | 1570 |
| `copilot-sprite-4-arqueira-anim.gif`            | Copilot (Microsoft) | sprites | 666  |
| `copilot-sprite-5-barbaro.png`                  | Copilot (Microsoft) | sprites | 1727 |
| `copilot-sprite-5-barbaro-anim.gif`             | Copilot (Microsoft) | sprites | 735  |
| `copilot-sprite-6-lanceiro.png`                 | Copilot (Microsoft) | sprites | 1614 |
| `copilot-sprite-6-lanceiro-anim.gif`            | Copilot (Microsoft) | sprites | 667  |
| `copilot-sprite-7-ladino.png`                   | Copilot (Microsoft) | sprites | 1544 |
| `copilot-sprite-7-ladino-anim.gif`              | Copilot (Microsoft) | sprites | 517  |
| `copilot-sprite-8-esqueleto-mago.png`           | Copilot (Microsoft) | sprites | 1639 |
| `copilot-sprite-8-esqueleto-mago-anim.gif`      | Copilot (Microsoft) | sprites | 636  |
| `copilot-sprite-9-lacaio-de-osso.png`           | Copilot (Microsoft) | sprites | 1433 |
| `copilot-sprite-9-lacaio-de-osso-anim.gif`      | Copilot (Microsoft) | sprites | 526  |
| `copilot-sprite-10-esqueleto-ladino.png`        | Copilot (Microsoft) | sprites | 1583 |
| `copilot-sprite-10-esqueleto-ladino-anim.gif`   | Copilot (Microsoft) | sprites | 561  |
| `copilot-sprite-11-elenco-anim.gif`             | Copilot (Microsoft) | sprites | 620  |
| `copilot-sprite-12-cena-batalha.png`            | Copilot (Microsoft) | sprites | 421  |
| `copilot-sprite-12-cena-batalha-anim.gif`       | Copilot (Microsoft) | sprites | 458  |
| `copilot-sprite-13-atlas.png`                   | Copilot (Microsoft) | sprites | 1888 |

Caminhos relativos a `web/public/content/design/ia/`.

## Testes de IA: cenas e terreno

- Rota antiga: `/design/mapa/testes`
- Grupo e id no manifest: `mapa` / `testes` (depois de cidade)
- Resumo: Ainda sem peça aprovada para o mapa.
- Componentes: `<IaAssunto ids={['cenas','terreno']} />` (de `web/src/content/design/components/Ia.tsx`)
- Dados: web/src/content/design/ia.json (cópia em dados/ia.json); campos: platforms[].tests; subs
- Imagens: 7 (6.8 MB), todas no disco

Corpo `.mdx` (cópia em `paginas/mapa/testes.mdx`):

```mdx
import { IaAssunto } from "../components/Ia";

<IaAssunto ids={["cenas", "terreno"]} />
```

| Arquivo                             | Plataforma           | Assunto | KB   |
| ----------------------------------- | -------------------- | ------- | ---- |
| `gemini-cena-do-zero-v1.png`        | Gemini (Nano Banana) | cenas   | 507  |
| `gemini-C-v1.png`                   | Gemini (Nano Banana) | cenas   | 402  |
| `gemini-C-v2.png`                   | Gemini (Nano Banana) | cenas   | 403  |
| `chatgpt-cena.png`                  | ChatGPT (GPT Image)  | cenas   | 2734 |
| `copilot-terreno-1-blocos.png`      | Copilot (Microsoft)  | terreno | 1309 |
| `copilot-terreno-1-blocos-mapa.png` | Copilot (Microsoft)  | terreno | 303  |
| `copilot-terreno-2-objetos.png`     | Copilot (Microsoft)  | terreno | 1290 |

Caminhos relativos a `web/public/content/design/ia/`.

## Plataformas de IA

- Rota antiga: `/design/plano/plataformas`
- Grupo e id no manifest: `plano` / `plataformas` (último do grupo plano)
- Resumo: Limites e contas de cada gerador; as imagens ficam nas páginas, por assunto.
- Componentes: `<IaPlataformas />` (de `web/src/content/design/components/Ia.tsx`)
- Dados: web/src/content/design/ia.json (cópia em dados/ia.json); campos: platforms[].name; platforms[].plan; platforms[].tests.length; notRun
- Imagens: 0 (0 MB), todas no disco

Corpo `.mdx` (cópia em `paginas/plano/plataformas.mdx`):

```mdx
import { IaPlataformas } from "../components/Ia";

<IaPlataformas />
```

## Ouro e couro: assets (Gemini e PixelLab)

- Rota antiga: `/design/interface/ui-ouro-couro`
- Grupo e id no manifest: `interface` / `ui-ouro-couro` (depois de icones, antes de paineis-css)
- Resumo: Todos os elementos de interface no estilo escolhido, em lotes, com o que foi enviado e o que saiu.
- Componentes: `<UiOuroCouro />` (de `web/src/content/design/components/UiOuroCouro.tsx`, continua no código)
- Dados: inline em web/src/content/design/components/UiOuroCouro.tsx; LOTES (titulo, pecas, gemini/pixellab {arquivo, legenda}, nota, links), inline no componente
- Imagens: 5 (3.2 MB), todas no disco
- Citadas só no texto (não aparecem na página): `ui-gem-lote1-paineis-alfa.png` (567 KB), `ui-gem-lote2-botoes-alfa.png` (679 KB)
- Conversas e ferramentas: https://gemini.google.com/app/f89699541bc67f34, https://gemini.google.com/app/f6dd7f4523c7cc40, https://www.pixellab.ai/create?tool=create_ui_pro

Corpo `.mdx` (cópia em `paginas/interface/ui-ouro-couro.mdx`):

```mdx
import { UiOuroCouro } from "../components/UiOuroCouro";

<UiOuroCouro />
```

| Arquivo                         | Plataforma                 | KB   |
| ------------------------------- | -------------------------- | ---- |
| `ui-ref-ouro-aplicado.png`      | Copilot (Microsoft)        | 1845 |
| `ui-gem-lote1-paineis-full.png` | Gemini (Nano Banana)       | 552  |
| `ui-pl-painel-1.png`            | PixelLab (UI Elements Pro) | 23   |
| `ui-gem-lote2-botoes-full.png`  | Gemini (Nano Banana)       | 667  |
| `ui-pl-menu-acoes-1.png`        | PixelLab (UI Elements Pro) | 53   |

Caminhos relativos a `web/public/content/design/pixellab/` (fora do git; só no disco do checkout principal).

## Painéis e menu Ouro e couro em CSS

- Rota antiga: `/design/interface/paineis-css`
- Grupo e id no manifest: `interface` / `paineis-css` (depois de ui-ouro-couro, antes de hud-fft)
- Resumo: Os painéis, molduras, aba, banner e divisor refeitos em CSS puro, ao lado da folha do Gemini.
- Componentes: `<PaineisCss />` (de `web/src/content/design/components/PaineisCss.tsx`, continua no código)
- Dados: inline em web/src/content/design/components/PaineisCss.tsx; CSS inline no componente (classes .oc, .oc-retrato, .oc-aba, .oc-banner, .oc-gema, .oc-divisor, .mn); ITENS (ícone, nome) do menu de ações
- Imagens: 8 (0.8 MB), todas no disco

Corpo `.mdx` (cópia em `paginas/interface/paineis-css.mdx`):

```mdx
import { PaineisCss } from "../components/PaineisCss";

<PaineisCss />
```

| Arquivo                         | Plataforma                 | KB  |
| ------------------------------- | -------------------------- | --- |
| `ui-pl-menu-bota-v2.png`        | PixelLab (UI Elements Pro) | 1   |
| `ui-pl-menu-espada-v2.png`      | PixelLab (UI Elements Pro) | 2   |
| `ui-pl-menu-ampulheta-v2.png`   | PixelLab (UI Elements Pro) | 2   |
| `ui-pl-menu-pergaminho-v2.png`  | PixelLab (UI Elements Pro) | 1   |
| `ui-pl-menu-mao-v2.png`         | PixelLab (UI Elements Pro) | 1   |
| `ui-ref-menu-acoes.png`         | Captura do jogo            | 141 |
| `ui-pl-menu-acoes-1.png`        | PixelLab (UI Elements Pro) | 53  |
| `ui-gem-lote1-paineis-alfa.png` | Gemini (Nano Banana)       | 567 |

Caminhos relativos a `web/public/content/design/pixellab/` (fora do git; só no disco do checkout principal).

## HUD do FFT em couro e ouro

- Rota antiga: `/design/interface/hud-fft`
- Grupo e id no manifest: `interface` / `hud-fft` (depois de paineis-css, antes de redesign-responsivo)
- Resumo: A tela de batalha do FFT refeita no Ouro e couro, uma peça por vez, cada uma em sua conversa do Gemini.
- Componentes: `<HudFft />` (de `web/src/content/design/components/HudFft.tsx`, continua no código)
- Dados: inline em web/src/content/design/components/HudFft.tsx; Slot (arquivo, nome): a imagem, ou "aguardando" quando o arquivo falta
- Imagens: 3 (1.6 MB), todas no disco
- Citadas só no texto (não aparecem na página): `hud-fft-folha-alfa.png` (1321 KB)
- Conversas e ferramentas: https://gemini.google.com/app/646cdf534d0f3014

Corpo `.mdx` (cópia em `paginas/interface/hud-fft.mdx`):

```mdx
import { HudFft } from "../components/HudFft";

<HudFft />
```

| Arquivo                         | Plataforma           | KB  |
| ------------------------------- | -------------------- | --- |
| `hud-ref-fft-tela.jpg`          | Captura do jogo      | 515 |
| `ui-gem-lote5-hud-fft-full.jpg` | Gemini (Nano Banana) | 603 |
| `hud-ficha-1.jpg`               | Gemini (Nano Banana) | 435 |

Caminhos relativos a `web/public/content/design/pixellab/` (fora do git; só no disco do checkout principal).
