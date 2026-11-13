import { useSite, pageTitle } from '../lib/data';
import { useMeta } from '../lib/meta';
import { PageHero } from '../components/ui';
import { Link } from '../lib/router';

export default function Policy({ slug }: { slug: string }) {
  const site = useSite(); const p = site.pages[slug];
  useMeta(pageTitle(site, slug, 'Policy'), p?.seoDescription);
  const secs: { heading: string; body: string }[] = p?.content?.sections ?? [];
  return (
    <>
      <PageHero title={p?.title ?? 'Policy'} />
      <section className="bg-white py-12 sm:py-16"><div className="container-x max-w-3xl">
        <div className="prose-n">{secs.map((s, i) => <div key={i}><h2>{s.heading}</h2>{String(s.body).split(/\n{2,}/).map((t, k) => <p key={k}>{t}</p>)}</div>)}</div>
        <p className="mt-10 rounded-xl bg-brand-soft p-4 text-sm text-slate-700">Questions about this page? <Link to="/contact" className="font-bold text-brand underline">Contact us</Link>{site.settings.email ? <> or email <a className="font-bold text-brand underline" href={`mailto:${site.settings.email}`}>{site.settings.email}</a></> : null}.</p>
      </div></section>
    </>
  );
}
