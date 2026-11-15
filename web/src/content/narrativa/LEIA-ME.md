# Narrative lab: local files and differences from the old lab

Copied from `D:\Projetos\dungeon-tactics-lab\narrativa` on 2026-11-14 at 23:39 (-03:00): `src/main.ts`, `src/data/plan.ts`
(now `dados/plano.json`), `src/data/refs/*.json` (15 games) and `src/data/obras/*.json` (7 anime and 1 book), as is.

## Local files (never versioned)

The 173 images are screenshots of other games and anime: they stay on this PC only. They live in
`web/public/content/narrativa/refs/<slug>/*.jpg`; the `.gitignore` in that folder keeps them out of git (the repo ignores
png and webp, not jpg). To restore them, copy each `shots[].file` of the JSON files from the old lab:

```powershell
$src = 'D:\Projetos\dungeon-tactics-lab\public\narrativa'
$dst = 'D:\Projetos\dungeon-tactics-labs\web\public\content\narrativa'
Get-ChildItem web\src\content\narrativa\dados\refs\*.json, web\src\content\narrativa\dados\obras\*.json | ForEach-Object {
  (Get-Content $_ -Raw -Encoding utf8 | ConvertFrom-Json).shots | ForEach-Object {
    New-Item -ItemType Directory -Force (Split-Path "$dst\$($_.file)") | Out-Null
    Copy-Item "$src\$($_.file)" "$dst\$($_.file)"
  }
}
```

The old folder has 252 files; the 79 that no JSON references (raw captures such as `mordheim/raw-02.jpg`) were not
copied. No file is above 5 MB (the largest is 2.0 MB).

## Differences from the old lab

- **Marks** ("Quero / Não quero" and the note): the old lab POSTed them to `narrativa/marcas.json` through its Vite server
  (`/api/narrativa/marcas`). This app has no such API yet, so the same object, with the same keys (`slug:l:lição`,
  `slug:i:arquivo`), is kept in this browser's localStorage under `narrativa:marcas`. The narrative session cannot read
  it, and marks made on the old lab do not come along (`marcas.json` was `{}` at copy time). Pending for the main
  session: an API or an export.
- **Not moved to the decisions API yet** (15/11): the shared `DecisaoAsset` (`data/decisoes.json`) has four choices
  (usar, descartar, refazer, talvez) and one id per asset, while these marks have two (quero, não quero), keys per
  lesson as well as per image (`slug:l:lição`), and drive the moodboard and the "O que eu quero" page. Switching means
  mapping quero/não quero to usar/descartar, turning the keys into ids like `narrativa/<slug>/<file>` and rewriting
  those two views: a change for the narrative session, not a drop-in swap.
- **Videos** load on click through the shared `YouTubeEmbed` (the old lab put the iframe in directly), which adds an
  "Abrir no YouTube" link next to the old title link.
- Section headings ("Lições", "Quero (n)", "Não quero (n)") are `h2` under the page `h1` (the old ones were `h4`/`h3`).
- Old links `#ref-<slug>`, `#loop-<slug>` and `#decisoes`, `#moodboard`, `#loops`, `#referencias`, `#obras`, `#marcas`
  redirect through `linksAntigos`; `#/group/page` routes redirect by themselves.
