# NOORIX DIGITAL LAB — Agency Website

Premium international digital-agency website with a full admin dashboard.

**Stack:** React + TypeScript + Vite + Tailwind (frontend) · Cloudflare Workers + Hono (API, server-rendered SEO `<head>`) · Cloudflare D1 (database) · Cloudflare R2 (image uploads).

## What is included
- **Public site:** Home, About, Services (+ one page per service), Pricing (USD/PKR), Portfolio (+ detail pages), Contact, FAQ, Blog, Privacy / Terms / Refund, custom 404, sitemap.xml, robots.txt.
- **Admin (`/admin/login` → `/admin/dashboard`):** overview, website settings, homepage editor, about, services, pricing & packages (USD + PKR), portfolio with real image uploader, testimonials (publish only after "client approved"), FAQs, contact inquiries (search, filters, status, notes, CSV export, delete), blog, SEO, social links, footer, legal text, profile/password, logout.
- **Security:** PBKDF2 password hashing, server-side hashed sessions (8 h), HttpOnly + SameSite=Strict cookie, CSRF token + Origin check, login/contact/setup rate limiting, honeypot + speed trap + optional Cloudflare Turnstile, content-based image validation (SVG refused), parameterised SQL, security headers + CSP, formula-safe CSV export.
- No fake statistics, reviews, awards or registration claims. Content you have not provided stays empty and is hidden.

## Local development
```bash
npm install
cp .dev.vars.example .dev.vars        # set SETUP_TOKEN to a long random string
npm run db:migrate:local              # creates tables + seed content
npm run build && npx wrangler dev     # http://localhost:8787
```
Frontend-only hot reload: `npm run dev` (proxies `/api` to wrangler on 8787).

## Deploy to Cloudflare (first time)
1. `npx wrangler d1 create noorix-agency-db` → copy the printed `database_id` into `wrangler.jsonc` (`d1_databases[0].database_id`).
2. `npx wrangler r2 bucket create noorix-agency-files`
3. Run migrations on the live DB: `npm run db:migrate:remote` (applies `0001_schema.sql` and `0002_seed.sql`). *Cloudflare does not run migrations automatically.*
4. Set secrets: `npx wrangler secret put SETUP_TOKEN` (a long random string). Optional: `npx wrangler secret put TURNSTILE_SECRET`.
5. Set `vars.SITE_URL` in `wrangler.jsonc` to your real domain (used for canonical URLs, sitemap and Open Graph).
6. Deploy: `npm run deploy`, **or** connect the GitHub repo in Cloudflare → Workers & Pages → Create → Import repository. Build command: `npm run build`, deploy command: `npx wrangler deploy`. The Worker name in the dashboard must equal `name` in `wrangler.jsonc`.
7. Add your custom domain: Worker → Settings → Domains & Routes → Add custom domain.

## Create the first admin
Open `https://YOUR-DOMAIN/admin/login`. While no admin exists the page shows **Create admin account**; enter your name, email, a strong password (10+ characters, letters + numbers) and the `SETUP_TOKEN` secret. This works exactly once; after that registration is closed. There are no default credentials. To rotate or remove the setup token afterwards: `npx wrangler secret delete SETUP_TOKEN`.

## Optional: Cloudflare Turnstile (spam protection)
Create a Turnstile widget for your domain, paste the **site key** in Admin → Website Settings → Defaults, and set the **secret** with `wrangler secret put TURNSTILE_SECRET`. Without it the form still has a honeypot, speed trap, duplicate protection and rate limiting.

## Content you should fill in
Admin → Website Settings: logo, favicon, phone, address (optional), booking link. Admin → Social Media Links. Admin → Portfolio: upload real screenshots (placeholder covers are shown until you do). Review the Privacy / Terms / Refund text with a professional before relying on it.

## Backups
`npx wrangler d1 export noorix-agency-db --remote --output backup.sql` (schedule it weekly). Uploaded images live in the R2 bucket `noorix-agency-files`; enable R2 lifecycle/versioning or copy it with `rclone` if you need image backups. Inquiries can also be exported from Admin → Contact Inquiries → Export CSV.

## Tests
```bash
npm test      # 21 API/security tests on an in-memory SQLite D1 shim
```
`tests/e2e/server.ts` runs the real Worker against an in-memory database for browser testing.

## Environment variables
| Name | Where | Purpose |
|---|---|---|
| `SETUP_TOKEN` | secret | one-time creation of the first admin |
| `TURNSTILE_SECRET` | secret (optional) | verifies Turnstile tokens on the contact form |
| `SITE_URL` | `wrangler.jsonc` var | canonical origin for SEO/sitemap |
| `DB` / `FILES` / `ASSETS` | bindings | D1, R2, static assets |
