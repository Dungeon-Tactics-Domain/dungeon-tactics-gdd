// Sweeps every lab page at six viewports and writes a report of layout breaks (no AI, no screenshots except the worst cases).
// Needs playwright-core and a local Chrome (here: the game repo's node_modules).
// Usage (from the repo root): node scripts/varredura.mjs [base=http://127.0.0.1:5207] [out=_verificacao/varredura]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///D:/Projetos/dungeon-tactics/node_modules/playwright-core/index.mjs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5207';
const OUT = process.argv[3] ?? '_verificacao/varredura';
const VIEWPORTS = [
  [3440, 1440],
  [2560, 1080],
  [1920, 1080],
  [1280, 720],
  [768, 1024],
  [390, 844],
];
const LABS = ['design', 'mecanicas', 'modelos', 'musica', 'narrativa'];
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--mute-audio'],
});
const ctx = await browser.newContext();
const page = await ctx.newPage();

// the routes come from the links the app itself renders: the shell lists every page of a lab in its sidebar
async function rotas() {
  const set = new Set(['/', '/fabrica']);
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const lab of LABS) {
    await page.goto(`${BASE}/${lab}`, { waitUntil: 'networkidle' });
    // expand every group so nested pages render their links
    for (const b of await page.$$('nav button[aria-expanded="false"]')) await b.click().catch(() => {});
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of hrefs) if (h && h.startsWith(`/${lab}`)) set.add(h.split('#')[0]);
  }
  return [...set];
}

// what to measure on a loaded page
function medir() {
  const vw = document.documentElement.clientWidth;
  const largos = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 2 && getComputedStyle(el).position !== 'fixed') {
      let p = el.parentElement;
      let rola = false;
      while (p) {
        const o = getComputedStyle(p).overflowX;
        if (o === 'auto' || o === 'scroll' || o === 'hidden') {
          rola = true;
          break;
        }
        p = p.parentElement;
      }
      if (!rola) largos.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} (${Math.round(r.right)}px)`);
    }
  }
  const pequenos =
    vw <= 640
      ? [...document.querySelectorAll('a, button, input, select, summary')]
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && (r.height < 40 || r.width < 40);
          })
          .map((e) => `${e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}"`)
      : [];
  const semImagem = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src'));
  const linhaLonga = [...document.querySelectorAll('p, li, td')].filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 1000 && (e.textContent || '').length > 200;
  }).length;
  return {
    overflow: document.documentElement.scrollWidth - vw,
    largos: [...new Set(largos)].slice(0, 4),
    pequenos: [...new Set(pequenos)].slice(0, 4),
    semImagem: semImagem.slice(0, 3),
    linhaLonga,
  };
}

const lista = await rotas();
console.log(`${lista.length} rotas`);
const achados = [];
for (const [w, h] of VIEWPORTS) {
  await page.setViewportSize({ width: w, height: h });
  for (const rota of lista) {
    const erros = [];
    const onErr = (m) => m.type() === 'error' && !/\/api\//.test(m.text()) && erros.push(m.text().slice(0, 100));
    page.on('console', onErr);
    try {
      await page.goto(BASE + rota, { waitUntil: 'networkidle', timeout: 20000 });
      const m = await page.evaluate(medir);
      if (m.overflow > 2 || m.largos.length || m.pequenos.length || m.semImagem.length || m.linhaLonga || erros.length)
        achados.push({ rota, w, h, ...m, erros });
    } catch (e) {
      achados.push({ rota, w, h, erroNav: String(e).slice(0, 100) });
    }
    page.off('console', onErr);
  }
  console.log(`${w}x${h} feito`);
}

// screenshots of the 10 worst horizontal overflows
const piores = achados.filter((a) => a.overflow > 2).sort((a, b) => b.overflow - a.overflow).slice(0, 10);
for (const a of piores) {
  await page.setViewportSize({ width: a.w, height: a.h });
  await page.goto(BASE + a.rota, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/${a.w}x${a.h}${a.rota.replace(/\//g, '_')}.png` });
}

const linhas = [`# Varredura dos labs (${new Date().toISOString()}), base ${BASE}`, `${lista.length} rotas x ${VIEWPORTS.length} tamanhos; ${achados.length} achados.`, ''];
for (const a of achados.sort((x, y) => y.w - x.w || x.rota.localeCompare(y.rota))) {
  const p = [];
  if (a.erroNav) p.push(`navegação: ${a.erroNav}`);
  if (a.overflow > 2) p.push(`rolagem horizontal +${a.overflow}px`);
  if (a.largos?.length) p.push(`fora da tela: ${a.largos.join('; ')}`);
  if (a.pequenos?.length) p.push(`alvo < 40px: ${a.pequenos.join('; ')}`);
  if (a.semImagem?.length) p.push(`imagem quebrada: ${a.semImagem.join('; ')}`);
  if (a.linhaLonga) p.push(`${a.linhaLonga} blocos de texto com linha > 1000px`);
  if (a.erros?.length) p.push(`console: ${a.erros.join(' | ')}`);
  linhas.push(`- ${a.w}x${a.h} ${a.rota}: ${p.join(' | ')}`);
}
writeFileSync(`${OUT}/relatorio.md`, linhas.join('\n'));
await browser.close();
console.log(`relatório em ${OUT}/relatorio.md`);
