// Local dev server: `npm start` → http://localhost:3000
// Serves /public and runs the same /api handlers Vercel runs in production. Zero dependencies.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, describeKey } from './lib/env.js';

const root = path.dirname(fileURLToPath(import.meta.url));

// Load .env (KEY=value lines) without a dependency.
const envFile = loadEnv(root);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.png': 'image/png',
};
const APIS = new Set(['explain', 'ask', 'tts', 'stt', 'reason', 'coach', 'report', 'debrief', 'health']);

function shim(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); return res; };
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const api = url.pathname.match(/^\/api\/([a-z]+)$/);
  if (api && APIS.has(api[1])) {
    let raw = '';
    for await (const chunk of req) { raw += chunk; if (raw.length > 6e6) return res.writeHead(413).end(); }
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    req.query = Object.fromEntries(url.searchParams);
    try {
      const { default: handler } = await import(`./api/${api[1]}.js`);
      return await handler(req, shim(res));
    } catch (e) {
      console.error(`[api/${api[1]}]`, e);
      if (!res.headersSent) return shim(res).status(500).json({ error: 'server error' });
      return;
    }
  }
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, 'public', path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(path.join(root, 'public'))) return res.writeHead(403).end();
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`NiveshSetu चल रहा है → http://localhost:${port}`);
  console.log(envFile ? `env फ़ाइल: ${envFile}` : '⚠ .env फ़ाइल नहीं मिली (project की मुख्य folder में ".env" नाम से बनाएँ)');
  console.log(process.env.SARVAM_API_KEY ? `✓ Sarvam key मिली (AI + आवाज़): ${describeKey()}` : '⚠ SARVAM_API_KEY नहीं मिली — AI ऑफ़लाइन मोड में, आवाज़ फ़ोन की अपनी');
  console.log(`  जाँच: http://localhost:${port}/api/health?ping=1`);
});
