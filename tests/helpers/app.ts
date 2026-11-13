import { createApp } from '../../worker/index';
import { TestD1, TestR2 } from './d1shim';

export function makeEnv(extra: Record<string, unknown> = {}) {
  const db = new TestD1(); db.migrate();
  const ASSETS = { async fetch() { return new Response('<!doctype html><html><head><!--SEO_HEAD--></head><body><div id="root"></div></body></html>', { headers: { 'content-type': 'text/html' } }); } };
  return { DB: db, FILES: new TestR2(), ASSETS, SITE_URL: 'https://example.test', SETUP_TOKEN: 'setup-secret-123', ...extra } as any;
}

export class Client {
  cookie = ''; csrf = '';
  constructor(public app: ReturnType<typeof createApp>, public env: any, public ip = '10.0.0.' + Math.floor(Math.random() * 200 + 1)) {}
  async req(method: string, path: string, data?: unknown, extra: Record<string, string> = {}) {
    const h: Record<string, string> = { origin: 'https://example.test', 'cf-connecting-ip': this.ip, ...extra };
    if (this.cookie) h.cookie = this.cookie;
    if (this.csrf) h['x-csrf-token'] = this.csrf;
    let body: any;
    if (data instanceof FormData) body = data; else if (data !== undefined) { body = JSON.stringify(data); h['content-type'] = 'application/json'; }
    const res = await this.app.fetch(new Request('https://example.test' + path, { method, headers: h, body }), this.env);
    const sc = res.headers.get('set-cookie');
    if (sc) { const m = /nx_admin=([^;]*)/.exec(sc); if (m) this.cookie = m[1] ? `nx_admin=${m[1]}` : ''; }
    let json: any = null; let text = '';
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('json')) json = await res.json(); else text = await res.text();
    if (json?.csrf) this.csrf = json.csrf;
    return { status: res.status, json, text, headers: res.headers };
  }
  get = (p: string) => this.req('GET', p);
  post = (p: string, d?: unknown) => this.req('POST', p, d ?? {});
  put = (p: string, d?: unknown) => this.req('PUT', p, d ?? {});
  patch = (p: string, d?: unknown) => this.req('PATCH', p, d ?? {});
  del = (p: string) => this.req('DELETE', p);
}

export async function loggedInAdmin(app: any, env: any) {
  const c = new Client(app, env);
  const r = await c.post('/api/admin/setup', { token: 'setup-secret-123', name: 'Owner', email: 'owner@example.test', password: 'StrongPass123' });
  if (r.status !== 201) throw new Error('setup failed ' + JSON.stringify(r.json));
  return c;
}
