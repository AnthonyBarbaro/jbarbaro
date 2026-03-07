import Image from "next/image";
import Link from "next/link";
import { Compass, Gem, Shirt, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getAboutPageContent } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

const pillarIcons = [Users, Shirt, Gem, Compass] as const;

export async function generateMetadata() {
  const content = await getAboutPageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/about",
  });
}

export default async function AboutPage() {
  const content = await getAboutPageContent();

  return (
    <>
      <PageHero
        title={content.hero.title}
        description={content.hero.description}
        ctaHref={content.hero.ctaPrimary.href}
        ctaLabel={content.hero.ctaPrimary.label}
        secondaryHref={content.hero.ctaSecondary.href}
        secondaryLabel={content.hero.ctaSecondary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Badge variant="teal">{content.overview.badge}</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">{content.overview.title}</h2>
              {content.overview.paragraphs.map((paragraph, index) => (
                <p key={index} className="mt-4 text-base leading-8 text-smoke">
                  {paragraph.copy}
                </p>
              ))}
            </div>

            <Card tone="stone">
              <CardContent>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Explore More</h2>
                <ul className="mt-4 space-y-3 text-sm font-semibold tracking-[0.1em] text-ink uppercase">
                  {content.overview.exploreLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="hover:text-deep-teal">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <Card className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[340px_1fr]">
              <div className="relative min-h-[320px] bg-ink/10">
                <Image
                  src={content.founderSpotlight.image}
                  alt="Jason Barbaro, founder of J. Barbaro Clothiers"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-[72%_center]"
                />
              </div>
              <CardContent className="sm:p-8">
                <Badge variant="gold">{content.founderSpotlight.badge}</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">{content.founderSpotlight.title}</h2>
                {content.founderSpotlight.paragraphs.map((paragraph, index) => (
                  <p key={index} className="mt-4 text-base leading-8 text-smoke">
                    {paragraph.copy}
                  </p>
                ))}
                <div className="mt-6 flex flex-wrap gap-3">
                  {content.founderSpotlight.buttons.map((button, index) => (
                    <ButtonLink
                      key={`${button.href}-${index}`}
                      href={button.href}
                      target={button.href.startsWith("http") ? "_blank" : undefined}
                      rel={button.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      variant={index === 0 ? "teal" : "secondary"}
                      className="w-full sm:w-auto"
                    >
                      {button.label}
                    </ButtonLink>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.pillars.map((pillar, index) => {
              const Icon = pillarIcons[index] ?? Users;

              return (
                <Card key={pillar.title} className="h-full">
                  <CardContent>
                    <Icon className="h-6 w-6 text-deep-teal" />
                    <h2 className="mt-4 font-heading text-2xl text-ink">{pillar.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-smoke">{pillar.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-8">
            <ButtonLink href={content.bottomCtaHref} className="w-full sm:w-auto">
              {content.bottomCtaLabel}
            </ButtonLink>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
