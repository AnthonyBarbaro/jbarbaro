import { CheckCircle2, Download } from "lucide-react";

import { WeddingRegistrationForm } from "@/components/tuxedos/WeddingRegistrationForm";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { buildMetadata } from "@/lib/seo";

const rentalCatalogPdf =
  "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_rental_final.pdf";
const accessoryCatalogPdf =
  "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_accessory_final.pdf";

export const metadata = buildMetadata({
  title: "Register Your Wedding",
  description:
    "Register your wedding party with J. Barbaro Clothiers for tuxedo and suit rentals, fittings, and formal accessory coordination.",
  path: "/register-your-wedding",
});

export default function RegisterWeddingPage() {
  return (
    <>
      <PageHero
        title="Register Your Wedding"
        description="Tell us your date, party size, and contact details. Our formalwear team will coordinate tuxedo/suit rental and purchase options for your full wedding party."
        ctaHref="/suit-tuxedo-rentals"
        ctaLabel="Browse Tuxedo Catalogs"
      />

      <WaveSection topWave="A" bottomWave="C" background="stone">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-4">
              <Card tone="stone">
                <CardContent>
                  <Badge variant="teal">Wedding Party Intake</Badge>
                  <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Secure Your Wedding Style Timeline Early</h2>
                  <p className="mt-3 text-sm leading-7 text-smoke">
                    Early registration gives your party more flexibility for fittings, style selections, and coordinated accessory matching.
                  </p>
                </CardContent>
              </Card>

              <WeddingRegistrationForm locations={locations} />
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardContent>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">What Happens Next</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-smoke">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-deep-teal" />
                      We contact you to confirm wedding details and timeline.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-deep-teal" />
                      We align your preferred showroom and fitting strategy.
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-1 h-4 w-4 text-deep-teal" />
                      We help finalize tuxedo/suit styles and accessories.
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card tone="ink">
                <CardContent>
                  <h2 className="font-heading text-2xl sm:text-3xl">Download Catalogs</h2>
                  <p className="mt-3 text-sm leading-7 text-ivory/82">
                    Review formalwear and accessories before your consultation.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink
                      href={rentalCatalogPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="teal"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <span className="mr-2 inline-flex"><Download className="h-4 w-4" /></span>
                      Rental PDF
                    </ButtonLink>
                    <ButtonLink
                      href={accessoryCatalogPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="secondary"
                      size="sm"
                      className="w-full border-ivory/80 text-ivory hover:border-gold hover:text-gold sm:w-auto"
                    >
                      <span className="mr-2 inline-flex"><Download className="h-4 w-4" /></span>
                      Accessory PDF
                    </ButtonLink>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
