"use client";

import { Check, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { notifyShopifyCartChanged, openShopifyCartDrawer } from "@/lib/shopify/cart-events";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  merchandiseId: string;
  availableForSale: boolean;
  className?: string;
  containerClassName?: string;
  label?: string;
  iconOnly?: boolean;
  ariaLabel?: string;
  disabledLabel?: string;
  itemName?: string;
  onAdded?: () => void;
  openCartOnSuccess?: boolean;
};

export function AddToCartButton({
  merchandiseId,
  availableForSale,
  className,
  containerClassName,
  label = "Add to Bag",
  iconOnly = false,
  ariaLabel,
  disabledLabel = "Sold Out",
  itemName = "Item",
  onAdded,
  openCartOnSuccess = true,
}: AddToCartButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

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
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
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
      onAdded?.();
      notifyShopifyCartChanged();

      if (openCartOnSuccess) {
        openShopifyCartDrawer();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to add this item to the cart.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsPending(false);
    }
  }

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Button
        onClick={handleAddToCart}
        disabled={!availableForSale || isPending}
        className={className}
        aria-label={ariaLabel || label}
        title={iconOnly ? ariaLabel || label : undefined}
      >
        {iconOnly ? (
          !availableForSale ? (
            <span className="text-xs tracking-[0.08em]">Out</span>
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
          disabledLabel
        ) : isPending ? (
          "Adding..."
        ) : hasAdded ? (
          "Added to Cart"
        ) : (
          label
        )}
      </Button>
      <p className="sr-only" role="status" aria-live="polite">
        {isPending ? `Adding ${itemName} to bag` : hasAdded ? `${itemName} added to bag` : ""}
      </p>
      {error ? (
        <p
          className={cn(
            "text-xs text-sale",
            iconOnly &&
              "absolute right-0 bottom-[calc(100%+0.5rem)] z-20 w-40 rounded-md border border-sale/20 bg-white p-2.5 text-left text-xs leading-4 shadow-[0_16px_36px_-22px_rgba(11,15,20,0.5)]",
          )}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
