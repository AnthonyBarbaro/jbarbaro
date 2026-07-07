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
  className?: string;
  compact?: boolean;
  onNavigate?: () => void;
};

export function HeaderCartButton({ className, compact = false, onNavigate }: HeaderCartButtonProps) {
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

  if (compact) {
    return (
      <Link
        href="/cart"
        onClick={handleCartClick}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/12 text-ink transition-colors duration-200 hover:border-ink/25 sm:h-10 sm:w-10",
          className,
        )}
        aria-label="Open shopping bag"
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
        "relative inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-ink/18 bg-ivory px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors duration-200 hover:border-ink/30",
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
