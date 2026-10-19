# Storefront launch checklist

Reviewed: **2026-10-19**. Source reviewed: `main` at `2dc5db0`, compared with the previous checklist at `8934651`.

This is the remaining work for the public storefront, shopping, forms, and launch operations. **FIX** means a gap was found in the repository. **VERIFY** means the implementation exists but needs a deployment, provider, or staff check. **BUSINESS** means the store must approve the rules or supply supporting information. An unchecked verification item is not proof that the live integration is broken.

The manual appointment changes and subsequent appointment/navigation improvements are merged into `main`. Production deployment of that commit is still unverified. The chosen appointment workflow is staff confirmation by email reply; it does not require PostgreSQL, DynamoDB, or a website approval dashboard.

## Implementation and current release gates

Implemented changes include hardened contact/wedding receipt handling, bounded form inputs and
exact wedding-date validation, proactive stock ceilings, cross-tab bag refresh, mobile-search focus
handling, disabled newsletter enrollment, removal of unsupported public store-review claims, and
updated purchase/privacy information. Dependencies were upgraded through pnpm to TinaCMS `3.15.0`,
Tina CLI `4.0.3`, Nodemailer `10.1.7`, and tsx `4.23.15`; Nodemailer now supplies its own types.

**Approved purchase rule:** returns within **14 days of receiving the order**, with the original tags
still attached. `/shipping-returns` contains that rule and order-support links. No altered/custom/rental
exclusions, return-shipping charges, gift-wrap refund promises, exchange deadlines, or delivery guarantees
were invented. Those remaining business rules still need confirmation.

**Local verification:** all **426 repository tests** pass, along with lint and TypeScript. The broader
production-browser walkthrough passed **47/47**, HTTP/SEO/policy checks **51/51**, the focused commerce
browser suite **21/21**, and intercepted contact/wedding client scenarios **16/16**. These are synthetic
write-boundary checks, not hosted checkout, inbox, fulfillment, or POS sign-off. The final mobile-search
suite passed **20/20**, Quick Add inventory wiring **2/2**, and production admin CSS/JS returned 200 with
the login shell rendered. Authenticated Tina publishing is still unverified.

**Still open before a public release:** hosted configuration/deployment and domain checks; received
email authentication and full staff/customer workflows; deployed inventory configuration, gift-wrap setup, shipping
promotion, account/checkout/fulfillment and POS verification; authenticated Tina publishing; remaining
policy rules and support ownership; and resolution or an explicit release decision for upstream audit
findings. The user selected **mocked checkout only** for this pass. No live order or POS test was run.

**Inventory permission verified — 2026-10-19:** after the user saved the Headless permissions, a
fresh read-only query using the project's configured token returned HTTP 200, no GraphQL errors,
numeric `quantityAvailable`, and the backorder field. The real application product query also
retained numeric inventory in its mapped variants with one request and no permission fallback.
The permission blocker is resolved for the local project settings; hosted environment parity and
merchant inventory/backorder settings still need verification.

**Homepage reels verified — 2026-10-19:** the homepage shows four featured TikTok videos with their
real local poster images, equal portrait cards on desktop, mobile swipe navigation, and in-site players.
The selection matches the first four posts shown in the official `@jasonbarbaro1` creator embed; it is
saved in site content and can be changed in the editor. It does not automatically refresh when new
posts appear. Responsive/browser checks passed **18/18** across 320–1920 pixel widths, and all four
real videos played with advancing time and no media errors. The final production build passed.

## Original review and recommended order

The authorized code fixes are implemented and locally verified. Provider, hosting, and business sign-off remain separate. The findings below record the original review; completion notes and checked boxes describe the subsequent implementation. Production deployment remains unverified.

| Order                   | Work                                                                                                                                                                                         | Checklist items |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1                       | Patch dependencies and rebuild the Tina admin. The fresh audit includes a critical Tina preview advisory missing from the previous audit; `3.9.3` is no longer a sufficient Tina target.     | 1               |
| 2                       | Make contact/wedding success depend on staff SMTP acceptance, with honest retry recovery, bounded fields, and exact wedding-date validation.                                                 | 2, 24           |
| 3                       | Add proactive stock ceilings and refresh stale bag state across tabs. Preserve unknown-stock and intentional-backorder behavior.                                                             | 4, 11           |
| In parallel             | Choose a newsletter provider/audience or hide signup; approve shipping/returns/exchange rules and commerce terms/privacy; support or remove review claims; reconcile the shipping promotion. | 3, 5–8          |
| Before release          | Record real email, gift-wrap, checkout/order, POS, account, production configuration, and Tina publishing checks. No such live checks were performed in this review.                         | 9–16            |
| Final release pass      | Review catalog/business data and deployed mobile/accessibility, performance, SEO, rollback, and support ownership.                                                                           | 17–21           |
| Explicit scope decision | Decide release timing for size discovery/recommendation continuity, analytics, and historical documentation. Form validation should accompany the delivery fix above.                        | 22–25           |

**Baseline before implementation:** 306 tests, lint, TypeScript, and the production build passed with Node.js `24.19.0` and pnpm `10.28.2`. The build logged Shopify vendor-fetch timeouts for Canali and Eros Clothing Inc; verify those sections on the deployed release. The dependency audit remains failing with **3 critical, 37 high, 64 moderate, and 12 low findings**. Detailed results are recorded below.

**Baseline additional QA:** HTTP/SEO checks passed 43/43; browser checks passed 44/47; focused form checks passed 6/25, reproducing the known delivery/validation problems; focused commerce checks passed 17 scenarios plus their parent test while also confirming the reload stock-limit gap. Browser failures confirm stale bag state across tabs and missing mobile-search focus containment/restoration. These are local checks with mocked write boundaries, not live integration sign-off.

## Fix or resolve before launch

### 1. FIX — Patch the remaining dependency advisories

- [x] Update TinaCMS, Nodemailer, and compatible affected transitive dependencies through pnpm; regenerate the lockfile through the package manager.
- [ ] Resolve or explicitly accept the remaining upstream advisories before release; see the security assessment below.

**Implemented:** updated compatible vulnerable transitive families through pnpm and added narrowly
scoped overrides for `react-use > js-cookie@3.0.7`, OpenTelemetry core 2.x consumers to `2.8.0`, and
qs 6.x consumers to `6.16.0`. A compatibility smoke check passed cookie set/get/remove and
OpenTelemetry baggage propagation. Production audit is now **0 critical, 1 high, 1 moderate, 1 low**;
the complete graph is **0 critical, 2 high, 3 moderate, 1 low**. Both audits still exit 1.

Remaining exposure assessment (source review; not a penetration test):

| Package                                                              | Remaining path and decision                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `braces@3.0.3` — high                                                | Tina search/GraphQL glob tooling; the [advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched version. Repository glob patterns come from editor/build configuration; no public storefront input-to-glob path was found. Keep open for upstream remediation/release decision.                                    |
| `sprintf-js@1.0.3` — moderate                                        | `gray-matter > js-yaml > argparse` and Tina tooling; the [advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) lists no patched version. Application content parsing reads repository MDX, not submitted form data or customer format strings. Keep open for upstream remediation.                                              |
| `katex@0.16.47` — low                                                | Tina's Mermaid editor dependency. Its [advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7) requires existing prototype pollution or control of renderer-option prototypes plus attacker-controlled math. The patch is outside Mermaid's declared compatible range; no forced override was applied.                             |
| `@graphql-tools/utils@9.2.1` — high, build/dev graph                 | Tina CLI GraphQL file loader. The [advisory](https://github.com/advisories/GHSA-7mx3-vvmw-hjmv) concerns malicious results merged in a federated gateway; this application has no such gateway. A move to 12.x would cross the consumer's declared major. Keep open for an upstream compatible release and authenticated editor checks. |
| `postcss-selector-parser@6.0.10 / 6.1.5` — moderate, build/dev graph | Tina CLI Tailwind/typography tooling parsing repository CSS. The [advisory](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) distinguishes trusted build-time selectors from untrusted request-path parsing. The patch is in 7.x; no cross-major override was forced.                                                                 |

The Tina dependency graph still reports the upstream `react-final-form` React 19 peer warning. Build
and local boot checks do not replace authenticated editor/preview/save verification. Audit artifacts:
`/tmp/jbarbaro-launch-audit-final-20261019.json` and
`/tmp/jbarbaro-launch-audit-all-final-20261019.json`. The original findings below are retained for comparison.

**Original finding:** Next.js is already `16.3.8`. The fresh `pnpm audit --prod --json` reported **3 critical, 37 high, 64 moderate, and 12 low findings**, across **102 unique advisory records**. No advisory for the `next` package appeared in this audit. These counts describe the dependency graph, not confirmed exploitable paths in the deployed site.

The additional critical record is TinaCMS's admin-preview iframe advisory, which lists `tinacms <=3.13.0` as affected and `>=3.14.0` as patched. The reviewed baseline version was `3.6.1`. The earlier `3.9.3` messaging/rich-text fixes do not cover this advisory; upgrade compatible Tina packages together and check the complete fresh audit. See the [Tina preview advisory](https://github.com/tinacms/tinacms/security/advisories/GHSA-x34j-47hf-4xg7).

Specific work to investigate:

| Dependency in the reviewed lockfile                                  | Required follow-up                                                                                                                                                                                 | Supporting advisory                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tinacms@3.6.1`                                                      | Upgrade compatible Tina packages together, covering the preview fix in `3.14.0` as well as the older messaging/rich-text fixes. Check the CLI, login, preview, editing, and generated admin build. | [Tina preview advisory](https://github.com/tinacms/tinacms/security/advisories/GHSA-x34j-47hf-4xg7), [Tina editor messaging advisory](https://github.com/tinacms/tinacms/security/advisories/GHSA-g5qx-h5f3-mp2f), [Tina rich-text advisory](https://github.com/tinacms/tinacms/security/advisories/GHSA-2vcc-5v34-9jc8) |
| `nodemailer@8.0.1`                                                   | Select a maintained version covering all current advisories. The cited parser fix is in `10.0.6`; a major upgrade needs SMTP and type compatibility checks.                                        | [Nodemailer parser advisory](https://github.com/nodemailer/nodemailer/security/advisories/GHSA-v53p-9fqp-m79j)                                                                                                                                                                                                           |
| `dompurify@2.4.1` through `tinacms > mermaid`                        | Resolve the affected Tina dependency chain and check all advisories, rather than assuming one old minimum patch fixes every finding.                                                               | [DOMPurify advisory](https://github.com/cure53/DOMPurify/security/advisories/GHSA-p3vf-v8qc-cwcr)                                                                                                                                                                                                                        |
| `protobufjs@7.5.4` through Tina's PostHog/OpenTelemetry dependencies | Resolve the affected chain and assess whether untrusted schema loading is reachable. The cited fix is `7.5.5` on the 7.x line.                                                                     | [protobufjs advisory and preconditions](https://github.com/protobufjs/protobuf.js/security/advisories/GHSA-xq3m-2v4x-88gg)                                                                                                                                                                                               |

**Done when:** a fresh audit confirms the selected fixes; remaining findings have a documented exposure assessment and resolution decision; tests, lint, TypeScript, the production build, and Tina/SMTP regression checks pass. Do not run a blind force-upgrade or treat the versions above as a complete future security baseline.

**Evidence:** [package.json](../package.json), [pnpm-lock.yaml](../pnpm-lock.yaml).

### 2. FIX — Stop false success on contact and wedding submissions

- [x] Require confirmed staff SMTP acceptance before the contact or wedding form announces receipt.
- [x] Harden the shared email transport and recovery behavior used by these forms.

**Original finding:** both routes return success without checking `delivery.internal`. The shared email helper reports `SENT` when `sendMail` resolves without inspecting accepted/rejected recipients. Customer acknowledgments can be sent even when the staff notification fails. Missing-config and error logs can include email addresses and raw provider errors.

**Done when:** missing configuration, rejected recipients, partial acceptance, timeouts, and lost responses produce honest, concise feedback. Send acknowledgments only after staff SMTP acceptance. Preserve form values and distinguish a safe explicit retry from an uncertain send. Apply TLS/timeouts and redacted logging, following the appointment implementation. Add delivery-boundary regression tests and verify monitored staff inboxes.

**Evidence:** [contact route](../src/app/api/contact/route.ts), [wedding route](../src/app/api/wedding-registration/route.ts), [email helpers](../src/lib/email.ts), [ContactForm](../src/components/contact/ContactForm.tsx), [WeddingRegistrationForm](../src/components/tuxedos/WeddingRegistrationForm.tsx).

### 3. FIX / BUSINESS — Connect newsletter enrollment or hide signup

- [x] Temporarily remove newsletter signup from the public site and disable enrollment API responses until a provider is selected.

**Original finding:** the current route only emails staff and then says “You're on the list.” It does not create a subscriber in a marketing audience or check the email result.

**Done when:** the provider accepts the enrollment before a subscribed status appears; a pending double-opt-in state is described accurately if used. Verify duplicate signups, rejected addresses, outages, timeouts, source attribution, consent, and unsubscribe handling. Keep credentials server-side. If the provider is not ready, hide the signup rather than collect addresses under a false promise.

**Evidence:** [newsletter route](../src/app/api/newsletter/route.ts), [newsletter component](../src/components/marketing/NewsletterSignup.tsx), [email helpers](../src/lib/email.ts).

### 4. FIX — Apply stock ceilings before another add attempt

- [x] Load available quantity where Shopify permits it and share it across product, Quick Add, and bag controls.
- [x] Verify the Storefront token in the project's private settings can read numeric inventory after the user enables `unauthenticated_read_product_inventory`.
- [ ] Verify the hosted deployment uses the verified settings and validate actual inventory/backorder policies.

**Live permission follow-up:** the original query and first immediate after-save check returned
`ACCESS_DENIED` for `quantityAvailable`. A subsequent fresh-file application query and a repeat of
the original Shopify `2026-01` probe both passed: HTTP 200, no GraphQL errors, numeric inventory and
backorder metadata present. The application made one product read without the optional-field fallback.
No token replacement, cart/order mutation, or inventory write was performed. This establishes read
permission and application mapping, not a live last-unit purchase or merchant stock-policy sign-off.

Executed from the repository with Node.js `24.19.0`:

```bash
node /tmp/jbarbaro-launch-qa-commerce-20261019/inventory-permission-probe.cjs
node --import tsx /tmp/jbarbaro-launch-qa-commerce-20261019/inventory-app-after-save.cts
```

The application check bypassed only Next's cache wrapper and allowed read-only Shopify queries.
Sanitized results are `inventory-permission-after-save-confirmed-result.json` and
`inventory-app-after-save-result.json` in `/tmp/jbarbaro-launch-qa-commerce-20261019/`.
Two local GETs to `/shop/canali-suit-as10315-12`, two seconds apart, also confirmed HTTP 200 and
numeric inventory in the refreshed rendered product page. This page check created no cart or order.

**Original finding:** existing limits are learned from Shopify cart warnings. Product variants expose `availableForSale` but do not fetch `quantityAvailable`, so a fresh or reloaded session can attempt an extra unit before learning the limit. Shopify responses and cart confirmation checks remain the final authority.

**Done when:** with stock set to one and one already in the bag, a fresh/reloaded product page and bag immediately prevent an extra add/increment. Count the same variant across wrapped and unwrapped entries. Stock of two or more must still allow multiple units. Use short inline availability text. Treat unknown quantities and intentional backorders separately; never impose a blanket one-item limit. Recheck server responses because stock can change after a page loads.

**Evidence:** [product queries](../src/lib/shopify/products.ts), [variant types](../src/lib/shopify/types.ts), [quantity state](../src/lib/shopify/cart-quantity-state.ts), [quantity context](../src/components/shop/CartQuantityContext.tsx). Shopify documents nullable quantity and backorder fields in the [2026-01 ProductVariant API](https://shopify.dev/docs/api/storefront/2026-01/objects/ProductVariant).

### 5. ADD / BUSINESS — Publish approved purchase policies

- [x] Publish the approved rule: returns within 14 days of receiving the order, with original tags still attached. Link `/shipping-returns` in the footer, product purchase section, bag drawer, full bag, terms, and sitemaps.
- [ ] Approve remaining delivery estimates/destinations, item-condition requirements beyond tags, fees, exchange procedure, and exceptions for altered/custom/rental items and gift wrap.

**Original finding:** the product page currently offers generic “prepared quickly” and contact copy. It does not explain the actual customer purchase rules.

**Done when:** customers can see processing estimates, delivery estimates, destinations, shipping costs/conditions, return window and item condition, fees if any, exchange procedure, and how to contact order support. State the approved exceptions for altered, custom, special-order, and rental items, plus gift-wrap refund treatment. Keep product, bag, policy, and Shopify checkout wording consistent. Store approval is required; do not invent dates, guarantees, or refund promises.

**Evidence:** [product purchase area](../src/components/shop/ProductDetailClient.tsx), [navigation content](../content/site/navigation.json).

### 6. FIX / BUSINESS — Update commerce terms and privacy information

- [x] Replace the informational-only description with shopping, Shopify checkout, and order-support information.
- [x] Describe Shopify checkout, SES request emails, wishlist/fit storage, and identifier-free bag synchronization accurately.
- [ ] Confirm business retention practices, remaining purchase rules, and deployed services/settings before final policy sign-off.

**Original finding:** terms still describe the site as informational and appointment-request only. Privacy describes inquiry/appointment use and essential storage, but purchase fulfillment and any marketing/analytics use need an accurate review.

**Done when:** approved text reflects sales, order support, cancellations/returns, actual service providers, data use, and retention practices. Reflect the final newsletter/analytics decisions and keep policy links available. Preserve the accurate manual appointment explanation.

**Evidence:** [terms](../src/app/terms-of-use/page.tsx), [privacy](../src/app/privacy-policy/page.tsx).

### 7. VERIFY / REMOVE — Support review and rating claims

- [x] Remove unsupported static store ratings/quotes and verified wording from rendered fallback, metadata, footer, and location JSON-LD. Preserve stored content for provenance review.
- [ ] Verify live Google Place IDs/attribution and any retained product-review provider claims.

**Original finding:** the footer and reviews metadata say “verified.” Static testimonials contain `4.7 / 234`, while site settings separately contain `4.8 / 235`. The repository does not establish provenance. Location pages also embed the shared static aggregate in each store's JSON-LD. This review does not establish that the testimonials are fabricated.

**Done when:** every retained claim has supporting evidence; unsupported “verified” wording and aggregates are removed. Homepage, footer, reviews, metadata, and structured data agree. Any location rating actually belongs to that location. If Google reviews are enabled, verify the correct Places IDs, attribution, and supported fallback behavior. Check product review metafields against their actual review provider separately.

**Evidence:** [testimonials](../content/site/testimonials.json), [site settings](../content/site/site-settings.json), [page content](../content/site/page-content.json), [footer](../src/components/layout/SiteFooter.tsx), [Google review integration](../src/lib/google-reviews.ts), [locations page](../src/app/locations/page.tsx), [location detail](../src/app/location/[locationSlug]/page.tsx), [product page](../src/app/shop/[handle]/page.tsx).

### 8. VERIFY / FIX — Match the shipping promotion to checkout

- [x] Include the existing $25 shipping-rate qualification on mobile as well as desktop.
- [ ] Verify the $400+ offer and its full conditions in hosted Shopify checkout. Mocked checkout does not establish shipping configuration.

**Original finding:** desktop mentions eligible shipping rates up to $25; mobile only says “Free shipping on $400+.” Shopify's actual shipping/discount configuration cannot be established from this repository.

**Done when:** approved test checkouts below, at, and above $400 behave as advertised. Test rates at and above $25, destination/item exclusions, and discount interactions. Mobile, desktop, homepage, policy, and checkout wording must describe the same approved offer. Amend or remove the promotion if the backend does not support it.

**Evidence:** [header](../src/components/layout/SiteHeader.tsx), [homepage content](../content/site/page-content.json).

## Verify the live integrations before launch

**Current user instruction: mocked checkout tests only.** No live carts, payments, orders, inventory, or POS mutations were authorized for this implementation pass. The hosted checks below remain open; they require a separately approved environment. SMTP is disabled in the local preview and test boundaries are synthetic.

### 9. VERIFY — AWS email and staff appointment confirmation

- [x] Standalone SMTP test accepted for `info@jbarbaro.com`; the user's screenshot confirms inbox receipt of the matching test reference.
- [x] Authenticate the approved sending domain `jbarbaro.com` in SES `us-west-1` with 2048-bit Easy DKIM and verify public DNS/SES status.
- [x] Switch local `SMTP_FROM` to `J. Barbaro Clothiers <info@jbarbaro.com>` and send a new test accepted by SMTP.
- [ ] Resolve the sender-verification warning shown by Outlook and inspect authentication results on a new test.
- [ ] Apply the approved sender to hosted production settings and verify the deployed sending path.
- [ ] Complete the [appointment email release test](appointments-email-setup.md#manual-release-test) with real test inboxes.
- [ ] Assign a staff inbox/calendar owner and backup, with an agreed follow-up process.

**Subsequent live SMTP test — 2026-10-19:** after local configuration and SES identity corrections, `node /tmp/jbarbaro-send-smtp-test-20261019.cjs` sent one test message using the local SMTP settings. The receipt confirmed one accepted recipient, zero rejected, and zero pending. The screenshot matches test reference `3852b153-6467-465b-b8b4-fcec5ea8d7ea`, confirming inbox delivery, but Outlook displays an unverified-sender warning for the `barbaro.tech` sender via Amazon SES. No further email was sent while investigating that warning.

**Confirmed header diagnosis:** the user supplied the matching message headers. Microsoft reports:

| Check                              | Result              | Authenticated domain                | Aligned with visible From domain `barbaro.tech`? |
| ---------------------------------- | ------------------- | ----------------------------------- | ------------------------------------------------ |
| SPF                                | Pass                | `us-west-1.amazonses.com`           | No                                               |
| DKIM                               | Pass                | `amazonses.com`                     | No                                               |
| DMARC                              | Fail, `action=none` | Visible From domain: `barbaro.tech` | Neither passing check aligns                     |
| Microsoft composite authentication | Fail, `reason=001`  | —                                   | Sender-verification warning remains              |

This is a domain-alignment failure in the original `barbaro.tech` test: Amazon's infrastructure authenticates, but that message does not authenticate the visible sender domain. The user subsequently approved `jbarbaro.com` as the actual sending domain. It was configured in SES region `us-west-1` as recorded below; a new received test must show an aligned passing DKIM signature and `dmarc=pass`. A correctly configured custom MAIL FROM domain provides an alternative SPF-alignment path. See [AWS SES DMARC guidance](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dmarc.html), [Easy DKIM](https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim-easy.html), and [Microsoft's sender-verification explanation](https://support.microsoft.com/en-gb/outlook/mail/phishing-and-suspicious-behavior-in-outlook?nochrome=true).

Public TXT lookups found DMARC monitoring policies (`p=none`) on both `barbaro.tech` and `jbarbaro.com`. Neither root SPF record explicitly includes Amazon SES; that is not the SPF domain checked in the original message. The subsequent authentication setup confirmed the AWS account matches the SMTP credentials and owns the authoritative Route53 zone for `jbarbaro.com`.

**Approved domain authentication — 2026-10-19:** created the `jbarbaro.com` SES domain identity in `us-west-1`, enabled 2048-bit Easy DKIM, and added its three generated CNAME records with create-only DNS changes. SES's returned `SigningHostedZone` was used for their targets. Verification observed domain `SUCCESS`, DKIM `SUCCESS`, signing enabled, verified for sending, Route53 `INSYNC`, all three public CNAMEs resolving correctly, and zero original DNS records changed or missing. SES production access and sending were enabled. Existing MX, SPF, DMARC, and other DKIM records were preserved.

Local `SMTP_FROM` is now `J. Barbaro Clothiers <info@jbarbaro.com>`. One new test was accepted with one recipient and zero rejected/pending; its reference is `bfcf0605-1a54-49ea-96fb-6983b933adc4`. Inbox delivery, the received message's authentication results, and hosted production sender settings still need verification. See the [approved domain settings](appointments-email-setup.md#verified-sending-domain).

Executed setup and verification commands used Node.js `24.19.0`:

```bash
node /tmp/jbarbaro-domain-auth-preflight.cjs
node /tmp/jbarbaro-create-ses-domain.cjs
node /tmp/jbarbaro-publish-ses-dkim.cjs
node /tmp/jbarbaro-check-domain-auth.cjs
node /tmp/jbarbaro-use-domain-sender.cjs
node /tmp/jbarbaro-send-smtp-test-20261019.cjs
```

All commands completed successfully; the verification command was repeated after propagation until SES and Route53 reported success. Temporary scripts/state are under `/tmp/jbarbaro-domain-auth-*` and related paths above. The private `.env` remains ignored; only its sender setting changed. Public sender defaults were also updated in `.env.example`.

This standalone test does not verify a deployed appointment submission, customer acknowledgment, staff reply workflow, or calendar handling. SES production access and sending were verified separately by API above. Those checks remain open below.

**Done when:** SES sender/region/production access and deployed SMTP settings are correct. Staff receives the request, **Reply** addresses the customer, and the customer receives a clearly pending acknowledgment without an invite. Acknowledgment replies go to a monitored showroom inbox. Staff checks the shared calendar, replies with confirmation or an alternative, and enters confirmed visits. Test two requests for the same preferred time and recognize duplicate request references. SMTP acceptance alone does not prove inbox delivery.

The website does not reserve a slot or synchronize a calendar. Staff replies are the confirmation step.

### 10. VERIFY — Gift-wrap product configuration

- [ ] Confirm Shopify product handle `gift-wrap` is published to the correct Storefront channel and configured as the intended paid service.

**Done when:** the offer resolves to the intended variant, shows the current Shopify price, and has suitable stock/inventory, tax, and shipping settings. Do not accidentally restrict every shopper to one wrap through the service's inventory configuration. Check unavailable-wrap handling and confirm the holiday banner matches the live offer. The current offer selector requires one available variant or one total variant.

**Evidence:** [gift-wrap offer loader](../src/lib/shopify/gift-wrap-product.server.ts), [gift-wrap helpers](../src/lib/shopify/gift-wrap.ts), [holiday content](../content/site/page-content.json).

### 11. FIX / VERIFY — Cart, gift-wrap pairing, and stock edge cases

- [x] Add identifier-free cross-tab invalidation plus focus/visibility revalidation for existing bag views and shared variant quantities.
- [ ] Run the following cases on both the bag drawer and full bag page; record the final Shopify cart and checkout result.

**Additional source finding:** cart synchronization dispatches window-local `CustomEvent`s. The drawer, full bag, and quantity provider have no cross-tab signal or focus/visibility refresh in these paths, so an already-open view can retain stale quantities after another tab changes the cart. Checkout does fetch the current Shopify cart. Client mutation serialization is tab-local and server serialization is process-local; test competing changes across tabs and deployed instances. This review did not demonstrate duplicate orders or live inventory corruption.

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

**Evidence:** [cart API](../src/app/api/shopify/cart/route.ts), [gift-wrap helpers](../src/lib/shopify/gift-wrap.ts), [drawer](../src/components/shop/CartDrawer.tsx), [full bag](../src/components/shop/ShopifyCartClient.tsx), [cart events](../src/lib/shopify/cart-events.ts), [quantity provider](../src/components/shop/CartQuantityContext.tsx), [client mutation serialization](../src/lib/shopify/cart-request.ts).

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

### 18. FIX / VERIFY — Mobile journeys and accessibility

- [x] Contain search focus and restore the trigger on Escape, close, and backdrop; clean up on navigation and desktop breakpoint.
- [ ] Walk through home → collection/search → product → deliberate size → bag → checkout on the deployed release.
- [ ] Check wishlist, account, appointment, contact, wedding, and enabled newsletter flows.

**Original executed finding:** at 390 pixels, keyboard focus left the open search dialog on the second Tab in the tested sequence. Escape closed it without returning focus to the Search trigger. The mobile menu, bag drawer, and Quick Add did restore trigger focus in their sampled checks. See [mobile search lifecycle](../src/components/layout/MobileBottomNav.tsx).

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

- [x] Manual appointment and subsequent appointment/navigation work is present on `main` at `2dc5db0`.
- [ ] Select the final release commit after remaining fixes and run the checks below on that exact commit.
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

- [x] Bound actual streamed body bytes and field sizes; return clear 400/413 validation responses. Newsletter API is disabled without reading/storing submissions.
- [x] Validate exact wedding calendar dates, including leap-year rules.
- [ ] Confirm the business rule for past wedding dates; existing acceptance remains unchanged.
- [ ] Verify hosting-level spam/rate protection across deployed instances.

**Original finding:** contact/wedding/newsletter routes parse unbounded JSON and lack some field maxima; malformed JSON falls into generic server-error handling. Wedding date validation can accept a rolled-over calendar date. Existing rate-limit state is process-local, so it is not a shared limit across instances.

**Done when:** invalid/oversized submissions are rejected safely, impossible dates do not pass, and production spam controls match the hosting model. Keep customer-facing errors concise and personal data out of logs. This does not require adding an appointment database.

**Evidence:** [contact route](../src/app/api/contact/route.ts), [wedding route](../src/app/api/wedding-registration/route.ts), [newsletter route](../src/app/api/newsletter/route.ts), [rate limiter](../src/lib/rate-limit.ts).

### 25. FIX — Reconcile historical project documentation

- [x] Mark superseded appointment/ecommerce plans and project context as historical; update README commerce/form guidance and point to current email setup.

**Original finding:** the old appointment plan describes immediate invitations and a future database workflow. Project context and README rollout notes also contain superseded appointment/cart milestones.

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
- [x] Warning-derived shared variant quantity limits and proactive inventory ceilings with concise inline feedback. The local token's inventory read permission is verified; hosted configuration and stock-policy checks remain item 4.
- [x] Clear Bag requires confirmation.
- [x] Appointment requests remain pending until staff replies; staff SMTP acceptance is required, customer acknowledgment failure does not discard the request, and uncertain retries receive call-first recovery.
- [x] Appointment preferred times respect showroom hours/holidays and elapsed times; no appointment database or automatic invite is required.

## Implementation verification — 2026-10-19

### GitHub main readiness follow-up

Read-only GitHub verification found remote `main` and the local base both at `2dc5db088f38`.
The working-tree changes are still uncommitted and unpushed. The private `.env` is ignored; a scan
of 58 changed/new files found no matches for configured secret values. This is a targeted credential
check, not a claim that every possible secret pattern was audited.

The final code review reproduced one additional bag race: a delayed manual refresh could overwrite
a newer cross-tab result, or cancel the provider's newer read before it returned. Corrected
`CartDrawer.tsx` and `ShopifyCartClient.tsx` so invalidation removes the obsolete read's authority,
preserves explicit-refresh intent for one fresh reconciliation, and restores retry controls when
provider refresh fails. Active mutation guards and uncertain-response notices remain intact.

After the correction, all **406 repository tests**, lint, TypeScript, and the production build passed;
the broader browser walkthrough passed **47/47**. Six additional controlled-response regressions
passed for the drawer and full bag: newer background result before old manual response, the reverse
response ordering after invalidation, and failed provider refresh followed by recovery. These used
synthetic cart responses; no live cart, payment, order, or inventory change occurred.

The full commerce browser run also passed **21/21**, including all six new cases, with zero browser
errors. Its final output is `browser-premerge-final.log` and its report is `browser-results.json` in
`/tmp/jbarbaro-launch-qa-commerce-20261019/`.

Commands repeated from the repository with Node.js `24.19.0`:

```bash
pnpm exec tsx --test $(rg --files src | rg '\.test\.ts$' | sort)
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
node /tmp/jbarbaro-launch-qa-browser.mjs
QA_BASE_URL=http://127.0.0.1:3100 QA_ONLY=manual node /tmp/jbarbaro-launch-qa-commerce-20261019/browser-regressions.mjs
QA_BASE_URL=http://127.0.0.1:3100 node /tmp/jbarbaro-launch-qa-commerce-20261019/browser-regressions.mjs
git diff --check
```

The final build retained production admin asset references and completed with one vendor-cache
read timeout for Fabian Couture Group Int ' L. Verify that catalog section on deployment; a successful
build does not establish live catalog completeness. Existing audit advisories and hosted integration
checks remain as listed above. Evidence is in `/tmp/jbarbaro-main-readiness-*` and
`/tmp/jbarbaro-launch-qa-commerce-20261019/manual-refresh-after-fix.log`.

### Full implementation checks

Executed using Node.js `24.19.0` and pnpm `10.28.2`, with all Shopify/email write boundaries mocked:

```bash
export PATH=/home/anthony/.nvm/versions/node/v24.19.0/bin:$PATH
pnpm exec tsx --test $(rg --files src | rg '\.test\.ts$' | sort)
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm audit --prod --json
pnpm audit --json
git diff --check
```

The full suite passed **406 tests, zero failures/skips**; lint, TypeScript, Tina/Next production builds,
and diff check passed. Build output generated 592 static pages and regenerated `tina/tina-lock.json`.
The final build had upstream duplicate console-timer warnings but no catalog timeout; an earlier build
in this implementation pass logged one F/X Fusion vendor-fetch timeout. That is not catalog sign-off.

The production admin initially failed its asset check because active development watchers rewrote
`public/admin/index.html` with localhost Vite references after the build. Stopped the matching repository
watchers, rebuilt with the project command, and verified production `/admin/assets/` CSS/JS returned 200,
with no localhost/development markers and no page exceptions. The logged-out admin still emitted a
TinaCloud session warning and a 401 for `identity.tinajs.io/v2/apps/[redacted]/billing/state`; authenticated
login, account/billing status, preview, edit, and publish remain unverified. No CMS content was saved.

Local preview and browser commands:

```bash
SMTP_HOST= SMTP_USER= SMTP_PASS= APPOINTMENT_NOTIFICATION_TO= CONTACT_NOTIFICATION_TO= WEDDING_NOTIFICATION_TO= pnpm start --hostname 127.0.0.1 --port 3100
node /tmp/jbarbaro-launch-qa-http.mjs http://127.0.0.1:3100
node /tmp/jbarbaro-launch-qa-browser.mjs
node /tmp/jbarbaro-launch-qa-forms-ui.mjs
QA_BASE_URL=http://127.0.0.1:3100 node /tmp/jbarbaro-launch-qa-commerce-20261019/browser-regressions.mjs
QA_ONLY='Quick Add' QA_BASE_URL=http://127.0.0.1:3100 node /tmp/jbarbaro-launch-qa-commerce-20261019/browser-regressions.mjs
node /tmp/jbarbaro-mobile-search-regression.mjs http://127.0.0.1:3100
node /tmp/jbarbaro-admin-boot-check.mjs http://127.0.0.1:3100
```

| Check                             | Result and limits                                                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP/SEO/policy                   | **51 passed**; public routes, redirects/404, sitemap/RSS, metadata, receipt-based return rule, policy links, and removal of store aggregates. An initial harness mistake failed to flatten JSON-LD arrays; corrected the reader and reran successfully. |
| Broader browser walkthrough       | **47 passed**; viewport/layout checks, deliberate variant selection, bag actions/recovery, cross-tab update, search, wishlist, and sampled labels.                                                                                                      |
| Contact/wedding client            | **16 passed**; all requests intercepted. Preserved fields/reference on safe retry, changed-field references, duplicate-submit blocking, and uncertain/lost/non-JSON recovery.                                                                           |
| Stock/cross-tab browser           | **14 passed**; reload stock ceilings, stock above one, unknown/backorders, wrapped/plain shared budgets, two real browser tabs, focus/visibility, stale reads, no GET loop, lost-response notice preservation, and token privacy.                       |
| Quick Add inventory wiring        | **2 passed**; synthetic catalog stock with intentionally absent cart inventory confirms the actual component passes the variant inventory.                                                                                                              |
| Mobile search after final rebuild | **20 passed**; both Tab directions/dynamic links, Escape/button/backdrop restoration, overflow restoration, route/back cleanup, desktop breakpoint, and reduced motion; zero page errors or writes.                                                     |
| Production admin boot             | CSS/JS **200**, login shell rendered, no page errors. Logged-out provider 401/session warning remains; no authenticated edit/save test.                                                                                                                 |
| Formatting                        | Changed authored files pass Prettier. The aggregate changed-file check warned only on generated `tina/tina-lock.json`; preserved the generator's single-line output, which is also the baseline format.                                                 |
| UI detector                       | 14 existing typography advisories, no errors; exit 2 for advisories. Existing styling retained.                                                                                                                                                         |
| Security audit                    | Production **0 critical / 1 high / 1 moderate / 1 low**; full graph **0 critical / 2 high / 3 moderate / 1 low**. Both exit 1; exposure assessment is in item 1.                                                                                        |

Test artifacts are under `/tmp/jbarbaro-launch-*`, `/tmp/jbarbaro-mobile-search-regression-results.json`,
and `/tmp/jbarbaro-admin-boot-results.json`. The 14-case commerce report was completed before the
additional Quick Add case was appended; the latter has its own targeted passing report. Browser
fixture/timing corrections are recorded in those logs and did not suppress application failures.
The earlier baseline review/results below are retained as historical evidence.

## Baseline verification and launch sign-off

For application changes, use Node.js 24.x and pnpm 10.28.2 and run:

```bash
pnpm exec tsx --test src/lib/shopify/*.test.ts src/lib/appointments/*.test.ts src/lib/calendar.test.ts src/lib/appointment-email.test.ts src/components/SeoJsonLd.test.ts src/app/api/appointments/route.test.ts
pnpm lint
pnpm exec tsc --noEmit --incremental false
pnpm build
pnpm audit --prod
git diff --check
```

Add relevant contact, wedding, newsletter, and stock regression tests as those fixes are implemented. The existing appointment setup document records historical browser checks with intercepted submissions; those do not establish live email, checkout, fulfillment, or POS behavior.

### Results from the 2026-10-19 review

Commands below ran against `main` at `2dc5db0`, using Node.js `24.19.0` and pnpm `10.28.2`:

| Command                                                                                                                                                                                                            | Observed result                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec tsx --test src/lib/shopify/*.test.ts src/lib/appointments/*.test.ts src/lib/calendar.test.ts src/lib/appointment-email.test.ts src/components/SeoJsonLd.test.ts src/app/api/appointments/route.test.ts` | Passed: 306 tests, zero failed/skipped. Email and Shopify boundaries are mocked.                                                                                             |
| `pnpm lint`                                                                                                                                                                                                        | Passed.                                                                                                                                                                      |
| `pnpm exec tsc --noEmit --incremental false`                                                                                                                                                                       | Passed.                                                                                                                                                                      |
| `pnpm build`                                                                                                                                                                                                       | Passed Tina and Next production builds. Shopify vendor-cache revalidation logged `ETIMEDOUT` for Canali and Eros Clothing Inc; live content completeness remains unverified. |
| `pnpm audit --prod --json`                                                                                                                                                                                         | Exit 1: 3 critical, 37 high, 64 moderate, 12 low findings; 102 unique advisory records.                                                                                      |
| `pnpm exec prettier --check docs/launch-checklist.md`                                                                                                                                                              | Passed after formatting this checklist.                                                                                                                                      |
| `git diff --check`                                                                                                                                                                                                 | Passed.                                                                                                                                                                      |

Initial sandbox attempts hit a local IPC restriction for `tsx`, DNS failure for the audit, and a TypeScript subprocess-output error during the build. The documented test command, audit, and build were rerun outside the sandbox to obtain the results above.

This review inspected all numbered checklist items, Git history, source, and the fresh audit. No real inquiries, subscriptions, emails, payments, orders, inventory changes, CMS writes, or deployment changes were performed. Only this checklist was edited; remaining implementation and business decisions are still open.

### Additional local launch tests — 2026-10-19

Tested the existing production build at `http://127.0.0.1:3100`. SMTP was disabled for the preview process. Form boundary tests used isolated synthetic environments with Nodemailer mocked and network calls blocked. Browser cart, checkout, search responses, and form submissions were intercepted; no live orders, cart mutations, or emails were created.

| Area                       | Observed result                           | Coverage and limits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP / SEO                 | 43 passed, 0 failed                       | 21 public HTML routes, a real missing-page 404, seven permanent redirects, robots admin exclusion, RSS, sampled canonicals/social-image URLs, and account-link shape. Sitemap contained 575 URLs, including 472 products, nine categories, and 37 shoppable brands. External sign-in and final-domain hosting were not tested.                                                                                                                                                                       |
| Browser journeys           | 44 passed, 3 failed                       | Home, shop, sampled product, and empty bag at 320/375/390/430/768/1440 pixels had no horizontal page overflow. Four additional service/wishlist pages passed the mobile overflow check. Size confirmation, Quick Add, bag quantity updates, Clear Bag cancel/confirm, lost-response recovery, checkout-error feedback, wishlist persistence, contact field preservation on error, and sampled accessible names passed. Corrected-fixture interaction checks reported no unhandled JavaScript errors. |
| Form delivery / validation | 6 passed, 19 failed                       | Valid contact/wedding SMTP controls, invalid email rejection, and same-process newsletter rate limiting passed. Launch-behavior assertions failed for missing SMTP (three cases), rejected/partial/timed-out staff mail (six), malformed JSON returning 500 (three), impossible wedding dates (three), false newsletter enrollment (one), oversized names (two), and explicit transport TLS/timeout configuration (one). These are 19 failing cases, not 19 independent defects.                     |
| Commerce boundaries        | 17 scenarios plus parent passed, 0 failed | Real helpers and actual cart/checkout routes with mocked Shopify transport/cookies verified shared wrapped/unwrapped quantity budgets, gift-wrap pairing, invalid-checkout rejection, and lost-response removal/clear reconciliation. A characterization test reproduced the unresolved stock-limit reload gap. Mocked native-child removal behavior still needs a real Shopify check.                                                                                                               |

**Browser failures:** the mobile search dialog failed focus containment and trigger-focus restoration. A two-tab bag scenario also failed: after tab B changed the shared fixture from one $50 item to two/$100, returning to tab A left its old quantity/total visible. This establishes the local UI synchronization gap; it does not establish duplicate orders or live overselling.

**Form reproductions:** staff delivery rejection, partial acceptance, and timeout still produced HTTP 200 and attempted a customer acknowledgment. Impossible dates `2026-02-29`, `2026-02-31`, and `2026-04-31` were accepted. A 10,001-character name passed both contact and wedding validation. Newsletter returned “You're on the list” with no enrollment-provider call.

Exact additional test commands, run from the repository using Node.js `24.19.0` and cached Playwright `1.62.1`:

```bash
pnpm start --hostname 127.0.0.1 --port 3100
node /tmp/jbarbaro-launch-qa-http.mjs http://127.0.0.1:3100
python3 /tmp/jbarbaro-launch-qa-forms-20261019/run.py
node --import tsx --test --test-isolation=none --test-reporter=tap /tmp/jbarbaro-launch-qa-commerce-20261019/commerce-scenarios.test.ts
node /tmp/jbarbaro-launch-qa-browser.mjs
QA_INTERACTIONS_ONLY=1 node /tmp/jbarbaro-launch-qa-browser.mjs
QA_INTERACTIONS_ONLY=1 QA_ONLY_EMPTY_SEARCH=1 node /tmp/jbarbaro-launch-qa-browser.mjs
node /tmp/jbarbaro-launch-qa-performance.mjs http://127.0.0.1:3100
node /tmp/jbarbaro-launch-qa-throttle-integrity.mjs
node .agents/skills/impeccable/scripts/detect.mjs --json src/components/layout/MobileBottomNav.tsx
```

The preview command used empty SMTP host/user/password and notification-recipient overrides. Browser execution required leaving the sandbox for Chromium and localhost access. Browser fixture/selector mistakes were corrected and affected checks rerun; the 44/47 count retains the original passing viewport checks and uses the corrected interaction/empty-search results. The narrow static detector returned no findings; that does not override the executed focus failures. Form and browser harnesses exited 1 for reproduced application failures. HTTP and commerce harnesses exited 0.

**Local simulated mobile performance:** one fresh-context sample per page at 390 × 844 pixels, CPU slowdown 4×, 150 ms latency, 1.6 Mbps download, and disabled browser cache. Cart GETs used the empty-bag fixture; all non-GET requests were blocked. Observations continued eight seconds after DOMContentLoaded:

| Page                   | First contentful paint | Latest observed largest contentful paint | Observed CLS | Observation window from navigation |
| ---------------------- | ---------------------- | ---------------------------------------- | ------------ | ---------------------------------- |
| Home                   | 1.240 s                | 1.840 s                                  | 0            | 9.52 s                             |
| Shop                   | 1.120 s                | 3.104 s                                  | 0.03673      | 12.20 s                            |
| Sampled Canali product | 1.016 s                | 1.016 s                                  | 0            | 8.86 s                             |
| Empty bag              | 0.972 s                | 2.100 s                                  | 0            | 8.86 s                             |

All four samples returned HTTP 200 with no unhandled page errors. Throttle validation compared a cache-busted local GET at 22.4 ms without added latency with 1518.6 ms at a configured 1500 ms; intercepted-request `responseStart` was early, so its value must not be presented as a trustworthy network TTFB. The recorded GET request failures were aborted Next.js prefetches. Server caches remained warm. These single local samples are diagnostics, not a production performance score, a populated-bag measurement, or field Core Web Vitals sign-off.

Temporary evidence is under `/tmp/jbarbaro-launch-qa-*`, including `browser-results.json`, `http-results.json`, the forms directory's `summary.json`, and the commerce directory's `results-final.tap`. Application source and dependencies were not changed. Live inbox delivery, actual Shopify payments/stock/refunds/fulfillment, POS synchronization, production CMS publishing, screen-reader usability, and deployed performance remain unverified.

Before opening the storefront to customers:

- [ ] Resolve items 1–8 or remove the affected customer promise/feature where appropriate; record any remaining dependency exposure decision.
- [ ] Record successful integration checks for items 9–16 in the approved test environment.
- [ ] Complete items 17–21 against the deployed release and fix any shopping-blocking failure.
- [ ] Record the release decision, owner, and timing for follow-up items 22–25.
- [ ] Record the deployed commit, tester, date, environment, and outstanding limitations alongside the completed checkboxes.
