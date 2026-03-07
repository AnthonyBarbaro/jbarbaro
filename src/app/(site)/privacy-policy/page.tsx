import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Review the J. Barbaro Clothiers privacy policy for website usage, forms, and appointment requests.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero title="Privacy Policy" description="How we collect, store, and use website and appointment information." />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Information We Collect</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We collect contact details you submit through forms, including name, email, phone, and appointment preferences. We also collect basic technical data required to secure and operate the site.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">How We Use Information</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Submitted information is used only to respond to inquiries, confirm appointments, and improve service. We do not sell your personal data.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Data Retention</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                We retain inquiry and appointment records for operational purposes and can remove personal information upon reasonable request.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
