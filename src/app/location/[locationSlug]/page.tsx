import { notFound } from "next/navigation";

import { SeoJsonLd } from "@/components/SeoJsonLd";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { ShowroomGallery } from "@/components/locations/ShowroomGallery";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locationMap, locations } from "@/data/locations";
import { partridgeCreekShowroomPhotos } from "@/data/showroom-gallery";
import { aggregateRating } from "@/data/testimonials";
import { buildMetadata } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { formatPhone } from "@/lib/utils";

export function generateStaticParams() {
  return locations.map((location) => ({ locationSlug: location.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locationSlug: string }> }) {
  const { locationSlug } = await params;
  const location = locationMap[locationSlug];

  if (!location) {
    return {};
  }

  return buildMetadata({
    title: `${location.name} Location`,
    description: `${location.brand} at ${location.name}. Address, hours, phone, and appointment scheduling information.`,
    path: `/location/${location.slug}`,
  });
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ locationSlug: string }>;
}) {
  const { locationSlug } = await params;
  const location = locationMap[locationSlug];

  if (!location) {
    notFound();
  }

  const isPartridgeCreek = location.slug === "partridge-creek";
  const breadcrumbData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
    { name: location.name, path: `/location/${location.slug}` },
  ]);

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: `${location.brand} - ${location.name}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressCountry: "US",
    },
    telephone: location.phone,
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
  };

  return (
    <>
      <SeoJsonLd data={[breadcrumbData, localBusinessJsonLd]} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Locations", href: "/locations" },
          { name: location.name, href: `/location/${location.slug}` },
        ]}
      />

      <PageHero
        title={location.name}
        description={`${location.brand} at ${location.address}`}
        ctaHref="/schedule-appointment"
        ctaLabel="Book This Location"
      />

      {isPartridgeCreek ? (
        <WaveSection topWave="B" background="stone">
          <Container>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
                  Inside the Showroom
                </p>
                <h2 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">
                  Visit us at Partridge Creek.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
                  Explore tailored clothing, sportswear, shirts, denim, footwear, and accessories in
                  a relaxed setting with expert help close by.
                </p>
              </div>
              <ButtonLink
                href="/schedule-appointment"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Plan Your Visit
              </ButtonLink>
            </div>

            <ShowroomGallery photos={partridgeCreekShowroomPhotos} className="mt-8" />
          </Container>
        </WaveSection>
      ) : null}

      <WaveSection topWave="B" bottomWave="C" background="ivory">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
            <Card>
              <CardContent>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Store Details</h2>
                <p className="mt-3 text-sm leading-7 text-smoke">{location.address}</p>
                <a
                  href={formatPhone(location.phone)}
                  className="mt-2 inline-flex text-sm font-semibold text-deep-teal hover:text-ink"
                >
                  {location.phone}
                </a>
                <LocationOpenBadge location={location} />

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
                  <ButtonLink href="/schedule-appointment" size="sm" className="w-full sm:w-auto">
                    Schedule Appointment
                  </ButtonLink>
                  <ButtonLink
                    href={`https://maps.google.com/?q=${encodeURIComponent(location.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Directions
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <iframe
                title={`${location.name} map`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01}%2C${location.latitude - 0.01}%2C${location.longitude + 0.01}%2C${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
                className="h-[340px] w-full border-0 sm:h-[430px]"
                loading="lazy"
              />
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
