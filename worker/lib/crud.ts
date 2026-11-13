import type { Env } from '../types';
import { AppError, bad, notFound, nowIso } from './http';
import { uid } from './crypto';

type T = 's' | 'i' | 'n' | 'b' | 'j' | 'slug' | 'url' | 'enum' | 'text';
export interface Field { n: string; t: T; max?: number; req?: boolean; en?: string[]; nullable?: boolean; def?: unknown }
export interface Resource {
  table: string; prefix: string; fields: Field[]; order: string; updated?: boolean;
  virtual?: 'features' | 'images';
  hook?: (row: Record<string, any>, existing: Record<string, any> | null) => void;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ok = (s: string) => /^(https?:\/\/|\/)[^\s<>"']*$/.test(s);

export function validateFields(res: Resource, input: Record<string, any>, partial: boolean): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of res.fields) {
    let v = input[f.n];
    if (v === undefined) {
      if (partial) continue;
      if (f.req) throw bad(`${f.n} is required`);
      v = f.def ?? (f.t === 'j' ? [] : f.t === 'b' || f.t === 'i' ? 0 : f.t === 'n' ? (f.nullable ? null : 0) : '');
    }
    switch (f.t) {
      case 's': case 'text': {
        if (typeof v !== 'string') throw bad(`${f.n} must be text`);
        v = v.trim();
        if (f.req && !v) throw bad(`${f.n} is required`);
        if (v.length > (f.max ?? (f.t === 'text' ? 20000 : 300))) throw bad(`${f.n} is too long`);
        break;
      }
      case 'slug': {
        v = String(v ?? '').trim().toLowerCase();
        if (!SLUG.test(v) || v.length > 80) throw bad('Slug may contain lowercase letters, numbers and single hyphens only');
        break;
      }
      case 'url': {
        v = String(v ?? '').trim();
        if (v && !ok(v)) throw bad(`${f.n} must be a link starting with https:// or /`);
        if (v.length > 500) throw bad(`${f.n} is too long`);
        break;
      }
      case 'enum': if (!f.en!.includes(v)) throw bad(`${f.n} has an invalid value`); break;
      case 'i': v = Number(v); if (!Number.isFinite(v)) throw bad(`${f.n} must be a number`); v = Math.trunc(v); break;
      case 'n': {
        if ((v === null || v === '') && f.nullable) { v = null; break; }
        v = Number(v); if (!Number.isFinite(v) || v < 0 || v > 1e9) throw bad(`${f.n} must be a valid amount`); break;
      }
      case 'b': v = v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0; break;
      case 'j': {
        if (!Array.isArray(v) || v.length > 100) throw bad(`${f.n} must be a list`);
        const a = v.map((x: unknown) => String(x ?? '').trim()).filter(Boolean);
        if (a.some((x: string) => x.length > 300)) throw bad(`An item in ${f.n} is too long`);
        v = JSON.stringify(a);
        break;
      }
    }
    out[f.n] = v;
  }
  return out;
}

function shape(res: Resource, row: Record<string, any>) {
  const o = { ...row };
  for (const f of res.fields) {
    if (f.t === 'j') { try { o[f.n] = JSON.parse(o[f.n] ?? '[]'); } catch { o[f.n] = []; } }
    if (f.t === 'b') o[f.n] = !!o[f.n];
  }
  return o;
}

async function attach(env: Env, res: Resource, rows: any[]) {
  if (!res.virtual || !rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const ph = ids.map(() => '?').join(',');
  if (res.virtual === 'features') {
    const { results } = await env.DB.prepare(`SELECT package_id, text FROM package_features WHERE package_id IN (${ph}) ORDER BY sort_order`).bind(...ids).all<any>();
    for (const r of rows) r.features = results.filter((x) => x.package_id === r.id).map((x) => x.text);
  } else {
    const { results } = await env.DB.prepare(`SELECT project_id, url, alt FROM portfolio_images WHERE project_id IN (${ph}) ORDER BY sort_order`).bind(...ids).all<any>();
    for (const r of rows) r.images = results.filter((x) => x.project_id === r.id).map((x) => ({ url: x.url, alt: x.alt }));
  }
  return rows;
}

async function writeVirtual(env: Env, res: Resource, id: string, input: Record<string, any>) {
  if (!res.virtual) return;
  const list = input[res.virtual];
  if (list === undefined) return;
  if (!Array.isArray(list) || list.length > 200) throw bad(`${res.virtual} must be a list`);
  const stmts: D1PreparedStatement[] = [];
  if (res.virtual === 'features') {
    stmts.push(env.DB.prepare('DELETE FROM package_features WHERE package_id=?').bind(id));
    list.map((x: unknown) => String(x ?? '').trim()).filter(Boolean).forEach((t: string, i: number) => {
      if (t.length > 300) throw bad('A feature is too long');
      stmts.push(env.DB.prepare('INSERT INTO package_features(id,package_id,text,sort_order) VALUES(?,?,?,?)').bind(uid(), id, t, i));
    });
  } else {
    stmts.push(env.DB.prepare('DELETE FROM portfolio_images WHERE project_id=?').bind(id));
    list.forEach((x: any, i: number) => {
      const url = String(x?.url ?? '').trim(); const alt = String(x?.alt ?? '').trim().slice(0, 200);
      if (!url) return;
      if (!ok(url)) throw bad('Image link is invalid');
      stmts.push(env.DB.prepare('INSERT INTO portfolio_images(id,project_id,url,alt,sort_order) VALUES(?,?,?,?,?)').bind(uid(), id, url, alt, i));
    });
  }
  await env.DB.batch(stmts);
}

const uniq = (e: unknown): never => {
  if (/UNIQUE/i.test(String((e as Error)?.message))) throw new AppError(409, 'duplicate', 'That slug is already used. Choose a different one.');
  throw e;
};

export async function listAll(env: Env, res: Resource) {
  const { results } = await env.DB.prepare(`SELECT * FROM ${res.table} ORDER BY ${res.order}`).all<any>();
  return attach(env, res, results.map((r) => shape(res, r)));
}
export async function getOne(env: Env, res: Resource, id: string) {
  const r = await env.DB.prepare(`SELECT * FROM ${res.table} WHERE id=?`).bind(id).first<any>();
  if (!r) throw notFound();
  return (await attach(env, res, [shape(res, r)]))[0];
}
export async function createOne(env: Env, res: Resource, input: Record<string, any>) {
  const v = validateFields(res, input, false);
  res.hook?.(v, null);
  const id = res.prefix + '_' + uid().slice(0, 12);
  const cols = ['id', ...Object.keys(v)]; const vals: unknown[] = [id, ...Object.values(v)];
  if (res.order.includes('sort_order')) {
    const max = await env.DB.prepare(`SELECT COALESCE(MAX(sort_order),-1)+1 n FROM ${res.table}`).first<{ n: number }>();
    cols.push('sort_order'); vals.push(max?.n ?? 0);
  }
  try {
    await env.DB.prepare(`INSERT INTO ${res.table}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`).bind(...vals).run();
  } catch (e) { uniq(e); }
  await writeVirtual(env, res, id, input);
  return getOne(env, res, id);
}
export async function updateOne(env: Env, res: Resource, id: string, input: Record<string, any>) {
  const existing = await env.DB.prepare(`SELECT * FROM ${res.table} WHERE id=?`).bind(id).first<any>();
  if (!existing) throw notFound();
  const v = validateFields(res, input, true);
  res.hook?.(v, existing);
  const keys = Object.keys(v);
  if (keys.length) {
    const sets = keys.map((k) => `${k}=?`); if (res.updated !== false) sets.push('updated_at=?');
    const vals = [...Object.values(v), ...(res.updated !== false ? [nowIso()] : []), id];
    try { await env.DB.prepare(`UPDATE ${res.table} SET ${sets.join(',')} WHERE id=?`).bind(...vals).run(); } catch (e) { uniq(e); }
  }
  await writeVirtual(env, res, id, input);
  return getOne(env, res, id);
}
export async function deleteOne(env: Env, res: Resource, id: string) {
  const r = await env.DB.prepare(`DELETE FROM ${res.table} WHERE id=? RETURNING id`).bind(id).first();
  if (!r) throw notFound();
}
export async function reorder(env: Env, res: Resource, ids: unknown) {
  if (!Array.isArray(ids) || ids.length > 500) throw bad('ids must be a list');
  await env.DB.batch(ids.map((id, i) => env.DB.prepare(`UPDATE ${res.table} SET sort_order=? WHERE id=?`).bind(i, String(id))));
}

const SEO: Field[] = [{ n: 'seo_title', t: 's', max: 120 }, { n: 'seo_description', t: 's', max: 320 }];
const CATS = ['Website Development', 'Ecommerce', 'Social Media', 'AI Automation'];
export const PORTFOLIO_CATEGORIES = CATS;
export const RESOURCES: Record<string, Resource> = {
  services: { table: 'services', prefix: 'svc', order: 'sort_order, created_at', virtual: undefined, fields: [
    { n: 'slug', t: 'slug', req: true }, { n: 'title', t: 's', req: true, max: 120 }, { n: 'headline', t: 's', max: 200 },
    { n: 'summary', t: 's', max: 500 }, { n: 'description', t: 'text', max: 5000 }, { n: 'icon', t: 's', max: 30 },
    { n: 'image', t: 'url' }, { n: 'benefits', t: 'j' }, { n: 'includes', t: 'j' }, { n: 'notes', t: 's', max: 1000 },
    { n: 'published', t: 'b', def: 1 }, { n: 'on_home', t: 'b' }, ...SEO,
  ] },
  packages: { table: 'packages', prefix: 'pkg', order: 'sort_order, created_at', virtual: 'features', fields: [
    { n: 'category', t: 's', req: true, max: 80 }, { n: 'name', t: 's', req: true, max: 80 }, { n: 'description', t: 's', max: 300 },
    { n: 'usd_price', t: 'n' }, { n: 'pkr_price', t: 'n', nullable: true }, { n: 'billing', t: 'enum', en: ['one-time', 'monthly'] },
    { n: 'starting_at', t: 'b' }, { n: 'featured', t: 'b' }, { n: 'cta_label', t: 's', max: 40, def: 'Get Started' }, { n: 'published', t: 'b', def: 1 },
  ] },
  portfolio: { table: 'portfolio_projects', prefix: 'prj', order: 'sort_order, created_at', virtual: 'images', fields: [
    { n: 'slug', t: 'slug', req: true }, { n: 'title', t: 's', req: true, max: 120 }, { n: 'summary', t: 's', max: 500 },
    { n: 'description', t: 'text', max: 8000 }, { n: 'category', t: 'enum', en: CATS }, { n: 'kind', t: 'enum', en: ['internal', 'demo', 'client'] },
    { n: 'project_url', t: 'url' }, { n: 'technologies', t: 'j' }, { n: 'thumbnail', t: 'url' },
    { n: 'featured', t: 'b' }, { n: 'published', t: 'b', def: 1 }, ...SEO,
  ] },
  faqs: { table: 'faqs', prefix: 'faq', order: 'sort_order', updated: false, fields: [
    { n: 'question', t: 's', req: true, max: 300 }, { n: 'answer', t: 'text', req: true, max: 3000 },
    { n: 'published', t: 'b', def: 1 }, { n: 'on_home', t: 'b', def: 1 },
  ] },
  testimonials: { table: 'testimonials', prefix: 'tst', order: 'sort_order', updated: false, fields: [
    { n: 'name', t: 's', req: true, max: 100 }, { n: 'role', t: 's', max: 100 }, { n: 'company', t: 's', max: 100 },
    { n: 'quote', t: 'text', req: true, max: 1500 }, { n: 'avatar', t: 'url' },
    { n: 'client_approved', t: 'b' }, { n: 'published', t: 'b' },
  ], hook: (row, existing) => {
    // Withdrawing approval from a live testimonial (without explicitly asking to keep it published) also unpublishes it.
    if (existing?.client_approved && 'client_approved' in row && !row.client_approved && !row.published) row.published = 0;
    const approved = 'client_approved' in row ? row.client_approved : existing?.client_approved;
    const pub = 'published' in row ? row.published : existing?.published;
    if (pub && !approved) throw bad('A testimonial can only be published after the client has approved it. Tick "Client approved" first.');
  } },
  blog: { table: 'blog_posts', prefix: 'blg', order: 'COALESCE(published_at, created_at) DESC', fields: [
    { n: 'slug', t: 'slug', req: true }, { n: 'title', t: 's', req: true, max: 200 }, { n: 'excerpt', t: 's', max: 500 },
    { n: 'content', t: 'text', max: 60000 }, { n: 'featured_image', t: 'url' }, { n: 'author', t: 's', max: 100 },
    { n: 'published', t: 'b' }, ...SEO,
  ], hook: (row, existing) => {
    const pub = 'published' in row ? row.published : existing?.published;
    if (pub && !existing?.published_at) row.published_at = nowIso();
  } },
};
