import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../worker/index';
import { makeEnv, Client, loggedInAdmin } from './helpers/app';

const app = createApp();
const goodContact = (o: Record<string, unknown> = {}) => ({ name: 'Ali Khan', email: 'ali@example.com', business: 'Khan Traders', phone: '+92 300 1234567', country: 'Pakistan', service: 'Ecommerce Website', budget: '$500–$1,000', message: 'I need an online store for my shop.', elapsedMs: 9000, website: '', ...o });

test('public bootstrap serves seeded content and hides unpublished/unapproved items', async () => {
  const env = makeEnv(); const c = new Client(app, env);
  const r = await c.get('/api/public/bootstrap');
  assert.equal(r.status, 200);
  assert.equal(r.json.services.length, 6);
  assert.equal(r.json.packages.length, 12);
  assert.ok(r.json.packages.every((p: any) => Array.isArray(p.features) && p.features.length > 0));
  assert.equal(r.json.portfolio.length, 2);
  assert.equal(r.json.faqs.length, 10);
  assert.deepEqual(r.json.testimonials, []); // none are invented
  assert.equal(r.json.hasBlog, false);
  assert.equal(r.json.pages.home.content.hero.headline, 'WE BUILD. WE MANAGE. WE AUTOMATE.');
});

test('admin setup: token required, only works once, password strength enforced', async () => {
  const env = makeEnv(); const c = new Client(app, env);
  assert.equal((await c.get('/api/admin/status')).json.needsSetup, true);
  assert.equal((await c.post('/api/admin/setup', { token: 'wrong', name: 'A B', email: 'a@b.co', password: 'StrongPass123' })).status, 403);
  assert.equal((await c.post('/api/admin/setup', { token: 'setup-secret-123', name: 'A B', email: 'a@b.co', password: 'short' })).status, 400);
  assert.equal((await c.post('/api/admin/setup', { token: 'setup-secret-123', name: 'A B', email: 'a@b.co', password: 'StrongPass123' })).status, 201);
  assert.equal((await new Client(app, env).post('/api/admin/setup', { token: 'setup-secret-123', name: 'X Y', email: 'x@y.co', password: 'StrongPass123' })).status, 403);
  assert.equal((await new Client(app, env).get('/api/admin/status')).json.needsSetup, false);
  // setup disabled when no SETUP_TOKEN secret is configured
  const env2 = makeEnv({ SETUP_TOKEN: undefined });
  assert.equal((await new Client(app, env2).post('/api/admin/setup', { token: 'x', name: 'A B', email: 'a@b.co', password: 'StrongPass123' })).status, 403);
});

test('admin routes reject anonymous users; login/logout work; bad login rejected; password stored hashed', async () => {
  const env = makeEnv(); await loggedInAdmin(app, env);
  const anon = new Client(app, env);
  for (const p of ['/api/admin/overview', '/api/admin/settings', '/api/admin/inquiries', '/api/admin/services', '/api/admin/inquiries-export.csv']) assert.equal((await anon.get(p)).status, 401, p);
  assert.equal((await anon.post('/api/admin/upload')).status, 401);
  assert.equal((await anon.post('/api/admin/login', { email: 'owner@example.test', password: 'wrong-password1' })).status, 401);
  assert.equal((await anon.post('/api/admin/login', { email: 'nobody@example.test', password: 'whatever12345' })).status, 401);
  const ok = await anon.post('/api/admin/login', { email: 'OWNER@example.test', password: 'StrongPass123' });
  assert.equal(ok.status, 200);
  assert.match(ok.headers.get('set-cookie')!, /HttpOnly/i); assert.match(ok.headers.get('set-cookie')!, /SameSite=Strict/i);
  assert.equal((await anon.get('/api/admin/overview')).status, 200);
  const stored = await env.DB.prepare('SELECT password_hash FROM admin_users').first();
  assert.match(stored.password_hash, /^pbkdf2\$/); assert.ok(!stored.password_hash.includes('StrongPass123'));
  await anon.post('/api/admin/logout');
  assert.equal((await anon.get('/api/admin/overview')).status, 401);
});

test('login is rate limited', async () => {
  const env = makeEnv(); await loggedInAdmin(app, env);
  const c = new Client(app, env, '9.9.9.9'); let last = 0;
  for (let i = 0; i < 10; i++) last = (await c.post('/api/admin/login', { email: 'owner@example.test', password: 'nope-nope-1' })).status;
  assert.equal(last, 429);
  assert.equal((await c.post('/api/admin/login', { email: 'owner@example.test', password: 'StrongPass123' })).status, 429);
});

test('CSRF: state-changing admin calls need the session token and same origin', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const saved = a.csrf; a.csrf = '';
  assert.equal((await a.put('/api/admin/settings', { phone: '123' })).status, 403);
  a.csrf = saved;
  assert.equal((await a.req('PUT', '/api/admin/settings', { phone: '12345678' }, { origin: 'https://evil.test' })).status, 403);
  assert.equal((await a.put('/api/admin/settings', { phone: '12345678' })).status, 200);
});

test('settings persist, are validated, and unknown keys are ignored', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const r = await a.put('/api/admin/settings', { email: 'hello@example.com', whatsapp: '+92 300-1234567', linkedin: 'https://linkedin.com/company/x', hack: 'x', site_name: 'Noorix' });
  assert.equal(r.status, 200); assert.equal(r.json.whatsapp, '923001234567'); assert.equal(r.json.hack, undefined);
  assert.equal((await a.put('/api/admin/settings', { email: 'not-an-email' })).status, 400);
  assert.equal((await a.put('/api/admin/settings', { facebook: 'javascript:alert(1)' })).status, 400);
  const pub = await new Client(app, env).get('/api/public/bootstrap');
  assert.equal(pub.json.settings.email, 'hello@example.com'); assert.equal(pub.json.settings.site_name, 'Noorix');
});

test('contact form: validation, honeypot, speed trap, dedupe, rate limit, saved + visible to admin', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env); const v = new Client(app, env, '5.5.5.5');
  assert.equal((await v.post('/api/public/contact', goodContact({ email: 'bad' }))).status, 400);
  assert.equal((await v.post('/api/public/contact', goodContact({ name: '' }))).status, 400);
  assert.equal((await v.post('/api/public/contact', goodContact({ message: 'short' }))).status, 400);
  assert.equal((await v.post('/api/public/contact', goodContact({ service: 'Hacking' }))).status, 400);
  assert.equal((await v.post('/api/public/contact', goodContact({ country: '' }))).status, 400);
  assert.equal((await v.post('/api/public/contact', goodContact({ elapsedMs: 100 }))).status, 400);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM inquiries').first()).n, 0);
  const bot = await v.post('/api/public/contact', goodContact({ website: 'http://spam.test' }));
  assert.equal(bot.status, 200); assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM inquiries').first()).n, 0, 'bot submission must not be stored');
  const r1 = await v.post('/api/public/contact', goodContact()); assert.equal(r1.status, 201);
  const r2 = await v.post('/api/public/contact', goodContact()); assert.equal(r2.status, 200); assert.equal(r2.json.duplicate, true); assert.equal(r2.json.id, r1.json.id);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM inquiries').first()).n, 1);
  const list = await a.get('/api/admin/inquiries');
  assert.equal(list.json.total, 1); assert.equal(list.json.items[0].status, 'New'); assert.equal(list.json.items[0].name, 'Ali Khan');
  // rate limit: 20 submissions per hour per IP
  let s = 0; for (let i = 0; i < 25; i++) s = (await v.post('/api/public/contact', goodContact({ message: 'Different message number ' + i + ' here' }))).status;
  assert.equal(s, 429);
});

test('contact form stores text safely (XSS payload kept inert) and SQL injection attempt is harmless', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const evil = "x'); DROP TABLE inquiries;-- <script>alert(1)</script>";
  assert.equal((await new Client(app, env, '6.6.6.6').post('/api/public/contact', goodContact({ message: evil + ' padding', name: evil.slice(0, 40) }))).status, 201);
  const l = await a.get('/api/admin/inquiries?q=' + encodeURIComponent("DROP TABLE"));
  assert.equal(l.json.total, 1); assert.ok(l.json.items[0].message.includes('<script>')); // stored verbatim; React escapes on render
});

test('turnstile is enforced only when TURNSTILE_SECRET is configured', async () => {
  const env = makeEnv({ TURNSTILE_SECRET: 's' });
  const r = await new Client(app, env).post('/api/public/contact', goodContact());
  assert.equal(r.status, 400); assert.equal(r.json.error.code, 'captcha');
});

test('inquiry manager: search, filters, status, notes, CSV (formula-safe), delete', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const mk = (i: number, o: any) => new Client(app, env, '7.7.7.' + i).post('/api/public/contact', goodContact({ message: 'Project description ' + i + ' lorem ipsum', ...o }));
  await mk(1, { name: 'Sara', email: 'sara@x.com', country: 'UAE', service: 'AI Chatbot' });
  await mk(2, { name: '=cmd|calc', email: 'b@x.com', country: 'Pakistan', service: 'Business Website' });
  await mk(3, { name: 'Omar', email: 'omar@x.com', country: 'UAE', service: 'AI Chatbot' });
  assert.equal((await a.get('/api/admin/inquiries?q=sara')).json.total, 1);
  assert.equal((await a.get('/api/admin/inquiries?country=UAE')).json.total, 2);
  assert.equal((await a.get('/api/admin/inquiries?service=Business%20Website')).json.total, 1);
  const first = (await a.get('/api/admin/inquiries')).json.items[0];
  assert.equal((await a.patch('/api/admin/inquiries/' + first.id, { status: 'Qualified' })).status, 200);
  assert.equal((await a.patch('/api/admin/inquiries/' + first.id, { status: 'Bogus' })).status, 400);
  assert.equal((await a.get('/api/admin/inquiries?status=Qualified')).json.total, 1);
  assert.equal((await a.post(`/api/admin/inquiries/${first.id}/notes`, { note: 'Called, wants a quote' })).status, 201);
  const d = await a.get('/api/admin/inquiries/' + first.id);
  assert.equal(d.json.notes[0].note, 'Called, wants a quote'); assert.equal(d.json.notes[0].admin_name, 'Owner');
  const csv = await a.get('/api/admin/inquiries-export.csv');
  assert.equal(csv.status, 200); assert.match(csv.headers.get('content-type')!, /text\/csv/);
  assert.ok(csv.text.includes('"\'=cmd|calc"'), 'formula cell must be neutralised'); assert.ok(csv.text.includes('Sara'));
  const ov = await a.get('/api/admin/overview');
  assert.deepEqual([ov.json.inquiries.total, ov.json.inquiries.new, ov.json.inquiries.inProgress], [3, 2, 1]);
  assert.equal((await a.del('/api/admin/inquiries/' + first.id)).status, 200);
  assert.equal((await a.get('/api/admin/inquiries')).json.total, 2);
  assert.equal((await a.get('/api/admin/inquiries/' + first.id)).status, 404);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM inquiry_notes').first()).n, 0, 'notes cascade-delete');
});

test('services CRUD: create, edit, unpublish hides from public, reorder, delete, duplicate slug rejected', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const c = await a.post('/api/admin/services', { slug: 'seo-audit', title: 'SEO Audit', summary: 'x', benefits: ['A', 'B'], published: true });
  assert.equal(c.status, 201); assert.deepEqual(c.json.benefits, ['A', 'B']);
  assert.equal((await a.post('/api/admin/services', { slug: 'seo-audit', title: 'Dup' })).status, 409);
  assert.equal((await a.post('/api/admin/services', { slug: 'Bad Slug!', title: 'Bad' })).status, 400);
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.services.length, 7);
  assert.equal((await a.put('/api/admin/services/' + c.json.id, { title: 'SEO Audit Pro', published: false })).json.title, 'SEO Audit Pro');
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.services.length, 6);
  const all = (await a.get('/api/admin/services')).json; const ids = all.map((s: any) => s.id).reverse();
  await a.post('/api/admin/services-reorder', { ids });
  assert.equal((await a.get('/api/admin/services')).json[0].id, ids[0]);
  assert.equal((await a.del('/api/admin/services/' + c.json.id)).status, 200);
  assert.equal((await a.get('/api/admin/services/' + c.json.id)).status, 404);
});

test('packages CRUD with features, USD/PKR prices, billing, featured, unpublish', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const c = await a.post('/api/admin/packages', { category: 'Website Development', name: 'Mini', usd_price: 99, pkr_price: 25000, billing: 'one-time', features: ['1 page', 'Contact form'], featured: true, cta_label: 'Buy' });
  assert.equal(c.status, 201); assert.deepEqual(c.json.features, ['1 page', 'Contact form']); assert.equal(c.json.pkr_price, 25000);
  const u = await a.put('/api/admin/packages/' + c.json.id, { usd_price: 120, features: ['3 pages'], billing: 'monthly', pkr_price: null });
  assert.equal(u.json.usd_price, 120); assert.deepEqual(u.json.features, ['3 pages']); assert.equal(u.json.billing, 'monthly'); assert.equal(u.json.pkr_price, null);
  assert.equal((await a.post('/api/admin/packages', { category: 'X', name: 'Y', billing: 'weekly' })).status, 400);
  assert.equal((await a.post('/api/admin/packages', { category: 'X', name: 'Y', usd_price: -5 })).status, 400);
  await a.put('/api/admin/packages/' + c.json.id, { published: false });
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.packages.length, 12);
  await a.del('/api/admin/packages/' + c.json.id);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) n FROM package_features').first()).n, 48, 'features removed with package');
});

test('portfolio CRUD with gallery images, kind label, category validation', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const c = await a.post('/api/admin/portfolio', { slug: 'demo-shop', title: 'Demo Shop', category: 'Ecommerce', kind: 'demo', technologies: ['React'], thumbnail: '/files/uploads/x.png', images: [{ url: '/files/uploads/a.png', alt: 'A' }, { url: 'https://example.com/b.png', alt: 'B' }] });
  assert.equal(c.status, 201); assert.equal(c.json.images.length, 2); assert.equal(c.json.kind, 'demo');
  assert.equal((await a.post('/api/admin/portfolio', { slug: 'x', title: 'X', category: 'Nope' })).status, 400);
  assert.equal((await a.post('/api/admin/portfolio', { slug: 'y', title: 'Y', category: 'Ecommerce', images: [{ url: 'javascript:alert(1)' }] })).status, 400);
  const u = await a.put('/api/admin/portfolio/' + c.json.id, { images: [{ url: '/files/uploads/z.png', alt: '' }], published: false });
  assert.equal(u.json.images.length, 1);
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.portfolio.length, 2);
  assert.equal((await a.del('/api/admin/portfolio/' + c.json.id)).status, 200);
  assert.equal((await env.DB.prepare("SELECT COUNT(*) n FROM portfolio_images").first()).n, 0);
});

test('FAQ CRUD and testimonials can only be published once client-approved', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const f = await a.post('/api/admin/faqs', { question: 'Q?', answer: 'A.' }); assert.equal(f.status, 201);
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.faqs.length, 11);
  await a.put('/api/admin/faqs/' + f.json.id, { published: false });
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.faqs.length, 10);
  const t = await a.post('/api/admin/testimonials', { name: 'Client', quote: 'Great work' }); assert.equal(t.status, 201);
  assert.equal((await a.put('/api/admin/testimonials/' + t.json.id, { published: true })).status, 400);
  assert.equal((await a.put('/api/admin/testimonials/' + t.json.id, { client_approved: true, published: true })).status, 200);
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.testimonials.length, 1);
  assert.equal((await a.put('/api/admin/testimonials/' + t.json.id, { client_approved: false })).status, 200);
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.testimonials.length, 0, 'withdrawing approval unpublishes');
  assert.equal((await a.post('/api/admin/testimonials', { name: 'Z', quote: 'q', published: true })).status, 400, 'create unapproved+published must error, not silently save');
  assert.equal((await a.put('/api/admin/testimonials/' + t.json.id, { published: true })).status, 400);
});

test('blog: draft hidden, publish shows it publicly, unpublish hides again', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env); const v = new Client(app, env);
  const p = await a.post('/api/admin/blog', { slug: 'hello-world', title: 'Hello World', content: 'Body text', author: 'Team' });
  assert.equal(p.status, 201); assert.equal((await v.get('/api/public/blog/hello-world')).status, 404);
  await a.put('/api/admin/blog/' + p.json.id, { published: true });
  assert.equal((await v.get('/api/public/blog/hello-world')).json.title, 'Hello World');
  assert.equal((await v.get('/api/public/blog')).json.length, 1); assert.equal((await v.get('/api/public/bootstrap')).json.hasBlog, true);
  await a.put('/api/admin/blog/' + p.json.id, { published: false });
  assert.equal((await v.get('/api/public/blog/hello-world')).status, 404);
});

test('page content editor persists and SEO fields apply to server-rendered head', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const home = (await a.get('/api/admin/pages')).json.find((p: any) => p.slug === 'home');
  home.content.hero.headline = 'NEW HEADLINE';
  assert.equal((await a.put('/api/admin/pages/home', { content: home.content, seo_title: 'Custom Home Title' })).status, 200);
  assert.equal((await new Client(app, env).get('/api/public/bootstrap')).json.pages.home.content.hero.headline, 'NEW HEADLINE');
  const html = await new Client(app, env).get('/');
  assert.match(html.text, /<title>Custom Home Title<\/title>/); assert.match(html.text, /rel="canonical" href="https:\/\/example.test\/"/); assert.match(html.text, /application\/ld\+json/);
  assert.equal((await a.put('/api/admin/pages/nope', { title: 'x' })).status, 404);
});

test('SSR head: service/portfolio pages get own meta; unknown paths 404 + noindex; admin noindex; XSS escaped', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env); const v = new Client(app, env);
  const s = await v.get('/web-development'); assert.equal(s.status, 200); assert.match(s.text, /Website Development/); assert.match(s.text, /"@type":"Service"/);
  const p = await v.get('/portfolio/venora-jewelry'); assert.equal(p.status, 200); assert.match(p.text, /VENORA JEWELRY/);
  const nf = await v.get('/does-not-exist'); assert.equal(nf.status, 404); assert.match(nf.text, /noindex/);
  assert.match((await v.get('/admin/dashboard')).text, /noindex/);
  const svc = await a.post('/api/admin/services', { slug: 'xss', title: 'T', summary: '"><script>alert(1)</script>' });
  const x = await v.get('/xss'); assert.ok(!x.text.includes('<script>alert(1)</script>')); 
  assert.ok(x.headers.get('content-security-policy')!.includes("frame-ancestors 'none'"));
  assert.equal(svc.status, 201);
});

test('sitemap and robots', async () => {
  const env = makeEnv(); const v = new Client(app, env);
  const sm = await v.get('/sitemap.xml'); assert.equal(sm.status, 200);
  for (const u of ['/pricing', '/web-development', '/portfolio/venora-jewelry', '/privacy-policy']) assert.ok(sm.text.includes('https://example.test' + u), u);
  assert.ok(!sm.text.includes('/admin'));
  const rb = await v.get('/robots.txt'); assert.match(rb.text, /Disallow: \/admin/); assert.match(rb.text, /Sitemap: https:\/\/example.test\/sitemap.xml/);
});

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82]);
test('uploads: validates by content, rejects SVG/HTML/oversize, serves with safe headers, delete works', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const send = (bytes: Uint8Array, name: string, type: string) => { const fd = new FormData(); fd.set('file', new File([bytes as BlobPart], name, { type })); return a.req('POST', '/api/admin/upload', fd); };
  const ok = await send(PNG, 'logo.png', 'image/png'); assert.equal(ok.status, 201); assert.match(ok.json.url, /^\/files\/uploads\/[0-9a-f-]{36}\.png$/);
  const svg = await send(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'x.svg', 'image/svg+xml'); assert.equal(svg.status, 415);
  const fake = await send(new TextEncoder().encode('<html><script>alert(1)</script></html>'), 'evil.png', 'image/png'); assert.equal(fake.status, 415, 'renamed html must be refused');
  const big = await send(new Uint8Array(5 * 1024 * 1024 + 1).fill(1), 'big.png', 'image/png'); assert.ok([413, 415].includes(big.status));
  assert.equal((await send(new Uint8Array(0), 'e.png', 'image/png')).status, 400);
  const served = await app.fetch(new Request('https://example.test' + ok.json.url), env);
  assert.equal(served.status, 200); assert.equal(served.headers.get('content-type'), 'image/png'); assert.equal(served.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await app.fetch(new Request('https://example.test/files/uploads/../../etc/passwd'), env)).status, 404);
  assert.equal((await a.del('/api/admin/upload?key=' + encodeURIComponent(ok.json.key))).status, 200);
  assert.equal((await app.fetch(new Request('https://example.test' + ok.json.url), env)).status, 404);
  assert.equal((await a.del('/api/admin/upload?key=' + encodeURIComponent('../secret'))).status, 400);
});

test('password change requires current password, signs out other devices', async () => {
  const env = makeEnv(); const a = await loggedInAdmin(app, env);
  const other = new Client(app, env); await other.post('/api/admin/login', { email: 'owner@example.test', password: 'StrongPass123' });
  assert.equal((await a.put('/api/admin/password', { current: 'wrong', next: 'NewStrongPass456' })).status, 400);
  assert.equal((await a.put('/api/admin/password', { current: 'StrongPass123', next: 'weak' })).status, 400);
  assert.equal((await a.put('/api/admin/password', { current: 'StrongPass123', next: 'NewStrongPass456' })).status, 200);
  assert.equal((await other.get('/api/admin/overview')).status, 401);
  assert.equal((await a.get('/api/admin/overview')).status, 200);
  assert.equal((await new Client(app, env).post('/api/admin/login', { email: 'owner@example.test', password: 'NewStrongPass456' })).status, 200);
});

test('unknown API routes return JSON 404 and errors never leak internals', async () => {
  const env = makeEnv(); const v = new Client(app, env);
  const r = await v.get('/api/nope'); assert.equal(r.status, 404); assert.equal(r.json.error.code, 'not_found');
  const bad = await new Client(app, env).req('POST', '/api/public/contact', undefined, { 'content-type': 'application/json' });
  assert.equal(bad.status, 400);
});
