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
import { getSwatches, getTailoredPageContent } from "@/lib/cms";
import { absoluteUrl, buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";

const stepIcons = [DraftingCompass, Ruler, Scissors, CheckCircle2] as const;

export async function generateMetadata() {
  const content = await getTailoredPageContent();

  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: "/tailored-clothing",
    image: content.heroImage,
    keywords: [
      "tailored clothing Detroit",
      "made to measure suits Michigan",
      "mens tailoring Clinton Township",
      "custom suit fitting Auburn Hills",
      "J. Barbaro tailoring",
    ],
  });
}

export default async function TailoredClothingPage() {
  const [content, swatches] = await Promise.all([getTailoredPageContent(), getSwatches()]);
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
    mainEntity: content.faqSection.faqs.map((faq) => ({
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
        title={content.heroTitle}
        description={content.heroDescription}
        ctaHref={content.heroCtaPrimary.href}
        ctaLabel={content.heroCtaPrimary.label}
        secondaryHref={content.heroCtaSecondary.href}
        secondaryLabel={content.heroCtaSecondary.label}
      >
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {content.heroHighlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-ivory/20 bg-ivory/7 px-4 py-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/72 uppercase">{item.title}</p>
              <p className="mt-1 text-sm text-ivory/86">{item.copy}</p>
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
                  src={content.heroImage}
                  alt="Expert suit fitting and tailored menswear"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
              </div>
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">{content.fitSection.badge}</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">{content.fitSection.title}</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/78">{content.fitSection.description}</p>
              </CardContent>
            </Card>

            <div>
              <h2 className="font-heading text-3xl text-ink sm:text-4xl">{content.fitSection.introTitle}</h2>
              <p className="mt-4 text-base leading-8 text-smoke">{content.fitSection.introCopy}</p>
              <div className="mt-6 space-y-3">
                {content.fitSection.pillars.map((pillar) => (
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
                {content.fitSection.buttons.map((button, index) => (
                  <ButtonLink key={`${button.href}-${index}`} href={button.href} variant={index === 0 ? "primary" : "secondary"}>
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
            eyebrow={content.processSection.eyebrow}
            title={content.processSection.title}
            description={content.processSection.description}
            align="center"
          />

          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {content.processSection.steps.map((step, index) => {
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
                eyebrow={content.optionsSection.eyebrow}
                title={content.optionsSection.title}
                description={content.optionsSection.description}
              />

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {content.optionsSection.options.map((option) => (
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
                  src={content.insetImage}
                  alt="J. Barbaro tailored clothing consultation"
                  fill
                  sizes="(max-width: 1024px) 100vw, 38vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/35 to-transparent" />
              </div>
              <CardContent>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-ivory/70 uppercase">{content.optionsSection.insetBadge}</p>
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">{content.optionsSection.insetTitle}</h2>
                <p className="mt-3 text-sm leading-7 text-ivory/80">{content.optionsSection.insetCopy}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {content.optionsSection.insetButtons.map((button, index) => (
                    <ButtonLink
                      key={`${button.href}-${index}`}
                      href={button.href}
                      variant={index === 0 ? "teal" : "secondary"}
                      className={index === 0 ? "" : "border-ivory/70 text-ivory hover:border-gold hover:text-gold"}
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
            eyebrow={content.swatchSection.eyebrow}
            title={content.swatchSection.title}
            description={content.swatchSection.description}
            align="center"
          />

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {swatches.map((swatch) => (
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
                eyebrow={content.faqSection.eyebrow}
                title={content.faqSection.title}
                description={content.faqSection.description}
              />

              <div className="mt-7 space-y-3">
                {content.faqSection.faqs.map((faq) => (
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
                <h2 className="mt-3 font-heading text-3xl text-ivory sm:text-4xl">{content.faqSection.closingTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-ivory/80">{content.faqSection.closingDescription}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {content.faqSection.closingButtons.map((button, index) => (
                    <ButtonLink
                      key={`${button.href}-${index}`}
                      href={button.href}
                      variant={index === 0 ? "teal" : "secondary"}
                      className={index === 0 ? "" : "border-ivory/70 text-ivory hover:border-gold hover:text-gold"}
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
