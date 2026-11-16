// Generates src/content/mecanicas/habilidades.json and itens.json from the game's origin/master (via lerJogo in jogo.mjs),
// so the "Habilidades" and "Itens e equipamento" pages never drift from the game. Nothing here is a game fact typed by
// hand: every number comes from the imported data, and a field the game does not have is left out, not guessed.
// - A key of AbilityDef or ItemDef this script does not know stops it, so a new game field cannot pass silently.
// - Ranged or melee follows the engine's own test, `isRanged` in combat.ts (reach of more than 1 tile), checked by regex.
// - Who uses an ability: every unit whose ability list has it. Who can wear an item: every class (JOBS), because the
//   game checks only the slot and the chest (chest.ts, town-ui.ts), never the class.
// - Values that differ from the lab's equipamento.json go under `diferencas` (the game wins); lab pieces the game lacks
//   go under `soNoLab`.
//
// Run from web/ (the game repo must be fetched first):
//   git -C D:/Projetos/dungeon-tactics fetch origin
//   node scripts/mecanicas/habilidades-itens.mjs D:/Projetos/dungeon-tactics
//   npx prettier --write src/content/mecanicas/habilidades.json src/content/mecanicas/itens.json
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENTO, faixa, lerJogo } from './jogo.mjs';

const JOGO = process.argv[2] ?? 'D:/Projetos/dungeon-tactics';
const AQUI = dirname(fileURLToPath(import.meta.url));
const PASTA = join(AQUI, '../../src/content/mecanicas');
const LAB = JSON.parse(readFileSync(join(PASTA, 'equipamento.json'), 'utf8'));

const ARQUIVOS = [
  'src/content/units.ts',
  'src/content/abilities.ts',
  'src/content/items.ts',
  'src/content/party.ts',
  'src/shared/battle/units.ts',
  'src/shared/battle/equipment.ts',
];
const {
  commit,
  show,
  modulos: [{ UNIT_LIST }, { ABILITY_LIST }, { ITEM_LIST }, { JOBS }, { OBJECTIVE_DEF }, { SLOTS }],
} = await lerJogo(JOGO, ARQUIVOS);

const conhecidas = (lista, chaves, nome) => {
  const novas = [...new Set(lista.flatMap(Object.keys))].filter((k) => !chaves.includes(k));
  if (novas.length) throw new Error(`${nome} has fields this script does not know: ${novas.join(', ')}`);
};
conhecidas(
  ABILITY_LIST,
  [
    ...['id', 'name', 'en', 'range', 'heightRange', 'needsSight', 'radius', 'damage', 'heal', 'accuracy', 'push'],
    ...['charge', 'panel', 'magic', 'element'],
  ],
  'AbilityDef',
);
conhecidas(
  ITEM_LIST,
  ['id', 'name', 'en', 'slot', 'price', 'hp', 'physPower', 'magPower', 'hit', 'move', 'jump', 'speed'],
  'ItemDef',
);
if (
  !/export const isRanged = \(abilityId: string\) => ABILITIES\[abilityId\]\.range\[1\] > 1;/.test(
    show('src/shared/battle/combat.ts'),
  )
)
  throw new Error('isRanged changed in combat.ts');

const unidades = UNIT_LIST.filter((u) => u.id !== OBJECTIVE_DEF);
const classe = (u) => JOBS.includes(u.id);
const quem = (id) =>
  unidades
    .filter((u) => u.abilities.includes(id))
    .map((u) => ({ nome: u.name, grupo: classe(u) ? 'classe' : 'inimigo' }));

const habilidades = ABILITY_LIST.map((a) => ({
  id: a.id,
  nome: a.name,
  en: a.en,
  alcance: faixa(a.range),
  ...(a.heightRange && { sobeComAltura: true }),
  ...(a.damage[1] > 0 && { dano: faixa(a.damage) }),
  ...(a.heal[1] > 0 && { cura: faixa(a.heal) }),
  acerto: a.accuracy,
  ...(a.radius > 0 && { raio: a.radius }),
  ...(a.push > 0 && { empurra: a.push }),
  ...(a.charge > 0 && { carga: a.charge }),
  ...(a.panel && { travaNaCasa: true }),
  tipo: a.magic ? 'magia' : 'físico',
  distancia: a.range[1] > 1 ? 'à distância' : 'corpo a corpo',
  linhaDeVisao: a.needsSight,
  ...(a.element && { elemento: ELEMENTO[a.element] }),
  quem: quem(a.id),
}));

const SLOT = { weapon: 'arma', armor: 'armadura', accessory: 'acessório' };
const ATRIBUTO = {
  hp: 'vida',
  physPower: 'poder físico',
  magPower: 'poder mágico',
  hit: 'acerto',
  move: 'movimento',
  jump: 'salto',
  speed: 'velocidade',
};
const classes = unidades.filter(classe).map((u) => u.name);
const itens = ITEM_LIST.map((i) => ({
  id: i.id,
  nome: i.name,
  en: i.en,
  espaco: SLOT[i.slot],
  preco: i.price,
  atributos: Object.fromEntries(Object.keys(ATRIBUTO).flatMap((k) => (i[k] ? [[ATRIBUTO[k], i[k]]] : []))),
  quem: classes,
}));

// lab vs game (the game wins)
const diferencas = [];
const dif = (onde, campo, lab, jogo) => lab !== jogo && diferencas.push({ onde, campo, lab, jogo });
const lista = (xs) => [...xs].sort().join(', ');
// the lab writes short names ("Cavaleiro", "Colosso"): the exact unit, or the only one whose name starts with it
const unidadeDoLab = (n) => {
  const exata = unidades.find((u) => u.name === n);
  const comeco = unidades.filter((u) => u.name.startsWith(`${n} `));
  return exata?.name ?? (comeco.length === 1 ? comeco[0].name : `${n} (não achada no jogo)`);
};
for (const l of LAB.habilidades) {
  // "Escudada (20–25, empurra 2)": name, the damage or heal range, then the extras
  const m = /^(.+?) \((\d+)–(\d+)(.*)\)$/.exec(l.habilidade);
  if (!m) throw new Error(`lab ability not understood: ${l.habilidade}`);
  const a = ABILITY_LIST.find((x) => x.name.toLowerCase() === m[1].toLowerCase());
  if (!a) {
    diferencas.push({ onde: m[1], campo: 'habilidade', lab: 'existe', jogo: 'não existe' });
    continue;
  }
  const h = habilidades.find((x) => x.id === a.id);
  dif(a.name, 'nome', m[1], a.name);
  dif(a.name, a.heal[1] > 0 ? 'cura' : 'dano', `${m[2]}–${m[3]}`, h.cura ?? h.dano);
  dif(a.name, 'tipo', l.tipo === 'magia' ? 'magia' : 'físico', h.tipo);
  dif(a.name, 'elemento', l.elemento === '—' ? 'nenhum' : l.elemento, h.elemento ?? 'nenhum');
  const emp = /empurra (\d+)/.exec(m[4]);
  if (emp) dif(a.name, 'empurrão', Number(emp[1]), a.push);
  const raio = /raio (\d+)/.exec(m[4]);
  if (raio) dif(a.name, 'raio', Number(raio[1]), a.radius);
  dif(a.name, 'quem usa', lista(l.classe.split(', ').map(unidadeDoLab)), lista(h.quem.map((q) => q.nome)));
}
for (const a of ABILITY_LIST)
  if (!LAB.habilidades.some((l) => l.habilidade.toLowerCase().startsWith(`${a.name.toLowerCase()} (`)))
    diferencas.push({ onde: a.name, campo: 'habilidade', lab: 'não existe', jogo: 'existe' });
const diferencasHab = diferencas.splice(0);

// "+20 poder físico, −20% gelo": a signed number (the lab writes the minus as U+2212), an optional %, then the field
const ESPACO_LAB = { 'mão principal': 'arma', corpo: 'armadura', acessório: 'acessório' };
const SO_NO_LAB = [
  'física',
  'mágica',
  'esquiva',
  'mana',
  'stamina',
  'regen de mana',
  'regen de vida',
  ...Object.values(ELEMENTO),
];
const soNoLab = [];
for (const l of LAB.pecas) {
  const atributos = {};
  for (const parte of l.atributos.split(', ')) {
    const m = /^([+−-])(\d+)(%?) (.+)$/.exec(parte);
    if (!m) throw new Error(`lab attribute not understood: ${l.nome}: ${parte}`);
    const campo = m[4];
    if (!Object.values(ATRIBUTO).includes(campo) && !SO_NO_LAB.includes(campo))
      throw new Error(`lab attribute field not known: ${l.nome}: ${campo}`);
    atributos[campo] = (m[1] === '+' ? 1 : -1) * Number(m[2]);
  }
  const i = itens.find((x) => x.nome === l.nome);
  if (!i) {
    soNoLab.push(l);
    continue;
  }
  dif(i.nome, 'espaço', ESPACO_LAB[l.espaco] ?? l.espaco, i.espaco);
  for (const campo of Object.values(ATRIBUTO)) dif(i.nome, campo, atributos[campo] ?? 0, i.atributos[campo] ?? 0);
}
for (const i of itens)
  if (!LAB.pecas.some((l) => l.nome === i.nome))
    diferencas.push({ onde: i.nome, campo: 'peça', lab: 'não existe', jogo: 'existe' });

const fonte = (arquivos) => ({ repositorio: 'dungeon-tactics', commit, arquivos });
writeFileSync(
  join(PASTA, 'habilidades.json'),
  JSON.stringify({
    fonte: {
      ...fonte([
        'src/content/abilities.ts',
        'src/content/units.ts',
        'src/content/party.ts',
        'src/shared/battle/combat.ts',
      ]),
      // true while no ability has `cost`: `conhecidas` above stops the script the day one does
      semCusto: 'nenhum: nenhuma habilidade do jogo tem custo, ainda não há mana nem stamina',
    },
    unidades: Object.fromEntries(unidades.map((u) => [u.id, u.abilities])),
    habilidades,
    diferencas: diferencasHab,
  }),
);
writeFileSync(
  join(PASTA, 'itens.json'),
  JSON.stringify({
    fonte: {
      ...fonte([
        'src/content/items.ts',
        'src/shared/battle/equipment.ts',
        'src/client/chest.ts',
        'src/client/town-ui.ts',
      ]),
      espacos: SLOTS.map((s) => SLOT[s]),
      semCampos:
        'o jogo ainda não tem raridade, resistência em %, esquiva, mana, stamina, regeneração nem os espaços do lab além de arma, armadura e acessório',
      semClasse: 'o jogo não restringe peça por classe: confere só o espaço e o baú',
    },
    itens,
    soNoLab,
    diferencas,
  }),
);
console.log(
  `${habilidades.length} habilidades, ${itens.length} itens, ${soNoLab.length} só no lab, ${diferencasHab.length + diferencas.length} diferenças, origin/master ${commit.slice(0, 7)}`,
);
