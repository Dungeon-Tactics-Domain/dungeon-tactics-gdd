// Tooltip texts of the studio: what each control, sound (soundfont) and instrument is, and why it is there.
// Licence lines marked "a conferir" are not settled yet (see the pending list of the music session).

export const DICAS_UI = {
  tocar: 'Toca todos os instrumentos juntos, em loop. Espaço também toca e pausa.',
  geral: 'Volume geral antes do tratamento: abaixe se o conjunto soar alto; não muda a mixagem entre instrumentos.',
  original:
    'Original: o som cru do sintetizador (fluidsynth) com a soundfont escolhida, sem o filtro de acabamento do jogo.',
  tratada:
    'Tratada: aproxima, no navegador, o acabamento do jogo (filtro de graves, compressão leve e limitador), mais perto do que se ouve no jogo.',
  visao: 'Visão geral da música inteira. Clique para ir a esse ponto.',
  volume: 'Volume só deste instrumento na mistura.',
  mudo: 'Mudo: silencia só este instrumento.',
  solo: 'Solo: toca só este instrumento (e os outros em solo). Bom para ouvir uma linha isolada.',
  versao: 'Versão da música. Cada uma parte do mesmo tema com mais ou menos camadas; a troca mantém o som escolhido.',
  som: 'Som: um preset de soundfonts. "Um som em todos" usa a mesma soundfont em cada instrumento; ao trocar o som de um instrumento ele vira Personalizado e você pode salvar como preset.',
  somInstrumento:
    'Soundfont só deste instrumento; os outros mantêm o som deles. Só aparecem as soundfonts que têm este instrumento.',
  salvar:
    'Guarda o som de cada instrumento como um preset seu (fica neste navegador e vale em outras músicas com os mesmos instrumentos).',
  excluir: 'Apaga este preset seu.',
  musica: 'Música: troca a faixa sem sair da página; o texto abaixo do estúdio muda junto.',
  acabamento: 'Acabamento: Tratada se aproxima do que se ouve no jogo; Original é o render cru da soundfont.',
} as const;

export const DICAS_SOM: Record<string, string> = {
  'MuseScore General':
    'Soundfont geral do MuseScore (licença MIT), a usada nos nossos renders do jogo. Timbres limpos, derivados do FluidR3.',
  'GeneralUser GS':
    'Soundfont pequena e equilibrada, boa em pianos e guitarras. Licença própria permissiva (a conferir).',
  FluidR3: 'Clássica GM, grande e de timbre quente. Licença MIT.',
  SGM: 'SGM-V2.01: cordas e metais cheios, é a do tema de batalha. Licença ainda não confirmada para o jogo.',
  'Neo Orchestra': 'Orquestral, cordas e metais mais amplos. Licença a conferir.',
  'Tactical Fantasy Guy':
    'Sons de PlayStation 1, poucos instrumentos, sem baixo nem bateria (viram cello e tímpano). É o timbre "de época". Licença a conferir.',
  'SC-88 (teste privado)':
    'Soundfont de fã com os sons do Roland SC-88, o módulo que está em muitos jogos dos anos 90 e 2000. Só para ouvir e comparar: os sons são da Roland e não entram no jogo.',
  Sonatina:
    'Sonatina Symphonic Orchestra: orquestra mais realista, sem bateria GM (a percussão vira tímpano e pratos).',
};

// what an instrument usually does in these pieces, by General MIDI program; the page can add why it is in that piece
const FUNCAO: Record<number, string> = {
  0: 'Piano: harmonia e marcação rítmica.',
  8: 'Celesta: brilho agudo, pontua frases e finais.',
  24: 'Violão de nylon: acordes e arpejos que dão o chão pastoral.',
  32: 'Baixo acústico: sustenta a harmonia e dá o pulso grave.',
  33: 'Baixo elétrico: base grave.',
  42: 'Cello: contracanto e notas-guia, calor no médio-grave.',
  43: 'Contrabaixo: base grave de orquestra.',
  45: 'Cordas em pizzicato: pulso curto e ostinatos leves.',
  46: 'Harpa: arpejos e brilho que ligam as frases.',
  47: 'Tímpano: peso e tensão nos finais de frase.',
  48: 'Cordas: colchão harmônico e crescendos.',
  49: 'Conjunto de cordas: colchão harmônico que sustenta a melodia.',
  52: 'Coro: textura de voz, clima solene.',
  56: 'Trompete: destaque e fanfarra.',
  60: 'Trompa: calor e peso nos clímax.',
  61: 'Metais: força nos pontos altos.',
  68: 'Oboé: voz principal ou contracanto, timbre nasal e expressivo.',
  71: 'Clarinete: voz de meio-registro, suave e redonda.',
  73: 'Flauta: a melodia principal, leve e aérea.',
  75: 'Flauta de pã: cor exótica.',
  79: 'Ocarina: cor de jogo antigo.',
  108: 'Kalimba: pontuação cristalina.',
};

export const funcaoDe = (programa: number | null | undefined, canal: number) =>
  canal === 10
    ? 'Bateria e percussão: dá o balanço e marca as seções (as congas e o pandeiro do tema).'
    : (programa != null && FUNCAO[programa]) || 'Instrumento de acompanhamento.';
