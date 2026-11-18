# Narrative lab: local files and differences from the old lab

Copied from `D:\Projetos\dungeon-tactics-lab\narrativa` on 2026-11-14 at 23:39 (-03:00): `src/main.ts`, `src/data/plan.ts`
(now `dados/plano.json`), `src/data/refs/*.json` (15 games) and `src/data/obras/*.json` (7 anime and 1 book), as is.

## Removed on 2026-11-17

At Fernando's request the reference sheets (`jogos/`, `animes/`), the moodboard (`moodboard/`) and the anime and book
data (`dados/obras/`) left the lab; git history keeps them. The game JSONs in `dados/refs/` keep only `slug`, `game`,
`year`, `loop` and `gives`, which the `loops/` pages read. The 173 screenshots that lived (never versioned) in
`web/public/content/narrativa/refs/` were copied to `D:\_PARA-APAGAR\narrativa-referencias-17-11\`.

Later the same day the marks page (`marcas/minhas`, with `marcas.ts` and its test) and the plan pages `decisoes/agora`,
`decisoes/fases`, `decisoes/pedidos` and `decisoes/grill` left too. `dados/plano.json` keeps only `agora` and
`proximoPasso`, which the lab home shows.

## Walkable town draft (moved in on 17/11)

`mapa/cidade` ("Cidade andável (rascunho)") came from the design lab with `components/Cidade.tsx`, `cidade.ts` and its
test (`components/cidade.test.tsx`); it has no media. The old `/design/mapa/cidade` redirects here. It sits apart from
`decisoes/cidade`, `decisoes/lugares` and `decisoes/mapa-cidade`, which are the written decisions about the town.

## Differences from the old lab

- Old links `#loop-<slug>`, `#decisoes` and `#loops` redirect through `linksAntigos`; `#/group/page` routes redirect by themselves.
