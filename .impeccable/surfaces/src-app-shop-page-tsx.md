---
version: 1
slug: "src-app-shop-page-tsx"
primary_target: "src/app/shop/page.tsx"
related_targets: ["src/components/shop/ShopProductCard.tsx","src/components/shop/QuickAddProduct.tsx"]
---

# Shop surface

- Scope and mode: `/shop` combines a Persuade marketing masthead with an Operate product catalog.
- Audience and job: premium menswear shoppers should find a current promotion quickly, then browse products by category, fit, price, and availability.
- Primary action: when genuine Shopify markdowns exist, the masthead leads directly to the Current Markdowns rail; otherwise it leads to the full catalog without advertising a sale that is not live.
- Proof and content: product prices, compare-at prices, variant availability, imagery, and brands come from Shopify. A product qualifies for the sale rail only when an available variant has a compare-at price above its current price.
- Direction: keep the dark masthead as the route's rotating marketing billboard, using brass for the primary action and Sale Oxblood only for verified markdown states. The sale rail sits immediately after department navigation.
- Product-card interaction: the full card is the implied product-details link. Quick Add is a persistent 44px circular plus outside that link; configurable products retain the explicit option picker.
- Constraints: do not claim low stock because the current Storefront token cannot read inventory quantities. Merchants create the sale by marking low-stock variants down in Shopify.
- Unresolved: inventory-aware scarcity messaging requires Shopify Storefront inventory scope or a separate authorized inventory source.
