import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Review the J. Barbaro Clothiers privacy policy for website usage, cookies, browser storage, forms, and appointment requests.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        description="How we collect, store, and use website and appointment information."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Information We Collect</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We collect contact details you submit through forms, including name, email, phone,
                and appointment preferences. We also collect basic technical data required to secure
                and operate the site.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">
                Cookies & Browser Storage
              </h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We use a first-party cookie for essential shopping-cart functionality. It retains
                your Shopify cart identifier for up to 30 days. If you choose Smart Fit, the fit
                details you enter are saved in your browser’s local storage so your preferences can
                be reused. They remain there until you remove the profile or clear your browser
                storage.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How We Use Information</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Submitted information is used only to respond to inquiries, confirm appointments,
                and improve service. We do not sell your personal data.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">
                Text Messaging & Mobile Information
              </h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                When you opt in during an in-store tailoring visit, we may use your mobile number
                and consent record to send transactional updates about your tailoring order,
                including ready-for-pickup notifications. Message frequency varies. You may reply
                STOP to opt out at any time.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Mobile information will not be sold, rented, or shared with third parties or
                affiliates for promotional or marketing purposes. Text-messaging opt-in data and
                consent will not be shared with third parties, except service providers that support
                delivery of our text-messaging program.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Data Retention</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We retain inquiry and appointment records for operational purposes and can remove
                personal information upon reasonable request.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
