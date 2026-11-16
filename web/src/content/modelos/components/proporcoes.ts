// Measurements of the remodelled KayKit characters, written by the remodel agent on the bench
// (eval/kaykit-remodel/proporcoes.json). Read at run time: the file may not exist yet (the bench then answers its
// HTML page) and comes from another process, so it is rebuilt field by field and anything doubtful is dropped.
import { useEffect, useState } from 'react';
import type { Ficha, Linha } from '../fichas';
import { BANCADA } from './bancada';

export interface Proporcao {
  id: string;
  /** path on the bench, e.g. /eval/kaykit-remodel/knight-5h.glb or /models/knight.glb */
  arquivo: string;
  nome: string;
  cabecas?: number;
  alturaTotal?: number;
  alturaCabeca?: number;
  alturaTronco?: number;
  alturaPerna?: number;
  alturaBraco?: number;
  triangulos?: number;
  ossos?: number;
  clipes?: number;
  metodo: string;
  gerado: string;
  versao: string;
  defeitos: string[];
  oQueTestar: string[];
}

export const URL_PROPORCOES = `${BANCADA}/eval/kaykit-remodel/proporcoes.json`;

const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
const texto = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const textos = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x) : []);

/** A bare file name lives in the remodel folder; a path is kept (with a leading slash). */
export function caminhoDoArquivo(arquivo: string) {
  if (arquivo.includes('/')) return arquivo.startsWith('/') ? arquivo : `/${arquivo}`;
  return `/eval/kaykit-remodel/${arquivo}`;
}

/** Valid entries only: each needs an id and a .glb file; duplicated ids keep the first. */
export function lerProporcoes(dados: unknown): Proporcao[] {
  if (!Array.isArray(dados)) return [];
  const vistos = new Set<string>();
  return dados.flatMap((x: unknown) => {
    if (!x || typeof x !== 'object') return [];
    const o = x as Record<string, unknown>;
    const id = texto(o.id).trim();
    const arquivo = texto(o.arquivo).trim();
    if (!id || !/\.glb$/i.test(arquivo) || vistos.has(id)) return [];
    vistos.add(id);
    return [
      {
        id,
        arquivo: caminhoDoArquivo(arquivo),
        nome: texto(o.nome).trim() || id,
        cabecas: numero(o.cabecas),
        alturaTotal: numero(o.alturaTotal),
        alturaCabeca: numero(o.alturaCabeca),
        alturaTronco: numero(o.alturaTronco),
        alturaPerna: numero(o.alturaPerna),
        alturaBraco: numero(o.alturaBraco),
        triangulos: numero(o.triangulos),
        ossos: numero(o.ossos),
        clipes: numero(o.clipes),
        metodo: texto(o.metodo),
        gerado: texto(o.gerado),
        versao: texto(o.versao),
        defeitos: textos(o.defeitos),
        oQueTestar: textos(o.oQueTestar),
      },
    ];
  });
}

const br = (n: number, casas: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

/** "5,0 cabeças = 1 de cabeça + 4,0 de corpo" */
export const textoCabecas = (c: number) => `${br(c, 1)} cabeças = 1 de cabeça + ${br(c - 1, 1)} de corpo`;

export function fichaDaProporcao(p: Proporcao): Ficha {
  const origem = 'proporcoes.json da bancada';
  const medida = (rotulo: string, v: number | undefined, casas = 3): Linha[] =>
    v === undefined ? [] : [[rotulo, br(v, casas), origem]];
  return {
    numeros: [
      [
        'Cabeças',
        p.cabecas === undefined ? 'não medido' : textoCabecas(p.cabecas),
        p.cabecas === undefined ? '—' : origem,
      ],
      ...medida('Altura total (unidades do arquivo)', p.alturaTotal),
      ...medida('Cabeça', p.alturaCabeca),
      ...medida('Tronco', p.alturaTronco),
      ...medida('Perna', p.alturaPerna),
      ...medida('Braço', p.alturaBraco),
      ...medida('Triângulos', p.triangulos, 0),
      ...medida('Ossos', p.ossos, 0),
      ...medida('Clipes', p.clipes, 0),
    ],
    metodo: p.metodo || 'não informado',
    origemMetodo: origem,
    defeitos: p.defeitos,
    origemDefeitos: origem,
    oQueTestar: p.oQueTestar,
    arquivo: p.arquivo,
    data: [p.gerado, p.versao && `versão ${p.versao}`].filter(Boolean).join(', ') || undefined,
  };
}

/** The list, or "medindo" while the file is missing or not JSON (the bench answers its page for unknown paths). */
export function useProporcoes() {
  const [lista, setLista] = useState<Proporcao[] | 'carregando' | 'medindo'>('carregando');
  useEffect(() => {
    let vivo = true;
    fetch(URL_PROPORCOES, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: unknown) => {
        const l = lerProporcoes(j);
        if (vivo) setLista(l.length ? l : 'medindo');
      })
      .catch(() => vivo && setLista('medindo'));
    return () => {
      vivo = false;
    };
  }, []);
  return lista;
}
