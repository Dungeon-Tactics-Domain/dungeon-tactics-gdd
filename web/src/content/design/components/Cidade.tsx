// Walkable town draft (grill of 15/11): the 40 x 30 map seen from above, with the places, the NPCs and what each town
// level adds. Hovering or focusing an NPC (on the map or in the list) shows its lines; everything reads cidade.ts.
import { useState } from 'react';
import {
  CAMPO,
  CASAS,
  CHAVE,
  LUGARES,
  MAPA,
  MURO,
  type Modelo,
  type Nivel,
  NIVEIS,
  type Npc,
  NPCS,
  SERVICO,
} from '../cidade';

type Lang = 'pt' | 'en';
const CEL = 22; // px per tile: the whole map is 880 px wide, the numbers inside fit 14 px text
const BOTAO =
  'min-h-11 cursor-pointer rounded-[3px] border border-borda bg-folha px-3 text-[15px] text-tinta hover:bg-lab-soft aria-pressed:border-lab aria-pressed:bg-lab aria-pressed:text-white';
const COR: Record<string, string> = {
  '.': '#cfe3b0',
  ',': '#ddd8c8',
  '+': '#b3a27c',
  '@': '#ddd8c8',
  '=': '#b08a5a',
  '~': '#5f97c0',
  w: '#a9cfe3',
  T: '#4f7a3a',
  r: '#8a8174',
  ':': '#c4bcab',
  '/': '#a39a8b',
  '#': '#6b5a45',
  h: '#c9a27a',
  f: '#e6d27e',
  c: '#a77b4f',
  b: '#a77b4f',
};
// a lot still waiting for its building (ruin, scaffolding, bare ground, foundation)
const EM_OBRA = new Set<Modelo>(['building_destroyed', 'building_scaffolding', 'building_dirt', 'building_stage_A']);
// the door comes from the data (`porta`); the '+' in the ASCII is only a reading aid (the clifftop door is a ':')
const PORTAS = new Set(LUGARES.map((l) => `${l.porta.x},${l.porta.y}`));
// a place's menu works once its service NPC is in town (the barracks: level 2, with Tobias)
const menuDesde = (letra: string) =>
  Math.min(...NPCS.filter((n) => n.lugar === letra && n.servico).map((n) => n.nivel));
const loteEm = (x: number, y: number) =>
  LUGARES.flatMap((l) => l.lotes).find((lo) => x >= lo.x && x < lo.x + lo.w && y >= lo.y && y < lo.y + lo.h);
// tiles of an NPC's short walk, from `em` to `ate` in a straight line
const trecho = (n: Npc) => {
  if (!n.ate) return [n.em];
  const dx = Math.sign(n.ate.x - n.em.x);
  const dy = Math.sign(n.ate.y - n.em.y);
  const passos = Math.abs(n.ate.x - n.em.x) + Math.abs(n.ate.y - n.em.y);
  return Array.from({ length: passos + 1 }, (_, i) => ({ x: n.em.x + dx * i, y: n.em.y + dy * i }));
};

function Grupo<T extends string | number>({
  rotulo,
  itens,
  valor,
  onPick,
}: {
  rotulo: string;
  itens: [T, string][];
  valor: T;
  onPick: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap items-center gap-2">
      <span className="text-[15px] font-bold">{rotulo}</span>
      {itens.map(([v, texto]) => (
        <button key={v} type="button" aria-pressed={v === valor} onClick={() => onPick(v)} className={BOTAO}>
          {texto}
        </button>
      ))}
    </div>
  );
}

export function Cidade() {
  const [lang, setLang] = useState<Lang>('pt');
  const [nivel, setNivel] = useState<Nivel>(1);
  const [sel, setSel] = useState<Npc>(NPCS[0]!);
  const t = ([pt, en]: [string, string]) => (lang === 'pt' ? pt : en);
  const npcs = NPCS.filter((n) => n.nivel <= nivel);
  const trechos = new Set(npcs.flatMap((n) => trecho(n).map((p) => `${p.x},${p.y}`)));
  const lugar = (letra: string) => LUGARES.find((l) => l.letra === letra)!;
  const modelo = (m: Modelo) => m.replace(/_blue$/, '');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 text-[15px]">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Grupo
          rotulo={t(['Nível da cidade', 'Town level'])}
          itens={([1, 2, 3] as Nivel[]).map((n) => [n, `${n} · ${t(NIVEIS[n].nome)}`])}
          valor={nivel}
          onPick={setNivel}
        />
        <Grupo
          rotulo={t(['Idioma', 'Language'])}
          itens={[
            ['pt', 'Português'],
            ['en', 'English'],
          ]}
          valor={lang}
          onPick={setLang}
        />
      </div>
      <p className="m-0" role="status">
        <strong>{t(NIVEIS[nivel].nome)}:</strong> {t(NIVEIS[nivel].resumo)}
      </p>

      {/* townsfolk | map | lines: three panels on the ultrawide; below it the map and the lines wrap side by side and the
          townsfolk list follows in a full row */}
      <div className="flex flex-wrap items-start gap-5 ultra:grid ultra:grid-cols-[minmax(280px,380px)_max-content_minmax(360px,72ch)]">
        <div className="min-w-0 max-w-full overflow-x-auto border border-borda bg-folha p-2">
          <div className="relative">
            <div
              role="img"
              aria-label={t([
                `Mapa da cidade, 40 por 30, nível ${nivel}: ${npcs.length} moradores à vista`,
                `Town map, 40 by 30, level ${nivel}: ${npcs.length} townsfolk in view`,
              ])}
              className="relative grid"
              style={{ gridTemplateColumns: `repeat(40, ${CEL}px)`, gridAutoRows: `${CEL}px` }}
            >
              {MAPA.flatMap((linha, y) =>
                [...linha].map((c, x) => {
                  const lo = loteEm(x, y);
                  const obra = lo && EM_OBRA.has(lo.modelos[nivel - 1]!);
                  const fundo = lo ? (obra ? '#efe6c8' : '#2f5f8a') : PORTAS.has(`${x},${y}`) ? COR['+'] : COR[c];
                  const rotulo = lo && lo.x === x && lo.y === y ? c : c === '@' ? '★' : '';
                  return (
                    <span
                      key={`${x},${y}`}
                      className="grid place-items-center text-[14px] font-bold leading-none"
                      style={{
                        background: obra ? `repeating-linear-gradient(45deg, ${fundo} 0 4px, #c9b98a 4px 6px)` : fundo,
                        color: lo && !obra ? '#fff' : '#2b2a22',
                        outline: trechos.has(`${x},${y}`) ? '2px dashed #9b2f2f' : undefined,
                        outlineOffset: -3,
                      }}
                    >
                      {rotulo}
                    </span>
                  );
                }),
              )}
            </div>
            {/* the markers sit over the grid, outside the img so they stay buttons */}
            {npcs.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-label={`${NPCS.indexOf(n) + 1}. ${n.nome}, ${t(n.papel)}`}
                aria-pressed={sel === n}
                onMouseEnter={() => setSel(n)}
                onFocus={() => setSel(n)}
                onClick={() => setSel(n)}
                className="absolute grid cursor-pointer place-items-center rounded-full border-2 border-white bg-couro-escuro text-[14px] font-bold text-white aria-pressed:bg-erro max-[1023px]:z-10 max-[1023px]:size-11! max-[1023px]:-translate-x-2.5 max-[1023px]:-translate-y-2.5"
                style={{ left: n.em.x * CEL - 1, top: n.em.y * CEL - 1, width: CEL + 2, height: CEL + 2 }}
              >
                {NPCS.indexOf(n) + 1}
              </button>
            ))}
          </div>
        </div>

        <section
          aria-label={t(['Fala', 'Lines'])}
          className="grid min-w-[280px] flex-1 gap-2 border border-borda bg-folha p-3 ultra:sticky ultra:top-[calc(var(--reino-h)+16px)]"
        >
          <strong className="text-[17px]">
            {NPCS.indexOf(sel) + 1}. {sel.nome}
          </strong>
          <span>
            {t(sel.papel)} · {t(lugar(sel.lugar).nome)} · {t(['boneco', 'model'])} {sel.boneco}
          </span>
          <span className="text-apagado">
            {sel.ate
              ? t([
                  `Passeio curto de (${sel.em.x},${sel.em.y}) a (${sel.ate.x},${sel.ate.y})`,
                  `Short walk from (${sel.em.x},${sel.em.y}) to (${sel.ate.x},${sel.ate.y})`,
                ])
              : t([`Parado em (${sel.em.x},${sel.em.y})`, `Standing at (${sel.em.x},${sel.em.y})`])}
            {' · '}
            {t(['aparece no nível', 'appears at level'])} {sel.nivel}
          </span>
          <ul className="m-0 grid gap-1.5 pl-5">
            {sel.falas.map((f) => (
              <li key={f[0]}>{t(f)}</li>
            ))}
          </ul>
          <span>
            {sel.servico
              ? `${t(['Depois da fala abre:', 'After the line it opens:'])} ${t(SERVICO[sel.servico])}`
              : t(['Só conversa, sem menu.', 'Talk only, no menu.'])}
          </span>
          {sel.nivel > nivel && (
            <span className="text-erro">
              {t(['Ainda não está na cidade neste nível.', 'Not in town yet at this level.'])}
            </span>
          )}
        </section>

        <section className="grid basis-full gap-2 ultra:order-first">
          <strong className="text-[17px]">{t(['Moradores', 'Townsfolk'])}</strong>
          <ul className="m-0 grid list-none gap-1 p-0 sm:grid-cols-2 ultra:grid-cols-1">
            {NPCS.map((n, i) => (
              <li key={n.id}>
                <button
                  type="button"
                  aria-pressed={sel === n}
                  onMouseEnter={() => setSel(n)}
                  onFocus={() => setSel(n)}
                  onClick={() => setSel(n)}
                  className={`${BOTAO} w-full text-left`}
                >
                  {i + 1}. {n.nome} · {t(n.papel)}
                  {n.nivel > 1 ? ` · ${t(['nível', 'level'])} ${n.nivel}` : ''}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="grid gap-2">
        <strong className="text-[17px]">
          {t(['Lugares e modelos KayKit por nível', 'Places and KayKit models per level'])}
        </strong>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="text-left">
                <th className="border-b border-borda p-1.5">{t(['Lugar', 'Place'])}</th>
                {([1, 2, 3] as Nivel[]).map((n) => (
                  <th key={n} className={`border-b border-borda p-1.5 ${n === nivel ? 'bg-lab-soft' : ''}`}>
                    {t(['Nível', 'Level'])} {n}
                  </th>
                ))}
                <th className="border-b border-borda p-1.5">{t(['Menu', 'Menu'])}</th>
                <th className="border-b border-borda p-1.5">{t(['Por quê', 'Why'])}</th>
              </tr>
            </thead>
            <tbody>
              {LUGARES.map((l) => (
                <tr key={l.letra} className="align-top">
                  <td className="border-b border-borda p-1.5">
                    <strong>{l.letra}</strong> {t(l.nome)}
                  </td>
                  {([1, 2, 3] as Nivel[]).map((n) => (
                    <td key={n} className={`border-b border-borda p-1.5 ${n === nivel ? 'bg-lab-soft' : ''}`}>
                      {l.lotes.map((lo) => modelo(lo.modelos[n - 1]!)).join(' + ')}
                    </td>
                  ))}
                  <td className="border-b border-borda p-1.5">
                    {l.servico
                      ? `${t(SERVICO[l.servico])}${menuDesde(l.letra) > 1 ? ` (${t(['a partir do nível', 'from level'])} ${menuDesde(l.letra)})` : ''}`
                      : '—'}
                  </td>
                  <td className="border-b border-borda p-1.5">{t(l.porque)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span className="text-apagado">
          {t([
            `Muro: ${MURO.map(modelo).join(' → ')}. Casas: ${CASAS.map(modelo).join(', ')}. Campo: ${CAMPO}. Cor dos telhados: azul (os cristais dos faróis).`,
            `Wall: ${MURO.map(modelo).join(' → ')}. Houses: ${CASAS.map(modelo).join(', ')}. Field: ${CAMPO}. Roof colour: blue (the beacons' crystals).`,
          ])}
        </span>
      </section>

      <section className="grid gap-2">
        <strong className="text-[17px]">{t(['Legenda', 'Legend'])}</strong>
        <ul className="m-0 grid list-none gap-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(COR).map(([c, cor]) => (
            <li key={c} className="flex items-center gap-2">
              <span className="inline-block size-5 shrink-0 border border-borda" style={{ background: cor }} />
              <code className="text-[14px]">{c}</code> {t(CHAVE[c]!.nome)}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="inline-block size-5 shrink-0" style={{ background: '#2f5f8a' }} />
            <code className="text-[14px]">A–J</code> {t(['prédio pronto', 'building done'])}
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block size-5 shrink-0"
              style={{ background: 'repeating-linear-gradient(45deg, #efe6c8 0 4px, #c9b98a 4px 6px)' }}
            />
            {t([
              'lote em obra (ruína, andaime, terreno, alicerce)',
              'lot under works (ruin, scaffolding, bare, foundation)',
            ])}
          </li>
          <li className="flex items-center gap-2">
            <span
              className="inline-block size-5 shrink-0"
              style={{ outline: '2px dashed #9b2f2f', outlineOffset: -3 }}
            />
            {t(['trecho do passeio de um morador', "a townsperson's walk"])}
          </li>
        </ul>
      </section>

      <details className="border border-borda bg-folha p-3">
        <summary className="min-h-11 cursor-pointer content-center font-bold">
          {t(['Mapa em ASCII (formato de dados)', 'ASCII map (data format)'])}
        </summary>
        <pre className="m-0 overflow-x-auto text-[14px] leading-tight">{MAPA.join('\n')}</pre>
      </details>
    </div>
  );
}
