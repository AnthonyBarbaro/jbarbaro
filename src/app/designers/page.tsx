import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { featuredBrands } from "@/data/brands";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { designersPage } = pageContent;

export const metadata = buildMetadata({
  title: designersPage.metaTitle,
  description: designersPage.metaDescription,
  path: "/designers",
});

export default function DesignersHubPage() {
  return (
    <>
      <PageHero
        title={designersPage.hero.title}
        description={designersPage.hero.description}
        ctaHref={designersPage.hero.ctaPrimary.href}
        ctaLabel={designersPage.hero.ctaPrimary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {designersPage.cards.map((card, index) => {
              const isInkCard = index === designersPage.cards.length - 1;

              return (
                <Card key={card.title} tone={isInkCard ? "ink" : "ivory"}>
                  <CardContent>
                    {card.badge ? <Badge variant={index === 0 ? "teal" : "gold"}>{card.badge}</Badge> : null}
                    <h2 className={`mt-4 font-heading text-2xl sm:text-3xl ${isInkCard ? "text-ivory" : "text-ink"}`}>
                      {card.title}
                    </h2>
                    <p className={`mt-3 text-sm leading-7 ${isInkCard ? "text-ivory/82" : "text-smoke"}`}>
                      {card.description}
                    </p>
                    {card.buttonHref && card.buttonLabel ? (
                      <ButtonLink
                        href={card.buttonHref}
                        variant={isInkCard ? "teal" : "secondary"}
                        className="mt-5"
                      >
                        {card.buttonLabel}
                      </ButtonLink>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <h2 className="font-heading text-3xl text-ink sm:text-4xl">{designersPage.popularHeading}</h2>
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
