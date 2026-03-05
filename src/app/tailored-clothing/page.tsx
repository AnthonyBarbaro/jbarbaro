import Image from "next/image";
import { ArrowRight, CheckCircle2, DraftingCompass, Ruler, Scissors } from "lucide-react";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import {
  tailoredSwatches,
  tailoringFaqs,
  tailoringHeroImage,
  tailoringInsetImage,
  tailoringOptions,
  tailoringPillars,
  tailoringSteps,
} from "@/data/tailored";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

export const metadata = buildMetadata({
  title: "Tailored Clothing & Made-to-Measure Fittings",
  description:
    "Discover precision tailoring at J. Barbaro Clothiers with fit-first consultations, made-to-measure services, and expert alterations.",
  path: "/tailored-clothing",
  image: tailoringHeroImage,
  keywords: [
    "tailored clothing Detroit",
    "made to measure suits Michigan",
    "mens tailoring Clinton Township",
    "custom suit fitting Auburn Hills",
    "J. Barbaro tailoring",
  ],
});

const stepIcons = [DraftingCompass, Ruler, Scissors, CheckCircle2] as const;

export default function TailoredClothingPage() {
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Tailored Clothing", path: "/tailored-clothing" },
  ]);

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Tailored Clothing & Made-to-Measure",
    serviceType: "Menswear Tailoring",
    areaServed: ["Clinton Township, Michigan", "Auburn Hills, Michigan"],
    provider: {
      "@type": "ClothingStore",
      name: "J. Barbaro Clothiers",
      url: absoluteUrl("/"),
    },
    description:
      "Fit-focused tailoring services including made-to-measure garments, formalwear tailoring, and precision alterations.",
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/schedule-appointment"),
      availability: "https://schema.org/InStock",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tailoringFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <SeoJsonLd data={[breadcrumbData, serviceJsonLd, faqJsonLd]} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Tailored Clothing", href: "/tailored-clothing" },
        ]}
      />

      <PageHero
        title="Tailored Clothing"
        description="A fit-first tailoring experience built around your body, your style goals, and how you actually live."
        ctaHref="/schedule-appointment"
        ctaLabel="Book Tailoring Consultation"
        secondaryHref="/locations"
        secondaryLabel="Choose Your Location"
      >
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ivory/20 bg-ivory/7 px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/72 uppercase">Style Brief</p>
            <p className="mt-1 text-sm text-ivory/86">Consultation based on your wardrobe goals and event needs.</p>
          </div>
          <div className="rounded-2xl border border-ivory/20 bg-ivory/7 px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/72 uppercase">Precision Measuring</p>
            <p className="mt-1 text-sm text-ivory/86">Body mapping and fit diagnostics for clean, confident drape.</p>
          </div>
          <div className="rounded-2xl border border-ivory/20 bg-ivory/7 px-4 py-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/72 uppercase">Final Refinement</p>
            <p className="mt-1 text-sm text-ivory/86">Final fitting and styling guidance before pickup or event day.</p>
          </div>
        </div>
      </PageHero>

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <Card className="overflow-hidden border-ink/15 bg-ink text-ivory">
              <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5]">
                <Image
                  src={tailoringHeroImage}
                  alt="Expert suit fitting and tailored menswear"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
              </div>
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">Best Fit Standard</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">How We Deliver the Best Fit Possible</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/78">
                  We combine traditional tailoring standards with modern fit diagnostics so your garments look sharp and feel effortless all day.
                </p>
              </CardContent>
            </Card>

            <div>
              <h2 className="font-heading text-3xl text-ink sm:text-4xl">Tailoring Designed Around You</h2>
              <p className="mt-4 text-base leading-8 text-smoke">
                The goal is simple: a garment that reads polished from every angle and remains comfortable in motion. Each appointment is one-on-one and tailored to your build, preferences, and schedule.
              </p>
              <div className="mt-6 space-y-3">
                {tailoringPillars.map((pillar) => (
                  <div key={pillar.title} className="rounded-2xl border border-ink/12 bg-stone/45 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-deep-teal" aria-hidden />
                      <div>
                        <h3 className="text-base font-semibold text-ink">{pillar.title}</h3>
                        <p className="mt-1 text-sm leading-7 text-smoke">{pillar.copy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/schedule-appointment">Reserve Appointment</ButtonLink>
                <ButtonLink href="/services" variant="secondary">
                  View Services
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow="Fit Method"
            title="A Structured Process from Consultation to Final Press"
            description="Our process is consistent, transparent, and designed to reduce guesswork while maximizing fit confidence."
            align="center"
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tailoringSteps.map((step, index) => {
              const Icon = stepIcons[index] ?? CheckCircle2;

              return (
                <Card key={step.title} className="h-full">
                  <CardContent>
                    <span className="inline-flex rounded-full border border-gold/35 bg-gold/16 px-3 py-1 text-[11px] font-semibold tracking-[0.13em] text-ink uppercase">
                      Step {index + 1}
                    </span>
                    <Icon className="mt-4 h-6 w-6 text-deep-teal" aria-hidden />
                    <h3 className="mt-3 font-heading text-2xl text-ink sm:text-3xl">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-smoke">{step.copy}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <SectionHeading
                eyebrow="Custom Options"
                title="Build a Wardrobe with Better Structure and Better Wear"
                description="From daily business pieces to wedding formalwear, we tailor garments with balance, proportion, and longevity in mind."
              />

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {tailoringOptions.map((option) => (
                  <Card key={option.title} tone="stone" className="h-full">
                    <CardContent>
                      <h3 className="font-heading text-2xl text-ink sm:text-3xl">{option.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-smoke">{option.copy}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border-ink/15 bg-ink text-ivory">
              <div className="relative aspect-[4/3]">
                <Image
                  src={tailoringInsetImage}
                  alt="J. Barbaro tailored clothing consultation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent" />
              </div>
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">Ready to Start</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">Book Your Fitting Session</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/80">
                  We will prepare options in your size and style range before you arrive so your appointment is focused and efficient.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/schedule-appointment" variant="teal">
                    Schedule Appointment
                  </ButtonLink>
                  <ButtonLink href="/locations" variant="secondary" className="border-ivory/70 text-ivory hover:border-gold hover:text-gold">
                    Visit Locations
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="B" background="stone">
        <Container>
          <SectionHeading
            eyebrow="Tailored Swatches"
            title="Explore a Sample of Available Cloth Patterns"
            description="Preview selected swatches below. During your appointment, we can review a broader swatch book and recommend the right weights and weaves."
            align="center"
          />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {tailoredSwatches.map((swatch) => (
              <a
                key={swatch.sku}
                href={swatch.full}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-ink/12 bg-ivory transition-all hover:-translate-y-1 hover:border-gold"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={swatch.thumb}
                    alt={`Tailoring cloth swatch ${swatch.sku}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-ink uppercase">{swatch.sku}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-deep-teal" aria-hidden />
                </div>
              </a>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <SectionHeading
                eyebrow="Tailoring FAQ"
                title="Common Questions Before You Book"
                description="Everything you need to know before your first fitting appointment."
              />

              <div className="mt-7 space-y-3">
                {tailoringFaqs.map((faq) => (
                  <details key={faq.question} className="rounded-2xl border border-ink/12 bg-stone/45 p-4 open:bg-stone/65">
                    <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-ink">{faq.question}</summary>
                    <p className="mt-3 text-sm leading-7 text-smoke">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <Card tone="ink" className="h-fit">
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">Next Step</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">Bring Your Vision. We&apos;ll Handle the Fit.</h2>
                <p className="mt-4 text-sm leading-7 text-ivory/80">
                  Book a one-on-one appointment and our team will prepare garments and fabric options for your goals before you arrive.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/schedule-appointment" variant="teal">
                    Reserve Appointment
                  </ButtonLink>
                  <ButtonLink href="/contact-us" variant="secondary" className="border-ivory/70 text-ivory hover:border-gold hover:text-gold">
                    Ask a Question
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
