"use client";

import { Check, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { notifyShopifyCartChanged } from "@/lib/shopify/cart-events";

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

  async function handleAddToCart() {
    setIsPending(true);
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
          ) : hasAdded ? (
            <Check className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
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
      {error ? <p className="text-xs text-[color:#8b1e3f]">{error}</p> : null}
    </div>
  );
}
