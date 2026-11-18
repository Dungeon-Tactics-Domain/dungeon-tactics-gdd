# Design lab (migrated from dungeon-tactics-lab/design)

Copied on 2026-11-14 at 23:37:51 (-03:00), recopied three times on 2026-11-15 (AI tests and images at 10:47; the lab's tab reorganisation at 11:07:40; the expression bench's
official version D and kept moment, the SDXL pixelizer rows and the regenerated `ia-alinhado-rosto` sheets at 14:14, -03:00) from a snapshot of `D:\Projetos\dungeon-tactics-lab\design` and
`D:\Projetos\dungeon-tactics-lab\public\design`, while the lab's own session was still editing it.

## Where things are

- `manifest.ts`: the page tree. Since 15/11 it mirrors the old lab's tabs: each tab is a group and each section a page, with
  the same ids, so `#/interface/em-uso`, `#/personagens/em-uso`... open the same page here (`Paginas` turns `#/a/b` into
  `/design/a/b`). The old "Início" tab is the lab home (`inicio.mdx`: "Em uso agora" and "Agora estamos decidindo").
  The games under `referencias` keep their `capturas-N` subpages (blocks of 2, as the old lab does).
- `dados.ts`: typed access to `plano.json` (the open question and next step), `ia.json` (AI tests, prompts already expanded),
  and `refs/*.json` (one file per game, copied as they were; since 17/11 only `fft-ivalice`).
- `components/`: `Decisoes`, `Referencias` (overview with filters, game intro, capture blocks), `Ia` (tests by subject,
  per platform, grouped by conversation; featured pick; platforms table), `Cartoes` + `Leitor` (cards and the full-screen
  reader), `KitFft` + `fft-kit.css`, `Rostos`, `EmUso`, `Icones`, `Expressoes` + `expressoes.css`.
- On 17/11 the AI test pages (`interface/testes`, `personagens/testes`, `personagens/sprites`, `mapa/testes`,
  `plano/plataformas`) were archived in `docs/arquivo-assets-ia/` for a future "Assets de IA" component; `Ia`, `Cartoes`
  and `Leitor` stay here with no page. The theme plan (`plano/tema`) and the screen mock-ups (`interface/telas`) were removed.
- Later on 17/11 the "Ouro e couro" asset tests (`interface/ui-ouro-couro`, `interface/paineis-css`, `interface/hud-fft`)
  joined that archive; `UiOuroCouro`, `PaineisCss` and `HudFft` stay here with no page. The plan group (`plano/fases`,
  `plano/pedidos`, `plano/decisoes`) was removed (`plano.json` keeps only what the home shows), and the town draft
  (`mapa/cidade`, with `Cidade.tsx` and `cidade.ts`) moved to the narrative lab, which removed it on 18/11.
- The `.mdx` pages are a component call. A page with a new route needs its
  `.mdx`: `registry.test.tsx` fails on a page without one and on an orphan file.
- Old paths of the first copy (`/design/decisoes/...`, `/design/testes-de-ia/...`, `/design/maquetes/...`) no longer
  exist; only the old anchors (`#fases`, `#maquetes`, `#ia`...) redirect, through `linksAntigos`.

## Local files (not in git)

`public/content/design/.gitignore` keeps every `.jpg`, `.jpeg` and `.png` out of git: captures of other games stay on
this PC only (grill decision of 13/11). Copy them from the old lab:

| Folder in `public/content/design/` | From `D:\Projetos\dungeon-tactics-lab\public\design\`                                         | Files  |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| `refs/fft-ivalice/`                | `refs/fft-ivalice/` (the other 9 games' pages were removed on 17/11)                          | 16     |
| `ia/`                              | `ia/`, top-level files (AI images, `cena-colina.jpg`)                                         | 100    |
| `ia/icones/`, `ia/atlas/`          | `ia/icones/`, `ia/atlas/` (PNG only; the `.json` files are read by no page)                   | 57, 10 |
| `chars/ia*/`                       | `chars/ia`, `ia-boca`, `ia-pixel2`, `ia-alinhado`, `ia-alinhado-rosto` (AI expression sheets) | 35     |
| `cenas/`                           | `cenas/cena-colina.jpg` (game capture behind the taste decisions)                             | 1      |
| `chars/px/`                        | `chars/px/` (pixel faces made by the game's script)                                           | 10     |

`icons.svg` (the game's sprite, game-icons.net CC BY 3.0) is versioned.

## Recopying

Dump the data again by running the old TS with Node (it strips types): import `PLATFORMS`, `NOT_RUN`, `FEATURED`,
`GEMINI_SUBS` from a copy of `ia.ts` (add an export line), `NOW`, `NEXT_STEP`, `DECISIONS`, `PHASES`, `REQUESTS` from
`data/plan.ts`, and write the two JSON files; copy
`data/refs/*.json` and the images; add the `.mdx` of any new route.
