// Reference sheets (refs/*.json): the sheet page shows the reception and what was not found; mechanics, feel and videos
// are subpages because a whole sheet passed 1,500px on the old lab (FFT 2,000px).
import type { ReactNode } from 'react';
import { type Item, jogo } from '../dados';

const LINK = 'text-lab underline underline-offset-2';
const Fonte = ({ href, children = 'Fonte' }: { href: string; children?: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className={LINK}>
    {children}
  </a>
);
const Caixa = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-2 border border-borda bg-folha px-5 py-4 [overflow-wrap:anywhere]">{children}</div>
);
const Desconhecido = ({ id }: { id: string }) => <p className="m-0 text-erro">Ficha desconhecida: {id}</p>;

export function Ficha({ jogo: id }: { jogo: string }) {
  const g = jogo(id);
  if (!g) return <Desconhecido id={id} />;
  if (!g.reception && !g.notFound.length) return null;
  return (
    <Caixa>
      {g.reception && <p className="m-0 max-w-[72ch] text-apagado">{g.reception}</p>}
      {g.notFound.length > 0 && <p className="m-0 max-w-[72ch] text-apagado">Não achado: {g.notFound.join(' · ')}</p>}
    </Caixa>
  );
}

const Linha = ({ i }: { i: Item }) => (
  <li>
    <strong>{i.name}</strong>: {i.what}
    {i.feel && <span className="mt-1 block text-[14px] text-apagado">Provoca: {i.feel}</span>}
    {i.take && <span className="block text-[14px] text-sucesso">Aproveitar: {i.take}</span>}
    {i.avoid && <span className="block text-[14px] text-erro">Evitar: {i.avoid}</span>} <Fonte href={i.source} />
  </li>
);

export function Itens({ jogo: id, tipo }: { jogo: string; tipo: 'mechanics' | 'feel' }) {
  const g = jogo(id);
  if (!g) return <Desconhecido id={id} />;
  return (
    <Caixa>
      <ul className="m-0 grid list-disc gap-1.5 gap-x-10 pl-[18px] wide:grid-cols-2 ultra:grid-cols-3">
        {g[tipo].map((i) => (
          <Linha key={i.name} i={i} />
        ))}
      </ul>
    </Caixa>
  );
}

export function Videos({ jogo: id }: { jogo: string }) {
  const g = jogo(id);
  if (!g) return <Desconhecido id={id} />;
  return (
    <Caixa>
      <ul className="m-0 grid list-disc gap-1.5 gap-x-10 pl-[18px] wide:grid-cols-2 ultra:grid-cols-3">
        {g.videos.map((v) => (
          <li key={v.url}>
            <Fonte href={v.url}>{v.title}</Fonte> — {v.note}
          </li>
        ))}
      </ul>
    </Caixa>
  );
}
