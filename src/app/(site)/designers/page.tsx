import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getDesignersPageContent, getFeaturedBrands } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await getDesignersPageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/designers",
  });
}

export default async function DesignersHubPage() {
  const [content, featuredBrands] = await Promise.all([getDesignersPageContent(), getFeaturedBrands()]);

  return (
    <>
      <PageHero
        title={content.hero.title}
        description={content.hero.description}
        ctaHref={content.hero.ctaPrimary.href}
        ctaLabel={content.hero.ctaPrimary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {content.cards.map((card, index) => (
              <Card key={`${card.title}-${index}`} tone={index === 2 ? "ink" : undefined}>
                <CardContent>
                  {card.badge ? <Badge variant={index === 1 ? "gold" : "teal"}>{card.badge}</Badge> : null}
                  <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">{card.title}</h2>
                  <p className={`mt-3 text-sm leading-7 ${index === 2 ? "text-ivory/82" : "text-smoke"}`}>
                    {card.description}
                  </p>
                  {card.buttonLabel && card.buttonHref ? (
                    <ButtonLink href={card.buttonHref} variant={index === 2 ? "teal" : "secondary"} className="mt-5">
                      {card.buttonLabel}
                    </ButtonLink>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <h2 className="font-heading text-3xl text-ink sm:text-4xl">{content.popularHeading}</h2>
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
