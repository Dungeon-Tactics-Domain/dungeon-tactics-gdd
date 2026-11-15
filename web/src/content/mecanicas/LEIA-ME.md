# Mechanics lab (mecanicas)

Copied from `D:\Projetos\dungeon-tactics-lab\mecanicas` on 2026-11-14 at 23:38 (-03:00): `src/main.ts`, `src/data/plan.ts`,
`rules.ts` and `scenes.ts` (now `plano.json`, `regras.json`, `cenas.json`), `src/data/refs/*.json` (copied as they were)
and `public/mecanicas/clips/clips.json` (now `clipes.json`). Same 5 groups and 81 routes as the old lab.

## Local files

| File                                                      | From                                                                | In git?                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| `public/content/mecanicas/clips/tiro-arqueiro-readme.gif` | `dungeon-tactics-lab/public/mecanicas/clips/` (3.8 MB, game README) | not ignored: `.gitignore` has no `*.gif` |

A new recorded clip goes in that folder and in `clipes.json` (`file`, and `after` for the proposal). Videos over 5 MB stay
where they are and are not copied.

## Outside dependencies

- The live scenes (Clipes do jogo) read `scripts/sandbox/bench/<scene>.json` and embed the game from the bench server of
  the game repo, `npm run bench` on `http://localhost:5291`. Without it the page shows the "O jogo não está rodando"
  warning. The bench's Vite allows only localhost origins by CORS, so from the LAN address the scenes do not load.
- "Só a animação" is kept in this browser (`mecanicas:so-animacao`, same key as the old lab).

## Descent group (Nov 15)

`descida.json` holds the numbers of the dungeon crawler descent (short room, enemies and boss, wounded, room map rules),
proposed by this lab and not copied from the old one. `dados.ts` sums the enemy life per room; the test keeps every room
in 5 to 8 hero turns and the boss in 12 to 18.
