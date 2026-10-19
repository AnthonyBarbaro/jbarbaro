import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description:
    "Terms governing shopping, checkout, and submitted requests on the J. Barbaro Clothiers website.",
  path: "/terms-of-use",
});

export default function TermsOfUsePage() {
  return (
    <>
      <PageHero
        title="Terms of Use"
        description="Terms and conditions for accessing and using this website."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Use of Site</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                This site lets you browse products, shop through Shopify checkout, and contact our
                team about appointments and services. You agree not to misuse forms, submit harmful
                content, or attempt unauthorized access.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Shopping & Checkout</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Review your selected products, sizes, quantities, and gift wrap before continuing to
                Shopify checkout. Available delivery methods, shipping charges, applicable taxes,
                and the final total are shown at checkout before you place your order.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                See our{" "}
                <Link
                  href="/shipping-returns"
                  className="text-deep-teal underline underline-offset-4"
                >
                  shipping and returns information
                </Link>{" "}
                or contact our team for help with an order. Appointment requests require a separate
                confirmation from our staff.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Content & Availability</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Product and service information may change without notice. We strive for accuracy
                but do not guarantee continuous availability or completeness.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">
                In-Store Tailoring Text Notifications
              </h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Customers may opt in verbally during in-store tailoring intake to receive
                transactional text messages from J. Barbaro Clothiers about an active tailoring
                order. Messages may include ready-for-pickup notifications and necessary
                order-status updates. No marketing or promotional messages are sent through this
                program.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Message frequency varies. Message and data rates may apply. Consent is not a
                condition of purchase. Reply STOP to unsubscribe or HELP for assistance. For help,
                visit jbarbaro.com, call 586-286-7400 for The Mall at Partridge Creek, or call
                248-332-2323 for Great Lakes Crossing Outlet.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Wireless carriers are not liable for delayed or undelivered messages. Our collection
                and use of mobile information is described in our Privacy Policy.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Limitation</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                J. Barbaro Clothiers is not liable for indirect damages arising from use of this
                website. Contact the store directly for final service and scheduling details.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
