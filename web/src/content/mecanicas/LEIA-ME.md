# Mechanics lab (mecanicas)

Copied from `D:\Projetos\dungeon-tactics-lab\mecanicas` on 2026-11-14 at 23:38 (-03:00): `src/main.ts`, `src/data/plan.ts`
and `rules.ts` (now `plano.json`, `regras.json`) and `src/data/refs/*.json` (copied as they were).

## Removed on 2026-11-17

At Fernando's request the "Clipes do jogo" group left the lab (the live bench scenes of Movimento, Golpe and Empurrão e
terreno, and Gravados), with `Cena.tsx`, `cena-url.ts`, `Gravados.tsx`, `cenas.json` and `clipes.json`; git history
keeps them. The only recorded clip, `public/content/mecanicas/clips/tiro-arqueiro-readme.gif` (3.7 MB, never
versioned), was moved to `D:\_PARA-APAGAR\mecanicas-clipes-17-11\`.

Later the same day the 10 reference sheets of other games left too (the `referencias` group: 10 pages and their 29
`mecanicas`, `sensacao` and `videos` subpages), with `refs/*.json` and `components/Referencias.tsx`.

## Descent group (Nov 15)

`descida.json` holds the numbers of the dungeon crawler descent (short room, enemies and boss, wounded, room map rules),
proposed by this lab and not copied from the old one. `dados.ts` sums the enemy life per room; the test keeps every room
in 5 to 8 hero turns and the boss in 12 to 18.

## Impact and trajectories (removed Nov 19)

The `sensacao/impacto.mdx` and `sensacao/trajetorias.mdx` pages, their Three.js prototypes and the Impacto group of
`regras.json` were removed from the lab at Fernando's request. `peso.json` and `trajetorias.json` stay as data only.

## Class and enemy sheets (Nov 16)

`fichas.json` is generated, never edited by hand: from `web/`, run `git -C D:/Projetos/dungeon-tactics fetch origin`,
`node scripts/mecanicas/fichas.mjs D:/Projetos/dungeon-tactics` and `npx prettier --write src/content/mecanicas/fichas.json`.
The script reads the game's origin/master (its header says how) and writes the commit it used into the file.

## Abilities and items (Nov 16)

`habilidades.json` and `itens.json` are generated, never edited by hand: from `web/`, run
`git -C D:/Projetos/dungeon-tactics fetch origin`, `node scripts/mecanicas/habilidades-itens.mjs D:/Projetos/dungeon-tactics`
and `npx prettier --write src/content/mecanicas/habilidades.json src/content/mecanicas/itens.json`. Both generators read the
game through `scripts/mecanicas/jogo.mjs`.
