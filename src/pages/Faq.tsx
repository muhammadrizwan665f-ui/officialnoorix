import { useSite, pageTitle, type Faq } from '../lib/data';
import { useMeta } from '../lib/meta';
import { PageHero, CtaBand } from '../components/ui';
import { Icon } from '../components/Icon';

export function FaqList({ items }: { items: Pick<Faq, 'id' | 'question' | 'answer'>[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details key={f.id} className="card group overflow-hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left font-bold [&::-webkit-details-marker]:hidden">
            {f.question}<Icon name="chevron" className="h-5 w-5 shrink-0 text-brand transition group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{f.answer}</div>
        </details>
      ))}
    </div>
  );
}

export default function FaqPage() {
  const site = useSite(); const p = site.pages.faq?.content ?? {};
  useMeta(pageTitle(site, 'faq', 'FAQ'), site.pages.faq?.seoDescription);
  return (
    <>
      <PageHero eyebrow="FAQ" title={p.headline ?? 'Frequently Asked Questions'} text={p.text} />
      <section className="bg-white py-14 sm:py-20"><div className="container-x max-w-3xl">{site.faqs.length ? <FaqList items={site.faqs} /> : <p className="text-center text-brand-muted">No questions published yet.</p>}</div></section>
      <CtaBand title="Still have a question?" text="Send us a message and we will get back to you." button="Contact Us" />
    </>
  );
}
