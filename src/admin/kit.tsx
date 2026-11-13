import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon, ICON_NAMES } from '../components/Icon';
import { api, uploadImage } from '../lib/api';

// ---------- toasts ----------
type T = { id: number; msg: string; kind: 'ok' | 'err' };
let listeners: ((t: T) => void)[] = []; let tid = 0;
export const toast = (msg: string, kind: 'ok' | 'err' = 'ok') => listeners.forEach((l) => l({ id: ++tid, msg, kind }));
export function Toaster() {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => {
    const l = (t: T) => { setItems((s) => [...s, t]); setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), t.kind === 'err' ? 6000 : 3000); };
    listeners.push(l); return () => { listeners = listeners.filter((x) => x !== l); };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-[92vw] max-w-md -translate-x-1/2 flex-col gap-2" aria-live="polite">
      {items.map((t) => <div key={t.id} role={t.kind === 'err' ? 'alert' : 'status'} className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ${t.kind === 'err' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{t.msg}</div>)}
    </div>
  );
}

// ---------- confirm dialog ----------
export function useConfirm() {
  const [st, setSt] = useState<{ msg: string; ok: (v: boolean) => void; danger: boolean } | null>(null);
  const confirm = (msg: string, danger = true) => new Promise<boolean>((ok) => setSt({ msg, ok, danger }));
  const node = st && (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <p className="font-semibold text-slate-800">{st.msg}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost !py-2" onClick={() => { st.ok(false); setSt(null); }}>Cancel</button>
          <button autoFocus className={`btn !py-2 text-white ${st.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-[#0f57e0]'}`} onClick={() => { st.ok(true); setSt(null); }}>{st.danger ? 'Delete' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
  return [confirm, node] as const;
}

// ---------- schema-driven form ----------
export type FieldDef = {
  key: string; label: string; type: 'text' | 'textarea' | 'select' | 'bool' | 'number' | 'list' | 'image' | 'images' | 'icon' | 'group' | 'objlist';
  options?: string[]; help?: string; fields?: FieldDef[]; itemTitle?: string; placeholder?: string; rows?: number; datalist?: string[]; half?: boolean; req?: boolean;
};
const wide = (f: FieldDef) => !f.half && ['textarea', 'list', 'image', 'images', 'group', 'objlist', 'bool'].includes(f.type) || f.type === 'group' || f.type === 'objlist';

export function Form({ schema, value, onChange }: { schema: FieldDef[]; value: Record<string, any>; onChange: (v: Record<string, any>) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {schema.map((f) => <div key={f.key} className={wide(f) ? 'sm:col-span-2' : ''}><Fld f={f} v={value?.[f.key]} set={(nv) => onChange({ ...value, [f.key]: nv })} /></div>)}
    </div>
  );
}

function Fld({ f, v, set }: { f: FieldDef; v: any; set: (v: any) => void }) {
  const id = 'f-' + f.key + '-' + Math.random().toString(36).slice(2, 7);
  const idRef = useRef(id);
  const lab = <label htmlFor={idRef.current} className="label">{f.label}{f.req && ' *'}</label>;
  const help = f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>;
  switch (f.type) {
    case 'text': case 'number':
      return <div>{lab}<input id={idRef.current} className="field" type={f.type === 'number' ? 'number' : 'text'} min={f.type === 'number' ? 0 : undefined} step={f.type === 'number' ? 'any' : undefined} list={f.datalist ? idRef.current + '-dl' : undefined} placeholder={f.placeholder} value={v ?? ''} onChange={(e) => set(e.target.value)} />{f.datalist && <datalist id={idRef.current + '-dl'}>{f.datalist.map((o) => <option key={o} value={o} />)}</datalist>}{help}</div>;
    case 'textarea':
      return <div>{lab}<textarea id={idRef.current} className="field" rows={f.rows ?? 4} placeholder={f.placeholder} value={v ?? ''} onChange={(e) => set(e.target.value)} />{help}</div>;
    case 'select':
      return <div>{lab}<select id={idRef.current} className="field" value={v ?? ''} onChange={(e) => set(e.target.value)}>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>{help}</div>;
    case 'icon':
      return <div>{lab}<div className="flex items-center gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon name={v || 'code'} /></span><select id={idRef.current} className="field" value={v ?? 'code'} onChange={(e) => set(e.target.value)}>{ICON_NAMES.map((o) => <option key={o}>{o}</option>)}</select></div>{help}</div>;
    case 'bool':
      return <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-line p-3"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#1769FF]" checked={!!v} onChange={(e) => set(e.target.checked)} /><span><span className="text-sm font-bold">{f.label}</span>{f.help && <span className="block text-xs text-slate-500">{f.help}</span>}</span></label>;
    case 'image': return <div><span className="label">{f.label}</span><ImageField value={v ?? ''} onChange={set} />{help}</div>;
    case 'images': return <div><span className="label">{f.label}</span><MultiImageField value={v ?? []} onChange={set} />{help}</div>;
    case 'list': {
      const arr: string[] = Array.isArray(v) ? v : [];
      const mv = (i: number, d: number) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set(a); };
      return (
        <div><span className="label">{f.label}</span>
          <div className="space-y-2">
            {arr.map((it, i) => (
              <div key={i} className="flex items-start gap-1.5">
                {f.rows ? <textarea aria-label={`${f.label} ${i + 1}`} className="field" rows={f.rows} value={it} onChange={(e) => { const a = [...arr]; a[i] = e.target.value; set(a); }} /> : <input aria-label={`${f.label} ${i + 1}`} className="field" value={it} onChange={(e) => { const a = [...arr]; a[i] = e.target.value; set(a); }} />}
                <IconBtn label="Move up" icon="up" onClick={() => mv(i, -1)} disabled={i === 0} /><IconBtn label="Move down" icon="down" onClick={() => mv(i, 1)} disabled={i === arr.length - 1} /><IconBtn label="Remove" icon="trash" danger onClick={() => set(arr.filter((_, k) => k !== i))} />
              </div>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-2 !px-3 !py-1.5 !text-xs" onClick={() => set([...arr, ''])}><Icon name="plus" className="h-3.5 w-3.5" />Add</button>{help}
        </div>
      );
    }
    case 'group':
      return <fieldset className="rounded-2xl border border-brand-line p-4"><legend className="px-2 text-sm font-extrabold">{f.label}</legend><Form schema={f.fields!} value={v ?? {}} onChange={set} /></fieldset>;
    case 'objlist': {
      const arr: any[] = Array.isArray(v) ? v : [];
      const mv = (i: number, d: number) => { const a = [...arr]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set(a); };
      return (
        <div><span className="label">{f.label}</span>
          <div className="space-y-3">
            {arr.map((it, i) => (
              <details key={i} className="rounded-2xl border border-brand-line bg-slate-50/60" open={arr.length <= 3}>
                <summary className="flex cursor-pointer list-none items-center gap-2 p-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-brand/10 text-xs text-brand">{i + 1}</span><span className="flex-1 truncate">{(f.itemTitle && it?.[f.itemTitle]) || `Item ${i + 1}`}</span>
                  <IconBtn label="Move up" icon="up" onClick={(e) => { e.preventDefault(); mv(i, -1); }} disabled={i === 0} /><IconBtn label="Move down" icon="down" onClick={(e) => { e.preventDefault(); mv(i, 1); }} disabled={i === arr.length - 1} /><IconBtn label="Remove" icon="trash" danger onClick={(e) => { e.preventDefault(); set(arr.filter((_, k) => k !== i)); }} />
                </summary>
                <div className="p-3 pt-0"><Form schema={f.fields!} value={it ?? {}} onChange={(nv) => { const a = [...arr]; a[i] = nv; set(a); }} /></div>
              </details>
            ))}
          </div>
          <button type="button" className="btn-ghost mt-2 !px-3 !py-1.5 !text-xs" onClick={() => set([...arr, {}])}><Icon name="plus" className="h-3.5 w-3.5" />Add item</button>{help}
        </div>
      );
    }
  }
}

export function IconBtn({ icon, label, onClick, danger, disabled }: { icon: string; label: string; onClick: (e: React.MouseEvent) => void; danger?: boolean; disabled?: boolean }) {
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-brand-line bg-white transition disabled:opacity-30 ${danger ? 'text-red-600 hover:border-red-300 hover:bg-red-50' : 'text-slate-600 hover:border-brand hover:text-brand'}`}><Icon name={icon} className="h-4 w-4" /></button>;
}

// ---------- image uploaders ----------
const keyOf = (url: string) => (url.startsWith('/files/uploads/') ? url.slice('/files/'.length) : '');
const dropRemote = (url: string) => { const k = keyOf(url); if (k) api('/api/admin/upload?key=' + encodeURIComponent(k), { method: 'DELETE' }).catch(() => {}); };

export function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [pct, setPct] = useState<number | null>(null); const [err, setErr] = useState(''); const input = useRef<HTMLInputElement>(null);
  async function pick(file?: File) {
    if (!file) return; setErr(''); setPct(0);
    try { const r = await uploadImage(file, setPct); if (value) dropRemote(value); onChange(r.url); }
    catch (e: any) { setErr(e.message); } finally { setPct(null); if (input.current) input.current.value = ''; }
  }
  return (
    <div className="rounded-xl border border-dashed border-brand-line bg-slate-50/60 p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-28 shrink-0 place-items-center overflow-hidden rounded-lg border border-brand-line bg-white">{value ? <img src={value} alt="Preview" className="h-full w-full object-cover" /> : <Icon name="image" className="h-7 w-7 text-slate-300" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs" disabled={pct !== null} onClick={() => input.current?.click()}><Icon name="upload" className="h-3.5 w-3.5" />{value ? 'Replace image' : 'Choose image'}</button>
            {value && <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs !text-red-600" disabled={pct !== null} onClick={() => { dropRemote(value); onChange(''); }}><Icon name="trash" className="h-3.5 w-3.5" />Remove</button>}
          </div>
          {pct !== null && <div className="mt-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand transition-all" style={{ width: pct + '%' }} /></div><p className="mt-1 text-xs text-slate-500">Uploading… {pct}%</p></div>}
          {pct === null && <p className="mt-2 text-xs text-slate-500">PNG, JPG, WebP or GIF · max 5 MB</p>}
          {err && <p className="mt-1 text-xs font-semibold text-red-600" role="alert">{err}</p>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" aria-label="Upload image" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export function MultiImageField({ value, onChange }: { value: { url: string; alt: string }[]; onChange: (v: { url: string; alt: string }[]) => void }) {
  const [busy, setBusy] = useState<Record<string, number>>({}); const [errs, setErrs] = useState<string[]>([]); const input = useRef<HTMLInputElement>(null);
  const latest = useRef(value); latest.current = value;
  async function pick(files: FileList | null) {
    if (!files?.length) return; setErrs([]);
    for (const file of Array.from(files)) {
      const k = file.name + Math.random(); setBusy((b) => ({ ...b, [k]: 0 }));
      try { const r = await uploadImage(file, (p) => setBusy((b) => ({ ...b, [k]: p }))); onChange([...latest.current, { url: r.url, alt: '' }]); }
      catch (e: any) { setErrs((x) => [...x, e.message]); }
      finally { setBusy((b) => { const n = { ...b }; delete n[k]; return n; }); }
    }
    if (input.current) input.current.value = '';
  }
  const mv = (i: number, d: number) => { const a = [...value]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div className="rounded-xl border border-dashed border-brand-line bg-slate-50/60 p-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {value.map((im, i) => (
          <div key={im.url + i} className="rounded-xl border border-brand-line bg-white p-2">
            <img src={im.url} alt={im.alt || 'Gallery image'} className="aspect-[4/3] w-full rounded-lg object-cover" />
            <input aria-label="Image description" className="field mt-2 !py-1.5 !text-xs" placeholder="Short description (alt text)" value={im.alt} onChange={(e) => { const a = [...value]; a[i] = { ...im, alt: e.target.value }; onChange(a); }} />
            <div className="mt-2 flex gap-1"><IconBtn label="Move earlier" icon="up" onClick={() => mv(i, -1)} disabled={i === 0} /><IconBtn label="Move later" icon="down" onClick={() => mv(i, 1)} disabled={i === value.length - 1} /><span className="flex-1" /><IconBtn label="Remove image" icon="trash" danger onClick={() => { dropRemote(im.url); onChange(value.filter((_, k) => k !== i)); }} /></div>
          </div>
        ))}
        {Object.entries(busy).map(([k, p]) => <div key={k} className="grid place-items-center rounded-xl border border-brand-line bg-white p-3 text-center"><div className="w-full" role="progressbar" aria-valuenow={p}><div className="h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand transition-all" style={{ width: p + '%' }} /></div><p className="mt-1 text-xs text-slate-500">{p}%</p></div></div>)}
        <button type="button" onClick={() => input.current?.click()} className="grid min-h-[120px] place-items-center rounded-xl border-2 border-dashed border-brand/30 bg-white text-sm font-bold text-brand transition hover:bg-brand-soft"><span className="grid place-items-center gap-1"><Icon name="plus" className="h-6 w-6" />Add images</span></button>
      </div>
      {errs.map((e, i) => <p key={i} className="mt-2 text-xs font-semibold text-red-600" role="alert">{e}</p>)}
      <p className="mt-2 text-xs text-slate-500">PNG, JPG, WebP or GIF · max 5 MB each · you can select several at once</p>
      <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" aria-label="Upload images" onChange={(e) => pick(e.target.files)} />
    </div>
  );
}

// ---------- layout helpers ----------
export function PageTitle({ title, desc, children }: { title: string; desc?: string; children?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>{desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}</div>{children}</div>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`rounded-2xl border border-brand-line bg-white p-4 shadow-card sm:p-6 ${className}`}>{children}</div>; }
export function Spinner() { return <div className="grid place-items-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-line border-t-brand" role="status" aria-label="Loading" /></div>; }
export function ErrorBox({ msg, retry }: { msg: string; retry?: () => void }) { return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{msg}{retry && <button className="ml-3 font-bold underline" onClick={retry}>Retry</button>}</div>; }

export function useLoad<T>(path: string) {
  const [data, setData] = useState<T | null>(null); const [err, setErr] = useState('');
  const load = () => { setErr(''); api<T>(path).then(setData).catch((e) => setErr(e.message)); };
  useEffect(load, [path]);
  return { data, setData, err, reload: load };
}
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
