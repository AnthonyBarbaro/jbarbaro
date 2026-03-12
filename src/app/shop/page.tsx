import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { getShopCollections, getShopProducts } from "@/lib/shopify/products";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shop",
  description: "Searchable, filterable Shopify storefront with live cart and checkout.",
  path: "/shop",
});

export default async function ShopPage() {
  const [products, collections] = await Promise.all([getShopProducts(24), getShopCollections(10)]);

  return (
    <>
      <PageHero
        eyebrow="J. Barbaro Online Shop"
        title="Shop the Floor"
        description="A cleaner apparel storefront built for browsing: refined filters, alternate product imagery on hover, quick add, and a direct path into your bag."
        ctaHref="/cart"
        ctaLabel="Open Bag"
        secondaryHref="/schedule-appointment"
        secondaryLabel="Book Styling"
      >
        <div className="mt-8 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr]">
          <div className="rounded-[1.75rem] border border-ivory/14 bg-ivory/8 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Live Inventory</p>
            <p className="mt-3 text-sm leading-7 text-ivory/80">
              {products.length} products across {collections.length} collections, ready to filter by brand, fit, color, price, and availability.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-ivory/14 bg-ivory/8 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Visual Shopping</p>
            <p className="mt-3 text-sm leading-7 text-ivory/80">Desktop shoppers can preview alternate product imagery on hover without leaving the grid.</p>
          </div>
          <div className="rounded-[1.75rem] border border-ivory/14 bg-ivory/8 p-5 backdrop-blur">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Mobile Ready</p>
            <p className="mt-3 text-sm leading-7 text-ivory/80">Bag actions, filters, and product cards stay compact and touch-friendly on smaller screens.</p>
          </div>
        </div>
      </PageHero>

      <WaveSection topWave="A" background="ivory" contentClassName="py-8 sm:py-10 lg:py-12">
        <ShopCatalogClient products={products} collections={collections} />
      </WaveSection>
    </>
  );
}
