---
version: 1
slug: "src-app-shop-page-tsx"
primary_target: "src/app/shop/page.tsx"
related_targets:
  ["src/components/shop/ShopProductCard.tsx", "src/components/shop/QuickAddProduct.tsx"]
---

# Shop surface

- Scope and mode: `/shop` is an Operate product catalog.
- Audience and job: premium menswear shoppers should browse products immediately by department, fit, price, and availability.
- Primary action: the page leads directly into the full product catalog. A compact department rail supports mobile discovery, while tablet and desktop rely on the global header without duplicating it locally.
- Proof and content: product prices, compare-at prices, variant availability, imagery, and brands come from Shopify.
- Direction: keep the route merchandise-first without a promotional masthead or a separate sale rail. Genuine Shopify markdowns remain visible at the product-card level through compare-at pricing and sale badges.
- Product-card interaction: the full card is the implied product-details link. Quick Add is a persistent 44px circular plus outside that link; configurable products retain the explicit option picker.
- Constraints: do not claim low stock because the current Storefront token cannot read inventory quantities. Merchants create the sale by marking low-stock variants down in Shopify.
- Unresolved: inventory-aware scarcity messaging requires Shopify Storefront inventory scope or a separate authorized inventory source.
