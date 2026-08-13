import { SeoJsonLd } from "@/components/SeoJsonLd";
import { ShopBrandDirectory } from "@/components/shop/ShopBrandDirectory";
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

      {brands.length > 0 ? (
        <ShopBrandDirectory brands={brands} />
      ) : (
        <section className="bg-ivory py-8 sm:py-12">
          <Container>
            <Card className="border-ink/10 bg-white">
              <CardContent className="p-6 sm:p-8">
                <h1 className="font-heading text-3xl text-ink sm:text-4xl">
                  {storefrontAvailable
                    ? "No brands are online right now."
                    : "The brand directory is temporarily unavailable."}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-smoke">
                  {storefrontAvailable
                    ? "Browse the full collection or book an appointment for help finding the right label and fit."
                    : "Continue through the full shop while the online brand list refreshes."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/shop">Browse the Shop</ButtonLink>
                  <ButtonLink href="/categories" variant="secondary">
                    Shop Categories
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          </Container>
        </section>
      )}
    </div>
  );
}
