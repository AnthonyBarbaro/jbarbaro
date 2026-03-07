import { CheckCircle2, Download } from "lucide-react";

import { WeddingRegistrationForm } from "@/components/tuxedos/WeddingRegistrationForm";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getLocations, getWeddingPageContent } from "@/lib/cms";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const content = await getWeddingPageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/register-your-wedding",
  });
}

export default async function RegisterWeddingPage() {
  const [content, locations] = await Promise.all([getWeddingPageContent(), getLocations()]);

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
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <Card tone="stone">
                <CardContent>
                  <Badge variant="teal">{content.intakeCard.badge}</Badge>
                  <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">{content.intakeCard.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{content.intakeCard.description}</p>
                </CardContent>
              </Card>

              <WeddingRegistrationForm locations={locations} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">What Happens Next</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-smoke">
                    {content.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-1 h-4 w-4 text-deep-teal" />
                        {step.copy}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card tone="ink">
                <CardContent>
                  <h2 className="font-heading text-2xl sm:text-3xl">Download Catalogs</h2>
                  <p className="mt-3 text-sm leading-7 text-ivory/82">
                    Review formalwear and accessories before your consultation.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {content.catalogButtons.map((button, index) => (
                      <ButtonLink
                        key={`${button.href}-${index}`}
                        href={button.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant={index === 0 ? "teal" : "secondary"}
                        size="sm"
                        className={index === 0 ? "w-full sm:w-auto" : "w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto"}
                      >
                        <span className="mr-2 inline-flex"><Download className="h-4 w-4" /></span>
                        {button.label}
                      </ButtonLink>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
