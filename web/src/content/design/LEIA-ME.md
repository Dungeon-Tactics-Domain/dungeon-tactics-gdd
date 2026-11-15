# Design lab (migrated from dungeon-tactics-lab/design)

Copied on 2026-11-14 at 23:37:51 (-03:00), recopied (AI tests and images) on 2026-11-15 at 10:47:53 (-03:00) from a snapshot of `D:\Projetos\dungeon-tactics-lab\design` and
`D:\Projetos\dungeon-tactics-lab\public\design`, while the lab's own session was still editing it.

## Where things are

- `manifest.ts`: the page tree, derived from the data with the old lab's rules (games sorted by screen type in blocks of 2,
  Gemini and Copilot split by kind when they have more than 8 images).
- `dados.ts`: typed access to `plano.json` (decisions, phases, requests), `ia.json` (AI tests, prompts already expanded),
  `direcoes.json` (the 3 directions' text) and `refs/*.json` (one file per game, copied as they were).
- `components/`: `Decisoes`, `Referencias` (overview with filters, game intro, capture blocks), `Ia`, `Cartoes` + `Leitor`
  (cards and the full-screen reader with zoom, drag, arrows), `Direcao` + `maquetes.css` (the mock-ups, CSS nested under
  `.dz-maquetes`), `KitFft` + `fft-kit.css` (CSS under `.fft` / `fft-*`), `Rostos`.
- The `.mdx` pages are one line each (a component call). They were written by a script from the data; when a game gets
  more captures or an AI platform gets a new kind, add the `.mdx` at the new route: `registry.test.tsx` fails on a page
  without one and on an orphan file.

## Local files (not in git)

`public/content/design/.gitignore` keeps every `.jpg`, `.jpeg` and `.png` out of git: captures of other games stay on
this PC only (grill decision of 13/11). Copy them from the old lab:

| Folder in `public/content/design/` | From `D:\Projetos\dungeon-tactics-lab\public\design\`                                             | Files |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | ----- |
| `refs/<game>/`                     | `refs/` (captures of 10 games)                                                                    | 112   |
| `ia/`                              | `ia/`, top-level files only (AI images, `cena-colina.jpg`; not `atlas/`, `icones/`, `pixelizar/`) | 100   |
| `cenas/`                           | `cenas/` (game captures behind the mock-ups)                                                      | 3     |
| `chars/px/`                        | `chars/px/` (pixel faces made by the game's script)                                               | 10    |

`icons.svg` (the game's sprite, game-icons.net CC BY 3.0) is versioned.

## Recopying

Dump the data again by running the old TS with Node (it strips types): import `PLATFORMS`, `NOT_RUN`, `FEATURED`,
`GEMINI_SUBS` from a copy of `ia.ts` (add an export line), `NOW`, `NEXT_STEP`, `DECISIONS`, `PHASES`, `REQUESTS` from
`data/plan.ts` and `DIRECTIONS` from `directions.ts` (without its CSS import), and write the three JSON files; copy
`data/refs/*.json` and the images; add the `.mdx` of any new route.
