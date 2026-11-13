// Source of truth for the initial site content. Run `node scripts/gen-seed.mjs` to regenerate migrations/0002_seed.sql.
// Nothing here is invented client data: no testimonials, no statistics, no awards, no registration claims.
export const settings = {
  site_name: 'NOORIX DIGITAL LAB',
  tagline: 'We Build. We Manage. We Automate.',
  logo: '', favicon: '',
  email: 'noorixdigitals@gmail.com',
  whatsapp: '923154429417',
  phone: '', address: '',
  facebook: '', instagram: '', linkedin: '', x: '', youtube: '', tiktok: '',
  booking_url: '',
  default_currency: 'USD',
  seo_title: 'NOORIX DIGITAL LAB | Premium International Digital Agency',
  seo_description: 'Website development, ecommerce, social media management, AI chatbots and business automation for businesses worldwide.',
  og_image: '',
  footer_description: 'A digital solutions agency helping businesses build, manage and automate their online operations.',
  turnstile_site_key: '',
};

const home = {
  hero: {
    eyebrow: 'Premium International Digital Agency',
    headline: 'WE BUILD. WE MANAGE. WE AUTOMATE.',
    subtitle: 'Your business deserves more than just an online presence. We build powerful digital experiences, manage your social media presence, and automate business operations to help you grow.',
    primary: { label: 'Get a Free Consultation', href: '/contact?intent=consultation' },
    secondary: { label: 'Explore Our Services', href: '/services' },
  },
  intro: {
    title: 'Your Complete Digital Growth Partner',
    text: 'Noorix Digital Lab helps businesses establish, manage and improve their digital operations. From a professional website or online store to consistent social media and smarter, automated workflows, we bring the pieces together under one roof so you can work with one team instead of many.',
  },
  coreServicesTitle: 'Core Services',
  coreServices: [
    { icon: 'cart', title: 'Website & Ecommerce Development', text: 'Professional websites and online stores designed to turn visitors into customers.', href: '/web-development', benefits: ['Responsive, modern design', 'SEO-friendly structure', 'Admin dashboard for easy updates'] },
    { icon: 'share', title: 'Social Media Management', text: 'Consistent social media content, creative strategy and professional account management.', href: '/social-media-management', benefits: ['Content calendars and branded posts', 'Scheduling and account management', 'Monthly performance reporting'] },
    { icon: 'bot', title: 'AI Chatbots & Business Automation', text: 'Smarter customer interactions and automated workflows that save time and improve business operations.', href: '/ai-chatbots', benefits: ['FAQ answering and lead collection', 'Form-to-CRM workflows', 'Automated follow-ups and notifications'] },
  ],
  whyTitle: 'Why Choose Noorix',
  why: [
    { icon: 'target', title: 'Business-focused solutions', text: 'We start from your goals and build only what supports them.' },
    { icon: 'layout', title: 'Modern, responsive designs', text: 'Clean interfaces that look right and work well on every screen.' },
    { icon: 'code', title: 'Customized development', text: 'Solutions shaped around how your business actually operates.' },
    { icon: 'chat', title: 'Professional communication', text: 'Clear updates and straightforward answers throughout the project.' },
    { icon: 'check', title: 'Transparent project scope', text: 'You know what is included, what is not, and what it costs before we begin.' },
    { icon: 'shield', title: 'Ongoing technical support', text: 'Agreed maintenance and support after launch, so you are not left alone.' },
  ],
  processTitle: 'Our Process',
  process: [
    { n: '01', title: 'Discovery', text: 'Understand the business and requirements.' },
    { n: '02', title: 'Strategy', text: 'Plan the best solution.' },
    { n: '03', title: 'Development', text: 'Design and implement the project.' },
    { n: '04', title: 'Review & Testing', text: 'Test functionality and quality.' },
    { n: '05', title: 'Launch', text: 'Deploy and hand over the project.' },
    { n: '06', title: 'Support', text: 'Provide agreed maintenance and technical support.' },
  ],
  portfolioTitle: 'Featured Work',
  portfolioText: 'Projects we have built, each clearly labelled by type.',
  pricingTitle: 'Simple, Transparent Pricing',
  pricingText: 'Selected starting prices. Hosting, domains, paid APIs and ad budgets are not included unless stated.',
  faqTitle: 'Frequently Asked Questions',
  cta: { title: 'Ready to Build Something Great?', text: "Let's discuss your next digital project.", button: 'Start Your Project' },
};

const about = {
  headline: 'Technology, Creativity and Strategy — Working Together.',
  paragraphs: [
    'Noorix Digital Lab is a digital solutions agency focused on helping businesses build, manage and improve their online operations.',
    'We bring website development, ecommerce solutions, social media management and AI-powered automation together under one roof.',
    'Our goal is to deliver practical, scalable and business-focused digital solutions with professional communication and transparent project execution.',
  ],
  mission: 'To give businesses practical, well-built digital tools and services that make it easier to reach customers and run day-to-day operations.',
  vision: 'To be a trusted digital partner for businesses that want dependable technology and clear communication, in Pakistan and internationally.',
  valuesTitle: 'Core Values',
  values: [
    { icon: 'target', title: 'Clarity', text: 'Plain language, defined scope and honest timelines.' },
    { icon: 'layout', title: 'Quality', text: 'Careful design and testing before anything goes live.' },
    { icon: 'shield', title: 'Reliability', text: 'We do what we agreed, and we stay reachable after launch.' },
    { icon: 'bolt', title: 'Practicality', text: 'Solutions sized to your business, not to our ego.' },
  ],
  registrationNote: '',
};

const policy = (sections) => ({ sections });
export const pages = [
  { slug: 'home', title: 'Home', content: home, seo_title: 'NOORIX DIGITAL LAB | Websites, Social Media & AI Automation', seo_description: 'Premium international digital agency. We build websites and online stores, manage social media, and automate business operations with AI chatbots and workflows.' },
  { slug: 'about', title: 'About Us', content: about, seo_title: 'About Noorix Digital Lab', seo_description: 'Noorix Digital Lab brings website development, ecommerce, social media management and AI automation together for businesses worldwide.' },
  { slug: 'services', title: 'Services', content: { headline: 'Digital Services That Help Your Business Grow', text: 'Everything you need to build, manage and automate your online presence, from one team.' }, seo_title: 'Digital Services | Noorix Digital Lab', seo_description: 'Website development, ecommerce, social media management, AI chatbots, business automation, hosting and maintenance.' },
  { slug: 'pricing', title: 'Pricing', content: {
      headline: 'Clear Pricing for Every Stage of Growth',
      text: 'Prices are shown in USD by default. Switch to PKR to see Pakistan-market pricing where it has been set, or request a custom quote.',
      notesTitle: 'What is included and what is not',
      notes: [
        'Each package lists what it includes. Anything not listed is quoted separately.',
        'Recurring prices are marked per month.',
        'Domains, hosting, paid APIs, AI usage fees, advertising budgets and other third-party subscriptions are not included unless explicitly stated.',
        'Payment gateway availability and transaction charges depend on the provider and your requirements.',
        'PKR prices are set manually by Noorix and are not an automatic currency conversion.',
      ],
    }, seo_title: 'Pricing | Noorix Digital Lab', seo_description: 'Transparent pricing for website development, ecommerce, social media management, AI chatbots, automation and maintenance.' },
  { slug: 'contact', title: 'Contact', content: { headline: "Let's Talk About Your Project", text: 'Tell us what you need and we will get back to you. The more detail you share, the more useful our reply will be.' }, seo_title: 'Contact Noorix Digital Lab', seo_description: 'Request a quote or free consultation for websites, ecommerce, social media management, AI chatbots and automation.' },
  { slug: 'portfolio', title: 'Portfolio', content: { headline: 'Our Work', text: 'Projects we have built. Each is labelled as an internal project, a concept/demo or a client project.' }, seo_title: 'Portfolio | Noorix Digital Lab', seo_description: 'Selected projects from Noorix Digital Lab, including ecommerce and web platform builds.' },
  { slug: 'faq', title: 'FAQ', content: { headline: 'Frequently Asked Questions', text: 'Straight answers to common questions. Cannot find yours? Contact us.' }, seo_title: 'FAQ | Noorix Digital Lab', seo_description: 'Answers about our services, timelines, ecommerce, social media, AI chatbots, maintenance and how to start a project.' },
  { slug: 'blog', title: 'Blog', content: { headline: 'Insights & Articles', text: 'Practical notes on websites, ecommerce, social media and automation.' }, seo_title: 'Blog | Noorix Digital Lab', seo_description: 'Articles about websites, ecommerce, social media and business automation.' },
  { slug: 'privacy-policy', title: 'Privacy Policy', seo_title: 'Privacy Policy | Noorix Digital Lab', seo_description: 'How Noorix Digital Lab collects, uses and protects information submitted through this website.', content: policy([
    { heading: 'Information we collect', body: 'When you submit the contact form we collect the details you provide: your name, email address, optional business name and phone/WhatsApp number, country, the service you are interested in, your budget range and your message. We also receive basic technical data such as your IP address when you submit the form, which we store only in a one-way hashed form to help prevent spam.' },
    { heading: 'How we use it', body: 'We use this information to reply to your inquiry, prepare quotes or proposals, and manage our communication with you. We do not sell your personal information.' },
    { heading: 'Storage and access', body: 'Inquiries are stored in our database and are accessible only to authorised Noorix staff through a password-protected admin area. We keep inquiries for as long as needed to follow up and for our business records.' },
    { heading: 'Third-party services', body: 'This website runs on Cloudflare infrastructure. If you contact us through WhatsApp or email, those services handle your messages under their own policies. If spam protection (Cloudflare Turnstile) is enabled, it may process technical signals from your browser to tell humans from bots.' },
    { heading: 'Cookies', body: 'This public website does not use advertising or tracking cookies. A secure session cookie is used only for the staff admin area.' },
    { heading: 'Your choices', body: 'You can ask us to access, correct or delete the information you submitted by contacting us using the details on the Contact page.' },
    { heading: 'Changes', body: 'We may update this policy from time to time. The latest version is always published on this page.' },
  ]) },
  { slug: 'terms', title: 'Terms & Conditions', seo_title: 'Terms & Conditions | Noorix Digital Lab', seo_description: 'Terms that apply to the use of this website and to services provided by Noorix Digital Lab.', content: policy([
    { heading: 'About these terms', body: 'These terms apply to your use of this website and to inquiries made through it. Services are provided under a written proposal, quotation or invoice agreed with you, which sets out the scope, price, timeline and any special terms for that project.' },
    { heading: 'Scope and changes', body: 'Work is limited to what is described in the agreed scope. Requests outside the agreed scope may be quoted separately. Package descriptions on this website are summaries; the written proposal prevails.' },
    { heading: 'Third-party costs', body: 'Domains, hosting, paid APIs, AI usage fees, advertising budgets, payment gateway charges and other third-party subscriptions are the client\'s responsibility unless the proposal explicitly says otherwise. Availability of third-party services depends on the provider.' },
    { heading: 'No guaranteed outcomes', body: 'We do not guarantee specific results such as follower counts, views, leads, sales or search rankings. Maintenance and security work reduce risk but cannot guarantee complete protection against all attacks or failures.' },
    { heading: 'Client responsibilities', body: 'Clients are expected to provide content, access and feedback in a reasonable time. Delays in providing these can affect the project timeline.' },
    { heading: 'Intellectual property', body: 'Ownership of deliverables and any licences for third-party assets, fonts or software are set out in the agreed proposal.' },
    { heading: 'Website use', body: 'Please do not misuse this website, attempt to access the admin area without authorisation, or submit false or abusive content through the contact form.' },
    { heading: 'Contact', body: 'Questions about these terms can be sent to us using the details on the Contact page.' },
  ]) },
  { slug: 'refund-policy', title: 'Refund Policy', seo_title: 'Refund Policy | Noorix Digital Lab', seo_description: 'How refunds and cancellations are handled for Noorix Digital Lab services.', content: policy([
    { heading: 'General approach', body: 'Refund and cancellation terms depend on the service, the agreed scope and the stage the work has reached. These terms are stated in the written proposal or invoice for each project.' },
    { heading: 'Work already started', body: 'Time and resources spent on discovery, design, development or content creation before a cancellation request may be non-refundable, in proportion to the work completed.' },
    { heading: 'Recurring services', body: 'Monthly services such as social media management or maintenance can be cancelled for future months by notifying us before the next billing period. Fees already paid for a period in progress are handled as stated in the agreement.' },
    { heading: 'Third-party costs', body: 'Amounts paid to third parties on your behalf (domains, hosting, subscriptions, advertising) are governed by those providers\' own terms and are generally not refundable by us.' },
    { heading: 'How to request a refund', body: 'Contact us using the details on the Contact page with your project details and the reason for your request. We will review it and reply with our decision and the reasoning.' },
  ]) },
];

export const services = [
  { slug: 'web-development', title: 'Website Development', icon: 'code', headline: 'Professional Websites That Move Your Business Forward', summary: 'Business websites, corporate sites, landing pages and fully custom builds, designed to be fast, responsive and easy to manage.', description: 'We design and build websites that present your business clearly and help visitors take action. Every site is built to work well on phones, tablets and desktops, with a structure that search engines can understand.', benefits: ['Clear, modern design that fits your brand', 'Responsive on every screen size', 'SEO-friendly structure and clean URLs', 'Easy content updates through an admin dashboard where included'], includes: ['Business websites', 'Corporate websites', 'Landing pages', 'Custom websites', 'Website redesign', 'Responsive development', 'Contact forms', 'SEO-friendly structure', 'Performance optimization', 'Admin dashboards where included'], notes: 'Domain registration and hosting are separate costs unless stated in your proposal.', on_home: 1 },
  { slug: 'ecommerce-development', title: 'Ecommerce Development', icon: 'cart', headline: 'Turn Your Products Into a Powerful Online Store', summary: 'Online stores with product management, variations, cart and checkout, and an admin dashboard to run it all.', description: 'We build online stores that make it simple for customers to browse and order, and simple for you to manage products, orders and customers.', benefits: ['Product catalogue with categories and variations', 'Cart, checkout and order management', 'Admin dashboard for products, orders and customers', 'Mobile-optimised shopping experience'], includes: ['Ecommerce storefront', 'Product management', 'Product categories', 'Product variations', 'Cart and checkout', 'Payment gateway integration where supported', 'Order management', 'Customer management', 'Admin dashboard', 'Mobile optimization', 'Shipping configuration'], notes: 'Payment gateway availability, transaction charges, hosting and external integrations depend on the provider and on your requirements.', on_home: 1 },
  { slug: 'social-media-management', title: 'Social Media Management', icon: 'share', headline: 'Build a Stronger Social Media Presence', summary: 'Strategy, branded content, scheduling and account management with monthly reporting.', description: 'We plan and publish consistent, on-brand social media content so your accounts stay active and professional.', benefits: ['A consistent posting schedule', 'Branded post designs', 'Clear monthly reporting', 'One team handling strategy and execution'], includes: ['Social media strategy', 'Content calendars', 'Branded post designs', 'Captions and copywriting', 'Reels planning and editing where agreed', 'Scheduling', 'Account management', 'Monthly performance reporting'], notes: 'We do not promise guaranteed followers, views, leads or sales. Advertising budgets are paid separately.', on_home: 1 },
  { slug: 'ai-chatbots', title: 'AI Chatbots', icon: 'bot', headline: 'Smarter Customer Support With AI', summary: 'Business-specific chatbots that answer common questions, collect leads and hand over to your team when needed.', description: 'We set up chatbots trained on your own business information so customers get quick answers and you capture more inquiries.', benefits: ['Answers common questions automatically', 'Collects lead details for follow-up', 'Built around your business information', 'Human handoff where configured'], includes: ['Website AI chatbot', 'FAQ automation', 'Lead collection', 'Customer inquiry handling', 'Knowledge-base integration', 'Business-specific chatbot setup', 'Human handoff where configured'], notes: 'AI provider usage and third-party subscriptions may carry additional charges.', on_home: 1 },
  { slug: 'business-automation', title: 'Business Automation', icon: 'workflow', headline: 'Automate Repetitive Work. Focus on Growth.', summary: 'Connect your forms, CRM and tools so leads, follow-ups and notifications happen automatically.', description: 'We map the repetitive tasks in your business and automate them, so your team spends time on work that needs a human.', benefits: ['Fewer manual, repetitive tasks', 'Faster response to new leads', 'Tools that talk to each other', 'Workflows tailored to your process'], includes: ['Lead management automation', 'Form-to-CRM workflows', 'Customer follow-up automation', 'Notifications', 'Data synchronization', 'Business workflow integrations', 'AI-powered business assistance'], notes: 'Third-party services and API subscriptions may have additional charges.', on_home: 1 },
  { slug: 'hosting-maintenance', title: 'Hosting, Maintenance & Support', icon: 'shield', headline: 'Keep Your Website Running Smoothly', summary: 'Ongoing maintenance, backups, updates and technical support for your website.', description: 'We look after your website after launch so small problems are fixed early and updates do not pile up.', benefits: ['Regular updates and backups', 'Technical troubleshooting', 'Performance checks', 'Help with hosting setup'], includes: ['Website maintenance', 'Backups', 'Security updates', 'Technical troubleshooting', 'Performance checks', 'Website updates', 'Hosting assistance'], notes: 'Maintenance reduces risk but does not guarantee complete protection against all attacks.', on_home: 0 },
];

const P = (category, name, usd, billing, starting, features, opts = {}) => ({ category, name, usd, billing, starting, features, description: opts.d ?? '', featured: opts.f ? 1 : 0, cta: opts.cta ?? 'Get Started' });
export const packages = [
  P('Website Development', 'Starter', 199, 'one-time', 0, ['Up to 5 pages', 'Responsive design', 'Contact form', 'Basic SEO setup', '1 revision round']),
  P('Website Development', 'Business Ecommerce', 399, 'one-time', 0, ['Ecommerce storefront', 'Product management', 'Admin dashboard', 'Ordering/payment integration where supported', 'Up to 15 pages', '2 revision rounds'], { f: 1 }),
  P('Website Development', 'Premium', 799, 'one-time', 1, ['Advanced ecommerce', 'Custom functionality', 'Advanced admin panel', 'Custom integrations', 'Tailored design and workflows'], { cta: 'Request Quote' }),
  P('Social Media Management', 'Starter', 149, 'monthly', 0, ['8 posts per month', 'Content calendar', 'Basic page management']),
  P('Social Media Management', 'Growth', 299, 'monthly', 0, ['12 posts per month', '4 reels', 'Scheduling', 'Monthly report'], { f: 1 }),
  P('Social Media Management', 'Premium', 499, 'monthly', 0, ['20 posts per month', '8 reels', 'Content strategy', 'Page management', 'Monthly report']),
  P('AI Chatbots & Automation', 'Basic Chatbot', 199, 'one-time', 0, ['Website FAQ chatbot', 'Basic lead collection', 'Initial configuration']),
  P('AI Chatbots & Automation', 'Business Automation', 399, 'one-time', 0, ['Lead capture', 'Automated replies', 'Workflow integrations'], { f: 1 }),
  P('AI Chatbots & Automation', 'Advanced Automation', 799, 'one-time', 1, ['Multiple workflows', 'CRM integration', 'Custom AI assistant', 'Advanced business integrations'], { cta: 'Request Quote' }),
  P('Hosting & Maintenance', 'Basic', 19, 'monthly', 0, ['Basic website maintenance', 'Backups', 'Technical troubleshooting']),
  P('Hosting & Maintenance', 'Business', 49, 'monthly', 0, ['Everything in Basic', 'Security updates', 'Performance checks', 'Content updates']),
  P('Hosting & Maintenance', 'Advanced', 99, 'monthly', 0, ['Everything in Business', 'Priority technical support', 'Hosting assistance']),
];

export const portfolio = [
  { slug: 'venora-jewelry', title: 'VENORA JEWELRY', category: 'Ecommerce', kind: 'demo', featured: 1, project_url: 'https://venorajewelry.store', technologies: ['Next.js', 'Supabase', 'Cloudflare', 'WhatsApp ordering'], summary: 'An ecommerce jewellery storefront concept with product collections, product variations, separate pricing and imagery for variants, and WhatsApp ordering.', description: 'VENORA JEWELRY is an internal Noorix project and a concept storefront, not a paid client project.\n\nIt includes product collections, product variations where each variant has its own pricing, stock and photo gallery, and WhatsApp ordering so customers can place an order with the business directly. An admin panel lets the owner manage products and variants with a visual image uploader.' },
  { slug: 'nexus-pro-smm', title: 'NEXUS PRO SMM', category: 'Website Development', kind: 'internal', featured: 1, project_url: '', technologies: ['Web platform', 'Service ordering', 'Customer accounts'], summary: 'A social media marketing services platform with service ordering and customer-facing account functionality.', description: 'NEXUS PRO SMM is an internal Noorix project: a web platform for social media marketing services with service ordering and customer-facing account functionality.\n\nIt is presented here as a subscription/web platform build. It is not a paid client project and no results or customer numbers are claimed.' },
];

export const faqs = [
  ['What services does Noorix Digital Lab offer?', 'We offer website development, ecommerce development, social media management, AI chatbots, business automation, and hosting, maintenance and technical support.'],
  ['Do you work with international clients?', 'Yes. We work with clients in Pakistan and internationally. Prices are listed in USD by default, and we can provide a quote in PKR for the Pakistan market.'],
  ['How long does website development take?', 'It depends on the number of pages, features and how quickly content and feedback are provided. We share an estimated timeline in the proposal after understanding your requirements.'],
  ['Can you redesign an existing website?', 'Yes. We can redesign an existing website to improve its look, structure and performance. Tell us about your current site when you contact us.'],
  ['Do you provide ecommerce development?', 'Yes. We build online stores with product management, categories, variations, cart and checkout, order management and an admin dashboard. Payment gateway availability depends on the provider and your requirements.'],
  ['Do you manage social media accounts?', 'Yes. Our social media management includes strategy, content calendars, branded post designs, captions, scheduling, account management and monthly reporting. We do not guarantee specific follower, view or sales numbers.'],
  ['Can you build AI chatbots?', 'Yes. We set up business-specific chatbots that answer common questions, collect lead details and can hand over to a human where configured.'],
  ['Do you provide maintenance?', 'Yes. Our hosting and maintenance plans cover updates, backups, troubleshooting and performance checks, billed monthly.'],
  ['Are hosting and third-party subscriptions included?', 'Not unless a proposal says so. Domains, hosting, paid APIs, AI usage fees, advertising budgets and other third-party subscriptions are separate costs.'],
  ['How can I start a project?', 'Send us a message through the contact form or WhatsApp with a short description of what you need. We will reply to discuss scope, timeline and a quote.'],
];
