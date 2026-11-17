// Roteiro do teste de dublagem (copiado de voz-teste/roteiro.json em 17/11): 20 falas em inglês, 5 por personagem.
export interface Fala {
  id: string;
  personagem: string;
  emocao: string;
  direcao: string;
  texto: string;
}
export const PERSONAGENS: { id: string; nome: string; voz: string }[] = [
  {
    id: 'bran',
    nome: 'Bran',
    voz: 'Male, around 50 years old, American accent. Very deep, rough, gravelly voice of a battle-worn veteran warrior. Chesty and heavy, slow and deliberate pacing.',
  },
  {
    id: 'tess',
    nome: 'Tess',
    voz: 'Female, early twenties, American accent. Bright, quick, agile voice of a young archer with a sarcastic, teasing edge. Light and nimble, fast pacing.',
  },
  {
    id: 'odo',
    nome: 'Odo',
    voz: 'Male, around 65 years old, British accent (Received Pronunciation). Dry, thin, scholarly voice of an old wizard. Precise diction, measured pacing, slightly weary.',
  },
  {
    id: 'vilao',
    nome: 'O Vilão',
    voz: 'Male, around 45 years old, British accent. Very deep, dark, menacing voice of a villain. Cold, controlled, never rushed, velvet-smooth with quiet threat.',
  },
];

export const FALAS: Fala[] = [
  {
    id: 'bran_01',
    personagem: 'bran',
    emocao: 'comando',
    direcao: 'Battle shout, loud, commanding, urgent.',
    texto: 'Shields up! Hold the line!',
  },
  {
    id: 'bran_02',
    personagem: 'bran',
    emocao: 'raiva',
    direcao: 'Furious roar in the middle of combat, full of rage.',
    texto: "You'll pay for that, you bastard!",
  },
  {
    id: 'bran_03',
    personagem: 'bran',
    emocao: 'dor',
    direcao: 'Wounded, speaking through clenched teeth, in pain, short of breath, but stubborn.',
    texto:
      "Agh... it's nothing. Just a scratch. I've had worse from a tavern door. Bind it tight and hand me my axe... we're not done here.",
  },
  {
    id: 'bran_04',
    personagem: 'bran',
    emocao: 'tristeza',
    direcao: 'Quiet grief by a campfire, low and heavy, voice almost breaking, long pauses.',
    texto:
      "I buried thirty good men under that hill. I still remember every name. Some nights I say them out loud, just so somebody does. Don't ask me to forget them, girl.",
  },
  {
    id: 'bran_05',
    personagem: 'bran',
    emocao: 'vitoria',
    direcao: 'Triumphant, exhausted laugh after a hard-won battle, warm and proud.',
    texto:
      "Ha! Would you look at that. They're running! Twenty years I've waited to see the backs of those dogs. Tonight, the first round is on me!",
  },
  {
    id: 'tess_01',
    personagem: 'tess',
    emocao: 'vitoria',
    direcao: 'Short cocky shout after landing a perfect shot, playful.',
    texto: "Bullseye! Who's next?",
  },
  {
    id: 'tess_02',
    personagem: 'tess',
    emocao: 'medo',
    direcao: 'Panicked warning scream, sudden fear.',
    texto: 'Behind you! Move, move!',
  },
  {
    id: 'tess_03',
    personagem: 'tess',
    emocao: 'ironia',
    direcao: 'Dripping sarcasm, dry and amused, eye-rolling delivery.',
    texto:
      "Oh, brilliant plan. Walk straight through the front gate, in broad daylight, and politely ask the dragon to leave. Why didn't I think of that? Truly, you're a genius.",
  },
  {
    id: 'tess_04',
    personagem: 'tess',
    emocao: 'medo',
    direcao: 'Whispering, frightened, hiding in the dark, trembling breath, trying to stay quiet.',
    texto:
      "Shh. Don't breathe. It's right above us. I can hear its claws on the stone. If it looks down... just run. Don't wait for me.",
  },
  {
    id: 'tess_05',
    personagem: 'tess',
    emocao: 'tristeza',
    direcao: 'Holding back tears, voice cracking, angry at herself, vulnerable.',
    texto:
      "I had the shot. I had it, and I froze. He's gone because my hands were shaking. So don't tell me it wasn't my fault. Just... don't.",
  },
  {
    id: 'odo_01',
    personagem: 'odo',
    emocao: 'comando',
    direcao: 'Spell incantation shouted with force and authority.',
    texto: 'Stand back! Ignis!',
  },
  {
    id: 'odo_02',
    personagem: 'odo',
    emocao: 'dor',
    direcao: 'Sharp cry of pain, hit by an arrow, startled and indignant.',
    texto: 'Argh! My arm! Confound it!',
  },
  {
    id: 'odo_03',
    personagem: 'odo',
    emocao: 'ironia',
    direcao: 'Dry, weary British sarcasm, a lecturing professor who is utterly unimpressed.',
    texto:
      'Forty years of study. Forty. And I am to be remembered as the man who held the door while a barbarian looted a pantry. Do carry on. I shall simply stand here and weep for civilisation.',
  },
  {
    id: 'odo_04',
    personagem: 'odo',
    emocao: 'medo',
    direcao: 'Hushed dread, a scholar realising something terrible, voice tightening, speaking faster toward the end.',
    texto:
      'No. No, that seal should have held for a thousand years. Someone has broken it from the inside. Do you understand what that means? We are not the ones hunting it.',
  },
  {
    id: 'odo_05',
    personagem: 'odo',
    emocao: 'curiosidade',
    direcao: 'Delighted fascination, an old scholar discovering something wonderful, warm and animated.',
    texto:
      'Fascinating. Look at these runes! They predate the old kingdom by centuries. Oh, if only I had my notes. Hold the torch closer, would you? Closer, I said!',
  },
  {
    id: 'vilao_01',
    personagem: 'vilao',
    emocao: 'comando',
    direcao: 'Cold, quiet order, not shouted, absolute authority.',
    texto: 'Kill them. All of them.',
  },
  {
    id: 'vilao_02',
    personagem: 'vilao',
    emocao: 'raiva',
    direcao: 'Controlled fury finally breaking through, a sudden sharp bark.',
    texto: 'Enough! Kneel!',
  },
  {
    id: 'vilao_03',
    personagem: 'vilao',
    emocao: 'ameaca',
    direcao: 'Slow, intimate threat, almost a whisper, savouring each word, completely calm.',
    texto:
      'You mistake my patience for mercy. I let you reach this hall because I wished to see your faces when you understood. No one is coming. No one ever was.',
  },
  {
    id: 'vilao_04',
    personagem: 'vilao',
    emocao: 'ironia',
    direcao: 'Amused contempt, mocking politeness, a dark quiet chuckle.',
    texto:
      'A farmer, a thief, and a tired old man. This is the army that will end me? Forgive me. I expected the prophecy to have higher standards.',
  },
  {
    id: 'vilao_05',
    personagem: 'vilao',
    emocao: 'dor',
    direcao: 'Mortally wounded but still controlled and menacing, strained breathing, bitter final words.',
    texto:
      'So... the dog bites after all. Enjoy your little victory. I have already planted the seed. When it blooms, you will beg for a master as kind as I was.',
  },
];
