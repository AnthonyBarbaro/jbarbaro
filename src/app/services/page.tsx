import Link from "next/link";

import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { servicesPage } = pageContent;

export const metadata = buildMetadata({
  title: servicesPage.metaTitle,
  description: servicesPage.metaDescription,
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title={servicesPage.hero.title}
        description={servicesPage.hero.description}
        ctaHref={servicesPage.hero.ctaPrimary?.href}
        ctaLabel={servicesPage.hero.ctaPrimary?.label}
        secondaryHref={servicesPage.hero.ctaSecondary?.href}
        secondaryLabel={servicesPage.hero.ctaSecondary?.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {servicesPage.serviceHighlights.map((service) => (
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
              <h2 className="font-heading text-3xl sm:text-4xl">{servicesPage.closingCta.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/82">{servicesPage.closingCta.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {servicesPage.closingCta.buttons.map((button, index) => (
                  <ButtonLink
                    key={button.href}
                    href={button.href}
                    variant={index === 0 ? "primary" : "secondary"}
                    className={`w-full sm:w-auto ${index === 0 ? "" : "border-ivory/80 text-ivory hover:border-gold hover:text-gold"}`}
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
              <Link
                href={servicesPage.closingCta.footerLinkHref}
                className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-gold uppercase hover:text-ivory"
              >
                {servicesPage.closingCta.footerLinkLabel}
              </Link>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
