// Reading the Fábrica board, shared by the top bar, the home and the Fábrica page.
// The payload is written by agent sessions: untrusted, rebuilt field by field; its text is only rendered as React text.
import type { Estacao, Estado, Fabrica, Subagente } from '@/types/fabrica';
import { GENERIC_COLOR, LABS, type Place, PORT, SPARE_SLOTS } from './labs';

export const STALE_MS = 15 * 60 * 1000;

const ESTADOS: readonly Estado[] = ['rodando', 'ocioso', 'espera', 'aguardando-voce', 'terminado'];
const str = (v: unknown) => (typeof v === 'string' ? v : '');
const opt = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
// an unknown state reads as idle, which lands in the "parado" group like before
const estado = (v: unknown): Estado => (ESTADOS.includes(v as Estado) ? (v as Estado) : 'ocioso');
const list = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : [];
const unique = <T extends { id: string }>(xs: T[]) => xs.filter((x, i) => xs.findIndex((y) => y.id === x.id) === i);

export function parseFabrica(raw: unknown): Fabrica | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const estacoes: Estacao[] = list(r.estacoes)
    .map((s) => ({
      id: str(s.id),
      nome: str(s.nome),
      emoji: str(s.emoji),
      papel: str(s.papel),
      estado: estado(s.estado),
      tarefa: str(s.tarefa),
      pergunta: opt(s.pergunta),
      sessao: str(s.sessao),
    }))
    .filter((s) => s.id);
  const subagentes: Subagente[] = list(r.subagentes)
    .map((s) => ({
      id: str(s.id),
      nome: str(s.nome),
      modelo: str(s.modelo),
      estacao: str(s.estacao),
      estado: estado(s.estado),
      tarefa: str(s.tarefa),
      inicio: opt(s.inicio),
      fim: opt(s.fim),
    }))
    .filter((s) => s.id);
  return {
    atualizado: str(r.atualizado),
    aviso: opt(r.aviso),
    estacoes: unique(estacoes),
    subagentes: unique(subagentes),
  };
}

export type Grupo = 'aguardando-voce' | 'rodando' | 'espera' | 'parado';
/** Order everywhere: who calls you first, then who works, who waits, and the rest. */
export const GRUPOS: readonly Grupo[] = ['aguardando-voce', 'rodando', 'espera', 'parado'];
export const groupOf = (e: Estado): Grupo =>
  e === 'aguardando-voce' || e === 'rodando' || e === 'espera' ? e : 'parado';

const LABELS: Record<Estado | 'parado', string> = {
  rodando: 'Trabalhando',
  ocioso: 'Parado',
  espera: 'Esperando',
  'aguardando-voce': 'Chamando você',
  terminado: 'Terminou',
  parado: 'Parado',
};
export const stateLabel = (e: Estado | Grupo) => LABELS[e];
export const ICONS: Record<Grupo, string> = { rodando: '🟢', espera: '⏳', 'aguardando-voce': '🔔', parado: '⚪' };
export const isLive = (d: Subagente) => d.estado !== 'terminado';
// orchestrators are Fábrica sessions, not labs: they become the port, not a town
export const isTower = (s: Estacao) => /orquestr/i.test(s.nome) || s.id === 'impl' || s.id === 'labs';
// sessions without the "pergunta" field write the question in the task ("pergunta: ...")
export const askOf = (s: Estacao) => (s.pergunta || s.tarefa).replace(/^pergunta:\s*/i, '');

export function since(ms: number) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'menos de 1 min';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ${m % 60} min` : `${Math.floor(h / 24)} dia(s)`;
}

export interface Town {
  place: Place;
  stations: Estacao[];
  /** most urgent group of its sessions; undefined = no session on the board */
  estado?: Grupo;
  subs: Subagente[];
  generic: boolean;
}

const worst = (ss: Estacao[]) => GRUPOS.find((g) => ss.some((s) => groupOf(s.estado) === g));

export function townsOf(b: Fabrica | null): Town[] {
  const st = b?.estacoes ?? [];
  const live = (b?.subagentes ?? []).filter(isLive);
  const make = (place: Place, stations: Estacao[], generic = false): Town => {
    const ids = new Set(stations.map((s) => s.id));
    return { place, stations, estado: worst(stations), subs: live.filter((d) => ids.has(d.estacao)), generic };
  };
  const known = new Set(LABS.map((p) => p.id));
  const towns = [
    make(PORT, st.filter(isTower)),
    ...LABS.map((p) =>
      make(
        p,
        st.filter((s) => s.id === p.id && !isTower(s)),
      ),
    ),
  ];
  st.filter((s) => !isTower(s) && !known.has(s.id)).forEach((s, i) => {
    // ponytail: after the spare slots run out new towns stack on the last one; add slots if labs grow past four
    const slot = SPARE_SLOTS[Math.min(i, SPARE_SLOTS.length - 1)]!;
    const nome = s.nome || s.id;
    towns.push(
      make(
        { id: s.id, nome, curto: nome, cor: GENERIC_COLOR, corSuave: '#ecebe3', descricao: s.papel, ...slot },
        [s],
        true,
      ),
    );
  });
  return towns;
}
