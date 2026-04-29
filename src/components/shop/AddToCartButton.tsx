"use client";

import { Check, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { notifyShopifyCartChanged } from "@/lib/shopify/cart-events";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  merchandiseId: string;
  availableForSale: boolean;
  className?: string;
  label?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
};

export function AddToCartButton({
  merchandiseId,
  availableForSale,
  className,
  label = "Add to Cart",
  iconOnly = false,
  ariaLabel,
}: AddToCartButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAdded) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasAdded(false);
    }, 950);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasAdded]);

  async function handleAddToCart() {
    setIsPending(true);
    setHasAdded(false);
    setError(null);

    try {
      const response = await fetch("/api/shopify/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lines: [{ merchandiseId, quantity: 1 }],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;

        throw new Error(payload?.message || "Unable to add this item to the cart.");
      }

      setHasAdded(true);
      notifyShopifyCartChanged();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to add this item to the cart.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleAddToCart}
        disabled={!availableForSale || isPending}
        className={className}
        aria-label={ariaLabel || label}
      >
        {iconOnly ? (
          !availableForSale ? (
            <span className="text-[10px] tracking-[0.08em]">Out</span>
          ) : isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <Plus
                className={cn(
                  "absolute h-4 w-4 transition-all duration-250",
                  hasAdded ? "scale-75 opacity-0" : "scale-100 opacity-100",
                )}
              />
              <Check
                className={cn(
                  "absolute h-4 w-4 transition-all duration-300",
                  hasAdded ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
              />
            </span>
          )
        ) : !availableForSale ? (
          "Sold Out"
        ) : isPending ? (
          "Adding..."
        ) : hasAdded ? (
          "Added to Cart"
        ) : (
          label
        )}
      </Button>
      {error ? <p className="text-xs text-ink">{error}</p> : null}
    </div>
  );
}
