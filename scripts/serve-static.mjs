// Read-only static server for the public tunnel: serves web/dist with an SPA fallback and no API,
// so nothing can be written and no session data is exposed.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'web/dist');
const port = Number(process.argv[3] ?? 5207);
// vite's watch rebuild ignores web/public, so a file copied there is served from the source folder until the next build
const publicRoot = resolve(root, '..', 'public');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
  '.glb': 'model/gltf-binary', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.writeHead(405).end();
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // No API on the public site: /api paths must not fall back to the app shell.
  if (url.startsWith('/api')) return res.writeHead(404).end();
  const isFile = (f) => existsSync(f) && !statSync(f).isDirectory();
  let file = join(root, normalize(url));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  const inPublic = join(publicRoot, normalize(url));
  if (!isFile(file) && inPublic.startsWith(publicRoot) && isFile(inPublic)) file = inPublic;
  // A missing file with an extension must be a 404, never the app shell: a half-built dist would otherwise answer a JS
  // request with HTML under an immutable cache header and leave browsers with a blank page after the rebuild.
  if (!isFile(file) && extname(url)) return res.writeHead(404, { 'cache-control': 'no-store' }).end();
  if (!isFile(file)) file = join(root, 'index.html');
  // dist is rewritten by `build:watch`: a file can vanish between the check and the read, so a stream error must not kill the server.
  const stream = createReadStream(file);
  stream.on('error', () => (res.headersSent ? res.destroy() : res.writeHead(503).end()));
  stream.on('open', () => {
    // Hashed bundles never change; everything else (index.html, lab content) must be revalidated so a rebuild shows without Ctrl+F5.
    // Media under /content/ is replaced in place by the labs: 5 min fresh, then served stale while revalidating in the background,
    // so a revisit costs no tunnel round trip (~0.25 s each) but a replaced image shows within minutes.
    const media = url.startsWith('/content/') && /\.(png|jpe?g|webp|gif|ogg|mp3|wav|mp4|glb)$/.test(url);
    const cache = url.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : media
        ? 'public, max-age=300, stale-while-revalidate=86400'
        : 'no-cache';
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream', 'cache-control': cache });
    if (req.method === 'HEAD') {
      stream.destroy();
      return res.end();
    }
    stream.pipe(res);
  });
}).listen(port, '127.0.0.1', () => console.log(`static ${root} on 127.0.0.1:${port}`));
