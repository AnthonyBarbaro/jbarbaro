import Image from "next/image";
import Link from "next/link";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { featuredBrands } from "@/data/brands";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Featured Designers",
  description:
    "Shop featured designer labels at J. Barbaro Clothiers, including premium tailoring, luxury shirting, denim, and accessories.",
  path: "/designers/featured-designers",
});

const crumbs = [
  { name: "Home", href: "/" },
  { name: "Designers", href: "/designers" },
  { name: "Featured Designers", href: "/designers/featured-designers" },
];

export default function FeaturedDesignersPage() {
  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Designers", path: "/designers" },
          { name: "Featured Designers", path: "/designers/featured-designers" },
        ])}
      />
      <Breadcrumbs items={crumbs} />
      <PageHero
        title="Featured Designers"
        description="Seasonal spotlight selections from brands known for fit, quality, and modern menswear relevance."
      />

      <WaveSection topWave="A" background="stone">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredBrands.map((brand) => (
              <Card key={brand.slug} className="h-full overflow-hidden">
                <div className="group relative aspect-[4/3]">
                  <Image
                    src={brand.image}
                    alt={`${brand.name} designer collection`}
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/68 via-ink/20 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
                    <div className="relative h-24 w-[86%] max-w-[340px] rounded-2xl border border-white/45 bg-white/30 p-3 backdrop-blur-sm sm:h-28">
                      <Image src={brand.logo} alt={`${brand.name} logo`} fill sizes="220px" className="object-contain" />
                    </div>
                  </div>
                </div>
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">{brand.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-smoke">{brand.description}</p>
                  <Link
                    href={`/collection-brand/${brand.slug}`}
                    className="mt-4 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                  >
                    View Brand
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
