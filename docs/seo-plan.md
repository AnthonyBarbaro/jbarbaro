# J. Barbaro Clothiers SEO Plan

## 1) Technical SEO Foundation
- Keep App Router pages server-rendered by default (Server Components).
- Preserve canonical URLs for every route via shared metadata helper.
- Maintain `robots.txt`, `sitemap.xml`, and HTML sitemap.
- Keep legacy redirect map in `next.config.ts` for old WordPress URLs.
- Ensure clean URL strategy:
  - `/for-men/[categorySlug]`
  - `/collection-brand/[brandSlug]`
  - `/location/[locationSlug]`
  - `/blog/[slug]`
  - `/style-guide/[slug]`

## 2) Indexing & Crawl Control
- Submit `https://<domain>/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Validate canonical-to-self behavior on all indexable pages.
- Keep thin/utility pages (`/admin/*`, API routes) non-indexed by default.
- Monitor coverage for duplicate, alternate, and redirected URLs.

## 3) Core Web Vitals & Performance
- Use `next/image` for all photography and branded assets.
- Keep client JS limited to truly interactive components only.
- Preload critical hero assets and optimize font loading with `next/font`.
- Use static generation where content is stable; selectively use dynamic rendering only where needed.

## 4) On-Page SEO (Commercial + Local Intent)
- Primary conversion pages:
  - Home
  - Locations
  - Schedule Appointment
  - Suit & Tuxedo Rentals
  - Register Your Wedding
- Keep exactly one H1 per page.
- Improve title tags and meta descriptions for intent:
  - "menswear", "tailored clothing", "tuxedo rentals", "wedding suits", "Detroit".
- Add stronger internal links from home/services/designers pages into booking and tuxedo flows.

## 5) Local SEO (High Priority)
- Maintain complete LocalBusiness schema for each store location.
- Include NAP consistency (name, address, phone) sitewide.
- Optimize Google Business Profiles for both locations:
  - service categories
  - hours
  - photos
  - appointment link
  - product highlights
- Build location-specific content:
  - parking, nearby landmarks, eventwear use-cases
  - local testimonials and FAQs

## 6) Structured Data Roadmap
- Sitewide Organization schema (already implemented).
- BreadcrumbList on deep pages (already implemented).
- Article schema for blog/style guide posts (already implemented).
- ClothingStore schema:
  - on each location detail page
  - plus ItemList + store schemas on `/locations`
- Add FAQ schema on booking and tuxedo pages once FAQ content is finalized.

## 7) Ecommerce SEO Readiness
- Launch `/shop` with indexable PLP/PDP architecture:
  - category pages with crawlable filters
  - product pages with unique copy and specs
- Add Product schema once catalog is live:
  - name, image, SKU, offers, availability, price.
- Create editorial buying guides that link directly into category/product pages.

## 8) Content Strategy
- Continue publishing:
  - fit guides
  - seasonal style edits
  - wedding/formalwear timelines
  - designer brand spotlights
- Use internal links from content to:
  - appointment page
  - relevant category pages
  - tuxedo rental flow

## 9) Measurement Plan
- GA4 + Search Console:
  - track appointment submits
  - wedding registrations
  - call clicks
  - map/directions clicks
- Monthly SEO review:
  - rankings by intent cluster
  - page-level CTR and impressions
  - conversion rate by landing page

## 10) 30/60/90 Day Execution
- 30 days:
  - finalize metadata pass on all money pages
  - strengthen internal links
  - deploy local SEO schema/FAQ enhancements
- 60 days:
  - publish 8-12 high-intent style and tuxedo pages
  - improve GBP photo cadence and review requests
- 90 days:
  - launch ecommerce catalog architecture
  - enable Product schema and shopping-oriented landing pages
