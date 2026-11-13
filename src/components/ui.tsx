import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '../lib/router';
import { Icon } from './Icon';

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current; if (!el || shown) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el); return () => io.disconnect();
  }, [shown]);
  return <div ref={ref} style={{ animationDelay: `${delay}ms` }} className={`${className} ${shown ? 'animate-rise' : 'opacity-0'}`}>{children}</div>;
}

export function SectionHead({ eyebrow, title, text, center = true, dark = false }: { eyebrow?: string; title: string; text?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-3xl`}>
      {eyebrow && <span className={`eyebrow ${dark ? '!border-white/20 !bg-white/10 !text-blue-200' : ''}`}>{eyebrow}</span>}
      <h2 className={`h2 mt-3 ${dark ? 'text-white' : ''}`}>{title}</h2>
      {text && <p className={`lead mt-3 ${dark ? '!text-slate-300' : ''}`}>{text}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-brand-ink text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/30 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-brand-deep/60 blur-[100px]" />
      <div className="container-x relative py-14 sm:py-20">
        {eyebrow && <span className="eyebrow !border-white/20 !bg-white/10 !text-blue-200">{eyebrow}</span>}
        <h1 className="mt-4 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">{text}</p>}
        {children}
      </div>
    </section>
  );
}

export function Bullet({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <li className="flex items-start gap-2.5 text-sm leading-relaxed">
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${dark ? 'bg-brand/30 text-blue-200' : 'bg-brand/10 text-brand'}`}><Icon name="check" className="h-3 w-3" strokeWidth={3} /></span>
      <span>{children}</span>
    </li>
  );
}

export function CtaBand({ title, text, button, href = '/contact' }: { title: string; text: string; button: string; href?: string }) {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-deep via-[#0d3b95] to-brand p-8 text-center text-white sm:p-14">
          <div className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-blue-100">{text}</p>
          <Link to={href} className="btn relative mt-7 bg-white text-brand-deep hover:-translate-y-0.5 hover:bg-blue-50">{button}<Icon name="arrow" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const c = kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-blue-200 bg-blue-50 text-blue-900';
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}
