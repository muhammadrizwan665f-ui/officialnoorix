// Local E2E server: real Worker app + in-memory D1/R2 shims + static build. Test-only, not deployed.
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createApp } from '../../worker/index';
import { makeEnv } from '../helpers/app';

const WEB = join(import.meta.dirname, '../../.scratch/web');
const TYPES: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.html': 'text/html' };
const env = makeEnv({ SITE_URL: 'http://localhost:8801' });
env.ASSETS = { async fetch(req: Request) {
  const p = new URL(req.url).pathname;
  if (extname(p)) { const f = join(WEB, p); return existsSync(f) ? new Response(readFileSync(f), { headers: { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream' } }) : new Response('nf', { status: 404 }); }
  return new Response(readFileSync(join(WEB, 'index.html')), { headers: { 'content-type': 'text/html' } });
} };
const app = createApp();
createServer(async (req, res) => {
  const chunks: Buffer[] = []; for await (const c of req) chunks.push(c as Buffer);
  const r = await app.fetch(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers as any, body: ['GET', 'HEAD'].includes(req.method!) ? undefined : Buffer.concat(chunks) }), env);
  const h: Record<string, string | string[]> = {}; r.headers.forEach((v, k) => { if (k !== 'set-cookie') h[k] = v; });
  const sc = (r.headers as any).getSetCookie?.(); if (sc?.length) h['set-cookie'] = sc;
  res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(8801, () => console.log('E2E server on 8801'));
