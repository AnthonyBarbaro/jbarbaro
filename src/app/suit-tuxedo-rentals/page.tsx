import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { rentalsPage } = pageContent;

export const metadata = buildMetadata({
  title: rentalsPage.metaTitle,
  description: rentalsPage.metaDescription,
  path: "/suit-tuxedo-rentals",
});

export default function SuitTuxedoRentalsPage() {
  return (
    <>
      <section className="relative min-h-[64svh] overflow-hidden bg-ink text-ivory sm:min-h-[72svh]">
        <Image
          src={rentalsPage.heroImage}
          alt="Wedding suits and tuxedos at J. Barbaro Clothiers"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.84)_0%,rgba(0,0,0,0.25)_68%)]" />
        <Container className="relative z-10 flex min-h-[64svh] items-end py-12 sm:min-h-[72svh] sm:items-center sm:py-14">
          <div className="max-w-3xl">
            <Badge
              variant="gold"
              className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.13em] text-ink shadow-[0_10px_26px_-16px_rgba(0,0,0,0.9)] sm:text-xs"
            >
              Wedding Suits & Tuxedos
            </Badge>
            <h1 className="mt-4 text-balance font-heading text-4xl leading-tight sm:text-6xl">
              {rentalsPage.hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[0.98rem] leading-7 text-ivory/88 sm:text-lg sm:leading-8">
              {rentalsPage.hero.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink
                href={rentalsPage.hero.ctaPrimary.href}
                size="lg"
                className="w-full sm:w-auto"
              >
                {rentalsPage.hero.ctaPrimary.label}
              </ButtonLink>
              <ButtonLink
                href={rentalsPage.hero.ctaSecondary.href}
                variant="secondary"
                size="lg"
                className="w-full border-ivory/80 bg-transparent text-ivory hover:border-gold hover:bg-gold/10 hover:text-gold sm:w-auto"
              >
                {rentalsPage.hero.ctaSecondary.label}
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            {rentalsPage.catalogs.map((catalog) => (
              <Card key={catalog.id} className="h-full">
                <CardContent>
                  <Badge variant="teal">Catalog</Badge>
                  <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">
                    {catalog.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{catalog.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink
                      href={catalog.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      className="w-full sm:w-auto"
                    >
                      <span className="mr-2 inline-flex">
                        <ExternalLink className="h-4 w-4" />
                      </span>
                      Open Catalog
                    </ButtonLink>
                    <ButtonLink
                      href={catalog.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="teal"
                      className="w-full sm:w-auto"
                    >
                      <span className="mr-2 inline-flex">
                        <Download className="h-4 w-4" />
                      </span>
                      Download PDF
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="ivory" className="hidden md:block">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="h-[380px]">
                <iframe
                  title="Tuxedo and suit rental catalog preview"
                  src={`${rentalsPage.catalogs[0].href}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-[380px]">
                <iframe
                  title="Formal accessory catalog preview"
                  src={`${rentalsPage.catalogs[1].href}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" background="ink">
        <Container className="grid gap-4 lg:grid-cols-3">
          {rentalsPage.featureCards.map((card, index) => {
            const Icon = index === 0 ? Users : Sparkles;

            return (
              <Card key={card.title} className="bg-ivory text-ink">
                <CardContent>
                  <Icon className="h-6 w-6 text-deep-teal" />
                  <h2 className="mt-4 font-heading text-2xl sm:text-3xl">{card.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
          <Card className="bg-ivory text-ink">
            <CardContent>
              <h2 className="font-heading text-2xl sm:text-3xl">{rentalsPage.closingCard.title}</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                {rentalsPage.closingCard.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {rentalsPage.closingCard.buttons.map((button, index) => (
                  <ButtonLink
                    key={button.href}
                    href={button.href}
                    variant={index === 0 ? "primary" : "secondary"}
                    className="w-full sm:w-auto"
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
              <Link
                href={rentalsPage.closingCard.footerLinkHref}
                className="mt-4 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-ink"
              >
                {rentalsPage.closingCard.footerLinkLabel} →
              </Link>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
