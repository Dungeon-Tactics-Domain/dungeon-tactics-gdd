# Kit de interface dos visualizadores 3D do Vagrant Story (`ui-vs.css` + `ui-vs.js`)

Demonstração: <https://dungeon-tactics-lab.fernandorffdev.com/content/vagrant/ui-vs-demo.html>
(com a gaveta já aberta: acrescente `?gaveta` ao endereço).

Pedido do Fernando no grill de 17/11/2026: painéis **escuros** no estilo do Vagrant Story sobre a cena 3D (moldura de
bronze envelhecido, detalhes dourados, cantos chanfrados, menu de RPG de PS1 refinado e legível), no formato de
**tela de jogo**: cartas dos bonecos em cima, barra de ações embaixo com os ícones do controle, e uma gaveta lateral
recolhível com as ferramentas de teste. É um kit **compartilhado**; a primeira página a receber é a
`sala-fechada.html`, num passo posterior (este kit não a editou).

O tema escuro vale só para estas páginas de jogo. A regra "lab = tema Ouro e couro, só claro" continua valendo para o
resto do lab.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `ui-vs.css` | cores e medidas em `:root` (`--vs-*`) e os componentes |
| `ui-vs.js` | módulo sem dependências que monta os componentes; não importa three.js e não lê o controle |
| `ui-vs-demo.html` | página de demonstração: todos os componentes funcionando sobre uma cena simples (seis blocos) |

O site guarda `.js` e `.css` por 4 horas: importe com `?v=1` e aumente o número a cada mudança.

## Montagem mínima

```html
<link rel="stylesheet" href="./ui-vs.css?v=1">
<canvas></canvas>
<div class="vs-hud" id="hud">
  <div class="vs-topo" id="topo"></div>   <!-- cartas + botão da gaveta -->
  <div></div>                              <!-- meio livre: a cena aparece e recebe o mouse e o dedo -->
  <div class="vs-base" id="base"></div>   <!-- barra de ações -->
</div>
```

```js
import { criarBarraAcoes, criarCartasBoneco, criarGaveta, criarToggle, criarSlider, criarSelecao, criarBotao,
  criarMedidor, criarListaControles, criarAviso, ligarAtalhos } from './ui-vs.js?v=1';

const cartas = criarCartasBoneco({ bonecos, onSelecionar: (i) => seleciona(unidades[i]) });
const barra = criarBarraAcoes({ acoes, onAcao: (id, fase) => { /* fase: 'aperta' ou 'solta' */ } });
const gaveta = criarGaveta({ secoes });
const aviso = criarAviso();
topo.append(cartas.el, gaveta.botao);
base.append(barra.el);
hud.append(gaveta.el, aviso.el);   // a gaveta e o aviso entram direto na .vs-hud
```

A `.vs-hud` cobre a tela sem bloquear a cena: só os painéis recebem clique e toque.

## Componentes

| Classe | Função em `ui-vs.js` | Observações |
| --- | --- | --- |
| `.vs-painel`, `.vs-titulo`, `.vs-dica` | (só CSS) | moldura dupla com cantos chanfrados |
| `.vs-barra-acoes`, `.vs-acao` | `criarBarraAcoes({ acoes, onAcao, estilo })` | devolve `{ el, disparar, destacar, desabilitar, marcar, trocarEstilo, temPad }` |
| `.vs-cartas`, `.vs-carta-boneco` | `criarCartasBoneco({ bonecos, onSelecionar, ativo })` | devolve `{ el, selecionar, proximo, ativo }`; `retrato` (endereço de imagem) é opcional |
| `.vs-gaveta`, `.vs-secao` | `criarGaveta({ secoes, titulo, aberta })` | devolve `{ el, botao, abrir, fechar, alternar, secao(id), aberta }` |
| `.vs-botao` (`.vs-primario`, `.vs-icone`, `.vs-largo`) | `criarBotao({ id, rotulo, icone, variante, onClique })` | um só botão cheio (`vs-primario`) por painel |
| `.vs-toggle` | `criarToggle({ id, rotulo, dica, ligado, tecla, desabilitado, onMudar })` | é um `checkbox` de verdade: `$('id').checked` e `$('id').click()` funcionam |
| `.vs-slider` | `criarSlider({ id, rotulo, min, max, passo, valor, formato, onMudar })` | o valor aparece ao lado, em algarismos de largura fixa |
| `.vs-selecao` | `criarSelecao({ id, rotulo, opcoes, valor, onMudar })` | `select` nativo; `$('id').value` continua valendo |
| `.vs-medidor` | `criarMedidor({ itens })` → `atualizar({ fps: ['24', 'baixo'] })` | o nível (`bom`, `baixo`) é escrito ao lado do número |
| `.vs-lista-controles` | `criarListaControles({ controles, estilo })` | devolve `{ el, destacar(linha, ligado), trocarEstilo }` |
| `.vs-area` | (só CSS) | `textarea` somente leitura, para copiar à mão |
| `.vs-aviso` | `criarAviso()` → `mostrar(texto, { tipo, ms })` | `tipo`: `ok`, `erro`, `info`; some em 5 s |
| `.vs-tecla`, `.vs-pad` | `icone(nome)`, `iconePad(botao, estilo)` | ícones em SVG; os do controle são os da `sala-fechada.html`, redesenhados para a letra ter 16 px |

Ação que roda enquanto o botão fica apertado (Correr) leva `segurar: true`: `onAcao` recebe `'aperta'` e depois
`'solta'` (dedo, mouse, Enter, Espaço, tecla de atalho ou botão do controle).

### Destaque em tempo real

O kit não lê o controle; quem lê é a página, no laço que já existe. A cada quadro:

```js
barra.destacar('atacar', apertadas.has('k') || padBot[2] > 0.5);   // acende o botão, a tecla e o ícone
lista.destacar(4, ...);                                           // acende a linha da lista de controles
barra.temPad(!!pad);          // no celular, os ícones do controle só aparecem com um controle conectado
barra.trocarEstilo('ps');     // ou 'xbox'; a lista tem o mesmo método
```

### Atalhos

`ligarAtalhos({ barra, extras })` é opcional. Usa a `tecla` de cada ação e chama `onAcao`; `extras` recebe as outras
teclas (`{ q: () => cartas.proximo(-1), '3': () => $('t-nevoa').click() }`). Não dispara enquanto se digita ou se
escolhe num `select`, e deixa Espaço, Enter e setas para o controle que está com o foco.

**Atenção:** a página que já escuta essas teclas precisa tirar os próprios ouvintes, senão a ação roda duas vezes.

## Como a `sala-fechada.html` aplica o kit

Mapeamento feito sobre o arquivo de 17/11/2026 21:57:55 (conferido de novo às 22:20 do mesmo dia: sem mudança; outra
frente o edita, então confira os ids e os números de linha antes de aplicar). Os ids, as linhas e as funções citadas
foram lidos no arquivo; a troca em si **não foi aplicada nem testada** na página. Os ids que o script da página usa foram mantidos de propósito, para a troca mexer pouco no código.

### O que sai e o que entra

| Hoje na página | Vira | Como |
| --- | --- | --- |
| `<details id=p>` e `<details id=d>` (os dois painéis soltos) | `.vs-hud` com `.vs-topo`, meio livre e `.vs-base`, mais a gaveta | o CSS das linhas 2 a 18 sai, menos `canvas` e o direcional `#j` |
| `#b` (botões dos 8 bonecos, feitos na linha 788) | `criarCartasBoneco` | `bonecos: unidades.map((u) => ({ nome: u.nome, inimigo: u.inimigo }))`, `onSelecionar: (i) => seleciona(unidades[i])`. Em `pinta()` (linha 474), que hoje põe a classe `on` no botão do boneco ativo, chamar `cartas.selecionar(indice, { silencioso: true })` |
| `#b2` (Atacar, Magia fogo, Magia raio, Tocha; linhas 791 a 795) | `criarBarraAcoes` | teclas `k f r t`, botões do controle `2 1 6 3`; `onAcao` chama `ataca(sel)`, `conjura(sel, 'fogo')`, `conjura(sel, 'raio')` e a troca da tocha. Tocha acesa: `barra.marcar('tocha', sel.leva.ligada)` dentro de `pinta()` (linha 474) |
| `#correr` e `#pular` (botões `.tq` do celular) | mais duas ações da mesma barra | Correr: `tecla: 'shift'`, botão `7`, `segurar: true`; Pular: `tecla: ' '`, botão `0`. A variável `correTq` (linha 534) passa a ser `fase === 'aperta'` em `onAcao('correr', fase)`; o `pula(sel)` da linha 533 vai para `onAcao('pular')` |
| `#planta` (`select`) | seção **Planta** | `criarSelecao({ id: 'planta', ... })` com as mesmas opções |
| `#tex` (`select`) | seção **Texturas** | `criarSelecao({ id: 'tex', ... })` |
| `#sombras` (`select`) e `#t-sombra` (botão, tecla 1) | seção **Sombras** | `criarSelecao({ id: 'sombras', ... })`; o botão vira `criarToggle({ id: 't-sombra', tecla: '1' })` |
| `#t-nevoa` (botão, tecla 3) | seção **Fumaça** | `criarToggle({ id: 't-nevoa', tecla: '3' })`. Quando o `fumaca.js` entrar: `criarSelecao` para `setQualidade` (desligada, baixa, alta) e `criarSlider` para `uniforms.uDens`, `uAltura` e `uCob` |
| (ainda não há controle) | seção **Água** | quando o `agua.js` entrar: liga/desliga e o modo (`rasa` ou `fosso`) |
| `#n` (texto dos números) e `#fps` | seção **Desempenho**: `criarMedidor` | uma linha por número de `painel()` (linhas 749 a 755); `painel()` chama `medidor.atualizar({...})` no lugar de `$('n').textContent` |
| `#t-part`, `#t-tocha`, `#t-dobro` (botões, teclas 2, 4, 6) | seção **Desempenho**: `criarToggle` com os mesmos ids | ver "Trocas no script" |
| `#res` (`select`, tecla 5) | seção **Desempenho**: `criarSelecao({ id: 'res', ... })` | fica `select` porque tem a opção "Automática" |
| `#copiar` e `#rel` | `criarBotao({ id: 'copiar', variante: 'vs-primario vs-largo' })` | o resultado vai por `aviso.mostrar('Relatório copiado.', { tipo: 'ok' })`; o `textarea` `#rel` de reserva fica na seção com a classe `vs-area` (o navegador embutido do app recusou a cópia em 17/11, mesmo por https) |
| `#c`, `#estilo`, `#ct` (tabela de controles) | seção **Controles** | `criarSelecao({ id: 'estilo', ... })` e `criarListaControles({ controles })`; cada linha de `CONTROLES` vira `{ acao, teclado, pad }` (os campos 0, 1 e 2 de hoje) |
| `#i` (carregando, erro) | `aviso.mostrar(...)` | erro de abertura: `aviso.mostrar('Não abriu: ' + e.message, { tipo: 'erro', ms: 60000 })` |
| `#j` (direcional de toque) | fica como está | suba a barra com `--vs-barra-base` (por exemplo `180px` no celular) para ela não cobrir o direcional |
| emojis nos rótulos | ícones do kit | `icone('atacar')`, `'fogo'`, `'raio'`, `'tocha'`, `'correr'`, `'pular'`, `'texturas'`, `'sombras'`, `'planta'`, `'fumaca'`, `'agua'`, `'desempenho'`, `'controles'` |

### Trocas no script da página

- `icone()`, `FACE`, `OMBRO`, `MEIO`, `svg()` e `desenhaIcones()` (linhas 700 a 734) saem: `barra.trocarEstilo(est)` e
  `lista.trocarEstilo(est)` fazem o mesmo. `window.sala.icone` passa a apontar para `iconePad` do kit.
- `acende()` (linha 735): o cálculo de cada linha continua igual; no lugar de `classList.toggle('on', ...)` chamar
  `lista.destacar(i, ...)` e `barra.destacar(id, ...)`.
- Botão que marcava o estado com a classe `on` vira interruptor: `$(id).classList.toggle('on', v)` passa a
  `$(id).checked = v`, e `$(id).onclick = ...` passa a `onMudar` do `criarToggle` (ou `$(id).onchange`). O
  `$(TOGGLE[e.key]).click()` da linha 776 continua funcionando sem mudança.
- Se usar `ligarAtalhos`, tire os ouvintes de teclado das linhas 775 a 778 e 795. Os das linhas 518 e 524 (o conjunto
  `teclas` e `apertadas`, que move o boneco) ficam.
- `body` da página: tirar `font: 14px`; o kit usa 16 px em tudo.

## Regras que o kit segue

- Texto nunca abaixo de 16 px, inclusive as letras dos ícones do controle.
- Alvo de toque de 48 px (a regra pede 44).
- Nada depende de passar o mouse: o realce de `:hover` fica dentro de `@media (hover: hover)`.
- Todo controle tem `:active`, `:focus-visible` e `:disabled`. O foco é um anel claro com halo preto, para aparecer
  sobre qualquer parte da cena.
- Só `transform` e `opacity` se movem; a gaveta entra em 220 ms e sai em 150 ms; interruptor, slider e seção não têm
  animação (são usados muitas vezes). Com "reduzir movimento" ligado no sistema, nada desliza.
- Estado nunca só pela cor: boneco ativo tem moldura, nome em negrito e um losango; interruptor ligado muda de lado e
  ganha um visto; desabilitado tem moldura tracejada; o nível do medidor vem escrito.
- Painéis opacos, para o contraste não depender da cena.
- A gaveta **não** trava a página: dá para mexer num controle e ver a cena mudar. O foco só entra nela quando o
  botão é acionado pelo teclado (`abrir(true)`). A partir de 900 px ela ocupa uma
  coluna e a tela de jogo encolhe; abaixo disso ela cobre a tela, e o que fica embaixo é desligado (`inert`) e
  escurecido. Esc fecha e devolve o foco ao botão.

## Limites conhecidos

- **Canto chanfrado só em Chrome e Edge** (139 ou mais novos): usa `corner-shape: bevel`. Em Safari (iPad, iPhone) e
  Firefox os cantos ficam retos. Chanfro em todos os navegadores pede `clip-path` em camadas, que corta o anel de
  foco; fica como decisão do Fernando.
- Depois de mexer com o mouse num `select` ou num slider, o foco fica nele e as setas mudam o valor. A página deve
  ignorar as teclas de andar enquanto `document.activeElement` for `select` ou `input[type=range]` (a demonstração
  faz isso). Botões, interruptores e títulos de seção soltam o foco sozinhos depois do clique, para Espaço continuar
  pulando.
- A saída animada da gaveta depende de `transition-behavior: allow-discrete`; no Firefox ela some na hora.
- Seções da gaveta abrem várias ao mesmo tempo (não são abas exclusivas), para comparar Sombras com Desempenho.
- `iconePad` desenha os botões 0 a 9 e 12 a 15 e os dois analógicos; os botões 10 e 11 (apertar o analógico) não têm
  ícone.
- As cartas mostram um ícone no lugar do retrato; para usar as imagens de `rostos-2d/`, passe `retrato` em cada boneco
  (ainda não foi conferido qual arquivo é de qual personagem).
