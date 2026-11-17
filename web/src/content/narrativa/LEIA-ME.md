# Narrative lab: local files and differences from the old lab

Copied from `D:\Projetos\dungeon-tactics-lab\narrativa` on 2026-11-14 at 23:39 (-03:00): `src/main.ts`, `src/data/plan.ts`
(now `dados/plano.json`), `src/data/refs/*.json` (15 games) and `src/data/obras/*.json` (7 anime and 1 book), as is.

## Removed on 2026-11-17

At Fernando's request the reference sheets (`jogos/`, `animes/`), the moodboard (`moodboard/`) and the anime and book
data (`dados/obras/`) left the lab; git history keeps them. The game JSONs in `dados/refs/` keep only `slug`, `game`,
`year`, `loop` and `gives`, which the `loops/` pages read. The 173 screenshots that lived (never versioned) in
`web/public/content/narrativa/refs/` were copied to `D:\_PARA-APAGAR\narrativa-referencias-17-11\`.

## Differences from the old lab

- **Marks** ("Quero / Não quero" and the note): the old lab POSTed them to `narrativa/marcas.json` through its Vite server
  (`/api/narrativa/marcas`). This app has no such API yet, so the same object, with the same keys (`slug:l:lição`,
  `slug:i:arquivo`), is kept in this browser's localStorage under `narrativa:marcas`. The narrative session cannot read
  it, and marks made on the old lab do not come along (`marcas.json` was `{}` at copy time). Pending for the main
  session: an API or an export.
- Section headings ("Quero (n)", "Não quero (n)") are `h2` under the page `h1` (the old ones were `h4`/`h3`).
- Old links `#loop-<slug>`, `#decisoes`, `#loops` and `#marcas` redirect through `linksAntigos`; `#/group/page` routes redirect by themselves.
