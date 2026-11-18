# Fumaça volumétrica (`fumaca.js`)

Fumaça de verdade para a sala gótica: o shader caminha por dentro de um volume de ruído 3D animado, soma a luz das
tochas e mistura o resultado por cima da cena. Página de teste: `fumaca-teste.html`.

## Como funciona, em três passos

A cada `update()` o módulo:

1. desenha a cena numa textura pequena só para saber a profundidade (onde há parede, coluna, personagem);
2. desenha a fumaça em outra textura, parando o raio na profundidade da cena (a fumaça some atrás dos objetos e
   afina suavemente ao encostar neles);
3. deixa um retângulo de tela cheia dentro da cena, que o `r.render(cena, cam)` normal da página mistura por cima.

A página não muda o próprio laço: só chama `update()` antes do `render`.

## Integração na `sala-fechada.html`

A sala importa nomes soltos do three; o módulo precisa do pacote inteiro, do mesmo arquivo:

```js
import * as THREE from './src/three.js';
import { criarFumaca } from './fumaca.js?v=1'; // o site guarda o arquivo por 4 h: aumente o número a cada mudança
```

Criar uma vez, depois de `fogos`, `luzes` e do chão existirem:

```js
const fumaca = criarFumaca({
  THREE, scene: cena, camera: cam, renderer: r,
  luzes,                                     // o conjunto de 6 PointLight da sala, direto
  // 2 unidades além das paredes (a fumaça some nos últimos 2,5 de cada lado) e teto 4 acima da chama mais alta (5,4)
  caixa: { min: new Vector3(-2, 0, -2), max: new Vector3(W * CEL + 2, 11, H * CEL + 2) }, // min.y = piso baixo
  fontes: fogos.slice().sort((a, b) => b.forca - a.forca).slice(0, 6)          // braseiros primeiro (limite: 6)
    .map((f) => ({ pos: f.chama, forca: f.forca })),
  qualidade: CELULAR ? 'baixa' : 'alta',
  altura: 1.0, densidade: 0.8, cobertura: 0.8, // a sala é maior que a cena de teste (boneco com ~4 unidades)
});
```

Os três números da última linha foram os usados no teste dentro da sala (ver "Teste dentro da sala"); são ponto de
partida, o acerto fino é a olho.

No laço, logo antes do `r.render(cena, cam)` (linha do `const c0 = performance.now(); r.render(cena, cam)`):

```js
fumaca.update(dt, cam, luzes);
```

### Que luzes passar

- A lista aceita `PointLight` do three direto (lê `position`, `color`, `intensity`, `distance`) ou objetos
  `{ posicao, cor, intensidade, alcance }`. Luz com intensidade 0 é ignorada; valem as 6 primeiras acesas.
- Como a sala já move o conjunto `luzes` para as tochas mais próximas e aplica o tremor, passar `luzes` basta:
  a fumaça pisca junto com as tochas e acende com o clarão das magias.

### Que fontes passar

- Uma por braseiro ou tocha: `pos` = ponto da chama (`f.chama`), `forca` = 1.3 para tocha, 1.8 para braseiro
  (`f.forca` da sala). A força define a largura e a altura da coluna de fumaça.
- As fontes são fixas (lidas na criação). Tocha que apaga continua soltando fumaça; para mudar, recriar o módulo.

### Onde desligar a névoa antiga (`t-nevoa`)

A névoa antiga são os dois planos `nevoas` (bloco "ground mist", `const nevoaT` e `const nevoas`). Com a fumaça nova:

- apagar esse bloco, ou deixar `nevoas.forEach((n) => (n.visible = false))`;
- no botão: `liga('t-nevoa', ...)` passa a chamar `fumaca.setEnabled(on)` no lugar de `nevoas.forEach(...)`;
- o `cena.fog` (escurecimento ao longe) é independente e pode ficar.

## Controles

| Chamada | O que faz |
| --- | --- |
| `update(dt, camera, luzes)` | avança a animação e redesenha a fumaça; chamar antes do `render` |
| `setQualidade('desligada' \| 'baixa' \| 'alta')` | baixa = metade da resolução, 16 passos, 2 camadas de ruído; alta = resolução cheia, 32 passos, 3 camadas |
| `setEnabled(true \| false)` | liga e desliga sem perder a qualidade escolhida |
| `dispose()` | tira da cena e libera as texturas |
| `estatisticas` | qualidade, passos, tamanho da textura, se há textura de profundidade, luzes e fontes em uso |
| `uniforms` | ajuste ao vivo: `uDens` (densidade), `uAltura` (altura da camada do chão), `uCob` (quanto do chão cobre), `uCor`, `uAmb` |

Opções extras de `criarFumaca`: `cor` (0xbfd1ff), `ambiente` (0x293352, a luz azulada onde não há tocha),
`densidade` (0.7), `altura` (0.4), `cobertura` (0.7).

## Custo medido

Medido em 17/11/2026 na `fumaca-teste.html?tam=1130x847`, tela de 1130x847 pontos, placa NVIDIA GeForce RTX 5070,
WebGL 1 (o three 0.117 abre WebGL 1), botão "Medir as três" (4 lotes de 300 quadros, esperando a placa a cada lote):

| Qualidade | Quadro inteiro (cena de teste + fumaça) | Custo só da fumaça |
| --- | --- | --- |
| desligada | 0,04 ms | — |
| baixa | 0,11 a 0,15 ms | cerca de 0,1 ms |
| alta | 0,40 ms (vista de longe) a 0,58 ms (vista de perto) | 0,36 a 0,55 ms |

O número é tempo médio por quadro com a placa trabalhando sem parar; esperar a placa a cada quadro arredonda tudo
para o intervalo do monitor (6,9 ms a 144 Hz), por isso a medida é em lotes.

### Teste dentro da sala

Em 17/11/2026 o módulo foi ligado na `sala-fechada.html?sombras=suave` sem editar o arquivo (injetado pelo console,
usando `window.sala`): 12 fogos, 5 luzes acesas, 2 com sombra, tela 1130x848. Sem erro no console, personagens e
arcos escondem a fumaça corretamente. Tempo por quadro inteiro da sala (`sala.quadro`, lotes de 150 quadros):
desligada 1,08 ms, baixa 1,53 ms, alta 1,54 ms. Na sala o custo (cerca de +0,45 ms) é quase todo de desenhar a cena
uma segunda vez para a profundidade, por isso baixa e alta empatam neste computador.

Estimativa para celular (dedução, não medido): uma placa de celular intermediário é da ordem de 30 a 80 vezes mais
lenta que esta nesse tipo de conta por ponto de tela. Na mesma quantidade de pontos, a baixa ficaria em 3 a 8 ms por
quadro e a alta em 11 a 45 ms, mais o segundo desenho da cena. Conclusão: no celular usar só a baixa (ou desligada em aparelho fraco); a alta não
cabe em 60 quadros por segundo. Medir no aparelho com o botão "Medir as três" da página de teste.

## Limites conhecidos

- **A cena é desenhada duas vezes** quando a fumaça está ligada (a segunda, pequena, para a profundidade). Na sala
  real isso custa mais que na cena de teste, e os contadores de desenho da sala (`r.info`) vão mostrar o dobro.
  As sombras não são refeitas nesse passo.
- **Chão em uma altura só:** a camada rasteira nasce em `caixa.min.y`. Em piso elevado (as células `-` da sala,
  2 unidades acima) ela fica debaixo do chão e não aparece; só as colunas das tochas passam por lá.
- **A fumaça não faz sombra** e a luz atravessa paredes dentro dela (não há raio de sombra por luz).
- **Na baixa**, a borda de um objeto na frente da fumaça pode ganhar um contorno leve, porque a fumaça é ampliada
  de meia resolução.
- **Sem textura de profundidade** (aparelho raro, sem `WEBGL_depth_texture`; teste com `?semprof`) a fumaça é
  desenhada por cima dos objetos, só com o esmaecimento por altura e pelas bordas da caixa.
- Sprites aditivos (chama, brilho) ficam por baixo da fumaça.
- **Parede que some** (`fadeaveis`): com a caixa passando 2 unidades das paredes, dá para ver um resto de fumaça do
  lado de fora quando a parede esmaece. Não foi conferido se uma parede esmaecida corta a fumaça atrás dela.
- **Escala:** o ruído e as alturas são em unidades do mundo. Em sala com outra escala, ajustar `altura` (camada do
  chão) e a altura da caixa; as colunas de fumaça precisam de uns 4 de folga acima da chama.
