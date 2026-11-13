import { lazy, Suspense } from 'react';
import { Router, usePath } from './lib/router';
import { DataProvider, useSite } from './lib/data';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import { ServicesPage, ServiceDetail } from './pages/Services';
import PricingPage from './pages/Pricing';
import { PortfolioPage, ProjectDetail } from './pages/Portfolio';
import ContactPage from './pages/Contact';
import About from './pages/About';
import FaqPage from './pages/Faq';
import Policy from './pages/Policy';
import { BlogPage, BlogPost } from './pages/Blog';
import NotFound from './pages/NotFound';

const AdminApp = lazy(() => import('./admin/AdminApp'));
const POLICIES = ['privacy-policy', 'terms', 'refund-policy'];

function PublicRoutes() {
  const path = usePath(); const site = useSite();
  const seg = path.slice(1).split('/');
  let page: JSX.Element;
  if (path === '/') page = <Home />;
  else if (path === '/about') page = <About />;
  else if (path === '/services') page = <ServicesPage />;
  else if (path === '/pricing') page = <PricingPage />;
  else if (path === '/portfolio') page = <PortfolioPage />;
  else if (seg[0] === 'portfolio' && seg.length === 2) page = <ProjectDetail slug={seg[1]} />;
  else if (path === '/contact') page = <ContactPage />;
  else if (path === '/faq') page = <FaqPage />;
  else if (path === '/blog') page = <BlogPage />;
  else if (seg[0] === 'blog' && seg.length === 2) page = <BlogPost slug={seg[1]} />;
  else if (seg.length === 1 && POLICIES.includes(seg[0])) page = <Policy slug={seg[0]} />;
  else if (seg.length === 1 && site.services.some((s) => s.slug === seg[0])) page = <ServiceDetail slug={seg[0]} />;
  else page = <NotFound />;
  return <Layout>{page}</Layout>;
}

function Shell() {
  const path = usePath();
  if (path === '/admin' || path.startsWith('/admin/')) {
    return <Suspense fallback={<div className="grid min-h-screen place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-line border-t-brand" role="status" aria-label="Loading" /></div>}><AdminApp /></Suspense>;
  }
  return <DataProvider><PublicRoutes /></DataProvider>;
}

export default function App() { return <Router><Shell /></Router>; }
