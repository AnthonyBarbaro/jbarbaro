# Ecommerce Refresh Plan

Date: 2026-04-28
Status: Multi-agent ecommerce refresh implemented and verified
Mission: Evolve the existing site from marketing-first toward ecommerce-first without changing the core brand, architecture, or service identity.

## Current Implementation Snapshot

- Visible navigation is simplified to Shop, Designers, Appointments, Locations, and Cart. Informational routes still exist, but are no longer part of the primary shopping path.
- Homepage is now product-first: commerce hero, five category tiles, best sellers, new arrivals, appointment CTA, store visit CTA, and newsletter signup.
- `/shop` remains the canonical storefront with product grid, search, filters, sort, quick-add for single-variant products, and choose-options behavior for variant-heavy products.
- Product detail pages keep Product JSON-LD, canonical metadata, variant selection, sale pricing, add-to-cart, details accordion, recommendations, and appointment CTA support.
- Cart flow keeps quantity controls, remove, subtotal, checkout handoff, continue shopping, and fit-help appointment messaging.
- Theme mode was removed after review; the active storefront now uses one clean light Shopify-style UI.
- Newsletter signup is email-only and posts to `/api/newsletter` with Zod validation, honeypot, rate limiting, and email/log fallback behavior.
- `/sale-coming-soon` remains directly reachable but is hidden from navigation, removed from XML sitemap output, and marked `noindex, follow`.

The older notes below are retained as historical audit context for how the ecommerce direction evolved.

## Audit Surface

Inspected runtime, content, and planning files:

- `README.md`
- `package.json`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/shop/page.tsx`
- `src/app/shop/[handle]/page.tsx`
- `src/app/cart/page.tsx`
- `src/app/for-men/page.tsx`
- `src/app/for-men/[categorySlug]/page.tsx`
- `src/app/shop-coming-soon/page.tsx`
- `src/app/sale-coming-soon/page.tsx`
- `src/app/api/appointments/route.ts`
- `src/app/api/contact/route.ts`
- `src/app/api/wedding-registration/route.ts`
- `src/app/api/shopify/cart/route.ts`
- `src/app/api/shopify/search/route.ts`
- `src/components/layout/SiteHeader.tsx`
- `src/components/layout/SiteFooter.tsx`
- `src/components/layout/HeaderProductSearch.tsx`
- `src/components/shop/AddToCartButton.tsx`
- `src/components/shop/FloatingCartBar.tsx`
- `src/components/shop/ProductDetailClient.tsx`
- `src/components/shop/ShopCatalogClient.tsx`
- `src/components/shop/ShopProductCard.tsx`
- `src/components/shop/ShopifyCartClient.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/PageHero.tsx`
- `src/components/ui/SectionHeading.tsx`
- `src/components/ui/WaveSection.tsx`
- `src/components/content/PostCard.tsx`
- `src/components/locations/LocationOpenBadge.tsx`
- `src/lib/site-content.ts`
- `src/lib/content.ts`
- `src/lib/cms-defaults.ts`
- `src/lib/seo.ts`
- `src/lib/sitemap-routes.ts`
- `src/lib/email.ts`
- `src/lib/shopify/client.ts`
- `src/lib/shopify/config.ts`
- `src/lib/shopify/products.ts`
- `src/lib/shopify/session.ts`
- `src/lib/shopify/types.ts`
- `src/data/*.ts`
- `content/site/*.json`
- `content/blog/*.mdx`
- `content/style-guide/*.mdx`
- Existing planning docs under `docs/`

Parallel audit workstreams used:

- Design and UX audit
- Ecommerce and merchandising audit
- Architecture and content audit
- Local verification and environment audit

## A. Current State Summary

- The repo is an App Router Next.js site with a strong file-based content model, TinaCMS editing, a working Shopify Storefront layer, and working appointment/contact/wedding submission flows.
- `/shop`, `/shop/[handle]`, `/cart`, predictive search, add-to-cart, checkout handoff, and category-to-Shopify collection bridging are already live.
- The homepage in `src/app/page.tsx` still reads as a marketing and service brochure first: hero, tailoring process, retail banner, categories, brands, appointment block, locations, and journal all compete for attention.
- The shell has a credible luxury baseline through `src/app/globals.css`, `src/app/layout.tsx`, and shared UI primitives, but the hierarchy is too flat and decorative repetition is too high.
- Content and runtime are partially out of sync: core navigation and homepage content still point to `/shop-coming-soon` and retain pre-launch ecommerce messaging even though the live shop exists.

## B. UX and Design Audit

What is already working:

- Typography, color tokens, and dark/ivory contrast already feel like J. Barbaro and do not need a rebrand.
- `PageHero`, `Card`, `Button`, `ShopProductCard`, `HeaderProductSearch`, and `FloatingCartBar` give the site a reusable premium baseline.
- The shop catalog and PDP experience are visually more conversion-aware than the homepage.

What currently hurts quality or conversion:

- The homepage hero splits attention across badges, multiple CTAs, review count, placeholder ecommerce copy, and social proof fragments.
- `WaveSection` and badge treatments are used so often that section hierarchy flattens and the page feels segmented instead of calm.
- The desktop header has three layers of competing information and no strong, always-clear commerce action.
- The appointment block is visually stronger than the shopping path, which is the reverse of the desired end state.
- Locations and journal are useful trust/support sections but occupy too much homepage real estate for an ecommerce-led experience.
- The footer is information-rich but brochure-oriented rather than conversion-oriented.

## C. Ecommerce Audit

- The commerce substrate is real and reusable: live shop page, product detail, predictive search, bag page, floating cart bar, and Shopify-backed category previews.
- The site’s biggest ecommerce weakness is not capability but prominence. The live shop is under-advertised relative to tailoring and appointment flows.
- Core commerce entry points still route to `/shop-coming-soon` in `content/site/navigation.json`, `content/site/page-content.json`, `src/lib/cms-defaults.ts`, and `src/lib/sitemap-routes.ts`.
- The homepage has no live Shopify merchandising section today. It promotes categories and brands, but not live products or curated collection inventory.
- Category discovery is decent through `/for-men` and `/for-men/[categorySlug]`, but the homepage does not use that bridge aggressively enough.
- Header search is strong, but bag access and “Shop” prominence are weaker than they should be for a commerce-first site.

## D. Architecture and Content Audit

Reuse without rewriting:

- `src/lib/site-content.ts` for JSON-backed structured content
- `src/lib/content.ts` for editorial MDX
- `src/lib/cms-defaults.ts` as the content contract
- `tina/config.ts` as the editor schema anchor
- `src/data/men-categories.ts` and `content/site/categories.json` as the category source of truth
- `src/lib/shopify/products.ts` and `src/lib/shopify/types.ts` for live collection and product pulls
- `src/app/for-men/[categorySlug]/page.tsx` as the existing editorial-to-commerce bridge pattern

Current content-model constraints:

- The homepage is one large `homePage` object in `content/site/page-content.json`.
- `heroSlides` and `ctaTiles` are still modeled in `src/lib/cms-defaults.ts` and `tina/config.ts`, but they are not rendered on `src/app/page.tsx`.
- Brand data is editorial only. Categories are the stronger existing bridge into live Shopify.

Do not rewrite:

- App Router structure
- TinaCMS and file-based content
- Shopify client, cart session, or checkout plumbing
- Appointment/contact/wedding flows
- SEO helpers and sitemap patterns

## E. Proposed New Direction

Homepage information architecture:

1. Simplify the hero into a commerce-led entry with one primary shop CTA and one secondary appointment/tailoring CTA.
2. Move high-intent category and collection discovery directly under the hero.
3. Add a live Shopify merchandising module using curated collection handles and existing Shopify fetchers.
4. Keep designer trust and tailoring credibility, but reposition them as support to the shopping journey.
5. Compress locations, testimonials, and journal into lighter support modules lower on the page.

Theme and system direction:

- Keep the existing palette, typography family, and luxury menswear tone.
- Tighten hierarchy by reducing badge/wave overuse, clarifying CTA levels, and differentiating product cards from editorial or utility cards.
- Make the header more commerce-forward with clearer “Shop” and bag pathways while preserving search.
- Make spacing calmer and more intentional, especially on the homepage and shell.

Component strategy:

- Extend the existing UI system rather than replace it.
- Add one or two homepage-specific merchandising components instead of continuing to grow `src/app/page.tsx` inline.
- Reuse `ShopProductCard` and Shopify collection fetchers for live homepage merchandising.

Content strategy:

- Treat `/shop` as the canonical public commerce route.
- Update stale placeholder copy and links across navigation and homepage content.
- Extend the homepage content model minimally for curated collection merchandising rather than inventing a second content system.
- Keep appointments and tailoring present as high-trust value-adds, not the main homepage narrative.

## F. Exact File-Level Implementation Plan

Core homepage and shell changes:

- `src/app/page.tsx`
  - Rebuild section order around commerce-first hierarchy.
  - Remove placeholder ecommerce messaging.
  - Promote categories and live collection merchandising ahead of appointment and locations.
  - Reduce homepage section count or visual weight where sections remain support-only.
- `src/app/globals.css`
  - Tighten global shell/background/shadow usage and reduce decorative noise.
- `src/components/layout/SiteHeader.tsx`
  - Make `/shop` the clear primary commerce entry.
  - Reduce utility-bar competition.
  - Add clearer bag/shop emphasis without removing search.
- `src/components/layout/SiteFooter.tsx`
  - Rebalance the footer toward shopping and trust, with newsletter and utility content de-emphasized.

Reusable UI and merch modules:

- `src/components/ui/Button.tsx`
  - Clarify primary versus secondary CTA hierarchy for commerce-first use.
- `src/components/ui/Card.tsx`
  - Support more differentiated visual roles between product merchandising and support/editorial modules.
- `src/components/ui/SectionHeading.tsx`
  - Reduce repetitive visual weight and allow lighter support sections.
- `src/components/ui/WaveSection.tsx`
  - Keep the motif but make it easier to use more selectively.
- `src/components/shop/ShopProductCard.tsx`
  - Tighten consistency with the refreshed visual system if needed.
- Add homepage-specific merchandising components under `src/components/home/`
  - One for category or collection entry tiles
  - One for a live Shopify collection spotlight or featured product strip

Content model and CMS alignment:

- `src/lib/cms-defaults.ts`
  - Extend `HomePageContent` with a minimal curated merchandising structure for live collection highlights.
- `tina/config.ts`
  - Add the matching editable home-page merchandising fields.
  - Keep editor ergonomics simple and consistent with existing object-list patterns.
- `content/site/page-content.json`
  - Update hero copy and CTA labels/hrefs.
  - Add curated collection merchandising content.
  - Remove stale “coming soon” commerce language.
- `src/lib/site-content.ts`
  - Keep the same loading pattern and update only types if needed.

Navigation and route alignment:

- `content/site/navigation.json`
  - Switch main public commerce links from `/shop-coming-soon` to `/shop`.
- `src/lib/cms-defaults.ts`
  - Update default nav/homepage commerce links to `/shop`.
- `src/data/navigation.ts`
  - Preserve the current category-derived submenu pattern.
- `src/lib/sitemap-routes.ts`
  - Remove or demote stale placeholder pages if they are no longer canonical in the refresh.
- `src/app/shop/page.tsx`
  - Refresh hero framing to match the new commerce-led hierarchy and updated shell.
- `src/app/shop-coming-soon/page.tsx`
  - Keep only if intentionally retained as a secondary explanatory page; otherwise demote from primary UX.

## G. Risk Analysis

Technical risks:

- Live Shopify homepage merchandising increases runtime dependence on Storefront API availability. New sections need the same graceful fallback pattern already used on category pages.
- Tina schema changes must stay synchronized across `tina/config.ts`, `src/lib/cms-defaults.ts`, and `content/site/page-content.json`.
- The local dev environment currently has an existing Tina/Next process, which can mask runtime verification problems if not handled cleanly.

UX risks:

- Over-correcting toward commerce could weaken the local tailoring and appointment credibility that differentiates the brand.
- Leaving too many support sections visually heavy would preserve the current brochure-first feeling even after adding commerce modules.
- Changing the header too aggressively could make the site feel like a rebrand rather than an evolution.

SEO and content risks:

- Changing canonical commerce links without updating internal navigation, sitemap entries, and copy could create mixed signals.
- Removing placeholder copy must not remove useful trust or context from supporting pages.
- CMS drift already exists around unused `heroSlides` and `ctaTiles`; adding more homepage fields without cleanup or intentional reuse would worsen editor confusion.

## H. Verification Plan

Commands to run after each meaningful implementation step:

- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Automated test reality:

- There are currently no app-level `*.test.*` or `*.spec.*` files outside dependencies.
- Verification will therefore be lint, typecheck, build, and manual flow checks.

Manual checks required after implementation:

- Homepage renders and the section order is commerce-first on desktop and mobile.
- Header search, shop entry, and bag access are clearer and still functional.
- `/shop` renders with filters, search, collection query params, and add-to-cart intact.
- `/shop/[handle]` still renders PDP content, variant selection, gallery behavior, and related products.
- `/cart` still loads, updates quantities, removes lines, and hands off to checkout.
- `/for-men` and `/for-men/[categorySlug]` still route cleanly and preserve Shopify-backed category previews.
- `/schedule-appointment` and `/api/appointments` behavior are unchanged.
- `/contact-us` and `/register-your-wedding` flows remain intact if touched.
- Metadata, canonical URLs, and sitemap behavior remain correct where commerce routes change.
- Tina editing still works for all changed homepage/navigation fields.

Current verification notes from audit:

- `pnpm lint` passed.
- `pnpm exec tsc --noEmit` passed.
- `pnpm exec next build` passed.
- `pnpm exec next build` emitted dynamic-render warnings for `src/app/for-men/[categorySlug]/page.tsx` because Shopify collection fetches default to uncached Storefront requests during build; the pages still completed as dynamic routes.
- Manual live-route visual verification is partially blocked by an already-running Tina/Next dev process using ports `9000` and `.next/dev/lock`.
- A running Tina dev process is present from this repo, but its exposed port `4001` is Tina-oriented and not a clean storefront verification surface.
- A direct Shopify Storefront API verification against the local `.env` revealed that the configured storefront is not serving J. Barbaro menswear inventory.
- `collections(first: 12)` currently returns unrelated candy collections including `best-sellers`, `viral-gushers-collection`, `sour-chamoy-bites`, `sour-strips`, and `chamoy-gummies`.
- `products(first: 10)` currently returns unrelated candy products from `Goso Gummies`.
- Every category `shopifyCollectionHandle` in `content/site/categories.json` currently resolves to `collection: null`, which explains why the existing men’s category pages rely on the editorial fallback path instead of live collection previews.
- `pnpm lint` passed after the homepage, shell, and content refresh changes.
- `pnpm exec tsc --noEmit` passed after the homepage, shell, and content refresh changes.
- `pnpm build` is still blocked by the already-running Tina dev process on port `9000`; this is an environment conflict, not a code failure.
- `pnpm exec next build` passed after the refresh changes.
- `pnpm exec next build` still emits the same known dynamic-render warnings for `src/app/for-men/[categorySlug]/page.tsx` because Shopify collection fetches default to uncached Storefront requests.
- Production manual verification was performed by starting `pnpm exec next start -p 3100` from the successful build output.
- Route checks on the production server returned `200` for `/`, `/for-men`, `/for-men/accessories`, `/shop-coming-soon`, `/shop`, `/shop/gusher-bombs`, `/cart`, `/schedule-appointment`, `/contact-us`, and `/register-your-wedding`.
- Homepage manual verification confirmed the new hero copy, browse-first CTAs, category-led section order, refreshed header/footer, and updated metadata/description output.
- `/for-men` manual verification confirmed the updated “Shop by Category” positioning and revised closing CTA copy.
- `/shop-coming-soon` manual verification confirmed it now points public users toward category browsing and contact/appointment paths instead of the temporary live Shopify catalog.
- Cart/session verification confirmed `GET /api/shopify/cart` returns `{ configured: true, cart: null }` before session creation.
- Cart/session verification confirmed `POST /api/shopify/cart` with a test variant from the temporary Shopify catalog successfully created a cart, returned `totalQuantity: 1`, and persisted the cart across a follow-up `GET /api/shopify/cart` using the session cookie.

## I. Open Questions and Approval Points

Original approval point from Phase 1:

- Treat `/shop` as the primary public commerce route for this refresh.

New blocker discovered during Phase 2 verification:

- The active Shopify Storefront configuration is pointing at unrelated non-J. Barbaro inventory, so promoting `/shop` or live Shopify merchandising right now would surface the wrong catalog.

Blocking decision needed before continuing implementation:

- Either provide the correct J. Barbaro Shopify Storefront configuration, or approve a replan that keeps `/shop` de-emphasized for now and shifts the homepage toward category-led discovery, tailoring trust, and editorial shopping entry points without making the live Shopify shop primary.

## Decision Log

Decisions made:

- Preserve Shopify as the commerce backend and do not revisit the older Medusa proposal in `docs/commerce-backend-plan.md`.
- Keep the current App Router, TinaCMS, structured JSON, and file-based content architecture.
- Use categories and existing `shopifyCollectionHandle` mappings as the first-class bridge between editorial navigation and live commerce.
- Make the refresh evolutionary, not a rebrand.
- Pause runtime implementation before changing homepage or shell commerce emphasis because the active Shopify env is serving unrelated inventory.
- User confirmed the unrelated Shopify inventory is intentional temporary test data. Phase 2 should therefore improve ecommerce hierarchy without making the live Shopify catalog the primary public experience yet.

Tradeoffs chosen:

- Prefer minimal schema extension over a new merchandising system.
- Prefer live Shopify collection modules with graceful fallback over hardcoded mock merchandising.
- Prefer selective shell/theme refinement over a global component rewrite.
- After storefront verification, prefer truthful category-led or editorial shopping entry points over linking users to the wrong live Shopify catalog.
- Use `/for-men` and category discovery as the primary shopping spine for this implementation batch, while leaving `/shop` and cart/session flows intact for future storefront cutover.

Mistakes and dead ends documented:

- Older planning docs still assume placeholder commerce or a non-Shopify backend; they are not the active source of truth.
- Attempting to launch a second local Tina dev server failed because an existing process is already bound to port `9000`.
- Attempting to launch a second `next dev` instance failed because the repo already has an active `.next/dev/lock`.
- The original Phase 2 assumption that `/shop` was ready to become the primary commerce entry was incorrect. The `shop-coming-soon` links were acting as a protective buffer from a misconfigured Shopify storefront rather than simple stale copy.

Follow-up work after approval:

- Replan the first implementation slice around the real storefront state.
- If Shopify env is corrected, resume the original `/shop`-first ecommerce refresh plan.
- If Shopify env remains as-is, implement a safer homepage and shell refresh that strengthens category discovery and premium retail presentation without elevating the unrelated live catalog.
- Keep `docs/ecommerce-refresh-plan.md` updated after each implementation step with any replans, findings, and verification notes.

## Phase 2 Replan

Implementation direction for the current storefront state:

- Keep the temporary Shopify storefront accessible for internal testing and future cutover readiness.
- Avoid homepage modules or navigation emphasis that would spotlight the temporary candy catalog.
- Make the homepage more ecommerce-led through category discovery, designer trust, and a clearer browse-first hierarchy.
- Tighten the shell so browsing categories and booking an appointment are the clearest actions.
- Preserve Shopify, cart/session, search, and `/shop` routes without rewriting or removing them.

## Phase 2 Batch 1

Files changed in the first implementation slice:

- `src/app/page.tsx`
  - Rebuilt the homepage around a cleaner browse-first hero, early category discovery, designer trust, tailoring support, and lighter support modules.
- `src/components/layout/SiteHeader.tsx`
  - Simplified the utility bar, exposed content-managed browse/appointment CTAs, and added clearer cart access without removing search.
- `src/components/layout/SiteFooter.tsx`
  - Replaced the dead-end newsletter form with trust, shopping, location, and social/support content.
- `src/components/ui/Button.tsx`
  - Tightened CTA hierarchy and motion for a more premium but restrained feel.
- `src/components/ui/Card.tsx`
  - Refined shared card tone, radius, and padding to support the calmer system.
- `src/components/ui/WaveSection.tsx`
  - Increased section breathing room so the homepage rhythm feels less compressed.
- `src/app/globals.css`
  - Softened the shell background and shared shadow treatment for a cleaner premium baseline.
- `content/site/page-content.json`
  - Updated homepage and `/for-men` copy to support category-led browsing instead of placeholder ecommerce messaging.
- `content/site/navigation.json`
  - Shifted public top-level utility actions toward category browsing, appointment booking, and locations while keeping the temporary online shop preview available.
- `src/lib/cms-defaults.ts`
  - Kept default content aligned with the updated JSON content contract.
- `src/app/shop-coming-soon/page.tsx`
  - Reframed the holding page so it supports the temporary storefront state without sending public users into the test catalog.

Follow-up fit-and-layout refinement:

- `src/app/page.tsx`
  - Adjusted the tailoring-support card padding and heading scale so the “Measurement” card title fits cleanly at the current homepage desktop layout width.

Legacy route cleanup:

- Removed `src/app/shop-coming-soon/page.tsx`.
- Added a permanent redirect from `/shop-coming-soon` to `/for-men` in `next.config.ts`.
- Repointed remaining content and default CMS references from `/shop-coming-soon` to `/for-men`.
- Removed `/shop-coming-soon` from the generated sitemap route list.

Shop page refinement:

- `src/app/shop/page.tsx`
  - Replaced the oversized dark hero with a tighter catalog-first header and a compact promotional spotlight card so products appear sooner while preserving a campaign-ready marketing slot.
  - Removed the placeholder promotional spotlight card after review so the page no longer shows instructional marketing copy before a real campaign asset exists.
  - Removed the inventory/status eyebrow row so the shop page opens with a cleaner title-and-actions header and even less non-product chrome.
  - Added a compact featured-offer banner for `3 Suits for $300` with a direct suiting CTA so the reclaimed header space now carries a real merchandising message.
  - Simplified the offer treatment again into a true banner that only shows `3 Suits for $300`, removing the extra label, explanatory copy, and CTA.
  - Removed the temporary offer banner as requested, returning the `/shop` header to a clean title, description, and action layout until a final campaign treatment is ready.
  - Fixed a footer React key warning by removing the duplicate `/for-men` entry from `footerShoppingLinks` in the navigation content/defaults and hardening the footer list key to use both `href` and `label`.
