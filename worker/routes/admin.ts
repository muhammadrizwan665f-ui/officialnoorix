import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { AppError, bad, clientIp, notFound, nowIso } from '../lib/http';
import { hashPassword, verifyPassword, timingSafeEqual, uid, sha256Hex } from '../lib/crypto';
import { rateLimit } from '../lib/ratelimit';
import { COOKIE, createSession, destroySession, requireAdmin } from '../lib/auth';
import { RESOURCES, listAll, getOne, createOne, updateOne, deleteOne, reorder } from '../lib/crud';
import { SETTING_KEYS, cleanSetting, loadSettings } from '../lib/settings';
import { saveUpload } from '../lib/upload';
import { getCookie } from 'hono/cookie';

export const admin = new Hono<HonoEnv>();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const body = async (c: any): Promise<Record<string, any>> => {
  try { const b = await c.req.json(); if (b && typeof b === 'object' && !Array.isArray(b)) return b; } catch { /* fallthrough */ }
  throw bad('Invalid request body');
};
const strongPw = (p: unknown): string => {
  if (typeof p !== 'string' || p.length < 10 || p.length > 200) throw bad('Password must be at least 10 characters');
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) throw bad('Password must contain letters and numbers');
  return p;
};

// ---------- unauthenticated: first-time setup + login ----------
admin.get('/status', async (c) => {
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM admin_users').first<{ n: number }>();
  const t = getCookie(c, COOKIE);
  let user = null as null | { name: string; email: string };
  let csrf = '';
  if (t) {
    const r = await c.env.DB.prepare(`SELECT s.csrf, u.name, u.email FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.id=? AND s.expires_at > datetime('now')`).bind(await sha256Hex(t)).first<any>();
    if (r) { user = { name: r.name, email: r.email }; csrf = r.csrf; }
  }
  return c.json({ needsSetup: (n?.n ?? 0) === 0 && !!c.env.SETUP_TOKEN, user, csrf });
});

admin.post('/setup', async (c) => {
  const ip = clientIp(c.req.raw);
  await rateLimit(c.env, 'setup:' + ip, 5, 900);
  const b = await body(c);
  if (!c.env.SETUP_TOKEN) throw new AppError(403, 'disabled', 'Setup is disabled. Set the SETUP_TOKEN secret first.');
  const n = await c.env.DB.prepare('SELECT COUNT(*) n FROM admin_users').first<{ n: number }>();
  if ((n?.n ?? 0) > 0) throw new AppError(403, 'already_setup', 'An admin account already exists.');
  if (typeof b.token !== 'string' || !timingSafeEqual(b.token, c.env.SETUP_TOKEN)) throw new AppError(403, 'bad_token', 'Setup token is incorrect.');
  const name = String(b.name ?? '').trim(); const email = String(b.email ?? '').trim().toLowerCase();
  if (name.length < 2 || name.length > 80) throw bad('Enter your name');
  if (!EMAIL.test(email) || email.length > 254) throw bad('Enter a valid email address');
  const hash = await hashPassword(strongPw(b.password));
  const id = uid();
  // Only the first caller can win this INSERT, even under a race.
  const r = await c.env.DB.prepare('INSERT INTO admin_users(id,email,name,password_hash) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM admin_users) RETURNING id').bind(id, email, name, hash).first();
  if (!r) throw new AppError(403, 'already_setup', 'An admin account already exists.');
  const csrf = await createSession(c, id);
  return c.json({ ok: true, csrf, user: { name, email } }, 201);
});

admin.post('/login', async (c) => {
  const ip = clientIp(c.req.raw);
  const b = await body(c);
  const email = String(b.email ?? '').trim().toLowerCase();
  const pw = String(b.password ?? '');
  await rateLimit(c.env, 'login-ip:' + ip, 15, 900);
  await rateLimit(c.env, 'login-acct:' + await sha256Hex(email), 8, 900);
  const u = await c.env.DB.prepare('SELECT id,name,email,password_hash FROM admin_users WHERE email=?').bind(email).first<any>();
  // Always run a hash comparison so response time does not reveal whether the email exists.
  const good = await verifyPassword(pw, u?.password_hash ?? 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
  if (!u || !good) throw new AppError(401, 'bad_login', 'Incorrect email or password.');
  await c.env.DB.prepare('UPDATE admin_users SET last_login_at=? WHERE id=?').bind(nowIso(), u.id).run();
  const csrf = await createSession(c, u.id);
  return c.json({ ok: true, csrf, user: { name: u.name, email: u.email } });
});

// ---------- everything below requires a valid session ----------
admin.use('*', async (c, next) => (c.req.path.endsWith('/status') || c.req.path.endsWith('/login') || c.req.path.endsWith('/setup')) ? next() : requireAdmin(c, next));

admin.post('/logout', async (c) => { await destroySession(c); return c.json({ ok: true }); });
admin.post('/logout-all', async (c) => {
  await c.env.DB.prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(c.get('admin').user.id).run();
  await destroySession(c); return c.json({ ok: true });
});

admin.get('/overview', async (c) => {
  const db = c.env.DB;
  const counts = await db.prepare(`SELECT COUNT(*) total,
     SUM(status='New') n_new, SUM(status IN ('Contacted','Qualified','Proposal Sent')) in_progress, SUM(status IN ('Won','Lost')) completed FROM inquiries`).first<any>();
  const pub = await db.prepare('SELECT COUNT(*) n FROM portfolio_projects WHERE published=1').first<any>();
  const svc = await db.prepare('SELECT COUNT(*) n FROM services WHERE published=1').first<any>();
  const recent = await db.prepare('SELECT id,name,service,status,created_at FROM inquiries ORDER BY created_at DESC, rowid DESC LIMIT 6').all<any>();
  return c.json({ inquiries: { total: counts.total ?? 0, new: counts.n_new ?? 0, inProgress: counts.in_progress ?? 0, completed: counts.completed ?? 0 }, publishedProjects: pub.n, activeServices: svc.n, recent: recent.results });
});

// ---------- settings ----------
admin.get('/settings', async (c) => c.json(await loadSettings(c.env)));
admin.put('/settings', async (c) => {
  const b = await body(c);
  const stmts: D1PreparedStatement[] = [];
  for (const [k, v] of Object.entries(b)) {
    if (!(SETTING_KEYS as readonly string[]).includes(k)) continue;
    stmts.push(c.env.DB.prepare(`INSERT INTO settings(key,value,updated_at) VALUES(?,?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).bind(k, cleanSetting(k, v)));
  }
  if (stmts.length) await c.env.DB.batch(stmts);
  return c.json(await loadSettings(c.env));
});

// ---------- pages (home/about/policies/page intros + SEO) ----------
admin.get('/pages', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT slug,title,content,seo_title,seo_description,og_image,updated_at FROM pages ORDER BY slug').all<any>();
  return c.json(results.map((r) => ({ ...r, content: JSON.parse(r.content || '{}') })));
});
admin.put('/pages/:slug', async (c) => {
  const slug = c.req.param('slug');
  const exists = await c.env.DB.prepare('SELECT slug FROM pages WHERE slug=?').bind(slug).first();
  if (!exists) throw notFound('Unknown page');
  const b = await body(c);
  const sets: string[] = []; const vals: unknown[] = [];
  if (b.content !== undefined) {
    if (typeof b.content !== 'object' || b.content === null || Array.isArray(b.content)) throw bad('content must be an object');
    const s = JSON.stringify(b.content); if (s.length > 200_000) throw bad('Content is too large');
    sets.push('content=?'); vals.push(s);
  }
  for (const [k, max] of [['title', 120], ['seo_title', 120], ['seo_description', 320]] as const) {
    if (b[k] !== undefined) { if (typeof b[k] !== 'string' || b[k].length > max) throw bad(`${k} is invalid`); sets.push(`${k}=?`); vals.push(b[k].trim()); }
  }
  if (b.og_image !== undefined) { const v = String(b.og_image).trim(); if (v && !/^(https?:\/\/|\/)[^\s<>"']+$/.test(v)) throw bad('Image link is invalid'); sets.push('og_image=?'); vals.push(v); }
  if (sets.length) await c.env.DB.prepare(`UPDATE pages SET ${sets.join(',')}, updated_at=datetime('now') WHERE slug=?`).bind(...vals, slug).run();
  const r = await c.env.DB.prepare('SELECT slug,title,content,seo_title,seo_description,og_image,updated_at FROM pages WHERE slug=?').bind(slug).first<any>();
  return c.json({ ...r, content: JSON.parse(r.content) });
});

// ---------- generic resources ----------
for (const [name, res] of Object.entries(RESOURCES)) {
  admin.get(`/${name}`, async (c) => c.json(await listAll(c.env, res)));
  admin.get(`/${name}/:id`, async (c) => c.json(await getOne(c.env, res, c.req.param('id'))));
  admin.post(`/${name}`, async (c) => c.json(await createOne(c.env, res, await body(c)), 201));
  admin.put(`/${name}/:id`, async (c) => c.json(await updateOne(c.env, res, c.req.param('id'), await body(c))));
  admin.delete(`/${name}/:id`, async (c) => { await deleteOne(c.env, res, c.req.param('id')); return c.json({ ok: true }); });
  if (res.order.includes('sort_order')) admin.post(`/${name}-reorder`, async (c) => { await reorder(c.env, res, (await body(c)).ids); return c.json({ ok: true }); });
}

// ---------- inquiries ----------
const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
function inquiryWhere(q: URLSearchParams) {
  const w: string[] = []; const p: unknown[] = [];
  const s = (q.get('q') ?? '').trim().slice(0, 100);
  if (s) { const like = `%${s.replace(/[\\%_]/g, (m) => '\\' + m)}%`; w.push(`(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR business LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')`); p.push(like, like, like, like); }
  for (const k of ['status', 'service', 'country'] as const) { const v = q.get(k); if (v) { w.push(`${k}=?`); p.push(v); } }
  return { where: w.length ? 'WHERE ' + w.join(' AND ') : '', p };
}
admin.get('/inquiries', async (c) => {
  const q = new URL(c.req.url).searchParams;
  const { where, p } = inquiryWhere(q);
  const limit = Math.min(Math.max(parseInt(q.get('limit') ?? '25', 10) || 25, 1), 100);
  const page = Math.max(parseInt(q.get('page') ?? '1', 10) || 1, 1);
  const total = await c.env.DB.prepare(`SELECT COUNT(*) n FROM inquiries ${where}`).bind(...p).first<{ n: number }>();
  const { results } = await c.env.DB.prepare(`SELECT id,name,business,email,phone,country,service,budget,message,status,created_at FROM inquiries ${where} ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`).bind(...p, limit, (page - 1) * limit).all<any>();
  const facets = await c.env.DB.prepare(`SELECT DISTINCT country FROM inquiries WHERE country<>'' ORDER BY country`).all<any>();
  return c.json({ items: results, total: total?.n ?? 0, page, limit, countries: facets.results.map((r: any) => r.country) });
});
const csvCell = (v: unknown) => {
  let s = String(v ?? '').replace(/\r?\n/g, ' ');
  if (/^[=+\-@\t]/.test(s)) s = "'" + s; // neutralise spreadsheet formula injection
  return '"' + s.replace(/"/g, '""') + '"';
};
admin.get('/inquiries-export.csv', async (c) => {
  const { where, p } = inquiryWhere(new URL(c.req.url).searchParams);
  const { results } = await c.env.DB.prepare(`SELECT * FROM inquiries ${where} ORDER BY created_at DESC, rowid DESC LIMIT 10000`).bind(...p).all<any>();
  const head = ['ID', 'Received (UTC)', 'Status', 'Name', 'Business', 'Email', 'Phone/WhatsApp', 'Country', 'Service', 'Budget', 'Message'];
  const lines = [head.map(csvCell).join(',')];
  for (const r of results) lines.push([r.id, r.created_at, r.status, r.name, r.business, r.email, r.phone, r.country, r.service, r.budget, r.message].map(csvCell).join(','));
  return new Response('﻿' + lines.join('\r\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="noorix-inquiries-${nowIso().slice(0, 10)}.csv"`, 'cache-control': 'no-store' } });
});
admin.get('/inquiries/:id', async (c) => {
  const r = await c.env.DB.prepare('SELECT id,name,business,email,phone,country,service,budget,message,status,created_at,updated_at FROM inquiries WHERE id=?').bind(c.req.param('id')).first<any>();
  if (!r) throw notFound();
  const notes = await c.env.DB.prepare('SELECT id,admin_name,note,created_at FROM inquiry_notes WHERE inquiry_id=? ORDER BY created_at DESC, rowid DESC').bind(r.id).all<any>();
  return c.json({ ...r, notes: notes.results });
});
admin.patch('/inquiries/:id', async (c) => {
  const b = await body(c);
  if (!STATUSES.includes(b.status)) throw bad('Invalid status');
  const r = await c.env.DB.prepare(`UPDATE inquiries SET status=?, updated_at=datetime('now') WHERE id=? RETURNING id`).bind(b.status, c.req.param('id')).first();
  if (!r) throw notFound();
  return c.json({ ok: true });
});
admin.post('/inquiries/:id/notes', async (c) => {
  const b = await body(c);
  const note = String(b.note ?? '').trim();
  if (!note || note.length > 2000) throw bad('Write a note (up to 2000 characters)');
  const exists = await c.env.DB.prepare('SELECT id FROM inquiries WHERE id=?').bind(c.req.param('id')).first();
  if (!exists) throw notFound();
  const a = c.get('admin').user;
  await c.env.DB.prepare('INSERT INTO inquiry_notes(id,inquiry_id,admin_id,admin_name,note) VALUES(?,?,?,?,?)').bind(uid(), c.req.param('id'), a.id, a.name, note).run();
  return c.json({ ok: true }, 201);
});
admin.delete('/inquiries/:id', async (c) => {
  const r = await c.env.DB.prepare('DELETE FROM inquiries WHERE id=? RETURNING id').bind(c.req.param('id')).first();
  if (!r) throw notFound();
  return c.json({ ok: true });
});

// ---------- uploads ----------
admin.post('/upload', async (c) => {
  await rateLimit(c.env, 'upload:' + c.get('admin').user.id, 120, 600);
  let form: FormData;
  try { form = await c.req.formData(); } catch { throw bad('Expected a file upload'); }
  const f = form.get('file') as unknown as File | null;
  if (!f || typeof f === 'string') throw bad('No file received');
  return c.json(await saveUpload(c.env, f), 201);
});
admin.delete('/upload', async (c) => {
  const key = new URL(c.req.url).searchParams.get('key') ?? '';
  if (!/^uploads\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/.test(key)) throw bad('Invalid file');
  await c.env.FILES.delete(key);
  await c.env.DB.prepare('DELETE FROM uploads WHERE key=?').bind(key).run();
  return c.json({ ok: true });
});

// ---------- admin profile ----------
admin.get('/profile', (c) => c.json(c.get('admin').user));
admin.put('/profile', async (c) => {
  const b = await body(c);
  const name = String(b.name ?? '').trim();
  if (name.length < 2 || name.length > 80) throw bad('Enter your name');
  await c.env.DB.prepare('UPDATE admin_users SET name=? WHERE id=?').bind(name, c.get('admin').user.id).run();
  return c.json({ ok: true, name });
});
admin.put('/password', async (c) => {
  const a = c.get('admin'); const b = await body(c);
  await rateLimit(c.env, 'pw:' + a.user.id, 6, 900);
  const u = await c.env.DB.prepare('SELECT password_hash FROM admin_users WHERE id=?').bind(a.user.id).first<any>();
  if (!(await verifyPassword(String(b.current ?? ''), u.password_hash))) throw new AppError(400, 'bad_password', 'Current password is incorrect.');
  const hash = await hashPassword(strongPw(b.next));
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').bind(hash, a.user.id),
    c.env.DB.prepare('DELETE FROM admin_sessions WHERE user_id=? AND id<>?').bind(a.user.id, a.sessionId), // sign out every other device
  ]);
  return c.json({ ok: true });
});
