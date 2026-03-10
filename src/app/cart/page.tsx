import { ShoppingBag, UserRoundCheck } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cart",
  description: "Cart functionality will be enabled in a future ecommerce release.",
  path: "/cart",
});

export default function CartPlaceholderPage() {
  return (
    <>
      <PageHero
        title="Cart Experience Coming Soon"
        description="Our full ecommerce checkout is in progress. Meanwhile, get a concierge-level purchase experience in-store."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="flex items-start gap-3">
                <ShoppingBag className="h-6 w-6 text-deep-teal" />
                <div>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Pre-Commerce Mode</h2>
                  <p className="mt-2 text-sm leading-7 text-smoke">
                    Product checkout is not live yet, but all collection discovery and appointment services are active.
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card tone="stone">
              <CardContent className="flex items-start gap-3">
                <UserRoundCheck className="h-6 w-6 text-deep-teal" />
                <div>
                  <h2 className="font-heading text-2xl text-ink sm:text-3xl">Get a Personalized Pull List</h2>
                  <p className="mt-2 text-sm leading-7 text-smoke">
                    Book an appointment and we&apos;ll prepare styles in your size before you arrive.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <ButtonLink href="/schedule-appointment" className="w-full sm:w-auto">
                      Book Appointment
                    </ButtonLink>
                    <ButtonLink href="/for-men" variant="secondary" className="w-full sm:w-auto">
                      Browse Collections
                    </ButtonLink>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
