import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getOurHistoryPageContent } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const crumbs = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Our History", href: "/about/our-history" },
];

export async function generateMetadata() {
  const content = await getOurHistoryPageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/about/our-history",
  });
}

export default async function OurHistoryPage() {
  const content = await getOurHistoryPageContent();

  return (
    <>
      <SeoJsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
          { name: "Our History", path: "/about/our-history" },
        ])}
      />
      <Breadcrumbs items={crumbs} />

      <PageHero title={content.hero.title} description={content.hero.description} />

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {content.milestones.map((milestone) => (
              <Card key={milestone.title} className="h-full">
                <CardContent>
                  <p className="text-xs font-semibold tracking-[0.16em] text-deep-teal uppercase">{milestone.year}</p>
                  <h2 className="mt-3 font-heading text-2xl text-ink sm:text-3xl">{milestone.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{milestone.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <Card className="bg-ink text-ivory">
            <CardContent>
              <h2 className="font-heading text-3xl sm:text-4xl">{content.closingTitle}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ivory/80">{content.closingDescription}</p>
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
