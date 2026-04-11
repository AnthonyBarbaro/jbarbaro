import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getShopProducts } from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shop",
  description: "Searchable, filterable online shop with a live bag and secure checkout.",
  path: "/shop",
});
export const revalidate = 300;

export default async function ShopPage() {
  let products: ShopifyProduct[] = [];
  let storefrontAvailable = true;

  try {
    products = await getShopProducts(24);
  } catch (error) {
    storefrontAvailable = false;
    console.error("Unable to load Shopify storefront for /shop.", error);
  }

  const availableProducts = products.filter((product) => product.variants.some((variant) => variant.availableForSale));

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-white">
      <section className="border-b border-ink/8 bg-white">
        <Container className="max-w-none px-4 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.22em] text-smoke uppercase sm:text-sm">Shop</p>
              <p className="mt-2 text-base leading-7 text-smoke sm:text-lg sm:leading-8">
                {storefrontAvailable
                  ? `${availableProducts.length || products.length} item${(availableProducts.length || products.length) === 1 ? "" : "s"} available to browse right now.`
                  : "The catalog is refreshing right now. Check back shortly or continue to the main collection pages."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href={storefrontAvailable ? "/cart" : "/for-men"} variant="secondary" size="sm">
                {storefrontAvailable ? "Open Bag" : "Browse Categories"}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-5 sm:py-6 lg:py-8">
        {storefrontAvailable ? (
          <ShopCatalogClient products={products} />
        ) : (
          <Container>
            <Card className="border-ink/10 bg-white">
              <CardContent className="p-6 sm:p-8">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">Catalog update</p>
                <h2 className="mt-3 font-heading text-3xl text-ink sm:text-4xl">The shop is updating.</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-smoke sm:text-base sm:leading-8">
                  Browse the main collection pages for now, and the product catalog will return automatically once the refresh is complete.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/for-men">Browse Categories</ButtonLink>
                </div>
              </CardContent>
            </Card>
          </Container>
        )}
      </section>
    </div>
  );
}
