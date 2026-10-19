import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shipping & Returns",
  description:
    "Shipping information, 14-day returns with tags attached, and order support from J. Barbaro Clothiers.",
  path: "/shipping-returns",
});

export default function ShippingReturnsPage() {
  return (
    <>
      <PageHero
        title="Shipping & Returns"
        description="Delivery information and help with your purchase."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Shipping & Delivery</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Available shipping methods and charges are shown at checkout after you enter your
                delivery address. Review the shipping method and final total before placing your
                order. If you need an item for a particular date, contact our team before ordering.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Returns</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We accept returns within 14 days of receiving your order, with the original tags
                still attached. For return instructions, contact our team with your order number.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">
                Exchanges & Special Items
              </h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Contact our team for exchange assistance. Before purchasing altered, custom, or
                rental items, ask us about the return terms that apply. We can also answer questions
                about shipping charges and gift-wrap fees.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Order Support</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                For delivery, return, or exchange questions,{" "}
                <Link href="/contact-us" className="text-deep-teal underline underline-offset-4">
                  contact our team
                </Link>{" "}
                or call one of our{" "}
                <Link href="/locations" className="text-deep-teal underline underline-offset-4">
                  showrooms
                </Link>
                . Please have your order number available.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
