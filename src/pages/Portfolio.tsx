import { useState } from 'react';
import { Link } from '../lib/router';
import { useSite, pageTitle } from '../lib/data';
import { useMeta } from '../lib/meta';
import { PageHero, CtaBand, Notice } from '../components/ui';
import { ProjectCover, KIND_LABEL } from '../components/ProjectCover';
import { Icon } from '../components/Icon';
import NotFound from './NotFound';

const CATS = ['Website Development', 'Ecommerce', 'Social Media', 'AI Automation'];

export function PortfolioPage() {
  const site = useSite(); const c = site.pages.portfolio?.content ?? {};
  const [cat, setCat] = useState('All');
  useMeta(pageTitle(site, 'portfolio', 'Portfolio'), site.pages.portfolio?.seoDescription);
  const list = cat === 'All' ? site.portfolio : site.portfolio.filter((p) => p.category === cat);
  return (
    <>
      <PageHero eyebrow="Portfolio" title={c.headline ?? 'Our Work'} text={c.text} />
      <section className="bg-white py-12 sm:py-16">
        <div className="container-x">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {['All', ...CATS].map((k) => <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${cat === k ? 'border-brand bg-brand text-white' : 'border-brand-line text-slate-700 hover:border-brand hover:text-brand'}`}>{k}</button>)}
          </div>
          {list.length === 0 ? <p className="mt-10 rounded-2xl border border-dashed border-brand-line p-10 text-center text-brand-muted">No projects in this category yet.</p> : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <Link key={p.id} to={`/portfolio/${p.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="aspect-[16/10] overflow-hidden"><ProjectCover p={p} /></div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide"><span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">{p.category}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{KIND_LABEL[p.kind]}</span></div>
                    <h2 className="mt-3 text-lg font-extrabold">{p.title}</h2>
                    <p className="mt-1.5 flex-1 text-sm text-brand-muted">{p.summary}</p>
                    {p.technologies.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{p.technologies.slice(0, 4).map((t) => <span key={t} className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-deep">{t}</span>)}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <CtaBand title="Have a project in mind?" text="Let's discuss your next digital project." button="Start Your Project" href="/contact?intent=quote" />
    </>
  );
}

export function ProjectDetail({ slug }: { slug: string }) {
  const site = useSite(); const p = site.portfolio.find((x) => x.slug === slug);
  useMeta(p ? p.seo_title || `${p.title} | ${site.settings.site_name}` : 'Project not found', p?.seo_description || p?.summary);
  if (!p) return <NotFound />;
  const paras = p.description.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      <PageHero eyebrow={p.category} title={p.title} text={p.summary}>
        <div className="mt-5 flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-200">{KIND_LABEL[p.kind]}</span>
          {p.project_url && <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="btn-primary !px-4 !py-2">Visit project <Icon name="external" className="h-4 w-4" /></a>}</div>
      </PageHero>
      <section className="bg-white py-12 sm:py-16">
        <div className="container-x grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-brand-line shadow-card"><ProjectCover p={p} large /></div>
            {p.images.length > 0 && <div className="mt-5 grid gap-4 sm:grid-cols-2">{p.images.map((im, i) => <img key={i} src={im.url} alt={im.alt || `${p.title} screenshot ${i + 1}`} loading="lazy" decoding="async" className="w-full rounded-xl border border-brand-line" />)}</div>}
          </div>
          <div>
            <h2 className="h2">About this project</h2>
            <div className="prose-n mt-4">{paras.map((t, i) => <p key={i}>{t}</p>)}</div>
            {p.kind !== 'client' && <div className="mt-4"><Notice>{p.kind === 'demo' ? 'This is a concept/demo project built by Noorix, not a paid client project.' : 'This is an internal Noorix project, not a paid client project.'}</Notice></div>}
            {p.technologies.length > 0 && <div className="mt-6"><h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Technologies</h3><div className="mt-3 flex flex-wrap gap-2">{p.technologies.map((t) => <span key={t} className="rounded-lg bg-brand-soft px-3 py-1 text-sm font-semibold text-brand-deep">{t}</span>)}</div></div>}
            <Link to="/portfolio" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-brand"><Icon name="arrow" className="h-4 w-4 rotate-180" />Back to portfolio</Link>
          </div>
        </div>
      </section>
      <CtaBand title="Want something like this?" text="Let's discuss your next digital project." button="Start Your Project" href="/contact?intent=quote" />
    </>
  );
}
