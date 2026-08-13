# J. Barbaro Clothiers Project Context

Use this document when explaining the project to another LLM. It is written as a compact architecture and route guide for the current repo.

## Paste-Ready LLM Prompt

You are helping with the `jbarbaro` repo, a Next.js App Router rebuild of the J. Barbaro Clothiers website. It is a TypeScript, React 19, Next.js 16, Tailwind CSS v4, TinaCMS, MDX, JSON-content, and headless Shopify storefront project.

The site is for a luxury menswear retailer in Metro Detroit. It includes a marketing site, product browsing, Shopify cart and checkout handoff, appointment booking, contact forms, wedding registration, locations, brand pages, blog/style-guide content, SEO metadata, JSON-LD, RSS, XML sitemap, and Tina-managed local content.

The project is content-driven:

- `content/site/*.json` holds site settings, navigation, brands, categories, locations, testimonials, tailored swatches, and page copy.
- `content/blog/*.mdx` and `content/style-guide/*.mdx` hold editorial posts.
- `src/data/*` imports and normalizes JSON content for use in pages.
- `src/lib/site-content.ts` exposes the main page copy object from `content/site/page-content.json`.
- `src/lib/content.ts` reads MDX with `gray-matter`.

The app uses Next.js App Router pages under `src/app`. The shared shell is `src/app/layout.tsx`, which renders `SiteHeader`, `SiteFooter`, global Organization JSON-LD, and `FloatingCartBar`. Many pages use `PageHero`, `WaveSection`, `Container`, `Card`, `ButtonLink`, `Badge`, and `SectionHeading`.

Shopify is optional but central to commerce. If `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` are configured, the app fetches products, collections, recommendations, predictive search, cart state, and checkout URL from the Shopify Storefront API. If Shopify is not configured or fails, pages generally show graceful fallback messaging or omit commerce sections.

Forms are email-only. There is no database. Appointment, contact, and wedding submissions are validated with Zod, given generated references, sent through Nodemailer when SMTP env vars exist, and otherwise logged-only. Contact and wedding forms have honeypot fields and in-memory IP rate limiting. Appointment availability is generated from store hours and holiday closures.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- TinaCMS for local content editing/admin
- MDX through `next-mdx-remote`
- Shopify Storefront GraphQL API
- Nodemailer email delivery
- Zod validation
- date-fns for date formatting
- Lucide React icons

## Important Commands

- `pnpm dev`: runs TinaCMS local dev plus `next dev`
- `pnpm build`: builds Tina admin output, then Next.js production build
- `pnpm lint`: runs ESLint over app, scripts, Tina config, and Next config
- `pnpm format`: formats the repo with Prettier

## Environment Variables

Core:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` optional

Shopify:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `SHOPIFY_STOREFRONT_API_VERSION`, default `2026-01`

Tina:

- `NEXT_PUBLIC_TINA_CLIENT_ID`
- `TINA_TOKEN`
- `NEXT_PUBLIC_TINA_BRANCH`
- `TINA_SEARCH_TOKEN` optional

Email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_REPLY_TO` optional
- `APPOINTMENT_NOTIFICATION_TO`
- `CONTACT_NOTIFICATION_TO`
- `WEDDING_NOTIFICATION_TO`

## Global App Shell

### `src/app/layout.tsx`

Root layout for every page. It:

- imports global CSS from `src/app/globals.css`
- builds default metadata with `getDefaultSiteMetadata`
- renders Organization JSON-LD
- builds the simplified primary navigation from site navigation content
- renders `SiteHeader`, `children`, `FloatingCartBar`, and `SiteFooter`
- provides a skip-to-content accessibility link

### Header and Footer

Header components live in `src/components/layout/*`.

- `SiteHeader` renders the desktop top bar, sticky logo/search/CTA/cart header, mobile drawer, social links, top utility links, and navigation.
- `MainNav`, `NavItem`, and `NavDropdown` render the simplified desktop/mobile nav. The visible primary nav is Shop, Designers, Appointments, Locations, and Cart.
- `HeaderProductSearch` calls `/api/shopify/search` for predictive product search.
- `HeaderCartButton` shows cart access and likely live quantity state.
- `SiteFooter` uses navigation/site/social data for footer links, trust copy, and newsletter signup.

## Data and Content Sources

### `content/site/site-settings.json`

Global brand settings: site name, owner, description, logo, social links, rating value, review count, Facebook likes.

### `content/site/navigation.json`

Primary navigation, header top links, header CTAs, footer shopping links, footer utility links, newsletter/footer copy.

### `content/site/page-content.json`

Main copy source for most marketing pages. Exposed through `src/lib/site-content.ts`.

Includes content for:

- home page
- about page
- services page
- contact page
- reviews page
- schedule page
- rentals page
- wedding page
- designers page
- for-men page
- locations page
- tailored clothing page
- our history page
- blog index
- style guide index

### `content/site/categories.json`

Editorial men category definitions mapped to Shopify collection handles:

- Accessories
- Casual Shirts
- Denim
- Dress Shirts
- Footwear
- Formalwear
- Neckwear
- Outerwear
- Suits & Sports Coats
- Sweaters
- Trousers

### `content/site/locations.json`

Two store locations:

- `partridge-creek`: The Mall at Partridge Creek, 17370 Hall Rd. Suite 111, Clinton Township, MI 48038, 586-286-7400
- `great-lakes-crossing-outlet`: Great Lakes Crossing Outlet, Entrance 2, 4712 Baldwin Rd, Suite 209, Auburn Hills, MI 48326, 248-332-2323

Both locations note closure on Easter, Thanksgiving, and Christmas Day.

### `content/site/brands.json`

Designer brand presentation used for directories and dynamic brand pages. Editors can add and
reorder brands in Tina; `shopifyVendor` optionally joins a brand to the exact Shopify Vendor value
without making Tina the source of product availability or counts:

7 Downie St., 7 For All Mankind, AG Jeans, Alberto, Brax, Canali, Ermenegildo Zegna, Eton, Fradi, Gimos, Giorgio Armani, Hagen, Holebrook USA, Jack Victor, Joe's Jeans, L.B.M., Luigi Bianchi, Michael Kors, Monfrere, Paige, Pal Zileri, Ravazzolo, Robert Graham, Stenstroms, SWIMS, Tateossian, Ted Baker, Zanella.

### `content/site/testimonials.json`

Aggregate rating and individual testimonials for homepage and reviews page.

### `content/site/tailored.json`

Tailoring swatch data. Each swatch has an SKU, thumbnail image, and full image.

### `content/blog/*.mdx`

Blog posts:

- `spring-2026-menswear-trends`
- `luxury-suit-fit-guide-detroit`
- `wedding-tuxedo-planning-timeline`

### `content/style-guide/*.mdx`

Style guide posts:

- `building-a-business-casual-capsule-wardrobe`
- `how-to-style-sports-coats-with-denim`

## Route Pages

### `/` - `src/app/page.tsx`

Homepage. It builds metadata from `pageContent.homePage`, renders website JSON-LD, and uses:

- a static commerce-first hero with "Luxury Menswear. Perfect Fit."
- a category grid for Suits, Shirts, Shoes, Accessories, and Formalwear
- best-seller and new-arrival shelves from `getBestSellingProducts` and `getShopProducts`
- graceful product fallback cards when Shopify is unavailable
- appointment CTA for fit help
- location cards with open/closed status
- email-only newsletter signup through `/api/newsletter`

It revalidates every 300 seconds.

### `/about` - `src/app/about/page.tsx`

Brand overview page. It uses `pageContent.aboutPage` and renders:

- hero with primary/secondary CTAs
- overview copy and explore links
- founder spotlight card with image and buttons
- four brand pillars
- bottom CTA

### `/about/our-history` - `src/app/about/our-history/page.tsx`

Company history page. It renders breadcrumbs, breadcrumb JSON-LD, hero copy, milestone cards, and a closing CTA.

### `/services` - `src/app/services/page.tsx`

Services overview. It renders a hero, service highlight cards, and a closing CTA card. Appointment service names from this page are also passed to the appointment form.

### `/reviews` - `src/app/reviews/page.tsx`

Reviews/testimonials page. It renders aggregate rating, review count, star icons, CTA to schedule, and individual testimonial cards.

### `/tailored-clothing` - `src/app/tailored-clothing/page.tsx`

Tailored clothing and made-to-measure landing page. It includes:

- metadata with tailoring keywords
- breadcrumb, Service, and FAQ JSON-LD
- hero with highlights
- fit-focused section with image
- tailoring process steps
- options/services section
- tailoring swatch gallery from `content/site/tailored.json`
- FAQ accordions
- final CTA

### `/suit-tuxedo-rentals` - `src/app/suit-tuxedo-rentals/page.tsx`

Wedding suits and tuxedo rentals page. It uses a full image hero, catalog cards, embedded PDF previews, feature cards, and a closing CTA linking to wedding registration or appointment/contact flows.

### `/register-your-wedding` - `src/app/register-your-wedding/page.tsx`

Wedding party intake page. It renders a hero, intake explainer card, `WeddingRegistrationForm`, next steps, and catalog download buttons.

The form posts to `/api/wedding-registration`.

### `/schedule-appointment` - `src/app/schedule-appointment/page.tsx`

Appointment booking page. It renders a hero and `AppointmentForm`, passing all locations and appointment service types.

The form:

- fetches available time slots from `/api/appointments?locationSlug=...&date=...`
- posts completed appointment requests to `/api/appointments`
- supports store selection, service type, date selection, time slot selection, and customer details

### `/contact-us` - `src/app/contact-us/page.tsx`

Contact page. It renders a hero, support copy card, `ContactForm`, location cards, embedded Google maps, hours, open badges, phone links, directions, and appointment CTA.

The form posts to `/api/contact`.

### `/locations` - `src/app/locations/page.tsx`

Locations index. It renders ItemList and ClothingStore JSON-LD for every store, a hero, location cards with photos, Google Maps embeds, phone links, live open/closed badges, hours, directions, and closing CTAs.

### `/location/[locationSlug]` - `src/app/location/[locationSlug]/page.tsx`

Dynamic location detail page. Static params come from `locations`. Invalid slugs call `notFound()`.

Each page renders:

- metadata based on the location
- breadcrumb and ClothingStore JSON-LD
- breadcrumbs
- hero with store name/address
- store details, phone, open badge, hours, note, appointment/directions buttons
- OpenStreetMap embed

### `/for-men` - `src/app/for-men/page.tsx`

Men's collections hub. It is driven by live Shopify collections merged with editorial category metadata through `resolveMenCategories`.

It renders:

- dark editorial hero with category stats
- featured collection collage
- all live collection cards
- fallback card if no categories are available
- appointment-support closing card

It revalidates every 300 seconds.

### `/for-men/[categorySlug]` - `src/app/for-men/[categorySlug]/page.tsx`

Dynamic collection/category page. Static params come from resolved Shopify/editorial categories. Invalid or unavailable categories call `notFound()`.

Each page renders:

- metadata from category name and description
- breadcrumb JSON-LD and breadcrumbs
- hero for the category
- product preview grid from the Shopify collection
- appointment support card
- related collections list

Important behavior: if Shopify is not configured, `resolveMenCategory` returns null, so category pages are unavailable.

### `/shop` - `src/app/shop/page.tsx`

Merchandise-first shop catalog page. It loads products with `getShopProducts`, keeps a compact
department rail on mobile only, and begins directly with the catalog on larger screens rather than
duplicating the global navigation or showing a promotional masthead or separate sale rail.

If Shopify loads:

- filters available/in-stock products
- renders `ShopCatalogClient`
- preserves product-level compare-at pricing and sale badges

If Shopify fails:

- shows catalog-refresh fallback messaging
- links to the main category routes

`ShopCatalogClient` supports query search, sorting, availability and price filters, type/vendor
filters, category-aware shirt/jacket/pant/shoe/general size groups, validated variant colors, mobile
filters, grid density, and product cards. Malformed Shopify `Color` values such as shirt-fit,
neckline, row, and numeric codes are rejected; the Color control stays hidden until a recognizable
color value exists.

### `/shop/[handle]` - `src/app/shop/[handle]/page.tsx`

Dynamic Shopify product detail page. Static params come from `getShopProductPreviews(100)`.

Each product page:

- loads product by handle
- generates Open Graph/Twitter metadata from product data
- emits Product JSON-LD
- renders `ProductDetailClient`
- loads a candidate pool from the same Shopify vendor
- prioritizes merchant-configured `COMPLEMENTARY` recommendations, with category-affinity best
  sellers as an available-inventory fallback
- filters matching product types to the size currently selected on the source product and uses a
  saved Smart Fit profile for cross-category sizing when available
- shows up to three products in each labeled group using two columns on mobile and three on larger
  screens; candidates without a matching in-stock size are omitted rather than padded

If Shopify is temporarily unavailable, it renders a friendly unavailable state instead of immediately 404ing. If Shopify is available but the product is missing, it calls `notFound()`.

`ProductDetailClient` handles gallery images, swipe navigation, lightbox/zoom, variant option selection, price/availability messaging, sale pricing, description/details accordions, appointment CTA logic, and add-to-cart.

### `/cart` - `src/app/cart/page.tsx`

Shopping bag page. It checks Shopify configuration.

If configured, it renders `ShopifyCartClient` for live cart lines, totals, quantity updates, removal, and checkout handoff.

If not configured, it shows fallback cards linking to shop/categories and appointment booking.

### `/designers` - `src/app/designers/page.tsx`

Designers hub. It uses `pageContent.designersPage`, renders hero, three CTA cards, and popular featured-brand links.

### `/designers/featured-designers` - `src/app/designers/featured-designers/page.tsx`

Featured designers page. It renders breadcrumbs, breadcrumb JSON-LD, hero, and a card grid of all `featuredBrands`, each with image, logo, description, and link to its brand page.

### `/designers/all-designer-brands` - `src/app/designers/all-designer-brands/page.tsx`

Full brand directory. It renders breadcrumbs, breadcrumb JSON-LD, hero, `BrandSearch`, A-Z jump links, and grouped brand links.

### `/collection-brand/[brandSlug]` - `src/app/collection-brand/[brandSlug]/page.tsx`

Dynamic brand page. Static params come from all brands. Invalid slugs call `notFound()`.

Each page renders:

- metadata based on brand data
- breadcrumb JSON-LD and breadcrumbs
- hero for the brand
- brand image and "About" copy
- appointment CTA and all-brands CTA
- related Shopify categories from `resolveMenCategories`
- related brand links

### `/blog` - `src/app/blog/page.tsx`

Blog index. It reads all blog MDX posts through `getCollection("blog")`, renders hero copy from page content, section heading, and `PostCard` grid.

### `/blog/[slug]` - `src/app/blog/[slug]/page.tsx`

Dynamic blog post page. Static params come from blog MDX slugs. Missing posts call `notFound()`.

Each page renders:

- metadata and Article type
- breadcrumb JSON-LD and Article JSON-LD
- breadcrumbs
- post date, title, author, description
- MDX body through `MdxContent`
- CTA cards for appointment and related reading

### `/style-guide` - `src/app/style-guide/page.tsx`

Style guide index. Same structure as blog index, but reads `getCollection("style-guide")`.

### `/style-guide/[slug]` - `src/app/style-guide/[slug]/page.tsx`

Dynamic style guide post page. Same pattern as blog detail, but only emits breadcrumb JSON-LD, not Article JSON-LD. It renders MDX content and CTA cards.

### `/privacy-policy` - `src/app/privacy-policy/page.tsx`

Simple legal page. Hero plus article sections for information collected, use of information, and data retention.

### `/terms-of-use` - `src/app/terms-of-use/page.tsx`

Simple legal page. Hero plus article sections for use of site, content/availability, and limitation.

### `/sitemap` - `src/app/sitemap/page.tsx`

HTML sitemap page. It builds sections for:

- static main routes
- live men categories
- Shopify product previews
- locations
- brands
- blog posts
- style guide posts

It catches Shopify errors so sitemap rendering still succeeds.

### `/sale-coming-soon` - `src/app/sale-coming-soon/page.tsx`

Temporary/placeholder sale page. It explains upcoming seasonal sale events, expected markdown collections, designer capsules, appointment-based access, and links to schedule/contact. It remains reachable by direct URL, but is hidden from primary navigation, removed from the XML sitemap list, and marked `noindex, follow`.

## Metadata and Non-Page Routes

### `/robots.txt` - `src/app/robots.ts`

Allows all crawlers, disallows `/admin/`, and points to `${SITE_URL}/sitemap.xml`.

### `/sitemap.xml` - `src/app/sitemap.xml/route.ts`

XML sitemap route. It uses `getSitemapRoutes()` from `src/lib/sitemap-routes.ts`, outputs XML, marks blog/style-guide routes monthly, others weekly, and revalidates every 300 seconds.

### `/rss.xml` - `src/app/rss.xml/route.ts`

RSS feed for blog posts only. It reads `getCollection("blog")`, escapes XML, and returns RSS 2.0.

## API Routes

### `/api/appointments` - `src/app/api/appointments/route.ts`

GET:

- validates `locationSlug` and `date`
- checks location validity
- generates available 30-minute slots from store hours
- returns holiday/closed messages for Easter, Thanksgiving, Christmas, or closed days

POST:

- validates request body with Zod
- verifies location and date
- rejects holiday closures
- re-checks live availability and selected time slot
- creates an `APT-...` reference
- sends customer/internal appointment emails
- includes Google Calendar, Outlook Calendar, and `.ics` attachment in customer email

### `/api/contact` - `src/app/api/contact/route.ts`

POST-only route for contact form. It:

- validates name, email, phone, message, and honeypot
- silently accepts honeypot spam
- rate-limits by IP, 5 submissions per hour
- creates a `CTC-...` reference
- sends customer/internal contact emails

### `/api/wedding-registration` - `src/app/api/wedding-registration/route.ts`

POST-only route for wedding intake. It:

- validates groom/partner names, phone, email, wedding date, groomsmen count, location, notes, and honeypot
- silently accepts honeypot spam
- validates optional location
- rate-limits by IP, 5 submissions per hour
- creates a `WDG-...` reference
- sends customer/internal wedding registration emails

### `/api/shopify/cart` - `src/app/api/shopify/cart/route.ts`

Dynamic route for Shopify cart session.

- `GET`: reads cart ID from httpOnly cookie, fetches current cart, clears expired cookie if missing
- `POST`: creates cart or adds cart lines; body can be empty to create/load cart
- `PATCH`: updates line quantities
- `DELETE`: removes cart lines

All write payloads are validated with Zod. If Shopify env vars are missing, it returns 503 with missing keys.

### `/api/shopify/cart/checkout` - `src/app/api/shopify/cart/checkout/route.ts`

POST-only checkout handoff. It:

- checks Shopify config
- loads active cart from cookie
- clears expired cart session if necessary
- returns `checkoutUrl` from Shopify

### `/api/shopify/search` - `src/app/api/shopify/search/route.ts`

Predictive product search. Requires Shopify config. For queries shorter than 2 characters it returns an empty result set. Otherwise calls `searchShopProducts(query, 6)`.

### `/api/shopify/men-categories` - `src/app/api/shopify/men-categories/route.ts`

Returns resolved category nav data from `resolveMenCategories`. Response includes whether Shopify is configured and each category label/href/source. Adds public cache headers based on Shopify revalidate seconds.

## Shopify Layer

### `src/lib/shopify/config.ts`

Reads and validates Shopify env vars. Exposes:

- `getShopifyConfigStatus()`
- `getShopifyConfig()`
- `requireShopifyConfig()`
- `SHOPIFY_STOREFRONT_REVALIDATE_SECONDS = 300`

### `src/lib/shopify/client.ts`

Generic Storefront API GraphQL request helper. Adds token header, optional buyer IP, cache mode, response/error validation.

### `src/lib/shopify/products.ts`

Product and collection queries:

- `getShopProducts`
- `getBestSellingProducts`
- `getShopProduct`
- `getShopCollection`
- `getShopCollections`
- `getShopCollectionsWithProducts`
- `getShopProductPreviews`
- `getRecommendedProducts`
- `getProductsByVendor`
- `searchShopProducts`

Uses `unstable_cache` with 300-second revalidation for most reads. Search is no-store.
Category routes render dynamically. The cached collection loader retries a thrown or suspiciously
empty first response before a value can enter the cache. A repeated failure reaches the category
error boundary instead of being presented as a real zero-product category.

### `src/lib/shopify/brands.ts`

Builds the online brand directory from all paginated, available Shopify products. Tina-managed
presentation is attached by exact `shopifyVendor`, with a legacy slug match as fallback. Shopify
remains authoritative for online membership and product counts.

### `src/lib/shopify/men-categories.ts`

Merges editorial categories from `content/site/categories.json` with live Shopify collections. Important behavior:

- if Shopify is not configured, category resolution returns empty/null
- editorial categories are matched by slug or `shopifyCollectionHandle`
- Shopify-only collections are added too
- each resolved category has `source: "editorial" | "shopify" | "merged"`

### `src/lib/shopify/collection-nav.ts`

Builds collection dropdown nav items. Has static defaults, then tries to match live Shopify collections for Accessories, Sports Jacket, Shirts, Tuxedo, Shoes, and Suits.

### `src/lib/shopify/cart.ts`

GraphQL cart operations:

- `getCart`
- `createCart`
- `addCartLines`
- `updateCartLines`
- `removeCartLines`

Normalizes Shopify cart lines, totals, tax, checkout URL, selected options, and product handles.

### `src/lib/shopify/session.ts`

Stores Shopify cart ID in an httpOnly cookie named `jbarbaro_shopify_cart`. Cookie lasts 30 days, sameSite lax, secure in production except local HTTP.

## Forms and Email

### Contact form

Component: `src/components/contact/ContactForm.tsx`

Posts to `/api/contact`. Includes hidden honeypot field `website`.

### Appointment form

Component: `src/components/appointments/AppointmentForm.tsx`

Provides location selection, service selection, quick dates/date input, live slot lookup, customer fields, notes, and submit feedback.

### Wedding form

Component: `src/components/tuxedos/WeddingRegistrationForm.tsx`

Posts to `/api/wedding-registration`. Includes hidden honeypot field `website`.

### Email helper

File: `src/lib/email.ts`

Uses Nodemailer if SMTP is configured. If SMTP is missing, delivery returns `LOGGED`.

It builds branded HTML email templates and sends:

- appointment customer confirmation with calendar links and `.ics`
- appointment internal notification
- contact customer confirmation
- contact internal notification
- wedding customer confirmation
- wedding internal notification

### Calendar helper

File: `src/lib/calendar.ts`

Builds appointment calendar artifacts:

- Google Calendar URL
- Outlook Calendar URL
- `.ics` content

Appointment timezone is `America/Detroit`, and default slot duration is 30 minutes.

### Hours and holidays

Files:

- `src/lib/hours.ts`
- `src/lib/holidays.ts`

They parse store hours, generate available appointment time slots, compute live open/closed status in `America/Detroit`, and close appointments on Easter, Thanksgiving, and Christmas Day.

## SEO

### `src/lib/seo.ts`

Builds default/page metadata, canonical URLs, Open Graph, Twitter metadata, and absolute URLs.

### `src/lib/structured-data.ts`

Builds JSON-LD helpers for breadcrumbs and articles. Pages also create Organization, WebSite, ClothingStore, ItemList, Product, Service, and FAQ JSON-LD inline where needed.

### SEO-related routes

- `src/app/robots.ts`
- `src/app/sitemap.xml/route.ts`
- `src/app/rss.xml/route.ts`
- `src/app/sitemap/page.tsx`

## Design System

The visual system is a luxury menswear editorial style. Common building blocks:

- `PageHero`: dark hero with gold badge, title, description, CTAs
- `WaveSection`: sections with optional decorative wave dividers and background tones
- `Container`: max-width layout wrapper
- `Card` and `CardContent`: repeated content surfaces with ivory/stone/ink tones
- `Button` and `ButtonLink`: primary gold, secondary outline, teal, ghost variants
- `Badge`: small label pills
- `SectionHeading`: reusable section title/description
- `Breadcrumbs`: route context
- `SeoJsonLd`: JSON-LD script renderer

Styles live in `src/app/globals.css`. Images are in `public/images`, including mirrored legacy assets under `public/images/remote/...`.

## TinaCMS

Tina configuration lives in `tina/config.ts`.

Local editor route is `/admin`. The app reads local JSON/MDX files directly from `content/`.

Primary managed content:

- Blog MDX
- Style guide MDX
- site settings
- navigation
- brands
- categories
- locations
- testimonials
- tailored swatches
- page content

## Legacy and Deployment

- `next.config.ts` contains legacy URL redirect compatibility and image/path configuration.
- `vercel.json` indicates Vercel deployment settings.
- The app is intended to be deployed as a modern SEO-first replacement for the old J. Barbaro site.

## What To Be Careful With

- Shopify is optional. Many commerce and category pages depend on env vars and should degrade gracefully.
- Form submissions are not stored in a database. Email delivery/logged-only mode is the only persistence-like behavior.
- Rate limiting is in-memory, so it resets on process restart/serverless instance changes.
- Appointment availability is based only on static hours/holidays, not a real calendar booking system.
- `resolveMenCategories` returns empty when Shopify is not configured, so `/for-men` can show fallback and dynamic category pages may 404.
- The cart ID includes a secret and is intentionally stored only in an httpOnly cookie.
- Dynamic routes rely on local JSON/MDX or Shopify static params.
- Keep content edits in `content/site/*.json` and MDX where possible rather than hard-coding page copy.
