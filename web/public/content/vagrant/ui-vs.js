// ui-vs.js: builders for the shared interface kit of the Vagrant Story 3D viewers (styles in ui-vs.css).
// No three.js here and no gamepad loop: the page reads its own input and calls destacar() to light keys and buttons.

// h('button', { class: 'x', onclick }, child, 'text'): attributes that start with "on" become listeners, null is skipped.
function h(tag, attrs = {}, ...filhos) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...filhos.filter((f) => f != null));
  return e;
}
const svgDe = (html) => Object.assign(document.createElement('template'), { innerHTML: html }).content.firstChild;

// ---- icons: one family, 24 px grid, 1.8 px square strokes, drawn here (no pictures, no emoji) ----------------------
const TRACOS = {
  atacar: '<path d="M20 4 9 15M6 12l6 6M8 16l-4 4M15 4h5v5"/>',
  fogo: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/>',
  raio: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>',
  tocha: '<path d="M10 12h4l-1 9h-2zM12 3c2 2 3 3 3 5a3 3 0 0 1-6 0c0-2 1-3 3-5z"/>',
  correr: '<path d="m4 6 6 6-6 6M12 6l6 6-6 6"/>',
  pular: '<path d="M12 17V4M6 10l6-6 6 6M4 21h16"/>',
  texturas: '<path d="M3 3h18v18H3zM3 12h18M12 3v18"/><path d="M3 3h9v9H3zM12 12h9v9h-9z" fill="currentColor" fill-opacity=".35" stroke="none"/>',
  sombras: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
  planta: '<path d="M3 3h18v18H3zM3 10h8M11 3v11M15 21v-7h6"/>',
  fumaca: '<path d="M4 8c3-3 5 3 8 0s5 3 8 0M4 13c3-3 5 3 8 0s5 3 8 0M4 18c3-3 5 3 8 0s5 3 8 0"/>',
  agua: '<path d="m12 3 6 9a6 6 0 1 1-12 0z"/>',
  desempenho: '<path d="M4 18a9 9 0 1 1 16 0M12 14l4-6"/>',
  controles: '<path d="M3 8h18v9h-4l-2-3H9l-2 3H3zM7 10v3M5.5 11.5h3M16 11.5h.01"/>',
  ferramentas: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/>',
  fechar: '<path d="m5 5 14 14M19 5 5 19"/>',
  seta: '<path d="m6 9 6 6 6-6"/>',
  aliado: '<path d="m12 3 3 3-3 3-3-3zM6 21v-6l6-4 6 4v6"/>',
  inimigo: '<path d="m5 3 3 5M19 3l-3 5M6 9h12v7l-3 2v3H9v-3l-3-2zM9.5 13h.01M14.5 13h.01"/>',
  copiar: '<path d="M8 8h12v12H8zM4 16V4h12"/>',
  ok: '<path d="m4 12 5 5L20 6"/>',
  erro: '<path d="M12 3 22 21H2zM12 10v5M12 18h.01"/>',
  info: '<path d="M4 4h16v16H4zM12 11v6M12 7h.01"/>',
  marca: '<path d="m12 5 7 7-7 7-7-7z" fill="currentColor"/>',
};
/** SVG markup of a kit icon. Decorative: the text beside it (or the aria-label of its button) names the control. */
export const icone = (nome, tam = 24) =>
  `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${TRACOS[nome] || TRACOS.info}</svg>`;

// ---- gamepad icons: the plain shapes of sala-fechada.html (no logos), redrawn so their letters reach 16 px ---------
// b: a button of the standard mapping (0-15) or 'LS' / 'RS'. estilo: 'xbox' (coloured discs with letters) or 'ps'
// (dark discs with cross, circle, square, triangle). View/Menu and Share/Options are glyphs, not words.
const FACE = {
  xbox: [['#237a35', 'A'], ['#c23535', 'B'], ['#285fc0', 'X'], ['#8a6a00', 'Y']], // darkened so the white letter keeps 4.5:1
  ps: [['#7aa7ff', 'x'], ['#ff6b6b', 'o'], ['#f49ac2', 'q'], ['#4fd1a5', 't']],
};
const OMBRO = { xbox: ['LB', 'RB', 'LT', 'RT'], ps: ['L1', 'R1', 'L2', 'R2'] };
const NOME_PAD = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', '', '', 'direcional para cima', 'direcional para baixo', 'direcional para a esquerda', 'direcional para a direita'],
  ps: ['Cruz', 'Círculo', 'Quadrado', 'Triângulo', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', '', '', 'direcional para cima', 'direcional para baixo', 'direcional para a esquerda', 'direcional para a direita'],
};
export const nomePad = (b, estilo = 'xbox') => (b === 'LS' ? 'analógico esquerdo' : b === 'RS' ? 'analógico direito' : NOME_PAD[estilo][b]);
export function iconePad(b, estilo = 'xbox', alt = 28) {
  const T = 'font-size="13" font-weight="700" fill="#fff" text-anchor="middle" font-family="Segoe UI,system-ui,sans-serif"';
  const svg = (w, corpo) => `<svg width="${(w * alt) / 22}" height="${alt}" viewBox="0 0 ${w} 22" role="img" aria-label="${nomePad(b, estilo)}">${corpo}</svg>`;
  if (b === 'LS' || b === 'RS') return svg(22, `<circle cx="11" cy="11" r="10" fill="#2a2a2a" stroke="#ddd" stroke-width="1.5"/><text x="11" y="15.6" ${T}>${b[0]}</text>`);
  if (b <= 3) {
    const [cor, l] = FACE[estilo][b];
    if (estilo === 'xbox') return svg(22, `<circle cx="11" cy="11" r="10.5" fill="${cor}"/><text x="11" y="15.6" ${T}>${l}</text>`);
    const forma = {
      x: `<path d="M7 7l8 8M15 7l-8 8" stroke="${cor}" stroke-width="2.4" stroke-linecap="round"/>`,
      o: `<circle cx="11" cy="11" r="4.6" fill="none" stroke="${cor}" stroke-width="2.2"/>`,
      q: `<rect x="6.8" y="6.8" width="8.4" height="8.4" fill="none" stroke="${cor}" stroke-width="2.2"/>`,
      t: `<path d="M11 5.8l5.2 8.8H5.8z" fill="none" stroke="${cor}" stroke-width="2.2" stroke-linejoin="round"/>`,
    }[l];
    return svg(22, `<circle cx="11" cy="11" r="10" fill="#222" stroke="#999"/>${forma}`);
  }
  if (b <= 7) return svg(30, `<rect x="1" y="${b < 6 ? 3 : 1}" width="28" height="${b < 6 ? 16 : 20}" rx="${b < 6 ? 7 : 4}" fill="#3a3a3a" stroke="#ccc"/><text x="15" y="15.6" ${T}>${OMBRO[estilo][b - 4]}</text>`);
  if (b <= 9) return svg(30, `<rect x="1" y="4" width="28" height="14" rx="7" fill="#2a2a2a" stroke="#bbb"/>${b === 8 ? '<path d="M10 8h7v5h-7zM13 10.5h7v4h-7z" fill="#2a2a2a" stroke="#fff" stroke-width="1.3"/>' : '<path d="M10 8h10M10 11h10M10 14h10" stroke="#fff" stroke-width="1.5"/>'}`);
  // d-pad: a plus with the arm of this button lit (12 up, 13 down, 14 left, 15 right)
  const braco = { 12: 'x="8" y="1" width="6" height="8"', 13: 'x="8" y="13" width="6" height="8"', 14: 'x="1" y="8" width="8" height="6"', 15: 'x="13" y="8" width="8" height="6"' }[b];
  return svg(22, `<path d="M8 1h6v7h7v6h-7v7H8v-7H1V8h7z" fill="#555" stroke="#bbb"/><rect ${braco} fill="#f0f0f0"/>`);
}
const pad = (b, estilo) => h('span', { class: 'vs-pad', 'data-b': b }, svgDe(iconePad(b, estilo)));
const repintaPads = (raiz, estilo) => raiz.querySelectorAll('.vs-pad').forEach((e) => e.replaceChildren(svgDe(iconePad(isNaN(e.dataset.b) ? e.dataset.b : +e.dataset.b, estilo))));
const tecla = (t) => h('kbd', { class: 'vs-tecla' }, t);

// ---- action bar ---------------------------------------------------------------------------------------------
/** acoes: [{ id, rotulo, icone, tecla?: 'k', teclaRotulo?: 'K', pad?: 2, segurar?: true, desabilitada? }].
 *  onAcao(id, fase): fase is 'aperta', and also 'solta' for actions with segurar (run while held). */
export function criarBarraAcoes({ acoes, onAcao, estilo = 'xbox', rotulo = 'Ações' }) {
  const botoes = new Map();
  const disparar = (a, fase) => {
    if (botoes.get(a.id).disabled) return;
    if (a.segurar) botoes.get(a.id).setAttribute('aria-pressed', fase === 'aperta');
    onAcao?.(a.id, fase);
  };
  const el = h('div', { class: 'vs-barra-acoes', role: 'group', 'aria-label': rotulo });
  for (const a of acoes) {
    // the key and pad hints are pictures of what aria-keyshortcuts already says, so screen readers skip them
    const b = h('button', { class: 'vs-acao', type: 'button', id: a.idBotao, disabled: a.desabilitada, 'aria-pressed': a.segurar ? 'false' : null, 'aria-keyshortcuts': a.teclaRotulo },
      svgDe(icone(a.icone)), h('span', { class: 'vs-acao-rotulo' }, a.rotulo, a.segurar ? h('span', { class: 'vs-so-leitor' }, ' (segurar)') : null),
      h('span', { class: 'vs-acao-atalho', 'aria-hidden': 'true' }, a.teclaRotulo ? tecla(a.teclaRotulo) : null, a.pad != null ? pad(a.pad, estilo) : null, a.segurar ? h('span', { class: 'vs-acao-segurar' }, 'segurar') : null));
    botoes.set(a.id, b);
    if (a.segurar) {
      // held actions answer press and release: finger or mouse (captured, so a release outside still counts) and Enter / Space
      b.addEventListener('pointerdown', (e) => { b.setPointerCapture(e.pointerId); disparar(a, 'aperta'); });
      for (const ev of ['pointerup', 'pointercancel']) b.addEventListener(ev, () => { disparar(a, 'solta'); b.blur(); }); // blur: Space must jump, not run
      b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) disparar(a, 'aperta'); });
      b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') disparar(a, 'solta'); });
      b.addEventListener('blur', () => b.getAttribute('aria-pressed') === 'true' && disparar(a, 'solta'));
      b.addEventListener('contextmenu', (e) => e.preventDefault()); // a long press on a phone would open the menu
    } else {
      b.addEventListener('click', (e) => {
        disparar(a, 'aperta');
        if (e.detail) b.blur(); // clicked with mouse or finger: drop focus, or Space (jump) would press this button again
      });
    }
    el.append(b);
  }
  return {
    el, acoes,
    disparar: (id, fase = 'aperta') => disparar(acoes.find((a) => a.id === id), fase),
    /** Lights the button while its key or pad button is down (call from the page's input loop). */
    destacar: (id, ligado) => botoes.get(id)?.classList.toggle('vs-on', !!ligado && !botoes.get(id).disabled),
    desabilitar: (id, sim) => (botoes.get(id).disabled = sim),
    /** For an action that stays on (the torch is lit): gold frame plus aria-pressed. */
    marcar: (id, ligado) => botoes.get(id).setAttribute('aria-pressed', !!ligado),
    trocarEstilo: (novo) => repintaPads(el, novo),
    /** On a phone the pad icons show only while a gamepad is connected: tell the bar when one comes or goes. */
    temPad: (sim) => el.toggleAttribute('data-pad', !!sim),
  };
}

// ---- character cards ----------------------------------------------------------------------------------------
/** bonecos: [{ nome, inimigo?, retrato?: url }]. onSelecionar(indice, boneco) runs on click and on selecionar(). */
export function criarCartasBoneco({ bonecos, onSelecionar, ativo = 0, rotulo = 'Boneco' }) {
  const el = h('div', { class: 'vs-cartas', role: 'group', 'aria-label': rotulo });
  const marca = (i) => {
    ativo = i;
    [...el.children].forEach((c, j) => c.setAttribute('aria-pressed', j === i));
    el.children[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const selecionar = (i, { silencioso } = {}) => { marca(i); if (!silencioso) onSelecionar?.(i, bonecos[i]); };
  bonecos.forEach((b, i) => el.append(h('button', { class: 'vs-carta-boneco', type: 'button', 'data-inimigo': b.inimigo, onclick: (e) => { selecionar(i); if (e.detail) e.currentTarget.blur(); } },
    h('span', { class: 'vs-retrato' }, b.retrato ? h('img', { src: b.retrato, alt: '' }) : svgDe(icone(b.inimigo ? 'inimigo' : 'aliado'))),
    h('span', { class: 'vs-carta-nome' }, b.nome, b.inimigo ? h('span', { class: 'vs-so-leitor' }, ', inimigo') : null),
    h('span', { class: 'vs-carta-marca' }, svgDe(icone('marca', 16))))));
  marca(ativo);
  return { el, selecionar, proximo: (d = 1) => selecionar((ativo + d + bonecos.length) % bonecos.length), get ativo() { return ativo; } };
}

// ---- side drawer --------------------------------------------------------------------------------------------
/** secoes: [{ id, titulo, icone, conteudo: [nodes], aberta? }]. Returns { el, botao, abrir, fechar, alternar, secao(id) }.
 *  Not modal on purpose: the scene stays usable while a switch is flipped. Closed = display none and inert.
 *  Append el inside .vs-hud: from 900 px up the HUD makes room for it; under that the drawer covers the HUD, and the
 *  other children of .vs-hud turn inert while it is open, so focus never goes behind it. */
export function criarGaveta({ secoes, titulo = 'Ferramentas', aberta = false }) {
  const id = 'vs-gaveta-' + Math.random().toString(36).slice(2, 7), corpos = {};
  const fechar_ = h('button', { class: 'vs-botao vs-icone', type: 'button', 'aria-label': 'Fechar ' + titulo.toLowerCase(), onclick: (e) => fechar(e.detail === 0) }, svgDe(icone('fechar')));
  const corpo = h('div', { class: 'vs-gaveta-corpo' }, ...secoes.map((s) => {
    corpos[s.id] = h('div', { class: 'vs-secao-corpo' }, ...(s.conteudo || []));
    return h('details', { class: 'vs-secao', id: s.id && 'vs-secao-' + s.id, open: s.aberta }, h('summary', {}, h('span', { class: 'vs-seta' }, svgDe(icone('seta', 20))), svgDe(icone(s.icone)), s.titulo), corpos[s.id]);
  }));
  const el = h('aside', { class: 'vs-gaveta', id, 'aria-label': titulo, inert: true }, h('div', { class: 'vs-gaveta-topo' }, h('h2', { class: 'vs-titulo' }, titulo), fechar_), corpo);
  const botao = h('button', { class: 'vs-botao', type: 'button', 'aria-expanded': 'false', 'aria-controls': id, onclick: (e) => { alternar(e.detail === 0); if (e.detail) botao.blur(); } }, svgDe(icone('ferramentas')), h('span', {}, titulo));
  const estreita = matchMedia('(max-width: 899px)');
  const estaAberta = () => 'aberta' in el.dataset;
  const cobrir = () => [...(el.parentElement?.children || [])].forEach((c) => c !== el && !c.matches('.vs-aviso') && (c.inert = estaAberta() && estreita.matches));
  estreita.addEventListener('change', cobrir);
  // porTeclado: focus moves into the drawer (and back on close) only for who opened it with the keyboard. After a mouse
  // click or a shortcut nothing keeps focus, so Space goes on jumping instead of pressing the last control touched.
  function abrir(porTeclado = false) { el.dataset.aberta = ''; el.inert = false; botao.setAttribute('aria-expanded', 'true'); cobrir(); if (porTeclado) fechar_.focus({ preventScroll: true }); }
  function fechar(porTeclado = true) {
    const dentro = porTeclado && el.contains(document.activeElement);
    delete el.dataset.aberta; el.inert = true; botao.setAttribute('aria-expanded', 'false'); cobrir();
    if (dentro) botao.focus({ preventScroll: true }); // focus goes back to where the drawer was opened from
  }
  const alternar = (porTeclado = false) => (estaAberta() ? fechar(porTeclado) : abrir(porTeclado));
  el.addEventListener('pointerup', () => setTimeout(() => { const a = document.activeElement; if (el.contains(a) && a.matches('button, summary, input[type=checkbox]')) a.blur(); }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && estaAberta()) fechar(); });
  if (aberta) { el.dataset.aberta = ''; el.inert = false; botao.setAttribute('aria-expanded', 'true'); queueMicrotask(cobrir); } // open from the start without stealing focus; cobrir waits for the caller to append el
  return { el, botao, abrir, fechar, alternar, secao: (s) => corpos[s], get aberta() { return estaAberta(); } };
}

// ---- controls of the drawer: each takes the id the page already uses, so its code keeps finding the element ---------
/** A real checkbox with role=switch: $('id').checked and $('id').click() work as on any checkbox. */
export function criarToggle({ id, rotulo, dica, ligado = false, tecla: t, desabilitado, onMudar }) {
  const input = h('input', { type: 'checkbox', role: 'switch', id, checked: ligado, disabled: desabilitado, 'aria-keyshortcuts': t, onchange: () => onMudar?.(input.checked) });
  return h('label', { class: 'vs-toggle' }, h('span', {}, rotulo, dica ? h('small', { class: 'vs-dica' }, dica) : null), t ? h('span', { 'aria-hidden': 'true' }, tecla(t)) : null, input);
}
export function criarSlider({ id, rotulo, min = 0, max = 1, passo = 0.01, valor = min, formato = String, desabilitado, onMudar }) {
  const saida = h('output', {}), input = h('input', { type: 'range', id, min, max, step: passo, value: valor, disabled: desabilitado });
  const pinta = () => { saida.textContent = formato(+input.value); input.setAttribute('aria-valuetext', saida.textContent); input.style.setProperty('--vs-p', ((input.value - min) / (max - min)) * 100); };
  input.addEventListener('input', () => { pinta(); onMudar?.(+input.value); });
  pinta();
  return h('label', { class: 'vs-slider' }, h('span', {}, rotulo), saida, input);
}
/** opcoes: [[valor, texto], ...]. */
export function criarSelecao({ id, rotulo, opcoes, valor, desabilitado, onMudar }) {
  const sel = h('select', { id, disabled: desabilitado, onchange: () => onMudar?.(sel.value) }, ...opcoes.map(([v, t]) => h('option', { value: v }, t)));
  if (valor != null) sel.value = valor;
  return h('label', { class: 'vs-selecao' }, h('span', {}, rotulo), sel);
}
export function criarBotao({ id, rotulo, icone: ic, variante = '', desabilitado, onClique }) {
  return h('button', { class: 'vs-botao ' + variante, type: 'button', id, disabled: desabilitado, onclick: onClique }, ic ? svgDe(icone(ic)) : null, h('span', {}, rotulo));
}
/** itens: [{ id, rotulo }]. atualizar({ fps: '60' }) or { fps: ['24', 'baixo'] }: the level ('bom' | 'baixo') is
 *  written beside the number, so colour is never the only sign. */
export function criarMedidor({ itens }) {
  const dd = {};
  const el = h('dl', { class: 'vs-medidor' }, ...itens.flatMap((i) => [h('dt', {}, i.rotulo), (dd[i.id] = h('dd', {}, '…'))]));
  return { el, atualizar(v) { for (const [k, x] of Object.entries(v)) { const [txt, nivel] = [].concat(x); dd[k].textContent = nivel ? `${txt} (${nivel})` : txt; dd[k].dataset.nivel = nivel || ''; } } };
}
/** controles: [{ acao, teclado: 'W A S D', pad: [4, 5, 'ou', 'LS'] }]. destacar(i, ligado) lights row i. */
export function criarListaControles({ controles, estilo = 'xbox' }) {
  const corpo = h('tbody', {}, ...controles.map((c) => h('tr', {}, h('td', {}, c.acao), h('td', {}, c.teclado),
    h('td', {}, ...(c.pad || []).flatMap((x) => [typeof x === 'string' && x !== 'LS' && x !== 'RS' ? x : pad(x, estilo), ' '])))));
  const el = h('table', { class: 'vs-lista-controles' }, h('thead', {}, h('tr', {}, ...['Ação', 'Teclado', 'Controle'].map((t) => h('th', { scope: 'col' }, t)))), corpo);
  return { el, destacar: (i, ligado) => corpo.rows[i]?.classList.toggle('vs-on', !!ligado), trocarEstilo: (novo) => repintaPads(el, novo) };
}
/** A polite live region; append el straight into .vs-hud (it floats above the drawer). mostrar('Relatório copiado', { tipo: 'ok' | 'erro' | 'info', ms }) shows one line and removes it. */
export function criarAviso() {
  const el = h('div', { class: 'vs-aviso', role: 'status', 'aria-live': 'polite' });
  return { el, mostrar(texto, { tipo = 'info', ms = 5000 } = {}) {
    const linha = h('div', { 'data-tipo': tipo }, svgDe(icone(tipo)), h('span', {}, texto));
    el.append(linha); while (el.children.length > 3) el.firstChild.remove();
    setTimeout(() => linha.remove(), ms);
  } };
}

// ---- shortcuts: opt-in. A page that already listens to these keys must drop its own listeners first (see LEIAME) ---
/** barra: the object from criarBarraAcoes (uses each action's tecla). extras: { q: () => ..., '1': () => ... }.
 *  Returns a function that turns the shortcuts off. */
export function ligarAtalhos({ barra, extras = {} }) {
  const porTecla = new Map((barra?.acoes || []).filter((a) => a.tecla).map((a) => [a.tecla, a]));
  // typing in a field never fires a shortcut; on a switch, slider, button or section title only the keys that
  // operate that control (Space, Enter, arrows) are left alone, so K still attacks right after flipping a switch
  const ocupado = (e, k) => e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('select, textarea, [contenteditable], input:not([type=checkbox], [type=range])') ||
    (e.target.closest?.('input, button, summary') && (k === ' ' || k === 'enter' || k.startsWith('arrow')));
  const baixo = (e) => {
    const k = e.key.toLowerCase(), a = porTecla.get(k);
    if (e.repeat || ocupado(e, k)) return;
    if (a) { if (k === ' ') e.preventDefault(); barra.destacar(a.id, true); barra.disparar(a.id, 'aperta'); }
    extras[k]?.(e);
  };
  const solta = (a) => { barra.destacar(a.id, false); if (a.segurar) barra.disparar(a.id, 'solta'); };
  const cima = (e) => { const a = porTecla.get(e.key.toLowerCase()); if (a) solta(a); };
  const tudo = () => porTecla.forEach(solta); // the window lost focus (Alt+Tab): no keyup will come, so nothing stays held
  addEventListener('keydown', baixo); addEventListener('keyup', cima); addEventListener('blur', tudo);
  return () => { removeEventListener('keydown', baixo); removeEventListener('keyup', cima); removeEventListener('blur', tudo); };
}
