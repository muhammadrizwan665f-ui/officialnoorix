import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';

export interface Service { id: string; slug: string; title: string; headline: string; summary: string; description: string; icon: string; image: string; benefits: string[]; includes: string[]; notes: string; seo_title: string; seo_description: string; on_home: boolean }
export interface Pkg { id: string; category: string; name: string; description: string; usd_price: number; pkr_price: number | null; billing: 'one-time' | 'monthly'; starting_at: boolean; featured: boolean; cta_label: string; features: string[] }
export interface Project { id: string; slug: string; title: string; summary: string; description: string; category: string; kind: 'internal' | 'demo' | 'client'; project_url: string; technologies: string[]; thumbnail: string; featured: boolean; images: { url: string; alt: string }[]; seo_title: string; seo_description: string }
export interface Faq { id: string; question: string; answer: string; on_home: boolean }
export interface Testimonial { id: string; name: string; role: string; company: string; quote: string; avatar: string }
export interface PageData { title: string; content: any; seoTitle: string; seoDescription: string; ogImage: string }
export interface SiteData {
  settings: Record<string, string>; pages: Record<string, PageData>;
  services: Service[]; packages: Pkg[]; portfolio: Project[]; faqs: Faq[]; testimonials: Testimonial[];
  hasBlog: boolean; contactOptions: { services: string[]; budgets: string[] };
}
const Ctx = createContext<SiteData | null>(null);
export const useSite = () => useContext(Ctx)!;

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData | null>(null);
  const [err, setErr] = useState('');
  const load = () => { setErr(''); api<SiteData>('/api/public/bootstrap').then(setData).catch((e) => setErr(e.message)); };
  useEffect(load, []);
  if (err) return (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-extrabold">We could not load the website</h1><p className="mt-2 text-brand-muted">{err}</p>
        <button className="btn-primary mt-5" onClick={load}>Try again</button></div>
    </div>
  );
  if (!data) return <div className="grid min-h-screen place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-line border-t-brand" role="status" aria-label="Loading" /></div>;
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export const waLink = (num: string, text = 'Hello Noorix Digital Lab, I would like to discuss a project.') => num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : '';
export function money(p: Pkg, cur: 'USD' | 'PKR'): string | null {
  const v = cur === 'PKR' ? p.pkr_price : p.usd_price;
  if (v === null || v === undefined || (cur === 'PKR' && !p.pkr_price)) return null;
  return (cur === 'USD' ? '$' : 'PKR ') + Math.round(v).toLocaleString('en-US');
}

export const SERVICE_PACKAGE_CATEGORY: Record<string, string> = {
  'web-development': 'Website Development', 'ecommerce-development': 'Website Development', 'social-media-management': 'Social Media Management',
  'ai-chatbots': 'AI Chatbots & Automation', 'business-automation': 'AI Chatbots & Automation', 'hosting-maintenance': 'Hosting & Maintenance',
};
/** Maps a pricing package to the contact-form service option it should pre-select. */
export function contactServiceFor(p: Pkg): string {
  if (p.category === 'Social Media Management') return 'Social Media Management';
  if (p.category === 'Hosting & Maintenance') return 'Hosting & Maintenance';
  if (p.category === 'AI Chatbots & Automation') return /automation/i.test(p.name) ? 'Business Automation' : 'AI Chatbot';
  return /ecommerce|premium/i.test(p.name) ? 'Ecommerce Website' : 'Business Website';
}
export const pageTitle = (site: SiteData, slug: string, fallback: string) => site.pages[slug]?.seoTitle || `${site.pages[slug]?.title ?? fallback} | ${site.settings.site_name}`;
