// Pages pattern (Fernando, 14/11: "a well subdivided table of contents with different pages, not one long scrolling menu").
// group > page > subpage on real routes under `base`; collapsible menu with search, breadcrumbs, previous/next and keyboard.
// The menu is portalled under the lab's row of the shell's tree (sidebar, or the sheet below 1024 px, lib/gaveta-context);
// in the icon rail it shrinks to one icon per group.
import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Input } from '@/components/ui/input';
import { useGaveta } from '@/lib/gaveta-context';
import { SITE } from '@/lib/labs';
import { cn, gravar, ler } from '@/lib/utils';
import { Cartoes, Icone, Migalhas, Resumo, Titulo } from './parts';
import type { Grupo, Pagina, Sumario } from './types';

interface Entrada {
  rota: string;
  pagina: Pagina;
  grupo: Grupo;
  pai?: Pagina;
}

// search ignores accents and case: "decisao" finds "Decisões"
const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Every page in reading order: the order of previous/next and of search. */
function entradas(s: Sumario): Entrada[] {
  return s.grupos.flatMap((g) =>
    g.paginas.flatMap((p) => [
      { rota: `${g.id}/${p.id}`, pagina: p, grupo: g },
      ...(p.subpaginas ?? []).map((sp) => ({ rota: `${g.id}/${p.id}/${sp.id}`, pagina: sp, grupo: g, pai: p })),
    ]),
  );
}

const LINK =
  'flex min-h-11 items-center gap-2 border-2 border-transparent py-1 pr-2.5 pl-[18px] leading-tight text-tinta no-underline hover:bg-pergaminho-escuro aria-[current=page]:bg-couro-escuro aria-[current=page]:font-bold aria-[current=page]:text-creme';
const VIZINHO =
  'grid min-h-11 gap-0.5 border-2 border-couro-escuro bg-folha px-3.5 py-2.5 font-bold text-tinta no-underline shadow-folha hover:bg-lab-soft';

export function Paginas({ sumario: s, base }: { sumario: Sumario; base: string }) {
  const rota = (useParams()['*'] ?? '').replace(/\/$/, '');
  const location = useLocation();
  const navigate = useNavigate();
  const { slot, recolhida, fechar } = useGaveta();
  const chave = `paginas:${s.lab}:grupo`;
  // an old link that starts with / leads to another lab (a page moved between labs)
  const href = (r: string) => (r.startsWith('/') ? r : `${base}/${r}`);

  const aviso = (location.state as { aviso?: string } | null)?.aviso;
  const lista = entradas(s);
  const atual = lista.find((e) => e.rota === rota);
  const grupo = s.grupos.find((g) => g.id === rota);
  const grupoDaRota = atual?.grupo.id ?? grupo?.id;

  // the search text and the group the reader toggled belong to the route they were set on: navigating clears both
  const [busca, setBusca] = useState({ rota, q: '' });
  const texto = busca.rota === rota ? busca.q : '';
  const q = normal(texto.trim());
  const [escolha, setEscolha] = useState<{ rota: string; id: string | null }>();
  const lembrado = ler(chave);
  // one group open at a time: the reader's toggle, else the current page's group, else the remembered one
  const aberto =
    escolha?.rota === rota
      ? escolha.id
      : (grupoDaRota ?? (s.grupos.some((g) => g.id === lembrado) ? lembrado : (s.grupos[0]?.id ?? null)));
  const alternar = (id: string, abrir: boolean) => {
    setEscolha({ rota, id: abrir ? id : null });
    if (abrir) gravar(chave, id);
  };

  // old links: "#fases" (old anchor) and "#/grupo/pagina" (old hash route) become real routes, also with the lab open
  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    const destino = h === '/inicio' ? '' : h.startsWith('/') ? h.slice(1) : s.linksAntigos?.[h];
    if (destino !== undefined) void navigate(href(destino), { replace: true });
    // href only depends on base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.hash, s.linksAntigos, base, navigate]);

  // a route that does not exist: an old path of the first copy (/decisoes/fases, /maquetes/x) goes by linksAntigos, trying the
  // whole path, then its last and first segment; anything else lands on the lab home with a quiet notice
  useEffect(() => {
    if (!rota || atual || grupo) return;
    const partes = rota.split('/');
    const destino = [rota, partes.at(-1)!, partes[0]!].map((k) => s.linksAntigos?.[k]).find((d) => d !== undefined);
    void navigate(href(destino ?? ''), { replace: true, state: destino === undefined ? { aviso: rota } : null });
    // href only depends on base
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rota, atual, grupo, s.linksAntigos, base, navigate]);

  // the page's exit hook runs when the route moves away from it and on unmount
  // keyed on the route string: the entries are rebuilt on every render (each live board update re-renders the app)
  // and must not count as leaving. The sumario should be a stable object (module constant or useMemo).
  useEffect(() => {
    const sair = entradas(s).find((e) => e.rota === rota)?.pagina.aoSair;
    return () => sair?.();
  }, [rota, s]);

  // focus goes to the title on navigation, not on first load (the browser keeps its own focus then)
  const h1 = useRef<HTMLHeadingElement>(null);
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);
    h1.current?.focus({ preventScroll: true });
  }, [rota]);

  const nome = atual?.pagina.titulo ?? grupo?.titulo ?? (rota ? 'Página não encontrada' : s.titulo);
  useEffect(() => {
    document.title = `${nome === s.titulo ? '' : `${nome} · `}${s.titulo} · ${SITE}`;
  }, [nome, s.titulo]);

  // ---------- menu ----------
  const achadas = q
    ? lista.filter((e) => normal(e.pagina.titulo).includes(q) || (!!e.pai && normal(e.pai.titulo).includes(q)))
    : [];
  const menuRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // arrows walk the visible menu items; Enter and Space stay native for links and buttons
    const vis = [...(menuRef.current?.querySelectorAll<HTMLElement>('[data-nav]') ?? [])].filter(
      (n) => !n.closest('[hidden]'),
    );
    const i = vis.indexOf(document.activeElement as HTMLElement);
    const ir = (j: number) => {
      e.preventDefault();
      vis[Math.max(0, Math.min(vis.length - 1, j))]?.focus();
    };
    const t = e.target as HTMLElement;
    if (e.key === 'ArrowDown') ir(i + 1);
    else if (e.key === 'ArrowUp') ir(i - 1);
    else if ((e.key === 'Home' || e.key === 'End') && t.tagName !== 'INPUT') ir(e.key === 'Home' ? 0 : vis.length - 1);
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && t.dataset.grupo) {
      e.preventDefault();
      alternar(t.dataset.grupo, e.key === 'ArrowRight');
    } else if (e.key === 'Enter' && t.tagName === 'INPUT' && achadas[0]) {
      e.preventDefault();
      fechar();
      void navigate(href(achadas[0].rota));
    }
  };

  const menu = (
    <div
      ref={menuRef}
      onKeyDown={onKeyDown}
      role="navigation"
      aria-label={`Sumário: ${s.titulo}`}
      className="flex flex-col gap-1.5 pt-1 pb-2"
    >
      <Input
        type="search"
        placeholder="Buscar no menu"
        aria-label="Buscar páginas no menu"
        autoComplete="off"
        data-nav
        value={texto}
        onChange={(e) => setBusca({ rota, q: e.target.value })}
        className="mb-1"
      />
      {q && !achadas.length && (
        <p role="status" className="mx-2 my-1 text-base text-apagado">
          Nenhuma página com esse nome.
        </p>
      )}
      {s.grupos.map((g) => {
        const doGrupo = achadas.filter((e) => e.grupo === g);
        if (q && !doGrupo.length) return null;
        const open = q ? true : aberto === g.id;
        return (
          <div key={g.id}>
            <button
              type="button"
              data-nav
              data-grupo={g.id}
              aria-expanded={open}
              aria-controls={`pg-${s.lab}-${g.id}`}
              onClick={() => alternar(g.id, !open)}
              className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-2.5 text-left font-serif text-[17px] font-bold text-tinta hover:bg-pergaminho-escuro"
            >
              <Icone i={g.icone} />
              <span className="flex-1">{g.titulo}</span>
              <span className="font-sans text-base text-apagado">{g.paginas.length}</span>
              <span aria-hidden="true" className="font-sans text-base text-apagado">
                {open ? '▾' : '▸'}
              </span>
            </button>
            <ul id={`pg-${s.lab}-${g.id}`} hidden={!open} className="m-0 list-none p-0 pb-1.5">
              {g.paginas.map((p) => {
                const r = `${g.id}/${p.id}`;
                const subs = p.subpaginas ?? [];
                // searching: matches and the parent of a matching subpage; otherwise subpages only under the open item
                const subsVis = q
                  ? subs.filter((sp) => doGrupo.some((e) => e.rota === `${r}/${sp.id}`))
                  : rota === r || rota.startsWith(`${r}/`)
                    ? subs
                    : [];
                if (q && !doGrupo.some((e) => e.rota === r) && !subsVis.length) return null;
                return (
                  <li key={p.id}>
                    <Link
                      to={href(r)}
                      onClick={fechar}
                      data-nav
                      aria-current={rota === r ? 'page' : undefined}
                      className={cn(
                        LINK,
                        p.destaque && 'border-l-4 border-l-ouro-claro bg-pergaminho-escuro font-bold',
                      )}
                    >
                      <Icone i={p.icone} />
                      {p.titulo}
                      {p.destaque && (
                        <span className="ml-auto flex-none bg-ouro-claro px-1.5 py-0.5 text-base font-bold leading-none text-tinta">
                          {p.destaque}
                        </span>
                      )}
                    </Link>
                    {subsVis.length > 0 && (
                      <ul className="m-0 list-none py-0 pl-3">
                        {subsVis.map((sp) => (
                          <li key={sp.id}>
                            <Link
                              to={href(`${r}/${sp.id}`)}
                              onClick={fechar}
                              data-nav
                              aria-current={rota === `${r}/${sp.id}` ? 'page' : undefined}
                              className={LINK}
                            >
                              <Icone i={sp.icone} />
                              {sp.titulo}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );

  // ---------- page ----------
  let corpo: ReactNode;
  if (!rota) {
    corpo = (
      <>
        <Titulo ref={h1}>{s.titulo}</Titulo>
        {aviso && (
          <p role="status" className="m-0 text-base text-apagado">
            Não existe página em “{aviso}”; você está no início do lab.
          </p>
        )}
        <Resumo texto={s.resumo} />
        {s.inicio && <div className="grid gap-4">{s.inicio()}</div>}
        <Cartoes
          base={base}
          itens={s.grupos.map((g) => ({
            rota: g.id,
            titulo: g.titulo,
            icone: g.icone,
            resumo: g.resumo,
            extra: `${g.paginas.length} ${g.paginas.length === 1 ? 'página' : 'páginas'}`,
          }))}
        />
      </>
    );
  } else if (grupo) {
    corpo = (
      <>
        <Migalhas base={base} partes={[[s.titulo, ''], [grupo.titulo]]} />
        <Titulo ref={h1} icone={grupo.icone}>
          {grupo.titulo}
        </Titulo>
        <Resumo texto={grupo.resumo} />
        <Cartoes
          base={base}
          itens={grupo.paginas.map((p) => ({
            rota: `${grupo.id}/${p.id}`,
            titulo: p.titulo,
            icone: p.icone,
            resumo: p.resumo,
          }))}
        />
      </>
    );
  } else if (atual) {
    const i = lista.indexOf(atual);
    const ant = lista[i - 1];
    const prox = lista[i + 1];
    const subs = atual.pagina.subpaginas ?? [];
    corpo = (
      <>
        <Migalhas
          base={base}
          partes={[
            [s.titulo, ''],
            [atual.grupo.titulo, atual.grupo.id],
            ...(atual.pai ? [[atual.pai.titulo, `${atual.grupo.id}/${atual.pai.id}`] as [string, string]] : []),
            [atual.pagina.titulo],
          ]}
        />
        <Titulo ref={h1} icone={atual.pagina.icone}>
          {atual.pagina.titulo}
        </Titulo>
        <Resumo texto={atual.pagina.resumo} />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
          {atual.pagina.conteudo?.()}
          {subs.length > 0 && (
            <Cartoes
              base={base}
              itens={subs.map((sp) => ({
                rota: `${atual.rota}/${sp.id}`,
                titulo: sp.titulo,
                icone: sp.icone,
                resumo: sp.resumo,
              }))}
            />
          )}
        </div>
        <nav
          aria-label="Anterior e próxima"
          className="mt-3 grid grid-cols-2 gap-3.5 border-t-2 border-couro-escuro pt-4 max-[700px]:grid-cols-1"
        >
          {ant ? (
            <Link to={href(ant.rota)} rel="prev" className={VIZINHO}>
              <span className="text-base font-normal text-apagado">← Anterior</span>
              {ant.pagina.titulo}
            </Link>
          ) : (
            <span />
          )}
          {prox && (
            <Link
              to={href(prox.rota)}
              rel="next"
              className={cn(VIZINHO, 'col-start-2 text-right max-[700px]:col-start-1')}
            >
              <span className="text-base font-normal text-apagado">Próxima →</span>
              {prox.pagina.titulo}
            </Link>
          )}
        </nav>
      </>
    );
  } else {
    corpo = (
      <>
        <Titulo ref={h1}>Página não encontrada</Titulo>
        <p className="text-[17px] text-apagado">
          Não existe página em “{rota}”. <Link to={base}>Voltar ao início</Link>
        </p>
      </>
    );
  }

  // the icon rail: one icon per group, to the group's page (search and pages come back when the sidebar opens)
  const trilho = (
    <nav aria-label={`Sumário: ${s.titulo}`} className="grid gap-1 px-1.5 py-3">
      {s.grupos.map((g) => (
        <Link
          key={g.id}
          to={href(g.id)}
          title={g.titulo}
          aria-label={g.titulo}
          aria-current={grupoDaRota === g.id ? 'page' : undefined}
          className={cn(LINK, 'justify-center px-0 text-[20px]')}
        >
          <span aria-hidden="true">{g.icone ?? '▸'}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {slot === undefined
        ? menu
        : slot &&
          createPortal(
            // indented under the lab's row, with a guide line, as a tree
            <div className={cn(!recolhida && 'ml-3 border-l-2 border-couro-escuro/40 pl-1')}>
              {recolhida ? trilho : menu}
            </div>,
            slot,
          )}
      <main className="mx-auto grid w-full min-w-0 max-w-[1800px] grid-cols-[minmax(0,1fr)] content-start gap-5 px-(--margem) pt-7 pb-16 max-sm:pt-5">
        {corpo}
      </main>
    </>
  );
}
