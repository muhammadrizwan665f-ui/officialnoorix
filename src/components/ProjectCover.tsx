import type { Project } from '../lib/data';

export const KIND_LABEL: Record<Project['kind'], string> = { internal: 'Internal Project', demo: 'Concept Project', client: 'Client Project' };
const TONES = ['from-brand to-brand-deep', 'from-indigo-500 to-brand-deep', 'from-cyan-500 to-brand', 'from-brand-deep to-brand-ink'];

/** Uses the uploaded thumbnail when present; otherwise a clearly generic mockup tile (not a fake screenshot). */
export function ProjectCover({ p, large = false }: { p: Pick<Project, 'title' | 'thumbnail' | 'category' | 'slug'>; large?: boolean }) {
  if (p.thumbnail) return <img src={p.thumbnail} alt={`${p.title} preview`} loading="lazy" decoding="async" className="h-full w-full object-cover" />;
  const tone = TONES[[...p.slug].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br ${tone}`} role="img" aria-label={`${p.title} placeholder cover`}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className={`w-3/4 overflow-hidden rounded-xl bg-white/95 shadow-2xl ${large ? 'max-w-md' : 'max-w-[15rem]'}`}>
        <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5"><i className="h-1.5 w-1.5 rounded-full bg-red-300" /><i className="h-1.5 w-1.5 rounded-full bg-amber-300" /><i className="h-1.5 w-1.5 rounded-full bg-emerald-300" /></div>
        <div className="space-y-2 p-3"><span className="block h-2.5 w-2/3 rounded bg-brand-ink" /><span className="block h-2 w-full rounded bg-slate-200" /><span className="block h-2 w-5/6 rounded bg-slate-200" /><div className="grid grid-cols-3 gap-1.5 pt-1"><i className="h-8 rounded bg-brand/20" /><i className="h-8 rounded bg-brand/30" /><i className="h-8 rounded bg-brand/20" /></div></div>
      </div>
      <span className="absolute bottom-2 left-3 text-[11px] font-bold tracking-wide text-white/90">{p.title}</span>
    </div>
  );
}
