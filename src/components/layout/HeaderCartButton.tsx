"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { SHOPIFY_CART_CHANGED_EVENT, openShopifyCartDrawer } from "@/lib/shopify/cart-events";
import type { ShopifyCartSnapshot } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

type CartResponse = {
  configured: boolean;
  cart: ShopifyCartSnapshot | null;
  message?: string;
};

type HeaderCartButtonProps = {
  active?: boolean;
  className?: string;
  compact?: boolean;
  mobileNav?: boolean;
  onNavigate?: () => void;
};

export function HeaderCartButton({
  active = false,
  className,
  compact = false,
  mobileNav = false,
  onNavigate,
}: HeaderCartButtonProps) {
  const [quantity, setQuantity] = useState<number | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCart() {
      try {
        const response = await fetch("/api/shopify/cart", { cache: "no-store" });
        const payload = (await response.json()) as CartResponse;

        if (!isMounted) {
          return;
        }

        setIsConfigured(payload.configured);
        setQuantity(payload.cart?.totalQuantity ?? 0);
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
  }, []);

  if (!isConfigured) {
    return null;
  }

  function handleCartClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      onNavigate?.();
      return;
    }

    event.preventDefault();
    onNavigate?.();
    openShopifyCartDrawer();
  }

  if (mobileNav) {
    return (
      <Link
        href="/cart"
        onClick={handleCartClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-ink/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-deep-teal",
          active && "text-deep-teal",
          className,
        )}
      >
        <span className="relative">
          <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
          {quantity && quantity > 0 ? (
            <span className="absolute -top-3 -right-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1 text-xs font-semibold text-white">
              {quantity > 99 ? "99+" : quantity}
            </span>
          ) : null}
        </span>
        <span>Cart</span>
      </Link>
    );
  }

  if (compact) {
    return (
      <Link
        href="/cart"
        onClick={handleCartClick}
        className={cn(
          "relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-ink/12 text-ink transition-colors duration-200 hover:border-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2",
          className,
        )}
        aria-label={`Open shopping bag${quantity && quantity > 0 ? `, ${quantity} ${quantity === 1 ? "item" : "items"}` : ""}`}
      >
        <ShoppingBag className="h-4 w-4" />
        {quantity && quantity > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1 text-[10px] font-semibold text-white">
            {quantity > 99 ? "99+" : quantity}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/cart"
      onClick={handleCartClick}
      className={cn(
        "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-ink/18 bg-ivory px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors duration-200 hover:border-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2",
        className,
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      <span>Bag</span>
      {quantity && quantity > 0 ? (
        <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1.5 text-[10px] font-semibold text-white">
          {quantity > 99 ? "99+" : quantity}
        </span>
      ) : null}
    </Link>
  );
}
