import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description: "Terms governing the use of the J. Barbaro Clothiers website and submitted request forms.",
  path: "/terms-of-use",
});

export default function TermsOfUsePage() {
  return (
    <>
      <PageHero title="Terms of Use" description="Terms and conditions for accessing and using this website." />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <article className="mx-auto max-w-3xl space-y-8 rounded-3xl border border-ink/10 bg-ivory p-5 sm:p-8 luxe-shadow">
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Use of Site</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                This site is provided for informational and appointment-request purposes. You agree not to misuse forms, submit harmful content, or attempt unauthorized access.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Content & Availability</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Product and service information may change without notice. We strive for accuracy but do not guarantee continuous availability or completeness.
              </p>
            </section>
            <section>
              <h2 className="font-heading text-2xl text-ink sm:text-3xl">Limitation</h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                J. Barbaro Clothiers is not liable for indirect damages arising from use of this website. Contact the store directly for final service and scheduling details.
              </p>
            </section>
          </article>
        </Container>
      </WaveSection>
    </>
  );
}
