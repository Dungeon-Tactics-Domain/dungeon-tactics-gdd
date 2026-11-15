// Recorded clips (clipes.json, copied from the old lab's public/mecanicas/clips/clips.json): GIF as an image, anything else
// as a muted looping video; with `after`, today and the proposal side by side.
import { CLIPES } from '../dados';

const BASE = '/content/mecanicas/clips';

function Midia({ file, label }: { file: string; label: string }) {
  const cls = 'block w-full';
  return file.endsWith('.gif') ? (
    <img src={`${BASE}/${file}`} alt={label} loading="lazy" className={cls} />
  ) : (
    <video
      src={`${BASE}/${file}`}
      controls
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={label}
      className={cls}
    />
  );
}

function Figura({ file, label, legenda }: { file: string; label: string; legenda?: string }) {
  return (
    <figure className="m-0 bg-tinta">
      <Midia file={file} label={label} />
      {legenda && <figcaption className="px-2 py-1 text-[14px] text-sobre-tinta">{legenda}</figcaption>}
    </figure>
  );
}

export function Gravados() {
  if (!CLIPES.length)
    return (
      <p className="m-0 border border-dashed border-borda bg-folha p-7 text-apagado">Nenhum clipe gravado ainda.</p>
    );
  return (
    <div className="grid gap-2.5">
      {CLIPES.map((c) => (
        <article key={c.name} id={c.name} className="grid gap-2 border border-borda bg-folha px-5 py-4">
          <h3 className="m-0 text-[21px] leading-tight">
            {c.title}
            <span className="text-apagado"> · {c.action}</span>
          </h3>
          <div className={c.after ? 'grid grid-cols-2 gap-2 max-[900px]:grid-cols-1' : ''}>
            <Figura file={c.file} label={c.title} legenda={c.after ? 'Hoje' : undefined} />
            {c.after && <Figura file={c.after} label={`${c.title}, proposta`} legenda="Proposta" />}
          </div>
          {c.note && <p className="m-0">{c.note}</p>}
          <p className="m-0 text-apagado">
            Origem: {c.source} · jogo em {c.commit}
          </p>
        </article>
      ))}
    </div>
  );
}
