import type { Metadata } from "next";

import { WishlistClient } from "@/components/shop/WishlistClient";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Your Wishlist | J. Barbaro Clothiers",
  description: "Return to the J. Barbaro menswear pieces you saved for later.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function WishlistPage() {
  return (
    <section className="min-h-[60vh] bg-[#f4f1ea] py-8 sm:py-12">
      <Container className="max-w-[90rem]">
        <p className="text-xs font-semibold tracking-[0.18em] text-deep-teal uppercase">
          Saved for later
        </p>
        <h1 className="mt-3 font-heading text-4xl text-ink sm:text-5xl">Your Wishlist</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-smoke sm:text-base">
          Keep a shortlist of pieces you want to revisit. Your saved items stay on this device.
        </p>
        <WishlistClient />
      </Container>
    </section>
  );
}
