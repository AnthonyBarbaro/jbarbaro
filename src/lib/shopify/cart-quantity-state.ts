import { getCartVariantQuantityLimits } from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartResponse,
  ShopifyCartSnapshot,
  ShopifyCartWarning,
  ShopifyVariantInventory,
} from "@/lib/shopify/types";

export type CartQuantityState = {
  cart: ShopifyCartSnapshot | null;
  limits: ReadonlyMap<string, number>;
  inventory?: ReadonlyMap<string, ShopifyVariantInventory>;
};

export function getInventoryQuantityLimit(
  inventory: ShopifyVariantInventory | undefined,
): number | null {
  if (!inventory || inventory.currentlyNotInStock) {
    return null;
  }
  if (inventory.availableForSale === false) {
    return 0;
  }
  const quantity = inventory.quantityAvailable;
  return typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity >= 0
    ? quantity
    : null;
}

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
    return { cart: null, limits: new Map(), inventory: new Map() };
  }

  const sameSession = state.cart?.checkoutUrl === cart.checkoutUrl;
  const limits = new Map(sameSession ? state.limits : []);
  const inventory = new Map(sameSession ? state.inventory : []);
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
    if (cart.lines.length === 0) {
      inventory.clear();
    }
  }

  for (const line of cart.lines) {
    for (const variant of line.variants) {
      if (variant.quantityAvailable !== undefined || variant.currentlyNotInStock) {
        inventory.set(variant.id, variant);
        if (getInventoryQuantityLimit(variant) !== null || variant.currentlyNotInStock) {
          limits.delete(variant.id);
        }
      }
    }
  }
  // The exact cart variant can sit outside the product's first page of variants.
  for (const line of cart.lines) {
    if (line.variantId && line.inventory) {
      inventory.set(line.variantId, line.inventory);
      if (
        getInventoryQuantityLimit(line.inventory) !== null ||
        line.inventory.currentlyNotInStock
      ) {
        limits.delete(line.variantId);
      }
    }
  }

  for (const [merchandiseId, limit] of getCartVariantQuantityLimits(cart, payload.warnings ?? [])) {
    limits.set(merchandiseId, limit);
  }

  return { cart, limits, inventory };
}

export function getCartVariantQuantityLimit(
  state: CartQuantityState,
  merchandiseId: string,
  fallbackInventory?: ShopifyVariantInventory,
): number | null {
  const inventory = state.inventory?.get(merchandiseId) ?? fallbackInventory;
  const inventoryLimit = getInventoryQuantityLimit(inventory);
  const observedLimit = state.limits.get(merchandiseId);
  if (observedLimit === undefined) {
    return inventoryLimit;
  }
  return inventoryLimit === null ? observedLimit : Math.min(inventoryLimit, observedLimit);
}

export function getRemainingCartVariantQuantity(
  state: CartQuantityState,
  merchandiseId: string,
  fallbackInventory?: ShopifyVariantInventory,
): number | null {
  if (
    state.cart &&
    state.cart.lines.reduce((quantity, line) => quantity + line.quantity, 0) !==
      state.cart.totalQuantity
  ) {
    return 0;
  }

  const limit = getCartVariantQuantityLimit(state, merchandiseId, fallbackInventory);
  if (limit === null) {
    return null;
  }

  return Math.max(0, limit - getVariantCartQuantity(state.cart, merchandiseId));
}
