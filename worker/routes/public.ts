import { Hono } from 'hono';
import type { Env, HonoEnv } from '../types';
import { AppError, bad, clientIp, notFound } from '../lib/http';
import { sha256Hex, uid } from '../lib/crypto';
import { rateLimit } from '../lib/ratelimit';
import { loadSettings } from '../lib/settings';
import { RESOURCES, listAll } from '../lib/crud';

export const pub = new Hono<HonoEnv>();

export const CONTACT_SERVICES = ['Business Website', 'Ecommerce Website', 'Social Media Management', 'AI Chatbot', 'Business Automation', 'Hosting & Maintenance', 'Other'];
export const CONTACT_BUDGETS = ['Under $200', '$200–$500', '$500–$1,000', '$1,000–$3,000', '$3,000+', 'Not sure yet'];

export async function loadBootstrap(env: Env) {
  const [settings, pagesQ, services, packages, portfolio, faqs, tests, blogCount] = await Promise.all([
    loadSettings(env),
    env.DB.prepare('SELECT slug,title,content,seo_title,seo_description,og_image FROM pages').all<any>(),
    listAll(env, RESOURCES.services),
    listAll(env, RESOURCES.packages),
    listAll(env, RESOURCES.portfolio),
    listAll(env, RESOURCES.faqs),
    listAll(env, RESOURCES.testimonials),
    env.DB.prepare('SELECT COUNT(*) n FROM blog_posts WHERE published=1').first<{ n: number }>(),
  ]);
  const pages: Record<string, any> = {};
  for (const p of pagesQ.results) pages[p.slug] = { title: p.title, content: JSON.parse(p.content || '{}'), seoTitle: p.seo_title, seoDescription: p.seo_description, ogImage: p.og_image };
  const strip = (r: any) => { const o = { ...r }; delete o.created_at; delete o.updated_at; return o; };
  return {
    settings, pages,
    services: services.filter((s: any) => s.published).map(strip),
    packages: packages.filter((p: any) => p.published).map(strip),
    portfolio: portfolio.filter((p: any) => p.published).map(strip),
    faqs: faqs.filter((f: any) => f.published),
    testimonials: tests.filter((t: any) => t.published && t.client_approved).map((t: any) => ({ id: t.id, name: t.name, role: t.role, company: t.company, quote: t.quote, avatar: t.avatar })),
    hasBlog: (blogCount?.n ?? 0) > 0,
    contactOptions: { services: CONTACT_SERVICES, budgets: CONTACT_BUDGETS },
  };
}

pub.get('/bootstrap', async (c) => {
  const data = await loadBootstrap(c.env);
  return c.json(data, 200, { 'cache-control': 'public, max-age=30' });
});

const POST_COLS = 'slug,title,excerpt,featured_image,author,published_at,seo_title,seo_description';
pub.get('/blog', async (c) => {
  const { results } = await c.env.DB.prepare(`SELECT ${POST_COLS} FROM blog_posts WHERE published=1 ORDER BY published_at DESC LIMIT 100`).all<any>();
  return c.json(results, 200, { 'cache-control': 'public, max-age=30' });
});
pub.get('/blog/:slug', async (c) => {
  const r = await c.env.DB.prepare(`SELECT ${POST_COLS},content FROM blog_posts WHERE slug=? AND published=1`).bind(c.req.param('slug')).first<any>();
  if (!r) throw notFound('Article not found');
  return c.json(r, 200, { 'cache-control': 'public, max-age=30' });
});

// ---------- contact / lead form ----------
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown, max: number, label: string, min = 0) => {
  if (v === undefined || v === null) v = '';
  if (typeof v !== 'string') throw bad(`${label} is invalid`);
  const s = v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim();
  if (s.length < min) throw bad(min === 1 ? `${label} is required` : `${label} is too short`);
  if (s.length > max) throw bad(`${label} is too long`);
  return s;
};

async function verifyTurnstile(env: Env, token: unknown, ip: string) {
  if (!env.TURNSTILE_SECRET) return;
  if (typeof token !== 'string' || !token) throw bad('Please complete the spam check and try again.', 'captcha');
  const fd = new FormData(); fd.set('secret', env.TURNSTILE_SECRET); fd.set('response', token); fd.set('remoteip', ip);
  let ok = false;
  try { const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd }); ok = !!((await r.json()) as any).success; } catch { throw new AppError(503, 'captcha_unavailable', 'Spam check is temporarily unavailable. Please try again shortly.'); }
  if (!ok) throw bad('Spam check failed. Please try again.', 'captcha');
}

pub.post('/contact', async (c) => {
  const ip = clientIp(c.req.raw);
  const ipHash = (await sha256Hex('noorix|' + ip)).slice(0, 32);
  await rateLimit(c.env, 'contact:' + ipHash, 20, 3600);
  let b: Record<string, any>;
  try { b = await c.req.json(); } catch { throw bad('Invalid request'); }
  if (!b || typeof b !== 'object') throw bad('Invalid request');

  // Spam traps. A filled honeypot or an impossibly fast submit is a bot; do not store it.
  if (typeof b.website === 'string' && b.website.trim() !== '') return c.json({ ok: true });
  if (typeof b.elapsedMs === 'number' && b.elapsedMs < 1500) throw bad('That was very fast. Please review your message and submit again.', 'too_fast');
  await verifyTurnstile(c.env, b.turnstileToken, ip);

  const name = str(b.name, 100, 'Name', 2);
  const email = str(b.email, 254, 'Email', 1).toLowerCase();
  if (!EMAIL.test(email)) throw bad('Please enter a valid email address');
  const business = str(b.business, 120, 'Business name');
  const phone = str(b.phone, 40, 'Phone/WhatsApp');
  if (phone && !/^[0-9+()\-.\s]{6,40}$/.test(phone)) throw bad('Phone/WhatsApp number contains invalid characters');
  const country = str(b.country, 80, 'Country', 1);
  const service = str(b.service, 60, 'Service', 1);
  if (!CONTACT_SERVICES.includes(service)) throw bad('Please choose a service from the list');
  const budget = str(b.budget, 40, 'Budget');
  if (budget && !CONTACT_BUDGETS.includes(budget)) throw bad('Please choose a budget from the list');
  const message = str(b.message, 5000, 'Project description', 10);

  // Duplicate protection: the same person sending the same text within 10 minutes is one inquiry.
  const dedupe = await sha256Hex([email, service, message.toLowerCase().replace(/\s+/g, ' ')].join('|'));
  const dup = await c.env.DB.prepare(`SELECT id FROM inquiries WHERE dedupe_hash=? AND created_at > datetime('now','-10 minutes')`).bind(dedupe).first<{ id: string }>();
  if (dup) return c.json({ ok: true, id: dup.id, duplicate: true });

  const id = 'inq_' + uid().slice(0, 12);
  await c.env.DB.prepare('INSERT INTO inquiries(id,name,business,email,phone,country,service,budget,message,dedupe_hash,ip_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(id, name, business, email, phone, country, service, budget, message, dedupe, ipHash).run();
  return c.json({ ok: true, id }, 201);
});
