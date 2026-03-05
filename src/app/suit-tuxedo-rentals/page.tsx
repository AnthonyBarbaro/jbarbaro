import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

const tuxedoHeroImage = "/images/remote/www.barbaroformalwear.com/wp-content/uploads/2024/02/h3lg.jpg";

const catalogs = [
  {
    id: "rentals",
    title: "Tuxedo & Suit Rental Catalog",
    description: "Explore rental-ready wedding and formalwear styles for grooms, groomsmen, and black-tie events.",
    href: "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_rental_final.pdf",
  },
  {
    id: "accessories",
    title: "Formal Accessory Catalog",
    description: "Coordinate ties, bow ties, pocket squares, and finishing details for a complete formal look.",
    href: "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_accessory_final.pdf",
  },
];

export const metadata = buildMetadata({
  title: "Wedding Suits & Tuxedos",
  description:
    "Explore tuxedo and wedding suit rentals or purchases at J. Barbaro Clothiers. View catalogs and register your wedding party.",
  path: "/suit-tuxedo-rentals",
  image: tuxedoHeroImage,
});

export default function SuitTuxedoRentalsPage() {
  return (
    <>
      <section className="relative min-h-[64svh] overflow-hidden bg-ink text-ivory sm:min-h-[72svh]">
        <Image
          src={tuxedoHeroImage}
          alt="Wedding suits and tuxedos at J. Barbaro Clothiers"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.84)_0%,rgba(0,0,0,0.25)_68%)]" />
        <Container className="relative z-10 flex min-h-[64svh] items-end py-12 sm:min-h-[72svh] sm:items-center sm:py-14">
          <div className="max-w-3xl">
            <Badge
              variant="gold"
              className="border-gold/95 bg-gold px-3.5 py-1.5 text-[0.72rem] font-bold tracking-[0.13em] text-ink shadow-[0_10px_26px_-16px_rgba(0,0,0,0.9)] sm:text-xs"
            >
              Wedding Suits & Tuxedos
            </Badge>
            <h1 className="mt-4 text-balance font-heading text-4xl leading-tight sm:text-6xl">
              Rent or Purchase a Formal Look That Fits Perfectly
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-[0.98rem] leading-7 text-ivory/88 sm:text-lg sm:leading-8">
              Build your wedding party style with expert fit guidance, coordinated accessories, and a polished final presentation.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/register-your-wedding" size="lg" className="w-full sm:w-auto">
                Register Your Wedding
              </ButtonLink>
              <ButtonLink href="/schedule-appointment" variant="secondary" size="lg" className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto">
                Book Formalwear Appointment
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            {catalogs.map((catalog) => (
              <Card key={catalog.id} className="h-full">
                <CardContent>
                  <Badge variant="teal">Catalog</Badge>
                  <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">{catalog.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">{catalog.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink
                      href={catalog.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      className="w-full sm:w-auto"
                    >
                      <span className="mr-2 inline-flex"><ExternalLink className="h-4 w-4" /></span>
                      Open Catalog
                    </ButtonLink>
                    <ButtonLink
                      href={catalog.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="teal"
                      className="w-full sm:w-auto"
                    >
                      <span className="mr-2 inline-flex"><Download className="h-4 w-4" /></span>
                      Download PDF
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="C" bottomWave="A" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="h-[380px]">
                <iframe
                  title="Tuxedo and suit rental catalog preview"
                  src={`${catalogs[0].href}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </Card>
            <Card className="overflow-hidden">
              <div className="h-[380px]">
                <iframe
                  title="Formal accessory catalog preview"
                  src={`${catalogs[1].href}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </Card>
          </div>
        </Container>
      </WaveSection>

      <WaveSection topWave="A" background="ink">
        <Container className="grid gap-4 lg:grid-cols-3">
          <Card className="bg-ivory text-ink">
            <CardContent>
              <Users className="h-6 w-6 text-deep-teal" />
              <h2 className="mt-4 font-heading text-2xl sm:text-3xl">Wedding Party Coordination</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Keep every groomsman aligned with a consistent style direction and sizing process.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-ivory text-ink">
            <CardContent>
              <Sparkles className="h-6 w-6 text-deep-teal" />
              <h2 className="mt-4 font-heading text-2xl sm:text-3xl">Luxury Fit Standards</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We focus on clean silhouette, event-appropriate styling, and final-detail polish.
              </p>
            </CardContent>
          </Card>
          <Card className="bg-ivory text-ink">
            <CardContent>
              <h2 className="font-heading text-2xl sm:text-3xl">Ready to Start?</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Register your wedding party today and our team will follow up with the next steps.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/register-your-wedding" className="w-full sm:w-auto">
                  Register Wedding
                </ButtonLink>
                <ButtonLink href="/shop-coming-soon" variant="secondary" className="w-full sm:w-auto">
                  Shop Online Preview
                </ButtonLink>
              </div>
              <Link href="/register-your-wedding" className="mt-4 inline-flex text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase hover:text-gold">
                Go to Registration →
              </Link>
            </CardContent>
          </Card>
        </Container>
      </WaveSection>
    </>
  );
}
