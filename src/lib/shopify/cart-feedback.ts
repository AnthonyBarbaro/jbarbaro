import type { ShopifyCartResponse } from "@/lib/shopify/types";

type CartAdditionFeedback = {
  confirmed: boolean;
  message: string | null;
};

export function getCartAdditionFeedback(
  payload: ShopifyCartResponse | null,
  merchandiseId: string,
): CartAdditionFeedback {
  const hasRequestedItem =
    Array.isArray(payload?.cart?.lines) &&
    payload.cart.lines.some((line) => line.variantId === merchandiseId && line.quantity > 0);
  const confirmed = payload?.confirmed === true && Boolean(hasRequestedItem);

  return {
    confirmed,
    message: confirmed
      ? null
      : payload?.message ||
        "We couldn't confirm this addition. Review your bag before adding this item again.",
  };
}
