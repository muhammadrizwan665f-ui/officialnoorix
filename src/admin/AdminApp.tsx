import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNav, usePath } from '../lib/router';
import { api, setCsrf } from '../lib/api';
import { Icon } from '../components/Icon';
import { Card, ErrorBox, PageTitle, Spinner, Toaster, toast, useLoad } from './kit';
import ResourcePage from './Resources';
import Inquiries, { StatusPill } from './Inquiries';
import { PageEditor, SeoPage, SettingsPage, SETTINGS_SECTIONS, SOCIAL_SCHEMA, FOOTER_SCHEMA } from './Pages';

interface Me { needsSetup: boolean; user: { name: string; email: string } | null; csrf: string }

function Login({ needsSetup, onDone }: { needsSetup: boolean; onDone: () => void }) {
  const [f, setF] = useState({ name: '', email: '', password: '', token: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r: any = await api(needsSetup ? '/api/admin/setup' : '/api/admin/login', { body: f }); setCsrf(r.csrf); onDone(); }
    catch (ex: any) { setErr(ex.message); } finally { setBusy(false); }
  }
  return (
    <div className="grid min-h-screen place-items-center bg-brand-ink p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-6 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-deep text-xl font-extrabold text-white">N</span>
          <h1 className="mt-4 text-2xl font-extrabold">{needsSetup ? 'Create admin account' : 'Admin sign in'}</h1><p className="mt-1 text-sm text-slate-500">{needsSetup ? 'One-time setup. You need the SETUP_TOKEN secret.' : 'Noorix Digital Lab dashboard'}</p></div>
        <div className="space-y-4">
          {needsSetup && <div><label className="label" htmlFor="a-name">Your name</label><input id="a-name" className="field" autoComplete="name" required value={f.name} onChange={set('name')} /></div>}
          <div><label className="label" htmlFor="a-email">Email</label><input id="a-email" type="email" className="field" autoComplete="username" required value={f.email} onChange={set('email')} /></div>
          <div><label className="label" htmlFor="a-pw">Password</label><input id="a-pw" type="password" className="field" autoComplete={needsSetup ? 'new-password' : 'current-password'} required minLength={needsSetup ? 10 : 1} value={f.password} onChange={set('password')} />{needsSetup && <p className="mt-1 text-xs text-slate-500">At least 10 characters, with letters and numbers.</p>}</div>
          {needsSetup && <div><label className="label" htmlFor="a-tok">Setup token</label><input id="a-tok" type="password" className="field" autoComplete="off" required value={f.token} onChange={set('token')} /></div>}
          {err && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : needsSetup ? 'Create account' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  );
}

function Overview() {
  const { data, err, reload } = useLoad<any>('/api/admin/overview');
  if (err) return <ErrorBox msg={err} retry={reload} />;
  if (!data) return <Spinner />;
  const stats = [['Total inquiries', data.inquiries.total, 'inbox'], ['New', data.inquiries.new, 'bolt'], ['In progress', data.inquiries.inProgress, 'chart'], ['Completed (won/lost)', data.inquiries.completed, 'check'], ['Published projects', data.publishedProjects, 'layout'], ['Active services', data.activeServices, 'workflow']];
  return (
    <div>
      <PageTitle title="Overview" desc="A live summary of your website content and leads." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map(([l, n, ic]) => <Card key={l as string} className="!p-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name={ic as string} className="h-[18px] w-[18px]" /></span><p className="mt-3 text-3xl font-extrabold">{n as number}</p><p className="text-xs font-semibold text-slate-500">{l as string}</p></Card>)}
      </div>
      <Card className="mt-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">Recent inquiries</h2><Link to="/admin/inquiries" className="text-sm font-bold text-brand">View all →</Link></div>
        {data.recent.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No inquiries yet. When someone submits the contact form it will appear here.</p> : (
          <ul className="divide-y divide-brand-line">{data.recent.map((r: any) => <li key={r.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate font-bold">{r.name}</p><p className="truncate text-xs text-slate-500">{r.service} · {r.created_at}</p></div><StatusPill s={r.status} /></li>)}</ul>
        )}
      </Card>
      <p className="mt-4 text-xs text-slate-500">Visitor analytics are not connected, so no traffic numbers are shown.</p>
    </div>
  );
}

function Profile({ me }: { me: Me['user'] }) {
  const [name, setName] = useState(me?.name ?? ''); const [pw, setPw] = useState({ current: '', next: '' }); const [err, setErr] = useState('');
  async function saveName(e: FormEvent) { e.preventDefault(); try { await api('/api/admin/profile', { method: 'PUT', body: { name } }); toast('Profile updated'); } catch (x: any) { toast(x.message, 'err'); } }
  async function savePw(e: FormEvent) { e.preventDefault(); setErr(''); try { await api('/api/admin/password', { method: 'PUT', body: pw }); setPw({ current: '', next: '' }); toast('Password changed. Other devices were signed out.'); } catch (x: any) { setErr(x.message); } }
  return (
    <div className="space-y-5">
      <PageTitle title="Admin Profile" desc={me?.email} />
      <Card><form onSubmit={saveName} className="max-w-md space-y-3"><label className="label" htmlFor="pn">Display name</label><input id="pn" className="field" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /><button className="btn-primary">Save name</button></form></Card>
      <Card><form onSubmit={savePw} className="max-w-md space-y-3"><h2 className="font-extrabold">Change password</h2>
        <div><label className="label" htmlFor="cp">Current password</label><input id="cp" type="password" autoComplete="current-password" className="field" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div><label className="label" htmlFor="np">New password</label><input id="np" type="password" autoComplete="new-password" className="field" required minLength={10} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /><p className="mt-1 text-xs text-slate-500">At least 10 characters, with letters and numbers.</p></div>
        {err && <p role="alert" className="text-sm font-semibold text-red-600">{err}</p>}<button className="btn-primary">Change password</button></form></Card>
    </div>
  );
}

function Security({ logout }: { logout: (all: boolean) => void }) {
  return (
    <div className="space-y-5">
      <PageTitle title="Security / Logout" desc="Sessions expire automatically after 8 hours." />
      <Card className="max-w-xl"><div className="flex flex-col gap-3 sm:flex-row"><button className="btn-dark" onClick={() => logout(false)}><Icon name="logout" className="h-4 w-4" />Sign out</button><button className="btn-ghost" onClick={() => logout(true)}>Sign out of all devices</button></div>
        <ul className="mt-5 list-disc space-y-1.5 pl-5 text-sm text-slate-600"><li>Passwords are stored hashed, never in plain text.</li><li>Sign-in attempts are rate limited.</li><li>Changing your password signs out every other device.</li></ul></Card>
    </div>
  );
}

const NAV: [string, string, string][] = [
  ['/admin/dashboard', 'Overview', 'dashboard'], ['/admin/settings', 'Website Settings', 'settings'], ['/admin/homepage', 'Homepage Editor', 'layout'], ['/admin/about', 'About Page', 'users'],
  ['/admin/services', 'Services', 'workflow'], ['/admin/pricing', 'Pricing & Packages', 'dollar'], ['/admin/portfolio', 'Portfolio', 'image'], ['/admin/testimonials', 'Testimonials', 'quote'],
  ['/admin/faqs', 'FAQs', 'help'], ['/admin/inquiries', 'Contact Inquiries', 'inbox'], ['/admin/blog', 'Blog / Articles', 'file'], ['/admin/seo', 'SEO Settings', 'search'],
  ['/admin/social', 'Social Media Links', 'share'], ['/admin/footer', 'Navigation & Footer', 'menu'], ['/admin/legal', 'Legal & Page Text', 'file'], ['/admin/profile', 'Admin Profile', 'user'], ['/admin/security', 'Security / Logout', 'lock'],
];

function Shell({ me, logout }: { me: NonNullable<Me['user']>; logout: (all: boolean) => void }) {
  const path = usePath(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const page = path.replace('/admin/', '');
  let body: ReactNode;
  switch (page) {
    case 'dashboard': body = <Overview />; break;
    case 'settings': body = <SettingsPage title="Website Settings" desc="Brand, contact details and defaults used across the website." sections={SETTINGS_SECTIONS} />; break;
    case 'homepage': body = <PageEditor slugs={[{ slug: 'home', label: 'Homepage' }]} title="Homepage Editor" desc="Edit every section of the homepage. Featured portfolio, pricing and FAQ items are chosen in their own sections." />; break;
    case 'about': body = <PageEditor slugs={[{ slug: 'about', label: 'About' }]} title="About Page" />; break;
    case 'services': case 'faqs': case 'portfolio': case 'testimonials': case 'blog': body = <ResourcePage key={page} res={page} />; break;
    case 'pricing': body = <div className="space-y-8"><ResourcePage res="packages" /><PageEditor slugs={[{ slug: 'pricing', label: 'Pricing page text' }]} title="Pricing page text" /></div>; break;
    case 'inquiries': body = <Inquiries />; break;
    case 'seo': body = <SeoPage />; break;
    case 'social': body = <SettingsPage title="Social Media Links" desc="Links appear in the footer and contact page. Empty ones are hidden." schema={SOCIAL_SCHEMA} />; break;
    case 'footer': body = <div className="space-y-5"><SettingsPage title="Navigation & Footer" desc="The main menu is built automatically from your published services. Edit the footer text here; contact details come from Website Settings." schema={FOOTER_SCHEMA} /></div>; break;
    case 'legal': body = <PageEditor title="Legal & Page Text" desc="Privacy Policy, Terms, Refund Policy and the intro text of other pages. Have legal pages reviewed by a professional." slugs={[{ slug: 'privacy-policy', label: 'Privacy Policy' }, { slug: 'terms', label: 'Terms' }, { slug: 'refund-policy', label: 'Refund Policy' }, { slug: 'services', label: 'Services intro' }, { slug: 'portfolio', label: 'Portfolio intro' }, { slug: 'contact', label: 'Contact intro' }, { slug: 'faq', label: 'FAQ intro' }, { slug: 'blog', label: 'Blog intro' }]} />; break;
    case 'profile': body = <Profile me={me} />; break;
    case 'security': body = <Security logout={logout} />; break;
    default: body = <Card className="text-center">This admin page does not exist. <Link to="/admin/dashboard" className="font-bold text-brand">Go to the overview</Link></Card>;
  }
  const side = (
    <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
      {NAV.map(([to, l, ic]) => { const on = path === to; return <Link key={to} to={to} aria-current={on ? 'page' : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${on ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><Icon name={ic} className="h-[18px] w-[18px]" />{l}</Link>; })}
    </nav>
  );
  return (
    <div className="min-h-screen bg-slate-100 lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-brand-ink lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-brand font-extrabold text-white">N</span><span className="text-sm font-extrabold text-white">Noorix Admin</span></div>{side}
        <div className="border-t border-white/10 p-3"><button onClick={() => logout(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"><Icon name="logout" className="h-[18px] w-[18px]" />Sign out</button></div>
      </aside>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-brand-line bg-white px-4 lg:px-8">
        <button className="grid h-10 w-10 place-items-center rounded-xl border border-brand-line lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button>
        <span className="text-sm font-bold text-slate-500 lg:hidden">Noorix Admin</span>
        <div className="ml-auto flex items-center gap-3 text-sm"><a href="/" target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1 font-semibold text-brand sm:flex">View site <Icon name="external" className="h-3.5 w-3.5" /></a><span className="hidden font-semibold text-slate-600 sm:inline">{me.name}</span></div>
      </header>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-brand-ink"><div className="flex h-14 items-center justify-between border-b border-white/10 px-4"><span className="font-extrabold text-white">Noorix Admin</span><button aria-label="Close menu" className="text-white" onClick={() => setOpen(false)}><Icon name="x" /></button></div>{side}<div className="border-t border-white/10 p-3"><button onClick={() => logout(false)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300"><Icon name="logout" className="h-[18px] w-[18px]" />Sign out</button></div></aside></div>}
      <main className="mx-auto max-w-6xl p-4 pb-16 sm:p-6 lg:p-8">{body}</main>
    </div>
  );
}

export default function AdminApp() {
  const { go } = useNav(); const path = usePath();
  const [me, setMe] = useState<Me | null>(null); const [err, setErr] = useState('');
  const load = () => api<Me>('/api/admin/status').then((m) => { setCsrf(m.csrf); setMe(m); }).catch((e) => setErr(e.message));
  useEffect(() => { load(); document.title = 'Admin | Noorix Digital Lab'; }, []);
  useEffect(() => {
    if (!me) return;
    if (!me.user && path !== '/admin/login') go('/admin/login', true);
    else if (me.user && (path === '/admin' || path === '/admin/login')) go('/admin/dashboard', true);
  }, [me, path]);
  async function logout(all: boolean) { try { await api(all ? '/api/admin/logout-all' : '/api/admin/logout', { method: 'POST', body: {} }); } catch { /* session may already be gone */ } setCsrf(''); await load(); go('/admin/login', true); }
  if (err) return <div className="grid min-h-screen place-items-center p-6"><ErrorBox msg={err} retry={load} /></div>;
  if (!me) return <Spinner />;
  return <><Toaster />{me.user ? <Shell me={me.user} logout={logout} /> : <Login needsSetup={me.needsSetup} onDone={load} />}</>;
}
