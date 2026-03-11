# Ecommerce Rollout Plan

## Current state

- Shopify Storefront API is connected.
- `/shop` renders live Shopify products.
- `/cart` supports live quantity updates, line removal, and checkout handoff.
- A floating cart bar appears when the cart has items.
- Search, sorting, and filter controls are available on the shop page.

## Phase 1: Store alignment

- Confirm the correct Shopify store is connected.
- Confirm which Shopify collections map to J. Barbaro site navigation.
- Replace placeholder shop links with `/shop` once the right catalog is live.
- Define the canonical product taxonomy:
  - departments
  - brands
  - collections
  - seasonal edits

## Phase 2: Catalog architecture

- Build collection-specific landing pages from Shopify data.
- Add individual product detail pages at `/shop/[handle]`.
- Add image galleries, richer descriptions, and variant selectors.
- Add breadcrumb trails and related product recommendations.

## Phase 3: Conversion improvements

- Add persistent cart count to the header.
- Add inline variant selection on listing cards where appropriate.
- Support discount codes or cart notes if needed.
- Add stronger empty-state and no-result merchandising.

## Phase 4: Operational ecommerce

- Connect shipping, tax, and returns messaging to the cart/product pages.
- Add Shopify analytics/search tracking.
- Add merchandising controls for featured products and featured collections.
- Add customer-facing order help content and FAQ pages.

## Phase 5: Full storefront replacement

- Replace `/shop-coming-soon` links with live commerce links.
- Update header/footer/navigation CTAs to point at live commerce routes.
- Blend Shopify catalog pages into existing designer/category routes where it makes sense.
- Remove obsolete placeholder messaging once the catalog is fully live.

## Immediate next build target

1. Confirm the correct Shopify store and product catalog.
2. Create product detail pages.
3. Map Shopify collections into the existing navigation and merchandising sections.
4. Switch the main `Shop Online` route from preview mode to live commerce.
