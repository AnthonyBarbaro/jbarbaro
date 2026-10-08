import {
  findGiftWrapParent,
  getCartGiftWrapIssue,
  getGiftWrapGroup,
  getGiftWrapLinesForParent,
} from "@/lib/shopify/gift-wrap";
import type { ShopifyCartResponse } from "@/lib/shopify/types";

type CartAdditionFeedback = {
  confirmed: boolean;
  message: string | null;
};

export function getCartAdditionFeedback(
  payload: ShopifyCartResponse | null,
  merchandiseId: string,
  giftWrap = false,
): CartAdditionFeedback {
  const hasRequestedItem =
    Array.isArray(payload?.cart?.lines) &&
    payload.cart.lines.some((line) => line.variantId === merchandiseId && line.quantity > 0);
  let hasRequestedGiftWrap = !giftWrap;

  if (giftWrap && payload?.cart && payload.giftWrapGroupId) {
    const parent = findGiftWrapParent(payload.cart, payload.giftWrapGroupId);
    const wrapLines = parent ? getGiftWrapLinesForParent(payload.cart, parent) : [];

    hasRequestedGiftWrap = Boolean(
      parent?.variantId === merchandiseId &&
      parent.quantity === 1 &&
      wrapLines.length === 1 &&
      wrapLines[0].quantity === 1 &&
      getGiftWrapGroup(wrapLines[0]) === payload.giftWrapGroupId &&
      getCartGiftWrapIssue(payload.cart) === null,
    );
  }

  const confirmed =
    payload?.confirmed === true && Boolean(hasRequestedItem) && hasRequestedGiftWrap;

  return {
    confirmed,
    message: confirmed
      ? null
      : payload?.message ||
        "We couldn't confirm this addition. Review your bag before adding this item again.",
  };
}
