import Image from "next/image";

import showroomPhoto from "../../../public/images/locations/partridge-creek/showroom-02.jpg";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { getShopifyCustomerAccountUrl } from "@/lib/shopify/config";

export const metadata = buildMetadata({
  title: "Customer Account",
  description:
    "Sign in to your J. Barbaro Clothiers customer account to review online orders and saved details.",
  path: "/account",
});

export default function AccountPage() {
  const accountUrl = getShopifyCustomerAccountUrl();
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Account", href: "/account" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <section className="border-b border-ink/10 bg-ivory" aria-labelledby="account-heading">
        <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(24rem,1fr)] lg:items-center lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <h1
              id="account-heading"
              className="font-heading text-4xl text-ink sm:text-5xl lg:text-6xl"
            >
              Sign in to your account.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-smoke sm:text-base">
              Review your online orders and manage your saved account details.
            </p>

            <div className="mt-7">
              {accountUrl ? (
                <ButtonLink href={accountUrl} className="w-full sm:w-auto">
                  Sign In
                </ButtonLink>
              ) : (
                <div>
                  <p className="text-sm leading-6 text-smoke">
                    Account sign-in is temporarily unavailable.
                  </p>
                  <ButtonLink href="/contact-us" className="mt-4 w-full sm:w-auto">
                    Contact the Store
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-ink/10 bg-stone">
            <Image
              src={showroomPhoto}
              alt="Inside the J. Barbaro Clothiers showroom at Partridge Creek"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              placeholder="blur"
              priority
            />
          </div>
        </Container>
      </section>
    </>
  );
}
