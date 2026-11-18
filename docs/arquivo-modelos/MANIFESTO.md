# Manifesto das páginas arquivadas do lab Modelos

24 páginas saíram do site em 17/11 (pedido do Fernando: guardar para recolocar num estúdio unificado). Dados completos (fichas inteiras, lista de arquivos da bancada com tamanho) em `manifesto.json`; corpo original de cada página em `paginas/`.

Bancada 3D: https://dungeon-bancada.fernandorffdev.com (local: http://localhost:5205). Arquivos em `D:/Projetos/dungeon-tactics/.claude/worktrees/modelagem-mapas-objetos-9b866c`, **sem versionamento**.

## /modelos/personagens/codigo

- **Título:** 🗡️ Fable 5.2 · código (grupo 🧍 Personagens)
- **Resumo:** Fable 5.2, só com código, sem KayKit.
- **Componente:** `<Visualizador conjunto="guerreiro-codigo">`
- **Modelo e esforço:** Fable 5.2 (só código, sem KayKit); esforço não registrado
- **Cópia do .mdx:** `paginas/personagens/codigo.mdx`
- **Peça E** (Guerreiro-viajante): m=E, zoom 1.6 · decisão `modelos/guerreiro-codigo/E` · fonte `src/client/eval/cart-E.ts` (0.01 MB) · iframe `/eval.html?zoom=1.6&m=E`
- **Ficha:** Triângulos: 1.364 no pintado liso, 680 no PSX; Altura: 0,85 (a peça é escalada pela caixa medida). Método: Modelado do zero com as primitivas de painted.ts (nada do KayKit); dobras e luz pintadas por cor de vértice.

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="guerreiro-codigo">

Feito sem KayKit: 1.364 triângulos; no PSX, 680. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/personagens/blender-sonnet

- **Título:** 🧱 Sonnet 5.5 · Blender (grupo 🧍 Personagens)
- **Resumo:** Script do Blender feito pelo Sonnet 5.5.
- **Componente:** `<Blender modelo="sonnet">`
- **Modelo e esforço:** Sonnet 5.5 (script do Blender); esforço não registrado
- **Cópia do .mdx:** `paginas/personagens/blender-sonnet.mdx`
- **Peça sonnet** (Guerreiro): glb https://dungeon-bancada.fernandorffdev.com/eval/blender-sonnet/char.glb, zoom 1.6 · decisão `modelos/blender/sonnet` · iframe `/eval.html?zoom=1.6&glb=https%3A%2F%2Fdungeon-bancada.fernandorffdev.com%2Feval%2Fblender-sonnet%2Fchar.glb`
- **Bancada:** `public/eval/blender-sonnet` 17.49 MB, 13 arquivos
- **Ficha:** Triângulos: 21.776 (alvo ~20 mil, 9% acima); Malhas: 1; Ossos e clipes: 0 e 0 (sem esqueleto); Arquivo: 5,03 MB, 1 textura embutida; Textura: 2048 × 2048; Versão rigada: 23 ossos, 25 clipes. Método: Script bpy do zero: tubos com seção superelíptica, esferas deformadas (rosto esculpido por script), capa em grade com dobras senoidais, ~60 mechas cônicas de cabelo. Cor de materiais procedurais com bake de cor e oclusão numa textura só.

```mdx
import { Blender } from "../components/Visualizador";

<Blender modelo="sonnet">

21.776 triângulos, textura de 2048 px, sem esqueleto. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Blender>
```

## /modelos/personagens/blender-opus

- **Título:** 🧱 Opus 5.5 · Blender (grupo 🧍 Personagens)
- **Resumo:** Script do Blender feito pelo Opus 5.5.
- **Componente:** `<Blender modelo="opus">`
- **Modelo e esforço:** Opus 5.5 (script do Blender); esforço não registrado
- **Cópia do .mdx:** `paginas/personagens/blender-opus.mdx`
- **Peça opus** (Guerreiro): glb https://dungeon-bancada.fernandorffdev.com/eval/blender-opus/char.glb, zoom 1.6 · decisão `modelos/blender/opus` · iframe `/eval.html?zoom=1.6&glb=https%3A%2F%2Fdungeon-bancada.fernandorffdev.com%2Feval%2Fblender-opus%2Fchar.glb`
- **Bancada:** `public/eval/blender-opus` 21.42 MB, 11 arquivos
- **Ficha:** Triângulos: 19.942; Malhas: 1; Ossos e clipes: 0 e 0 (sem esqueleto); Arquivo: 4,93 MB, 1 textura embutida; Textura: 2048 px; Versão rigada: 23 ossos, 25 clipes. Método: Primitivas em bmesh: superelipsoides, tubos varridos por spline, torso por anéis, capa em sino com Solidify; rosto em peças (olhos, cílio, boca). Cor por vértice mais o bake de um shader "pintor" (luz em dois tons, sombra violeta, oclusão) num atlas de 2048 px.

```mdx
import { Blender } from "../components/Visualizador";

<Blender modelo="opus">

19.942 triângulos, textura de 2048 px, sem esqueleto. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Blender>
```

## /modelos/personagens/blender-fable

- **Título:** 🧱 Fable 5.2 · Blender (grupo 🧍 Personagens)
- **Resumo:** Script do Blender feito pelo Fable 5.2.
- **Componente:** `<Blender modelo="fable">`
- **Modelo e esforço:** Fable 5.2 (script do Blender); esforço não registrado
- **Cópia do .mdx:** `paginas/personagens/blender-fable.mdx`
- **Peça fable** (Guerreiro): glb https://dungeon-bancada.fernandorffdev.com/eval/blender-fable/char.glb, zoom 1.6 · decisão `modelos/blender/fable` · iframe `/eval.html?zoom=1.6&glb=https%3A%2F%2Fdungeon-bancada.fernandorffdev.com%2Feval%2Fblender-fable%2Fchar.glb`
- **Bancada:** `public/eval/blender-fable` 11.58 MB, 11 arquivos
- **Ficha:** Triângulos: 19.396; Malhas: 9 (cabeça, cabelo, torso, capa, braços, pernas, espada); Ossos e clipes: 0 e 0 (sem esqueleto); Arquivo: 2,77 MB, 1 textura embutida; Textura: 2048 × 2048; Versão rigada: 23 ossos, 25 clipes. Método: Grades paramétricas com UV feita pelo script (62 retângulos no atlas). Pintura em espaço de UV em três camadas: cor chapada, oclusão de contato e milhares de pinceladas orientadas pelo pano; rosto pintado na textura; nenhuma luz assada.

```mdx
import { Blender } from "../components/Visualizador";

<Blender modelo="fable">

Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Blender>
```

## /modelos/animacoes/sonnet

- **Título:** 🧱 Sonnet 5.5 · animações (grupo 🎬 Animações)
- **Resumo:** Personagem Sonnet 5.5 com esqueleto e todos os clipes.
- **Componente:** `<Animacoes modelo="sonnet">`
- **Modelo e esforço:** Sonnet 5.5; esforço não registrado
- **Cópia do .mdx:** `paginas/animacoes/sonnet.mdx`
- **GLB:** `/eval/anim-sonnet/char.glb` · iframe `/eval.html?glb=<glb>&zoom=1.6&anim=<clipe> (cenas walk:/jump:/act: usam zoom 3.4; armas: weapon=, off=)`
- **Bancada:** `public/eval/anim-sonnet` 19.84 MB, 17 arquivos
- **Ficha:** Triângulos: 21.776 (alvo ~20 mil, 9% acima); Textura: 2048 × 2048; Ossos e clipes: 23 e 25. Método: Script bpy do zero: tubos com seção superelíptica, esferas deformadas (rosto esculpido por script), capa em grade com dobras senoidais, ~60 mechas cônicas de cabelo. Cor de materiais procedurais com bake de cor e oclusão numa textura só.

```mdx
import { Animacoes } from "../components/Animacoes";

<Animacoes modelo="sonnet">

Escolha o clipe. Os mesmos clipes do KayKit do jogo, passados para o esqueleto deste modelo. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Animacoes>
```

## /modelos/animacoes/opus

- **Título:** 🧱 Opus 5.5 · animações (grupo 🎬 Animações)
- **Resumo:** Personagem Opus 5.5 com esqueleto e todos os clipes.
- **Componente:** `<Animacoes modelo="opus">`
- **Modelo e esforço:** Opus 5.5; esforço não registrado
- **Cópia do .mdx:** `paginas/animacoes/opus.mdx`
- **GLB:** `/eval/anim-opus/char.glb` · iframe `/eval.html?glb=<glb>&zoom=1.6&anim=<clipe> (cenas walk:/jump:/act: usam zoom 3.4; armas: weapon=, off=)`
- **Bancada:** `public/eval/anim-opus` 10.09 MB, 9 arquivos
- **Ficha:** Triângulos: 19.942; Textura: 2048 px; Ossos e clipes: 23 e 25. Método: Primitivas em bmesh: superelipsoides, tubos varridos por spline, torso por anéis, capa em sino com Solidify; rosto em peças (olhos, cílio, boca). Cor por vértice mais o bake de um shader "pintor" (luz em dois tons, sombra violeta, oclusão) num atlas de 2048 px.

```mdx
import { Animacoes } from "../components/Animacoes";

<Animacoes modelo="opus">

Escolha o clipe. Os mesmos clipes do KayKit do jogo, passados para o esqueleto deste modelo. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Animacoes>
```

## /modelos/animacoes/fable

- **Título:** 🧱 Fable 5.2 · animações (grupo 🎬 Animações)
- **Resumo:** Personagem Fable 5.2 com esqueleto e todos os clipes.
- **Componente:** `<Animacoes modelo="fable">`
- **Modelo e esforço:** Fable 5.2; esforço não registrado
- **Cópia do .mdx:** `paginas/animacoes/fable.mdx`
- **GLB:** `/eval/anim-fable/char.glb` · iframe `/eval.html?glb=<glb>&zoom=1.6&anim=<clipe>&fx=1 (cenas walk:/jump:/act: usam zoom 3.4; armas: weapon=, off=)`
- **Bancada:** `public/eval/anim-fable` 7.17 MB, 15 arquivos
- **Ficha:** Triângulos: 19.396; Textura: 2048 × 2048; Ossos e clipes: 23 e 25. Método: Grades paramétricas com UV feita pelo script (62 retângulos no atlas). Pintura em espaço de UV em três camadas: cor chapada, oclusão de contato e milhares de pinceladas orientadas pelo pano; rosto pintado na textura; nenhuma luz assada.

```mdx
import { Animacoes } from "../components/Animacoes";

<Animacoes modelo="fable">

Escolha o clipe. Os mesmos clipes do KayKit do jogo, passados para o esqueleto deste modelo. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Animacoes>
```

## /modelos/animacoes/sonnet-leve

- **Título:** 🧱 Sonnet 5.5 (leve) · animações (grupo 🎬 Animações)
- **Resumo:** Personagem Sonnet 5.5 (leve) com esqueleto e todos os clipes.
- **Componente:** `<Animacoes modelo="sonnet-leve">`
- **Modelo e esforço:** Sonnet 5.5 (versão leve, decimada); esforço não registrado
- **Cópia do .mdx:** `paginas/animacoes/sonnet-leve.mdx`
- **GLB:** `/eval/anim-sonnet-leve/char.glb` · iframe `/eval.html?glb=<glb>&zoom=1.6&anim=<clipe> (cenas walk:/jump:/act: usam zoom 3.4; armas: weapon=, off=)`
- **Bancada:** `public/eval/anim-sonnet-leve` 11.43 MB, 17 arquivos
- **Ficha:** Triângulos: 5.008 (o original tem 21.776); Ossos e clipes: 23 e 25. Método: Decimate (collapse, razão 0,23) no corpo do Sonnet rigado, antes do modificador de armadura; reexportado.

```mdx
import { Animacoes } from "../components/Animacoes";

<Animacoes modelo="sonnet-leve">

Escolha o clipe. Os mesmos clipes do KayKit do jogo, passados para o esqueleto deste modelo. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Animacoes>
```

## /modelos/animacoes/opus-leve

- **Título:** 🧱 Opus 5.5 (leve) · animações (grupo 🎬 Animações)
- **Resumo:** Personagem Opus 5.5 (leve) com esqueleto e todos os clipes.
- **Componente:** `<Animacoes modelo="opus-leve">`
- **Modelo e esforço:** Opus 5.5 (versão leve, decimada); esforço não registrado
- **Cópia do .mdx:** `paginas/animacoes/opus-leve.mdx`
- **GLB:** `/eval/anim-opus-leve/char.glb` · iframe `/eval.html?glb=<glb>&zoom=1.6&anim=<clipe> (cenas walk:/jump:/act: usam zoom 3.4; armas: weapon=, off=)`
- **Bancada:** `public/eval/anim-opus-leve` 11.11 MB, 11 arquivos
- **Ficha:** Triângulos: 5.133 (corpo 4.939 + espada 194; o original tem 19.956); Ossos e clipes: 23 e 25; Arquivo: 5,2 MB (a textura de ~5 MB domina). Método: Decimate (collapse, razão 0,25) no corpo do Opus rigado, depois de soldar os vértices das costuras de UV; espada intocada; reexportado com as 25 ações.

```mdx
import { Animacoes } from "../components/Animacoes";

<Animacoes modelo="opus-leve">

Escolha o clipe. Os mesmos clipes do KayKit do jogo, passados para o esqueleto deste modelo. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Animacoes>
```

## /modelos/animacoes/fable-leve

- **Título:** 🧱 Fable 5.2 (leve) · animações (grupo 🎬 Animações)
- **Resumo:** Personagem Fable 5.2 (leve) com esqueleto e todos os clipes.
- **Componente:** `<Animacoes modelo="fable-leve">`
- **Modelo e esforço:** Fable 5.2 (versão leve); esforço não registrado; sem arquivo na bancada nem ficha
- **Cópia do .mdx:** `paginas/animacoes/fable-leve.mdx`
- **GLB:** `/eval/anim-fable-leve/char.glb` · iframe `/eval.html?glb=<glb>&zoom=1.6&anim=<clipe>&fx=1 (cenas walk:/jump:/act: usam zoom 3.4; armas: weapon=, off=)`
- **Bancada:** `public/eval/anim-fable-leve` **não existe na bancada**
- **Ficha:** **sem ficha em fichas.ts**

```mdx
import { Animacoes } from "../components/Animacoes";

<Animacoes modelo="fable-leve">

Escolha o clipe. Os mesmos clipes do KayKit do jogo, passados para o esqueleto deste modelo. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Animacoes>
```

## /modelos/sprites/sonnet

- **Título:** 🧱 Sonnet 5.5 · sprites (grupo 🖼️ Sprites)
- **Resumo:** Render do personagem do Sonnet, HD e pixel.
- **Componente:** `<Sprites modelo="sonnet">`
- **Modelo e esforço:** Sonnet 5.5; esforço não registrado
- **Cópia do .mdx:** `paginas/sprites/sonnet.mdx`
- **Folhas:** `/eval/sprites-sonnet/{hd,pixel}-{idle,walk,attack}.png e contato.png (8 direções por linha; parado 4 quadros a 4 fps, andar 8 a 8, atacar 8 a 10)`
- **Bancada:** `public/eval/sprites-sonnet` 14.56 MB, 22 arquivos
- **Ficha:** Quadro: HD 256 px (~156 px de altura) e pixel com 24 cores; Direções: 8; Ossos: 23 (nomes do jogo, sem IK). Método: EEVEE ortográfico a 30°, fundo transparente, contorno por casco invertido; pixel art renderizada a 4x e reduzida (BOX), alfa duro, contorno de 1 px, 16 + 8 cores.

```mdx
import { Sprites } from "../components/Sprites";

<Sprites modelo="sonnet">

HD 256 px e pixel 96 px (~24 cores). São renders do modelo 3D, não pintura à mão.

</Sprites>
```

## /modelos/sprites/opus

- **Título:** 🧱 Opus 5.5 · sprites (grupo 🖼️ Sprites)
- **Resumo:** Render do personagem do Opus, HD e pixel.
- **Componente:** `<Sprites modelo="opus">`
- **Modelo e esforço:** Opus 5.5; esforço não registrado
- **Cópia do .mdx:** `paginas/sprites/opus.mdx`
- **Folhas:** `/eval/sprites-opus/{hd,pixel}-{idle,walk,attack}.png e contato.png (8 direções por linha; parado 4 quadros a 4 fps, andar 8 a 8, atacar 8 a 10)`
- **Bancada:** `public/eval/sprites-opus` 9.72 MB, 14 arquivos
- **Ficha:** Quadro: HD 256 px e pixel 96 px; Direções: 8 (S, SE, E, NE, N, NW, W, SW); Quadros por ação: parado 4, andar 8, atacar 8; Ossos: 23 (nomes do jogo). Método: O personagem do Blender ganhou esqueleto e pesos (bone heat e correção por ilha), 3 clipes KayKit retargetados e 320 quadros em EEVEE, com a luz e a câmera fixas e o personagem girando; as folhas são montadas em Python.

```mdx
import { Sprites } from "../components/Sprites";

<Sprites modelo="opus">

HD 256 px e pixel 96 px (~24 cores). São renders do modelo 3D, não pintura à mão.

</Sprites>
```

## /modelos/carrocas/low

- **Título:** Fable 5.2 · esforço baixo (grupo 🛒 Carroças)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="carrocas-low">`
- **Modelo e esforço:** Fable 5.2, esforço low
- **Cópia do .mdx:** `paginas/carrocas/low.mdx`
- **Peça C** (Carroça 1): m=C, zoom 2.2 · decisão `modelos/carrocas-low/C` · fonte `src/client/eval/cart-C.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=C`
- **Peça 6** (Carroça 2): m=cart-6, zoom 2.2 · decisão `modelos/carrocas-low/6` · fonte `src/client/eval/cart-6.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-6`
- **Peça 11** (Carroça 3): m=cart-11, zoom 2.2 · decisão `modelos/carrocas-low/11` · fonte `src/client/eval/cart-11.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-11`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="carrocas-low">

Fable 5.2 no esforço low. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/carrocas/medium

- **Título:** Fable 5.2 · esforço médio (grupo 🛒 Carroças)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="carrocas-medium">`
- **Modelo e esforço:** Fable 5.2, esforço medium
- **Cópia do .mdx:** `paginas/carrocas/medium.mdx`
- **Peça A** (Carroça 1): m=A, zoom 2.2 · decisão `modelos/carrocas-medium/A` · fonte `src/client/eval/cart-A.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=A`
- **Peça 8** (Carroça 2): m=cart-8, zoom 2.2 · decisão `modelos/carrocas-medium/8` · fonte `src/client/eval/cart-8.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-8`
- **Peça 9** (Carroça 3): m=cart-9, zoom 2.2 · decisão `modelos/carrocas-medium/9` · fonte `src/client/eval/cart-9.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-9`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="carrocas-medium">

Fable 5.2 no esforço medium. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/carrocas/high

- **Título:** Fable 5.2 · esforço alto (grupo 🛒 Carroças)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="carrocas-high">`
- **Modelo e esforço:** Fable 5.2, esforço high
- **Cópia do .mdx:** `paginas/carrocas/high.mdx`
- **Peça D** (Carroça 1): m=D, zoom 2.2 · decisão `modelos/carrocas-high/D` · fonte `src/client/eval/cart-D.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=D`
- **Peça 7** (Carroça 2): m=cart-7, zoom 2.2 · decisão `modelos/carrocas-high/7` · fonte `src/client/eval/cart-7.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-7`
- **Peça 10** (Carroça 3): m=cart-10, zoom 2.2 · decisão `modelos/carrocas-high/10` · fonte `src/client/eval/cart-10.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-10`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="carrocas-high">

Fable 5.2 no esforço high. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/carrocas/xhigh

- **Título:** Fable 5.2 · esforço máximo (grupo 🛒 Carroças)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="carrocas-xhigh">`
- **Modelo e esforço:** Fable 5.2, esforço xhigh
- **Cópia do .mdx:** `paginas/carrocas/xhigh.mdx`
- **Peça B** (Carroça 1): m=B, zoom 2.2 · decisão `modelos/carrocas-xhigh/B` · fonte `src/client/eval/cart-B.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=B`
- **Peça 5** (Carroça 2): m=cart-5, zoom 2.2 · decisão `modelos/carrocas-xhigh/5` · fonte `src/client/eval/cart-5.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-5`
- **Peça 12** (Carroça 3): m=cart-12, zoom 2.2 · decisão `modelos/carrocas-xhigh/12` · fonte `src/client/eval/cart-12.ts` (0.01 MB) · iframe `/eval.html?zoom=2.2&m=cart-12`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="carrocas-xhigh">

Fable 5.2 no esforço xhigh. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/arvores/low

- **Título:** Fable 5.2 · esforço baixo (grupo 🌳 Árvores)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="arvores-low">`
- **Modelo e esforço:** Fable 5.2, esforço low
- **Cópia do .mdx:** `paginas/arvores/low.mdx`
- **Peça 2** (Árvore 1): m=tree-2, zoom 3.2 · decisão `modelos/arvores-low/2` · fonte `src/client/eval/tree-2.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-2`
- **Peça 5** (Árvore 2): m=tree-5, zoom 3.2 · decisão `modelos/arvores-low/5` · fonte `src/client/eval/tree-5.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-5`
- **Peça 11** (Árvore 3): m=tree-11, zoom 3.2 · decisão `modelos/arvores-low/11` · fonte `src/client/eval/tree-11.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-11`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="arvores-low">

Fable 5.2 no esforço low. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/arvores/medium

- **Título:** Fable 5.2 · esforço médio (grupo 🌳 Árvores)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="arvores-medium">`
- **Modelo e esforço:** Fable 5.2, esforço medium
- **Cópia do .mdx:** `paginas/arvores/medium.mdx`
- **Peça 4** (Árvore 1): m=tree-4, zoom 3.2 · decisão `modelos/arvores-medium/4` · fonte `src/client/eval/tree-4.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-4`
- **Peça 6** (Árvore 2): m=tree-6, zoom 3.2 · decisão `modelos/arvores-medium/6` · fonte `src/client/eval/tree-6.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-6`
- **Peça 9** (Árvore 3): m=tree-9, zoom 3.2 · decisão `modelos/arvores-medium/9` · fonte `src/client/eval/tree-9.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-9`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="arvores-medium">

Fable 5.2 no esforço medium. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/arvores/high

- **Título:** Fable 5.2 · esforço alto (grupo 🌳 Árvores)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="arvores-high">`
- **Modelo e esforço:** Fable 5.2, esforço high
- **Cópia do .mdx:** `paginas/arvores/high.mdx`
- **Peça 1** (Árvore 1): m=tree-1, zoom 3.2 · decisão `modelos/arvores-high/1` · fonte `src/client/eval/tree-1.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-1`
- **Peça 7** (Árvore 2): m=tree-7, zoom 3.2 · decisão `modelos/arvores-high/7` · fonte `src/client/eval/tree-7.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-7`
- **Peça 12** (Árvore 3): m=tree-12, zoom 3.2 · decisão `modelos/arvores-high/12` · fonte `src/client/eval/tree-12.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-12`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="arvores-high">

Fable 5.2 no esforço high. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/arvores/xhigh

- **Título:** Fable 5.2 · esforço máximo (grupo 🌳 Árvores)
- **Resumo:** Três versões feitas no mesmo esforço.
- **Componente:** `<Visualizador conjunto="arvores-xhigh">`
- **Modelo e esforço:** Fable 5.2, esforço xhigh
- **Cópia do .mdx:** `paginas/arvores/xhigh.mdx`
- **Peça 3** (Árvore 1): m=tree-3, zoom 3.2 · decisão `modelos/arvores-xhigh/3` · fonte `src/client/eval/tree-3.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-3`
- **Peça 8** (Árvore 2): m=tree-8, zoom 3.2 · decisão `modelos/arvores-xhigh/8` · fonte `src/client/eval/tree-8.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-8`
- **Peça 10** (Árvore 3): m=tree-10, zoom 3.2 · decisão `modelos/arvores-xhigh/10` · fonte `src/client/eval/tree-10.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-10`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="arvores-xhigh">

Fable 5.2 no esforço xhigh. Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/arvores/livres

- **Título:** Fable 5.2 × Opus 5.5 · livres (grupo 🌳 Árvores)
- **Resumo:** Sem as peças-base do projeto: Fable (P) contra Opus (Q).
- **Componente:** `<Visualizador conjunto="arvores-livres">`
- **Modelo e esforço:** P: Fable 5.2 médio; Q: Opus 5.5 médio (sem as peças-base do projeto)
- **Cópia do .mdx:** `paginas/arvores/livres.mdx`
- **Peça P** (P · Fable médio): m=tree-P, zoom 3.2 · decisão `modelos/arvores-livres/P` · fonte `src/client/eval/tree-P.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-P`
- **Peça Q** (Q · Opus médio): m=tree-Q, zoom 3.2 · decisão `modelos/arvores-livres/Q` · fonte `src/client/eval/tree-Q.ts` (0.01 MB) · iframe `/eval.html?zoom=3.2&m=tree-Q`
- **Ficha:** por peça (fichaPeca), ver manifesto.json

```mdx
import { Visualizador } from "../components/Visualizador";

<Visualizador conjunto="arvores-livres">

Arraste para girar, roda do mouse para zoom, botão direito para mover.

</Visualizador>
```

## /modelos/estilos/pintado

- **Título:** 🖌️ Pintado (Fable 5.2) (grupo 🎨 Estilos)
- **Resumo:** O estilo atual do jogo.
- **Componente:** `<Callout tom="simples">`
- **Modelo e esforço:** Fable 5.2 (carroça D, high)
- **Cópia do .mdx:** `paginas/estilos/pintado.mdx`

```mdx
<Callout tom="simples">

- O estilo atual do jogo.
- 1.422 triângulos na carroça D.
- Na bancada há duas versões: **Pintado (jogo)**, com o pixel do jogo, e **Pintado em 3D liso**, sem pixel.

[Ver no visualizador](/modelos/carrocas/high)

</Callout>
```

## /modelos/estilos/psx

- **Título:** 📼 PSX (carroça do Fable 5.2) (grupo 🎨 Estilos)
- **Resumo:** Teste de estilo do primeiro PlayStation.
- **Componente:** `<Callout tom="simples">`
- **Modelo e esforço:** Fable 5.2 (carroça do Fable 5.2 no estilo PSX, conforme o título); esforço não registrado
- **Cópia do .mdx:** `paginas/estilos/psx.mdx`

```mdx
<Callout tom="simples">

- 950 triângulos, faces chapadas.
- Cor em poucos tons com trama; textura de 48 px sem suavizar.
- Falta a textura afim; o tremido só aparece com a câmera mexendo.
- O PSX come detalhes pequenos, como os olhos.

[Ver o guerreiro no visualizador](/modelos/personagens/codigo)

</Callout>
```

## /modelos/evals/esforco

- **Título:** 📊 Esforço nos modelos (grupo 🧪 Evals)
- **Resumo:** Quanto esforço do modelo vale pagar para modelar.
- **Componente:** `<Callout>`
- **Modelo e esforço:** eval de esforço do Fable 5.2 (low, medium, high, xhigh)
- **Cópia do .mdx:** `paginas/evals/esforco.mdx`

```mdx
<Callout>

**Veredito:** modelar em Fable high; xhigh só em peça de destaque (herói, chefe, peça de capa).

</Callout>

<Callout tom="simples">

- Carroças A a D: a do Fable high (a D) foi a melhor, com 24,0 de 30.
- Rodada 2, carroças: high > medium > xhigh > low. Árvores: xhigh > low > high > medium.
- Nota média de 30, árvores / carroças: low 20,8 / 18,7 · medium 17,7 / 22,3 · high 20,2 / 24,0 · xhigh 24,7 / 19,3.
- Tokens médios por peça: low ~143 mil · medium ~144 mil · high ~210 mil · xhigh ~300 mil.
- A variação dentro de um mesmo esforço é parecida com a variação entre esforços.

</Callout>
```
