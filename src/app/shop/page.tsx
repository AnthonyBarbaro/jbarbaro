import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BadgePercent, Ruler, ShoppingBag } from "lucide-react";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getBestSellingProducts, getShopProducts } from "@/lib/shopify/products";
import { getProductSale } from "@/lib/shopify/product-merchandising";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Shop Luxury Menswear Online",
  description:
    "Shop premium menswear, designer shoes, shirts, suits, accessories, and formalwear from J. Barbaro Clothiers.",
  path: "/shop",
});
export const revalidate = 300;

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
    products = await getShopProducts(250);
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
  const saleProducts = [...availableProducts]
    .filter((product) => Boolean(getProductSale(product)))
    .sort(
      (left, right) =>
        (getProductSale(right)?.discountPercent ?? 0) -
        (getProductSale(left)?.discountPercent ?? 0),
    );
  const hasLiveSale = saleProducts.length > 0;
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
      <section className="overflow-hidden bg-ink text-white">
        <Container className="grid min-h-[22rem] gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.78fr)] lg:items-stretch lg:py-12">
          <div className="flex max-w-3xl flex-col justify-center">
            <Badge variant="gold" className="w-fit">
              {hasLiveSale ? "Current Promotion" : "Offers & Events"}
            </Badge>
            <h1 className="mt-5 text-balance font-heading text-[2.8rem] leading-[1.02] sm:text-6xl">
              {hasLiveSale ? "The J. Barbaro sale edit." : "Where the best offers land."}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-white/78">
              {hasLiveSale
                ? "A focused selection of genuine markdowns across the online floor, with current prices and available sizes updated from our live inventory."
                : "This space is reserved for seasonal promotions and the strongest values across the floor. Explore the full collection while the next offer is prepared."}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href={hasLiveSale ? "#sale" : "#shop-catalog"}
                size="lg"
                className="w-full sm:w-auto"
              >
                {hasLiveSale ? "Shop the Sale" : "Browse All Products"}
              </ButtonLink>
              <ButtonLink
                href={hasLiveSale ? "#shop-catalog" : "/shop/brands"}
                variant="secondary"
                size="lg"
                className="w-full border-white/45 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink sm:w-auto"
              >
                {hasLiveSale ? "Browse All Products" : "Shop by Brand"}
              </ButtonLink>
            </div>
            <ul className="mt-7 grid gap-3 text-sm text-white/75 sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <BadgePercent className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                Prices as marked
              </li>
              <li className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                Live availability
              </li>
              <li className="flex items-center gap-2">
                <Ruler className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                Smart Fit guidance
              </li>
            </ul>
          </div>

          <div className="relative hidden min-h-[20rem] overflow-hidden rounded-lg border border-white/12 lg:block">
            <Image
              src="/images/campaign/sale-edit-menswear-2026.webp"
              alt="Navy tailoring, an ivory shirt, camel knitwear, charcoal trousers, an oxblood tie, and a loafer arranged on a clothier's table"
              fill
              priority
              sizes="(max-width: 1024px) 0px, 44vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/5" />
            <div className="absolute right-5 bottom-5 left-5 flex items-center gap-3">
              <span className="h-px w-8 shrink-0 bg-gold" aria-hidden />
              <p className="text-sm leading-6 text-white/88">
                {hasLiveSale
                  ? "Current markdowns, available in the sizes shown while listed online."
                  : "Seasonal promotions and featured values will lead from this space."}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <nav className="border-b border-ink/10 bg-white" aria-label="Shop departments">
        <Container className="py-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {hasLiveSale ? (
              <Link
                href="#sale"
                className="group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border border-sale bg-sale px-4 text-sm font-semibold text-white transition-colors hover:border-ink hover:bg-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sale focus-visible:ring-offset-2"
              >
                Sale
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            ) : null}
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

      {hasLiveSale ? (
        <section
          id="sale"
          className="scroll-mt-28 border-b border-sale/15 bg-stone/65"
          aria-labelledby="sale-heading"
        >
          <Container className="py-10 sm:py-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-[0.16em] text-sale uppercase">
                  Sale Edit
                </p>
                <h2
                  id="sale-heading"
                  className="mt-3 font-heading text-4xl leading-tight text-ink sm:text-5xl"
                >
                  Current markdowns.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                  Shop genuinely reduced pieces with current prices and available sizes pulled
                  directly from the online floor.
                </p>
              </div>
              <p className="max-w-sm text-sm leading-6 text-smoke sm:text-right">
                {saleProducts.length} marked-down {saleProducts.length === 1 ? "style" : "styles"}{" "}
                available now.
              </p>
            </div>

            <div className="-mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              {saleProducts.map((product) => (
                <div
                  key={product.id}
                  className="w-[min(78vw,19rem)] shrink-0 snap-start sm:w-[18rem] lg:w-[19rem]"
                >
                  <ShopProductCard
                    product={product}
                    imageSizes="(max-width: 640px) 78vw, 19rem"
                    saleOnly
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section id="shop-catalog" className="scroll-mt-28 border-b border-ink/10 bg-ivory">
        <Container className="py-5 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">
                Browse the Collection
              </h2>
              <p className="mt-2 text-sm leading-6 text-smoke sm:text-base">
                {storefrontAvailable
                  ? `${availableProducts.length || products.length} item${(availableProducts.length || products.length) === 1 ? "" : "s"} available. Use filters or Smart Fit to narrow the floor.`
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
            <ShopCatalogClient
              products={products}
              bestSellers={bestSellers}
              newArrivals={newArrivals}
            />
          </Suspense>
        ) : (
          <Container>
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
