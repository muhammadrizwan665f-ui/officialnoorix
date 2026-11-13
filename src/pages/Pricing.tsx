import { useState } from 'react';
import { Link } from '../lib/router';
import { useSite, pageTitle } from '../lib/data';
import { useMeta } from '../lib/meta';
import { PageHero, Notice } from '../components/ui';
import { PackageCard } from '../components/Pricing';
import { Icon } from '../components/Icon';

export default function PricingPage() {
  const site = useSite(); const c = site.pages.pricing?.content ?? {};
  const [cur, setCur] = useState<'USD' | 'PKR'>(site.settings.default_currency === 'PKR' ? 'PKR' : 'USD');
  useMeta(pageTitle(site, 'pricing', 'Pricing'), site.pages.pricing?.seoDescription);
  const cats = [...new Set(site.packages.map((p) => p.category))];
  const slug = (s: string) => 'cat-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return (
    <>
      <PageHero eyebrow="Pricing" title={c.headline ?? 'Pricing'} text={c.text}>
        <div className="mt-7 inline-flex rounded-xl border border-white/20 bg-white/10 p-1" role="group" aria-label="Currency">
          {(['USD', 'PKR'] as const).map((k) => <button key={k} type="button" aria-pressed={cur === k} onClick={() => setCur(k)} className={`rounded-lg px-5 py-2 text-sm font-bold transition ${cur === k ? 'bg-white text-brand-deep' : 'text-white/80 hover:text-white'}`}>{k}</button>)}
        </div>
      </PageHero>
      {cats.length > 1 && (
        <div className="sticky top-16 z-30 border-b border-brand-line bg-white/95 backdrop-blur">
          <div className="container-x flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
            {cats.map((k) => <a key={k} href={'#' + slug(k)} className="shrink-0 rounded-full border border-brand-line px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand">{k}</a>)}
          </div>
        </div>
      )}
      <div className="bg-white py-12 sm:py-16">
        <div className="container-x space-y-16">
          {cur === 'PKR' && <Notice>PKR prices are set manually by Noorix for the Pakistan market and are not an automatic currency conversion. Where no PKR price is shown, request a custom PKR quote.</Notice>}
          {cats.map((k) => (
            <section key={k} id={slug(k)} className="scroll-mt-36">
              <h2 className="h2">{k}</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{site.packages.filter((p) => p.category === k).map((p) => <PackageCard key={p.id} p={p} cur={cur} />)}</div>
            </section>
          ))}
          {cats.length === 0 && <p className="text-center text-brand-muted">Pricing will be published soon. Please contact us for a quote.</p>}
          {c.notes?.length > 0 && (
            <section className="card bg-brand-soft p-6 sm:p-8">
              <h2 className="text-xl font-extrabold">{c.notesTitle ?? 'Included and excluded'}</h2>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-700">{c.notes.map((n: string, i: number) => <li key={i} className="flex gap-2.5"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{n}</li>)}</ul>
            </section>
          )}
          <section className="rounded-3xl bg-brand-ink p-8 text-center text-white sm:p-12">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Need something different?</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-300">Tell us what you need and we will prepare a custom quote{cur === 'PKR' ? ' in PKR' : ''}.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/contact?intent=quote" className="btn-primary">Request Custom Quote</Link>
              <Link to="/contact?intent=quote&currency=PKR" className="btn-ghost-dark">Pakistan Market Quote (PKR)</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
