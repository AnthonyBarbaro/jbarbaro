"use client";

import { Check, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/Button";
import {
  SHOPIFY_CART_CHANGED_EVENT,
  notifyShopifyCartChanged,
  openShopifyCartDrawer,
} from "@/lib/shopify/cart-events";
import { getCartAdditionFeedback } from "@/lib/shopify/cart-feedback";
import { requestShopifyCartMutation } from "@/lib/shopify/cart-request";
import type { ShopifyCartResponse } from "@/lib/shopify/types";
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
  onReviewCart?: () => void;
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
  onReviewCart,
  openCartOnSuccess = true,
}: AddToCartButtonProps): ReactElement {
  const [isPending, setIsPending] = useState(false);
  const [hasAdded, setHasAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
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

  useEffect(() => {
    if (!needsReview) {
      return;
    }

    function handleCartChanged(event: Event): void {
      const payload = (event as CustomEvent<ShopifyCartResponse | undefined>).detail;

      if (payload && "cart" in payload && payload.confirmed !== false) {
        setNeedsReview(false);
        setError(null);
      }
    }

    window.addEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);

    return () => window.removeEventListener(SHOPIFY_CART_CHANGED_EVENT, handleCartChanged);
  }, [needsReview]);

  async function handleAddToCart(): Promise<void> {
    if (isSubmittingRef.current || needsReview || !availableForSale) {
      return;
    }

    isSubmittingRef.current = true;
    setIsPending(true);
    setHasAdded(false);
    setError(null);
    setNotice(null);
    let requestStarted = false;

    try {
      const { response, payload } = await requestShopifyCartMutation(async () => {
        requestStarted = true;
        const response = await fetch("/api/shopify/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lines: [{ merchandiseId, quantity: 1 }],
          }),
        });
        const decoded = (await response.json().catch(() => null)) as ShopifyCartResponse | null;
        const payload =
          decoded && typeof decoded === "object" && typeof decoded.configured === "boolean"
            ? decoded
            : null;

        return { response, payload };
      });

      const feedback = getCartAdditionFeedback(payload, merchandiseId);

      if (!response.ok || !feedback.confirmed) {
        const message =
          payload?.message ||
          feedback.message ||
          "We couldn't confirm this addition. Review your bag before adding this item again.";
        notifyShopifyCartChanged({
          configured: true,
          warnings: [],
          userErrors: [],
          ...payload,
          confirmed: false,
          message,
        });
        setError(message);
        setNeedsReview(true);
        return;
      }

      notifyShopifyCartChanged(payload ?? undefined);
      setHasAdded(true);
      setNotice(payload?.warnings?.map((warning) => warning.message).join(" ") || null);
      onAdded?.();

      if (openCartOnSuccess) {
        openShopifyCartDrawer(payload ?? undefined);
      }
    } catch (caughtError) {
      const message = requestStarted
        ? "We couldn't confirm this addition. Review your bag before trying again."
        : caughtError instanceof Error
          ? caughtError.message
          : "We couldn't add this item. Please try again.";
      setError(message);
      setNeedsReview(requestStarted);
      if (requestStarted) {
        notifyShopifyCartChanged({
          configured: true,
          warnings: [],
          userErrors: [],
          confirmed: false,
          message,
        });
      }
    } finally {
      isSubmittingRef.current = false;
      setIsPending(false);
    }
  }

  return (
    <div className={cn("space-y-2", containerClassName)}>
      <Button
        onClick={handleAddToCart}
        disabled={!availableForSale || isPending || needsReview}
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
      {notice ? (
        <p className="text-xs leading-5 text-smoke" role="status">
          {notice}
        </p>
      ) : null}
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
      {needsReview ? (
        <button
          type="button"
          onClick={() => {
            if (onReviewCart) {
              onReviewCart();
            } else {
              openShopifyCartDrawer();
            }
          }}
          className="inline-flex min-h-11 items-center text-xs font-semibold text-deep-teal underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal"
        >
          Review Bag
        </button>
      ) : null}
    </div>
  );
}
