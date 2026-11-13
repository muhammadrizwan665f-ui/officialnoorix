import { Icon } from './Icon';

/** Decorative product-style composition built from HTML/CSS (no stock images, no numbers or fake statistics). */
export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[560px] sm:h-[460px] lg:h-[500px]" aria-hidden="true">
      <div className="absolute inset-6 rounded-full bg-brand/25 blur-[90px]" />
      {/* Website preview */}
      <div className="absolute left-0 top-4 w-[78%] animate-floaty overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl sm:top-2">
        <div className="flex items-center gap-1.5 border-b border-brand-line bg-slate-50 px-3 py-2">
          <i className="h-2 w-2 rounded-full bg-red-300" /><i className="h-2 w-2 rounded-full bg-amber-300" /><i className="h-2 w-2 rounded-full bg-emerald-300" />
          <span className="ml-3 h-4 flex-1 rounded-md bg-white ring-1 ring-brand-line" />
        </div>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between"><span className="h-3 w-16 rounded bg-brand-ink" /><span className="flex gap-2"><i className="h-2 w-8 rounded bg-slate-200" /><i className="h-2 w-8 rounded bg-slate-200" /><i className="h-4 w-12 rounded bg-brand" /></span></div>
          <div className="rounded-xl bg-gradient-to-br from-brand to-brand-deep p-4 sm:p-5">
            <span className="block h-3 w-3/4 rounded bg-white/90" /><span className="mt-2 block h-3 w-1/2 rounded bg-white/70" />
            <span className="mt-4 block h-5 w-20 rounded-md bg-white" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => <div key={i} className="rounded-lg border border-brand-line p-1.5"><div className={`h-10 rounded-md sm:h-14 ${['bg-blue-100', 'bg-slate-200', 'bg-indigo-100'][i]}`} /><span className="mt-1.5 block h-1.5 w-3/4 rounded bg-slate-300" /><span className="mt-1 block h-1.5 w-1/2 rounded bg-brand/60" /></div>)}
          </div>
        </div>
      </div>
      {/* Ecommerce dashboard */}
      <div className="absolute bottom-6 left-1 w-[52%] rounded-2xl border border-white/15 bg-white p-3 shadow-2xl sm:bottom-2 sm:p-4" style={{ animation: 'floaty 7s ease-in-out infinite reverse' }}>
        <div className="flex items-center justify-between"><span className="text-[11px] font-extrabold text-brand-ink">Store dashboard</span><span className="grid h-6 w-6 place-items-center rounded-md bg-brand/10 text-brand"><Icon name="cart" className="h-3.5 w-3.5" /></span></div>
        <div className="mt-3 flex h-14 items-end gap-1.5 sm:h-16">
          {[35, 55, 40, 70, 50, 85, 65].map((h, i) => <i key={i} style={{ height: `${h}%` }} className={`flex-1 rounded-t ${i === 5 ? 'bg-brand' : 'bg-brand/25'}`} />)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500"><span className="rounded-md bg-brand-soft px-2 py-1">Orders</span><span className="rounded-md bg-brand-soft px-2 py-1">Products</span></div>
      </div>
      {/* Social post */}
      <div className="absolute right-0 top-24 w-[40%] animate-floaty rounded-2xl border border-white/15 bg-white p-2.5 shadow-2xl sm:top-16" style={{ animationDelay: '1.2s' }}>
        <div className="flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-gradient-to-br from-brand to-brand-deep" /><span className="h-2 w-12 rounded bg-slate-300" /></div>
        <div className="mt-2 grid h-20 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-brand to-cyan-400 sm:h-28"><Icon name="share" className="h-7 w-7 text-white/90" /></div>
        <div className="mt-2 flex items-center gap-2 text-slate-400"><Icon name="star" className="h-3.5 w-3.5 text-brand" /><Icon name="chat" className="h-3.5 w-3.5" /><span className="ml-auto h-2 w-8 rounded bg-slate-200" /></div>
      </div>
      {/* AI chat */}
      <div className="absolute bottom-0 right-1 w-[48%] rounded-2xl border border-white/15 bg-brand-ink/95 p-3 shadow-2xl ring-1 ring-brand/40 sm:bottom-4" style={{ animation: 'floaty 8s ease-in-out infinite' }}>
        <div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-brand text-white"><Icon name="bot" className="h-3.5 w-3.5" /></span><span className="text-[11px] font-bold text-white">AI assistant</span><i className="ml-auto h-2 w-2 rounded-full bg-emerald-400" /></div>
        <div className="mt-3 space-y-2"><div className="ml-auto h-6 w-3/5 rounded-xl rounded-tr-sm bg-brand" /><div className="h-6 w-4/5 rounded-xl rounded-tl-sm bg-white/10" /><div className="h-6 w-2/5 rounded-xl rounded-tl-sm bg-white/10" /></div>
      </div>
    </div>
  );
}
