import { getCartVariantQuantityLimits } from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartResponse,
  ShopifyCartSnapshot,
  ShopifyCartWarning,
} from "@/lib/shopify/types";

export type CartQuantityState = {
  cart: ShopifyCartSnapshot | null;
  limits: ReadonlyMap<string, number>;
};

export function getCartDisplayWarnings(
  cart: ShopifyCartSnapshot | null,
  warnings: readonly ShopifyCartWarning[],
): ShopifyCartWarning[] {
  const limits = getCartVariantQuantityLimits(cart, warnings);
  const seenMessages = new Set<string>();

  return warnings.filter((warning) => {
    const target = cart?.lines.find((line) => line.id === warning.target);
    if (
      (warning.code === "MERCHANDISE_OUT_OF_STOCK" ||
        warning.code === "MERCHANDISE_NOT_ENOUGH_STOCK") &&
      target?.variantId &&
      limits.has(target.variantId)
    ) {
      return false;
    }

    if (seenMessages.has(warning.message)) {
      return false;
    }
    seenMessages.add(warning.message);
    return true;
  });
}

export function getVariantCartQuantity(
  cart: ShopifyCartSnapshot | null,
  merchandiseId: string,
): number {
  return (cart?.lines ?? []).reduce(
    (quantity, line) =>
      quantity + (line.variantId === merchandiseId && line.quantity > 0 ? line.quantity : 0),
    0,
  );
}

export function applyCartQuantityPayload(
  state: CartQuantityState,
  payload: ShopifyCartResponse,
): CartQuantityState {
  if (!("cart" in payload)) {
    return state;
  }

  const cart = payload.cart ?? null;
  if (!cart) {
    return { cart: null, limits: new Map() };
  }

  const sameSession = state.cart?.checkoutUrl === cart.checkoutUrl;
  const limits = new Map(sameSession ? state.limits : []);
  const hasCompleteCart =
    cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) === cart.totalQuantity;

  if (hasCompleteCart) {
    for (const [merchandiseId, limit] of limits) {
      if (
        !cart.lines.some((line) => line.variantId === merchandiseId) ||
        getVariantCartQuantity(cart, merchandiseId) > limit
      ) {
        limits.delete(merchandiseId);
      }
    }
  }

  for (const [merchandiseId, limit] of getCartVariantQuantityLimits(cart, payload.warnings ?? [])) {
    limits.set(merchandiseId, limit);
  }

  return { cart, limits };
}

export function getRemainingCartVariantQuantity(
  state: CartQuantityState,
  merchandiseId: string,
): number | null {
  const limit = state.limits.get(merchandiseId);
  if (limit === undefined) {
    return null;
  }

  if (
    state.cart &&
    state.cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) !==
      state.cart.totalQuantity
  ) {
    return 0;
  }

  return Math.max(0, limit - getVariantCartQuantity(state.cart, merchandiseId));
}
