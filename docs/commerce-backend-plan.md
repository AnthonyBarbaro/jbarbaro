# Ecommerce Backend Plan (Products + Orders)

## Goal
- Keep this Next.js codebase as the main website and storefront frontend.
- Add a production-ready commerce backend for products, inventory, carts, checkout, orders, taxes, and payments.

## Recommended Approach
- Use `Medusa` as the backend commerce engine (self-hosted, API-first, headless).
- Keep Next.js as the customer-facing frontend (this repo).
- Use Stripe for payments.

## Why This Fits J. Barbaro
- Full custom branded UX (not locked into a template).
- Product and order control without rebuilding commerce primitives from scratch.
- Can keep appointments, wedding registrations, blog/content, and store pages in one Next.js app.

## Can We Build Everything Custom In Here?
- Yes, but not recommended for phase 1.
- Building products/orders/payments/tax/shipping/fraud/refunds entirely custom in this repo is high risk and slow.
- Better path: custom frontend here + dedicated commerce backend.

## Implementation Phases
1. Data Layer
- Add `src/lib/commerce/` client adapters.
- Create typed product/category/order interfaces.
- Build product listing and PDP routes (`/shop`, `/shop/[slug]`).

2. Cart + Checkout
- Cart state in Next.js (server actions + signed cookie/session).
- Stripe Checkout or direct PaymentIntents.
- Order webhook handling.

3. Operations
- Inventory sync, taxes, shipping rates.
- Order status pages and email flows.
- Admin operational dashboards.

## Minimum Launch Requirements
- Product catalog + variants (size/color).
- Cart + checkout + payment.
- Order confirmation + email receipts.
- Basic shipping/tax configuration.
- Return/refund workflow.
