import Image from "next/image";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { appointmentLocationMap, locations } from "@/data/locations";
import { aggregateRating } from "@/data/testimonials";
import { buildGoogleMapsEmbedUrl } from "@/lib/maps";
import { SITE_URL } from "@/lib/constants";
import { pageContent } from "@/lib/site-content";
import { buildMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/utils";

const { locationsPage } = pageContent;

export const metadata = buildMetadata({
  title: locationsPage.metaTitle,
  description: locationsPage.metaDescription,
  path: "/locations",
});

export default function LocationsPage() {
  const locationSchemas = locations.map((location) => ({
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: `${location.brand} - ${location.name}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressCountry: "US",
    },
    telephone: location.phone,
    image: location.photoLabel === "Storefront" ? location.photo : undefined,
    geo: {
      "@type": "GeoCoordinates",
      latitude: location.latitude,
      longitude: location.longitude,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
    },
    url: `${SITE_URL}/location/${location.slug}`,
  }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "J. Barbaro Clothiers Locations",
    itemListElement: locations.map((location, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: location.name,
      url: `${SITE_URL}/location/${location.slug}`,
    })),
  };

  return (
    <>
      <SeoJsonLd data={[itemListSchema, ...locationSchemas]} />
      <PageHero
        title={locationsPage.hero.title}
        description={locationsPage.hero.description}
        ctaHref={locationsPage.hero.ctaPrimary.href}
        ctaLabel={locationsPage.hero.ctaPrimary.label}
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-5 lg:grid-cols-2">
            {locations.map((location, index) => (
              <Card key={location.slug} className="h-full overflow-hidden">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={location.photo}
                    alt={location.photoAlt}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                  <div className="absolute right-3 bottom-3 left-3">
                    <p className="rounded-xl border border-white/30 bg-white/88 px-3 py-2 text-center text-xs font-semibold tracking-[0.12em] text-ink uppercase backdrop-blur-sm">
                      {location.photoLabel}
                    </p>
                  </div>
                </div>

                <CardContent>
                  <h2 className="font-heading text-3xl text-ink sm:text-4xl">{location.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-smoke">{location.address}</p>

                  <div className="mt-4 rounded-2xl border border-ink/10 bg-stone/35 p-3">
                    <a
                      href={formatPhone(location.phone)}
                      className="inline-flex text-sm font-semibold text-deep-teal hover:text-ink"
                    >
                      {location.phone}
                    </a>
                    <div className="mt-3 border-t border-ink/10 pt-3">
                      <LocationOpenBadge location={location} />
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-ink/10 bg-stone/35">
                    <iframe
                      title={`${location.name} map`}
                      src={buildGoogleMapsEmbedUrl({
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      })}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-52 w-full border-0"
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-ink/10 bg-stone/40 p-3 text-sm text-smoke">
                    {location.hours.map((interval) => (
                      <p key={`${location.slug}-${interval.days}`}>
                        <span className="font-semibold text-ink">{interval.days}:</span>{" "}
                        {interval.open} - {interval.close}
                      </p>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-smoke">{location.note}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink
                      href={`/location/${location.slug}`}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      View Details
                    </ButtonLink>
                    {appointmentLocationMap[location.slug] ? (
                      <ButtonLink
                        href="/schedule-appointment"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Book Visit
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        href={formatPhone(location.phone)}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Call Store
                      </ButtonLink>
                    )}
                    <ButtonLink
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="teal"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Get Directions
                    </ButtonLink>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase hover:text-ink"
                  >
                    View Map in Google →
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" background="ivory">
        <Container>
          <Card className="bg-ink text-ivory">
            <CardContent>
              <Badge
                variant="gold"
                className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.13em] text-ink shadow-[0_10px_26px_-16px_rgba(0,0,0,0.9)]"
              >
                {locationsPage.closingBadge}
              </Badge>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl">
                {locationsPage.closingTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/82">
                {locationsPage.closingDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {locationsPage.closingButtons.map((button, index) => (
                  <ButtonLink
                    key={button.href}
                    href={button.href}
                    variant={index === 0 ? "primary" : "secondary"}
                    className={`w-full sm:w-auto ${index === 0 ? "" : "!border-ivory/70 bg-transparent text-ivory hover:!border-gold hover:bg-transparent hover:text-gold"}`}
                  >
                    {button.label}
                  </ButtonLink>
                ))}
              </div>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
