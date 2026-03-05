import Link from "next/link";
import { Compass, Gem, Shirt, Users } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About J. Barbaro Clothiers",
  description:
    "Learn about J. Barbaro Clothiers, our luxury menswear philosophy, and the personalized styling experience we deliver in Metro Detroit.",
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

const founderImage =
  "https://scontent-lax3-1.cdninstagram.com/v/t51.2885-19/23594617_1788587218101009_5877377593107283968_n.jpg";
const founderInstagram = "https://www.instagram.com/j.barbaroclothiers/";

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About J. Barbaro Clothiers"
        description="A modern clothier rooted in personal service, impeccable fit, and curated designer menswear."
        ctaHref="/schedule-appointment"
        ctaLabel="Book an Appointment"
        secondaryHref="/about/our-history"
        secondaryLabel="Our History"
      />

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <Badge variant="teal">Who We Are</Badge>
              <h2 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">Luxury Menswear with Human-Centered Service</h2>
              <p className="mt-4 text-base leading-8 text-smoke">
                J. Barbaro Clothiers serves Metro Detroit clients who value craftsmanship, presentation, and confidence. From first consultation through final fitting, every recommendation is designed around your goals.
              </p>
              <p className="mt-4 text-base leading-8 text-smoke">
                We support executives, entrepreneurs, and event clients with full wardrobe strategy: tailored clothing, premium casualwear, and formalwear coordination.
              </p>
            </div>

            <Card tone="stone">
              <CardContent>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Explore More</h2>
                <ul className="mt-4 space-y-3 text-sm font-semibold tracking-[0.1em] text-ink uppercase">
                  <li>
                    <Link href="/about/our-history" className="hover:text-deep-teal">
                      Our History
                    </Link>
                  </li>
                  <li>
                    <Link href="/services" className="hover:text-deep-teal">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/reviews" className="hover:text-deep-teal">
                      Reviews
                    </Link>
                  </li>
                  <li>
                    <Link href="/locations" className="hover:text-deep-teal">
                      Locations
                    </Link>
                  </li>
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
                  src={founderImage}
                  alt="Jason Barbaro, founder of J. Barbaro Clothiers"
                  fill
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover"
                />
              </div>
              <CardContent className="sm:p-8">
                <Badge variant="gold">Founder Spotlight</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Jason Barbaro</h2>
                <p className="mt-4 text-base leading-8 text-smoke">
                  Jason Barbaro founded J. Barbaro Clothiers with a simple principle: every client deserves expert
                  fit guidance, elevated service, and wardrobe recommendations built around real life, not trends
                  alone.
                </p>
                <p className="mt-4 text-base leading-8 text-smoke">
                  That founder-led mindset still drives the business today across both Metro Detroit locations,
                  from tailored clothing and luxury menswear to wedding and formalwear styling.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink
                    href={founderInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="teal"
                    className="w-full sm:w-auto"
                  >
                    Follow on Instagram
                  </ButtonLink>
                  <ButtonLink
                    href={founderInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    View Founder Post Feed
                  </ButtonLink>
                </div>
              </CardContent>
            </div>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <Card key={pillar.title} className="h-full">
                <CardContent>
                  <pillar.icon className="h-6 w-6 text-deep-teal" />
                  <h2 className="mt-4 font-heading text-2xl text-ink">{pillar.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{pillar.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8">
            <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
              Schedule a Styling Session
            </ButtonLink>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
