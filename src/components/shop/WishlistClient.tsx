"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import {
  clearWishlist,
  readWishlistItems,
  removeWishlistItem,
  WISHLIST_CHANGED_EVENT,
  WISHLIST_STORAGE_KEY,
  type WishlistItem,
} from "@/lib/wishlist";

export function WishlistClient() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);

  useEffect(() => {
    const syncItems = () => setItems(readWishlistItems());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) {
        syncItems();
      }
    };

    syncItems();
    window.addEventListener(WISHLIST_CHANGED_EVENT, syncItems);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, syncItems);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (items === null) {
    return (
      <div className="mt-8 min-h-64 animate-pulse rounded-lg bg-stone motion-reduce:animate-none" />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mt-8 border border-ink/10 bg-white px-5 py-12 text-center sm:px-8 sm:py-16">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-deep-teal/8 text-deep-teal">
          <Heart className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-5 font-heading text-3xl text-ink">
          Your wishlist is ready when you are.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-smoke">
          Save pieces while you browse and they will stay here on this device for an easier return
          visit.
        </p>
        <ButtonLink href="/shop" className="mt-6 rounded-none">
          Browse the Shop
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      <div className="mt-7 flex items-center justify-between gap-4 border-y border-ink/10 py-3">
        <p className="text-sm text-smoke">
          {items.length} saved {items.length === 1 ? "item" : "items"}
        </p>
        <button
          type="button"
          onClick={clearWishlist}
          className="inline-flex min-h-11 items-center gap-2 px-2 text-xs font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/25"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Clear all
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 xl:gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="relative flex min-w-0 flex-col overflow-hidden rounded-lg border border-ink/10 bg-white"
          >
            <Link
              href={`/shop/${item.handle}`}
              className="group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-deep-teal"
            >
              <div className="relative aspect-[4/5] overflow-hidden border-b border-ink/8 bg-white">
                {item.image ? (
                  <Image
                    src={item.image.url}
                    alt={item.image.altText || item.title}
                    fill
                    sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
                    className="object-contain transition-transform duration-300 motion-safe:group-hover:scale-[1.025]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-smoke">
                    Image coming soon
                  </div>
                )}
              </div>
            </Link>

            <button
              type="button"
              onClick={() => removeWishlistItem(item.id)}
              className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 bg-white/94 text-ink shadow-sm backdrop-blur-sm transition-colors hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/30"
              aria-label={`Remove ${item.title} from wishlist`}
            >
              <Heart className="h-4 w-4 fill-current" aria-hidden />
            </button>

            <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
              <p className="truncate text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                {[item.vendor, item.productType].filter(Boolean).join(" · ")}
              </p>
              <Link
                href={`/shop/${item.handle}`}
                className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-ink transition-colors hover:text-deep-teal sm:min-h-12 sm:text-base sm:leading-6"
              >
                {item.title}
              </Link>
              <p className="mt-auto pt-3 text-base font-bold tracking-[-0.02em] text-ink sm:text-lg">
                {item.priceLabel}
              </p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-smoke">
        Prices and availability are confirmed when you open the product page.
      </p>
    </>
  );
}
