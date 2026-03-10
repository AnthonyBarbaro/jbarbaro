import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ruler, Scissors, ShieldCheck } from "lucide-react";

import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { SeoJsonLd } from "@/components/SeoJsonLd";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PostCard } from "@/components/content/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveSection } from "@/components/ui/WaveSection";
import { featuredBrands } from "@/data/brands";
import { locations } from "@/data/locations";
import { menCategories } from "@/data/men-categories";
import { siteSettings } from "@/data/site-settings";
import { socialLinks } from "@/data/social";
import { aggregateRating, testimonials } from "@/data/testimonials";
import { getFeaturedPosts } from "@/lib/content";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";

const { homePage } = pageContent;

export const metadata = buildMetadata({
  title: homePage.metaTitle,
  description: homePage.metaDescription,
  path: "/",
  image: homePage.heroImage,
});

const tailorProcessIcons = [ShieldCheck, Ruler, Scissors] as const;

export default function HomePage() {
  const featuredPosts = getFeaturedPosts(3);
  const facebookLink = socialLinks.find((link) => link.label.toLowerCase() === "facebook")?.href;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteSettings.siteName,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };

  return (
    <>
      <SeoJsonLd data={websiteJsonLd} />

      <section className="relative min-h-[70svh] overflow-hidden bg-ink text-ivory sm:min-h-[82svh]">
        <Image
          src={homePage.heroImage}
          alt={`Tailored menswear at ${siteSettings.siteName}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,15,20,0.92),rgba(11,15,20,0.65)_45%,rgba(11,15,20,0.24))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_18%,rgba(199,164,106,0.24),transparent_36%)]" />

        <Container className="relative z-10 flex min-h-[70svh] items-center py-12 sm:min-h-[82svh] sm:items-end sm:py-18">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {homePage.heroBadges.map((badge, index) =>
                index === 0 ? (
                  <Badge
                    key={badge.label}
                    variant="gold"
                    className="border-gold/95 bg-gold px-4 py-1.5 text-[0.72rem] font-bold tracking-[0.12em] text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.85)] sm:text-xs"
                  >
                    {badge.label}
                  </Badge>
                ) : (
                  <span
                    key={badge.label}
                    className="rounded-full border border-ivory/70 bg-ink/70 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.11em] text-ivory uppercase backdrop-blur-sm sm:text-[11px]"
                  >
                    {badge.label}
                  </span>
                ),
              )}
            </div>
            <h1 className="mt-5 text-balance font-heading text-3xl leading-tight sm:mt-6 sm:text-6xl lg:text-7xl">
              {homePage.heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[0.98rem] leading-7 text-ivory/86 sm:mt-5 sm:text-lg sm:leading-8">
              {homePage.heroDescription}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {homePage.heroCtas.map((cta, index) => (
                <ButtonLink
                  key={cta.href}
                  href={cta.href}
                  variant={index === 0 ? "primary" : "secondary"}
                  size="lg"
                  className={`w-full sm:w-auto ${index === 0 ? "" : "border-ivory/80 text-ivory hover:border-gold hover:text-gold"}`}
                >
                  {cta.label}
                </ButtonLink>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ivory/84">
              <span>
                {aggregateRating.ratingValue} / 5 ({aggregateRating.reviewCount} reviews)
              </span>
              <span aria-hidden className="hidden sm:inline">
                •
              </span>
              <span>Full ecommerce checkout coming soon</span>
              <span aria-hidden className="hidden sm:inline">
                •
              </span>
              {facebookLink ? (
                <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
                  {siteSettings.facebookLikes.toLocaleString()} Facebook likes
                </a>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <SectionHeading
            eyebrow={homePage.tailorProcess.eyebrow}
            title={homePage.tailorProcess.title}
            description={homePage.tailorProcess.description}
            align="center"
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {homePage.tailorProcess.items.map((item, index) => {
              const Icon = tailorProcessIcons[index] ?? ShieldCheck;

              return (
                <Card key={item.title} tone="stone" className="h-full">
                  <CardContent>
                    <Icon className="h-6 w-6 text-deep-teal" />
                    <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">{item.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-smoke">{item.copy}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <Card className="bg-ink text-ivory">
            <CardContent className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <Badge
                  variant="gold"
                  className="px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.13em] shadow-[0_12px_28px_-16px_rgba(0,0,0,0.8)] sm:text-xs"
                >
                  {homePage.retailBanner.badge}
                </Badge>
                <h2 className="mt-4 font-heading text-3xl sm:text-5xl">{homePage.retailBanner.title}</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-ivory/84 sm:text-base sm:leading-8">
                  {homePage.retailBanner.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {homePage.retailBanner.buttons.map((button, index) => (
                  <ButtonLink
                    key={button.href}
                    href={button.href}
                    variant={index === 0 ? "teal" : "secondary"}
                    className={`w-full sm:w-auto ${index === 0 ? "" : "border-ivory/80 text-ivory hover:border-gold hover:text-gold"}`}
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow={homePage.categoriesSection.eyebrow}
            title={homePage.categoriesSection.title}
            description={homePage.categoriesSection.description}
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {menCategories.slice(0, 6).map((category) => (
              <Card key={category.slug} className="h-full">
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">{category.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{category.shortDescription}</p>
                  <Link
                    href={`/for-men/${category.slug}`}
                    className="mt-4 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
                  >
                    Explore Category
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-7">
            <ButtonLink href={homePage.categoriesSection.buttonHref} variant="secondary">
              {homePage.categoriesSection.buttonLabel}
            </ButtonLink>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <SectionHeading
            eyebrow={homePage.brandsSection.eyebrow}
            title={homePage.brandsSection.title}
            description={homePage.brandsSection.description}
          />

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featuredBrands.slice(0, 12).map((brand) => (
              <Link
                href={`/collection-brand/${brand.slug}`}
                key={brand.slug}
                className="group overflow-hidden rounded-3xl border border-ink/10 bg-ivory transition-all hover:-translate-y-1 hover:border-gold"
              >
                <div className="relative aspect-square">
                  <Image
                    src={brand.image}
                    alt={`${brand.name} designer collection`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/28 to-ink/10" />
                  <div className="absolute inset-0 p-5 sm:p-6">
                    <div className="relative h-full w-full">
                      <Image
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain opacity-78 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                      />
                    </div>
                  </div>
                  <div className="absolute right-3 bottom-3 left-3">
                    <p className="text-center text-[0.65rem] font-semibold tracking-[0.12em] text-ivory uppercase sm:text-[0.7rem]">
                      {brand.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {homePage.brandsSection.buttons.map((button, index) => (
              <ButtonLink key={button.href} href={button.href} variant={index === 0 ? "teal" : "secondary"}>
                {button.label}
              </ButtonLink>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="ink">
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <Badge
              variant="gold"
              className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.12em] text-ink shadow-[0_8px_22px_-12px_rgba(0,0,0,0.9)] sm:text-xs"
            >
              {homePage.appointmentPriority.badge}
            </Badge>
            <h2 className="mt-4 font-heading text-4xl text-ivory sm:text-5xl">{homePage.appointmentPriority.title}</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-ivory/82">
              {homePage.appointmentPriority.description}
            </p>
            <div className="mt-7">
              <ButtonLink href={homePage.appointmentPriority.buttonHref} variant="teal" size="lg">
                {homePage.appointmentPriority.buttonLabel}
              </ButtonLink>
            </div>
          </div>

          <Card className="bg-ivory text-ink">
            <CardContent>
              <h3 className="font-heading text-2xl sm:text-3xl">{homePage.appointmentPriority.testimonialHeading}</h3>
              <p className="mt-3 text-sm leading-7 text-smoke">
                “{testimonials[0]?.quote || "Excellent service and fit guidance."}”
              </p>
              <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                {testimonials[0]?.name || "Verified Client"}
              </p>
              <Link
                href="/reviews"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold"
              >
                Read More Reviews <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <SectionHeading
            eyebrow={homePage.locationsSection.eyebrow}
            title={homePage.locationsSection.title}
            description={homePage.locationsSection.description}
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {locations.map((location) => (
              <Card key={location.slug} className="h-full">
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">{location.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-smoke">{location.address}</p>
                  <LocationOpenBadge location={location} />
                  <div className="mt-5 flex flex-wrap gap-2">
                    <ButtonLink href={`/location/${location.slug}`} variant="secondary" size="sm">
                      Location Details
                    </ButtonLink>
                    <ButtonLink href="/schedule-appointment" size="sm">
                      Book This Store
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <SectionHeading
            eyebrow={homePage.journalSection.eyebrow}
            title={homePage.journalSection.title}
            description={homePage.journalSection.description}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
