// The song list on the black stage: category tabs that wrap, search, one column of cards. Picking a card tells the app.
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { filterSongs, formatTime } from '@/lib/player/math';
import type { Catalog, Song } from '@/lib/player/schema';

export function Biblioteca({
  catalogo,
  musica,
  aoEscolher,
}: {
  catalogo: Catalog;
  musica: Song | undefined;
  aoEscolher: (musica: Song) => void;
}) {
  const [categoria, setCategoria] = useState<string>();
  const [busca, setBusca] = useState('');
  const categorias = useMemo(() => [...catalogo.categories].sort((a, b) => a.order - b.order), [catalogo]);
  const id = categoria ?? musica?.category ?? categorias[0]?.id ?? '';
  const atual = categorias.find((c) => c.id === id);
  const daCategoria = catalogo.songs.filter((s) => s.category === id);
  const mostradas = filterSongs(catalogo.songs, id, busca);

  // roving tabindex: the arrows move between the tabs, only the selected one is in the tab order
  const setas = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!passo) return;
    e.preventDefault();
    const proxima = categorias[(i + passo + categorias.length) % categorias.length]!;
    setCategoria(proxima.id);
    e.currentTarget.parentElement?.querySelector<HTMLElement>(`[data-id="${CSS.escape(proxima.id)}"]`)?.focus();
  };

  return (
    <div className="text-creme">
      <div role="tablist" aria-label="Categorias" className="mb-3 flex flex-wrap gap-1.5 border-b border-apagado pb-3">
        {categorias.map((c, i) => (
          <Toggle
            key={c.id}
            role="tab"
            data-id={c.id}
            aria-selected={c.id === id}
            tabIndex={c.id === id ? 0 : -1}
            onClick={() => setCategoria(c.id)}
            onKeyDown={(e) => setas(e, i)}
            className="px-2 font-serif uppercase"
          >
            {c.label}
            <span className="font-mono tabular-nums">{catalogo.songs.filter((s) => s.category === c.id).length}</span>
          </Toggle>
        ))}
      </div>
      <div role="tabpanel" aria-label={atual?.label}>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="m-0 text-[length:var(--h3)] text-creme">Músicas em {atual?.label}</h3>
          <span>
            Mostrando {mostradas.length} de {daCategoria.length}
          </span>
        </div>
        {daCategoria.length > 0 && (
          <Input
            type="search"
            placeholder="Buscar música"
            aria-label="Buscar música"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mb-3 border-apagado bg-couro text-creme placeholder:text-creme-apagado"
          />
        )}
        {!daCategoria.length ? (
          <p className="m-0 border-2 border-dashed border-apagado p-3">Ainda não há músicas em {atual?.label}.</p>
        ) : !mostradas.length ? (
          <p className="m-0 border-2 border-dashed border-apagado p-3">Nenhuma música com esse nome nesta categoria.</p>
        ) : (
          <div className="grid gap-2">
            {mostradas.map((s) => (
              <Toggle
                key={s.id}
                aria-pressed={s === musica}
                onClick={() => aoEscolher(s)}
                className="grid h-auto justify-stretch gap-1 bg-couro py-2.5 text-left font-normal aria-pressed:bg-couro aria-pressed:text-creme aria-pressed:hover:bg-couro-claro"
              >
                <span
                  className={`flex justify-between gap-2 font-serif text-lg font-bold ${s === musica ? 'text-ouro-claro' : ''}`}
                >
                  <span>{s.title}</span>
                  <span className="font-mono tabular-nums">{formatTime(s.versions[0]?.duration ?? 0)}</span>
                </span>
                <span className="text-creme-apagado">{s.authorship}</span>
              </Toggle>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
