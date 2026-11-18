# Água simulada (`agua.js`)

Água que reage aos bonecos, em dois jeitos: **piscina rasa** e **fosso fundo**. Um arquivo só, sem dependência: a página passa o próprio `THREE` (feito para a versão 0.117 que a sala usa).

- Teste: [agua-teste.html](https://dungeon-tactics-lab.fernandorffdev.com/content/vagrant/agua-teste.html)
- Medidas e limites: no fim deste arquivo.

## O que ela faz

- Guarda uma grade de alturas (128 células no lado maior) e roda a equação da onda nela.
- O boneco empurra a água pelos pés: forte ao **entrar**, médio ao **andar dentro**, forte ao **sair**.
- Na entrada aparecem um anel de espuma e gotas; cada gota que cai faz um anel pequeno.
- O desenho é um retângulo plano. O shader entorta um fundo de lajes pela inclinação da onda, escurece com a profundidade, mistura um azul escuro pelo ângulo de visão e põe o reflexo das tochas nas cristas.
- Sem boneco mexendo, a simulação dorme em 3 segundos e passa a custar quase nada.

## Os dois modos

| | Piscina rasa (`'rasa'`) | Fosso fundo (`'fosso'`) |
|---|---|---|
| Profundidade da água | 0,3 tile, com rampa de 0,5 tile na borda | 1,5 tile, parede reta |
| Quanto o boneco afunda | 0,3 tile (pé e tornozelo) | 72% da altura dele (até o peito, boiando) |
| Velocidade | 0,85x | 0,6x |
| Animação sugerida | `'andar-na-agua'` | `'nadar'` |
| Ondas | normais | 1,9x mais fortes |

Os números ficam em `MODOS`, exportado pelo módulo: mudar ali muda nos dois lugares.

**Sobre "até o peito"**: 1,5 tile num boneco de 3,7 tiles chega só à coxa, e o fosso da sala tem 2 tiles. Por isso a profundidade da água (o que se vê) e o afundamento do boneco (onde ficam os pés) são coisas separadas. No fosso o boneco boia com a linha d'água no peito; os pés passam do fundo, mas ficam cortados e escondidos pela água escura. Para ele pisar no fundo, use `profundidadeEm` no lugar de `afundamentoEm`.

## Como ligar na sala (`sala-fechada.html`)

A sala usa 1 unidade = 1 tile e células de 2x2 tiles (`CEL = 2`). Conferido na planta em 17/11:

- **Fosso dentro do estrado**: a célula `.` cercada de `-`, coluna 16, linha 7. Região x 32 a 34, z 14 a 16. O piso do fosso está em 0 e o estrado em 2, então a água fica em 1,6.
- **Poça no salão**: por exemplo as células 8 a 10 por 3 a 4, entre as quatro colunas. Região x 16 a 22, z 6 a 10, com a água em 0,03 (logo acima do piso, que continua lá embaixo).

```js
import { criarAgua } from './agua.js?v=6'; // o site guarda .js por 4 horas: troque o v quando o arquivo mudar

const aguas = [
  criarAgua({ THREE, scene: cena, renderer: r, luzes, modo: 'fosso', resolucao: 64, regiao: { x0: 32, z0: 14, x1: 34, z1: 16, yAgua: 1.6 } }),
  criarAgua({ THREE, scene: cena, renderer: r, luzes, modo: 'rasa', regiao: { x0: 16, z0: 6, x1: 22, z1: 10, yAgua: 0.03 } }),
];
```

- `THREE`: a sala importa nome por nome; junte os que o módulo usa num objeto ou importe `* as THREE` de `./src/three.js`.
- `luzes`: o vetor das 6 `PointLight` da sala serve direto. O módulo lê posição, cor, força e alcance **a cada quadro**, então acompanha a troca de tochas. Só as 6 primeiras contam. Também aceita `{ pos, cor, forca, alcance }`.
- A névoa (`cena.fog`) é lida a cada quadro: ligar e desligar na sala já vale para a água.

### Passar os bonecos

Cada boneco precisa de um objeto fixo (o mesmo todo quadro), criado uma vez:

```js
u.agua = { pos: u.g.position, raio: RAIO, altura: u.alt }; // pos é a posição dos pés; vel é opcional
aguas.forEach((a) => a.aplicarCorte(u.mesh, u.agua));       // corta o corpo na linha d'água
```

No laço, depois de mover os bonecos:

```js
const lista = unidades.map((u) => u.agua);
aguas.forEach((a) => a.update(dt, lista));
```

- Sem `vel`, o módulo calcula a velocidade pela mudança de posição.
- "Dentro" quer dizer: dentro da região **e** com os pés na altura da água ou abaixo. Pular para fora conta como sair; cair de volta respinga de novo.
- `aplicarCorte` liga `renderer.localClippingEnabled` e põe um plano por boneco nos materiais dele. O shader dos bonecos do Vagrant Story (`newVSMaterial`) não corta sozinho; o módulo acrescenta os trechos do three nele (testado no boneco B da página de teste).
- O corte só vale enquanto aquele boneco está naquela água. Um boneco no salão (y = 0) está abaixo da água do fosso (1,6) e não é cortado.
- **Dois bonecos não podem dividir o mesmo material**, senão um corta o outro. Se dividirem, clone o material antes.
- O disco de sombra (`disco`) afunda junto com o grupo: esconda-o quando `estadoEm(...).dentro`.

### Velocidade, altura dos pés e animação

O módulo só informa; quem anda é a sala. Uma consulta resolve:

```js
const e = agua.estadoEm(x, z, u.alt);
// e = { dentro, yAgua, profundidade, afundamento, velocidade, animacao }
passo = VEL * e.velocidade * dt;                 // 1 fora, 0,85 na rasa, 0,6 no fosso
const pes = e.dentro ? e.yAgua - e.afundamento : pisoSeco;   // onde ficam os pés
toca(u, e.animacao === 'nadar' ? 'nadar' : 'andar');
```

- **Ponha a altura dos pés dentro de `piso()` da sala, não depois dela** (lido no código da sala, não rodado): `voa()` começa uma queda sempre que o boneco está mais de 0,01 acima de `piso()`, e `livre()` compara degraus com `piso()`. Se a água mexer no `p.y` por fora, o boneco "cai" na beira da poça. Com a água dentro de `piso()`, andar, cair e pular continuam valendo sem mudança.

- Com duas águas, use a que responder `dentro` (nenhuma: `piso` e velocidade normais).
- Também existem soltas: `fatorVelocidadeEm(x, z)`, `animacaoEm(x, z)`, `profundidadeEm(x, z)`, `afundamentoEm(x, z, altura)`.
- `alturaDaAguaEm(x, z)`: altura da superfície com a onda naquele ponto (para um objeto boiar); `null` fora da água.
- Na sala, `livre()` barra o degrau de 2 tiles do estrado para o fosso: para o boneco entrar andando é preciso tratar a célula do fosso como piso na altura `yAgua - afundamento`.

### O resto

- `setModo('rasa' | 'fosso')`: troca na hora, mantendo as ondas.
- `setEnabled(false)`: some com a água, solta todos os cortes e as consultas voltam a responder "fora" (velocidade 1, profundidade 0).
- `dispose()`: tira da cena e libera textura e geometria.
- `estatisticas`: modo, grade, tipo de textura, passos por segundo, milissegundos de processador por quadro, gotas vivas, bonecos dentro.
- `resolucao`: células no lado maior (padrão 128). Para o fosso de 2x2 tiles, 64 basta e custa um quinto.
- `textura: 'bytes'`: força a textura de 8 bits (o módulo já cai nela sozinho quando o aparelho não filtra textura de ponto flutuante).

## Por que no processador e não na placa de vídeo

- `alturaDaAguaEm` precisa responder no mesmo quadro. Com a grade na placa, isso exige ler a textura de volta, o que trava o quadro.
- O three 0.117 abre WebGL 1 (medido na página de teste), onde desenhar em textura de ponto flutuante não é garantido em celular.
- O custo medido é pequeno (abaixo). É o "plano B" do pedido, escolhido de propósito.
- `GPUComputationRenderer` e `Water2` existem na 0.117 (conferido no unpkg, resposta 200), mas não foram usados: o primeiro pelo motivo acima, o segundo porque redesenha a cena inteira mais duas vezes por quadro.

## Medidas (17/11, navegador embutido do app, PC do Fernando, tela 979x506)

Medido com `window.quadro(dt)`, 600 quadros, um boneco andando em círculo dentro da água. O relógio do navegador tem passo de 0,1 ms.

| O quê | Valor |
|---|---|
| Quadro inteiro (processador + placa, com `gl.finish`), água desligada | 0,13 ms |
| Quadro inteiro, piscina rasa ligada | 0,71 ms (95% dos quadros até 1,1) |
| Quadro inteiro, fosso ligado | 0,74 ms (95% até 1,1) |
| **Custo da água** (ligada menos desligada) | **cerca de 0,6 ms por quadro** |
| Só a conta no processador, grade 128x85 (região 6x4) | 0,38 ms por quadro |
| Idem, grade 256x171 | 1,43 ms |
| Fosso de 2x2 tiles, grade 128x128 (201 passos por segundo) | 1,40 ms |
| Fosso de 2x2 tiles, grade 64x64 | 0,26 ms |
| Parada (ninguém na água) | 0,005 ms |

Autoteste da simulação (`lab.autoTeste()` no console da página de teste): fosso 2x2 com grade 128, o mesmo com grade 64, piscina 20x12 e piscina 6x4 em 8 bits, 2400 quadros cada, com boneco entrando, andando, trocando de modo e saindo. Os quatro passam: nenhuma altura inválida, onda dentro do limite, volta ao repouso, corte liga e solta, e desligar com boneco dentro devolve velocidade 1.

## Limites conhecidos

- A superfície é plana: a onda aparece na luz e na distorção do fundo, não no contorno. A linha d'água no boneco é reta.
- O fundo de lajes é desenhado pelo shader, não é o piso real da sala visto através da água.
- A onda bate e volta nas quatro bordas da região, inclusive na borda em rampa da piscina rasa.
- Região pequena com grade densa (o fosso 2x2 a 128) limita a 240 passos por segundo; a onda só anda mais devagar.
- Até 6 luzes e 8 bonecos com sombra dentro d'água por região.
- Alturas acima de 0,3 tile são cortadas (um boneco andando sem parar num fosso pequeno chega nesse teto).
