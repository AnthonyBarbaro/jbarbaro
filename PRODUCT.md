# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are people shopping for premium menswear online who need to assess style, brand, price, availability, and fit quickly. The storefront also serves Metro Detroit customers who may continue into an in-person styling, tailoring, or fitting appointment.

Important secondary journeys include wedding and formalwear customers coordinating event attire, and returning customers shopping by known designer, category, or size.

## Product Purpose

J. Barbaro Clothiers is an ecommerce storefront and service gateway for premium menswear. It should make it easy to discover and purchase products while giving customers a clear path to the fit expertise, tailoring support, formalwear coordination, and local appointments that reduce uncertainty around a considered clothing purchase.

Success means shoppers can move confidently from discovery to product evaluation to cart or appointment without the site feeling like a generic catalog.

## Positioning

The product combines an online designer-menswear shop with local, one-on-one fit support. Product discovery, Smart Fit guidance, tailoring expertise, and prepared in-store appointments are parts of one shopping experience rather than separate businesses.

## Operating Context

Customers browse featured merchandise, categories, brands, search results, and filtered product grids. They evaluate product imagery, variants, availability, pricing, and fit guidance before adding an item to the Shopify-backed cart or choosing an appointment.

The same site supports local store discovery, appointment booking, tailored clothing, tuxedo rentals, wedding-party registration, editorial guidance, and contact workflows.

## Capabilities and Constraints

- The storefront is a Next.js App Router application with Shopify Storefront API product, variant, cart, and checkout flows.
- TinaCMS and repository content files supply marketing, navigation, location, testimonial, and editorial content.
- Product availability, prices, images, brands, and variants are dynamic commerce data and must not be invented or hardcoded as durable claims.
- Existing cart, checkout handoff, search, filters, Smart Fit, appointment, and form behavior must be preserved unless a task explicitly changes it.
- The product must remain usable when Shopify data is unavailable; existing fallback and recovery paths are part of the experience.
- Current repository claims such as promotional prices, ratings, review counts, designer availability, and location details are content inputs, not independently verified facts. Future work must not create new claims or silently change them.

## Brand Commitments

Preserve the J. Barbaro Clothiers name, existing logo assets, premium-menswear focus, and service-led voice. The brand should feel knowledgeable, personal, composed, and commercially confident. It should not become a generic marketplace, discount-first retailer, or fashion-tech product.

## Evidence on Hand

- Product and merchandising data from Shopify integrations in `src/lib/shopify/`.
- Current product, brand, category, location, testimonial, navigation, and page content in `content/site/`.
- Existing product, showroom, tailoring, formalwear, campaign, and brand imagery in `public/images/`.
- Implemented shopping journeys in `src/app/shop/`, `src/components/shop/`, and the shared site header and cart.
- Current service and appointment journeys in `src/app/schedule-appointment/`, `src/app/tailored-clothing/`, `src/app/suit-tuxedo-rentals/`, and related components.

No new customer quote, performance metric, press claim, certification, price promise, or inventory statement may be fabricated.

## Product Principles

1. **Lead with merchandise.** Products, categories, availability, and shopping actions should be immediately legible.
2. **Make fit expertise useful.** Fit and appointment support should reduce purchase uncertainty at the moment it matters.
3. **Connect online and in-store journeys.** Shopping, tailoring, formalwear, and local service should feel like one coherent relationship.
4. **Keep premium retail direct.** Use clear hierarchy and decisive actions without adding luxury-themed friction or ornamental clutter.
5. **Earn trust with real evidence.** Use only current product data, content, imagery, and claims already supplied by the business.
