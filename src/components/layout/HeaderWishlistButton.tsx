"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import {
  openWishlistDrawer,
  readWishlistItems,
  WISHLIST_CHANGED_EVENT,
  WISHLIST_STORAGE_KEY,
} from "@/lib/wishlist";
import { cn } from "@/lib/utils";

type HeaderWishlistButtonProps = {
  active?: boolean;
  className?: string;
  compact?: boolean;
  mobileNav?: boolean;
  onNavigate?: () => void;
};

export function HeaderWishlistButton({
  active = false,
  className,
  compact = false,
  mobileNav = false,
  onNavigate,
}: HeaderWishlistButtonProps) {
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const syncQuantity = () => setQuantity(readWishlistItems().length);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) {
        syncQuantity();
      }
    };

    syncQuantity();
    window.addEventListener(WISHLIST_CHANGED_EVENT, syncQuantity);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, syncQuantity);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function handleWishlistClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      onNavigate?.();
      return;
    }

    event.preventDefault();
    onNavigate?.();
    openWishlistDrawer();
  }

  if (mobileNav) {
    return (
      <Link
        href="/wishlist"
        onClick={handleWishlistClick}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-semibold text-ink/65 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-deep-teal",
          active && "text-deep-teal",
          className,
        )}
      >
        <span className="relative">
          <Heart
            className={cn("h-[18px] w-[18px]", quantity > 0 && "fill-deep-teal text-deep-teal")}
            aria-hidden
          />
          {quantity > 0 ? (
            <span className="absolute -top-3 -right-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1 text-xs font-semibold text-white">
              {quantity > 99 ? "99+" : quantity}
            </span>
          ) : null}
        </span>
        <span>Wishlist</span>
      </Link>
    );
  }

  if (compact) {
    return (
      <Link
        href="/wishlist"
        onClick={handleWishlistClick}
        className={cn(
          "relative inline-flex h-11 w-11 items-center justify-center rounded-md border border-ink/12 text-ink transition-colors duration-200 hover:border-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2",
          className,
        )}
        aria-label={`Open wishlist${quantity > 0 ? `, ${quantity} saved ${quantity === 1 ? "item" : "items"}` : ""}`}
      >
        <Heart className={cn("h-4 w-4", quantity > 0 && "fill-deep-teal text-deep-teal")} />
        {quantity > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1 text-[10px] font-semibold text-white">
            {quantity > 99 ? "99+" : quantity}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <Link
      href="/wishlist"
      onClick={handleWishlistClick}
      className={cn(
        "relative inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-ink/18 bg-ivory px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors duration-200 hover:border-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", quantity > 0 && "fill-deep-teal text-deep-teal")} />
      <span>Wishlist</span>
      {quantity > 0 ? (
        <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1.5 text-[10px] font-semibold text-white">
          {quantity > 99 ? "99+" : quantity}
        </span>
      ) : null}
    </Link>
  );
}
