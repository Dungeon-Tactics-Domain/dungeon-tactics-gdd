// Clip tools shared by the KayKit and Animações pages (Nov 15, Fernando's request): a clip browser with search, collapsible
// categories and favourites; the game actions panel, where each action of a character gets a clip; and sequences of
// clips played in order on the 3D bench. Everything is kept in this browser's localStorage, rebuilt field by field on
// read, and the actions map goes in and out as JSON.
import { useEffect, useRef, useState } from 'react';
import { gravar, ler } from '@/lib/utils';
import type { Botao } from './Animacoes';
import { BOTAO, Botoes } from './Visualizador';

export interface Categoria {
  titulo: string;
  itens: readonly Botao[];
  aberta?: boolean;
}

const CARTAO = 'grid gap-2 border border-t-[6px] border-borda border-t-lab bg-folha px-5 py-4';
const CAMPO = 'min-h-11 w-full rounded-md border border-borda bg-pergaminho px-3 text-[15px] text-tinta';
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function lerJson(k: string): unknown {
  try {
    return JSON.parse(ler(k) ?? 'null');
  } catch {
    return null;
  }
}
const lista = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x) : []);

/**
 * Ids are stored as the bench's `?anim=` takes them (`Idle`, `CombatMelee/Melee_Block`), so a map or sequence works on
 * both pages; the Animações page prefixes its clip ids with `clip:`. Scenes (`walk:flat`) are stored as they are.
 */
export const paraAnim = (id: string, prefixo: string) =>
  prefixo && id.startsWith(prefixo) ? id.slice(prefixo.length) : id;
export const deAnim = (anim: string, prefixo: string) => (anim.includes(':') ? anim : `${prefixo}${anim}`);

/** Search, favourites and collapsible categories over the page's clip buttons. */
export function PainelDeClipes({
  tipo,
  categorias,
  atual,
  escolher,
}: {
  tipo: string;
  categorias: readonly Categoria[];
  atual: string;
  escolher: (id: string) => void;
}) {
  const chave = `modelos:favoritos:${tipo}`;
  const [busca, setBusca] = useState('');
  const [favoritos, setFavoritos] = useState(() => lista(lerJson(chave)));
  const todos = new Map(categorias.flatMap((c) => c.itens.map(([id, n]) => [id, n] as const)));
  const favorito = favoritos.includes(atual);
  const alternarFavorito = () => {
    const novos = favorito ? favoritos.filter((f) => f !== atual) : [...favoritos, atual];
    setFavoritos(novos);
    gravar(chave, JSON.stringify(novos));
  };
  const termo = semAcento(busca.trim());
  const achados = termo ? [...todos].filter(([id, n]) => semAcento(`${n} ${id}`).includes(termo)) : [];
  return (
    <div className="grid gap-2">
      <div className="font-bold">🎬 Clipes</div>
      <label className="grid gap-1">
        <span className="text-[15px] text-apagado">Buscar clipe pelo nome</span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="ex.: ataque, jump, death"
          className={CAMPO}
        />
      </label>
      <button
        type="button"
        aria-pressed={favorito}
        onClick={alternarFavorito}
        className={`${BOTAO} justify-self-start`}
      >
        {favorito ? '★ Tirar o clipe tocando dos favoritos' : '☆ Favoritar o clipe tocando'}
      </button>
      {termo ? (
        achados.length ? (
          <Botoes rotulo="Resultados da busca" itens={achados} atual={atual} escolher={escolher} />
        ) : (
          <p className="m-0 text-apagado">Nenhum clipe com “{busca.trim()}”.</p>
        )
      ) : (
        <>
          {!!favoritos.length && (
            <details open className="mt-1">
              <summary className="cursor-pointer py-2.5 font-bold">★ Favoritos ({favoritos.length})</summary>
              <Botoes
                rotulo="Favoritos"
                itens={favoritos.map((id) => [id, todos.get(id) ?? id] as const)}
                atual={atual}
                escolher={escolher}
              />
            </details>
          )}
          {categorias.map((c) => (
            <details key={c.titulo} open={c.aberta} className="mt-1">
              <summary className="cursor-pointer py-2.5 font-bold">
                {c.titulo} ({c.itens.length})
              </summary>
              <Botoes rotulo={c.titulo} itens={c.itens} atual={atual} escolher={escolher} />
            </details>
          ))}
        </>
      )}
    </div>
  );
}

// The actions a unit performs in a battle; each character gets one clip per action.
export const ACOES_DO_JOGO = [
  ['parado', 'Parado'],
  ['andar', 'Andar'],
  ['ataque1', 'Ataque de 1 mão'],
  ['ataque2', 'Ataque de 2 mãos'],
  ['bloqueio', 'Bloqueio'],
  ['magia', 'Magia'],
  ['tiro', 'Tiro'],
  ['golpe', 'Receber golpe'],
  ['morte', 'Morte'],
  ['pulo', 'Pulo'],
  ['nado', 'Nado'],
] as const;
type Acao = (typeof ACOES_DO_JOGO)[number][0];
/** character id -> action -> clip (as `?anim=` takes it) */
export type MapaDeAcoes = Record<string, Partial<Record<Acao, string>>>;
const CHAVE_MAPA = 'modelos:acoes';
const ACOES = new Set<string>(ACOES_DO_JOGO.map(([a]) => a));

/** Rebuilt field by field: unknown actions, empty clips and non-string values are dropped. */
export function lerMapa(v: unknown): MapaDeAcoes {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const mapa: MapaDeAcoes = {};
  for (const [personagem, acoes] of Object.entries(v)) {
    if (!acoes || typeof acoes !== 'object' || Array.isArray(acoes)) continue;
    const limpo = Object.fromEntries(
      Object.entries(acoes).filter(([a, c]) => ACOES.has(a) && typeof c === 'string' && c.trim()),
    ) as Partial<Record<Acao, string>>;
    if (Object.keys(limpo).length) mapa[personagem] = limpo;
  }
  return mapa;
}

/** Copies to the clipboard; without it (http, old browser, denied) selects the text so Ctrl+C works. */
async function copiar(texto: string, campo: HTMLTextAreaElement | null) {
  try {
    await navigator.clipboard.writeText(texto);
    return 'Copiado para a área de transferência.';
  } catch {
    campo?.focus();
    campo?.select();
    return 'Texto selecionado: use Ctrl+C para copiar.';
  }
}

export function AcoesDoJogo({
  personagem,
  nomePersonagem,
  atual,
  prefixo,
  nomeDe,
  escolher,
}: {
  personagem: string;
  nomePersonagem: string;
  atual: string;
  prefixo: string;
  nomeDe: (id: string) => string;
  escolher: (id: string) => void;
}) {
  const [mapa, setMapa] = useState(() => lerMapa(lerJson(CHAVE_MAPA)));
  const [texto, setTexto] = useState('');
  const [aviso, setAviso] = useState('');
  const campo = useRef<HTMLTextAreaElement>(null);
  const salvar = (novo: MapaDeAcoes) => {
    setMapa(novo);
    gravar(CHAVE_MAPA, JSON.stringify(novo));
  };
  const doPersonagem = mapa[personagem] ?? {};
  const atribuir = (acao: Acao) => {
    salvar({ ...mapa, [personagem]: { ...doPersonagem, [acao]: paraAnim(atual, prefixo) } });
    escolher(atual);
  };
  const importar = () => {
    let dados: unknown;
    try {
      dados = JSON.parse(texto);
    } catch {
      setAviso('Não é um JSON válido: nada foi importado.');
      return;
    }
    const novo = lerMapa(dados);
    const n = Object.keys(novo).length;
    if (!n) {
      setAviso('O JSON não tem nenhuma ação conhecida: nada foi importado.');
      return;
    }
    salvar(novo);
    setAviso(`Importado: ${n} ${n === 1 ? 'personagem' : 'personagens'}.`);
  };
  return (
    <section aria-label="Ações do jogo" className={CARTAO}>
      <h2 className="m-0 text-[21px] leading-tight">⚔️ Ações do jogo · {nomePersonagem}</h2>
      <p className="m-0 text-apagado">
        Toque um clipe e use “Usar o tocando” na ação; o botão do clipe toca de novo. Cada personagem tem o seu mapa.
      </p>
      <ul className="m-0 grid list-none gap-1.5 p-0">
        {ACOES_DO_JOGO.map(([acao, nome]) => {
          const clipe = doPersonagem[acao];
          return (
            <li key={acao} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)_auto] items-center gap-1.5">
              <span className="font-bold">{nome}</span>
              {clipe ? (
                <button
                  type="button"
                  aria-label={`Tocar ${nome}: ${nomeDe(deAnim(clipe, prefixo))}`}
                  aria-pressed={deAnim(clipe, prefixo) === atual}
                  onClick={() => escolher(deAnim(clipe, prefixo))}
                  className={`${BOTAO} truncate text-left`}
                >
                  ▶ {nomeDe(deAnim(clipe, prefixo))}
                </button>
              ) : (
                <span className="text-apagado">sem clipe</span>
              )}
              <button
                type="button"
                aria-label={`Usar o clipe tocando em ${nome}`}
                onClick={() => atribuir(acao)}
                className={BOTAO}
              >
                Usar o tocando
              </button>
            </li>
          );
        })}
      </ul>
      <details>
        <summary className="flex min-h-11 cursor-pointer items-center font-bold">Exportar ou importar (JSON)</summary>
        <div className="grid gap-2">
          <textarea
            ref={campo}
            aria-label="Mapa de ações em JSON"
            rows={6}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className={`${CAMPO} py-2 font-mono text-[13px]`}
          />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={BOTAO}
              onClick={async () => {
                const json = JSON.stringify(mapa, null, 2);
                setTexto(json);
                // the textarea must hold the text before the fallback selects it
                await new Promise((r) => setTimeout(r));
                setAviso(await copiar(json, campo.current));
              }}
            >
              Exportar e copiar
            </button>
            <button type="button" className={BOTAO} onClick={importar}>
              Importar o JSON colado
            </button>
          </div>
          {aviso && (
            <p role="status" className="m-0 text-apagado">
              {aviso}
            </p>
          )}
        </div>
      </details>
    </section>
  );
}

// the bench loads its models after the iframe's load event: each step waits this long on top of the clip
const FOLGA_DE_CARGA = 1500;
const DURACAO_SEM_DADO = 2;

/**
 * Plays a list of clip ids in order by swapping the iframe's URL (the bench has no message channel yet): each step
 * starts its timer when the iframe loads and the iframe is remounted per step, so a repeated clip still restarts.
 */
export function useSequencia(escolher: (id: string) => void, duracao: (id: string) => number | null | undefined) {
  const [seq, setSeq] = useState<{ lista: string[]; i: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const parar = () => {
    clearTimeout(timer.current);
    setSeq(null);
  };
  return {
    passo: seq && { i: seq.i, total: seq.lista.length },
    chave: seq ? `seq-${seq.i}` : 'livre',
    tocar(lista: string[]) {
      clearTimeout(timer.current);
      if (!lista.length) return;
      setSeq({ lista, i: 0 });
      escolher(lista[0]!);
    },
    parar,
    aoCarregar() {
      if (!seq) return;
      clearTimeout(timer.current);
      const s = (duracao(seq.lista[seq.i]!) ?? DURACAO_SEM_DADO) * 1000 + FOLGA_DE_CARGA;
      timer.current = setTimeout(() => {
        const i = seq.i + 1;
        if (i >= seq.lista.length) return setSeq(null);
        setSeq({ lista: seq.lista, i });
        escolher(seq.lista[i]!);
      }, s);
    },
  };
}

interface Sequencia {
  nome: string;
  clipes: string[];
}
const CHAVE_SEQUENCIAS = 'modelos:sequencias';
export function lerSequencias(v: unknown): Sequencia[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((x: unknown) => {
    if (!x || typeof x !== 'object') return [];
    const o = x as Record<string, unknown>;
    const clipes = lista(o.clipes);
    return typeof o.nome === 'string' && o.nome.trim() && clipes.length ? [{ nome: o.nome.trim(), clipes }] : [];
  });
}

export function Sequencias({
  atual,
  prefixo,
  nomeDe,
  sequencia,
}: {
  atual: string;
  prefixo: string;
  nomeDe: (id: string) => string;
  sequencia: ReturnType<typeof useSequencia>;
}) {
  const [clipes, setClipes] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [salvas, setSalvas] = useState(() => lerSequencias(lerJson(CHAVE_SEQUENCIAS)));
  const guardar = (novas: Sequencia[]) => {
    setSalvas(novas);
    gravar(CHAVE_SEQUENCIAS, JSON.stringify(novas));
  };
  const mover = (i: number, d: number) => {
    const novo = [...clipes];
    [novo[i], novo[i + d]] = [novo[i + d]!, novo[i]!];
    setClipes(novo);
  };
  const ids = clipes.map((c) => deAnim(c, prefixo));
  const { passo } = sequencia;
  return (
    <section aria-label="Sequências" className={CARTAO}>
      <h2 className="m-0 text-[21px] leading-tight">🎞️ Sequência de clipes</h2>
      <p className="m-0 text-apagado">
        Toque um clipe e adicione; a sequência toca em ordem no 3D (cada passo recarrega a bancada).
      </p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={BOTAO} onClick={() => setClipes([...clipes, paraAnim(atual, prefixo)])}>
          + Adicionar o clipe tocando
        </button>
        <button
          type="button"
          className={BOTAO}
          disabled={!clipes.length}
          onClick={() => (passo ? sequencia.parar() : sequencia.tocar(ids))}
        >
          {passo ? '⏹ Parar' : '▶ Tocar a sequência'}
        </button>
      </div>
      {passo && (
        <p role="status" className="m-0 font-bold">
          Passo {passo.i + 1} de {passo.total}
        </p>
      )}
      {clipes.length ? (
        <ol className="m-0 grid gap-1 pl-6">
          {clipes.map((c, i) => (
            // the same clip can repeat, so the position is part of the key
            <li key={`${i}-${c}`} className={passo?.i === i ? 'font-bold' : undefined}>
              <span className="flex flex-wrap items-center gap-1">
                <span className="mr-auto">{nomeDe(deAnim(c, prefixo))}</span>
                <button
                  type="button"
                  aria-label={`Subir ${i + 1}`}
                  disabled={!i}
                  onClick={() => mover(i, -1)}
                  className={BOTAO}
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={`Descer ${i + 1}`}
                  disabled={i === clipes.length - 1}
                  onClick={() => mover(i, 1)}
                  className={BOTAO}
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={`Tirar ${i + 1}`}
                  onClick={() => setClipes(clipes.filter((_, j) => j !== i))}
                  className={BOTAO}
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="m-0 text-apagado">Nenhum clipe ainda.</p>
      )}
      <form
        className="flex flex-wrap gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const n = nome.trim();
          if (!n || !clipes.length) return;
          guardar([...salvas.filter((s) => s.nome !== n), { nome: n, clipes }]);
        }}
      >
        <input
          aria-label="Nome da sequência"
          placeholder="Nome da sequência"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={`${CAMPO} w-auto min-w-0 flex-1`}
        />
        <button type="submit" className={BOTAO} disabled={!clipes.length || !nome.trim()}>
          Salvar
        </button>
      </form>
      {!!salvas.length && (
        <div className="grid gap-1">
          <div className="font-bold">Salvas</div>
          {salvas.map((s) => (
            <div key={s.nome} className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className={BOTAO}
                onClick={() => {
                  setClipes(s.clipes);
                  setNome(s.nome);
                  sequencia.tocar(s.clipes.map((c) => deAnim(c, prefixo)));
                }}
              >
                ▶ {s.nome} ({s.clipes.length})
              </button>
              <button
                type="button"
                aria-label={`Apagar a sequência ${s.nome}`}
                onClick={() => guardar(salvas.filter((x) => x.nome !== s.nome))}
                className={BOTAO}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
