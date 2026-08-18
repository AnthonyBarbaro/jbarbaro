"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import {
  readWishlistItems,
  toggleWishlistItem,
  WISHLIST_CHANGED_EVENT,
  WISHLIST_STORAGE_KEY,
  type WishlistItem,
} from "@/lib/wishlist";
import { cn } from "@/lib/utils";

type WishlistButtonProps = {
  item: WishlistItem;
  className?: string;
};

export function WishlistButton({ item, className }: WishlistButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const syncSavedState = () => {
      setIsSaved(readWishlistItems().some((savedItem) => savedItem.id === item.id));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_STORAGE_KEY) {
        syncSavedState();
      }
    };

    syncSavedState();
    window.addEventListener(WISHLIST_CHANGED_EVENT, syncSavedState);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WISHLIST_CHANGED_EVENT, syncSavedState);
      window.removeEventListener("storage", handleStorage);
    };
  }, [item.id]);

  return (
    <button
      type="button"
      onClick={() => setIsSaved(toggleWishlistItem(item))}
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${item.title} from wishlist` : `Save ${item.title} to wishlist`}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 bg-white/94 text-ink shadow-sm backdrop-blur-sm transition-[background-color,color,transform] hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal/30 motion-safe:hover:-translate-y-0.5",
        isSaved && "border-deep-teal bg-deep-teal text-white",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", isSaved && "fill-current")} aria-hidden />
    </button>
  );
}
