import Link from "next/link";
import { notFound } from "next/navigation";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { brands } from "@/data/brands";
import { getMenCategoryHref, menCategories, menCategoryMap } from "@/data/men-categories";
import { buildMetadata } from "@/lib/seo";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { getShopCollection } from "@/lib/shopify/products";
import type { ShopifyCollection } from "@/lib/shopify/types";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import type { MenCategory } from "@/types/site";

async function getCollectionForCategory(category: MenCategory): Promise<ShopifyCollection | null> {
  const collectionHandle = category.shopifyCollectionHandle?.trim();

  if (!collectionHandle || !getShopifyConfigStatus().configured) {
    return null;
  }

  try {
    return await getShopCollection(collectionHandle, 8);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Shopify collection error.";
    console.error(`Unable to load Shopify collection for "${category.slug}": ${message}`);
    return null;
  }
}

export function generateStaticParams() {
  return menCategories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = menCategoryMap[categorySlug];

  if (!category) {
    return {};
  }

  return buildMetadata({
    title: `${category.name} for Men`,
    description: category.longDescription,
    path: `/for-men/${category.slug}`,
  });
}

export default async function MenCategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = menCategoryMap[categorySlug];

  if (!category) {
    notFound();
  }

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "For Men", href: "/for-men" },
    { name: category.name, href: `/for-men/${category.slug}` },
  ];

  const shopifyCollection = await getCollectionForCategory(category);
  const relatedCategories = menCategories.filter((item) => item.slug !== category.slug).slice(0, 4);
  const relatedDesigners = brands.slice(0, 6);
  const shopCollectionHref = shopifyCollection ? `/shop?collection=${encodeURIComponent(shopifyCollection.handle)}` : null;
  const heroDescription = shopifyCollection?.description.trim() || category.longDescription;

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "For Men", path: "/for-men" },
          { name: category.name, path: `/for-men/${category.slug}` },
        ])}
      />
      <Breadcrumbs items={crumbs} />

      <PageHero
        title={category.name}
        description={heroDescription}
        eyebrow={shopifyCollection ? "Live Shopify Collection" : "J. Barbaro Clothiers"}
        ctaHref={shopCollectionHref || "/schedule-appointment"}
        ctaLabel={shopCollectionHref ? "Shop Full Collection" : "Book Category Appointment"}
        secondaryHref={shopCollectionHref ? "/schedule-appointment" : undefined}
        secondaryLabel={shopCollectionHref ? "Book Styling Appointment" : undefined}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          {shopifyCollection ? (
            <div className="grid gap-8 lg:grid-cols-[1.45fr_0.9fr]">
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Collection Preview</p>
                    <h2 className="mt-2 font-heading text-3xl text-ink sm:text-4xl">Shop {category.name}</h2>
                  </div>
                  {shopCollectionHref ? (
                    <ButtonLink href={shopCollectionHref} variant="secondary" className="w-full sm:w-auto">
                      Browse in Full Shop
                    </ButtonLink>
                  ) : null}
                </div>

                {shopifyCollection.products.length > 0 ? (
                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    {shopifyCollection.products.map((product) => (
                      <ShopProductCard key={product.id} product={product} columns={2} />
                    ))}
                  </div>
                ) : (
                  <Card className="mt-8">
                    <CardContent>
                      <h3 className="font-heading text-2xl text-ink sm:text-3xl">Collection Connected</h3>
                      <p className="mt-3 text-sm leading-7 text-smoke">
                        This category is mapped to Shopify and ready for products as soon as inventory is assigned to the collection.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <Card>
                  <CardContent>
                    <h2 className="font-heading text-2xl text-ink sm:text-3xl">Need Help Narrowing It Down?</h2>
                    <p className="mt-3 text-sm leading-7 text-smoke">
                      We can pull the strongest options in your size, explain fit differences, and build out the rest of the look before you arrive.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                        Book Personalized Session
                      </ButtonLink>
                      <ButtonLink href="/designers/featured-designers" variant="secondary" className="w-full sm:w-auto">
                        Explore Designers
                      </ButtonLink>
                    </div>
                  </CardContent>
                </Card>

                <Card tone="stone">
                  <CardContent>
                    <h2 className="font-heading text-2xl text-ink sm:text-3xl">Related Categories</h2>
                    <ul className="mt-4 space-y-2 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                      {relatedCategories.map((item) => (
                        <li key={item.slug}>
                          <Link href={getMenCategoryHref(item)} className="hover:text-deep-teal">
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
              <Card>
                <CardContent>
                  <h2 className="font-heading text-3xl text-ink sm:text-4xl">Refined {category.name} Selection</h2>
                  <p className="mt-4 text-base leading-8 text-smoke">
                    Our {category.name.toLowerCase()} assortment emphasizes premium fabrication, modern proportions, and seamless pairing with tailored and casual essentials.
                  </p>
                  <p className="mt-4 text-base leading-8 text-smoke">
                    We can prepare top options in your size and preferred fit before your visit.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <ButtonLink href="/schedule-appointment">Book Personalized Session</ButtonLink>
                    <ButtonLink href="/designers/featured-designers" variant="secondary">
                      Explore Designers
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>

              <Card tone="stone">
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Related Categories</h2>
                  <ul className="mt-4 space-y-2 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                    {relatedCategories.map((item) => (
                      <li key={item.slug}>
                        <Link href={getMenCategoryHref(item)} className="hover:text-deep-teal">
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <h2 className="font-heading text-3xl text-ink sm:text-4xl">Popular Designer Options</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedDesigners.map((brand) => (
              <Link
                key={brand.slug}
                href={`/collection-brand/${brand.slug}`}
                className="rounded-2xl border border-ink/10 bg-ivory px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase transition-colors hover:border-gold hover:text-deep-teal"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
