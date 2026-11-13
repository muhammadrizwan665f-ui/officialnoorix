import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { Card, ErrorBox, PageTitle, Spinner, toast, useConfirm } from './kit';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];
const TONE: Record<string, string> = { New: 'bg-blue-100 text-blue-700', Contacted: 'bg-amber-100 text-amber-800', Qualified: 'bg-violet-100 text-violet-700', 'Proposal Sent': 'bg-cyan-100 text-cyan-800', Won: 'bg-emerald-100 text-emerald-700', Lost: 'bg-slate-200 text-slate-600' };
export const StatusPill = ({ s }: { s: string }) => <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONE[s] ?? ''}`}>{s}</span>;
const when = (d: string) => new Date(d.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const SERVICES = ['Business Website', 'Ecommerce Website', 'Social Media Management', 'AI Chatbot', 'Business Automation', 'Hosting & Maintenance', 'Other'];

export default function Inquiries() {
  const [f, setF] = useState({ q: '', status: '', service: '', country: '', page: 1 });
  const [qIn, setQIn] = useState('');
  const [res, setRes] = useState<any>(null); const [err, setErr] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && !(k === 'page' && v === 1)).map(([k, v]) => [k, String(v)]));
  const load = () => { setErr(''); api(`/api/admin/inquiries?${qs}`).then(setRes).catch((e) => setErr(e.message)); };
  useEffect(load, [f.q, f.status, f.service, f.country, f.page]);
  useEffect(() => { const t = setTimeout(() => setF((x) => ({ ...x, q: qIn, page: 1 })), 350); return () => clearTimeout(t); }, [qIn]);
  const set = (k: string) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value, page: 1 }));
  const pages = res ? Math.max(1, Math.ceil(res.total / res.limit)) : 1;
  const exportQs = new URLSearchParams([...qs].filter(([k]) => k !== 'page'));

  if (open) return <Detail id={open} onBack={() => { setOpen(null); load(); }} />;
  return (
    <div>
      <PageTitle title="Contact Inquiries" desc="Leads submitted through the website contact form."><a className="btn-ghost !py-2.5" href={`/api/admin/inquiries-export.csv?${exportQs}`}><Icon name="download" className="h-4 w-4" />Export CSV</a></PageTitle>
      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative"><Icon name="search" className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="Search inquiries" className="field !pl-9" placeholder="Search name, email, message…" value={qIn} onChange={(e) => setQIn(e.target.value)} /></div>
          <select aria-label="Filter by status" className="field" value={f.status} onChange={set('status')}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Filter by service" className="field" value={f.service} onChange={set('service')}><option value="">All services</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Filter by country" className="field" value={f.country} onChange={set('country')}><option value="">All countries</option>{res?.countries?.map((c: string) => <option key={c}>{c}</option>)}</select>
        </div>
      </Card>
      {err && <ErrorBox msg={err} retry={load} />}
      {!res && !err && <Spinner />}
      {res && res.items.length === 0 && <Card className="py-12 text-center text-slate-500">No inquiries match these filters yet.</Card>}
      {res && res.items.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-brand-line bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Received</th><th className="p-3">Name</th><th className="p-3">Service</th><th className="p-3">Country</th><th className="p-3">Status</th></tr></thead>
              <tbody>{res.items.map((r: any) => (
                <tr key={r.id} className="cursor-pointer border-t border-brand-line hover:bg-brand-soft" onClick={() => setOpen(r.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(r.id)}>
                  <td className="whitespace-nowrap p-3 text-slate-500">{when(r.created_at)}</td><td className="p-3"><b>{r.name}</b><span className="block text-xs text-slate-500">{r.email}</span></td><td className="p-3">{r.service}</td><td className="p-3">{r.country}</td><td className="p-3"><StatusPill s={r.status} /></td>
                </tr>))}</tbody>
            </table>
          </div>
          <div className="space-y-2.5 md:hidden">{res.items.map((r: any) => (
            <button key={r.id} onClick={() => setOpen(r.id)} className="block w-full rounded-2xl border border-brand-line bg-white p-4 text-left shadow-card">
              <span className="flex items-start justify-between gap-2"><b>{r.name}</b><StatusPill s={r.status} /></span>
              <span className="mt-1 block text-xs text-slate-500">{r.email} · {r.country}</span><span className="mt-1 block text-sm">{r.service}</span><span className="mt-1 block text-xs text-slate-400">{when(r.created_at)}</span>
            </button>))}</div>
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>{res.total} inquir{res.total === 1 ? 'y' : 'ies'}</span>
            <span className="flex items-center gap-2"><button className="btn-ghost !px-3 !py-1.5" disabled={f.page <= 1} onClick={() => setF((x) => ({ ...x, page: x.page - 1 }))}>Previous</button>Page {f.page} of {pages}<button className="btn-ghost !px-3 !py-1.5" disabled={f.page >= pages} onClick={() => setF((x) => ({ ...x, page: x.page + 1 }))}>Next</button></span>
          </div>
        </>
      )}
    </div>
  );
}

function Detail({ id, onBack }: { id: string; onBack: () => void }) {
  const [d, setD] = useState<any>(null); const [err, setErr] = useState(''); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false);
  const [confirm, node] = useConfirm();
  const load = () => api(`/api/admin/inquiries/${id}`).then(setD).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, [id]);
  async function status(s: string) { try { await api(`/api/admin/inquiries/${id}`, { method: 'PATCH', body: { status: s } }); toast('Status updated'); load(); } catch (e: any) { toast(e.message, 'err'); } }
  async function addNote() { if (!note.trim()) return; setBusy(true); try { await api(`/api/admin/inquiries/${id}/notes`, { body: { note } }); setNote(''); load(); } catch (e: any) { toast(e.message, 'err'); } finally { setBusy(false); } }
  async function del() { if (!(await confirm(`Delete the inquiry from ${d.name}? This cannot be undone.`))) return; try { await api(`/api/admin/inquiries/${id}`, { method: 'DELETE' }); toast('Inquiry deleted'); onBack(); } catch (e: any) { toast(e.message, 'err'); } }
  if (err) return <div><button className="btn-ghost mb-4" onClick={onBack}>← Back</button><ErrorBox msg={err} /></div>;
  if (!d) return <Spinner />;
  const row = (l: string, v: string) => v ? <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{l}</dt><dd className="mt-0.5 break-words text-sm">{v}</dd></div> : null;
  return (
    <div>
      {node}
      <PageTitle title={d.name} desc={`Received ${when(d.created_at)}`}><button className="btn-ghost !py-2" onClick={onBack}>← Back to inquiries</button></PageTitle>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <dl className="grid gap-4 sm:grid-cols-2">{row('Email', d.email)}{row('Business', d.business)}{row('Phone / WhatsApp', d.phone)}{row('Country', d.country)}{row('Service', d.service)}{row('Budget', d.budget)}</dl>
          <h2 className="mt-6 text-xs font-bold uppercase tracking-wide text-slate-500">Project description</h2>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed">{d.message}</p>
          <div className="mt-5 flex flex-wrap gap-2"><a className="btn-primary !py-2" href={`mailto:${d.email}`}><Icon name="mail" className="h-4 w-4" />Reply by email</a>
            {d.phone && <a className="btn-ghost !py-2" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${d.phone.replace(/\D/g, '')}`}><Icon name="chat" className="h-4 w-4" />WhatsApp</a>}
            <button className="btn-ghost !py-2 !text-red-600" onClick={del}><Icon name="trash" className="h-4 w-4" />Delete</button></div>
        </Card>
        <div className="space-y-5">
          <Card><label className="label" htmlFor="st">Lead status</label><select id="st" className="field" value={d.status} onChange={(e) => status(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Card>
          <Card>
            <h2 className="font-extrabold">Internal notes</h2>
            <textarea aria-label="New note" className="field mt-3" rows={3} placeholder="Add a private note…" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn-dark mt-2 !py-2" disabled={busy || !note.trim()} onClick={addNote}>Add note</button>
            <ul className="mt-4 space-y-3">{d.notes.map((n: any) => <li key={n.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="whitespace-pre-wrap">{n.note}</p><p className="mt-1 text-xs text-slate-500">{n.admin_name} · {when(n.created_at)}</p></li>)}{d.notes.length === 0 && <li className="text-sm text-slate-500">No notes yet.</li>}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
