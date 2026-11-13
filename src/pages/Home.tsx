import { Link } from '../lib/router';
import { useSite, pageTitle } from '../lib/data';
import { useMeta } from '../lib/meta';
import { Icon } from '../components/Icon';
import { HeroVisual } from '../components/HeroVisual';
import { Reveal, SectionHead, Bullet, CtaBand } from '../components/ui';
import { ProjectCover, KIND_LABEL } from '../components/ProjectCover';
import { PackageCard } from '../components/Pricing';
import { FaqList } from './Faq';

export default function Home() {
  const site = useSite();
  const c = site.pages.home?.content ?? {};
  const cur = site.settings.default_currency === 'PKR' ? 'PKR' : 'USD';
  useMeta(pageTitle(site, 'home', 'Home'), site.pages.home?.seoDescription || site.settings.seo_description);
  const featured = site.portfolio.filter((p) => p.featured).slice(0, 3);
  const pricing = site.packages.filter((p) => p.featured).slice(0, 3);
  const faqs = site.faqs.filter((f) => f.on_home).slice(0, 6);
  const words = String(c.hero?.headline ?? '').split(/(?<=\.)\s+/);
  return (
    <>
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_0%,rgba(23,105,255,.35),transparent),radial-gradient(40%_40%_at_0%_100%,rgba(10,43,104,.7),transparent)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="container-x relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            {c.hero?.eyebrow && <span className="eyebrow !border-white/20 !bg-white/10 !text-blue-200">{c.hero.eyebrow}</span>}
            <h1 className="mt-5 text-[2.35rem] font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              {words.map((w, i) => <span key={i} className={`block ${i === words.length - 1 && words.length > 1 ? 'bg-gradient-to-r from-[#5b9bff] to-[#8fc0ff] bg-clip-text text-transparent' : ''}`}>{w}</span>)}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">{c.hero?.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {c.hero?.primary?.label && <Link to={c.hero.primary.href || '/contact'} className="btn-primary">{c.hero.primary.label}<Icon name="arrow" className="h-4 w-4" /></Link>}
              {c.hero?.secondary?.label && <Link to={c.hero.secondary.href || '/services'} className="btn-ghost-dark">{c.hero.secondary.label}</Link>}
            </div>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="bg-white py-16 sm:py-24">
        <div className="container-x">
          <Reveal><SectionHead eyebrow="Who we are" title={c.intro?.title ?? ''} text={c.intro?.text} /></Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {(c.coreServices ?? []).map((s: any, i: number) => (
              <Reveal key={i} delay={i * 80}>
                <div className="card group flex h-full flex-col p-7 transition hover:-translate-y-1 hover:shadow-lift">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white shadow-lift"><Icon name={s.icon} className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-xl font-extrabold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">{s.text}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">{(s.benefits ?? []).map((b: string, k: number) => <Bullet key={k}>{b}</Bullet>)}</ul>
                  <Link to={s.href || '/services'} className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand">Learn More <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-soft py-16 sm:py-24">
        <div className="container-x">
          <Reveal><SectionHead eyebrow="Why Noorix" title={c.whyTitle ?? 'Why Choose Noorix'} /></Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(c.why ?? []).map((w: any, i: number) => (
              <Reveal key={i} delay={(i % 3) * 70}>
                <div className="card flex h-full gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={w.icon || 'check'} /></span>
                  <div><h3 className="font-extrabold">{w.title}</h3><p className="mt-1 text-sm leading-relaxed text-brand-muted">{w.text}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-white py-16 sm:py-24">
          <div className="container-x">
            <Reveal><SectionHead eyebrow="Portfolio" title={c.portfolioTitle ?? 'Featured Work'} text={c.portfolioText} /></Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <Link key={p.id} to={`/portfolio/${p.slug}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="aspect-[16/10] overflow-hidden"><ProjectCover p={p} /></div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide"><span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">{p.category}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{KIND_LABEL[p.kind]}</span></div>
                    <h3 className="mt-3 text-lg font-extrabold">{p.title}</h3>
                    <p className="mt-1.5 line-clamp-3 text-sm text-brand-muted">{p.summary}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center"><Link to="/portfolio" className="btn-ghost">View All Projects</Link></div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden bg-brand-ink py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand/20 blur-[100px]" />
        <div className="container-x relative">
          <SectionHead dark eyebrow="How we work" title={c.processTitle ?? 'Our Process'} />
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(c.process ?? []).map((s: any, i: number) => (
              <li key={i} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
                <span className="text-3xl font-extrabold text-brand">{s.n || String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-3 text-lg font-extrabold">{s.title}</h3><p className="mt-1 text-sm text-slate-300">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {pricing.length > 0 && (
        <section className="bg-white py-16 sm:py-24">
          <div className="container-x">
            <Reveal><SectionHead eyebrow="Pricing" title={c.pricingTitle ?? 'Pricing'} text={c.pricingText} /></Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{pricing.map((p) => <PackageCard key={p.id} p={p} cur={cur} />)}</div>
            <div className="mt-8 text-center"><Link to="/pricing" className="btn-dark">See Full Pricing<Icon name="arrow" className="h-4 w-4" /></Link></div>
          </div>
        </section>
      )}

      {site.testimonials.length > 0 && (
        <section className="bg-brand-soft py-16 sm:py-24">
          <div className="container-x">
            <SectionHead eyebrow="Testimonials" title="What Clients Say" />
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {site.testimonials.map((t) => (
                <figure key={t.id} className="card p-6"><blockquote className="text-sm leading-relaxed text-slate-700">“{t.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm"><b>{t.name}</b>{(t.role || t.company) && <span className="text-brand-muted"> · {[t.role, t.company].filter(Boolean).join(', ')}</span>}</figcaption></figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="bg-brand-soft py-16 sm:py-24">
          <div className="container-x max-w-4xl">
            <Reveal><SectionHead eyebrow="FAQ" title={c.faqTitle ?? 'Frequently Asked Questions'} /></Reveal>
            <div className="mt-10"><FaqList items={faqs} /></div>
            <div className="mt-8 text-center"><Link to="/faq" className="btn-ghost">More Questions</Link></div>
          </div>
        </section>
      )}

      {c.cta && <CtaBand title={c.cta.title} text={c.cta.text} button={c.cta.button} href="/contact?intent=quote" />}
    </>
  );
}
