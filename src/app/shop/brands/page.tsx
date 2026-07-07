import Image from "next/image";
import Link from "next/link";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { getShopBrands, type ShopBrand } from "@/lib/shopify/brands";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Shop by Brand",
  description:
    "Browse designer menswear brands available to shop online at J. Barbaro Clothiers, from tailored clothing to shoes and accessories.",
  path: "/shop/brands",
});
export const revalidate = 300;

export default async function ShopBrandsPage() {
  let brands: ShopBrand[] = [];
  let storefrontAvailable = true;

  try {
    brands = await getShopBrands();
  } catch (error) {
    storefrontAvailable = false;
    console.error("Unable to load Shopify brands for /shop/brands.", error);
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] bg-ivory">
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: "Brands", path: "/shop/brands" },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Shop", href: "/shop" },
          { name: "Brands", href: "/shop/brands" },
        ]}
      />

      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-6 sm:py-8">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">Shop by Brand</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-smoke sm:text-base">
            {storefrontAvailable && brands.length > 0
              ? `${brands.length} designer brand${brands.length === 1 ? "" : "s"} available to shop online right now.`
              : "The brand list is refreshing. Check back shortly or browse the full shop."}
          </p>
        </Container>
      </section>

      <section className="bg-ivory py-6 sm:py-8">
        <Container>
          {brands.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  href={`/shop/brands/${brand.slug}`}
                  className="group overflow-hidden rounded-lg border border-ink/10 bg-white transition-colors duration-200 hover:border-gold/50"
                >
                  <div className="relative aspect-[4/3] border-b border-ink/8 bg-white p-4">
                    {brand.image ? (
                      <Image
                        src={brand.image.url}
                        alt={`${brand.name} product`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-heading text-2xl text-ink/40">
                        {brand.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-sm font-semibold text-ink transition-colors group-hover:text-deep-teal sm:text-base">
                      {brand.name}
                    </h2>
                    <p className="mt-1 text-xs text-smoke">
                      {brand.productCount} item{brand.productCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="border-ink/10 bg-white">
              <CardContent className="p-6 sm:p-8">
                <h2 className="font-heading text-3xl text-ink">Brands are loading.</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-smoke">
                  Browse the full shop while the brand directory refreshes.
                </p>
                <div className="mt-6">
                  <ButtonLink href="/shop">Browse the Shop</ButtonLink>
                </div>
              </CardContent>
            </Card>
          )}
        </Container>
      </section>
    </div>
  );
}
