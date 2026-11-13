import { Link } from '../lib/router';
import { useSite, pageTitle, SERVICE_PACKAGE_CATEGORY } from '../lib/data';
import { useMeta } from '../lib/meta';
import { Icon } from '../components/Icon';
import { PageHero, Reveal, Bullet, CtaBand, Notice, SectionHead } from '../components/ui';
import { PackageCard } from '../components/Pricing';

export function ServicesPage() {
  const site = useSite(); const c = site.pages.services?.content ?? {};
  const proc = site.pages.home?.content?.process ?? [];
  useMeta(pageTitle(site, 'services', 'Services'), site.pages.services?.seoDescription);
  return (
    <>
      <PageHero eyebrow="Services" title={c.headline ?? 'Our Services'} text={c.text} />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-x grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {site.services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 70}>
              <Link to={'/' + s.slug} className="card group flex h-full flex-col p-7 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-lift"><Icon name={s.icon} className="h-6 w-6" /></span>
                <h2 className="mt-5 text-xl font-extrabold">{s.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-muted">{s.summary}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand">Learn more <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      {proc.length > 0 && (
        <section className="bg-brand-soft py-14 sm:py-20">
          <div className="container-x">
            <SectionHead eyebrow="How we work" title="A Clear Process From Idea to Launch" />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{proc.map((s: any, i: number) => <li key={i} className="card p-5"><span className="text-2xl font-extrabold text-brand">{s.n}</span><h3 className="mt-1 font-extrabold">{s.title}</h3><p className="mt-1 text-sm text-brand-muted">{s.text}</p></li>)}</ol>
          </div>
        </section>
      )}
      <CtaBand title="Not sure which service you need?" text="Tell us about your business and we will recommend a practical starting point." button="Get a Free Consultation" href="/contact?intent=consultation" />
    </>
  );
}

export function ServiceDetail({ slug }: { slug: string }) {
  const site = useSite(); const s = site.services.find((x) => x.slug === slug)!;
  useMeta(s.seo_title || `${s.title} | ${site.settings.site_name}`, s.seo_description || s.summary);
  const cat = SERVICE_PACKAGE_CATEGORY[s.slug];
  const pk = cat ? site.packages.filter((p) => p.category === cat) : [];
  const cur = site.settings.default_currency === 'PKR' ? 'PKR' : 'USD';
  const q = new URLSearchParams({ intent: 'quote' });
  const svcMap: Record<string, string> = { 'web-development': 'Business Website', 'ecommerce-development': 'Ecommerce Website', 'social-media-management': 'Social Media Management', 'ai-chatbots': 'AI Chatbot', 'business-automation': 'Business Automation', 'hosting-maintenance': 'Hosting & Maintenance' };
  if (svcMap[s.slug]) q.set('service', svcMap[s.slug]);
  return (
    <>
      <PageHero eyebrow={s.title} title={s.headline || s.title} text={s.summary}>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link to={`/contact?${q}`} className="btn-primary">Get a Quote<Icon name="arrow" className="h-4 w-4" /></Link><Link to="/pricing" className="btn-ghost-dark">View Pricing</Link></div>
      </PageHero>
      <section className="bg-white py-14 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-lift"><Icon name={s.icon} className="h-7 w-7" /></span>
            <h2 className="h2 mt-5">What you get</h2>
            {s.description && <p className="lead mt-3">{s.description}</p>}
            {s.image && <img src={s.image} alt={s.title} loading="lazy" decoding="async" className="mt-6 w-full rounded-2xl border border-brand-line" />}
            {s.benefits.length > 0 && <div className="mt-8 grid gap-3 sm:grid-cols-2">{s.benefits.map((b, i) => <div key={i} className="card flex gap-3 p-4"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name="check" className="h-4 w-4" strokeWidth={3} /></span><p className="text-sm font-semibold leading-snug">{b}</p></div>)}</div>}
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {s.includes.length > 0 && <div className="card p-6"><h3 className="font-extrabold">What's included</h3><ul className="mt-4 space-y-2.5">{s.includes.map((x, i) => <Bullet key={i}>{x}</Bullet>)}</ul></div>}
            {s.notes && <Notice>{s.notes}</Notice>}
          </aside>
        </div>
      </section>
      {pk.length > 0 && (
        <section className="bg-brand-soft py-14 sm:py-20">
          <div className="container-x">
            <SectionHead eyebrow="Pricing" title={`${cat} Packages`} text="Starting prices. Third-party costs are not included unless stated." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{pk.map((p) => <PackageCard key={p.id} p={p} cur={cur} />)}</div>
          </div>
        </section>
      )}
      <CtaBand title="Ready to Build Something Great?" text="Let's discuss your next digital project." button="Start Your Project" href={`/contact?${q}`} />
    </>
  );
}
