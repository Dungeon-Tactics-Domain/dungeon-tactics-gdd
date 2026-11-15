# Design lab (migrated from dungeon-tactics-lab/design)

Copied on 2026-11-14 at 23:37:51 (-03:00), recopied three times on 2026-11-15 (AI tests and images at 10:47; the lab's tab reorganisation at 11:07:40; the expression bench's
official version D and kept moment, the SDXL pixelizer rows and the regenerated `ia-alinhado-rosto` sheets at 14:14, -03:00) from a snapshot of `D:\Projetos\dungeon-tactics-lab\design` and
`D:\Projetos\dungeon-tactics-lab\public\design`, while the lab's own session was still editing it.

## Where things are

- `manifest.ts`: the page tree. Since 15/11 it mirrors the old lab's tabs: each tab is a group and each section a page, with
  the same ids, so `#/interface/testes`, `#/personagens/em-uso`... open the same page here (`Paginas` turns `#/a/b` into
  `/design/a/b`). The old "Início" tab is the lab home (`inicio.mdx`: "Em uso agora" and "Agora estamos decidindo").
  The games under `referencias` keep their `capturas-N` subpages (blocks of 2, as the old lab does).
- `dados.ts`: typed access to `plano.json` (decisions, phases, requests), `ia.json` (AI tests, prompts already expanded),
  `direcoes.json` (the 3 directions' text) and `refs/*.json` (one file per game, copied as they were).
- `components/`: `Decisoes`, `Referencias` (overview with filters, game intro, capture blocks), `Ia` (tests by subject,
  per platform, grouped by conversation; featured pick; platforms table), `Cartoes` + `Leitor` (cards and the full-screen
  reader), `Direcao` + `maquetes.css`, `KitFft` + `fft-kit.css`, `Rostos`, `EmUso`, `Icones`, `Expressoes` +
  `expressoes.css`, `Pixelizar`.
- The `.mdx` pages are a component call (`plano/tema.mdx` is the plan text itself). A page with a new route needs its
  `.mdx`: `registry.test.tsx` fails on a page without one and on an orphan file.
- Old paths of the first copy (`/design/decisoes/...`, `/design/testes-de-ia/...`, `/design/maquetes/...`) no longer
  exist; only the old anchors (`#fases`, `#maquetes`, `#ia`...) redirect, through `linksAntigos`.

## Local files (not in git)

`public/content/design/.gitignore` keeps every `.jpg`, `.jpeg` and `.png` out of git: captures of other games stay on
this PC only (grill decision of 13/11). Copy them from the old lab:

| Folder in `public/content/design/` | From `D:\Projetos\dungeon-tactics-lab\public\design\`                                         | Files  |
| ---------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| `refs/<game>/`                     | `refs/` (captures of 10 games)                                                                | 112    |
| `ia/`                              | `ia/`, top-level files (AI images, `cena-colina.jpg`)                                         | 100    |
| `ia/icones/`, `ia/atlas/`          | `ia/icones/`, `ia/atlas/` (PNG only; the `.json` files are read by no page)                   | 57, 10 |
| `ia/pixelizar/<tool>/`             | `ia/pixelizar/` (7 tools, 9 frames each)                                                      | 63     |
| `ia/sdxl/<run>/`                   | `ia/sdxl/` (only `s000-controle`, `s035-seed7`, `s035-seed7-boca`, the runs a page shows)     | 24     |
| `chars/ia*/`                       | `chars/ia`, `ia-boca`, `ia-pixel2`, `ia-alinhado`, `ia-alinhado-rosto` (AI expression sheets) | 35     |
| `cenas/`                           | `cenas/` (game captures behind the mock-ups)                                                  | 3      |
| `chars/px/`                        | `chars/px/` (pixel faces made by the game's script)                                           | 10     |

`icons.svg` (the game's sprite, game-icons.net CC BY 3.0) is versioned.

## Recopying

Dump the data again by running the old TS with Node (it strips types): import `PLATFORMS`, `NOT_RUN`, `FEATURED`,
`GEMINI_SUBS` from a copy of `ia.ts` (add an export line), `NOW`, `NEXT_STEP`, `DECISIONS`, `PHASES`, `REQUESTS` from
`data/plan.ts` and `DIRECTIONS` from `directions.ts` (without its CSS import), and write the three JSON files; copy
`data/refs/*.json` and the images; add the `.mdx` of any new route.
