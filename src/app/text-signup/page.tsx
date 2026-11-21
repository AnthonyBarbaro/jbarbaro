import Link from "next/link";
import { notFound } from "next/navigation";

import { KlaviyoTextSignupForm } from "@/components/marketing/KlaviyoTextSignupForm";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { getKlaviyoSiteId, TEXT_SIGNUP_PATH } from "@/lib/klaviyo";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Text Me Offers",
  description: "Sign up for texts about new arrivals, special offers, and store events.",
  path: TEXT_SIGNUP_PATH,
});

export default function TextSignupPage() {
  const siteId = getKlaviyoSiteId();

  if (!siteId) {
    notFound();
  }

  return (
    <>
      <PageHero
        title="Text Me Offers"
        description="Sign up for texts about new arrivals, special offers, and store events."
      />
      <WaveSection topWave="C" background="ivory">
        <Container>
          <div className="mx-auto max-w-xl space-y-4">
            <KlaviyoTextSignupForm siteId={siteId} />
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-deep-teal">
              <Link href="/mobile-terms-of-service" className="underline underline-offset-4">
                Mobile Terms of Service
              </Link>
              <Link href="/privacy-policy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
            </div>
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
