# Customer-facing product names

Product titles include the retail brand once, followed by useful garment details. Manufacturer
style identifiers stay out of the displayed name. Existing handles, variant IDs, SKUs, barcodes,
sizes, colors, prices, stock, and Shopify vendor fields retain their original values.

Examples:

- `Canali Sport Coat CF00142/399` → `Canali Windowpane Sport Coat — Navy`
- `Canali Tuxedos BF00263/311 Navy` → `Canali Tuxedo — Navy`
- `Mantoni Dress Shirt - Navy` from supplier Gruppo Bravo Menswear → `Mantoni Dress Shirt — Navy`
- `Deke Twill Shorts - Black` → `Brax Deke Twill Shorts — Black`

The six curated Canali names use matching merchant product photographs for visible pattern,
color and texture details. They do not infer fabric, fit, care, origin, or weight. Source
photos and the review preview are in `csv/launch-review/naming/visual-name-evidence.json` and
`visual-name-pilot.html`. Exact supplier shade names remain subject to merchant confirmation.

## Implementation

- `src/lib/shopify/product-title.ts` removes high-confidence internal identifiers and tidies
  wording while retaining numeric retail models, fractions, percentages, and garment counts.
- `src/lib/shopify/product-title-presentation.ts` resolves source-specific retail-brand names,
  expands confirmed display abbreviations, applies the six photo-grounded names, and withholds
  category labels that conflict with a jacket title. Supplier fields remain unchanged.
- `src/lib/shopify/products.ts` applies the names to products, search, previews, cached product
  reads, and recommendations. Normalized list caches have a new presentation version.
- `src/lib/shopify/cart.ts` applies the same names to the bag; `src/lib/wishlist.ts` updates
  old saved names when reading browser storage.
- `ShopProductCard.tsx` shows a category above the branded title and reserves room for Quick Add.
  `ProductDetailClient.tsx` keeps brand navigation inside the heading, avoiding repeated branding.

Gift-wrap service labels remain merchant-controlled. This is storefront presentation only:
**hosted Shopify checkout and order emails continue to use Shopify's original titles until
reviewed upstream catalog updates are applied.** No Shopify records were changed.

## Catalog review

The review covers 473 active physical products. The current presentation changes 333 titles.
There are 125 products flagged for further facts or identity review, including 104 products in
24 groups whose names collide after removing codes. The source already contained eight duplicate
name groups involving 17 products. No numeric suffixes or invented collection names were added to
make products appear unique.

Review files under the ignored `csv/launch-review/naming/` directory:

- `product-names-review.csv`: all products, old/new names, source suppliers, display brands, and flags.
- `nonconflicting-title-drafts-review.csv`: 215 changed drafts without detected naming blockers.
- `needs-product-research.csv`: unresolved facts, identities, abbreviations, and duplicate names.
- `brand-display-review.csv`: supplier/retail-brand relationships for review.
- `product-facts-and-weights.csv`: garment-fact sources and measured/supplier-weight inputs.
- `canali-name-pilot-import.csv`: six title-only changes in Shopify import format for review.
- `title-update-candidates-import.csv`: 215 nonconflicting title changes with all 3,081 original
  variant option rows, including Size and any Length or Color options, in import format.

The candidates import contains Handle, Title, Option1 Name/Value, and Option2 Name/Value to
address Shopify's requirement for product options when updating variants. Original option names,
values, and variant ordering are preserved; five image-only rows are omitted. The six-product
pilot still contains only Handle and Title. Neither import has been applied by these scripts.
All other CSVs are review worksheets. None of these files establishes launch approval. The
original product CSV is unchanged. Weight fields in the worksheet are intentionally empty:
actual supplier weights or scale measurements are still needed, and product descriptions still
need verified garment facts.

## Verification

Run with the project's Node.js 24 environment:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
node --import tsx --test $(rg --files src | rg '\.test\.ts$' | sort)
python3 /tmp/jbarbaro-naming-review.py
node /tmp/jbarbaro-product-names-browser.cjs
git diff --check
```

The full test run passed all 40 test files. Focused tests cover code removal, retail model
preservation, brand resolution, stale cached products, search, previews, bag labels, saved items,
and card/detail headings. The CSV review checks all 473 handles, nonempty branded names, and the
unchanged source hash. Chromium checks cover desktop/mobile cards and product details, image
loading, Quick Add clearance, unchanged product links, brand navigation, and browser errors.

Weights, supplier facts, hosted checkout/order titles, and deployed behavior remain unverified.
The dependency and storage-denial findings from the launch audit remain separate outstanding work.
