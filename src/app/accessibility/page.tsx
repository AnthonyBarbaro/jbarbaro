import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { AccessibilityNavButton } from "@/components/ui/AccessibilityNavButton";
import { locations } from "@/data/locations";
import { SITE_NAME } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { formatPhone } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Accessibility",
  description: `Get help using the ${SITE_NAME} website or report an accessibility barrier.`,
  path: "/accessibility",
});

const contactLinkClass =
  "text-deep-teal underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-teal";

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        title="Accessibility"
        description="Get help using our website or tell us about an accessibility barrier."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-2xl border border-ink/10 bg-ivory p-5 text-base leading-7 text-smoke sm:p-8">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Get help</h2>
              <p className="mt-3">
                If you have difficulty browsing products, checking out, or booking an appointment,
                contact us for assistance. You can also ask for product information in a format that
                works for you.
              </p>
              <ul className="mt-4 space-y-2">
                <li>
                  Email{" "}
                  <a className={contactLinkClass} href="mailto:info@jbarbaro.com">
                    info@jbarbaro.com
                  </a>
                </li>
                {locations.map((location) => (
                  <li key={location.slug}>
                    Call {location.name}{" "}
                    <a className={contactLinkClass} href={formatPhone(location.phone)}>
                      {location.phone}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4">
                When reporting a problem, please include the page or feature you were using, what
                you were trying to do, and how we can reach you.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Our commitment</h2>
              <p className="mt-3">
                {SITE_NAME} is committed to making this website accessible to people with
                disabilities. We use the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA as
                our target for improving accessibility.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Display preferences</h2>
              <p className="mt-3">
                Use Accessibility options to adjust text size, increase contrast, turn on a reading
                guide, or reduce motion. Your choices are saved in this browser.
              </p>
              <AccessibilityNavButton
                showLabel
                className="mt-2 min-h-[44px] justify-start rounded-md text-sm font-semibold text-deep-teal underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep-teal"
              />
            </section>
            <p className="border-t border-ink/10 pt-4 text-sm">
              Last updated <time dateTime="2026-11-21">November 21, 2026</time>
            </p>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
