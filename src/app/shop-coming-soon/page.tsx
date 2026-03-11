import { Sparkles, Store } from "lucide-react";

import { ShopifyReadinessPanel } from "@/components/shop/ShopifyReadinessPanel";
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
    "Our online shop is launching soon with Shopify powering a custom storefront, cart, and checkout handoff.",
  path: "/shop-coming-soon",
});

export default function ShopComingSoonPage() {
  return (
    <>
      <PageHero
        title="Online Shop in Active Build"
        description="We&apos;re preparing a headless Shopify storefront so the online experience can match the same tailored service found in-store."
      />

      <WaveSection topWave="A" background="ivory">
        <Container>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent>
                <Badge variant="teal">Shopify Rollout</Badge>
                <h2 className="mt-4 font-heading text-3xl text-ink sm:text-4xl">Custom Storefront, Not a Template Shop</h2>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-smoke">
                  <li>Shopify-powered product and inventory backend</li>
                  <li>Custom cart page and branded front-end flow on this site</li>
                  <li>Secure checkout handoff to Shopify when customers are ready to purchase</li>
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
                  <ButtonLink href="/shop" variant="teal" className="w-full sm:w-auto">
                    Preview Live Shopify Catalog
                  </ButtonLink>
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

          <div className="mt-8">
            <ShopifyReadinessPanel />
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
                  <h3 className="font-heading text-2xl text-ink sm:text-3xl">Luxury Commerce, Tailored</h3>
                  <p className="mt-2 text-sm text-smoke">The plan is curated online product storytelling without giving up a premium fit-and-style experience.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
