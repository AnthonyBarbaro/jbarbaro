"use client";

import { useId, type ReactElement } from "react";

import { useCartQuantityStatus } from "@/components/shop/CartQuantityContext";
import {
  findGiftWrapParent,
  getCartGiftWrapIssue,
  getGiftWrapGroup,
  getGiftWrapLinesForParent,
  isGiftWrapLine,
} from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartLine,
  ShopifyCartResponse,
  ShopifyGiftWrapOffer,
} from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type CartGiftWrapOptionProps = {
  line: ShopifyCartLine;
  offer: ShopifyGiftWrapOffer | null;
  disabled: boolean;
  pending: boolean;
  className?: string;
  onAdd: () => void;
};

export function getConfirmedGiftWrapParent(
  payload: ShopifyCartResponse,
  originalParent: ShopifyCartLine,
  offer: ShopifyGiftWrapOffer | null,
): ShopifyCartLine | null {
  if (
    payload.confirmed !== true ||
    !payload.cart ||
    !payload.giftWrapGroupId ||
    !offer ||
    getCartGiftWrapIssue(payload.cart)
  ) {
    return null;
  }

  const parent = findGiftWrapParent(payload.cart, payload.giftWrapGroupId);
  if (
    !parent ||
    parent.variantId !== originalParent.variantId ||
    parent.quantity !== originalParent.quantity
  ) {
    return null;
  }

  const wrapping = getGiftWrapLinesForParent(payload.cart, parent);
  return wrapping.length === 1 &&
    wrapping[0].variantId === offer.merchandiseId &&
    wrapping[0].quantity === parent.quantity &&
    getGiftWrapGroup(wrapping[0]) === payload.giftWrapGroupId
    ? parent
    : null;
}

export function CartGiftWrapOption({
  line,
  offer,
  disabled,
  pending,
  className,
  onAdd,
}: CartGiftWrapOptionProps): ReactElement | null {
  const descriptionId = useId();
  const { getRemainingQuantity } = useCartQuantityStatus();

  if (isGiftWrapLine(line) || line.parentLineId || line.quantity < 1 || !line.variantId) {
    return null;
  }

  const remaining = offer ? getRemainingQuantity(offer.merchandiseId) : null;
  const stockLimitReached = remaining !== null && remaining < line.quantity;
  const available = Boolean(offer?.availableForSale && !stockLimitReached);
  const totalPrice = offer ? Number(offer.price.amount) * line.quantity : null;

  return (
    <div className={cn("border-t border-ink/10 pt-3", className)} aria-busy={pending}>
      <label className="flex min-h-11 items-center gap-3 rounded-sm text-sm text-ink focus-within:ring-2 focus-within:ring-deep-teal focus-within:ring-offset-2">
        <input
          type="checkbox"
          checked={false}
          disabled={disabled || pending || !available}
          onChange={(event) => {
            if (event.target.checked) {
              onAdd();
            }
          }}
          aria-label={`Add gift wrap for ${line.productTitle || "this item"}`}
          aria-describedby={descriptionId}
          className="h-5 w-5 shrink-0 accent-deep-teal disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold">{pending ? "Adding gift wrap..." : "Add gift wrap"}</span>
          {offer ? (
            <span className="text-xs font-medium text-deep-teal">
              +{formatMoney(offer.price.amount, offer.price.currencyCode)} per item
            </span>
          ) : null}
        </span>
      </label>
      <p id={descriptionId} className="ml-8 text-xs leading-5 text-smoke">
        {!offer?.availableForSale
          ? "Gift wrap is currently unavailable."
          : stockLimitReached
            ? "Not enough gift wrap available for this quantity."
            : line.quantity > 1 && totalPrice !== null
              ? `Wraps all ${line.quantity} items in this row · ${formatMoney(totalPrice.toFixed(2), offer.price.currencyCode)} total.`
              : "Adds wrapping to this item without changing its quantity."}
      </p>
    </div>
  );
}
