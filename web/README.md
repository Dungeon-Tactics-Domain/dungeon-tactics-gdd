# Dungeon Tactics Lab — web

The front end of the Dungeon Tactics labs platform: a React app that shows every lab as a town on a painted kingdom map,
the live state of the agent sessions (the "Fábrica") and a shared pages pattern each lab uses for its content.
It replaces the plain-TypeScript lab in `dungeon-tactics-lab` (port 5190), which keeps running until each lab migrates.

## Stack

- React 19, TypeScript (strict, `noUncheckedIndexedAccess`), Vite, React Router
- Tailwind CSS v4 with the kingdom tokens in `src/index.css`; shadcn/ui components copied into `src/components/ui`
  (only Button, Badge, Input and Sheet, resized for 44px targets and 14px+ text)
- Vitest + Testing Library, ESLint (typescript-eslint, react-hooks), Prettier
- Light theme only. Contrast ≥ 4.5:1, targets ≥ 44px, text ≥ 14px, `prefers-reduced-motion` honoured, no sideways
  scroll at 375px.

## Run

```bash
npm ci
npm run dev         # http://localhost:5192, /api proxied to the Rust server on http://localhost:5191
npm run typecheck   # tsc -b (app, tests, vite config)
npm run lint        # eslint + prettier --check   (npm run format fixes formatting)
npm test            # vitest run
npm run build       # production build in dist/ (the Rust server serves it)
```

## Architecture

```
src/
  main.tsx, App.tsx       router
  index.css               Tailwind theme: kingdom palette, fonts, shadcn variables, the one shell breakpoint
  components/ui/          shadcn/ui components (owned code, edited to the kingdom rules)
  components/layout/      Shell (bar + drawer slot), TopBar, Navegacao
  features/mapa/          home: the SVG kingdom map
  features/paginas/       the pages pattern (Paginas component) and its demo at /exemplo-paginas
  features/arquivo/       index of the archived claude.ai artifacts (the copies stay in the old lab)
  features/labs/          route skeleton of labs not migrated yet (links to their page on 5190)
  content/                one folder per migrated lab (manifest, .mdx pages, .json), registered by registry.tsx
  components/content/     what every .mdx page gets: Callout, Player, Stars, Gallery, YouTubeEmbed, DataTable
  lib/labs.ts             typed data of every place: name, route, flag colour, accent, map position
```

### Places and colours

`src/lib/labs.ts` is the single source for the bar, the map and each lab's accent: a new lab is one new line. A station
on the board that is not in the list becomes a generic town on a spare map spot. Each page sets its lab colour on
`:root` (`useLabAccent`), so the portalled drawer menu gets it too.

### Pages pattern

`<Paginas sumario={...} base="/lab">` mounted on a splat route (`/lab/*`) gives a lab group › page › subpage on real
routes, a collapsible menu (one group open at a time, remembered per lab), accent-insensitive search (Enter opens the
first match), breadcrumbs, previous/next across groups, focus on the title after navigating, and arrow, Home and End
keys in the menu. Each page can declare `aoSair` (run when the reader leaves it, e.g. to tear down an embedded game)
and the lab can map old anchors to routes with `linksAntigos`; old `#/grupo/pagina` hash routes redirect too, on entry
and while the lab is open. Below 1100px the menu moves into the single "☰ Labs" drawer of the top bar, so a phone has
one menu button. The bar also falls back to that drawer at any width when the lab links no longer fit.

### Not here yet

- Lab content (design, mechanics, narrative, music): each lab route is a skeleton pointing to its current page on port
  5190 until its folder exists in `src/content/` (MDX + typed JSON, guide in `src/content/LEIA-ME.md`). The 3D models
  lab is migrated.
- The archived artifact copies stay in the old lab; they include captures that cannot go into a public repository.
