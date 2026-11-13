import { useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../components/Icon';
import { Card, ErrorBox, Form, IconBtn, PageTitle, Spinner, slugify, toast, useConfirm, useLoad, type FieldDef } from './kit';

const SEO: FieldDef[] = [
  { key: 'seo_title', label: 'SEO title', type: 'text', half: true, help: 'Shown in Google results. Leave empty to use the title.' },
  { key: 'seo_description', label: 'SEO description', type: 'text', half: true },
];
const CATS = ['Website Development', 'Ecommerce', 'Social Media', 'AI Automation'];

export interface ResDef {
  name: string; title: string; desc: string; singular: string; schema: FieldDef[]; blank: Record<string, any>;
  row: (it: any) => { title: string; sub: string; badges?: string[] }; toggle?: string; reorder?: boolean; slugFrom?: string; thumb?: (it: any) => string;
}

export const RESOURCES: Record<string, ResDef> = {
  services: { name: 'services', title: 'Services', singular: 'service', desc: 'The services shown in the navigation, services page and footer. Each has its own page at /its-slug.', reorder: true, toggle: 'published', slugFrom: 'title',
    blank: { icon: 'code', published: true, benefits: [], includes: [] },
    row: (s) => ({ title: s.title, sub: `/${s.slug}`, badges: [] }),
    schema: [
      { key: 'title', label: 'Title', type: 'text', req: true, half: true }, { key: 'slug', label: 'URL slug', type: 'text', req: true, half: true, help: 'Lowercase letters, numbers and hyphens. Changing it changes the page link.' },
      { key: 'headline', label: 'Page headline', type: 'text', half: true }, { key: 'icon', label: 'Icon', type: 'icon', half: true },
      { key: 'summary', label: 'Short summary', type: 'textarea', rows: 2 }, { key: 'description', label: 'Description', type: 'textarea', rows: 5 },
      { key: 'image', label: 'Image (optional)', type: 'image' }, { key: 'benefits', label: 'Key benefits', type: 'list' }, { key: 'includes', label: "What's included", type: 'list' },
      { key: 'notes', label: 'Important note (e.g. extra costs)', type: 'textarea', rows: 2 },
      { key: 'published', label: 'Published', type: 'bool', help: 'Unpublished services disappear from the website.' }, ...SEO,
    ] },
  packages: { name: 'packages', title: 'Pricing & Packages', singular: 'package', desc: 'Packages shown on the pricing page. Prices can be set in USD and PKR. PKR is never converted automatically.', reorder: true, toggle: 'published',
    blank: { billing: 'one-time', published: true, usd_price: '', pkr_price: '', features: [], cta_label: 'Get Started' },
    row: (p) => ({ title: `${p.name}`, sub: `${p.category} · $${p.usd_price}${p.starting_at ? '+' : ''}${p.billing === 'monthly' ? '/mo' : ''}${p.pkr_price ? ` · PKR ${Math.round(p.pkr_price).toLocaleString()}` : ''}`, badges: p.featured ? ['Recommended'] : [] }),
    schema: [
      { key: 'category', label: 'Category', type: 'text', req: true, half: true, datalist: ['Website Development', 'Social Media Management', 'AI Chatbots & Automation', 'Hosting & Maintenance'] }, { key: 'name', label: 'Package name', type: 'text', req: true, half: true },
      { key: 'description', label: 'Short description', type: 'text' },
      { key: 'usd_price', label: 'Price (USD)', type: 'number', half: true }, { key: 'pkr_price', label: 'Price (PKR) – leave empty for custom quote', type: 'number', half: true },
      { key: 'billing', label: 'Billing', type: 'select', options: ['one-time', 'monthly'], half: true }, { key: 'cta_label', label: 'Button text', type: 'text', half: true },
      { key: 'starting_at', label: 'Show "Starting at"', type: 'bool' }, { key: 'featured', label: 'Featured (shows "Recommended" and appears on the homepage)', type: 'bool' },
      { key: 'features', label: 'Features', type: 'list' }, { key: 'published', label: 'Published', type: 'bool' },
    ] },
  portfolio: { name: 'portfolio', title: 'Portfolio', singular: 'project', desc: 'Projects shown on the portfolio page. Label each one honestly as Internal, Concept/Demo or Client.', reorder: true, toggle: 'published', slugFrom: 'title', thumb: (p) => p.thumbnail,
    blank: { category: 'Website Development', kind: 'internal', published: true, technologies: [], images: [] },
    row: (p) => ({ title: p.title, sub: `${p.category} · ${({ internal: 'Internal', demo: 'Concept/Demo', client: 'Client' } as any)[p.kind]}`, badges: p.featured ? ['Featured'] : [] }),
    schema: [
      { key: 'title', label: 'Project title', type: 'text', req: true, half: true }, { key: 'slug', label: 'URL slug', type: 'text', req: true, half: true },
      { key: 'category', label: 'Category', type: 'select', options: CATS, half: true }, { key: 'kind', label: 'Project type', type: 'select', options: ['internal', 'demo', 'client'], half: true, help: 'internal = own project · demo = concept/demo · client = delivered for a client' },
      { key: 'summary', label: 'Short summary', type: 'textarea', rows: 2 }, { key: 'description', label: 'Full description', type: 'textarea', rows: 6, help: 'Leave a blank line between paragraphs. Do not claim results you cannot prove.' },
      { key: 'project_url', label: 'Project URL (optional)', type: 'text', placeholder: 'https://' }, { key: 'technologies', label: 'Technologies used', type: 'list' },
      { key: 'thumbnail', label: 'Thumbnail', type: 'image' }, { key: 'images', label: 'Gallery images', type: 'images' },
      { key: 'featured', label: 'Show on homepage', type: 'bool' }, { key: 'published', label: 'Published', type: 'bool' }, ...SEO,
    ] },
  faqs: { name: 'faqs', title: 'FAQs', singular: 'FAQ', desc: 'Questions shown on the FAQ page and (if ticked) the homepage.', reorder: true, toggle: 'published',
    blank: { published: true, on_home: true },
    row: (f) => ({ title: f.question, sub: f.answer.slice(0, 90) + (f.answer.length > 90 ? '…' : ''), badges: f.on_home ? ['Homepage'] : [] }),
    schema: [{ key: 'question', label: 'Question', type: 'text', req: true }, { key: 'answer', label: 'Answer', type: 'textarea', rows: 5, req: true }, { key: 'on_home', label: 'Show on homepage', type: 'bool' }, { key: 'published', label: 'Published', type: 'bool' }] },
  testimonials: { name: 'testimonials', title: 'Testimonials', singular: 'testimonial', desc: 'Only add genuine testimonials. A testimonial cannot be published until you confirm the client approved it.', reorder: true, toggle: 'published',
    blank: { client_approved: false, published: false },
    row: (t) => ({ title: t.name, sub: t.quote.slice(0, 90), badges: t.client_approved ? ['Client approved'] : ['Not approved'] }),
    schema: [{ key: 'name', label: 'Client name', type: 'text', req: true, half: true }, { key: 'role', label: 'Role', type: 'text', half: true }, { key: 'company', label: 'Company', type: 'text', half: true }, { key: 'avatar', label: 'Photo (optional)', type: 'image' },
      { key: 'quote', label: 'Testimonial', type: 'textarea', rows: 4, req: true }, { key: 'client_approved', label: 'The client approved publishing this', type: 'bool' }, { key: 'published', label: 'Published', type: 'bool' }] },
  blog: { name: 'blog', title: 'Blog / Articles', singular: 'article', desc: 'Write articles. Use "## " at the start of a paragraph for a heading. Drafts stay hidden until published.', toggle: 'published', slugFrom: 'title', thumb: (p) => p.featured_image,
    blank: { published: false },
    row: (p) => ({ title: p.title, sub: `/blog/${p.slug}${p.published_at ? ' · ' + p.published_at.slice(0, 10) : ''}`, badges: p.published ? [] : ['Draft'] }),
    schema: [{ key: 'title', label: 'Title', type: 'text', req: true, half: true }, { key: 'slug', label: 'URL slug', type: 'text', req: true, half: true }, { key: 'author', label: 'Author', type: 'text', half: true },
      { key: 'featured_image', label: 'Featured image', type: 'image' }, { key: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2 }, { key: 'content', label: 'Content', type: 'textarea', rows: 14 },
      { key: 'published', label: 'Published', type: 'bool' }, ...SEO] },
};

const clean = (def: ResDef, v: Record<string, any>) => {
  const o: Record<string, any> = {};
  for (const f of def.schema) { if (v[f.key] !== undefined) o[f.key] = f.type === 'number' ? (v[f.key] === '' ? (f.key === 'pkr_price' ? null : 0) : Number(v[f.key])) : v[f.key]; }
  if (def.name === 'portfolio' && Array.isArray(v.images)) o.images = v.images;
  return o;
};

export default function ResourcePage({ res }: { res: string }) {
  const def = RESOURCES[res];
  const { data, err, reload } = useLoad<any[]>(`/api/admin/${res}`);
  const [editing, setEditing] = useState<{ id?: string; v: Record<string, any> } | null>(null);
  const [saving, setSaving] = useState(false); const [formErr, setFormErr] = useState('');
  const [confirm, confirmNode] = useConfirm();

  const open = (it?: any) => { setFormErr(''); setEditing(it ? { id: it.id, v: { ...it, usd_price: it.usd_price ?? '', pkr_price: it.pkr_price ?? '' } } : { v: { ...def.blank } }); };
  const onChange = (v: Record<string, any>) => setEditing((e) => {
    if (!e) return e;
    if (!e.id && def.slugFrom && v[def.slugFrom] !== e.v[def.slugFrom] && (!e.v.slug || e.v.slug === slugify(e.v[def.slugFrom] ?? ''))) v = { ...v, slug: slugify(v[def.slugFrom] ?? '') };
    return { ...e, v };
  });
  async function save() {
    if (!editing) return; setSaving(true); setFormErr('');
    try {
      const body = clean(def, editing.v);
      if (editing.id) await api(`/api/admin/${res}/${editing.id}`, { method: 'PUT', body }); else await api(`/api/admin/${res}`, { method: 'POST', body });
      toast(editing.id ? 'Saved' : `${def.singular[0].toUpperCase() + def.singular.slice(1)} created`); setEditing(null); reload();
    } catch (e: any) { setFormErr(e.message); } finally { setSaving(false); }
  }
  async function remove(it: any) {
    if (!(await confirm(`Delete "${def.row(it).title}"? This cannot be undone.`))) return;
    try { await api(`/api/admin/${res}/${it.id}`, { method: 'DELETE' }); toast('Deleted'); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function flip(it: any) {
    try { await api(`/api/admin/${res}/${it.id}`, { method: 'PUT', body: { [def.toggle!]: !it[def.toggle!] } }); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }
  async function move(i: number, d: number) {
    if (!data) return; const a = data.map((x) => x.id); const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]];
    try { await api(`/api/admin/${res}-reorder`, { body: { ids: a } }); reload(); } catch (e: any) { toast(e.message, 'err'); }
  }

  if (editing) return (
    <div>
      <PageTitle title={`${editing.id ? 'Edit' : 'New'} ${def.singular}`}><button className="btn-ghost !py-2" onClick={() => setEditing(null)}>← Back to list</button></PageTitle>
      <Card>
        <Form schema={def.schema} value={editing.v} onChange={onChange} />
        {formErr && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{formErr}</p>}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-brand-line pt-5"><button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : editing.id ? 'Save changes' : `Create ${def.singular}`}</button><button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button></div>
      </Card>
    </div>
  );
  return (
    <div>
      {confirmNode}
      <PageTitle title={def.title} desc={def.desc}><button className="btn-primary !py-2.5" onClick={() => open()}><Icon name="plus" className="h-4 w-4" />Add {def.singular}</button></PageTitle>
      {err && <ErrorBox msg={err} retry={reload} />}
      {!data && !err && <Spinner />}
      {data && data.length === 0 && <Card className="py-12 text-center text-slate-500">Nothing here yet. Click “Add {def.singular}” to create the first one.</Card>}
      <div className="space-y-2.5">
        {data?.map((it, i) => { const r = def.row(it); const on = def.toggle ? !!it[def.toggle] : true; return (
          <div key={it.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-line bg-white p-3 shadow-card sm:flex-nowrap">
            {def.thumb && <div className="hidden h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:block">{def.thumb(it) && <img src={def.thumb(it)} alt="" className="h-full w-full object-cover" />}</div>}
            <button className="min-w-0 flex-1 text-left" onClick={() => open(it)}>
              <span className="flex flex-wrap items-center gap-2"><span className="truncate font-bold">{r.title}</span>{r.badges?.map((b) => <span key={b} className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">{b}</span>)}</span>
              <span className="block truncate text-xs text-slate-500">{r.sub}</span>
            </button>
            <div className="flex items-center gap-1.5">
              {def.toggle && <button type="button" role="switch" aria-checked={on} aria-label={on ? 'Unpublish' : 'Publish'} title={on ? 'Published – click to unpublish' : 'Hidden – click to publish'} onClick={() => flip(it)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button>}
              {def.reorder && <><IconBtn label="Move up" icon="up" disabled={i === 0} onClick={() => move(i, -1)} /><IconBtn label="Move down" icon="down" disabled={i === data.length - 1} onClick={() => move(i, 1)} /></>}
              <IconBtn label="Edit" icon="edit" onClick={() => open(it)} /><IconBtn label="Delete" icon="trash" danger onClick={() => remove(it)} />
            </div>
          </div>); })}
      </div>
    </div>
  );
}
