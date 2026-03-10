import { CheckCircle2, Download } from "lucide-react";

import { WeddingRegistrationForm } from "@/components/tuxedos/WeddingRegistrationForm";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { weddingPage } = pageContent;

export const metadata = buildMetadata({
  title: weddingPage.metaTitle,
  description: weddingPage.metaDescription,
  path: "/register-your-wedding",
});

export default function RegisterWeddingPage() {
  return (
    <>
      <PageHero
        title={weddingPage.hero.title}
        description={weddingPage.hero.description}
        ctaHref={weddingPage.hero.ctaPrimary.href}
        ctaLabel={weddingPage.hero.ctaPrimary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <Card tone="stone">
                <CardContent>
                  <Badge variant="teal">{weddingPage.intakeCard.badge}</Badge>
                  <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">{weddingPage.intakeCard.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{weddingPage.intakeCard.description}</p>
                </CardContent>
              </Card>

              <WeddingRegistrationForm locations={locations} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">What Happens Next</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-smoke">
                    {weddingPage.nextSteps.map((step) => (
                      <li key={step.copy} className="flex items-start gap-2">
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
                    {weddingPage.catalogButtons.map((button, index) => (
                      <ButtonLink
                        key={button.href}
                        href={button.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant={index === 0 ? "teal" : "secondary"}
                        size="sm"
                        className={`w-full sm:w-auto ${index === 0 ? "" : "border-ivory/80 text-ivory hover:border-gold hover:text-gold"}`}
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
