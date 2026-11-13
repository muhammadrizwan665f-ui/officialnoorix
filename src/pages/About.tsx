import { useSite, pageTitle } from '../lib/data';
import { useMeta } from '../lib/meta';
import { Icon } from '../components/Icon';
import { PageHero, Reveal, SectionHead, CtaBand } from '../components/ui';
import { Link } from '../lib/router';

export default function About() {
  const site = useSite(); const c = site.pages.about?.content ?? {};
  useMeta(pageTitle(site, 'about', 'About Us'), site.pages.about?.seoDescription);
  const proc = site.pages.home?.content?.process ?? [];
  return (
    <>
      <PageHero eyebrow="About Us" title={c.headline ?? 'About Us'} />
      <section className="bg-white py-14 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">{(c.paragraphs ?? []).map((p: string, i: number) => <p key={i} className={i === 0 ? 'text-xl font-semibold leading-relaxed' : 'lead'}>{p}</p>)}
            {c.registrationNote && <p className="rounded-xl border border-brand-line bg-brand-soft p-4 text-sm text-slate-700">{c.registrationNote}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {[['Our Mission', c.mission, 'target'], ['Our Vision', c.vision, 'globe']].map(([t, b, ic]) => b ? (
              <div key={t} className="card p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={ic} /></span><h2 className="mt-4 text-xl font-extrabold">{t}</h2><p className="mt-2 text-sm leading-relaxed text-brand-muted">{b}</p></div>
            ) : null)}
          </div>
        </div>
      </section>
      {(c.values ?? []).length > 0 && (
        <section className="bg-brand-soft py-14 sm:py-20"><div className="container-x">
          <SectionHead eyebrow="What guides us" title={c.valuesTitle ?? 'Core Values'} />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{c.values.map((v: any, i: number) => <Reveal key={i} delay={i * 60}><div className="card h-full p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white"><Icon name={v.icon || 'check'} /></span><h3 className="mt-4 font-extrabold">{v.title}</h3><p className="mt-1.5 text-sm text-brand-muted">{v.text}</p></div></Reveal>)}</div>
        </div></section>
      )}
      <section className="bg-white py-14 sm:py-20"><div className="container-x">
        <SectionHead eyebrow="What we do" title="Services Under One Roof" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{site.services.map((s) => <Link key={s.id} to={'/' + s.slug} className="card flex items-center gap-3 p-4 transition hover:border-brand"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name={s.icon} className="h-5 w-5" /></span><span className="font-bold">{s.title}</span></Link>)}</div>
      </div></section>
      {proc.length > 0 && (
        <section className="bg-brand-ink py-14 text-white sm:py-20"><div className="container-x">
          <SectionHead dark eyebrow="How we work" title="Our Process" />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{proc.map((s: any, i: number) => <li key={i} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><span className="text-2xl font-extrabold text-brand">{s.n}</span><h3 className="mt-1 font-extrabold">{s.title}</h3><p className="mt-1 text-sm text-slate-300">{s.text}</p></li>)}</ol>
        </div></section>
      )}
      <CtaBand title="Ready to Build Something Great?" text="Let's discuss your next digital project." button="Start Your Project" href="/contact?intent=quote" />
    </>
  );
}
