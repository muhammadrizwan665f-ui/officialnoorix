import { Link } from '../lib/router';
import { contactServiceFor, money, type Pkg } from '../lib/data';
import { Bullet } from './ui';

export function PackageCard({ p, cur }: { p: Pkg; cur: 'USD' | 'PKR' }) {
  const price = money(p, cur);
  const q = new URLSearchParams({ intent: 'quote', service: contactServiceFor(p), package: `${p.category} – ${p.name}`, ...(cur === 'PKR' ? { currency: 'PKR' } : {}) });
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-card transition hover:-translate-y-1 ${p.featured ? 'border-brand ring-2 ring-brand/20' : 'border-brand-line'}`}>
      {p.featured && <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Recommended</span>}
      <h3 className="text-lg font-extrabold">{p.name}</h3>
      {p.description && <p className="mt-1 text-sm text-brand-muted">{p.description}</p>}
      <div className="mt-4 min-h-[3.25rem]">
        {price ? (
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            {p.starting_at && <span className="text-sm font-semibold text-brand-muted">Starting at</span>}
            <span className="text-4xl font-extrabold tracking-tight">{price}</span>
            <span className="text-sm font-semibold text-brand-muted">{p.billing === 'monthly' ? '/ month' : 'one-time'}</span>
          </p>
        ) : <p className="text-lg font-extrabold text-brand">Custom PKR quote<span className="block text-xs font-medium text-brand-muted">Contact us for Pakistan-market pricing</span></p>}
      </div>
      <ul className="mt-5 flex-1 space-y-2.5">{p.features.map((f, i) => <Bullet key={i}>{f}</Bullet>)}</ul>
      <Link to={`/contact?${q}`} className={`${p.featured ? 'btn-primary' : 'btn-ghost'} mt-6 w-full`}>{price ? p.cta_label : 'Request PKR Quote'}</Link>
    </div>
  );
}
