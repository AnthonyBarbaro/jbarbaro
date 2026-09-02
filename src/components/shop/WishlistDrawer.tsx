"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  readWishlistItems,
  removeWishlistItem,
  WISHLIST_CHANGED_EVENT,
  WISHLIST_OPEN_EVENT,
  WISHLIST_STORAGE_KEY,
  type WishlistItem,
} from "@/lib/wishlist";

export function WishlistDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const syncItems = () => setItems(readWishlistItems());
    const handleOpen = () => {
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      syncItems();
      setIsOpen(true);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) {
        syncItems();
      }
    };

    window.addEventListener(WISHLIST_OPEN_EVENT, handleOpen);
    window.addEventListener(WISHLIST_CHANGED_EVENT, syncItems);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WISHLIST_OPEN_EVENT, handleOpen);
      window.removeEventListener(WISHLIST_CHANGED_EVENT, syncItems);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("button, a[href]")?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]") ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="shopping-drawer-backdrop fixed inset-0 z-[170] bg-ink/55 backdrop-blur-[3px]"
        aria-label="Close wishlist"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Wishlist"
        tabIndex={-1}
        className={`shopping-drawer-panel fixed inset-x-0 bottom-0 z-[175] flex max-h-[82dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_-24px_70px_-34px_rgba(11,15,20,0.55)] outline-none lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:max-h-none lg:max-w-[26rem] lg:rounded-none lg:shadow-[-24px_0_60px_-40px_rgba(11,15,20,0.45)] ${items.length > 0 ? "h-[82dvh]" : "h-auto"}`}
      >
        <div className="relative flex items-center justify-between gap-3 border-b border-ink/10 px-5 pt-6 pb-3 lg:py-4">
          <span
            className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/18 lg:hidden"
            aria-hidden
          />
          <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.16em] text-ink uppercase">
            <Heart className="h-4 w-4 fill-deep-teal text-deep-teal" aria-hidden />
            Wishlist
            {items.length > 0 ? (
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-deep-teal px-1.5 text-xs font-semibold text-white">
                {items.length > 99 ? "99+" : items.length}
              </span>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
            aria-label="Close wishlist"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {items.length > 0 ? (
            <ul className="divide-y divide-ink/8">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                  <Link
                    href={`/shop/${item.handle}`}
                    onClick={() => setIsOpen(false)}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-product-canvas focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/30"
                  >
                    {item.image ? (
                      <Image
                        src={item.image.url}
                        alt={item.image.altText || item.title}
                        fill
                        sizes="80px"
                        className="object-contain p-1.5"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center px-2 text-center text-xs text-smoke">
                        Image coming soon
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                      {[item.vendor, item.productType].filter(Boolean).join(" · ")}
                    </p>
                    <Link
                      href={`/shop/${item.handle}`}
                      onClick={() => setIsOpen(false)}
                      className="mt-1 line-clamp-2 text-sm leading-5 font-semibold text-ink transition-colors hover:text-deep-teal"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                      <p className="text-sm font-bold text-ink">{item.priceLabel}</p>
                      <button
                        type="button"
                        onClick={() => removeWishlistItem(item.id)}
                        className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-semibold text-smoke transition-colors hover:text-sale focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/25"
                        aria-label={`Remove ${item.title} from wishlist`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone text-deep-teal">
                <Heart className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-base font-semibold text-ink">Your wishlist is empty</p>
                <p className="mt-1 max-w-xs text-sm leading-6 text-smoke">
                  Save pieces while you browse and they will appear here.
                </p>
              </div>
              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-gold bg-gold px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-colors hover:bg-[#d7b979]"
              >
                Browse the Shop
              </Link>
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-ink/10 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Link
              href="/wishlist"
              onClick={() => setIsOpen(false)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-ink bg-ink px-5 py-3 text-sm font-semibold tracking-[0.1em] text-white uppercase transition-colors hover:border-deep-teal hover:bg-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/25"
            >
              View All Wishlist
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
