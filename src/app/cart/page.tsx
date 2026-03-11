import { ShoppingBag, UserRoundCheck } from "lucide-react";

import { ShopifyCartClient } from "@/components/shop/ShopifyCartClient";
import { ShopifyReadinessPanel } from "@/components/shop/ShopifyReadinessPanel";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { getShopifyConfigStatus } from "@/lib/shopify/config";

export const metadata = buildMetadata({
  title: "Cart",
  description: "Traditional shopping bag page with live Shopify cart updates and checkout handoff.",
  path: "/cart",
});

export default function CartPlaceholderPage() {
  const status = getShopifyConfigStatus();
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Shopping Bag", href: "/cart" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <section className="border-b border-ink/10 bg-ivory">
        <Container className="py-8 sm:py-10 lg:py-12">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Cart</p>
              <h1 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">
                {status.configured ? "Shopping Bag" : "Cart Experience in Build"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">
                {status.configured
                  ? "Selected pieces, live totals, and a clean transition into secure checkout."
                  : "We&apos;re preparing a traditional shopping bag flow on this site with Shopify handling the commerce layer and checkout."}
              </p>
            </div>
            <ButtonLink href={status.configured ? "/shop" : "/for-men"} variant="secondary" className="w-full sm:w-auto">
              {status.configured ? "Continue Shopping" : "Browse Collections"}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-stone/45 py-8 sm:py-10 lg:py-12">
        {status.configured ? (
          <ShopifyCartClient />
        ) : (
          <Container>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardContent className="flex items-start gap-3">
                  <ShoppingBag className="h-6 w-6 text-deep-teal" />
                  <div>
                    <h2 className="font-heading text-2xl text-ink sm:text-3xl">Headless Cart Foundation</h2>
                    <p className="mt-2 text-sm leading-7 text-smoke">
                      Cart session handling, Shopify checkout handoff, and Storefront API plumbing are now the active workstream.
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
                      While online commerce is being wired up, book an appointment and we&apos;ll prepare styles in your size before you
                      arrive.
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

            <div className="mt-8">
              <ShopifyReadinessPanel />
            </div>
          </Container>
        )}
      </section>
    </>
  );
}
