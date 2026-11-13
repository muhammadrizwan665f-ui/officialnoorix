import type { Env } from '../types';
import { esc } from './http';
import { loadSettings } from './settings';

export interface Meta { title: string; description: string; canonical: string; image: string; type: 'website' | 'article'; status: number; noindex: boolean; jsonld: unknown[] }

const STATIC = new Set(['about', 'services', 'pricing', 'contact', 'portfolio', 'faq', 'blog', 'privacy-policy', 'terms', 'refund-policy']);

export async function resolveMeta(env: Env, pathname: string): Promise<Meta> {
  const s = await loadSettings(env);
  const site = env.SITE_URL.replace(/\/$/, '');
  const path = pathname.replace(/\/+$/, '') || '/';
  const abs = (u: string) => (!u ? '' : /^https?:/.test(u) ? u : site + u);
  const base: Meta = { title: s.seo_title, description: s.seo_description, canonical: site + (path === '/' ? '/' : path), image: abs(s.og_image), type: 'website', status: 200, noindex: false, jsonld: [] };
  const suffix = ` | ${s.site_name}`;
  const withSuffix = (t: string) => (t.includes(s.site_name) ? t : t + suffix);
  const page = async (slug: string) => env.DB.prepare('SELECT title,seo_title,seo_description,og_image FROM pages WHERE slug=?').bind(slug).first<any>();
  const apply = (p: any) => { if (!p) return; base.title = p.seo_title || withSuffix(p.title); base.description = p.seo_description || base.description; if (p.og_image) base.image = abs(p.og_image); };

  if (path.startsWith('/admin')) return { ...base, title: `Admin | ${s.site_name}`, noindex: true };
  if (path === '/') {
    apply(await page('home'));
    const sameAs = ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok'].map((k) => (s as any)[k]).filter(Boolean);
    base.jsonld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: s.site_name, url: site, ...(s.logo ? { logo: abs(s.logo) } : {}), ...(s.email ? { email: s.email } : {}), ...(sameAs.length ? { sameAs } : {}), description: s.seo_description });
    return base;
  }
  const seg = path.slice(1).split('/');
  if (seg.length === 1 && STATIC.has(seg[0])) { apply(await page(seg[0])); return base; }
  if (seg[0] === 'portfolio' && seg.length === 2) {
    const p = await env.DB.prepare('SELECT title,summary,thumbnail,seo_title,seo_description FROM portfolio_projects WHERE slug=? AND published=1').bind(seg[1]).first<any>();
    if (p) { base.title = p.seo_title || withSuffix(p.title); base.description = p.seo_description || p.summary || base.description; if (p.thumbnail) base.image = abs(p.thumbnail); return base; }
  } else if (seg[0] === 'blog' && seg.length === 2) {
    const p = await env.DB.prepare('SELECT title,excerpt,featured_image,author,published_at,seo_title,seo_description FROM blog_posts WHERE slug=? AND published=1').bind(seg[1]).first<any>();
    if (p) {
      base.title = p.seo_title || withSuffix(p.title); base.description = p.seo_description || p.excerpt || base.description; base.type = 'article';
      if (p.featured_image) base.image = abs(p.featured_image);
      base.jsonld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.published_at, ...(p.author ? { author: { '@type': 'Person', name: p.author } } : {}), ...(base.image ? { image: base.image } : {}), publisher: { '@type': 'Organization', name: s.site_name } });
      return base;
    }
  } else if (seg.length === 1) {
    const v = await env.DB.prepare('SELECT title,headline,summary,seo_title,seo_description,image FROM services WHERE slug=? AND published=1').bind(seg[0]).first<any>();
    if (v) {
      base.title = v.seo_title || withSuffix(v.title); base.description = v.seo_description || v.summary || base.description; if (v.image) base.image = abs(v.image);
      base.jsonld.push({ '@context': 'https://schema.org', '@type': 'Service', name: v.title, description: v.summary, provider: { '@type': 'Organization', name: s.site_name, url: site }, url: base.canonical });
      return base;
    }
  }
  return { ...base, title: `Page not found${suffix}`, description: 'The page you are looking for does not exist.', status: 404, noindex: true };
}

export function renderHead(m: Meta, siteName: string): string {
  const t = esc(m.title), d = esc(m.description);
  const og = [
    ['og:site_name', siteName], ['og:type', m.type], ['og:title', m.title], ['og:description', m.description], ['og:url', m.canonical], ...(m.image ? [['og:image', m.image]] : []),
  ].map(([k, v]) => `<meta property="${k}" content="${esc(v)}">`).join('');
  const tw = `<meta name="twitter:card" content="${m.image ? 'summary_large_image' : 'summary'}"><meta name="twitter:title" content="${t}"><meta name="twitter:description" content="${d}">${m.image ? `<meta name="twitter:image" content="${esc(m.image)}">` : ''}`;
  const ld = m.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('');
  return `<title>${t}</title><meta name="description" content="${d}">${m.noindex ? '<meta name="robots" content="noindex,nofollow">' : ''}<link rel="canonical" href="${esc(m.canonical)}">${og}${tw}${ld}`;
}
