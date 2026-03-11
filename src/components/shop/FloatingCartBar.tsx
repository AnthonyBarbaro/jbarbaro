"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { ShopifyCartSnapshot } from "@/lib/shopify/types";
import { SHOPIFY_CART_CHANGED_EVENT } from "@/lib/shopify/cart-events";
import { formatMoney } from "@/lib/utils";

type CartResponse = {
  configured: boolean;
  cart: ShopifyCartSnapshot | null;
  message?: string;
};

const FLOATING_CART_DISMISSED_KEY = "jb-floating-cart-dismissed";

export function FloatingCartBar() {
  const pathname = usePathname();
  const isShopPath = pathname === "/shop" || pathname.startsWith("/shop/");
  const shouldHide = pathname.startsWith("/admin") || !isShopPath;
  const [cart, setCart] = useState<ShopifyCartSnapshot | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(FLOATING_CART_DISMISSED_KEY);

    setIsDismissed(storedValue === "true");
    setHasLoadedPreference(true);
  }, []);

  useEffect(() => {
    if (shouldHide || !hasLoadedPreference) {
      return;
    }

    let isMounted = true;

    async function loadCart() {
      try {
        const response = await fetch("/api/shopify/cart", { cache: "no-store" });
        const payload = (await response.json()) as CartResponse;

        if (!isMounted) {
          return;
        }

        setIsConfigured(payload.configured);
        setCart(payload.cart);
      } catch (error) {
        if (isMounted) {
          console.error(error);
        }
      }
    }

    void loadCart();

    const handleCartChanged = () => {
      void loadCart();
    };

    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [hasLoadedPreference, pathname, shouldHide]);

  function dismissBar() {
    setIsDismissed(true);
    window.localStorage.setItem(FLOATING_CART_DISMISSED_KEY, "true");
  }

  function restoreBar() {
    setIsDismissed(false);
    window.localStorage.removeItem(FLOATING_CART_DISMISSED_KEY);
  }

  async function goToCheckout() {
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/shopify/cart/checkout", { method: "POST" });
      const payload = (await response.json()) as { checkoutUrl?: string; message?: string };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.message || "Unable to start checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      console.error(error);
      setIsCheckingOut(false);
    }
  }

  if (!hasLoadedPreference || !isConfigured || !cart || cart.totalQuantity < 1 || shouldHide) {
    return null;
  }

  if (isDismissed) {
    return (
      <div className="fixed right-3 bottom-[max(0.9rem,env(safe-area-inset-bottom))] z-[120] sm:right-4">
        <button
          type="button"
          onClick={restoreBar}
          className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-ink/15 bg-ivory/96 text-ink shadow-[0_24px_55px_-30px_rgba(14,23,38,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:text-gold"
          aria-label="Show shopping bag"
        >
          <ShoppingBag className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1 text-[10px] font-semibold text-ivory">
            {cart.totalQuantity}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <div className="pointer-events-auto mx-auto max-w-5xl rounded-[1.75rem] border border-ink/12 bg-ivory/96 shadow-[0_-16px_60px_-30px_rgba(14,23,38,0.45)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-deep-teal text-ivory">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">Shopping Bag</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink">
                <span className="font-semibold">{cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}</span>
                <span aria-hidden className="text-ink/25">
                  •
                </span>
                <span>{formatMoney(cart.total.amount, cart.total.currencyCode)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={dismissBar}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-all duration-300 hover:border-gold hover:text-gold"
              aria-label="Hide shopping bag"
            >
              <X className="h-4 w-4" />
            </button>
            <Link
              href="/cart"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:border-gold hover:text-gold"
            >
              View Bag
            </Link>
            <Button className="min-w-[180px]" disabled={isCheckingOut} onClick={() => void goToCheckout()}>
              <span>{isCheckingOut ? "Redirecting..." : "Checkout"}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
