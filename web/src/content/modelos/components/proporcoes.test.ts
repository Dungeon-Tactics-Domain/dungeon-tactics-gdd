import { describe, expect, it } from 'vitest';
import { caminhoDoArquivo, fichaDaProporcao, lerProporcoes, textoCabecas } from './proporcoes';

describe('proporcoes.json', () => {
  it('keeps valid entries field by field and drops the rest', () => {
    const l = lerProporcoes([
      {
        id: 'k5',
        arquivo: 'knight-5h.glb',
        nome: 'Cavaleiro 5',
        cabecas: 5,
        alturaTotal: 2.467,
        triangulos: 'muitos',
        defeitos: ['capa rígida', 3],
        extra: 'x',
      },
      { id: 'orig', arquivo: '/models/knight.glb' },
      { id: 'k5', arquivo: 'outro.glb' }, // duplicated id
      { id: '', arquivo: 'a.glb' },
      { id: 'sem-glb', arquivo: 'a.png' },
      null,
      'texto',
    ]);
    expect(l.map((p) => [p.id, p.arquivo])).toEqual([
      ['k5', '/eval/kaykit-remodel/knight-5h.glb'],
      ['orig', '/models/knight.glb'],
    ]);
    expect(l[0]).toMatchObject({ cabecas: 5, alturaTotal: 2.467, triangulos: undefined, defeitos: ['capa rígida'] });
    expect(l[1]!.nome).toBe('orig');
    expect(lerProporcoes('<!doctype html>')).toEqual([]);
    expect(lerProporcoes({ id: 'x' })).toEqual([]);
  });

  it('writes the head ratio and the measures in the sheet', () => {
    expect(textoCabecas(5)).toBe('5,0 cabeças = 1 de cabeça + 4,0 de corpo');
    expect(caminhoDoArquivo('eval/x.glb')).toBe('/eval/x.glb');
    const [p] = lerProporcoes([
      {
        id: 'a',
        arquivo: 'a.glb',
        cabecas: 2.11,
        alturaCabeca: 1.099,
        gerado: '2026-11-15T19:59:24-03:00',
        versao: '2',
      },
    ]);
    const f = fichaDaProporcao(p!);
    expect(f.numeros.map(([r, v]) => `${r}: ${v}`)).toEqual([
      'Cabeças: 2,1 cabeças = 1 de cabeça + 1,1 de corpo',
      'Cabeça: 1,099',
    ]);
    expect(f.data).toBe('15/11/2026, 19:59, versão 2');
  });
});
