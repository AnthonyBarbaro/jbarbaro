import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { brandMap } from "@/data/brands";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { getShopBrandBySlug, getShopBrands } from "@/lib/shopify/brands";
import { getProductsByVendor } from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { breadcrumbJsonLd } from "@/lib/structured-data";

type ShopBrandPageProps = {
  params: Promise<{
    brandSlug: string;
  }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const brands = await getShopBrands();
    return brands.map((brand) => ({ brandSlug: brand.slug }));
  } catch (error) {
    console.error("Unable to build static params for shop brand pages.", error);
    return [];
  }
}

export async function generateMetadata({ params }: ShopBrandPageProps): Promise<Metadata> {
  const { brandSlug } = await params;

  try {
    const brand = await getShopBrandBySlug(brandSlug);

    if (brand) {
      return buildMetadata({
        title: `Shop ${brand.name} Online`,
        description: `Shop ${brand.name} menswear online at J. Barbaro Clothiers. ${brand.productCount} item${brand.productCount === 1 ? "" : "s"} available with secure checkout.`,
        path: `/shop/brands/${brand.slug}`,
        image: brand.image?.url,
      });
    }
  } catch (error) {
    console.error(`Unable to build metadata for shop brand "${brandSlug}".`, error);
  }

  return buildMetadata({
    title: "Shop by Brand",
    description: "Shop designer menswear brands online at J. Barbaro Clothiers.",
    path: `/shop/brands/${brandSlug}`,
  });
}

export default async function ShopBrandPage({ params }: ShopBrandPageProps) {
  const { brandSlug } = await params;
  let storefrontAvailable = true;
  let brand = null;
  let products: ShopifyProduct[] = [];

  try {
    brand = await getShopBrandBySlug(brandSlug);

    if (brand) {
      products = await getProductsByVendor(brand.name, 250);
    }
  } catch (error) {
    storefrontAvailable = false;
    console.error(`Unable to load Shopify brand page "${brandSlug}".`, error);
  }

  if (!storefrontAvailable) {
    return (
      <section className="bg-ivory py-10 sm:py-14">
        <Container>
          <Card className="border-ink/10 bg-white">
            <CardContent className="p-6 sm:p-8">
              <h1 className="font-heading text-3xl text-ink sm:text-4xl">This brand page is refreshing.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-smoke">
                Check back shortly, or continue browsing the shop while the catalog updates.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/shop">Back to Shop</ButtonLink>
                <ButtonLink href="/shop/brands" variant="secondary">
                  All Brands
                </ButtonLink>
              </div>
            </CardContent>
          </Card>
        </Container>
      </section>
    );
  }

  if (!brand) {
    notFound();
  }

  const aboutBrand = brandMap[brand.slug] ?? null;
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand.name} at J. Barbaro Clothiers`,
    itemListElement: products.slice(0, 24).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/shop/${product.handle}`),
    })),
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-ivory">
      <SeoJsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name: "Brands", path: "/shop/brands" },
            { name: brand.name, path: `/shop/brands/${brand.slug}` },
          ]),
          itemListJsonLd,
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: "Brands", href: "/shop/brands" },
          { name: brand.name, href: `/shop/brands/${brand.slug}` },
        ]}
      />

      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-6 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Brand</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">{brand.name}</h1>
              <p className="mt-2 text-sm leading-6 text-smoke sm:text-base">
                {products.length} item{products.length === 1 ? "" : "s"} available to shop online.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {aboutBrand ? (
                <ButtonLink href={`/collection-brand/${brand.slug}`} variant="secondary" size="sm">
                  About {brand.name}
                </ButtonLink>
              ) : null}
              <ButtonLink href="/shop/brands" variant="secondary" size="sm">
                All Brands
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-ivory py-6 sm:py-8">
        <Container>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xl:gap-4">
              {products.map((product) => (
                <ShopProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-ink/10 bg-white">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">
                  No {brand.name} items are online right now.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">
                  Inventory changes seasonally. Book an appointment and we can prepare current {brand.name} options
                  in your size before you arrive.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <ButtonLink href="/schedule-appointment">Book Appointment</ButtonLink>
                  <ButtonLink href="/shop" variant="secondary">
                    Browse the Shop
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>
    </div>
  );
}
