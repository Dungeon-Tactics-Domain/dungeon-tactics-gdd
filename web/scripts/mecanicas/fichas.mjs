// Generates src/content/mecanicas/fichas.json: one sheet per class and enemy, read from the game repo, so the
// "Fichas de classes e inimigos" page never drifts from the game.
//
// How it works:
// 1. `lerJogo` (jogo.mjs) copies the game's data files (units, abilities, party, the unit registry) from origin/master
//    into a temp folder and imports them as TypeScript.
// 2. The few engine numbers it needs (default jump, charging and dodge shares, undead heal) are read from pathing.ts and
//    combat.ts with a regex; a missing match stops the script, so a rename in the game cannot pass silently.
// 3. Classes are the game's JOBS (party.ts); enemies are every other unit except the Beacon (OBJECTIVE_DEF).
// 4. Role, strengths, weaknesses and how to face a unit are derived by fixed rules from the numbers; each sentence
//    carries the rule that produced it. When no rule fires, the field is left out instead of guessed.
// 5. Values that differ from the lab's equipamento.json are listed under `diferencas` (the game wins).
// The game has no starting weapon per class (no unit or party entry names an item), so the sheet has no weapon field.
//
// Run from web/ (the game repo must be fetched first):
//   git -C D:/Projetos/dungeon-tactics fetch origin
//   node scripts/mecanicas/fichas.mjs D:/Projetos/dungeon-tactics
//   npx prettier --write src/content/mecanicas/fichas.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENTO, faixa, lerJogo } from './jogo.mjs';

const JOGO = process.argv[2] ?? 'D:/Projetos/dungeon-tactics';
const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, '../../src/content/mecanicas/fichas.json');
const LAB = JSON.parse(readFileSync(join(AQUI, '../../src/content/mecanicas/equipamento.json'), 'utf8'));

const ARQUIVOS = [
  'src/content/units.ts',
  'src/content/abilities.ts',
  'src/content/party.ts',
  'src/shared/battle/units.ts',
];
const {
  commit,
  show,
  modulos: [{ UNIT_LIST }, { ABILITY_LIST }, { JOBS }, { OBJECTIVE_DEF }],
} = await lerJogo(JOGO, ARQUIVOS);

const numero = (fonte, re, nome) => {
  const m = re.exec(fonte);
  if (!m) throw new Error(`${nome} not found in the game source`);
  return m.slice(1).map(Number);
};
const pathing = show('src/shared/battle/pathing.ts');
const combat = show('src/shared/battle/combat.ts');
const [PULO] = numero(pathing, /export const MAX_JUMP = (\d+)/, 'MAX_JUMP');
const [CARGA_FIS] = numero(combat, /CHARGING_PHYS: (\d+)/, 'CHARGING_PHYS');
const [CARGA_MAG] = numero(combat, /CHARGING_MAG: (\d+)/, 'CHARGING_MAG');
const [LADO, COSTAS] = numero(combat, /DODGE_BY_SIDE: \{ front: \d+, side: (\d+), back: (\d+) \}/, 'DODGE_BY_SIDE');
const [CURA_MORTO] = numero(combat, /UNDEAD_HEAL: ([\d.]+)/, 'UNDEAD_HEAL');

const RESIST = { phys: 'física', mag: 'mágica', ...ELEMENTO };
const HAB = Object.fromEntries(ABILITY_LIST.map((a) => [a.id, a]));
const ataca = (a) => a.damage[1] > 0;
const lista = (xs) => xs.join(', ');
const casas = (n) => (n === 1 ? '1 casa' : `${n} casas`);
// a resistance as the change in damage taken: 25 → −25%, −10 → +10%
const pct = (v) => (v > 0 ? `−${v}%` : v < 0 ? `+${-v}%` : '0%');

function ficha(u) {
  const habs = u.abilities.map((id) => HAB[id]);
  const golpes = habs.filter(ataca);
  const basico = habs[0];
  const res = Object.fromEntries(Object.keys(RESIST).map((k) => [k, u.resist?.[k] ?? 0]));
  const pulo = u.jump ?? PULO;
  const longe = golpes.reduce((m, a) => (a.range[1] > (m?.range[1] ?? -1) ? a : m), undefined);
  const forte = golpes.reduce((m, a) => (a.damage[1] > (m?.damage[1] ?? -1) ? a : m), undefined);
  const cura = habs.find((a) => a.heal[1] > 0);
  const area = golpes.filter((a) => a.radius > 0);
  const empurra = habs.filter((a) => a.push > 0);
  const carga = habs.filter((a) => a.charge > 0);
  const semPerto = golpes.length > 0 && golpes.every((a) => a.range[0] > 1);
  const soPerto = golpes.length > 0 && longe.range[1] <= 2;
  const fragil = u.hp <= 130;
  const perto = golpes.filter((a) => a.range[0] <= 1);
  const pertoForte = perto.reduce((m, a) => (a.damage[1] > (m?.damage[1] ?? -1) ? a : m), undefined);
  const r = (texto, regra) => ({ texto, regra });

  const papel = (() => {
    const s = fragil ? ' frágil' : '';
    if (u.move === 0 && (u.size ?? 1) >= 2) return r('Chefe gigante que não anda', 'movimento 0 e tamanho 2x2');
    if (cura && basico.magic)
      return r(`Conjurador${s} que cura`, 'tem cura e o ataque básico é magia' + (s && '; vida ≤ 130'));
    if (basico.magic && basico.range[1] >= 4)
      return r(`Conjurador à distância${s}`, 'ataque básico é magia com alcance 4 ou mais' + (s && '; vida ≤ 130'));
    if (basico.range[1] >= 4)
      return r(`Atirador${s}`, 'ataque básico físico com alcance 4 ou mais' + (s && '; vida ≤ 130'));
    if (basico.range[1] === 2) return r('Corpo a corpo com alcance 2', 'ataque básico chega a 2 casas');
    if (u.hp >= 300) return r('Brutamontes', 'corpo a corpo com vida 300 ou mais');
    if (res.phys >= 25) return r('Linha de frente blindada', 'corpo a corpo com resistência física 25% ou mais');
    if (u.speed >= 11)
      return r(`Corpo a corpo rápido${s}`, 'corpo a corpo com velocidade 11 ou mais' + (s && '; vida ≤ 130'));
    return r('Corpo a corpo', 'ataque básico de 1 casa, sem outro destaque');
  })();

  const forcas = [
    u.hp >= 200 && r(`Muita vida: ${u.hp}`, 'vida 200 ou mais'),
    u.speed >= 10 && r(`Rápido: velocidade ${u.speed}, joga mais vezes`, 'velocidade 10 ou mais'),
    pulo >= 2 && r(`Sobe ${pulo} níveis por passo`, `pulo 2 ou mais (o padrão é ${PULO})`),
    res.phys >= 20 && r(`Aguenta golpes físicos: −${res.phys}% de dano`, 'resistência física 20% ou mais'),
    res.mag >= 20 && r(`Aguenta magia: −${res.mag}% de dano`, 'resistência mágica 20% ou mais'),
    ...Object.keys(ELEMENTO)
      .filter((k) => res[k] >= 25)
      .map((k) => r(`Resiste a ${ELEMENTO[k]}: −${res[k]}% de dano`, 'resistência a um elemento 25% ou mais')),
    (u.dodge ?? 0) >= 15 && r(`Esquiva ${u.dodge}% dos golpes de frente`, 'esquiva 15% ou mais'),
    forte?.damage[1] >= 120 &&
      r(`Golpe forte: ${forte.name} tira até ${forte.damage[1]}`, 'uma habilidade com dano máximo 120 ou mais'),
    area.length > 0 &&
      r(
        `Ataque em área: ${lista(area.map((a) => `${a.name} (raio ${a.radius})`))}`,
        'habilidade de dano com raio 1 ou mais',
      ),
    cura && r(`Cura aliados: ${cura.name} recupera ${faixa(cura.heal)}`, 'tem habilidade de cura'),
    longe?.range[1] >= 5 &&
      r(
        `Ataca de longe: até ${longe.range[1]} casas (${longe.name})${longe.heightRange ? ', +1 por nível acima do alvo' : ''}`,
        'alcance máximo 5 ou mais',
      ),
    empurra.length > 0 &&
      r(`Empurra: ${lista(empurra.map((a) => `${a.name} (${a.push})`))}`, 'habilidade com empurrão'),
  ].filter(Boolean);

  const fraquezas = [
    fragil && r(`Pouca vida: ${u.hp}`, 'vida 130 ou menos'),
    u.speed > 0 && u.speed <= 6 && r(`Lento: velocidade ${u.speed}, joga menos vezes`, 'velocidade 6 ou menos'),
    u.move === 0 && r('Não anda', 'movimento 0'),
    u.move > 0 && u.move <= 3 && r(`Anda pouco: ${u.move} casas`, 'movimento 3 ou menos'),
    ...Object.keys(RESIST)
      .filter((k) => res[k] < 0)
      .map((k) =>
        r(
          `Sofre mais com ${k === 'phys' || k === 'mag' ? `dano de ${k === 'phys' ? 'golpe físico' : 'magia'}` : RESIST[k]}: +${-res[k]}%`,
          'resistência negativa',
        ),
      ),
    u.undead &&
      r(`Morto-vivo: a cura fere em vez de curar (${CURA_MORTO * 100}% do valor)`, 'morto-vivo (undead) no jogo'),
    semPerto &&
      r(
        `Não ataca a casa ao lado: alcance mínimo ${Math.min(...golpes.map((a) => a.range[0]))}`,
        'toda habilidade de dano começa em 2 casas ou mais',
      ),
    soPerto && r(`Só ataca de perto: até ${casas(longe.range[1])}`, 'nenhuma habilidade de dano passa de 2 casas'),
    carga.length > 0 &&
      r(
        `Carrega: ${lista(carga.map((a) => `${a.name} (${a.charge} tiques)`))}; enquanto isso perde ${CARGA_FIS}% de resistência física e ${CARGA_MAG}% de mágica`,
        'habilidade com carga',
      ),
  ].filter(Boolean);

  const magiaMelhor = (res.phys >= 20 && res.mag < res.phys) || res.mag < 0;
  const comoEnfrentar = [
    cura && r('Derrube primeiro: ele cura os aliados', 'tem habilidade de cura'),
    fragil && r(`Poucos golpes derrubam: ${u.hp} de vida`, 'vida 130 ou menos'),
    semPerto &&
      r('Chegue colado: na vez dele, nenhum ataque alcança a casa ao lado', 'toda habilidade de dano começa em 2+'),
    soPerto &&
      r(
        `Ataque de longe: na vez dele chega a ${u.move + longe.range[1]} casas (anda ${u.move} + alcance ${longe.range[1]}, em terreno plano)`,
        'nenhuma habilidade de dano passa de 2 casas; movimento + alcance',
      ),
    basico.range[1] >= 4 &&
      pertoForte &&
      pertoForte.damage[1] < basico.damage[1] &&
      r(
        `Chegue perto: na casa ao lado ele só usa ${pertoForte.name} (${faixa(pertoForte.damage)})`,
        'ataque básico de 4+ casas; o melhor golpe de 1 casa tira menos que ele',
      ),
    carga.length > 0 && r('Quando ele carregar, bata nele: carregando, defende pior', 'habilidade com carga'),
    magiaMelhor &&
      r(
        `Prefira magia: dano físico ${pct(res.phys)}, dano mágico ${pct(res.mag)}`,
        'resistência física 20%+ e maior que a mágica, ou mágica negativa',
      ),
    res.phys < 0 && r(`Prefira golpes físicos: +${-res.phys}% de dano`, 'resistência física negativa'),
    (u.dodge ?? 0) >= 15 &&
      r(
        `Bata de lado ou por trás: lá só ${LADO}% e ${COSTAS}% da esquiva contam`,
        'esquiva 15% ou mais; a esquiva conta menos de lado e de costas',
      ),
  ].filter(Boolean);

  return {
    id: u.id,
    nome: u.name,
    grupo: JOBS.includes(u.id) ? 'classe' : 'inimigo',
    vida: u.hp,
    velocidade: u.speed,
    movimento: u.move,
    pulo,
    tamanho: u.size ?? 1,
    esquiva: u.dodge ?? 0,
    resistencias: Object.fromEntries(Object.entries(res).filter(([, v]) => v !== 0)),
    ...(u.undead && { mortoVivo: true }),
    alcanceBasico: { habilidade: basico.name, casas: faixa(basico.range) },
    ...(longe && {
      alcanceMaximo: { habilidade: longe.name, casas: longe.range[1], sobeComAltura: longe.heightRange },
    }),
    habilidades: habs.map((a) => ({
      nome: a.name,
      alcance: faixa(a.range),
      ...(ataca(a) && { dano: faixa(a.damage) }),
      ...(a.heal[1] > 0 && { cura: faixa(a.heal) }),
      acerto: a.accuracy,
      ...(a.radius > 0 && { raio: a.radius }),
      ...(a.push > 0 && { empurra: a.push }),
      ...(a.charge > 0 && { carga: a.charge }),
      ...(a.magic && { magia: true }),
      ...(a.element && { elemento: ELEMENTO[a.element] }),
    })),
    papel,
    ...(forcas.length && { forcas }),
    ...(fraquezas.length && { fraquezas }),
    ...(comoEnfrentar.length && { comoEnfrentar }),
  };
}

const fichas = UNIT_LIST.filter((u) => u.id !== OBJECTIVE_DEF).map(ficha);

// lab vs game: life, resistances and dodge of each unit, and damage or heal of each ability (the game wins)
const ELEMENTO_PT = Object.fromEntries(Object.entries(ELEMENTO).map(([k, v]) => [v, k]));
const porNome = Object.fromEntries(UNIT_LIST.map((u) => [u.name, u]));
const diferencas = [];
const dif = (onde, campo, lab, jogo) => lab !== jogo && diferencas.push({ onde, campo, lab, jogo });
for (const l of [...LAB.classes, ...LAB.inimigos]) {
  const u = porNome[l.nome];
  if (!u) {
    diferencas.push({ onde: l.nome, campo: 'unidade', lab: 'existe', jogo: 'não existe' });
    continue;
  }
  dif(l.nome, 'vida', l.vida, u.hp);
  dif(l.nome, 'resistência física', l.resFisica, u.resist?.phys ?? 0);
  dif(l.nome, 'resistência mágica', l.resMagica, u.resist?.mag ?? 0);
  dif(l.nome, 'esquiva', l.esquiva, u.dodge ?? 0);
  // "luz −50, sombra +75 (nota…)": a word followed by a signed number; the lab writes the minus as U+2212
  const labEl = Object.fromEntries(
    [...l.elementos.matchAll(/(\p{L}+) ([+−-]\d+)/gu)].map((m) => [ELEMENTO_PT[m[1]], Number(m[2].replace('−', '-'))]),
  );
  for (const k of Object.keys(ELEMENTO)) dif(l.nome, `resistência a ${ELEMENTO[k]}`, labEl[k] ?? 0, u.resist?.[k] ?? 0);
}
for (const l of LAB.habilidades) {
  // "Golpe (50–80)": name, then the damage or heal range
  const m = /^(.+?) \((\d+)–(\d+)/.exec(l.habilidade);
  const a = m && ABILITY_LIST.find((x) => x.name.toLowerCase() === m[1].toLowerCase());
  if (!a) {
    diferencas.push({ onde: l.habilidade, campo: 'habilidade', lab: 'existe', jogo: 'não achada' });
    continue;
  }
  const jogo = a.heal[1] > 0 ? a.heal : a.damage;
  dif(a.name, a.heal[1] > 0 ? 'cura' : 'dano', `${m[2]}–${m[3]}`, faixa(jogo));
}
for (const u of UNIT_LIST) {
  if (u.id === OBJECTIVE_DEF || porNome[u.name] === undefined) continue;
  if (![...LAB.classes, ...LAB.inimigos].some((l) => l.nome === u.name))
    diferencas.push({ onde: u.name, campo: 'unidade', lab: 'não existe', jogo: 'existe' });
}

writeFileSync(
  SAIDA,
  JSON.stringify({
    fonte: {
      repositorio: 'dungeon-tactics',
      commit,
      arquivos: [...ARQUIVOS, 'src/shared/battle/pathing.ts', 'src/shared/battle/combat.ts'],
      semArmaInicial: 'o jogo não dá arma inicial a nenhuma classe; a ficha não tem esse campo',
    },
    fichas,
    diferencas,
  }),
);
console.log(`${fichas.length} fichas, ${diferencas.length} diferenças, origin/master ${commit.slice(0, 7)}`);
