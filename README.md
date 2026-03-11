# J. Barbaro Clothiers (Next.js Rebuild)

Modern, SEO-first rebuild of the J. Barbaro Clothiers website using Next.js App Router, TypeScript, Tailwind CSS, TinaCMS, and file-based content.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- TinaCMS
- MDX + JSON content (local files)

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Start development server:

```bash
pnpm dev
```

This starts Next.js plus Tina's local development server. Open `/admin` to edit content while developing locally.

4. Production build check:

```bash
pnpm build
```

## Environment Variables

See `.env.example`:

- `NEXT_PUBLIC_SITE_URL` (default: `http://localhost:3000`)
- Optional `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- Optional `SHOPIFY_STOREFRONT_API_VERSION` (default: `2026-01`)
- `NEXT_PUBLIC_TINA_CLIENT_ID`, `TINA_TOKEN`
- Optional `NEXT_PUBLIC_TINA_BRANCH` (defaults to `main`)
- Optional `TINA_SEARCH_TOKEN`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_FROM` and optional `SMTP_REPLY_TO`
- Optional notification recipients:
  - `APPOINTMENT_NOTIFICATION_TO`
  - `CONTACT_NOTIFICATION_TO`
  - `WEDDING_NOTIFICATION_TO`

## Key Features

- Full multi-page marketing site with modern luxury design language
- Shopify-ready headless commerce scaffold:
  - Server-side Storefront API client
  - Secure cart session cookie
  - Cart API routes at `/api/shopify/cart`
  - Checkout handoff route at `/api/shopify/cart/checkout`
- Legacy URL redirect compatibility in `next.config.ts`
- Dynamic brand/category/location routes with static generation
- Appointment booking flow with holiday-aware 30-minute slot logic
- Appointment confirmation email with Google/Outlook calendar links + `.ics` invite
- Internal email notifications for appointment/contact/wedding submissions
- Contact and wedding submissions send customer confirmation emails
- Form submissions are email-only and are not stored in a database
- Tuxedo rentals marketing funnel:
  - `/suit-tuxedo-rentals` catalog page
  - `/register-your-wedding` intake form
- Contact form with honeypot + IP rate limiting
- SEO foundation:
  - Canonicals, Open Graph, Twitter metadata
  - JSON-LD (Organization, Breadcrumb, Article, LocalBusiness)
  - `robots.txt`
  - XML sitemap (`/sitemap.xml`)
  - HTML sitemap (`/sitemap`)
  - RSS feed (`/rss.xml`)

## Content Management (Local)

- Blog posts: `content/blog/*.mdx`
- Style guide posts: `content/style-guide/*.mdx`
- Tina-managed site content:
  - `content/site/site-settings.json`
  - `content/site/navigation.json`
  - `content/site/brands.json`
  - `content/site/categories.json`
  - `content/site/locations.json`
  - `content/site/testimonials.json`
  - `content/site/tailored.json`
  - `content/site/page-content.json`
- Tina config: `tina/config.ts`

## Tina Notes

- Local editor route: `/admin`
- Local development uses `tinacms dev`; production builds target TinaCloud via `NEXT_PUBLIC_TINA_CLIENT_ID` and `TINA_TOKEN`.
- The marketing site reads directly from the local MDX/JSON files in `content/`.

## Important Routes

- Home: `/`
- Shopify cart API: `/api/shopify/cart`
- Shopify checkout handoff: `/api/shopify/cart/checkout`
- Appointment booking: `/schedule-appointment`
- Tuxedo rentals: `/suit-tuxedo-rentals`
- Wedding registration: `/register-your-wedding`
- Contact: `/contact-us`
- Locations: `/locations`, `/location/[locationSlug]`
- Designers: `/designers/*`, `/collection-brand/[brandSlug]`
- Men categories: `/for-men/*`
- Blog + style guide: `/blog/*`, `/style-guide/*`
- Admin content editor: `/admin`

## Scripts

- `pnpm dev` - start Next.js + TinaCMS local development mode
- `pnpm build` - generate the TinaCloud admin bundle, then run the Next.js production build
- `pnpm lint` - lint check
- `pnpm format` - format code

## Shopify Rollout Notes

The current implementation prepares the site for a headless Shopify setup rather than a hosted template storefront.

- Add the Storefront API credentials in `.env`
- Keep the front-end in this Next.js app
- Use the built-in cart routes for session management and checkout handoff
- Next implementation milestone:
  - product and collection queries from Shopify
  - add-to-cart actions on product/category pages
  - real cart UI and quantity controls
