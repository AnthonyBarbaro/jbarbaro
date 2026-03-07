import { Clock3, Tag } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Sale Coming Soon",
  description:
    "Upcoming sale events and limited-time offers from J. Barbaro Clothiers will be published here soon.",
  path: "/sale-coming-soon",
});

export default function SaleComingSoonPage() {
  return (
    <>
      <PageHero
        title="Seasonal Sale Events Coming Soon"
        description="Private markdown events and curated sale edits are launching soon. Book now for first-access styling support."
      />

      <WaveSection topWave="B" background="stone">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent>
                <Badge variant="gold">Upcoming</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">What to Expect</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-smoke">
                  <li>Limited-time markdown collections</li>
                  <li>Designer-specific sale capsules</li>
                  <li>Early appointment-based access windows</li>
                </ul>
              </CardContent>
            </Card>
            <Card tone="stone">
              <CardContent>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Reserve Priority Access</h2>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Book a consultation now so our team can notify and prepare options aligned with your size and preferences.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                    Book Appointment
                  </ButtonLink>
                  <ButtonLink href="/contact-us" variant="secondary" className="w-full sm:w-auto">
                    Contact Team
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-start gap-3">
                <Tag className="h-6 w-6 text-deep-teal" />
                <p className="text-sm leading-7 text-smoke">Curated markdowns focused on wardrobe staples and premium designer essentials.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3">
                <Clock3 className="h-6 w-6 text-deep-teal" />
                <p className="text-sm leading-7 text-smoke">Time-sensitive release windows announced on this page and through in-store communication.</p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
