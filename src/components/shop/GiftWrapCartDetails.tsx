"use client";

import { Gift } from "lucide-react";
import type { ReactElement } from "react";

import { useCartQuantityStatus } from "@/components/shop/CartQuantityContext";
import {
  findGiftWrapParent,
  getGiftWrapGroup,
  getGiftWrapLinesForParent,
} from "@/lib/shopify/gift-wrap";
import type { ShopifyCartSnapshot } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type GiftWrapCartDetailsProps = {
  cart: ShopifyCartSnapshot;
  line: ShopifyCartSnapshot["lines"][number];
  parentLine?: ShopifyCartSnapshot["lines"][number] | null;
  parentMeta?: string | null;
  className?: string;
  focusTargetId?: string;
  disabled: boolean;
  pending: boolean;
  updatePending?: boolean;
  onRemove: () => void;
  onUpdate?: () => void;
};

export function GiftWrapCartDetails({
  cart,
  line,
  parentLine,
  parentMeta,
  className,
  focusTargetId,
  disabled,
  pending,
  updatePending = false,
  onRemove,
  onUpdate,
}: GiftWrapCartDetailsProps): ReactElement {
  const { getRemainingQuantity } = useCartQuantityStatus();
  const attachedItem = parentLine
    ? `${parentLine.productTitle || "Selected item"}${parentMeta ? ` · ${parentMeta}` : ""}`
    : null;
  const canRemove = line.instructions?.canRemove !== false;
  const hasQuantityMismatch = Boolean(parentLine && line.quantity !== parentLine.quantity);
  const group = getGiftWrapGroup(line);
  const canUpdateQuantity = Boolean(
    parentLine &&
    parentLine.quantity >= 1 &&
    hasQuantityMismatch &&
    line.parentLineId === parentLine.id &&
    group &&
    group === getGiftWrapGroup(parentLine) &&
    findGiftWrapParent(cart, group)?.id === parentLine.id &&
    getGiftWrapLinesForParent(cart, parentLine).length === 1 &&
    parentLine.instructions?.canUpdateQuantity !== false &&
    line.instructions?.canUpdateQuantity !== false &&
    onUpdate,
  );
  const remaining = line.variantId ? getRemainingQuantity(line.variantId) : null;
  const stockLimitReached = Boolean(
    parentLine && remaining !== null && parentLine.quantity - line.quantity > remaining,
  );

  function focusItem(): void {
    const focusTarget = focusTargetId
      ? document.getElementById(focusTargetId)
      : document.querySelector<HTMLElement>("#main-content h1");
    if (focusTarget) {
      focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
  }

  return (
    <div className={cn("border-t border-ink/10 pt-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Gift className="h-4 w-4 shrink-0 text-deep-teal" aria-hidden />
          {parentLine ? "Gift wrap" : "Unattached gift wrap"}
        </p>
        <p className="text-sm font-semibold text-ink">
          {formatMoney(line.totalPrice.amount, line.totalPrice.currencyCode)}
        </p>
      </div>
      {attachedItem ? (
        <p className="mt-1 text-xs leading-5 text-ink [overflow-wrap:anywhere]">
          For {attachedItem}
        </p>
      ) : (
        <p className="mt-1 text-xs leading-5 text-ink">
          This gift wrap isn&apos;t attached to an item. Remove it before checkout.
        </p>
      )}
      <p className="mt-1 text-xs leading-5 text-smoke">
        {line.quantity > 0
          ? `${line.quantity} ${line.quantity === 1 ? "item" : "items"} × `
          : "Quantity needs review · "}
        {formatMoney(line.unitPrice.amount, line.unitPrice.currencyCode)} per item
      </p>
      {parentLine ? (
        <p className="mt-1 text-xs leading-5 text-smoke">
          {hasQuantityMismatch
            ? canUpdateQuantity
              ? stockLimitReached
                ? "No additional gift wrap available. Reduce item quantity or remove gift wrap."
                : "Update gift wrap to match this item’s quantity, or remove gift wrap."
              : "Gift wrap doesn’t match this item’s quantity. Remove gift wrap or refresh your bag."
            : "Quantity follows this item. Removing the item also removes its gift wrap."}
        </p>
      ) : null}
      {canUpdateQuantity ? (
        <button
          type="button"
          disabled={disabled || stockLimitReached}
          onClick={() => {
            focusItem();
            onUpdate?.();
          }}
          aria-label={`Update gift wrap quantity for ${attachedItem}`}
          className="mt-2 mr-4 inline-flex min-h-11 items-center rounded-md border border-deep-teal/25 bg-white px-3 text-xs font-semibold text-deep-teal transition-colors hover:border-deep-teal hover:bg-stone/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {updatePending ? "Updating..." : "Update gift wrap"}
        </button>
      ) : null}
      {!canRemove ? (
        <p className="mt-1 text-xs leading-5 text-ink">
          {parentLine
            ? "Gift wrap can’t be removed separately from this item."
            : "Gift wrap can’t be removed right now. Refresh your bag to review it."}
        </p>
      ) : null}
      <button
        type="button"
        disabled={disabled || !canRemove}
        onClick={() => {
          focusItem();
          onRemove();
        }}
        aria-label={
          attachedItem ? `Remove gift wrap for ${attachedItem}` : "Remove unattached gift wrap"
        }
        className="mt-1 inline-flex min-h-11 items-center rounded-sm text-xs font-semibold text-deep-teal underline underline-offset-4 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Removing gift wrap..." : "Remove gift wrap"}
      </button>
    </div>
  );
}
