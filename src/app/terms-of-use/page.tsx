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
                Review the items, options, and quantities in your bag before continuing to Shopify
                checkout. Available delivery methods, shipping charges, applicable taxes, and the
                final total are shown at checkout before you place your order.
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
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Text Messaging</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Our{" "}
                <Link
                  href="/mobile-terms-of-service"
                  className="text-deep-teal underline underline-offset-4"
                >
                  Mobile Terms of Service
                </Link>{" "}
                explain how to sign up separately for tailoring updates or promotional texts, what
                we send, and how to opt out.
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
