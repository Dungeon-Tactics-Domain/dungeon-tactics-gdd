// Read-only static server for the public tunnel: serves web/dist with an SPA fallback and no API,
// so nothing can be written and no session data is exposed.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve(process.argv[2] ?? 'web/dist');
const port = Number(process.argv[3] ?? 5207);
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
  let file = join(root, normalize(url));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`static ${root} on 127.0.0.1:${port}`));
