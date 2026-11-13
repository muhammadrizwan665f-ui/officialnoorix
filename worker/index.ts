import { Hono } from 'hono';
import type { HonoEnv } from './types';
import { AppError } from './lib/http';
import { admin } from './routes/admin';
import { pub } from './routes/public';
import { resolveMeta, renderHead } from './lib/seo';
import { loadSettings } from './lib/settings';

const CSP = [
  "default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'",
  "img-src 'self' data: https:", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", "font-src 'self' https://fonts.gstatic.com",
  "script-src 'self' https://challenges.cloudflare.com", "frame-src https://challenges.cloudflare.com", "connect-src 'self'",
].join('; ');

export function createApp() {
  const app = new Hono<HonoEnv>();

  app.use('*', async (c, next) => {
    await next();
    const h = c.res.headers;
    h.set('x-content-type-options', 'nosniff');
    h.set('referrer-policy', 'strict-origin-when-cross-origin');
    h.set('x-frame-options', 'DENY');
    h.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
    if (new URL(c.req.url).protocol === 'https:') h.set('strict-transport-security', 'max-age=31536000; includeSubDomains');
    if ((h.get('content-type') ?? '').includes('text/html')) h.set('content-security-policy', CSP);
  });

  // Reject oversized request bodies early (uploads get a larger allowance).
  app.use('/api/*', async (c, next) => {
    const len = parseInt(c.req.header('content-length') ?? '0', 10) || 0;
    const limit = c.req.path.endsWith('/admin/upload') ? 6 * 1024 * 1024 : 400 * 1024;
    if (len > limit) throw new AppError(413, 'too_large', 'Request is too large.');
    if (c.req.path.startsWith('/api/admin')) c.header('cache-control', 'no-store');
    await next();
  });

  app.route('/api/admin', admin);
  app.route('/api/public', pub);
  app.all('/api/*', (c) => c.json({ error: { code: 'not_found', message: 'Not found' } }, 404));

  app.get('/files/*', async (c) => {
    const key = decodeURIComponent(new URL(c.req.url).pathname.slice('/files/'.length));
    if (!/^uploads\/[0-9a-f-]{36}\.(png|jpg|gif|webp)$/.test(key)) return c.text('Not found', 404);
    const o: any = await c.env.FILES.get(key);
    if (!o) return c.text('Not found', 404);
    return new Response(o.body, { headers: { 'content-type': o.httpMetadata?.contentType ?? 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable', 'content-security-policy': "default-src 'none'; sandbox" } });
  });

  app.get('/robots.txt', (c) => {
    const site = c.env.SITE_URL.replace(/\/$/, '');
    return c.text(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', async (c) => {
    const site = c.env.SITE_URL.replace(/\/$/, '');
    const urls: string[] = ['/', '/about', '/services', '/portfolio', '/pricing', '/contact', '/faq', '/privacy-policy', '/terms', '/refund-policy'];
    const q = async (sql: string) => (await c.env.DB.prepare(sql).all<any>()).results;
    for (const r of await q('SELECT slug FROM services WHERE published=1 ORDER BY sort_order')) urls.push('/' + r.slug);
    for (const r of await q('SELECT slug FROM portfolio_projects WHERE published=1 ORDER BY sort_order')) urls.push('/portfolio/' + r.slug);
    const posts = await q('SELECT slug FROM blog_posts WHERE published=1 ORDER BY published_at DESC');
    if (posts.length) urls.push('/blog');
    for (const r of posts) urls.push('/blog/' + r.slug);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site}${u === '/' ? '/' : u}</loc></url>`).join('\n')}\n</urlset>\n`;
    return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
  });

  // Every other GET is the React app, with server-rendered <head> (title, description, canonical, Open Graph, JSON-LD).
  app.get('*', async (c) => {
    const url = new URL(c.req.url);
    if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return c.env.ASSETS.fetch(c.req.raw);
    const shell = await c.env.ASSETS.fetch(new Request(url.origin + '/'));
    let html = await shell.text();
    const meta = await resolveMeta(c.env, url.pathname);
    const settings = await loadSettings(c.env);
    const icon = settings.favicon ? `<link rel="icon" href="${settings.favicon.replace(/"/g, '')}">` : '';
    html = html.replace('<!--SEO_HEAD-->', renderHead(meta, settings.site_name) + icon);
    return new Response(html, { status: meta.status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' } });
  });

  app.onError((err, c) => {
    if (err instanceof AppError) return c.json({ error: { code: err.code, message: err.message } }, err.status as any);
    console.error('unhandled', err);
    return c.json({ error: { code: 'server_error', message: 'Something went wrong on our side. Please try again.' } }, 500);
  });
  return app;
}

const app = createApp();
export default app;
