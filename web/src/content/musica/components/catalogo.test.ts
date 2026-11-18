import { describe, expect, it } from 'vitest';
import { catalogo, idDaFaixa, montarCatalogo } from './catalogo';

const valido = () => {
  if (!catalogo.ok) throw new Error(catalogo.errors.join('\n'));
  return catalogo.value;
};

describe('catálogo do player', () => {
  it('valida com parseCatalog e reparte as músicas pelas categorias', () => {
    const conta = (c: string) => valido().songs.filter((s) => s.category === c).length;
    expect(['batalha', 'cidade', 'jingles', 'testes', 'vitoria'].map(conta)).toEqual([8, 8, 18, 6, 0]);
    expect(conta('referencias')).toBeGreaterThan(0);
  });

  it('dá história em rascunho e onde toca a toda música', () => {
    const sem = valido().songs.filter((s) => !s.story || !s.storyDraft || !s.whereItPlays);
    expect(sem.map((s) => s.id)).toEqual([]);
  });

  it('faz de cada soundfont uma versão, com canais 0-based', () => {
    const c = valido().songs.find((s) => s.id === 'batalha-c')!;
    expect(c.versions.map((v) => v.id)).toContain('tfg');
    const tfg = c.versions.find((v) => v.id === 'tfg')!;
    expect(tfg.stemsBase).toBe('/content/musica/stems/batalha_C_tfg');
    expect(tfg.midi).toBe('/content/musica/midi/batalha_C_tfg.mid');
    expect(c.channels.every((ch) => ch.channel >= 0 && ch.channel <= 15)).toBe(true);
  });

  it('liga a pasta à faixa do lab e a história à composição-mãe', () => {
    expect(['batalha_A', 'dark', 'cc_another_world_extended', 'trisection_fa'].map(idDaFaixa)).toEqual([
      'batalha-a',
      'dark-principal',
      'ref-cc-another-world-extended',
      'ref-trisection-midi-fa',
    ]);
    const r = montarCatalogo(
      {
        trisection_fa_gugs: { duracao: 10, stems: [{ canal: 10, programa: null, nome: 'Drums' }] },
      },
      { 'ref-trisection': { storyDraft: 'Rascunho.', ondeToca: 'Só estudo.' } },
    );
    if (!r.ok) throw new Error(r.errors.join('\n'));
    const [s] = r.value.songs;
    expect([s!.story, s!.storyDraft, s!.whereItPlays]).toEqual(['Rascunho.', true, 'Só estudo.']);
    expect(s!.channels).toEqual([{ channel: 9, program: null, name: 'Drums' }]);
  });
});
