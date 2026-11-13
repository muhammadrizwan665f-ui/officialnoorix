import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, usePath } from '../lib/router';
import { useSite, waLink } from '../lib/data';
import { Icon } from './Icon';
import { Logo } from './Brand';

function NavLink({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  const path = usePath();
  const active = to === '/' ? path === '/' : path === to || path.startsWith(to + '/');
  return <Link to={to} onClick={onClick} aria-current={active ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? 'text-brand' : 'text-slate-700 hover:text-brand'}`}>{children}</Link>;
}

function Header() {
  const { services, hasBlog } = useSite();
  const path = usePath();
  const [open, setOpen] = useState(false);
  const [dd, setDd] = useState(false);
  const [mobSvc, setMobSvc] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); setDd(false); }, [path]);
  useEffect(() => { const on = () => setScrolled(window.scrollY > 8); on(); window.addEventListener('scroll', on, { passive: true }); return () => window.removeEventListener('scroll', on); }, []);
  useEffect(() => {
    const out = (e: MouseEvent) => { if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDd(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDd(false); setOpen(false); } };
    document.addEventListener('mousedown', out); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', out); document.removeEventListener('keydown', esc); };
  }, []);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  const svcActive = services.some((s) => path === '/' + s.slug) || path === '/services';
  return (
    <header className={`sticky top-0 z-40 border-b bg-white/90 backdrop-blur transition ${scrolled ? 'border-brand-line shadow-sm' : 'border-transparent'}`}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
          <div ref={ddRef} className="relative" onMouseEnter={() => setDd(true)} onMouseLeave={() => setDd(false)}>
            <button type="button" aria-expanded={dd} aria-haspopup="true" onClick={() => setDd((v) => !v)} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${svcActive ? 'text-brand' : 'text-slate-700 hover:text-brand'}`}>
              Services <Icon name="chevron" className={`h-4 w-4 transition ${dd ? 'rotate-180' : ''}`} />
            </button>
            {dd && (
              <div className="absolute left-1/2 top-full w-[340px] -translate-x-1/2 pt-2">
                <div className="card p-2 shadow-xl">
                  {services.map((s) => (
                    <Link key={s.id} to={'/' + s.slug} className="flex items-start gap-3 rounded-xl p-2.5 transition hover:bg-brand-soft">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name={s.icon} className="h-[18px] w-[18px]" /></span>
                      <span><span className="block text-sm font-bold">{s.title}</span><span className="line-clamp-1 text-xs text-brand-muted">{s.summary}</span></span>
                    </Link>
                  ))}
                  <Link to="/services" className="mt-1 flex items-center justify-between rounded-xl bg-brand-soft px-3 py-2.5 text-sm font-bold text-brand">All services <Icon name="arrow" className="h-4 w-4" /></Link>
                </div>
              </div>
            )}
          </div>
          <NavLink to="/portfolio">Portfolio</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          {hasBlog && <NavLink to="/blog">Blog</NavLink>}
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/contact?intent=quote" className="btn-primary hidden !px-4 !py-2.5 sm:inline-flex">Get a Quote</Link>
          <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line lg:hidden" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
            <Icon name={open ? 'x' : 'menu'} />
          </button>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-white lg:hidden">
          <nav className="container-x flex flex-col gap-1 py-4" aria-label="Mobile">
            {[['/', 'Home'], ['/about', 'About']].map(([to, l]) => <Link key={to} to={to} className="rounded-xl px-3 py-3.5 text-base font-bold hover:bg-brand-soft">{l}</Link>)}
            <button type="button" aria-expanded={mobSvc} onClick={() => setMobSvc((v) => !v)} className="flex items-center justify-between rounded-xl px-3 py-3.5 text-left text-base font-bold hover:bg-brand-soft">
              Services <Icon name="chevron" className={`h-5 w-5 transition ${mobSvc ? 'rotate-180' : ''}`} />
            </button>
            {mobSvc && (
              <div className="mb-1 ml-3 flex flex-col border-l-2 border-brand/20 pl-3">
                {services.map((s) => <Link key={s.id} to={'/' + s.slug} className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm font-semibold text-slate-700"><Icon name={s.icon} className="h-4 w-4 text-brand" />{s.title}</Link>)}
                <Link to="/services" className="px-2 py-2.5 text-sm font-bold text-brand">View all services →</Link>
              </div>
            )}
            {[['/portfolio', 'Portfolio'], ['/pricing', 'Pricing'], ...(hasBlog ? [['/blog', 'Blog']] : []), ['/faq', 'FAQ'], ['/contact', 'Contact']].map(([to, l]) => <Link key={to} to={to} className="rounded-xl px-3 py-3.5 text-base font-bold hover:bg-brand-soft">{l}</Link>)}
            <Link to="/contact?intent=quote" className="btn-primary mt-3 w-full">Get a Quote</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

const SOCIALS: [string, string][] = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['x', 'X'], ['youtube', 'YouTube'], ['tiktok', 'TikTok']];

function Footer() {
  const { settings: s, services, hasBlog } = useSite();
  const wa = waLink(s.whatsapp);
  const socials = SOCIALS.filter(([k]) => s[k]);
  return (
    <footer className="bg-brand-ink text-slate-300">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">{s.footer_description}</p>
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socials.map(([k, l]) => <a key={k} href={s[k]} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-brand hover:text-white">{l}</a>)}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Services</h3>
          <ul className="mt-4 space-y-2.5 text-sm">{services.map((v) => <li key={v.id}><Link to={'/' + v.slug} className="transition hover:text-white">{v.title}</Link></li>)}</ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[['/about', 'About Us'], ['/portfolio', 'Portfolio'], ['/pricing', 'Pricing'], ['/faq', 'FAQ'], ...(hasBlog ? [['/blog', 'Blog']] : []), ['/contact', 'Contact']].map(([to, l]) => <li key={to}><Link to={to} className="transition hover:text-white">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {s.email && <li className="flex gap-2.5"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><a href={`mailto:${s.email}`} className="break-all transition hover:text-white">{s.email}</a></li>}
            {wa && <li className="flex gap-2.5"><Icon name="chat" className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><a href={wa} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">WhatsApp +{s.whatsapp}</a></li>}
            {s.phone && <li className="flex gap-2.5"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><a href={`tel:${s.phone.replace(/\s/g, '')}`} className="transition hover:text-white">{s.phone}</a></li>}
            {s.address && <li className="flex gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span>{s.address}</span></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {s.site_name}. All rights reserved.</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            {[['/privacy-policy', 'Privacy Policy'], ['/terms', 'Terms & Conditions'], ['/refund-policy', 'Refund Policy']].map(([to, l]) => <li key={to}><Link to={to} className="transition hover:text-white">{l}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { settings: s } = useSite();
  const wa = waLink(s.whatsapp);
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp" className="fixed bottom-4 right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105 sm:bottom-6 sm:right-6">
          <Icon name="chat" className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
