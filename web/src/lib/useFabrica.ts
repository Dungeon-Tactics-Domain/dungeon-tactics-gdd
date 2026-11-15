// Live Fábrica board: GET /api/fabrica once, then the SSE stream /api/fabrica/stream (docs/CONTRATO-FABRICA.md).
// Mounted once in App and shared through FabricaContext, so the bar, the home and the Fábrica use a single connection.
import { useEffect, useState } from 'react';
import type { Fabrica } from '@/types/fabrica';
import { parseFabrica, STALE_MS } from './fabrica';

// 'sem-api' = the public static site: /api/fabrica answers 404, so there is no stream to open nor to retry
export type Conexao = 'conectando' | 'ao-vivo' | 'caiu' | 'sem-api';

export interface Quadro {
  fabrica: Fabrica | null;
  conexao: Conexao;
  /** ms since the board's `atualizado`; null when the date is missing or unreadable */
  idadeMs: number | null;
  /** the board has not changed for more than 15 min: the sessions may have stopped writing it */
  velho: boolean;
  /** when the last good payload arrived (ms epoch) */
  lidoEm: number | null;
  /** clock that ticks every 30 s, for "running for N min" texts */
  agora: number;
}

export const RETRY_MIN_MS = 1000;
export const RETRY_MAX_MS = 30_000;
// the stale warning depends on the clock, not only on new data
const CLOCK_MS = 30_000;

export function useFabrica(): Quadro {
  const [fabrica, setFabrica] = useState<Fabrica | null>(null);
  const [conexao, setConexao] = useState<Conexao>('conectando');
  const [lidoEm, setLidoEm] = useState<number | null>(null);
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    let es: EventSource | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let delay = RETRY_MIN_MS;
    let closed = false;

    const accept = (raw: unknown) => {
      const b = parseFabrica(raw);
      if (!b || closed) return;
      setFabrica(b);
      setLidoEm(Date.now());
      setAgora(Date.now());
    };
    const load = () =>
      fetch('/api/fabrica', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then(accept, () => {});

    const connect = () => {
      es = new EventSource('/api/fabrica/stream');
      es.addEventListener('open', () => {
        delay = RETRY_MIN_MS;
        setConexao('ao-vivo');
        // the stream may only send on the next change, so resync after every (re)connect
        void load();
      });
      es.addEventListener('fabrica', (e) => {
        try {
          accept(JSON.parse((e as MessageEvent<string>).data));
        } catch {
          // a malformed event keeps the last good board
        }
      });
      es.addEventListener('error', () => {
        if (closed || !es) return;
        // CONNECTING = the browser retries by itself; CLOSED (HTTP error, proxy down) = it never will, so we do
        if (es.readyState !== EventSource.CLOSED) {
          setConexao('conectando');
          return;
        }
        setConexao('caiu');
        es.close();
        retry = setTimeout(connect, delay);
        delay = Math.min(delay * 2, RETRY_MAX_MS);
      });
    };

    // a page leaving (or parked in the back/forward cache) must free its stream: Vite dev serves HTTP/1.1 and Chrome
    // allows 6 connections per host; page loads hung until streams were closed here (likely cause, seen 14/11)
    const onHide = () => {
      es?.close();
      clearTimeout(retry);
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) connect();
    };
    const start = () => {
      addEventListener('pagehide', onHide);
      addEventListener('pageshow', onShow);
      connect();
    };

    // one probe decides the mode: 404 = no API here; any other answer (or a network error) keeps the live behaviour
    fetch('/api/fabrica', { cache: 'no-store' }).then(
      (r) => {
        if (closed) return;
        if (r.status === 404) return setConexao('sem-api');
        if (r.ok) r.json().then(accept, () => {});
        start();
      },
      () => !closed && start(),
    );
    const clock = setInterval(() => setAgora(Date.now()), CLOCK_MS);
    return () => {
      closed = true;
      es?.close();
      clearTimeout(retry);
      clearInterval(clock);
      removeEventListener('pagehide', onHide);
      removeEventListener('pageshow', onShow);
    };
  }, []);

  const updated = Date.parse(fabrica?.atualizado ?? '');
  const idadeMs = Number.isNaN(updated) ? null : Math.max(0, agora - updated);
  return { fabrica, conexao, idadeMs, velho: idadeMs !== null && idadeMs > STALE_MS, lidoEm, agora };
}
