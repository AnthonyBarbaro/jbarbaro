import { Sparkles, Store } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shop Coming Soon",
  description:
    "Our online shop is launching soon. In the meantime, schedule a styling appointment or browse in-store collections.",
  path: "/shop-coming-soon",
});

export default function ShopComingSoonPage() {
  return (
    <>
      <PageHero
        title="Online Shop Launching Soon"
        description="Our digital storefront is being crafted for a luxury shopping experience. Until then, we offer concierge-level in-store styling."
      />

      <WaveSection topWave="A" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent>
                <Badge variant="gold">What&apos;s Coming</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Premium Digital Shopping</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-smoke">
                  <li>Curated designer collection pages</li>
                  <li>Lookbook-driven product storytelling</li>
                  <li>Seamless checkout and gifting flows</li>
                </ul>
              </CardContent>
            </Card>
            <Card tone="stone">
              <CardContent>
                <h2 className="font-heading text-2xl text-ink sm:text-3xl">Shop the Experience Today</h2>
                <p className="mt-3 text-sm leading-7 text-smoke">
                  Visit a store or book an appointment to receive guided recommendations before ecommerce launch.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                    Book an Appointment
                  </ButtonLink>
                  <ButtonLink href="/for-men" variant="secondary" className="w-full sm:w-auto">
                    Explore Collections
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-start gap-3">
                <Store className="h-6 w-6 text-deep-teal" />
                <div>
                  <h3 className="font-heading text-2xl text-ink sm:text-3xl">In-Store Curation</h3>
                  <p className="mt-2 text-sm text-smoke">Try on, compare fits, and leave with a complete look the same day.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3">
                <Sparkles className="h-6 w-6 text-deep-teal" />
                <div>
                  <h3 className="font-heading text-2xl text-ink sm:text-3xl">Personalized Styling</h3>
                  <p className="mt-2 text-sm text-smoke">We pre-select styles based on your measurements, goals, and calendar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
