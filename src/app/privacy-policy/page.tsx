import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How J. Barbaro Clothiers uses information for shopping, checkout, browser storage, inquiries, and appointment requests.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        description="How we collect, store, and use shopping, website, and appointment information."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Information We Collect</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We collect contact details you submit through forms, including name, email, phone,
                appointment preferences, and wedding or service details you choose to provide.
                Shopify checkout collects the contact, billing, delivery, and payment information
                needed for your order. We also collect basic technical data required to secure and
                operate the site. Do not include payment-card details in website request forms.
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
                storage. Saved wishlist items are also stored in your browser until you remove them
                or clear browser storage. Bag changes use a browser-storage signal to refresh other
                open tabs; that signal does not contain your cart identifier or checkout link.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How We Use Information</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We use information to maintain your shopping bag, process and fulfill orders,
                provide order support, respond to inquiries, review wedding requests, and confirm
                appointments. We do not sell your personal data.
              </p>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Shopify provides our shopping and checkout services. Our email delivery provider,
                Amazon Simple Email Service, processes request emails and acknowledgments.
                Appointment, contact, and wedding requests are delivered to our team by email. Staff
                reviews your preferred appointment time and replies to confirm your visit or arrange
                another time.
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
                We retain order, inquiry, wedding, and appointment records for customer service and
                business recordkeeping. To ask about your information or request its removal,
                contact our team through the Contact Us page. Some order records may need to be
                retained for business or legal obligations.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
