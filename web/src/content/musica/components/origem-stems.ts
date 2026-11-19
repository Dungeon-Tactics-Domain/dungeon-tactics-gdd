// The stems are heavy. A browser on the same PC as the lab server can take them from 127.0.0.1 instead of the tunnel.
// Opt-in per browser, because Chrome asks the visitor for local-network access on the first try: open any page once with ?local=1
// (?local=0 turns it off). Visitors who never did that are never asked and keep using the tunnel.
const LOCAL = 'http://127.0.0.1:5207';
const CHAVE = 'lab-stems-local';
const TOKEN = 'lab-local-9f3c1a7e'; // content of stems/local.txt, so a stranger's server on that port is not taken for ours

const ligado = () => {
  try {
    const q = new URLSearchParams(window.location.search).get('local');
    if (q === '1') window.localStorage.setItem(CHAVE, '1');
    if (q === '0') window.localStorage.removeItem(CHAVE);
    return window.localStorage.getItem(CHAVE) === '1';
  } catch {
    return false;
  }
};

// '' means same origin (the tunnel, or already on localhost); otherwise the local origin to prefix on /content/musica/... paths
export const origemStems: Promise<string> = (async () => {
  const { hostname } = window.location;
  if (hostname === '127.0.0.1' || hostname === 'localhost' || !ligado()) return '';
  try {
    const r = await fetch(`${LOCAL}/content/musica/stems/local.txt`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
      targetAddressSpace: 'loopback', // Chrome's Local Network Access hint; other browsers ignore it
    } as RequestInit);
    return r.ok && (await r.text()).trim() === TOKEN ? LOCAL : '';
  } catch {
    return '';
  }
})();

export const comOrigem = async (caminho: string) => (await origemStems) + caminho;
