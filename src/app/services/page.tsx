import Link from "next/link";

import { PageHero } from "@/components/ui/PageHero";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { serviceHighlights } from "@/data/services";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Menswear Services",
  description:
    "Explore premium menswear services at J. Barbaro Clothiers including personal styling, tailoring, formalwear, and wardrobe planning.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Luxury Menswear Services"
        description="From personalized styling to tailoring and formalwear planning, every service is built to improve fit, confidence, and convenience."
        ctaHref="/schedule-appointment"
        ctaLabel="Book Service Appointment"
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {serviceHighlights.map((service) => (
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
              <h2 className="font-heading text-3xl sm:text-4xl">Ready for a Focused Styling Session?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/82">
                Tell us your event, timeline, and style goals. We will prepare a curated session before you arrive.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                  Schedule Appointment
                </ButtonLink>
                <ButtonLink
                  href="/contact-us"
                  variant="secondary"
                  className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto"
                >
                  Ask a Question
                </ButtonLink>
              </div>
              <Link href="/reviews" className="mt-5 inline-flex text-xs font-semibold tracking-[0.14em] text-gold uppercase hover:text-ivory">
                See Client Reviews
              </Link>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
