import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, ErrorBox, Form, PageTitle, Spinner, toast, useLoad, type FieldDef } from './kit';

const T = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'text', ...extra });
const A = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'textarea', rows: 3, ...extra });
const link = (key: string, label: string): FieldDef => ({ key, label, type: 'group', fields: [T('label', 'Button text', { half: true }), T('href', 'Link', { half: true, placeholder: '/contact' })] });

export const SCHEMAS: Record<string, FieldDef[]> = {
  home: [
    { key: 'hero', label: 'Hero section', type: 'group', fields: [T('eyebrow', 'Small label above headline'), A('headline', 'Headline', { rows: 2, help: 'Write short sentences each ending with a full stop. They stack on separate lines and the last one is highlighted.' }), A('subtitle', 'Supporting text'), link('primary', 'Primary button'), link('secondary', 'Secondary button')] },
    { key: 'intro', label: 'Introduction section', type: 'group', fields: [T('title', 'Title'), A('text', 'Text', { rows: 4 })] },
    { key: 'coreServices', label: 'Core service cards', type: 'objlist', itemTitle: 'title', fields: [{ key: 'icon', label: 'Icon', type: 'icon', half: true }, T('title', 'Title', { half: true }), A('text', 'Description', { rows: 2 }), T('href', 'Learn More link', { placeholder: '/web-development' }), { key: 'benefits', label: 'Key benefits', type: 'list' }] },
    T('whyTitle', 'Why choose us – title'),
    { key: 'why', label: 'Why choose us – points', type: 'objlist', itemTitle: 'title', fields: [{ key: 'icon', label: 'Icon', type: 'icon', half: true }, T('title', 'Title', { half: true }), A('text', 'Text', { rows: 2 })] },
    T('portfolioTitle', 'Featured portfolio – title', { half: true }), T('portfolioText', 'Featured portfolio – text', { half: true }),
    T('processTitle', 'Process – title'),
    { key: 'process', label: 'Process steps', type: 'objlist', itemTitle: 'title', fields: [T('n', 'Number', { half: true }), T('title', 'Title', { half: true }), A('text', 'Text', { rows: 2 })] },
    T('pricingTitle', 'Pricing preview – title', { half: true }), T('pricingText', 'Pricing preview – text', { half: true }),
    T('faqTitle', 'FAQ section – title'),
    { key: 'cta', label: 'Final call to action', type: 'group', fields: [T('title', 'Headline'), T('text', 'Text'), T('button', 'Button text')] },
  ],
  about: [
    T('headline', 'Headline'), { key: 'paragraphs', label: 'Paragraphs', type: 'list', rows: 3 }, A('mission', 'Mission'), A('vision', 'Vision'), T('valuesTitle', 'Values – title'),
    { key: 'values', label: 'Core values', type: 'objlist', itemTitle: 'title', fields: [{ key: 'icon', label: 'Icon', type: 'icon', half: true }, T('title', 'Title', { half: true }), A('text', 'Text', { rows: 2 })] },
    A('registrationNote', 'Registration note (optional)', { rows: 2, help: 'Only add a statement such as “SECP Registered Agency” if you can prove it. Leave empty otherwise.' }),
  ],
  pricing: [T('headline', 'Headline'), A('text', 'Intro text'), T('notesTitle', 'Notes box – title'), { key: 'notes', label: 'Included / excluded notes', type: 'list', rows: 2 }],
};
const intro: FieldDef[] = [T('headline', 'Headline'), A('text', 'Intro text')];
for (const s of ['services', 'contact', 'portfolio', 'faq', 'blog']) SCHEMAS[s] = intro;
const policy: FieldDef[] = [{ key: 'sections', label: 'Sections', type: 'objlist', itemTitle: 'heading', fields: [T('heading', 'Heading'), A('body', 'Text', { rows: 6, help: 'Leave a blank line between paragraphs.' })] }];
for (const s of ['privacy-policy', 'terms', 'refund-policy']) SCHEMAS[s] = policy;

export function PageEditor({ slugs, title, desc }: { slugs: { slug: string; label: string }[]; title: string; desc?: string }) {
  const { data, err, reload } = useLoad<any[]>('/api/admin/pages');
  const [slug, setSlug] = useState(slugs[0].slug); const [content, setContent] = useState<Record<string, any>>({}); const [saving, setSaving] = useState(false);
  const page = data?.find((p) => p.slug === slug);
  useEffect(() => { if (page) setContent(JSON.parse(JSON.stringify(page.content ?? {}))); }, [slug, data]);
  async function save() {
    setSaving(true);
    try { await api(`/api/admin/pages/${slug}`, { method: 'PUT', body: { content } }); toast('Saved. Changes are live on the website.'); reload(); } catch (e: any) { toast(e.message, 'err'); } finally { setSaving(false); }
  }
  return (
    <div>
      <PageTitle title={title} desc={desc} />
      {slugs.length > 1 && <div className="mb-4 flex flex-wrap gap-2" role="tablist">{slugs.map((s) => <button key={s.slug} role="tab" aria-selected={slug === s.slug} onClick={() => setSlug(s.slug)} className={`rounded-full border px-4 py-1.5 text-sm font-bold ${slug === s.slug ? 'border-brand bg-brand text-white' : 'border-brand-line bg-white text-slate-700'}`}>{s.label}</button>)}</div>}
      {err && <ErrorBox msg={err} retry={reload} />}
      {!data && !err && <Spinner />}
      {page && <Card><Form schema={SCHEMAS[slug] ?? intro} value={content} onChange={setContent} /><div className="mt-6 flex gap-2 border-t border-brand-line pt-5"><button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button><a className="btn-ghost" href={slug === 'home' ? '/' : '/' + slug} target="_blank" rel="noopener noreferrer">View page</a></div></Card>}
    </div>
  );
}

/** SEO titles/descriptions/images for every page, plus site-wide defaults. */
export function SeoPage() {
  const { data, err, reload } = useLoad<any[]>('/api/admin/pages');
  const [slug, setSlug] = useState('home'); const [v, setV] = useState<Record<string, any>>({}); const [saving, setSaving] = useState(false);
  const [def, setDef] = useState<Record<string, any> | null>(null);
  useEffect(() => { api('/api/admin/settings').then(setDef).catch(() => {}); }, []);
  const page = data?.find((p) => p.slug === slug);
  useEffect(() => { if (page) setV({ seo_title: page.seo_title, seo_description: page.seo_description, og_image: page.og_image }); }, [slug, data]);
  const schema: FieldDef[] = [T('seo_title', 'SEO title', { help: 'About 50–60 characters.' }), A('seo_description', 'Meta description', { rows: 3, help: 'About 140–160 characters.' }), { key: 'og_image', label: 'Social sharing image', type: 'image' }];
  async function save() { setSaving(true); try { await api(`/api/admin/pages/${slug}`, { method: 'PUT', body: v }); toast('SEO saved'); reload(); } catch (e: any) { toast(e.message, 'err'); } finally { setSaving(false); } }
  async function saveDef() { try { await api('/api/admin/settings', { method: 'PUT', body: { seo_title: def!.seo_title, seo_description: def!.seo_description, og_image: def!.og_image } }); toast('Default SEO saved'); } catch (e: any) { toast(e.message, 'err'); } }
  return (
    <div className="space-y-6">
      <PageTitle title="SEO Settings" desc="Search-engine titles and descriptions. Service, portfolio and blog pages have their own SEO fields in their editors." />
      {def && <Card><h2 className="mb-4 font-extrabold">Site-wide defaults</h2><Form schema={[T('seo_title', 'Default SEO title'), A('seo_description', 'Default meta description', { rows: 2 }), { key: 'og_image', label: 'Default social sharing image', type: 'image' }]} value={def} onChange={setDef} /><button className="btn-primary mt-5" onClick={saveDef}>Save defaults</button></Card>}
      <Card>
        <h2 className="mb-4 font-extrabold">Per-page SEO</h2>
        {err && <ErrorBox msg={err} retry={reload} />}
        {!data && !err && <Spinner />}
        {data && <><label className="label" htmlFor="seo-page">Page</label><select id="seo-page" className="field mb-4 max-w-xs" value={slug} onChange={(e) => setSlug(e.target.value)}>{data.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}</select>
          <Form schema={schema} value={v} onChange={setV} /><button className="btn-primary mt-5" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save page SEO'}</button></>}
      </Card>
    </div>
  );
}

/** Edits a subset of site settings (identity/contact/social/footer). */
export function SettingsPage({ title, desc, schema, sections }: { title: string; desc?: string; schema?: FieldDef[]; sections?: { title: string; schema: FieldDef[] }[] }) {
  const { data, err, reload } = useLoad<Record<string, any>>('/api/admin/settings');
  const [v, setV] = useState<Record<string, any>>({}); const [saving, setSaving] = useState(false);
  useEffect(() => { if (data) setV(data); }, [data]);
  const all = sections ?? [{ title: '', schema: schema! }];
  async function save() {
    const keys = all.flatMap((s) => s.schema.map((f) => f.key)); const body: Record<string, any> = {}; keys.forEach((k) => { body[k] = v[k] ?? ''; });
    setSaving(true); try { await api('/api/admin/settings', { method: 'PUT', body }); toast('Saved. Changes are live on the website.'); reload(); } catch (e: any) { toast(e.message, 'err'); } finally { setSaving(false); }
  }
  return (
    <div>
      <PageTitle title={title} desc={desc} />
      {err && <ErrorBox msg={err} retry={reload} />}
      {!data && !err && <Spinner />}
      {data && <div className="space-y-5">{all.map((s, i) => <Card key={i}>{s.title && <h2 className="mb-4 font-extrabold">{s.title}</h2>}<Form schema={s.schema} value={v} onChange={setV} /></Card>)}
        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button></div>}
    </div>
  );
}
const S = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'text', half: true, ...extra });
export const SETTINGS_SECTIONS = [
  { title: 'Brand', schema: [S('site_name', 'Website name'), S('tagline', 'Tagline'), { key: 'logo', label: 'Logo (leave empty for the text logo)', type: 'image' as const, half: true }, { key: 'favicon', label: 'Favicon', type: 'image' as const, half: true }] },
  { title: 'Contact details', schema: [S('email', 'Primary email'), S('whatsapp', 'WhatsApp number', { help: 'Digits with country code, e.g. 923001234567' }), S('phone', 'Phone (optional)'), S('address', 'Business address (optional)', { help: 'Shown in the footer and contact page only if filled in.' }), S('booking_url', 'Consultation booking link (optional)', { placeholder: 'https://calendly.com/…' })] },
  { title: 'Defaults', schema: [{ key: 'default_currency', label: 'Default pricing currency', type: 'select' as const, options: ['USD', 'PKR'], half: true }, S('turnstile_site_key', 'Cloudflare Turnstile site key (optional)', { help: 'Public key only. The secret key is set as a Cloudflare secret.' })] },
];
export const SOCIAL_SCHEMA: FieldDef[] = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['linkedin', 'LinkedIn'], ['x', 'X (Twitter)'], ['youtube', 'YouTube'], ['tiktok', 'TikTok']].map(([k, l]) => S(k, `${l} URL`, { placeholder: 'https://' }));
export const FOOTER_SCHEMA: FieldDef[] = [{ key: 'footer_description', label: 'Footer description', type: 'textarea', rows: 3 }];
