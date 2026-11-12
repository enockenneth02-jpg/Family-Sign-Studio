// Tiny local static server for testing (service workers need http://localhost, not file://).
// Usage: node dev-server.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const port = Number(process.argv[2]) || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = normalize(join(pub, p));
  if (!f.startsWith(pub)) { res.writeHead(403).end(); return; }
  try {
    const data = await readFile(f);
    res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, () => console.log(`http://localhost:${port}`));
