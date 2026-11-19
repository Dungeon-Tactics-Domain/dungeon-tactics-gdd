// The song list on the black stage: a select for the style (category), search, one column of cards. Picking a card tells the app.
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

  return (
    <div className="text-creme">
      <label className="mb-3 grid gap-1 border-b border-apagado pb-3">
        <span className="font-serif text-lg font-bold">Estilo</span>
        <select
          value={id}
          onChange={(e) => setCategoria(e.target.value)}
          className="min-h-11 w-full cursor-pointer border-2 border-apagado bg-couro px-3 text-creme"
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label} ({catalogo.songs.filter((s) => s.category === c.id).length})
            </option>
          ))}
        </select>
      </label>
      <div>
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
