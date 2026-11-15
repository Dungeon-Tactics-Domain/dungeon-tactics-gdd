# Lab content: how to migrate a lab

Each lab's content lives in its own folder, `src/content/<lab>/`, as a typed manifest, `.mdx` pages and `.json` data.
Nothing central is edited to add a lab: `registry.tsx` finds the folder by itself (`import.meta.glob`), the lab route
switches from "Ainda não migrado" to the pages, and the map and the bar drop their "not migrated" mark. Four agents can
migrate four labs at the same time as long as each one touches only:

- `src/content/<lab>/` (manifest, `.mdx`, `.json`, `components/`)
- `public/content/<lab>/` (images, audio, other files served as they are)

Anything outside these (a shared component, `Paginas`, `lib/labs.ts`) is a change for the main session: ask first.
The models lab (`src/content/modelos/`) is the reference migration; copy its shape.

## Folder layout

```
src/content/<lab>/
  manifest.ts               the pages tree (typed, default export)
  inicio.mdx                optional: text on the lab home, above the group cards
  <group>/<page>.mdx        one file per page, at the page's route
  <group>/<page>/<sub>.mdx  subpages one folder deeper
  dados.json                optional typed data (any name), read by the lab's components
  components/               React components only this lab uses (with their tests)
public/content/<lab>/       images and audio, referenced as "/content/<lab>/file.png"
```

The `<lab>` folder name is the lab id: it must match an entry in `src/lib/labs.ts` (`design`, `mecanicas`, `narrativa`,
`modelos`, `musica`), which already gives the route, the colour and the old-lab path.

## The manifest

```ts
import type { Manifesto } from '../types';

export default {
  titulo: 'Modelos 3D',
  resumo: 'One sentence under the title on the lab home.',
  origem: {
    caminho: '/modelos/', // page on the old lab (port 5190): the home links back to it
    fonte: 'dungeon-tactics-lab/modelos: index.html e src/main.ts',
    copiadoEm: '2026-11-14T23:23:00-03:00', // when you copied it (date +%FT%T%:z), shown on the home
  },
  linksAntigos: { fases: 'decisoes/fases' }, // optional: old "#anchor" -> new route
  grupos: [
    {
      id: 'estilos', // URL: lowercase letters, digits, hyphens
      titulo: 'Estilos',
      icone: '🎨',
      resumo: 'One sentence, shown in full on the card.',
      paginas: [
        { id: 'psx', titulo: 'PSX', icone: '📼', resumo: 'One sentence.' },
        { id: 'grill', titulo: 'Grill', subpaginas: [{ id: 'camera', titulo: 'Câmera' }] },
      ],
    },
  ],
} satisfies Manifesto;
```

The fields are the ones of the pages pattern (`src/features/paginas/types.ts`, `Paginas` component), minus `conteudo`:
the text of a page is the `.mdx` file at its route (`estilos/psx.mdx`, `estilos/grill/camera.mdx`). A page can declare
`aoSair` (run when the reader leaves it, e.g. to stop an embedded game). Titles fit one menu line (~28 characters). Old
`#/group/page` hash links redirect by themselves.

## Pages in MDX

MDX is Markdown with JSX. GitHub tables, task lists and autolinks work (`remark-gfm`). Every page gets these without
importing (`src/components/content/mdx.tsx`):

| Component                                                  | Use                                                                                          |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `<Callout tom="destaque" \| "simples" \| "aviso" titulo?>` | boxed note; `destaque` is the old `.box.now`, `simples` the old `.box`                       |
| `<Player src titulo />`                                    | audio with controls, never autoplay; a missing file shows "Áudio ainda não copiado"          |
| `<Stars chave rotulo notaSessao? />`                       | 1 to 5 stars kept in this browser (`chave` is the full storage key, e.g. `musica:nota:<id>`) |
| `<Gallery imagens={[{ src, alt, legenda? }]} />`           | thumbnails with captions, click opens an accessible lightbox                                 |
| `<YouTubeEmbed id titulo />`                               | youtube-nocookie player loaded only on click, plus a plain link                              |
| `<DataTable colunas linhas legenda? />`                    | table from data; scrolls inside its box on a phone                                           |
| `<DecisaoAsset id rotulo />`                               | Fernando's decision on one asset, saved on the server (`id` = `<lab>/<path>`, see below)     |

Markdown links starting with `/` (e.g. `[Ver](/modelos/carrocas/high)`) stay inside the app without a reload; `http`
links open in a new tab. Markdown inside a component needs blank lines around it:

```mdx
<Callout tom="simples">

- 950 triângulos, faces chapadas.

[Ver o guerreiro no visualizador](/modelos/personagens/codigo)

</Callout>
```

Lab components and data are imported at the top of the page:

```mdx
import { Visualizador } from '../components/Visualizador';

<Visualizador conjunto="carrocas-high">

Intro paragraph, rendered above the viewer.

</Visualizador>
```

## Decisions per asset

`<DecisaoAsset id="musica/batalha-c" rotulo="Batalha · C" />` shows four buttons (Usar, Descartar, Refazer, Talvez)
and a note. A click saves at once on the server (`PUT /api/decisoes/<id>`, file `data/decisoes.json`); the note saves
with its own button. The page "Decisões" (top bar) lists them all, filterable by lab and choice, and lab sessions read
the file. The `id` starts with the lab id and must never change once used, or old decisions stop matching: base it on
the id the data already has (track id, piece id), not on a title. The music tracks (`FaixaMusica`) and the 3D pieces
(`Bancada`, per selected piece) already show it; other labs insert it in their `.mdx` or components. When the server
does not answer, the box says so and nothing is saved in the browser instead.

## Typed JSON

Keep lists and tables in a `.json` file and read it from a component in TypeScript, so a wrong shape fails
`npm run typecheck`: `import pecas from '../pecas.json'` and assign it to a typed constant
(`const CONJUNTOS: Record<keyof typeof pecas, Peca[]> = pecas`). Props that pick an entry use `keyof typeof` the JSON.
Unknown keys render a visible error, which the registry test catches.

## Migrating a lab, step by step

1. Read the old lab page (`D:\Projetos\dungeon-tactics-lab\<lab>\index.html` and `src/`) and open it on
   `http://localhost:5190/<lab>/`. Do not edit the old project.
2. Write `manifest.ts` with the same groups, pages, titles, icons and summaries, in the same order. Record `origem`.
3. One `.mdx` per page with the same text, links and images. Copy images and audio to `public/content/<lab>/`.
4. Interactive parts (viewers, filters, embedded games) become components in `components/`, with the same behaviour
   and URLs as the old code, and a Vitest test next to them.
5. Run the gates from `web/`: `npm run typecheck`, `npm run lint` (`npm run format` fixes formatting), `npm test`,
   `npm run build`. `src/content/registry.test.tsx` fails on an `.mdx` no page uses, a page with neither text nor
   subpages, or a page whose components show "desconhecido" or "inválido".
6. Compare each page with the old one on `npm run dev` (port 5192): headings, text, number of images, links and tables,
   and the result of each button. Check 375px (no sideways scroll) and the console.

## Interface rules

Light theme only. Text ≥ 14px, contrast ≥ 4.5:1, targets ≥ 44px (`min-h-11`), no sideways scroll at 375px. Use the
theme tokens of `src/index.css` (`text-tinta`, `bg-folha`, `border-borda`, `text-apagado`, `bg-lab`, `bg-lab-soft`),
never raw colours, so the lab accent and contrast stay right.
