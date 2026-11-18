// Vagrant Story sound effects on the clip frames that call them. The sounds and their table (sfx.js, built by
// D:\Projetos\_estudo-vagrant\sfx\ferramentas\montar.py) are copied into ./sfx/, which .gitignore keeps out of git;
// Fernando chose on 17/11 to serve them on the lab domain so he can hear them away from the PC.
// The browser only plays after the first click on the page, which every page here needs anyway.
const BASE = new URL('./sfx/', import.meta.url).href;
const dados = new Promise((ok) => {
  const s = document.createElement('script'); s.src = BASE + 'sfx.js';
  s.onload = () => ok(window.VS_SFX || null); s.onerror = () => ok(null); document.head.appendChild(s);
});

// Returns som(clip, seconds): call it every frame with the clip that plays and its time; it plays each event once
// when the time crosses its frame, again after a loop or a restart.
export async function criaSom(zud, chave) {
  const d = await dados, clipes = d?.personagens[zud]?.seq[chave]?.clipes;
  if (!clipes) return () => {};
  let clipe = -1, antes = 0;
  return (n, t) => {
    if (n !== clipe || t < antes) { clipe = n; antes = -1e-3; }
    for (const e of clipes[n] || []) if (e.t > antes && e.t <= t && e.efeitos.length) {
      // the two impact effects play together (func_8006C5AC); voices draw one of their entries (func_800AE4FC)
      const lista = e.juntos ? e.efeitos : [e.efeitos[Math.floor(Math.random() * e.efeitos.length)]];
      for (const f of lista) { const a = new Audio(BASE + d.efeitos[f].ogg); a.volume = 0.4; a.play().catch(() => {}); }
      console.debug('[sfx]', zud, 'clipe', n, 'quadro', e.quadro, e.som || e.cod, lista.join(' + '));
    }
    antes = t;
  };
}
