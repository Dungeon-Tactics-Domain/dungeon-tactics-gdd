# Music lab content

Copied on 2026-11-14 23:39 (-03:00) from `D:\Projetos\dungeon-tactics-lab\musica` (old lab, port 5190, `/musica/`).

- `batalha.json`, `pastoral.json`: verbatim copies of the old `musica/data/*.json` (sha256 `a2700ec1…` and `390e2a22…` at
  copy time). The format is the old `musica/data/LEIA-ME.md`: references, tracks (`id`, `letra`, `titulo`, `audio`,
  `nota`, `secoes`) and checks. `components/Musica.tsx` types and renders them; `manifest.ts` builds the pages from them.
- Each old page is a group and each old anchor a page with the same id (`referencias`, the track id, `checagens`), so
  `#/batalha/batalha-c` from the old lab opens the same track. One `.mdx` per page, one line each.
- A track added to a JSON needs its `<group>/<track id>.mdx` too, or `registry.test.tsx` fails on an empty page.
- Ratings: `musica:nota:<track id>` in localStorage, as before. The old lab runs on another origin (5190), so ratings
  given there do not show up here.

## Local files (not in git: `*.ogg` is ignored on purpose)

`public/content/musica/audio/`: the 24 files of the old `musica/audio/`, copied as they are (32 MB in total, none over
5 MB): `batalha_{A..F}.ogg`, `batalha_{A..F}_tfg.ogg`, `pastoral_{A..F}.ogg`, `pastoral_{A..F}_tfg.ogg`. Without them
each player says "Áudio ainda não copiado". To restore:

```bash
cp D:/Projetos/dungeon-tactics-lab/musica/audio/*.ogg web/public/content/musica/audio/
```
