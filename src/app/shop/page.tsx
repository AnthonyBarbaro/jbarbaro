import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getAllShopProducts, getBestSellingProducts } from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Shop Luxury Menswear Online",
  description:
    "Shop premium menswear, designer shoes, shirts, suits, accessories, and formalwear from J. Barbaro Clothiers.",
  path: "/shop",
});
export const dynamic = "force-dynamic";

const shopDepartments = [
  { label: "Suits", href: "/categories/suits" },
  { label: "Sport Coats", href: "/categories/sport-coats" },
  { label: "Shirts", href: "/categories/shirts" },
  { label: "Pants", href: "/categories/pants" },
  { label: "Shoes", href: "/categories/shoes" },
  { label: "Accessories", href: "/categories/accessories" },
  { label: "Formalwear", href: "/categories/formalwear" },
] as const;

export default async function ShopPage() {
  let products: ShopifyProduct[] = [];
  let bestSellers: ShopifyProduct[] = [];
  let storefrontAvailable = true;

  try {
    products = await getAllShopProducts();
  } catch (error) {
    storefrontAvailable = false;
    console.error("Unable to load Shopify storefront for /shop.", error);
  }

  try {
    bestSellers = Array.from(
      new Map(
        (await getBestSellingProducts(30))
          .filter((product) => product.variants.some((variant) => variant.availableForSale))
          .map((product) => [product.id, product]),
      ).values(),
    ).slice(0, 10);
  } catch (error) {
    console.error("Unable to load best sellers for /shop.", error);
  }

  const availableProducts = products.filter((product) =>
    product.variants.some((variant) => variant.availableForSale),
  );
  const bestSellerIds = new Set(bestSellers.map((product) => product.id));
  const newArrivals = [...availableProducts]
    .sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt))
    .filter((product) => !bestSellerIds.has(product.id))
    .slice(0, 10);
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
      <SeoJsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
          ]),
          itemListJsonLd,
        ]}
      />
      <nav className="border-b border-ink/10 bg-white md:hidden" aria-label="Shop departments">
        <Container className="py-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shopDepartments.map((department) => (
              <Link
                key={department.href}
                href={department.href}
                className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-ink/10 bg-stone/55 px-4 text-sm font-semibold text-ink transition-colors hover:border-deep-teal/35 hover:bg-white hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
              >
                {department.label}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ))}
          </div>
        </Container>
      </nav>

      <section id="shop-catalog" className="scroll-mt-28 border-b border-ink/10 bg-ivory">
        <Container className="max-w-[90rem] px-6 py-3 sm:px-6 sm:py-4 lg:px-8 2xl:px-12">
          <div className="flex justify-end">
            <ButtonLink
              href="/shop/brands"
              variant="secondary"
              size="sm"
              className="w-full sm:w-fit"
            >
              Shop by Brand
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-ivory py-3 sm:py-4 lg:py-5">
        {storefrontAvailable ? (
          <Suspense fallback={null}>
            <ShopCatalogClient
              products={products}
              bestSellers={bestSellers}
              newArrivals={newArrivals}
              showTopPicks={false}
            />
          </Suspense>
        ) : (
          <Container className="max-w-[90rem] px-6 sm:px-6 lg:px-8 2xl:px-12">
            <Card className="border-ink/10 bg-white">
              <CardContent className="p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-[0.18em] text-smoke uppercase">
                  Catalog update
                </p>
                <h2 className="mt-3 font-heading text-3xl text-ink sm:text-4xl">
                  The shop is updating.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-smoke sm:text-base sm:leading-8">
                  Browse the main collection pages for now, and the product catalog will return
                  automatically once the refresh is complete.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <form action="/shop" method="get">
                    <Button type="submit">Try Again</Button>
                  </form>
                  <ButtonLink href="/categories" variant="secondary">
                    Browse Categories
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          </Container>
        )}
      </section>
    </div>
  );
}
