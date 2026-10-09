# Storefront launch checklist

Reviewed: **2026-10-09**. Source reviewed: `feat/manual-appointment-confirmation` at `6ccf67d`.

This is the remaining work for the public storefront, shopping, forms, and launch operations. **FIX** means a gap was found in the repository. **VERIFY** means the implementation exists but needs a deployment, provider, or staff check. **BUSINESS** means the store must approve the rules or supply supporting information. An unchecked verification item is not proof that the live integration is broken.

The manual appointment changes are on this feature branch. They still need to be merged and deployed for the release. The chosen appointment workflow is staff confirmation by email reply; it does not require PostgreSQL, DynamoDB, or a website approval dashboard.

## Fix or resolve before launch

### 1. FIX — Patch the remaining dependency advisories

- [ ] Update TinaCMS, Nodemailer, and affected transitive dependencies through pnpm; verify compatibility and regenerate the lockfile through the package manager.

**Finding:** Next.js is already `16.3.8`. The fresh `pnpm audit --prod --json` reported **2 critical, 37 high, 64 moderate, and 12 low findings**, across **101 unique advisory records**. No advisory for the `next` package appeared in this audit. These counts describe the dependency graph, not confirmed exploitable paths in the deployed site.

Specific work to investigate:

| Dependency in the reviewed lockfile                                  | Required follow-up                                                                                                                                                                   | Supporting advisory                                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tinacms@3.6.1`                                                      | Upgrade the compatible Tina packages together; the cited editor messaging and rich-text URL fixes are in `3.9.3`. Check the CLI, login, preview, editing, and generated admin build. | [Tina editor messaging advisory](https://github.com/tinacms/tinacms/security/advisories/GHSA-g5qx-h5f3-mp2f), [Tina rich-text advisory](https://github.com/tinacms/tinacms/security/advisories/GHSA-2vcc-5v34-9jc8) |
| `nodemailer@8.0.1`                                                   | Select a maintained version covering all current advisories. The cited parser fix is in `10.0.6`; a major upgrade needs SMTP and type compatibility checks.                          | [Nodemailer parser advisory](https://github.com/nodemailer/nodemailer/security/advisories/GHSA-v53p-9fqp-m79j)                                                                                                      |
| `dompurify@2.4.1` through `tinacms > mermaid`                        | Resolve the affected Tina dependency chain and check all advisories, rather than assuming one old minimum patch fixes every finding.                                                 | [DOMPurify advisory](https://github.com/cure53/DOMPurify/security/advisories/GHSA-p3vf-v8qc-cwcr)                                                                                                                   |
| `protobufjs@7.5.4` through Tina's PostHog/OpenTelemetry dependencies | Resolve the affected chain and assess whether untrusted schema loading is reachable. The cited fix is `7.5.5` on the 7.x line.                                                       | [protobufjs advisory and preconditions](https://github.com/protobufjs/protobuf.js/security/advisories/GHSA-xq3m-2v4x-88gg)                                                                                          |

**Done when:** a fresh audit confirms the selected fixes; remaining findings have a documented exposure assessment and resolution decision; tests, lint, TypeScript, the production build, and Tina/SMTP regression checks pass. Do not run a blind force-upgrade or treat the versions above as a complete future security baseline.

**Evidence:** [package.json](../package.json), [pnpm-lock.yaml](../pnpm-lock.yaml).

### 2. FIX — Stop false success on contact and wedding submissions

- [ ] Require confirmed staff SMTP acceptance before the contact or wedding form announces receipt.
- [ ] Harden the shared email transport and recovery behavior used by these forms.

**Finding:** both routes return success without checking `delivery.internal`. The shared email helper reports `SENT` when `sendMail` resolves without inspecting accepted/rejected recipients. Customer acknowledgments can be sent even when the staff notification fails. Missing-config and error logs can include email addresses and raw provider errors.

**Done when:** missing configuration, rejected recipients, partial acceptance, timeouts, and lost responses produce honest, concise feedback. Send acknowledgments only after staff SMTP acceptance. Preserve form values and distinguish a safe explicit retry from an uncertain send. Apply TLS/timeouts and redacted logging, following the appointment implementation. Add delivery-boundary regression tests and verify monitored staff inboxes.

**Evidence:** [contact route](../src/app/api/contact/route.ts), [wedding route](../src/app/api/wedding-registration/route.ts), [email helpers](../src/lib/email.ts), [ContactForm](../src/components/contact/ContactForm.tsx), [WeddingRegistrationForm](../src/components/tuxedos/WeddingRegistrationForm.tsx).

### 3. FIX / BUSINESS — Connect newsletter enrollment or hide signup

- [ ] Choose the actual marketing provider/audience and connect enrollment, or temporarily remove signup from the public site.

**Finding:** the current route only emails staff and then says “You're on the list.” It does not create a subscriber in a marketing audience or check the email result.

**Done when:** the provider accepts the enrollment before a subscribed status appears; a pending double-opt-in state is described accurately if used. Verify duplicate signups, rejected addresses, outages, timeouts, source attribution, consent, and unsubscribe handling. Keep credentials server-side. If the provider is not ready, hide the signup rather than collect addresses under a false promise.

**Evidence:** [newsletter route](../src/app/api/newsletter/route.ts), [newsletter component](../src/components/marketing/NewsletterSignup.tsx), [email helpers](../src/lib/email.ts).

### 4. FIX — Apply stock ceilings before another add attempt

- [ ] Load reliable available quantity where Shopify permits it, and use it consistently on product pages, Quick Add, and bag controls.

**Finding:** existing limits are learned from Shopify cart warnings. Product variants expose `availableForSale` but do not fetch `quantityAvailable`, so a fresh or reloaded session can attempt an extra unit before learning the limit. Shopify responses and cart confirmation checks remain the final authority.

**Done when:** with stock set to one and one already in the bag, a fresh/reloaded product page and bag immediately prevent an extra add/increment. Count the same variant across wrapped and unwrapped entries. Stock of two or more must still allow multiple units. Use short inline availability text. Treat unknown quantities and intentional backorders separately; never impose a blanket one-item limit. Recheck server responses because stock can change after a page loads.

**Evidence:** [product queries](../src/lib/shopify/products.ts), [variant types](../src/lib/shopify/types.ts), [quantity state](../src/lib/shopify/cart-quantity-state.ts), [quantity context](../src/components/shop/CartQuantityContext.tsx). Shopify documents nullable quantity and backorder fields in the [2026-01 ProductVariant API](https://shopify.dev/docs/api/storefront/2026-01/objects/ProductVariant).

### 5. ADD / BUSINESS — Publish approved purchase policies

- [ ] Approve and publish shipping, delivery, returns, and exchange information near purchase controls and in linked policy pages.

**Finding:** the product page currently offers generic “prepared quickly” and contact copy. It does not explain the actual customer purchase rules.

**Done when:** customers can see processing estimates, delivery estimates, destinations, shipping costs/conditions, return window and item condition, fees if any, exchange procedure, and how to contact order support. State the approved exceptions for altered, custom, special-order, and rental items, plus gift-wrap refund treatment. Keep product, bag, policy, and Shopify checkout wording consistent. Store approval is required; do not invent dates, guarantees, or refund promises.

**Evidence:** [product purchase area](../src/components/shop/ProductDetailClient.tsx), [navigation content](../content/site/navigation.json).

### 6. FIX / BUSINESS — Update commerce terms and privacy information

- [ ] Replace the informational-only description with approved ecommerce terms.
- [ ] Review privacy information against the services actually enabled at launch.

**Finding:** terms still describe the site as informational and appointment-request only. Privacy describes inquiry/appointment use and essential storage, but purchase fulfillment and any marketing/analytics use need an accurate review.

**Done when:** approved text reflects sales, order support, cancellations/returns, actual service providers, data use, and retention practices. Reflect the final newsletter/analytics decisions and keep policy links available. Preserve the accurate manual appointment explanation.

**Evidence:** [terms](../src/app/terms-of-use/page.tsx), [privacy](../src/app/privacy-policy/page.tsx).

### 7. VERIFY / REMOVE — Support review and rating claims

- [ ] Establish the source and permission for retained quotes, ratings, and counts; remove unsupported claims.

**Finding:** the footer and reviews metadata say “verified.” Static testimonials contain `4.7 / 234`, while site settings separately contain `4.8 / 235`. The repository does not establish provenance. Location pages also embed the shared static aggregate in each store's JSON-LD. This review does not establish that the testimonials are fabricated.

**Done when:** every retained claim has supporting evidence; unsupported “verified” wording and aggregates are removed. Homepage, footer, reviews, metadata, and structured data agree. Any location rating actually belongs to that location. If Google reviews are enabled, verify the correct Places IDs, attribution, and supported fallback behavior. Check product review metafields against their actual review provider separately.

**Evidence:** [testimonials](../content/site/testimonials.json), [site settings](../content/site/site-settings.json), [page content](../content/site/page-content.json), [footer](../src/components/layout/SiteFooter.tsx), [Google review integration](../src/lib/google-reviews.ts), [locations page](../src/app/locations/page.tsx), [location detail](../src/app/location/[locationSlug]/page.tsx), [product page](../src/app/shop/[handle]/page.tsx).

### 8. VERIFY / FIX — Match the shipping promotion to checkout

- [ ] Verify the $400+ shipping offer in Shopify and include its material qualifications on mobile.

**Finding:** desktop mentions eligible shipping rates up to $25; mobile only says “Free shipping on $400+.” Shopify's actual shipping/discount configuration cannot be established from this repository.

**Done when:** approved test checkouts below, at, and above $400 behave as advertised. Test rates at and above $25, destination/item exclusions, and discount interactions. Mobile, desktop, homepage, policy, and checkout wording must describe the same approved offer. Amend or remove the promotion if the backend does not support it.

**Evidence:** [header](../src/components/layout/SiteHeader.tsx), [homepage content](../content/site/page-content.json).

## Verify the live integrations before launch

Use staging, test inboxes, and an approved Shopify test-payment environment. These checks can send email or create orders; record the environment and result when actually performed.

### 9. VERIFY — AWS email and staff appointment confirmation

- [ ] Complete the [appointment email release test](appointments-email-setup.md#manual-release-test) with real test inboxes.
- [ ] Assign a staff inbox/calendar owner and backup, with an agreed follow-up process.

**Done when:** SES sender/region/production access and deployed SMTP settings are correct. Staff receives the request, **Reply** addresses the customer, and the customer receives a clearly pending acknowledgment without an invite. Acknowledgment replies go to a monitored showroom inbox. Staff checks the shared calendar, replies with confirmation or an alternative, and enters confirmed visits. Test two requests for the same preferred time and recognize duplicate request references. SMTP acceptance alone does not prove inbox delivery.

The website does not reserve a slot or synchronize a calendar. Staff replies are the confirmation step.

### 10. VERIFY — Gift-wrap product configuration

- [ ] Confirm Shopify product handle `gift-wrap` is published to the correct Storefront channel and configured as the intended paid service.

**Done when:** the offer resolves to the intended variant, shows the current Shopify price, and has suitable stock/inventory, tax, and shipping settings. Do not accidentally restrict every shopper to one wrap through the service's inventory configuration. Check unavailable-wrap handling and confirm the holiday banner matches the live offer. The current offer selector requires one available variant or one total variant.

**Evidence:** [gift-wrap offer loader](../src/lib/shopify/gift-wrap-product.server.ts), [gift-wrap helpers](../src/lib/shopify/gift-wrap.ts), [holiday content](../content/site/page-content.json).

### 11. VERIFY — Cart, gift-wrap pairing, and stock edge cases

- [ ] Run the following cases on both the bag drawer and full bag page; record the final Shopify cart and checkout result.

| Case                                                            | Required result                                                                                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| One item already in the bag; clothing stock is one              | Add gift wrap to that existing item without adding another clothing unit.                                                           |
| Same variant, stock at least two; wrapped and unwrapped entries | Both units can be added, with each wrap attached to the intended entry.                                                             |
| Two wrapped units                                               | Two clothing units and two paid wraps, with matching quantities and identifiable attachment.                                        |
| Increase/decrease quantity or add/remove wrap                   | Item/wrap quantities remain correct; price and subtotal update from confirmed Shopify results.                                      |
| Change product options or a bag item's size                     | Added/updated variant matches the shopper's explicit selection, with its gift-wrap attachment preserved correctly.                  |
| Remove a wrapped item                                           | Its associated wrap is removed too; unrelated items/wraps remain.                                                                   |
| Clear Bag                                                       | Cancel keeps the bag; confirmation clears all item and service lines.                                                               |
| Clothing or wrap becomes unavailable during a change            | No false success, orphan service, zero-quantity display, or permanent mismatch/checkout block. Recovery reflects the returned cart. |
| Refresh, navigate back, open another tab, or lose a response    | Bag state can be recovered without silently duplicating items or services.                                                          |

**Evidence:** [cart API](../src/app/api/shopify/cart/route.ts), [gift-wrap helpers](../src/lib/shopify/gift-wrap.ts), [drawer](../src/components/shop/CartDrawer.tsx), [full bag](../src/components/shop/ShopifyCartClient.tsx).

### 12. VERIFY — Checkout, payment, orders, and fulfillment

- [ ] Complete an approved test order through the hosted Shopify checkout, including a gift-wrapped item.

**Done when:** variant, quantity, price, discounts, shipping, taxes, currency, and final total match the confirmed bag. Test successful payment and a declined/abandoned checkout without duplicate orders. Verify customer/staff order emails, order visibility, shipping/tracking, cancellation, and full/partial refund handling. Fulfillment staff must identify exactly which item and quantity receive gift wrap from the actual order/packing workflow. Apply the approved gift-wrap refund rule.

**Evidence:** [checkout handoff](../src/app/api/shopify/cart/checkout/route.ts). The code redirects to Shopify; source tests do not prove payment or fulfillment setup.

### 13. VERIFY — External POS–Shopify inventory bridge

- [ ] Test stock changes through the existing POS bridge with its operator.

**Finding:** the bridge implementation is outside this repository; storefront code cannot verify it.

**Done when:** selling the last online unit leaves stock at zero after the next POS sync. Verify in-store sales, returns, cancellations, partial refunds, SKU/variant mapping, and repeated sync jobs restore/decrement only the intended quantity. Test competing last-unit purchases under the merchant's actual inventory policy. Confirm backorders/overselling settings are intentional. Keep a stock-reconciliation procedure for launch day.

### 14. VERIFY — Production configuration and domain

- [ ] Check production environment settings privately, rebuild, and verify the deployed site.

**Done when:** `NEXT_PUBLIC_SITE_URL` is the intended HTTPS domain; DNS/certificates and domain redirects work; Shopify store, Storefront channel/token/API version, SMTP sender/recipients, and optional Google settings are correct. The cart persists through the real shopping/checkout flow. Server credentials remain private; restrict any browser Maps key appropriately. Placeholder values in `.env.example` do not establish the production state.

**Evidence:** [environment template](../.env.example), [site constants](../src/lib/constants.ts), [Shopify configuration](../src/lib/shopify/config.ts).

### 15. VERIFY — Customer accounts

- [ ] Test the actual Shopify customer-account destination on mobile and desktop.

**Done when:** sign-in, the offered account-creation flow, existing order access, and return navigation work on the correct account domain. Fix or hide an account promise if the hosted service is unavailable.

**Evidence:** [account route](../src/app/account/page.tsx), [Shopify configuration](../src/lib/shopify/config.ts).

### 16. VERIFY — Tina editing and publishing

- [ ] Test permitted-editor login and the production content save → Git → deployment cycle.

**Done when:** unauthorized users cannot edit content; authorized changes publish correctly; content can be restored. Confirm the intended Tina branch for production and previews before editing: configuration can default to `main`. Repeat editor/preview checks after the dependency upgrade.

**Evidence:** [Tina configuration](../tina/config.ts), [README Tina notes](../README.md#tina-notes), [environment template](../.env.example).

## Final storefront and release checks

### 17. VERIFY / FIX DATA — Catalog, sizing, and business content

- [ ] Review representative shirts, suits, pants, shoes, accessories, single-variant, multi-option, sold-out, and discounted products from the published catalog.
- [ ] Validate imported neck/sleeve/color and EU/US labels against the merchant's actual product data.

**Done when:** prices, compare-at prices, images, garment details, vendor/category assignments, variants, and available sizes are correct. Size labels agree between product page, Quick Add, bag, and order. Legacy sleeve values are not presented as colors in the catalog filters. Verify store names, addresses, hours/holiday closures, phones, maps, social links, rental links, campaign photography rights, and seasonal claims. Do not infer accuracy from a small sample or invent brand authorization.

**Evidence:** [option presentation](../src/lib/shopify/product-option-presentation.ts), [catalog](../src/components/shop/ShopCatalogClient.tsx), [locations](../content/site/locations.json), [page content](../content/site/page-content.json), [site settings](../content/site/site-settings.json).

### 18. VERIFY — Mobile journeys and accessibility

- [ ] Walk through home → collection/search → product → deliberate size → bag → checkout on the deployed release.
- [ ] Check wishlist, account, appointment, contact, wedding, and enabled newsletter flows.

**Done when:** navigation, search suggestions/no-results, filters/reset/back navigation, Quick Add, image gallery, size/fit help, gift wrap, and bag controls work at 320, 375, 390, 430, 768 pixels and desktop. The intended mobile Home / Shop / Search / Wishlist / Cart navigation, header menu, logo, and Account remain usable. Bottom navigation, safe-area padding, keyboard, notices, and sticky controls do not cover required actions. Verify keyboard focus, Escape/focus restoration, screen-reader labels/status/error messages, reduced motion, and 200% zoom. Existing drawer accessibility code does not replace a deployed walkthrough.

### 19. VERIFY — Loading and interaction performance

- [ ] Measure the deployed home, collection, product, and bag pages on a throttled mobile connection.

**Done when:** no major loading delay, layout shift, broken/oversized photography, font failure, or interaction stall blocks shopping. Check initial hero loading, product gallery, search/filter responsiveness, and cart mutation feedback. Record measurements before choosing optimizations; no production performance score was measured in this checklist review.

**Evidence:** [app layout](../src/app/layout.tsx), [hero carousel](../src/components/home/HeroCarousel.tsx), [Next configuration](../next.config.ts).

### 20. VERIFY — SEO and migration behavior

- [ ] Check final-domain metadata, indexing controls, sitemaps, redirects, and structured data.

**Done when:** canonicals and social images use the final domain; `/sitemap.xml` includes representative products, categories, brands, and public content; legacy URLs redirect correctly; missing URLs return real 404s. Prevent preview/staging indexing through the actual hosting configuration. Verify admin indexing controls, public contact/location data, and product/store JSON-LD without unsupported review aggregates. Submit the final sitemap in Search Console. The unused sale placeholder is already excluded from the sitemap and marked `noindex`; removing it is optional cleanup.

**Evidence:** [SEO helpers](../src/lib/seo.ts), [XML sitemap](../src/app/sitemap.xml/route.ts), [sitemap routes](../src/lib/sitemap-routes.ts), [robots](../src/app/robots.ts), [redirects](../next.config.ts), [structured-data helpers](../src/lib/structured-data.ts).

### 21. VERIFY — Release commit, regression checks, and support

- [ ] Review and merge the intended feature work, then run the checks below on the exact release commit.
- [ ] Verify production deployed that commit and appoint a launch-day owner for orders, inboxes, errors, and stock reconciliation.

**Done when:** tests, lint, TypeScript, and the production build pass; the deployed smoke test passes; a known previous deployment can be restored if needed. Staff knows where to see order/email failures and how customers reach support. Configure actionable, redacted error monitoring if the host does not already provide it. No repository CI workflow was found in this review; an automatic gate or recorded manual release check is needed.

## Important follow-up work

These remain open. Decide which must be included in this week's release; none requires rebuilding the completed cart or appointment workflow.

### 22. FIX / SIMPLIFY — Size discovery and recommendation continuity

- [ ] Make “available in selected size” behavior clear and preserve recommended size context when opening a product.

**Finding:** catalog availability defaults to “all,” so selecting a size can include a product whose matching size is sold out unless “In stock” is also selected. A recommendation's preferred variant reaches Quick Add, but its product link only contains the handle.

**Done when:** customers can clearly request in-stock matches for their selected size and understand sold-out results. A recommended size can travel to the product page as a visible suggestion, while still requiring deliberate size confirmation. Test combinations of size, length, color, and stock; avoid changing the completed explicit-selection behavior.

**Evidence:** [catalog](../src/components/shop/ShopCatalogClient.tsx), [recommendations](../src/components/shop/ProductRecommendationsClient.tsx), [product card](../src/components/shop/ShopProductCard.tsx).

### 23. ADD / VERIFY — Shopping-funnel measurement

- [ ] Choose/configure the actual analytics provider and verify any existing Shopify checkout tracking.

**Finding:** no storefront funnel integration was found in source. Current cart events synchronize local UI; they are not analytics. Hosted Shopify tracking may exist separately and was not inspected.

**Done when:** product views, searches, confirmed cart additions, checkout handoffs, purchases, and accepted newsletter signups can be measured. Do not count failed mutations, rejected subscriptions, or duplicate purchase events. Verify checkout attribution and privacy/consent behavior for the chosen tools. Decide explicitly whether measurement is a release gate.

**Evidence:** [cart UI events](../src/lib/shopify/cart-events.ts), [app layout](../src/app/layout.tsx).

### 24. FIX / VERIFY — Remaining form validation and abuse protection

- [ ] Bound request/field sizes and handle malformed JSON with a clear validation response.
- [ ] Validate exact wedding calendar dates and confirm the business rule for past dates.
- [ ] Verify hosting-level spam/rate protection across deployed instances.

**Finding:** contact/wedding/newsletter routes parse unbounded JSON and lack some field maxima; malformed JSON falls into generic server-error handling. Wedding date validation can accept a rolled-over calendar date. Existing rate-limit state is process-local, so it is not a shared limit across instances.

**Done when:** invalid/oversized submissions are rejected safely, impossible dates do not pass, and production spam controls match the hosting model. Keep customer-facing errors concise and personal data out of logs. This does not require adding an appointment database.

**Evidence:** [contact route](../src/app/api/contact/route.ts), [wedding route](../src/app/api/wedding-registration/route.ts), [newsletter route](../src/app/api/newsletter/route.ts), [rate limiter](../src/lib/rate-limit.ts).

### 25. FIX — Reconcile historical project documentation

- [ ] Mark old plans as historical and update current-state guidance.

**Finding:** the old appointment plan describes immediate invitations and a future database workflow. Project context and README rollout notes also contain superseded appointment/cart milestones.

**Done when:** current guidance points to [appointment email setup](appointments-email-setup.md); optional database/approval features are clearly future scope, and completed commerce work is no longer listed as missing.

**Evidence:** [historical appointment plan](appointment-confirmation-workflow-plan.md), [project context](llm-project-context.md), [README rollout notes](../README.md#shopify-rollout-notes), [historical ecommerce rollout](ecommerce-rollout-plan.md).

## Already implemented — retain and regression-test

These are complete in the reviewed source. Live integration checks above remain open.

- [x] Next.js and matching ESLint configuration updated to `16.3.8`.
- [x] Imported Shopify product HTML sanitized, including cache boundaries; safe JSON-LD serializer used.
- [x] Deliberate product size selection, compatible option preservation, and visible required-reselection notices; Quick Add requires selection where appropriate.
- [x] Shopify cart warnings/recoverable errors handled; returned variant and quantity checked before success.
- [x] Holiday gift-wrap banner is the second hero slide; SS26 campaign images are committed.
- [x] Paid gift wrap per item, clear item/service pairing, quantity synchronization, and paired removal.
- [x] Gift wrap can be added to an existing bag item without buying another clothing unit.
- [x] Warning-derived shared variant quantity limits and concise inline availability feedback. Proactive limits after a fresh load remain item 4.
- [x] Clear Bag requires confirmation.
- [x] Appointment requests remain pending until staff replies; staff SMTP acceptance is required, customer acknowledgment failure does not discard the request, and uncertain retries receive call-first recovery.
- [x] Appointment preferred times respect showroom hours/holidays and elapsed times; no appointment database or automatic invite is required.

## Verification and launch sign-off

For application changes, use Node.js 24.x and pnpm 10.28.2 and run:

```bash
pnpm exec tsx --test src/lib/shopify/*.test.ts src/lib/appointments/*.test.ts src/lib/calendar.test.ts src/lib/appointment-email.test.ts src/components/SeoJsonLd.test.ts src/app/api/appointments/route.test.ts
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm audit --prod
git diff --check
```

Add relevant contact, wedding, newsletter, and stock regression tests as those fixes are implemented. The existing appointment setup document records 297 passing tests, lint/type checks, Tina/Next builds, and mocked/intercepted browser checks for the preceding implementation. Those results do not establish live email, checkout, fulfillment, or POS behavior, and were not rerun for this documentation-only review.

This checklist was assembled from repository reads and the fresh production dependency audit. No real inquiries, subscriptions, emails, payments, orders, inventory changes, CMS writes, or deployment changes were performed during this review. The audit exited with code 1 because it reported vulnerabilities.

Before opening the storefront to customers:

- [ ] Resolve items 1–8 or remove the affected customer promise/feature where appropriate; record any remaining dependency exposure decision.
- [ ] Record successful integration checks for items 9–16 in the approved test environment.
- [ ] Complete items 17–21 against the deployed release and fix any shopping-blocking failure.
- [ ] Record the release decision, owner, and timing for follow-up items 22–25.
- [ ] Record the deployed commit, tester, date, environment, and outstanding limitations alongside the completed checkboxes.
