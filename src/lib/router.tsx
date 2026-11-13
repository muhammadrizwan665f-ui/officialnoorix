import { createContext, useCallback, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

interface Nav { path: string; search: string; go: (to: string, replace?: boolean) => void }
const Ctx = createContext<Nav>({ path: '/', search: '', go: () => {} });

export function Router({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState({ path: window.location.pathname, search: window.location.search });
  useEffect(() => {
    const on = () => setLoc({ path: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const go = useCallback((to: string, replace = false) => {
    const u = new URL(to, window.location.origin);
    if (replace) window.history.replaceState(null, '', u.pathname + u.search + u.hash);
    else window.history.pushState(null, '', u.pathname + u.search + u.hash);
    setLoc({ path: u.pathname, search: u.search });
    if (!u.hash) window.scrollTo(0, 0);
  }, []);
  const v = useMemo(() => ({ ...loc, go }), [loc, go]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export const useNav = () => useContext(Ctx);
export const usePath = () => useContext(Ctx).path.replace(/\/+$/, '') || '/';
export const useQuery = () => new URLSearchParams(useContext(Ctx).search);

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { to: string };
export function Link({ to, onClick, children, ...rest }: LinkProps) {
  const { go } = useNav();
  const external = /^(https?:|mailto:|tel:)/.test(to);
  return (
    <a
      href={to}
      {...rest}
      {...(external && /^https?:/.test(to) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || external || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || rest.target === '_blank') return;
        e.preventDefault();
        go(to);
      }}
    >{children}</a>
  );
}
