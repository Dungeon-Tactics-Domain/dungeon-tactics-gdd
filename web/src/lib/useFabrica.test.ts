import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fabrica } from '@/types/fabrica';
import { RETRY_MIN_MS, useFabrica } from './useFabrica';

// Minimal EventSource double: tests drive open, named events and errors by hand.
class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static all: FakeEventSource[] = [];
  readyState = FakeEventSource.CONNECTING;
  private handlers = new Map<string, ((e: Event) => void)[]>();
  constructor(public url: string) {
    FakeEventSource.all.push(this);
  }
  addEventListener(type: string, fn: (e: Event) => void) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), fn]);
  }
  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
  emit(type: string, data?: unknown) {
    if (type === 'open') this.readyState = FakeEventSource.OPEN;
    const e = data === undefined ? new Event(type) : new MessageEvent(type, { data: JSON.stringify(data) });
    for (const fn of this.handlers.get(type) ?? []) fn(e);
  }
  /** what the browser does after an HTTP error: CLOSED, then "error" */
  fail() {
    this.readyState = FakeEventSource.CLOSED;
    this.emit('error');
  }
}

const NOW = Date.parse('2026-11-14T22:00:00Z');
const board = (over: Partial<Fabrica> = {}): Fabrica => ({
  atualizado: new Date(NOW).toISOString(),
  estacoes: [{ id: 'design', nome: 'Design', emoji: '', papel: '', estado: 'rodando', tarefa: 'x', sessao: 's' }],
  subagentes: [],
  ...over,
});
const last = () => FakeEventSource.all[FakeEventSource.all.length - 1]!;

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  FakeEventSource.all = [];
  vi.stubGlobal('EventSource', FakeEventSource);
  // the GET never answers in these tests unless one sets it up: the stream is what is under test
  vi.stubGlobal(
    'fetch',
    vi.fn(() => new Promise(() => {})),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useFabrica', () => {
  it('reads the initial GET and connects to the stream', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(board()))),
    );
    const { result } = renderHook(() => useFabrica());
    await act(async () => {});
    expect(fetch).toHaveBeenCalledWith('/api/fabrica', { cache: 'no-store' });
    expect(last().url).toBe('/api/fabrica/stream');
    expect(result.current.fabrica?.estacoes[0]?.id).toBe('design');
  });

  it('applies each "fabrica" event and goes live on open', () => {
    const { result } = renderHook(() => useFabrica());
    act(() => last().emit('open'));
    expect(result.current.conexao).toBe('ao-vivo');
    act(() => last().emit('fabrica', board({ aviso: 'teste' })));
    expect(result.current.fabrica?.aviso).toBe('teste');
  });

  it('keeps the last good board when an event is malformed', () => {
    const { result } = renderHook(() => useFabrica());
    act(() => last().emit('fabrica', board()));
    act(() => last().emit('fabrica', 'not a board'));
    expect(result.current.fabrica?.estacoes).toHaveLength(1);
  });

  it('reconnects with backoff when the stream closes for good', () => {
    const { result } = renderHook(() => useFabrica());
    act(() => last().fail());
    expect(result.current.conexao).toBe('caiu');
    expect(FakeEventSource.all).toHaveLength(1);
    act(() => vi.advanceTimersByTime(RETRY_MIN_MS));
    expect(FakeEventSource.all).toHaveLength(2);
    // second failure waits twice as long
    act(() => last().fail());
    act(() => vi.advanceTimersByTime(RETRY_MIN_MS));
    expect(FakeEventSource.all).toHaveLength(2);
    act(() => vi.advanceTimersByTime(RETRY_MIN_MS));
    expect(FakeEventSource.all).toHaveLength(3);
    act(() => last().emit('open'));
    expect(result.current.conexao).toBe('ao-vivo');
  });

  it('leaves transient errors to the browser retry', () => {
    const { result } = renderHook(() => useFabrica());
    act(() => last().emit('error'));
    expect(result.current.conexao).toBe('conectando');
    act(() => vi.advanceTimersByTime(60_000));
    expect(FakeEventSource.all).toHaveLength(1);
  });

  it('flags a board older than 15 min, also when time passes without new data', () => {
    const { result } = renderHook(() => useFabrica());
    act(() => last().emit('fabrica', board({ atualizado: new Date(NOW - 14 * 60_000).toISOString() })));
    expect(result.current.velho).toBe(false);
    act(() => vi.advanceTimersByTime(2 * 60_000));
    expect(result.current.velho).toBe(true);
  });

  it('frees the stream when the page is hidden and reopens it from the back/forward cache', () => {
    renderHook(() => useFabrica());
    const es = last();
    act(() => window.dispatchEvent(new Event('pagehide')));
    expect(es.readyState).toBe(FakeEventSource.CLOSED);
    act(() => window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })));
    expect(FakeEventSource.all).toHaveLength(2);
  });

  it('closes the stream on unmount', () => {
    const { unmount } = renderHook(() => useFabrica());
    const es = last();
    unmount();
    expect(es.readyState).toBe(FakeEventSource.CLOSED);
  });
});
