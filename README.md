# J. Barbaro Clothiers (Next.js Rebuild)

Modern, SEO-first rebuild of the J. Barbaro Clothiers website using Next.js App Router, TypeScript, Tailwind CSS, and Prisma + SQLite.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Prisma + SQLite
- MDX content (local files)

## Quick Start

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Push database schema:

```bash
pnpm db:push
```

4. (Optional) Seed sample data:

```bash
pnpm db:seed
```

5. Start development server:

```bash
pnpm dev
```

6. Production build check:

```bash
pnpm build
```

## Environment Variables

See `.env.example`:

- `DATABASE_URL` (default: `file:./dev.db`)
- `NEXT_PUBLIC_SITE_URL` (default: `http://localhost:3000`)
- `ADMIN_PASSWORD` (required for `/admin/appointments`)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_FROM` and optional `SMTP_REPLY_TO`
- Optional notification recipients:
  - `APPOINTMENT_NOTIFICATION_TO`
  - `CONTACT_NOTIFICATION_TO`
  - `WEDDING_NOTIFICATION_TO`

## Key Features

- Full multi-page marketing site with modern luxury design language
- Legacy URL redirect compatibility in `next.config.ts`
- Dynamic brand/category/location routes with static generation
- Appointment booking flow with holiday-aware 30-minute slot logic
- Real-time appointment availability (prevents double-booking on the same location/date/time)
- Appointment confirmation email with Google/Outlook calendar links + `.ics` invite
- Internal email notifications for appointment/contact/wedding submissions
- Contact and wedding submissions send customer confirmation emails
- Tuxedo rentals marketing funnel:
  - `/suit-tuxedo-rentals` catalog page
  - `/register-your-wedding` intake form
  - backend storage via Prisma (`WeddingRegistration`)
- Contact form with honeypot + IP rate limiting
- Admin appointment dashboard with middleware password protection
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
- Core editable data: `src/data/*.ts`
  - brands, categories, locations, nav, testimonials, home content

## Important Routes

- Home: `/`
- Appointment booking: `/schedule-appointment`
- Tuxedo rentals: `/suit-tuxedo-rentals`
- Wedding registration: `/register-your-wedding`
- Contact: `/contact-us`
- Locations: `/locations`, `/location/[locationSlug]`
- Designers: `/designers/*`, `/collection-brand/[brandSlug]`
- Men categories: `/for-men/*`
- Blog + style guide: `/blog/*`, `/style-guide/*`
- Admin appointments: `/admin/appointments`

## Scripts

- `pnpm dev` - start local dev server
- `pnpm build` - production build
- `pnpm lint` - lint check
- `pnpm format` - format code
- `pnpm db:push` - sync SQLite schema
- `pnpm db:seed` - seed sample record(s)
- `pnpm prisma:generate` - regenerate Prisma client
