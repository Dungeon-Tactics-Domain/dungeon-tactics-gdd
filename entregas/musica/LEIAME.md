# battle_dark_tratada.ogg

Tema principal dark (90 bpm, 60 compassos, 160,0 s), versão tratada, loop que volta ao compasso 1.

- Origem: `scripts/music/battle_dark.py` (composição original, MIDI gerado por script) renderizada com fluidsynth e o filtro PS1 de `scripts/music/psx.py`.
- Tratamento (ffmpeg, o arquivo real, não a aproximação do navegador): highpass 32 Hz, compressor (limiar 0,08, razão 3,5), limitador 0,7, loudnorm I=-18 LUFS TP=-3 (alvo igual ao de `public/music/battle.mp3`, que mede -17,8 LUFS, pico -3,2 dB).
- Soundfont: SGM-V2.01 (SoundFontGuy / "Shan"). Só o .ogg renderizado vai ao jogo, nunca o .sf2.
- **Licença do SGM-V2.01: NÃO resolvida.** Fontes divergem (pede crédito / CC BY / texto próprio). O Fernando decidiu usar o SGM assim mesmo; antes de publicar, conferir o texto de licença do pacote original. Crédito sugerido: "SGM-V2.01 SoundFont by Shan".
- Melodia e harmonia originais, sem trecho de Trisection nem de Darkest Dungeon (só estrutura e clima como referência).

# city_pastoral_d_tratada.ogg

Pastoral D (escolhida pelo Fernando em 15/11 para a cidade; não havia notas salvas), versão tratada, mesmo tratamento do ffmpeg (highpass 32 Hz, compressor, limitador, loudnorm I=-18 LUFS TP=-3).
- Origem: `scripts/music/eval/slot_D.py`, composição original, renderizada com a soundfont MuseScore General (MIT; crédito: "MuseScore General SoundFont, MIT") e o filtro PS1 de `psx.py`. Só o .ogg vai ao jogo, nunca o .sf2.
