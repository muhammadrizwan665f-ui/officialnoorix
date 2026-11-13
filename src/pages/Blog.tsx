import { useEffect, useState, type ReactNode } from 'react';
import { Link } from '../lib/router';
import { api } from '../lib/api';
import { useSite, pageTitle } from '../lib/data';
import { useMeta } from '../lib/meta';
import { PageHero, CtaBand, Notice } from '../components/ui';
import { Icon } from '../components/Icon';
import NotFound from './NotFound';

interface Post { slug: string; title: string; excerpt: string; featured_image: string; author: string; published_at: string; content?: string; seo_title?: string; seo_description?: string }
const fmt = (d: string) => (d ? new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

export function BlogPage() {
  const site = useSite(); const c = site.pages.blog?.content ?? {};
  const [posts, setPosts] = useState<Post[] | null>(null); const [err, setErr] = useState('');
  useMeta(pageTitle(site, 'blog', 'Blog'), site.pages.blog?.seoDescription);
  useEffect(() => { api<Post[]>('/api/public/blog').then(setPosts).catch((e) => setErr(e.message)); }, []);
  return (
    <>
      <PageHero eyebrow="Blog" title={c.headline ?? 'Articles'} text={c.text} />
      <section className="bg-white py-12 sm:py-16"><div className="container-x">
        {err && <Notice kind="error">{err}</Notice>}
        {posts && posts.length === 0 && <p className="rounded-2xl border border-dashed border-brand-line p-10 text-center text-brand-muted">No articles published yet.</p>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(posts ?? []).map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
              {p.featured_image ? <img src={p.featured_image} alt="" loading="lazy" decoding="async" className="aspect-[16/9] w-full object-cover" /> : <div className="aspect-[16/9] bg-gradient-to-br from-brand to-brand-deep" />}
              <div className="p-5"><p className="text-xs font-semibold text-brand-muted">{fmt(p.published_at)}{p.author ? ` · ${p.author}` : ''}</p><h2 className="mt-2 text-lg font-extrabold">{p.title}</h2><p className="mt-1.5 line-clamp-3 text-sm text-brand-muted">{p.excerpt}</p></div>
            </Link>
          ))}
        </div>
      </div></section>
    </>
  );
}

/** Safe renderer: plain text only (no HTML injection). "## Heading" lines become headings; blank lines split paragraphs. */
function Body({ text }: { text: string }) {
  const out: ReactNode[] = [];
  text.split(/\n{2,}/).forEach((blk, i) => {
    const t = blk.trim(); if (!t) return;
    if (t.startsWith('## ')) out.push(<h2 key={i}>{t.slice(3)}</h2>); else out.push(<p key={i} className="whitespace-pre-line">{t}</p>);
  });
  return <div className="prose-n">{out}</div>;
}

export function BlogPost({ slug }: { slug: string }) {
  const site = useSite();
  const [post, setPost] = useState<Post | null>(null); const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  useEffect(() => { setState('loading'); api<Post>(`/api/public/blog/${slug}`).then((p) => { setPost(p); setState('ok'); }).catch((e) => setState(e.status === 404 ? 'missing' : 'error')); }, [slug]);
  useMeta(post ? post.seo_title || `${post.title} | ${site.settings.site_name}` : 'Article', post?.seo_description || post?.excerpt);
  if (state === 'missing') return <NotFound />;
  if (state !== 'ok' || !post) return <div className="grid min-h-[50vh] place-items-center">{state === 'error' ? <Notice kind="error">Could not load this article.</Notice> : <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-line border-t-brand" role="status" aria-label="Loading" />}</div>;
  return (
    <>
      <PageHero eyebrow="Article" title={post.title} text={`${fmt(post.published_at)}${post.author ? ` · ${post.author}` : ''}`} />
      <article className="bg-white py-12 sm:py-16"><div className="container-x max-w-3xl">
        {post.featured_image && <img src={post.featured_image} alt="" className="mb-8 w-full rounded-2xl border border-brand-line" />}
        <Body text={post.content ?? ''} />
        <Link to="/blog" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand"><Icon name="arrow" className="h-4 w-4 rotate-180" />All articles</Link>
      </div></article>
      <CtaBand title="Ready to Build Something Great?" text="Let's discuss your next digital project." button="Start Your Project" href="/contact?intent=quote" />
    </>
  );
}
