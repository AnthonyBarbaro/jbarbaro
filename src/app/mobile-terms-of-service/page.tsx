import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { locations } from "@/data/locations";
import { LEGAL_OWNER, SITE_NAME } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Mobile Terms of Service",
  description:
    "Terms for J. Barbaro Clothiers tailoring and promotional texts, including consent, message rates, and how to opt out.",
  path: "/mobile-terms-of-service",
});

export default function MobileTermsOfServicePage() {
  return (
    <>
      <PageHero
        title="Mobile Terms of Service"
        description="Terms for tailoring updates and promotional texts from J. Barbaro Clothiers."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <div className="text-sm leading-7 text-smoke">
              <p>
                Last updated <time dateTime="2026-11-21">November 21, 2026</time>
              </p>
              <p className="mt-3">
                {LEGAL_OWNER} operates the {SITE_NAME} text messaging service. These terms apply
                when you sign up for texts from us at the mobile number you provide.
              </p>
            </div>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">What We Send</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                <strong>Tailoring updates.</strong> If you opt in during in-store tailoring intake,
                we may text you about your active order, including pickup notifications and
                necessary order updates.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                <strong>Promotional texts.</strong> If you separately opt in to SMS marketing, we
                may send you recurring messages about new arrivals, special offers, and store
                events. We may also send cart reminders if disclosed when you sign up.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How to Opt In</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                To receive tailoring texts, give a team member your mobile number at intake and tell
                them you agree to receive updates about your order. To receive promotional texts,
                complete our separate SMS marketing signup. If asked to reply <strong>YES</strong>,
                you will receive promotional texts only after confirming.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Messages may be sent using an automatic telephone dialing system or other automated
                technology. Providing a phone number alone does not enroll you. Consent to receive
                tailoring updates does not enroll you in promotional texts. Either program is
                optional, and consent is not a condition of purchase.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Frequency &amp; Rates</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Message frequency varies. We do not charge for the text messaging service. Message
                and data rates may apply under your wireless plan. Contact your carrier for details.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How to Opt Out</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Reply <strong>STOP</strong> to a text from us at any time, or use the unsubscribe
                link if one appears in the message. You may receive one text confirming your
                opt-out.
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
                Reply <strong>HELP</strong> to a text from us, email{" "}
                <a
                  href="mailto:info@jbarbaro.com"
                  className="text-deep-teal underline underline-offset-4"
                >
                  info@jbarbaro.com
                </a>
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
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Changes &amp; Delivery</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We may update these terms, change a sending number, or discontinue the service. If a
                reply to an old sending number does not go through, use the email address or
                showroom numbers above for help or to opt out. If your mobile number changes, please
                let us know and sign up again with your new number.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Wireless carriers are not liable for delayed or undelivered messages. To the extent
                permitted by law, we are not responsible for failed, delayed, or misdirected
                delivery of texts.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
