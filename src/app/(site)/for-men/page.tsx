import Link from "next/link";

import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { getCategories, getForMenPageContent } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await getForMenPageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/for-men",
  });
}

export default async function ForMenHubPage() {
  const [content, categories] = await Promise.all([getForMenPageContent(), getCategories()]);

  return (
    <>
      <PageHero
        title={content.hero.title}
        description={content.hero.description}
        ctaHref={content.hero.ctaPrimary.href}
        ctaLabel={content.hero.ctaPrimary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.slug} className="group h-full transition-transform duration-300 hover:-translate-y-1">
                <CardContent>
                  <Badge variant="teal">Category</Badge>
                  <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">{category.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{category.shortDescription}</p>
                  <Link
                    href={`/for-men/${category.slug}`}
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
              <h2 className="font-heading text-3xl sm:text-4xl">{content.closingCardTitle}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ivory/82">{content.closingCardDescription}</p>
              <ButtonLink href={content.closingButtonHref} className="mt-6 w-full sm:w-auto">
                {content.closingButtonLabel}
              </ButtonLink>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
