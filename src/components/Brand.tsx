import { Link } from '../lib/router';
import { useSite } from '../lib/data';

export function Logo({ dark = false, className = '' }: { dark?: boolean; className?: string }) {
  const { settings } = useSite();
  if (settings.logo) return <Link to="/" className={`inline-flex items-center ${className}`} aria-label={settings.site_name}><img src={settings.logo} alt={settings.site_name} className="h-9 w-auto max-w-[190px] object-contain" /></Link>;
  const parts = settings.site_name.split(' ');
  const first = parts[0] || settings.site_name; const rest = parts.slice(1).join(' ');
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label={settings.site_name}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-lg font-extrabold text-white shadow-lift">{first[0]}</span>
      <span className="leading-none">
        <span className={`block text-[17px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-brand-ink'}`}>{first}</span>
        {rest && <span className={`mt-0.5 block text-[9.5px] font-bold uppercase tracking-[0.22em] ${dark ? 'text-blue-300' : 'text-brand'}`}>{rest}</span>}
      </span>
    </Link>
  );
}
