import { ShoppingBag, UserRoundCheck } from "lucide-react";

import { ShopifyCartClient } from "@/components/shop/ShopifyCartClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { getShopifyConfigStatus } from "@/lib/shopify/config";

export const metadata = buildMetadata({
  title: "Cart",
  description: "Shopping bag with live totals and secure checkout.",
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
              <h1 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">Shopping Bag</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-smoke">
                {status.configured
                  ? "Selected pieces, live totals, and a clean transition into secure checkout."
                  : "Online checkout is temporarily unavailable. You can still browse the shop or book an appointment for a prepared fitting."}
              </p>
            </div>
            <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
              Continue Shopping
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
                    <h2 className="font-heading text-2xl text-ink sm:text-3xl">Keep Shopping</h2>
                    <p className="mt-2 text-sm leading-7 text-smoke">
                      Explore current arrivals, category pages, and seasonal favorites while we finish refreshing bag access.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <ButtonLink href="/shop" className="w-full sm:w-auto">
                        Browse the Shop
                      </ButtonLink>
                      <ButtonLink href="/for-men" variant="secondary" className="w-full sm:w-auto">
                        Shop by Category
                      </ButtonLink>
                    </div>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        )}
      </section>
    </>
  );
}
