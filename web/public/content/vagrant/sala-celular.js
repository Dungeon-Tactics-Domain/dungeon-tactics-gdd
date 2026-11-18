// Phone behaviour of the room page (Fernando, Nov 18, same scheme as the game's fullscreen.ts): the first tap on a touch
// device enters fullscreen and locks landscape on a phone; a button offers it again; a portrait phone is asked to turn;
// the browser's install prompt (or the iPhone's Share steps) is offered once. A PC sees none of it.
const touch = matchMedia('(pointer: coarse)').matches;
const instalado = () => matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || !!navigator.standalone;
const celular = () => Math.min(screen.width, screen.height) < 600; // a tablet plays both ways, only a phone is locked
const api = !!document.fullscreenEnabled;
const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const lembrado = (k, v) => { try { if (v === undefined) return sessionStorage.getItem(k) === '1'; sessionStorage.setItem(k, '1'); } catch { /* blocked: the banner may come back */ } return false; };

if (touch && !instalado()) {
  const css = document.createElement('style');
  css.textContent = `.cel{position:fixed;z-index:60;font:16px/1.4 system-ui,sans-serif;color:#eef;background:rgba(8,10,20,.92);border:1px solid rgba(255,255,255,.18);border-radius:10px}
.cel button{min-height:44px;min-width:44px;padding:0 16px;font:inherit;font-weight:600;border-radius:8px;border:1px solid rgba(255,255,255,.3);background:#2a3560;color:#fff;cursor:pointer}
.cel button.alt{background:transparent}.cel[hidden]{display:none!important}
#cel-tela{right:max(8px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));padding:4px}
#cel-girar{inset:0;border-radius:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center;padding:24px;z-index:70;background:rgba(8,10,20,.97)}
#cel-girar svg{width:96px;height:96px;animation:cel-gira 2.4s ease-in-out infinite}
@keyframes cel-gira{0%,15%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}@media(prefers-reduced-motion:reduce){#cel-girar svg{animation:none}}
#cel-instala{left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));max-width:min(30em,calc(100% - 16px));padding:10px 12px;display:flex;gap:10px;align-items:center}`;
  document.head.append(css);
  const el = (id, html) => { const d = document.createElement('div'); d.id = id; d.className = 'cel'; d.innerHTML = html; d.hidden = true; document.body.append(d); return d; };

  // fullscreen: the first gesture asks for it (a browser grants it only inside one); the button asks again after Esc or the back gesture
  const tela = el('cel-tela', '<button type=button>Tela cheia</button>');
  const pede = () => document.documentElement.requestFullscreen().then(() => { if (celular()) return screen.orientation?.lock?.('landscape'); }).catch(() => { /* refused: stays as it was */ });
  const mostraTela = () => { tela.hidden = !api || !!document.fullscreenElement; };
  tela.querySelector('button').onclick = pede;
  if (api) {
    document.addEventListener('fullscreenchange', mostraTela);
    const primeiro = () => { for (const t of ['pointerup', 'keydown']) removeEventListener(t, primeiro, true); if (!document.fullscreenElement) pede(); };
    for (const t of ['pointerup', 'keydown']) addEventListener(t, primeiro, true);
  }
  mostraTela();

  // turn the phone: shown while a phone stands in portrait; "Continue" hides it for this visit
  const girar = el('cel-girar', '<svg viewBox="0 0 24 24" fill="none" stroke="#eef" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 19h2"/></svg><b style="font-size:20px">Vire o celular</b><span>A sala é feita para tela deitada.</span><button type=button class=alt>Continuar assim</button>');
  const retrato = matchMedia('(orientation: portrait)');
  const mostraGirar = () => { girar.hidden = !(celular() && retrato.matches && !lembrado('cel-girar-ok')); };
  girar.querySelector('button').onclick = () => { lembrado('cel-girar-ok', 1); mostraGirar(); };
  retrato.addEventListener('change', mostraGirar); mostraGirar();

  // install: Chrome's own prompt when it fires; the iPhone has none, so the Share steps are written out
  const instala = el('cel-instala', '<span></span><button type=button>Instalar</button><button type=button class=alt aria-label="Fechar">✕</button>');
  const [texto, botao, fecha] = [instala.querySelector('span'), ...instala.querySelectorAll('button')];
  let evento = null;
  const dispensa = () => { lembrado('cel-instala-ok', 1); instala.hidden = true; };
  fecha.onclick = dispensa;
  if (ios) { texto.textContent = 'Para instalar: toque em Compartilhar e depois em Adicionar à Tela de Início.'; botao.hidden = true; instala.hidden = lembrado('cel-instala-ok'); }
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); evento = e; texto.textContent = 'Instale a sala na tela inicial: abre em tela cheia.'; botao.hidden = false; instala.hidden = lembrado('cel-instala-ok'); });
  botao.onclick = async () => { if (!evento) return; evento.prompt(); await evento.userChoice.catch(() => {}); evento = null; dispensa(); };
  addEventListener('appinstalled', dispensa);
}
