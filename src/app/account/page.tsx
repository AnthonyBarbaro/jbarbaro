import Image from "next/image";
import {
  ArrowRight,
  Clock3,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  UserRoundCheck,
} from "lucide-react";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/lib/seo";
import { getShopifyCustomerAccountUrl } from "@/lib/shopify/config";

export const metadata = buildMetadata({
  title: "Customer Account",
  description:
    "Sign in to your J. Barbaro Clothiers customer account for order history, saved details, and secure Shopify checkout access.",
  path: "/account",
});

const accountHighlights = [
  {
    title: "Order History",
    description:
      "Review online purchases and keep track of recent wardrobe additions through Shopify.",
    icon: ShoppingBag,
  },
  {
    title: "Saved Details",
    description:
      "Keep preferred contact and delivery details ready for a smoother checkout experience.",
    icon: UserRoundCheck,
  },
  {
    title: "Secure Sign In",
    description: "Customer access stays protected by Shopify's hosted account system.",
    icon: ShieldCheck,
  },
];

const serviceNotes = [
  {
    title: "Fast shipping updates",
    description: "Watch online order progress after checkout.",
    icon: PackageCheck,
  },
  {
    title: "Store support",
    description: "Need tailoring, styling, or pickup help? Our team can still assist directly.",
    icon: Clock3,
  },
  {
    title: "Protected checkout",
    description: "Payments and account sign-in continue through Shopify's secure flow.",
    icon: LockKeyhole,
  },
];

export default function AccountPage() {
  const accountUrl = getShopifyCustomerAccountUrl();
  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Account", href: "/account" },
  ];

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />

      <section className="border-b border-ink/10 bg-ivory">
        <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:py-14">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
              Customer Account
            </p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl text-ink sm:text-5xl lg:text-6xl">
              Sign in for a smoother wardrobe experience.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
              Use your Shopify account to view order history, manage saved details, and return to
              secure checkout with less friction.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {accountUrl ? (
                <ButtonLink
                  href={accountUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  Sign In / Create Account
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              ) : (
                <ButtonLink href="/contact-us" className="w-full sm:w-auto">
                  Contact the Store
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              )}
              <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
                Continue Shopping
              </ButtonLink>
            </div>
          </div>

          <div className="relative min-h-[20rem] overflow-hidden rounded-lg border border-ink/10 bg-stone shadow-sm shadow-ink/[0.03]">
            <Image
              src="/images/hero-suits-299.jpg"
              alt="Tailored clothing fitting room at J. Barbaro Clothiers"
              fill
              sizes="(min-width: 1024px) 24rem, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/8 to-transparent" />
            <div className="absolute right-5 bottom-5 left-5 text-white">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">
                Shopify Powered
              </p>
              <p className="mt-2 text-sm leading-6 text-white/86">
                Secure customer access for online purchases and checkout.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-stone/45 py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {accountHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title}>
                  <CardContent>
                    <Icon className="h-6 w-6 text-deep-teal" />
                    <h2 className="mt-4 font-heading text-2xl text-ink">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-smoke">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-ivory py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1fr] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">
                Client Care
              </p>
              <h2 className="mt-3 font-heading text-3xl text-ink sm:text-4xl">
                Online convenience, personal service.
              </h2>
              <p className="mt-3 text-sm leading-7 text-smoke">
                Your account covers the online shopping flow. For tailoring notes, formalwear
                fittings, special orders, or wardrobe planning, the store team can still help
                directly.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink
                  href="/schedule-appointment"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Book Appointment
                </ButtonLink>
                <ButtonLink href="/contact-us" variant="ghost" className="w-full sm:w-auto">
                  Contact Us
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {serviceNotes.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm shadow-ink/[0.03]"
                  >
                    <Icon className="h-5 w-5 text-deep-teal" />
                    <h3 className="mt-3 text-sm font-semibold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-smoke">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
