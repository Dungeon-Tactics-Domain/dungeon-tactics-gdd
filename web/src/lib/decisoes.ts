// Per-asset decisions (GET /api/decisoes, PUT /api/decisoes/<id>), saved by the Rust server in data/decisoes.json so
// Claude sessions read them as a file. Types are born in Rust (crates/labs-core/src/decisoes.rs).
import type { Decisao } from '@/types/generated/Decisao';
import type { Escolha } from '@/types/generated/Escolha';

export type { Decisao, Escolha };

export const ESCOLHAS: readonly (readonly [Escolha, string])[] = [
  ['usar', 'Usar'],
  ['descartar', 'Descartar'],
  ['refazer', 'Refazer'],
  ['talvez', 'Talvez'],
];
export const NOTA_MAX = 2000;

export const nomeEscolha = (e: Escolha) => ESCOLHAS.find(([v]) => v === e)![1];

// the board state colours of Badge, reused: green = use, grey = discard, orange = redo, blue = maybe
export const COR_ESCOLHA = {
  usar: 'rodando',
  descartar: 'parado',
  refazer: 'aguardando-voce',
  talvez: 'espera',
} as const satisfies Record<Escolha, string>;

export const quando = (iso: string) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';

const ehEscolha = (v: unknown): v is Escolha => ESCOLHAS.some(([e]) => e === v);

/** Rebuilds the list field by field; a server without the API answers index.html, which never parses as a list. */
export function parseDecisoes(raw: unknown): Decisao[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.flatMap((d: Partial<Decisao> | null) =>
    d && typeof d.id === 'string' && typeof d.lab === 'string' && ehEscolha(d.escolha)
      ? [
          {
            id: d.id,
            lab: d.lab,
            escolha: d.escolha,
            nota: String(d.nota ?? ''),
            atualizadoEm: String(d.atualizadoEm ?? ''),
          },
        ]
      : [],
  );
}

export async function carregarDecisoes(): Promise<Decisao[]> {
  const r = await fetch('/api/decisoes', { cache: 'no-store' });
  const lista = r.ok ? parseDecisoes(await r.json().catch(() => null)) : null;
  if (!lista) throw new Error(`o servidor não respondeu às decisões (HTTP ${r.status})`);
  return lista;
}

/** Saves and returns what the server stored; the error carries the server's message (in Portuguese). */
export async function salvarDecisao(id: string, escolha: Escolha, nota: string): Promise<Decisao> {
  // each segment is encoded, the slashes stay: the server route is /api/decisoes/{*id}
  const r = await fetch(`/api/decisoes/${id.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lab: id.split('/')[0], escolha, nota }),
  });
  if (!r.ok) throw new Error((await r.text().catch(() => '')) || `HTTP ${r.status}`);
  const [salva] = parseDecisoes([await r.json()]) ?? [];
  if (!salva) throw new Error('resposta estranha do servidor');
  return salva;
}
