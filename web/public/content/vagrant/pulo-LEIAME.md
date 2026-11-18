# Pulo do Vagrant Story (pulo-vs.js)

## O que é

No Vagrant Story **não existe um clipe de pulo**. O jogo monta o pulo com **cinco poses de 1 quadro**
do próprio boneco e passa de uma para outra com uma mistura (transição suave), enquanto o motor
move o corpo num arco com gravidade. Por isso a busca anterior por "clipe de pulo" não achou nada.

As poses existem nos arquivos ZUD dos quatro bonecos da sala (Ashley, Espadachim, Esqueleto,
Minotauro), nos mesmos números de slot. Não precisa converter esqueleto nem usar Mixamo.

## Fases e slots (de onde vem cada número)

| Fase | Parado | Andando | Correndo | Mistura (quadros do jogo) |
|---|---|---|---|---|
| agacha (preparo) | 47 | 47 | 47 | 4 |
| impulso (subindo) | 44 | 48 | 53 | 8 |
| topo (velocidade vertical perto de zero) | 49 | 49 | 54 | 16 |
| queda | 45 | 50 | 55 | 8 |
| pouso | 46 | 51 | 56 | 8 |
| volta ao parado | 1 | 1 | 1 | 8 |

- **Medido nos bytes:** tabelas de BATTLE.PRG (carregado em 0x80068800) nos deslocamentos 0x80AE8
  (impulso) `44 48 53 0 35 32 92 0`, 0x80AF0 (topo) `49 49 54 …`, 0x80AF8 (queda) `45 50 55 …`,
  0x80B00 (pouso) `46 51 56 …`. Colunas 0 a 2 = parado, andando, correndo.
- **Código (decompilação rood-boi):** `src/BATTLE/BATTLE.PRG/40564.c`, `func_800AC690`: estado 2
  toca a pose de impulso e dá velocidade -30 (para cima); estado 3 aplica gravidade, toca "topo"
  com |velocidade| ≤ 9 e "queda" acima disso; ao tocar o chão toca "pouso" e depois o slot 1.
  Slot 47 (agacha): `3A1A0.c` `func_800A48CC` (toca 47 com mistura 4 e espera 6 quadros) e
  `38C1C.c` `func_800A25EC` (toca 47 quando o chão some ≥ 64 unidades).
- **Dedução (não medido):** gravidade de +3 por quadro e 1 quadro = 1/30 s. Com isso o arco tem
  10 quadros de subida e 165 unidades de altura (1,3 quadrado do mapa, 128 unidades = 1 quadrado).
  O pouso no jogo dura quase nada; a página de teste segura a pose de pouso pelos 8 quadros da mistura.

Clipes em cada ZUD (dump do script `D:\Projetos\_estudo-vagrant\pulo-prints\seqdump.py`), pulo parado:
Ashley Z001U00 agacha #13, impulso #10, topo #14, queda #11, pouso #12. Todas são poses de 1 ou 2 quadros.

## Uso na sala-fechada.html

```js
import { posesDoPulo, poePose, faseDoVoo, VOO } from './pulo-vs.js';

// em abre(def), depois de z.build():
u.posesPulo = posesDoPulo(seq, 'parado'); // null se o boneco não tiver as poses

// ao apertar pular (antes do arco): 6 quadros agachado, depois o impulso
poePose(u, u.posesPulo, 'agacha');
// a cada quadro com u.pulo ativo (vy em quadrados/s, para cima positivo):
poePose(u, u.posesPulo, faseDoVoo(u.pulo.vy / PULO0 * VOO.v0));
// ao tocar o chão:
poePose(u, u.posesPulo, 'pouso'); // e uns 0,27 s depois: toca(u, 'parado')
```

- `poePose` troca `u.action` pela pose com a mistura do jogo; o próximo `toca()`/`proximo()` da
  página para essa pose como faz com qualquer gesto. Atenção: `toca()` sai cedo quando `u.atual`
  já é o mesmo gesto, então ao voltar do pulo zere `u.atual = ''` antes de `toca(u, 'parado')`.
- Hoje a sala não chama `toca()` enquanto `u.pulo` existe; isso continua certo, quem anima no ar é `poePose`.
- `faseDoVoo` espera a velocidade na escala do jogo (30 = impulso inicial); a linha acima converte
  da escala da sala (PULO0). Para o pulo andando ou correndo, crie as poses com `'andando'` ou `'correndo'`.
- Cada pose leva uma trilha de posição do osso raiz (a altura do quadril em relação ao parado),
  porque o leitor de SEQ ignora essa translação; sem ela o agachar levantaria os pés.

## Teste

`pulo-teste.html?z=Z001U00` (também Z009U00, Z028U04, Z050U03; `&modo=andando|correndo`;
`&q=N` para parar no quadro N do ciclo de 52). Prints em `D:\Projetos\_estudo-vagrant\pulo-prints`.
