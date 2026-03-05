import Link from "next/link";
import { Star } from "lucide-react";

import { PageHero } from "@/components/ui/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { aggregateRating, testimonials } from "@/data/testimonials";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Customer Reviews",
  description:
    "Read verified customer testimonials and review insights for J. Barbaro Clothiers, rated 4.7/5 across Metro Detroit locations.",
  path: "/reviews",
});

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        title="Customer Reviews"
        description="Our clients trust us for fit precision, professional guidance, and premium menswear service."
        ctaHref="/schedule-appointment"
        ctaLabel="Book an Appointment"
      />

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <Card tone="stone">
            <CardContent>
              <p className="text-sm font-semibold tracking-[0.14em] text-deep-teal uppercase">Aggregate Rating</p>
              <h2 className="mt-3 font-heading text-5xl text-ink sm:text-6xl">
                {aggregateRating.ratingValue} <span className="text-xl text-smoke sm:text-2xl">/ 5.0</span>
              </h2>
              <p className="mt-2 text-sm text-smoke">Based on {aggregateRating.reviewCount} customer reviews</p>
              <div className="mt-4 flex gap-1 text-gold">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <ButtonLink href="/schedule-appointment" className="mt-6 w-full sm:w-auto">
                Schedule Your Visit
              </ButtonLink>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="stone">
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="h-full">
                <CardContent>
                  <div className="flex items-center gap-1 text-gold">
                    {Array.from({ length: testimonial.rating }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 font-heading text-2xl leading-tight text-ink sm:text-3xl">“{testimonial.quote}”</blockquote>
                  <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-smoke uppercase">{testimonial.name}</p>
                  <Link href="/schedule-appointment" className="mt-3 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold">
                    Book a Similar Experience
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
