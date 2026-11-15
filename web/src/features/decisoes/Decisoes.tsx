// Every per-asset decision in one list, filterable by lab and choice. Read-only: decisions are made on each asset's page.
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ARCHIVE, LABS } from '@/lib/labs';
import {
  COR_ESCOLHA,
  carregarDecisoes,
  type Decisao,
  ESCOLHAS,
  type Escolha,
  nomeEscolha,
  quando,
} from '@/lib/decisoes';
import { useLabAccent } from '@/lib/useLabAccent';

const SELECT = 'min-h-11 rounded-md border-2 border-input bg-white px-3 text-base text-tinta';

export function Decisoes() {
  useLabAccent(ARCHIVE.cor, ARCHIVE.corSuave);
  const [todas, setTodas] = useState<Decisao[] | null>(null);
  const [erro, setErro] = useState('');
  const [lab, setLab] = useState('');
  const [escolha, setEscolha] = useState<Escolha | ''>('');
  useEffect(() => {
    document.title = 'Decisões · Reino dos Laboratórios';
    carregarDecisoes()
      .then(setTodas)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)));
  }, []);
  // labs with a decision too, so an id from a lab not in lib/labs.ts still gets a filter
  const labs = [...new Set([...LABS.map((l) => l.id), ...(todas ?? []).map((d) => d.lab)])];
  const nomeLab = (id: string) => LABS.find((l) => l.id === id)?.nome ?? id;
  const lista = (todas ?? []).filter((d) => (!lab || d.lab === lab) && (!escolha || d.escolha === escolha));
  return (
    <main className="mx-auto grid max-w-[980px] gap-6 px-4 pt-7 pb-16 sm:px-10">
      <header className="grid gap-2">
        <h1 className="m-0 text-[40px] leading-none">Decisões</h1>
        <p className="m-0 max-w-[72ch] text-[17px]">
          O que você decidiu sobre cada faixa, modelo ou imagem dos labs. Para decidir, abra o item na página do lab. As
          sessões leem estas decisões no arquivo <code className="bg-terra px-1 text-[15px]">data/decisoes.json</code>.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1 font-bold">
          Lab
          <select className={SELECT} value={lab} onChange={(e) => setLab(e.target.value)}>
            <option value="">Todos</option>
            {labs.map((id) => (
              <option key={id} value={id}>
                {nomeLab(id)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-bold">
          Escolha
          <select className={SELECT} value={escolha} onChange={(e) => setEscolha(e.target.value as Escolha | '')}>
            <option value="">Todas</option>
            {ESCOLHAS.map(([e, nome]) => (
              <option key={e} value={e}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      {erro && (
        <p className="m-0 border border-dashed border-traco bg-bilhete px-4 py-3">
          Não consegui ler as decisões: {erro}.
        </p>
      )}
      {!todas && !erro && <p className="m-0 text-apagado">Carregando…</p>}
      {todas && (
        <p className="m-0 text-apagado" aria-live="polite">
          {lista.length} de {todas.length} decisões.
        </p>
      )}
      <ul className="m-0 grid list-none gap-3 p-0">
        {lista.map((d) => (
          <li key={d.id} className="grid gap-1 border border-l-8 border-borda border-l-lab bg-folha px-4 py-3">
            <span className="flex flex-wrap items-center gap-2">
              <Badge estado={COR_ESCOLHA[d.escolha]}>{nomeEscolha(d.escolha)}</Badge>
              <code className="text-[15px] break-all">{d.id}</code>
            </span>
            {d.nota && <span className="max-w-[72ch]">{d.nota}</span>}
            <span className="text-[15px] text-apagado">
              {nomeLab(d.lab)} · {quando(d.atualizadoEm)}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
