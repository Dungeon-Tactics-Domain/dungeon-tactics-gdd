# Arquivo do lab Modelos (páginas retiradas em 17/11)

Em 17/11 o Fernando pediu para tirar do site as páginas separadas de modelos e animações feitas pelo Claude e guardar
tudo para recolocar depois num estúdio unificado, num design system novo. Esta pasta é esse arquivo. Ela fica fora do
build: o app só lê `web/src/content`.

## O que saiu

24 páginas do lab Modelos (rotas `/modelos/...`):

- Personagens (4): `codigo`, `blender-sonnet`, `blender-opus`, `blender-fable`
- Animações (6): `sonnet`, `opus`, `fable`, `sonnet-leve`, `opus-leve`, `fable-leve`
- Sprites (2): `sonnet`, `opus`
- Carroças (4): `low`, `medium`, `high`, `xhigh`
- Árvores (5): `low`, `medium`, `high`, `xhigh`, `livres`
- Estilos (2): `pintado`, `psx`
- Evals (1): `esforco`

Ficaram no site: KayKit (3 páginas) e Vagrant Story (1 página).

## O que tem aqui

- `MANIFESTO.md`: uma seção por página, com rota antiga, título, resumo, componente e props, modelo e esforço que
  gerou, peças, links da bancada, tamanho dos arquivos, ficha resumida e o corpo `.mdx` completo.
- `manifesto.json`: os mesmos dados em formato de máquina, com as fichas inteiras, as URLs do iframe por estilo
  (`liso`, `normal`, `psx`), o id de decisão de cada peça (`DecisaoAsset`) e a lista de arquivos da bancada com tamanho.
- `paginas/<grupo>/<id>.mdx`: cópias idênticas dos `.mdx` originais (commit `57aef1c`).
- `pecas.json` e `fichas.ts`: cópias dos dados das peças e das fichas como estavam. Os originais continuam em
  `web/src/content/modelos/` porque os componentes ainda os usam.

## O que continua no código

Os componentes ficaram em `web/src/content/modelos/components/` com os testes, para servir de base ao estúdio:
`Visualizador` (com `Blender`, `Botoes`, `LadoALado`), `Animacoes`, `Sprites`, `JanelaRedimensionavel`, `FichaPreview`,
`bancada.ts` e `proporcoes.ts`. Só deixaram de ser usados por páginas.

## Onde estão os modelos (nada foi apagado)

A bancada 3D (`eval.html`) roda na worktree do jogo
`D:\Projetos\dungeon-tactics\.claude\worktrees\modelagem-mapas-objetos-9b866c` (branch `claude/modelagem-mapas-objetos-9b866c`):

- `public/eval/`: GLB, texturas, `.blend`, folhas de sprite e scripts (cerca de 154 MB no total).
- `src/client/eval/`: as carroças, árvores e o guerreiro feitos em código (`cart-*.ts`, `tree-*.ts`, `harness.ts`).
- `eval.html`: a página da bancada.

**Atenção:** essas três coisas não estão versionadas (aparecem como `??` no `git status` da worktree). Se a worktree
for removida, os modelos se perdem. A página `animacoes/fable-leve` já não tinha arquivo na bancada
(`public/eval/anim-fable-leve` não existe) nem ficha.

Endereços: `https://dungeon-bancada.fernandorffdev.com` (público, pelo túnel) e `http://localhost:5205` (local, com
`npx vite --port 5205 --strictPort` na worktree do jogo).

## Decisões já gravadas

As decisões (usar, refazer) ficam em `data/decisoes.json` pelo id do asset, por exemplo `modelos/carrocas-high/D` e
`modelos/blender/opus`. Nada foi apagado do arquivo de decisões (que não está no git; não foi conferido nesta mudança). O estúdio deve usar os mesmos ids para reencontrar essas decisões.

## Como recolocar uma página

1. Copie `paginas/<grupo>/<id>.mdx` para `web/src/content/modelos/<grupo>/<id>.mdx`.
2. Em `web/src/content/modelos/manifest.ts`, devolva o grupo e a página com o título, o ícone e o resumo do
   `MANIFESTO.md`. O grupo precisa existir no manifesto, senão o teste de arquivos órfãos falha.
3. Atualize a contagem de grupos e páginas em `web/src/content/registry.test.tsx`.
4. Confira se a bancada está no ar e se os arquivos da página existem (lista no `manifesto.json`).
5. Rode `npx tsc -b`, `npx vitest run src/content` e o eslint em `web/`.

Para o estúdio unificado, o `manifesto.json` já tem tudo que uma lista de peças precisa: id, nome, `m` ou `glb`, zoom,
URL por estilo, id de decisão e ficha.
