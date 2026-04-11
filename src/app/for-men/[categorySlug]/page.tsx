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
import { buildMetadata } from "@/lib/seo";
import { resolveMenCategories, resolveMenCategory } from "@/lib/shopify/men-categories";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await resolveMenCategories(40, 1);
  return categories.map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await resolveMenCategory(categorySlug, 8);

  if (!category) {
    return {};
  }

  return buildMetadata({
    title: `${category.name} Collection`,
    description: category.longDescription,
    path: category.href,
  });
}

export default async function MenCategoryPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const category = await resolveMenCategory(categorySlug, 8);

  if (!category) {
    notFound();
  }

  const crumbs = [
    { name: "Home", href: "/" },
    { name: "Collections", href: "/for-men" },
    { name: category.name, href: category.href },
  ];

  const shopifyCollection = category.shopifyCollection;
  if (!shopifyCollection) {
    notFound();
  }

  const relatedCategories = (await resolveMenCategories(24, 1)).filter((item) => item.href !== category.href).slice(0, 4);
  const shopCollectionHref = "/shop";
  const heroDescription = shopifyCollection.description.trim() || category.longDescription;

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Collections", path: "/for-men" },
          { name: category.name, path: category.href },
        ])}
      />
      <Breadcrumbs items={crumbs} />

      <PageHero
        title={category.name}
        description={heroDescription}
        eyebrow="Available Now"
        ctaHref={shopCollectionHref}
        ctaLabel="Shop All Products"
        secondaryHref="/schedule-appointment"
        secondaryLabel="Book Styling Appointment"
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.45fr_0.9fr]">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Collection Preview</p>
                  <h2 className="mt-2 font-heading text-3xl text-ink sm:text-4xl">Shop {category.name}</h2>
                </div>
                <ButtonLink href={shopCollectionHref} variant="secondary" className="w-full sm:w-auto">
                  Browse All Products
                </ButtonLink>
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
                    <h3 className="font-heading text-2xl text-ink sm:text-3xl">More Pieces Arriving Soon</h3>
                    <p className="mt-3 text-sm leading-7 text-smoke">
                      This collection is being updated now. Check back soon or book an appointment and we&apos;ll prepare options for you.
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
                    <ButtonLink href="/for-men" variant="secondary" className="w-full sm:w-auto">
                      Browse All Collections
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>

              {relatedCategories.length > 0 ? (
                <Card tone="stone">
                  <CardContent>
                    <h2 className="font-heading text-2xl text-ink sm:text-3xl">Related Collections</h2>
                    <ul className="mt-4 space-y-2 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                      {relatedCategories.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} className="hover:text-deep-teal">
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        </Container>
      </WaveSection>

      {relatedCategories.length > 0 ? (
        <WaveSection topWave="C" background="stone">
          <Container>
            <h2 className="font-heading text-3xl text-ink sm:text-4xl">Explore More Collections</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {relatedCategories.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-ink/10 bg-ivory px-4 py-3 text-sm font-semibold tracking-[0.08em] text-ink uppercase transition-colors hover:border-gold hover:text-deep-teal"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </Container>
        </WaveSection>
      ) : null}
    </>
  );
}
