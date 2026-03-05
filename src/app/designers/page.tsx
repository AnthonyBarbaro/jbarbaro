import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { featuredBrands } from "@/data/brands";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Designer Brands",
  description:
    "Explore the designer brands carried at J. Barbaro Clothiers, including luxury tailoring, denim, shirting, and accessories.",
  path: "/designers",
});

export default function DesignersHubPage() {
  return (
    <>
      <PageHero
        title="Designer Collections"
        description="We curate globally respected menswear labels selected for quality, fit consistency, and wardrobe longevity."
        ctaHref="/designers/all-designer-brands"
        ctaLabel="Browse All Designers"
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent>
                <Badge variant="teal">Featured</Badge>
                <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">Featured Designers</h2>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Our seasonal spotlight: the strongest luxury and performance-driven labels right now.
                </p>
                <ButtonLink href="/designers/featured-designers" variant="secondary" className="mt-5">
                  Explore Featured
                </ButtonLink>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Badge variant="gold">Directory</Badge>
                <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">All Designer Brands</h2>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Use search and A–Z filtering to quickly find every designer available in-store.
                </p>
                <ButtonLink href="/designers/all-designer-brands" variant="secondary" className="mt-5">
                  Browse A–Z
                </ButtonLink>
              </CardContent>
            </Card>

            <Card tone="ink">
              <CardContent>
                <h2 className="font-heading text-2xl sm:text-3xl">Need Brand Recommendations?</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/82">
                  Book a consultation and we&apos;ll build a shortlist around your fit profile, style goals, and budget.
                </p>
                <ButtonLink href="/schedule-appointment" variant="teal" className="mt-5">
                  Book Styling Session
                </ButtonLink>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <h2 className="font-heading text-3xl text-ink sm:text-4xl">Popular Designer Profiles</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredBrands.slice(0, 8).map((brand) => (
              <Link
                href={`/collection-brand/${brand.slug}`}
                key={brand.slug}
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
