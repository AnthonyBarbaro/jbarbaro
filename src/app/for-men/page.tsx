import Link from "next/link";

import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { getMenCategoryHref, menCategories } from "@/data/men-categories";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { forMenPage } = pageContent;

export const metadata = buildMetadata({
  title: forMenPage.metaTitle,
  description: forMenPage.metaDescription,
  path: "/for-men",
});

export default function ForMenHubPage() {
  return (
    <>
      <PageHero
        title={forMenPage.hero.title}
        description={forMenPage.hero.description}
        ctaHref={forMenPage.hero.ctaPrimary.href}
        ctaLabel={forMenPage.hero.ctaPrimary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menCategories.map((category) => (
              <Card key={category.slug} className="group h-full transition-transform duration-300 hover:-translate-y-1">
                <CardContent>
                  <Badge variant="teal">Category</Badge>
                  <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">{category.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{category.shortDescription}</p>
                  <Link
                    href={getMenCategoryHref(category)}
                    className="mt-4 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                  >
                    View Category
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <Card className="bg-ink text-ivory">
            <CardContent>
              <h2 className="font-heading text-3xl sm:text-4xl">{forMenPage.closingCardTitle}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ivory/82">{forMenPage.closingCardDescription}</p>
              <ButtonLink href={forMenPage.closingButtonHref} className="mt-6 w-full sm:w-auto">
                {forMenPage.closingButtonLabel}
              </ButtonLink>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
