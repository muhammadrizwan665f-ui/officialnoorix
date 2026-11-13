import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useQuery } from '../lib/router';
import { useSite, pageTitle, waLink } from '../lib/data';
import { useMeta } from '../lib/meta';
import { api } from '../lib/api';
import { PageHero, Notice } from '../components/ui';
import { Icon } from '../components/Icon';

const COUNTRIES = ['Pakistan', 'United States', 'United Kingdom', 'United Arab Emirates', 'Saudi Arabia', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Italy', 'Spain', 'Turkey', 'Qatar', 'Oman', 'Kuwait', 'Bahrain', 'India', 'Bangladesh', 'Malaysia', 'Singapore', 'Indonesia', 'China', 'Japan', 'South Africa', 'Nigeria', 'Egypt', 'Brazil', 'Mexico', 'Ireland', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'New Zealand'];

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } } }

export default function ContactPage() {
  const site = useSite(); const q = useQuery();
  const c = site.pages.contact?.content ?? {}; const s = site.settings;
  useMeta(pageTitle(site, 'contact', 'Contact'), site.pages.contact?.seoDescription);

  const intent = q.get('intent'); const pkg = q.get('package'); const pkr = q.get('currency') === 'PKR';
  const initialMsg = [pkg ? `I am interested in the ${pkg} package.` : '', pkr ? 'Please send the quote in PKR.' : '', intent === 'consultation' && !pkg ? 'I would like to book a free consultation.' : ''].filter(Boolean).join(' ');
  const svcParam = q.get('service') ?? '';
  const [f, setF] = useState({ name: '', business: '', email: '', phone: '', country: pkr ? 'Pakistan' : '', service: site.contactOptions.services.includes(svcParam) ? svcParam : '', budget: '', message: initialMsg, website: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState<string | null>(null);
  const started = useRef(Date.now());
  const [token, setToken] = useState('');
  const tsEl = useRef<HTMLDivElement>(null);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => { // re-apply prefill when the visitor arrives from a different "Get a Quote" link
    setF((p) => ({ ...p, service: site.contactOptions.services.includes(svcParam) ? svcParam : p.service, message: p.message.trim() ? p.message : initialMsg }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svcParam, pkg, intent]);

  useEffect(() => {
    const key = s.turnstile_site_key; if (!key) return;
    const mount = () => { if (tsEl.current && window.turnstile && !tsEl.current.hasChildNodes()) window.turnstile.render(tsEl.current, { sitekey: key, callback: setToken, 'expired-callback': () => setToken(''), 'error-callback': () => setToken('') }); };
    if (window.turnstile) { mount(); return; }
    const sc = document.createElement('script'); sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true; sc.onload = mount; document.head.appendChild(sc);
  }, [s.turnstile_site_key]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr('');
    const miss = !f.name.trim() ? 'Please enter your name.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) ? 'Please enter a valid email address.' : !f.country.trim() ? 'Please enter your country.' : !f.service ? 'Please choose the service you need.' : f.message.trim().length < 10 ? 'Please describe your project (at least 10 characters).' : '';
    if (miss) { setErr(miss); return; }
    if (s.turnstile_site_key && !token) { setErr('Please complete the spam check below the form.'); return; }
    setBusy(true);
    try {
      await api('/api/public/contact', { body: { ...f, elapsedMs: Date.now() - started.current, turnstileToken: token } });
      setDone(f.name.split(' ')[0] || 'there');
    } catch (ex: any) {
      setErr(ex.message || 'Something went wrong. Please try again or contact us on WhatsApp.');
      window.turnstile?.reset(); setToken('');
    } finally { setBusy(false); }
  }

  const wa = waLink(s.whatsapp);
  const head = intent === 'consultation' ? 'Book your free consultation' : intent === 'quote' ? 'Request a quote' : (c.headline ?? "Let's Talk About Your Project");
  return (
    <>
      <PageHero eyebrow="Contact" title={head} text={c.text} />
      <section className="bg-brand-soft py-12 sm:py-16">
        <div className="container-x grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="card p-5 sm:p-8">
            {done ? (
              <div className="py-8 text-center" role="status">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Icon name="check" className="h-8 w-8" strokeWidth={3} /></span>
                <h2 className="mt-5 text-2xl font-extrabold">Thank you, {done}!</h2>
                <p className="mx-auto mt-2 max-w-md text-brand-muted">Your inquiry has been received and saved. We will review it and reply to the email address you provided.</p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/" className="btn-primary">Back to Home</Link>{wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost">Message us on WhatsApp</a>}</div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="space-y-5" aria-busy={busy}>
                <h2 className="text-xl font-extrabold">Tell us about your project</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="c-name">Full name *</label><input id="c-name" className="field" autoComplete="name" required maxLength={100} value={f.name} onChange={set('name')} /></div>
                  <div><label className="label" htmlFor="c-biz">Business name</label><input id="c-biz" className="field" autoComplete="organization" maxLength={120} value={f.business} onChange={set('business')} /></div>
                  <div><label className="label" htmlFor="c-email">Email *</label><input id="c-email" type="email" className="field" autoComplete="email" required maxLength={254} value={f.email} onChange={set('email')} /></div>
                  <div><label className="label" htmlFor="c-phone">WhatsApp / phone</label><input id="c-phone" type="tel" className="field" autoComplete="tel" maxLength={40} placeholder="+92 300 1234567" value={f.phone} onChange={set('phone')} /></div>
                  <div><label className="label" htmlFor="c-country">Country *</label><input id="c-country" className="field" list="countries" autoComplete="country-name" required maxLength={80} value={f.country} onChange={set('country')} /><datalist id="countries">{COUNTRIES.map((x) => <option key={x} value={x} />)}</datalist></div>
                  <div><label className="label" htmlFor="c-service">Service required *</label>
                    <select id="c-service" className="field" required value={f.service} onChange={set('service')}><option value="">Select a service</option>{site.contactOptions.services.map((x) => <option key={x}>{x}</option>)}</select></div>
                  <div className="sm:col-span-2"><label className="label" htmlFor="c-budget">Estimated budget</label>
                    <select id="c-budget" className="field" value={f.budget} onChange={set('budget')}><option value="">Select a range</option>{site.contactOptions.budgets.map((x) => <option key={x}>{x}</option>)}</select></div>
                </div>
                <div><label className="label" htmlFor="c-msg">Project description *</label><textarea id="c-msg" className="field min-h-[140px]" required minLength={10} maxLength={5000} placeholder="What would you like to build or improve? Include any deadlines or links." value={f.message} onChange={set('message')} /></div>
                {/* Honeypot: hidden from people, filled by bots */}
                <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
                {s.turnstile_site_key && <div ref={tsEl} />}
                {err && <Notice kind="error">{err}</Notice>}
                <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">{busy ? 'Sending…' : 'Send Inquiry'}<Icon name="arrow" className="h-4 w-4" /></button>
                <p className="text-xs text-brand-muted">By submitting you agree to our <Link to="/privacy-policy" className="font-semibold text-brand underline">Privacy Policy</Link>. We only use your details to reply to your inquiry.</p>
              </form>
            )}
          </div>
          <aside className="space-y-4">
            <div className="card p-6">
              <h2 className="text-lg font-extrabold">Prefer to talk directly?</h2>
              <div className="mt-4 flex flex-col gap-3">
                {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#25D366] text-white hover:brightness-95"><Icon name="chat" className="h-4 w-4" />Chat on WhatsApp</a>}
                {s.email && <a href={`mailto:${s.email}`} className="btn-ghost"><Icon name="mail" className="h-4 w-4" />Email us</a>}
                {s.booking_url ? <a href={s.booking_url} target="_blank" rel="noopener noreferrer" className="btn-dark"><Icon name="calendar" className="h-4 w-4" />Book a consultation</a> : <Link to="/contact?intent=consultation" className="btn-dark"><Icon name="calendar" className="h-4 w-4" />Book a consultation</Link>}
              </div>
              <ul className="mt-5 space-y-3 border-t border-brand-line pt-5 text-sm">
                {s.email && <li className="flex gap-2.5"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span className="break-all">{s.email}</span></li>}
                {s.whatsapp && <li className="flex gap-2.5"><Icon name="chat" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />+{s.whatsapp}</li>}
                {s.phone && <li className="flex gap-2.5"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{s.phone}</li>}
                {s.address && <li className="flex gap-2.5"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{s.address}</li>}
              </ul>
              {(['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok'] as const).some((k) => s[k]) && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-brand-line pt-5">
                  {([['facebook', 'Facebook'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['x', 'X'], ['youtube', 'YouTube'], ['tiktok', 'TikTok']] as const).filter(([k]) => s[k]).map(([k, l]) => <a key={k} href={s[k]} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-brand-line px-3 py-1.5 text-xs font-bold hover:border-brand hover:text-brand">{l}</a>)}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
