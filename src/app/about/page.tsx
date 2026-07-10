import Link from "next/link";
import { Compass, Gem, Shirt, Users } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { aboutPage } = pageContent;

export const metadata = buildMetadata({
  title: aboutPage.metaTitle,
  description: aboutPage.metaDescription,
  path: "/about",
});

const pillars = [
  {
    title: "Personal Guidance",
    description: "Styling consultations rooted in fit, context, and your day-to-day lifestyle.",
    icon: Users,
  },
  {
    title: "Tailored Precision",
    description: "Alteration and made-to-fit services designed for confidence and movement.",
    icon: Shirt,
  },
  {
    title: "Curated Brands",
    description: "Seasonal collections chosen for fabric quality, drape, and modern versatility.",
    icon: Gem,
  },
  {
    title: "Long-Term Partnership",
    description: "We help clients evolve wardrobes over time instead of one-off purchases.",
    icon: Compass,
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        title={aboutPage.hero.title}
        description={aboutPage.hero.description}
        ctaHref={aboutPage.hero.ctaPrimary.href}
        ctaLabel={aboutPage.hero.ctaPrimary.label}
        secondaryHref={aboutPage.hero.ctaSecondary.href}
        secondaryLabel={aboutPage.hero.ctaSecondary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Badge variant="teal">{aboutPage.overview.badge}</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">{aboutPage.overview.title}</h2>
              {aboutPage.overview.paragraphs.map((paragraph) => (
                <p key={paragraph.copy} className="mt-4 text-base leading-8 text-smoke">
                  {paragraph.copy}
                </p>
              ))}
            </div>

            <Card tone="stone">
              <CardContent>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Explore More</h2>
                <ul className="mt-4 space-y-3 text-sm font-semibold tracking-[0.1em] text-ink uppercase">
                  {aboutPage.overview.exploreLinks.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="hover:text-deep-teal">
                        {item.label}
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
                  src={aboutPage.founderSpotlight.image}
                  alt="Jason Barbaro, founder of J. Barbaro Clothiers"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover object-[72%_center]"
                />
              </div>
              <CardContent className="sm:p-8">
                <Badge variant="gold">{aboutPage.founderSpotlight.badge}</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">{aboutPage.founderSpotlight.title}</h2>
                {aboutPage.founderSpotlight.paragraphs.map((paragraph) => (
                  <p key={paragraph.copy} className="mt-4 text-base leading-8 text-smoke">
                    {paragraph.copy}
                  </p>
                ))}
                <div className="mt-6 flex flex-wrap gap-3">
                  {aboutPage.founderSpotlight.buttons.map((button, index) => (
                    <ButtonLink
                      key={`${button.href}-${index}`}
                      href={button.href}
                      target="_blank"
                      rel="noopener noreferrer"
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
            {aboutPage.pillars.map((pillar, index) => {
              const Icon = pillars[index]?.icon || Users;

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
            <ButtonLink href={aboutPage.bottomCtaHref} className="w-full sm:w-auto">
              {aboutPage.bottomCtaLabel}
            </ButtonLink>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
