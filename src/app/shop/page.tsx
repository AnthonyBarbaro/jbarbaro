import { Suspense } from "react";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getBestSellingProducts, getShopProducts } from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Shop Luxury Menswear Online",
  description: "Shop premium menswear, designer shoes, shirts, suits, accessories, and formalwear from J. Barbaro Clothiers.",
  path: "/shop",
});
export const revalidate = 300;

export default async function ShopPage() {
  let products: ShopifyProduct[] = [];
  let bestSellers: ShopifyProduct[] = [];
  let storefrontAvailable = true;

  try {
    products = await getShopProducts(60);
  } catch (error) {
    storefrontAvailable = false;
    console.error("Unable to load Shopify storefront for /shop.", error);
  }

  try {
    bestSellers = (await getBestSellingProducts(10)).filter((product) =>
      product.variants.some((variant) => variant.availableForSale),
    );
  } catch (error) {
    console.error("Unable to load best sellers for /shop.", error);
  }

  const availableProducts = products.filter((product) => product.variants.some((variant) => variant.availableForSale));
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "J. Barbaro Clothiers Online Shop",
    itemListElement: products.slice(0, 24).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/shop/${product.handle}`),
      item: {
        "@type": "Product",
        name: product.title,
        brand: product.vendor ? { "@type": "Brand", name: product.vendor } : undefined,
        image: product.featuredImage?.url,
        offers: {
          "@type": "Offer",
          price: product.priceRange.minVariantPrice.amount,
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          availability: product.variants.some((variant) => variant.availableForSale)
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: absoluteUrl(`/shop/${product.handle}`),
        },
      },
    })),
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-ivory">
      <SeoJsonLd data={[breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }]), itemListJsonLd]} />
      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-5 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">Shop</h1>
              <p className="mt-2 text-sm leading-6 text-smoke sm:text-base">
                {storefrontAvailable
                  ? `${availableProducts.length || products.length} item${(availableProducts.length || products.length) === 1 ? "" : "s"} available to browse right now.`
                  : "The catalog is refreshing right now. Check back shortly or continue to the main collection pages."}
              </p>
            </div>

            <ButtonLink href="/shop/brands" variant="secondary" size="sm" className="w-fit">
              Shop by Brand
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-ivory py-5 sm:py-6 lg:py-8">
        {storefrontAvailable ? (
          <Suspense fallback={null}>
            <ShopCatalogClient products={products} bestSellers={bestSellers} />
          </Suspense>
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
                  <ButtonLink href="/categories">Browse Categories</ButtonLink>
                </div>
              </CardContent>
            </Card>
          </Container>
        )}
      </section>
    </div>
  );
}
