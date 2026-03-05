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
import { heroSlides } from "@/data/home";
import { locations } from "@/data/locations";
import { menCategories } from "@/data/men-categories";
import { aggregateRating, testimonials } from "@/data/testimonials";
import { getFeaturedPosts } from "@/lib/content";
import { SITE_NAME } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: `${SITE_NAME} | Classic Tailoring & Luxury Menswear`,
  description:
    "Classic tailoring, designer menswear, and personal styling at J. Barbaro Clothiers. Book a one-on-one appointment in Metro Detroit.",
  path: "/",
  image: heroSlides[2].image,
});

const tailorProcess = [
  {
    title: "Consultation",
    copy: "We begin with your lifestyle, event calendar, and fit preferences.",
    icon: ShieldCheck,
  },
  {
    title: "Measurement",
    copy: "Precise body mapping ensures structure, balance, and comfort.",
    icon: Ruler,
  },
  {
    title: "Refinement",
    copy: "Tailoring and finishing details deliver a polished final silhouette.",
    icon: Scissors,
  },
];

export default function HomePage() {
  const featuredPosts = getFeaturedPosts(3);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  };

  return (
    <>
      <SeoJsonLd data={websiteJsonLd} />

      <section className="relative min-h-[70svh] overflow-hidden bg-ink text-ivory sm:min-h-[82svh]">
        <Image
          src={heroSlides[2].image}
          alt="Tailored menswear at J. Barbaro Clothiers"
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
              <Badge
                variant="gold"
                className="border-gold/95 bg-gold px-4 py-1.5 text-[0.72rem] font-bold tracking-[0.12em] text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.85)] sm:text-xs"
              >
                J. Barbaro Clothiers
              </Badge>
              <span className="rounded-full border border-ivory/70 bg-ink/70 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.11em] text-ivory uppercase backdrop-blur-sm sm:text-[11px]">
                Clinton Township
              </span>
              <span className="rounded-full border border-ivory/70 bg-ink/70 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.11em] text-ivory uppercase backdrop-blur-sm sm:text-[11px]">
                Auburn Hills
              </span>
            </div>
            <h1 className="mt-5 text-balance font-heading text-3xl leading-tight sm:mt-6 sm:text-6xl lg:text-7xl">
              Classic Tailoring for the Modern Gentleman
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[0.98rem] leading-7 text-ivory/86 sm:mt-5 sm:text-lg sm:leading-8">
              An appointment-first menswear experience focused on precision fit, premium designer labels, and exceptional personal service.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/schedule-appointment" size="lg" className="w-full sm:w-auto">
                Book an Appointment
              </ButtonLink>
              <ButtonLink
                href="/shop-coming-soon"
                variant="secondary"
                size="lg"
                className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto"
              >
                Shop Online
              </ButtonLink>
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
              <a
                href="https://www.facebook.com/barbaroclothiers/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold"
              >
                4,033 Facebook likes
              </a>
            </div>
          </div>
        </Container>
      </section>

      <WaveSection topWave="A" bottomWave="C" background="ivory">
        <Container>
          <SectionHeading
            eyebrow="The Tailor’s Method"
            title="A Proven Process for Elevated Fit"
            description="Every appointment is intentionally structured so you leave with confidence, clarity, and garments that move with you."
            align="center"
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {tailorProcess.map((item) => (
              <Card key={item.title} tone="stone" className="h-full">
                <CardContent>
                  <item.icon className="h-6 w-6 text-deep-teal" />
                  <h2 className="mt-4 font-heading text-2xl text-ink sm:text-3xl">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{item.copy}</p>
                </CardContent>
              </Card>
            ))}
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
                  Retail + Ecommerce
                </Badge>
                <h2 className="mt-4 font-heading text-3xl sm:text-5xl">Shop In-Store Today. Shop Online Next.</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-ivory/84 sm:text-base sm:leading-8">
                  We are building a full online store experience with premium product pages, concierge checkout support, and curated seasonal drops.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/shop-coming-soon" variant="teal" className="w-full sm:w-auto">
                  Explore Online Shop
                </ButtonLink>
                <ButtonLink href="/sale-coming-soon" variant="secondary" className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto">
                  View Sale Preview
                </ButtonLink>
                <ButtonLink href="/suit-tuxedo-rentals" variant="secondary" className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto">
                  Tuxedo Catalogs
                </ButtonLink>
              </div>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="stone">
        <Container>
          <SectionHeading
            eyebrow="Shop by Category"
            title="Refined Menswear, Curated by Need"
            description="Start with the category that fits your immediate goal, then book an appointment for expert recommendations."
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
            <ButtonLink href="/for-men" variant="secondary">
              View All Categories
            </ButtonLink>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <SectionHeading
            eyebrow="Featured Designers"
            title="Luxury Labels We Trust"
            description="Explore our featured designer lineup and discover the labels defining the season."
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
            <ButtonLink href="/designers/featured-designers" variant="teal">
              View Featured Designers
            </ButtonLink>
            <ButtonLink href="/designers/all-designer-brands" variant="secondary">
              Browse All Designers
            </ButtonLink>
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
              Appointment Priority
            </Badge>
            <h2 className="mt-4 font-heading text-4xl text-ivory sm:text-5xl">Bring Your Vision. We’ll Handle the Fit.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-ivory/82">
              The fastest way to build a wardrobe you actually wear is a focused appointment. We prepare options in your size, discuss your goals, and deliver a polished final fit.
            </p>
            <div className="mt-7">
              <ButtonLink href="/schedule-appointment" variant="teal" size="lg">
                Reserve Appointment
              </ButtonLink>
            </div>
          </div>

          <Card className="bg-ivory text-ink">
            <CardContent>
              <h3 className="font-heading text-2xl sm:text-3xl">Client Feedback</h3>
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
            eyebrow="Visit In Person"
            title="Two Locations. One Consistent Standard."
            description="Choose the store that is most convenient and book ahead for a prepared fitting session."
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
            eyebrow="Journal"
            title="Style Guidance from the Floor"
            description="Editorial insights on fit, tailoring, and seasonal wardrobe planning."
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
