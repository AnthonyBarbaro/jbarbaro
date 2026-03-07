import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getBrandMap, getBrands, getCategories } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export async function generateStaticParams() {
  const brands = await getBrands();
  return brands.map((brand) => ({ brandSlug: brand.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brandSlug: string }> }) {
  const { brandSlug } = await params;
  const brandMap = await getBrandMap();
  const brand = brandMap[brandSlug];

  if (!brand) {
    return {};
  }

  return buildMetadata({
    title: `${brand.name} at J. Barbaro Clothiers`,
    description: `${brand.description} Explore ${brand.name} in-store at J. Barbaro Clothiers in Metro Detroit.`,
    path: `/collection-brand/${brand.slug}`,
    image: brand.image,
  });
}

export default async function CollectionBrandPage({ params }: { params: Promise<{ brandSlug: string }> }) {
  const { brandSlug } = await params;
  const [brandMap, brands, categories] = await Promise.all([getBrandMap(), getBrands(), getCategories()]);
  const brand = brandMap[brandSlug];

  if (!brand) {
    notFound();
  }

  const relatedCategories = categories.slice(0, 5);
  const relatedBrands = brands.filter((item) => item.slug !== brand.slug).slice(0, 6);

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Designers", path: "/designers" },
          { name: brand.name, path: `/collection-brand/${brand.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Designers", href: "/designers" },
          { name: brand.name, href: `/collection-brand/${brand.slug}` },
        ]}
      />

      <PageHero
        title={brand.name}
        description={`${brand.description} Visit us for curated selection, fit guidance, and expert styling support.`}
        ctaHref="/schedule-appointment"
        ctaLabel="Book Brand Appointment"
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <Card>
              <div className="relative aspect-[16/10]">
                <Image src={brand.image} alt={brand.name} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
              </div>
              <CardContent>
                <h2 className="font-heading text-3xl text-ink sm:text-4xl">About {brand.name}</h2>
                <p className="mt-4 text-base leading-8 text-smoke">
                  We guide clients through the strongest {brand.name} options for their build, style profile, and occasion needs. Inventory evolves seasonally, so appointments are the most efficient way to preview available selections.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                    Book Appointment
                  </ButtonLink>
                  <ButtonLink href="/designers/all-designer-brands" variant="secondary" className="w-full sm:w-auto">
                    View All Brands
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card tone="stone">
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Related Categories</h2>
                  <ul className="mt-3 space-y-2 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                    {relatedCategories.map((category) => (
                      <li key={category.slug}>
                        <Link href={`/for-men/${category.slug}`} className="hover:text-deep-teal">
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Explore Next</h2>
                  <ul className="mt-3 space-y-2 text-sm font-semibold tracking-[0.08em] text-ink uppercase">
                    {relatedBrands.map((related) => (
                      <li key={related.slug}>
                        <Link href={`/collection-brand/${related.slug}`} className="hover:text-deep-teal">
                          {related.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
