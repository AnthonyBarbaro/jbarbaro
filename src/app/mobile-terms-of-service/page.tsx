import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { buildMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Mobile Terms of Service",
  description:
    "How to sign up for J. Barbaro Clothiers tailoring texts, what messages to expect, and how to get help or opt out.",
  path: "/mobile-terms-of-service",
});

export default function MobileTermsOfServicePage() {
  return (
    <>
      <PageHero
        title="Mobile Terms of Service"
        description="Text message updates from J. Barbaro Clothiers about your tailoring order."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">What We Send</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                J. Barbaro Clothiers sends text messages about active tailoring orders, including
                pickup notifications and necessary order updates. This program does not send
                promotional messages.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Message frequency varies with your order. Message and data rates may apply based on
                your wireless plan. Carriers are not liable for delayed or undelivered messages.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How to Opt In</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                During your in-store tailoring intake, give a team member your mobile number and
                tell them you agree to receive texts about your order. Providing a phone number
                alone does not enroll you. Text updates are optional and consent is not a condition
                of purchase.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How to Opt Out</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Reply <strong>STOP</strong> to a text from us at any time to stop receiving messages
                from this program. You may receive a final text confirming your request.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                You can also ask to stop receiving texts by calling your showroom or{" "}
                <Link href="/contact-us" className="text-deep-teal underline underline-offset-4">
                  contacting our team
                </Link>
                .
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Help &amp; Privacy</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Reply <strong>HELP</strong> to a text from us,{" "}
                <Link href="/contact-us" className="text-deep-teal underline underline-offset-4">
                  contact our team
                </Link>
                , or call your showroom for assistance.
              </p>
              <ul className="mt-3 space-y-1 text-sm leading-7 text-smoke">
                {locations.map((location) => (
                  <li key={location.slug}>
                    {location.name}{" "}
                    <a
                      href={formatPhone(location.phone)}
                      className="text-deep-teal underline underline-offset-4"
                    >
                      {location.phone}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-7 text-smoke">
                See our{" "}
                <Link
                  href="/privacy-policy"
                  className="text-deep-teal underline underline-offset-4"
                >
                  Privacy Policy
                </Link>{" "}
                for details about how we use and protect your mobile information.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
