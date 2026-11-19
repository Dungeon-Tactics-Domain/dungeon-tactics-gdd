# Líquido por partículas (experimental)

Terceira variação de água da sala gótica, para comparar com a piscina rasa e o fosso por ondas (`agua.js`).
Aqui o líquido é feito de alguns milhares de bolinhas que caem, escorrem, se empurram e são empurradas pelos bonecos.

- Módulo: `fluido.js`
- Página de teste: [fluido-teste.html](https://dungeon-tactics-gdd.fernandorffdev.com/content/vagrant/fluido-teste.html)
- Estado: experimento de 17/11/2026. Não está ligado na `sala-fechada.html`.

## Resumo honesto

- **Parado e em movimento lento fica bonito e reage de verdade**: superfície lisa com o brilho das tochas, o boneco abre um rastro, a água sobe na frente dele, contorna a coluna e volta a assentar.
- **O respingo no ar ainda não convence**: as gotas soltas aparecem como bolhas escuras ou vidradas, com um quadriculado da meia resolução, não como gotas brilhantes. É o ponto mais fraco do visual.
- **É a variação mais cara das três para o processador.** A conta cresce com o número de partículas, não com o tamanho da tela.
- **A placa de vídeo quase não trabalha**: menos de 1 ms por quadro no PC (medido agora, tela 1024x768).
- **Para o celular é arriscado**: nunca foi medido num aparelho de verdade. Vale como efeito de destaque num cômodo pequeno, não como água de toda sala.

## Como funciona, em palavras

**Física (no processador, na mesma linha de execução da página).**
Cada partícula é uma gota. A cada quadro: a gravidade puxa, cada gota olha as vizinhas próximas e, onde o líquido está mais apertado do que deveria, as gotas se afastam (duas rodadas por quadro). A velocidade de cada gota é o quanto ela andou. É o método "fluido baseado em posição" (em inglês, *position based fluids*): não explode com passo de tempo grande, que é o que interessa num jogo.
Para achar as vizinhas rápido, as partículas são reordenadas a cada quadro por célula de uma grade.

**Por que no processador e não na placa de vídeo.**
- Com 2.000 a 6.000 partículas a conta cabe no processador do PC.
- Fazer a física na placa exige textura de números reais como alvo de desenho, que no WebGL 1 (o que o three 0.117 da sala usa) depende de extensão que muitos celulares não têm. Seriam dois caminhos de código para manter.
- No processador, a colisão com os bonecos é uma conta simples e previsível.
- Não usei *worker* (linha de execução separada): a física sozinha (`criarSimulacao`) já está isolada do desenho e roda sem navegador, então dá para mover para um worker depois se a página travar. Custo disso: um quadro de atraso entre boneco e água.

**Superfície (na placa de vídeo, em espaço de tela).**
1. As partículas são desenhadas como esferas, gravando só a distância até a câmera, numa imagem com metade da resolução.
2. Essa imagem é borrada duas vezes (larga e depois fina), sem misturar o que está longe com o que está perto. As bolinhas viram uma superfície lisa.
3. Da superfície lisa sai a inclinação de cada ponto, e com ela a luz: corpo escuro esverdeado, brilho das tochas, reflexo mais forte em ângulo rasante, espuma clara onde a água está rápida e solta.
4. O resultado é desenhado por cima da cena já com a profundidade certa, então coluna e boneco escondem o líquido.

**Por que assim e não uma malha 3D do líquido.**
Montar a malha a cada quadro (o método dos "cubos marchantes") custaria mais processador, que já é o gargalo. Em espaço de tela o custo é fixo pelo tamanho da tela, e a meia resolução dá pixels grossos que combinam com o estilo PSX.

**Respingos.** São as mesmas partículas: quem encosta num boneco em movimento é arrastado e uma parte é jogada para cima; gota solta voa livre, cai e volta ao líquido. Gota solta é desenhada menor.

## Como usar

```js
import * as THREE from './src/three.js';
import { criarFluido } from './fluido.js';

const fluido = criarFluido({
  THREE, scene, renderer, camera,          // camera: PerspectiveCamera (obrigatória; pode ir também no update)
  bacia: { x0, z0, x1, z1, y0 },           // caixa do líquido: paredes em x e z, y0 = fundo
  quantidade: 3000,                        // partículas no início
  luzes,                                   // PointLights da cena; usa as 4 que mais iluminam a bacia
  // opcionais:
  tile: 1,                                 // tamanho de 1 tile na cena (1 na sala fechada; 128 em arquivo cru)
  profundidade: 0.8,                       // altura do líquido parado
  maximo: 4500,                            // teto de partículas (espaço para o derramar)
  resolucao: 0.5,                          // fração da tela usada pela superfície
  iteracoes: 2, cor: 0x12383a, ambiente: 0x0c1020,
});

// a cada quadro, ANTES do renderer.render(scene, camera):
fluido.update(dt, unidades);               // unidades = [{ pos, vel?, raio, altura }]; pos = pé do boneco
fluido.derramar(300, { x, y, z });         // derrama 300 partículas a partir desse ponto
fluido.setEnabled(false);                  // esconde e para a conta
fluido.dispose();                          // libera texturas e geometria
fluido.estatisticas;                       // { particulas, maximo, msSimulacao, msDesenho, vizinhosMedios, ocultaAtrasDaCena, ... }
```

- `unidades` são cápsulas em pé. Sem `vel`, o módulo calcula pela diferença de posição entre quadros.
- **Coluna = cápsula parada** na mesma lista (`raio`, `altura` grande, `vel` zero).
- Mais partículas com a mesma bacia e profundidade = gotas menores (mais detalhe), não mais água. Mais água = `derramar` ou `profundidade` maior.

### Ligar na sala fechada

A sala já publica o que o módulo precisa em `window.sala` (lido em `sala-fechada.html`, 17/11). Testado agora pelo console, sem editar a sala, no fosso:

```js
const R = sala.agua.regioes[1];            // o fosso: x0 12, z0 22, x1 16, z1 26, fundo -2, yAgua -0.6
R.lamina.visible = false;                  // some a folha azul marcada
const fluido = criarFluido({ THREE, scene: sala.cena, renderer: sala.r, camera: sala.cam,
  bacia: { x0: R.x0, z0: R.z0, x1: R.x1, z1: R.z1, y0: R.fundo }, profundidade: R.yAgua - R.fundo,
  quantidade: 3000, luzes: sala.luzes });
// dentro do quadro(dt) da sala, antes do r.render:
fluido.update(dt, sala.unidades.map((u) => ({ pos: u.g.position, raio: 0.45, altura: u.alt })));
```

Resultado do teste (medido agora): desenhou no fosso, os bonecos na frente esconderam o líquido, console sem erro, a sala continuou desenhando normal. Ficou escuro porque o fosso está longe das tochas.
O que falta para valer na sala: o fosso não é andável hoje, então ninguém entra nele; e as colunas da sala teriam de entrar na lista como cápsulas paradas.

## Custo

PC do teste: Ryzen 9 5900XT, RTX 5070, WebGL 1. **Atenção: durante todas as medidas a máquina estava com 50% a 82% do processador ocupado por outras tarefas**, e o painel do navegador embutido estava oculto (a página foi avançada à mão, quadro a quadro). Os números oscilam com a carga; cada tabela diz que estatística usa. A taxa de quadros ao vivo (quadros por segundo com a aba na frente) **não foi medida**.

**Página de teste, navegador embutido, 1024x768, máquina a ~59% (medido agora).** Média de 90 quadros; "quadro" é o quadro inteiro com espera da placa de vídeo; "agitado" = boneco correndo em círculo dentro da bacia e 30% a mais de líquido sendo derramado.

| Partículas | Física parado | Quadro parado | Física agitado | Quadro agitado | Pior quadro |
|---|---|---|---|---|---|
| 1.500 | 2,5 ms | 2,4 ms | 2,5 ms | 3,1 ms | 5,0 ms |
| 2.000 | 2,7 ms | 3,1 ms | 3,5 ms | 3,5 ms | 5,2 ms |
| 3.000 | 4,0 ms | 4,3 ms | 5,7 ms | 5,6 ms | 7,8 ms |
| 4.000 | 6,0 ms | 5,9 ms | 6,5 ms | 6,2 ms | 9,9 ms |
| 6.000 | 8,3 ms | 8,8 ms | 7,9 ms | 8,6 ms | 15,0 ms |

(A coluna "física" é uma média móvel e a coluna "quadro" é a média simples, por isso às vezes a física aparece um pouco acima do quadro.)

**A mesma página com a máquina a ~82% (medido agora, média de 60 quadros):** tudo ficou cerca de 2,5 vezes mais lento. 2.000 partículas: quadro de 7,8 ms; 4.000: 16,3 ms; 6.000: 24,6 ms; 8.000: 33 a 40 ms. Ou seja: **a física disputa o processador com o resto do jogo e com o que mais estiver aberto.**

**Só a física, fora do navegador (Node, melhor de 8 blocos de 30 passos, boneco atravessando a bacia; medido agora em três rodadas com carga diferente):** 2.000 partículas: 1,7 a 2,8 ms; 4.000: 4,0 a 7,2 ms; 6.000: 9,0 a 11,2 ms.

Leitura:
- **A placa de vídeo custa pouco**: quadro inteiro menos física dá menos de 1 ms (medido agora).
- **Agitar custa quase o mesmo que parado** (medido agora): o líquido parado continua sendo calculado.
- Um quadro a 60 por segundo tem 16,7 ms para tudo. **Neste PC, 3.000 a 4.000 partículas custam 4 a 6 ms por quadro (medido agora); 2.000 é o número seguro se o resto da sala já pesa.**
- A rodada com a máquina livre e a aba na frente **não foi feita**: abra a página com o PC parado e use "Copiar relatório" para ter o número limpo.

**Celular (dedução, não medido em aparelho):** um celular médio faz essa conta de 3 a 5 vezes mais devagar que este PC. Com 1.500 partículas (padrão da página no celular) isso dá algo entre 7 e 13 ms de física por quadro, perto do limite; em aparelho fraco, 1.000 ou menos. A parte da placa de vídeo é leve, mas depende de o aparelho aceitar gravar profundidade no desenho final; sem isso o líquido aparece por cima de colunas e bonecos (a página avisa na linha "líquido some atrás de coluna e boneco"). Esse caminho sem profundidade **não foi testado**.

## Limites conhecidos

- Paredes da bacia são infinitas para cima: o líquido não transborda para o chão da sala.
- Só câmera em perspectiva.
- Partícula muito perto da câmera pode passar do tamanho máximo de ponto do aparelho e aparecer cortada.
- Um passo de física por quadro, com o tempo preso entre 1/120 e 1/40 de segundo: abaixo de 40 quadros por segundo o líquido fica em câmera lenta em vez de custar mais.
- O líquido é um pouco compressível (assenta cerca de 10% abaixo da profundidade pedida, medido agora). Subir `iteracoes` para 3 melhora e custa cerca de 30% a mais (medido agora, numa versão anterior do alcance entre vizinhas).
- As luzes precisam estar soltas na cena (posição do mundo = `position`).
- O líquido é desenhado antes das outras coisas transparentes, para que chama, poeira e névoa na frente dele não fiquem apagadas. O preço (dedução, pela ordem de desenho): uma chama ou poeira que esteja atrás ou dentro do líquido aparece por cima dele.
- Sem som, sem refração do fundo, sem sombra projetada pelo líquido.

## Além do que foi pedido

- `camera` é obrigatória em `criarFluido` (o pedido original não tinha): a superfície é montada a partir do que a câmera vê. Sem ela o módulo avisa com erro claro.
- `derramar(n, ponto)`, `posicoes` e `velocidades` (para som de respingo, por exemplo) no objeto devolvido.
- `criarSimulacao(...)`: a física sozinha, sem desenho.

## Não testado

- Clique real no botão "Copiar relatório" (o texto do relatório foi conferido, a cópia para a área de transferência não).
- Controle (gamepad) e toque real na tela; teclado, clique no chão, botões e barra foram testados por eventos simulados.
- Aparelho sem gravação de profundidade, cena com `tile: 128`, qualquer celular de verdade.
- Taxa de quadros ao vivo com a aba na frente e o PC livre.

## Conferir de novo

- Página: botões Derramar, Boneco 1 (WASD), Boneco 2 (setas), clique ou toque manda o boneco escolhido, controle move o escolhido, barra de partículas, Copiar relatório.
- Console da página: `quadro(1/60)` avança um quadro à mão (aba oculta não anima); `medir(4000, 120, true)` recria o líquido e devolve os ms médios.
- Só a física, sem navegador: `criarSimulacao({ bacia, quantidade })` devolve `{ passo(dt, unidades), posicoes, velocidades, n }` e roda em Node.
