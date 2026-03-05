import { ContactForm } from "@/components/contact/ContactForm";
import { LocationOpenBadge } from "@/components/locations/LocationOpenBadge";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { buildGoogleMapsEmbedUrl } from "@/lib/maps";
import { buildMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Contact J. Barbaro Clothiers for appointments, gift cards, tailoring questions, and menswear support.",
  path: "/contact-us",
});

export default function ContactUsPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        description="Questions, gift cards, or fit support. Send a message or choose a location below."
        ctaHref="/schedule-appointment"
        ctaLabel="Book Appointment Instead"
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
            <div className="space-y-4">
              <Card tone="stone">
                <CardContent>
                  <Badge variant="teal">Client Support</Badge>
                  <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Send Us a Message</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">
                    We typically respond quickly. For immediate styling help, booking an appointment is the fastest option.
                  </p>
                </CardContent>
              </Card>

              <ContactForm />
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              {locations.map((location) => (
                <Card key={location.slug} className="overflow-hidden">
                  <div className="relative h-44 w-full border-b border-ink/10 bg-stone/40 sm:h-52">
                    <iframe
                      title={`${location.name} Google map`}
                      src={buildGoogleMapsEmbedUrl({
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                      })}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-full w-full border-0"
                    />
                  </div>

                  <CardContent>
                    <h2 className="font-heading text-2xl text-ink sm:text-3xl">{location.name}</h2>
                    <p className="mt-2 text-sm leading-7 text-smoke">{location.address}</p>

                    <a href={formatPhone(location.phone)} className="mt-2 inline-flex text-sm font-semibold text-deep-teal hover:text-gold">
                      {location.phone}
                    </a>

                    <LocationOpenBadge location={location} />

                    <div className="mt-4 rounded-2xl border border-ink/10 bg-stone/35 p-3 text-sm text-smoke">
                      {location.hours.map((interval) => (
                        <p key={`${location.slug}-${interval.days}`}>
                          <span className="font-semibold text-ink">{interval.days}:</span> {interval.open} - {interval.close}
                        </p>
                      ))}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <ButtonLink href={`/location/${location.slug}`} variant="secondary" size="sm" className="w-full sm:w-auto">
                        View Location
                      </ButtonLink>
                      <ButtonLink
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="teal"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Open in Google Maps
                      </ButtonLink>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card tone="ink">
                <CardContent>
                  <h2 className="font-heading text-2xl sm:text-3xl">Need a Faster Response?</h2>
                  <p className="mt-3 text-sm leading-7 text-ivory/82">
                    Scheduling an appointment is the fastest way to get personalized service and product recommendations.
                  </p>
                  <ButtonLink href="/schedule-appointment" variant="teal" className="mt-5 w-full sm:w-auto">
                    Schedule Appointment
                  </ButtonLink>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
