import Image from "next/image";
import { CheckCircle2, DraftingCompass, Ruler, Scissors } from "lucide-react";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { TailoringSwatchGrid } from "@/components/tailoring/TailoringSwatchGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { tailoredSwatches } from "@/data/tailored";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { pageContent } from "@/lib/site-content";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const { tailoredPage } = pageContent;

export const metadata = buildMetadata({
  title: tailoredPage.metaTitle,
  description: tailoredPage.metaDescription,
  path: "/tailored-clothing",
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
    mainEntity: tailoredPage.faqSection.faqs.map((faq) => ({
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
        title={tailoredPage.heroTitle}
        description={tailoredPage.heroDescription}
        ctaHref={tailoredPage.heroCtaPrimary.href}
        ctaLabel={tailoredPage.heroCtaPrimary.label}
        secondaryHref={tailoredPage.heroCtaSecondary.href}
        secondaryLabel={tailoredPage.heroCtaSecondary.label}
      >
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {tailoredPage.heroHighlights.map((highlight) => (
            <div key={highlight.title} className="rounded-lg border border-ink/10 bg-white px-4 py-3 shadow-sm shadow-ink/[0.03]">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase">{highlight.title}</p>
              <p className="mt-1 text-sm leading-6 text-ink">{highlight.copy}</p>
            </div>
          ))}
        </div>
      </PageHero>

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <Card className="overflow-hidden border-ink/15 bg-ink text-ivory">
              <div className="relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5]">
                <Image
                  src={tailoredPage.heroImage}
                  alt="Expert suit fitting and tailored menswear"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
              </div>
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">{tailoredPage.fitSection.badge}</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">{tailoredPage.fitSection.title}</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/78">{tailoredPage.fitSection.description}</p>
              </CardContent>
            </Card>

            <div>
              <h2 className="font-heading text-3xl text-ink sm:text-4xl">{tailoredPage.fitSection.introTitle}</h2>
              <p className="mt-4 text-base leading-8 text-smoke">{tailoredPage.fitSection.introCopy}</p>
              <div className="mt-6 space-y-3">
                {tailoredPage.fitSection.pillars.map((pillar) => (
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
                {tailoredPage.fitSection.buttons.map((button, index) => (
                  <ButtonLink key={button.href} href={button.href} variant={index === 0 ? "primary" : "secondary"}>
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow={tailoredPage.processSection.eyebrow}
            title={tailoredPage.processSection.title}
            description={tailoredPage.processSection.description}
            align="center"
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tailoredPage.processSection.steps.map((step, index) => {
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
                eyebrow={tailoredPage.optionsSection.eyebrow}
                title={tailoredPage.optionsSection.title}
                description={tailoredPage.optionsSection.description}
              />

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {tailoredPage.optionsSection.options.map((option) => (
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
                  src={tailoredPage.insetImage}
                  alt="J. Barbaro tailored clothing consultation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent" />
              </div>
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">{tailoredPage.optionsSection.insetBadge}</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">{tailoredPage.optionsSection.insetTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/80">{tailoredPage.optionsSection.insetCopy}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {tailoredPage.optionsSection.insetButtons.map((button, index) => (
                    <ButtonLink
                      key={button.href}
                      href={button.href}
                      variant={index === 0 ? "teal" : "secondary"}
                      className={index === 0 ? undefined : "border-ivory/70 text-ivory hover:border-gold hover:text-gold"}
                    >
                      {button.label}
                    </ButtonLink>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="B" background="stone">
        <Container>
          <SectionHeading
            eyebrow={tailoredPage.swatchSection.eyebrow}
            title={tailoredPage.swatchSection.title}
            description={tailoredPage.swatchSection.description}
            align="center"
          />

          <TailoringSwatchGrid swatches={tailoredSwatches} />
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <SectionHeading
                eyebrow={tailoredPage.faqSection.eyebrow}
                title={tailoredPage.faqSection.title}
                description={tailoredPage.faqSection.description}
              />

              <div className="mt-7 space-y-3">
                {tailoredPage.faqSection.faqs.map((faq) => (
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
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">{tailoredPage.faqSection.closingTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-ivory/80">{tailoredPage.faqSection.closingDescription}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {tailoredPage.faqSection.closingButtons.map((button, index) => (
                    <ButtonLink
                      key={button.href}
                      href={button.href}
                      variant={index === 0 ? "teal" : "secondary"}
                      className={index === 0 ? undefined : "border-ivory/70 text-ivory hover:border-gold hover:text-gold"}
                    >
                      {button.label}
                    </ButtonLink>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
