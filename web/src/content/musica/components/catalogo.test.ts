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
    expect(conta('referencias')).toBe(12); // 13 pastas de stems de referência; as duas da Trisection viraram uma música
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

  it('junta a transcrição em piano à Trisection do MIDI de fã, como versão', () => {
    const tris = valido().songs.filter((s) => s.title.startsWith('Trisection'));
    expect(tris.map((s) => [s.id, s.title])).toEqual([['ref-trisection-midi-fa', 'Trisection']]);
    const ids = tris[0]!.versions.map((v) => v.id);
    expect(ids).toContain('transcricao');
    expect(new Set(ids).size).toBe(ids.length);
    expect(tris[0]!.measurements.map((m) => m.label)).toContain('Duração · Transcrição em piano · MuseScore General');
  });

  it('põe a versão ao vivo por último, com o MIDI e os canais da versão General MIDI', () => {
    for (const s of valido().songs) {
      const vivo = s.versions.at(-1)!;
      expect([vivo.id, vivo.label, vivo.live?.soundfont]).toEqual([
        'ao-vivo',
        'Ao vivo · GeneralUser GS',
        '/soundfonts/GeneralUser-GS.sf2',
      ]);
      expect(s.versions.filter((v) => v.live)).toHaveLength(1);
      const gm = s.versions.find((v) => v.id === 'musescore') ?? s.versions[0]!;
      expect([vivo.midi, vivo.channels]).toEqual([gm.midi, gm.channels]);
    }
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
