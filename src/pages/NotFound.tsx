import { Link } from '../lib/router';
import { useMeta } from '../lib/meta';

export default function NotFound() {
  useMeta('Page not found');
  return (
    <section className="bg-white py-24 text-center">
      <div className="container-x max-w-xl">
        <p className="text-7xl font-extrabold tracking-tight text-brand">404</p>
        <h1 className="mt-4 text-3xl font-extrabold">This page could not be found</h1>
        <p className="mt-3 text-brand-muted">The link may be broken or the page may have been moved.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/" className="btn-primary">Back to Home</Link><Link to="/contact" className="btn-ghost">Contact Us</Link></div>
      </div>
    </section>
  );
}
