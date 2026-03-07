import Link from "next/link";

import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { getServicesContent } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await getServicesContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/services",
  });
}

export default async function ServicesPage() {
  const content = await getServicesContent();

  return (
    <>
      <PageHero
        title={content.hero.title}
        description={content.hero.description}
        ctaHref={content.hero.ctaPrimary?.href}
        ctaLabel={content.hero.ctaPrimary?.label}
        secondaryHref={content.hero.ctaSecondary?.href}
        secondaryLabel={content.hero.ctaSecondary?.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {content.serviceHighlights.map((service) => (
              <Card key={service.title} className="h-full">
                <CardContent>
                  <Badge variant="teal">Service</Badge>
                  <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">{service.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{service.description}</p>
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
              <h2 className="font-heading text-3xl sm:text-4xl">{content.closingCta.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/82">{content.closingCta.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {content.closingCta.buttons.map((button, index) => (
                  <ButtonLink
                    key={`${button.href}-${index}`}
                    href={button.href}
                    variant={index === 0 ? "primary" : "secondary"}
                    className={index === 0 ? "w-full sm:w-auto" : "w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto"}
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
              <Link
                href={content.closingCta.footerLinkHref}
                className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-gold uppercase hover:text-ivory"
              >
                {content.closingCta.footerLinkLabel}
              </Link>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
