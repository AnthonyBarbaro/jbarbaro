import Image from "next/image";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { aggregateRating } from "@/data/testimonials";
import { buildGoogleMapsEmbedUrl } from "@/lib/maps";
import { buildMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Store Locations",
  description:
    "Visit J. Barbaro Clothiers at The Mall at Partridge Creek and Great Lakes Crossing Outlet in Metro Detroit.",
  path: "/locations",
});

export default function LocationsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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
    image: location.photo,
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
    url: `${baseUrl}/location/${location.slug}`,
  }));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "J. Barbaro Clothiers Locations",
    itemListElement: locations.map((location, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: location.name,
      url: `${baseUrl}/location/${location.slug}`,
    })),
  };

  return (
    <>
      <SeoJsonLd data={[itemListSchema, ...locationSchemas]} />
      <PageHero
        title="Our Locations"
        description="Visit either Metro Detroit store location for personalized menswear service, tailoring, and formalwear guidance."
        ctaHref="/schedule-appointment"
        ctaLabel="Book Store Appointment"
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-5 lg:grid-cols-2">
            {locations.map((location) => (
              <Card key={location.slug} className="h-full overflow-hidden">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={location.photo}
                    alt={`${location.name} storefront`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                  <div className="absolute right-3 bottom-3 left-3">
                    <p className="rounded-xl border border-white/30 bg-white/88 px-3 py-2 text-center text-xs font-semibold tracking-[0.12em] text-ink uppercase backdrop-blur-sm">
                      {location.brand}
                    </p>
                  </div>
                </div>

                <CardContent>
                  <h2 className="font-heading text-3xl text-ink sm:text-4xl">{location.name}</h2>
                  <p className="mt-2 text-sm leading-7 text-smoke">{location.address}</p>

                  <div className="mt-4 rounded-2xl border border-ink/10 bg-stone/35 p-3">
                    <a href={formatPhone(location.phone)} className="inline-flex text-sm font-semibold text-deep-teal hover:text-gold">
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
                        <span className="font-semibold text-ink">{interval.days}:</span> {interval.open} - {interval.close}
                      </p>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-smoke">{location.note}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink href={`/location/${location.slug}`} variant="secondary" size="sm" className="w-full sm:w-auto">
                      View Details
                    </ButtonLink>
                    <ButtonLink href="/schedule-appointment" size="sm" className="w-full sm:w-auto">
                      Book Visit
                    </ButtonLink>
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
                    className="mt-4 inline-flex text-xs font-semibold tracking-[0.12em] text-deep-teal uppercase hover:text-gold"
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
                Store Visit Strategy
              </Badge>
              <h2 className="mt-4 font-heading text-3xl sm:text-4xl">Plan the Right Store Visit</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-ivory/82">
                Book ahead and our team will prepare selections in your size for tailored clothing, designer labels,
                and event-ready formalwear.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                  Schedule Appointment
                </ButtonLink>
                <ButtonLink href="/suit-tuxedo-rentals" variant="secondary" className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto">
                  Explore Tuxedos
                </ButtonLink>
              </div>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
