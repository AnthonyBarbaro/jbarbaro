import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { brands } from "@/data/brands";
import { menCategories, menCategoryMap } from "@/data/men-categories";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

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

  const relatedCategories = menCategories.filter((item) => item.slug !== category.slug).slice(0, 4);
  const relatedDesigners = brands.slice(0, 6);

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
        description={category.longDescription}
        ctaHref="/schedule-appointment"
        ctaLabel="Book Category Appointment"
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
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
                      <Link href={`/for-men/${item.slug}`} className="hover:text-deep-teal">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
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
