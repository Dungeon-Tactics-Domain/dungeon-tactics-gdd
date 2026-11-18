# Plantas de sala de chefe (planta-chefe.js)

Duas plantas para a página `sala-fechada.html`, no mesmo formato de dados dela. Pedido do Fernando em 17/11:

- **Dullahan ampliada 1,5x** (`dullahan15`): baseada na sala do chefe Dullahan (MAP025, zona 11).
- **Salas combinadas** (`combinada`): o salão do Wyvern (MAP006, zona 6), com escada, ligado por uma passagem à cruz do Dullahan em tamanho original.

As medidas vêm de `D:\Projetos\_estudo-vagrant\salas-chefe\tabela.md`. Validação, desenho ASCII e imagem de cima ficam em `D:\Projetos\_estudo-vagrant\salas-chefe\plantas\` (rodar `node validar.mjs` e depois `python desenhar.py dullahan15 combinada`).

## O que cada planta traz

| Campo | Formato | Igual ao da página? |
|---|---|---|
| `texto` | lista de linhas, uma letra por casa de 2x2 tiles | sim (`PLANTA`) |
| `teto` | altura do teto em tiles | sim (`TETO`) |
| `tochas` | `{cx, cz, dx, dz, coluna?}` e `{cx, cz, braseiro: true}` | sim (`FOGOS`) |
| `spawns.aliados` / `spawns.inimigos` | `{x, z}` em casas | sim (posições do `ELENCO`) |
| `colunas` | `{x, z}`, tirado das letras `o` | só informativo: a página já lê as colunas do texto |
| `agua.poca` / `agua.fosso` | `{x, z}`, tirados das letras `~` e `=` | **novo** |
| `fumaca` | `{cx, cz}` sobre braseiros e fosso | **novo** |
| `legenda` | letra para descrição | só informativo |

## Letras

`#` rocha · `.` chão (0) · `-` estrado (+2) · `>` escada subindo para leste · `o` coluna: **a página já entende**.

Estas a página **ainda não entende**:

- `^` e `v`: escada subindo para norte e para sul. As duas plantas usam essas escadas.
- `<`: escada subindo para oeste. Está na legenda, mas nenhuma planta usa.
- `~`: poça rasa, andável, na altura 0.
- `=`: fosso de água, não andável.

## Mudança mínima em sala-fechada.html (não feita aqui)

1. **Carregar a planta.** Ao abrir a página, escolher a planta por um parâmetro na URL:

   ```js
   import { PLANTAS } from './planta-chefe.js';
   const P = PLANTAS[Q.get('planta')];
   ```

   Se `P` existir, ele substitui `PLANTA = P.texto`, `TETO = P.teto` e `FOGOS = P.tochas`. As posições `x, z` do `ELENCO` passam a vir de `P.spawns`. Hoje o elenco tem 4 bonecos; para 4 contra 4, são mais 4 entradas de arquivo de personagem (cada uma é um download a mais).

2. **Escadas nas quatro direções.** Criar uma tabela de direções:

   ```js
   const SOBE = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], v: [0, 1] };
   ```

   Ela entra nestes pontos da página:
   - `ANDA` passa a ser `'.->^v<~'`.
   - `base(cx, cz)` conta as casas iguais no sentido da descida.
   - `borda(cx, cz, dx, dz)` ganha o parâmetro `dz`:
     - lado da subida: base + 1;
     - lado da descida: base;
     - laterais: base + 0,5.

     Os chamadores são as paredes, `caminho()` e `livre()`.
   - `piso(x, z)` interpola a altura no eixo da escada.
   - O laço que monta os degraus desenha os 4 degraus e espelhos ao longo de `SOBE`.
   - Os testes `L !== '>'` passam a ser "não é escada". A regra exata usada está em `validar.mjs`.

3. **Poça rasa `~`.**
   - `ALTO['~'] = 0` e `~` dentro de `ANDA`.
   - Desenhar o chão normal e, por cima, um plano de água semitransparente a cerca de 0,05 tile, com `depthWrite: false`.
   - Não muda o andar.

4. **Fosso `=`.**
   - Não é andável. `livre()` e `caminho()` já bloqueiam tudo que não está em `ANDA`.
   - No laço da sala, tratar `=` como uma casa funda:
     - fundo em −2;
     - "saias" descendo das casas vizinhas até −2 (o mesmo código das saias do estrado);
     - um plano de água em cerca de −0,6.
   - Hoje esse laço pula toda casa que não é andável nem coluna.

5. **Fumaça.** Opcional. Um segundo conjunto de partículas, igual às brasas, mas cinza, mais lento e mais largo, nascendo em cada `fumaca`.

## Pontos para o Fernando saber

- **Tamanho da Dullahan 1,5x.** São 125 casas andáveis, ou 500 tiles do VS. A conta com a sala original dá 218 × 2,25 = 490 tiles. O pedido falava em cerca de 450 tiles e 110 casas; o resultado ficou um pouco acima.
- **Tamanho das salas combinadas.** São 156 casas, ou 624 tiles.
- **Escada larga do Wyvern.** Pela regra de passo da página (degrau de até 0,6 tile), dá para sair da escada pelo lado: do degrau de cima para o estrado e do de baixo para o chão. A página atual se comporta igual com a escada `>>`.
- **Arcos do salão do Wyvern.** A página liga com um arco toda dupla de colunas na mesma linha ou coluna. No salão do Wyvern isso dá arcos de 10 tiles de vão, que nascem a cerca de 4 tiles do chão, acima da altura da Ashley (3,7). As colunas da cruz foram postas fora dessas linhas, para não nascer arco atravessando parede (o `validar.mjs` confere).
- **Um teto só por planta.** O teto é 10 nas duas, mas no VS o salão do Wyvern mede 11,8 e a sala do Dullahan mede 8. Teto por região seria outra mudança.
