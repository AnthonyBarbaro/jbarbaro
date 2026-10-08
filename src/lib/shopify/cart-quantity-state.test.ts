import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCartQuantityPayload,
  getCartDisplayWarnings,
  getRemainingCartVariantQuantity,
  getVariantCartQuantity,
  type CartQuantityState,
} from "@/lib/shopify/cart-quantity-state";
import type {
  ShopifyCartLine,
  ShopifyCartResponse,
  ShopifyCartSnapshot,
} from "@/lib/shopify/types";

function line(id: string, variantId: string, quantity: number): ShopifyCartLine {
  const price = { amount: "10", currencyCode: "USD" };
  return {
    id,
    variantId,
    quantity,
    variantTitle: "M",
    productTitle: "Test shirt",
    productHandle: "test-shirt",
    productType: "Shirt",
    selectedOptions: [{ name: "Size", value: "M" }],
    image: null,
    unitPrice: price,
    totalPrice: { ...price, amount: String(quantity * 10) },
    variants: [],
  };
}

function cart(lines: ShopifyCartLine[], session = "cart-one"): ShopifyCartSnapshot {
  const price = {
    amount: String(lines.reduce((total, item) => total + item.quantity * 10, 0)),
    currencyCode: "USD",
  };
  return {
    totalQuantity: lines.reduce((total, item) => total + item.quantity, 0),
    checkoutUrl: `https://checkout.example.test/${session}`,
    subtotal: price,
    total: price,
    tax: null,
    lines,
  };
}

function payload(snapshot: ShopifyCartSnapshot | null, target?: string): ShopifyCartResponse {
  return {
    configured: true,
    cart: snapshot,
    warnings: target
      ? [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: "Quantity adjusted.", target }]
      : [],
    userErrors: [],
  };
}

function emptyState(): CartQuantityState {
  return { cart: null, limits: new Map() };
}

test("unknown inventory does not create a quantity ceiling", () => {
  const state = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("shirt", "shirt-m", 1)])),
  );
  assert.equal(getRemainingCartVariantQuantity(state, "shirt-m"), null);
  assert.equal(getVariantCartQuantity(state.cart, "shirt-m"), 1);
});

test("stock ceilings apply to the same variant across wrapped and unwrapped items", () => {
  const wrapped = {
    ...line("wrapped", "shirt-m", 1),
    attributes: [{ key: "_gift_wrap_group", value: "group" }],
  };
  const plain = line("plain", "shirt-m", 1);
  const otherSize = line("large", "shirt-l", 2);
  const state = applyCartQuantityPayload(
    emptyState(),
    payload(cart([wrapped, plain, otherSize]), "plain"),
  );
  assert.equal(state.limits.get("shirt-m"), 2);
  assert.equal(getRemainingCartVariantQuantity(state, "shirt-m"), 0);
  assert.equal(getRemainingCartVariantQuantity(state, "shirt-l"), null);
});

test("explicit refresh keeps an observed ceiling when warning messages clear", () => {
  const snapshot = cart([line("shirt", "shirt-m", 1)]);
  const capped = applyCartQuantityPayload(emptyState(), payload(snapshot, "shirt"));
  const refreshed = applyCartQuantityPayload(capped, payload(snapshot));
  assert.equal(refreshed.limits.get("shirt-m"), 1);
  assert.equal(getRemainingCartVariantQuantity(refreshed, "shirt-m"), 0);
});

test("decreasing quantity frees only the observed same-variant budget", () => {
  const capped = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("shirt", "shirt-m", 2)]), "shirt"),
  );
  const decreased = applyCartQuantityPayload(capped, payload(cart([line("shirt", "shirt-m", 1)])));
  assert.equal(decreased.limits.get("shirt-m"), 2);
  assert.equal(getRemainingCartVariantQuantity(decreased, "shirt-m"), 1);
});

test("removed variants, new sessions and expiry clear old ceilings", () => {
  const capped = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("shirt", "shirt-m", 1)]), "shirt"),
  );
  assert.equal(applyCartQuantityPayload(capped, payload(cart([]))).limits.size, 0);
  assert.equal(
    applyCartQuantityPayload(capped, payload(cart([line("shirt", "shirt-m", 1)], "cart-two")))
      .limits.size,
    0,
  );
  assert.equal(applyCartQuantityPayload(capped, payload(null)).limits.size, 0);
});

test("higher accepted quantities replace stale ceilings without limiting restocks", () => {
  const capped = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("shirt", "shirt-m", 1)]), "shirt"),
  );
  const accepted = applyCartQuantityPayload(capped, payload(cart([line("shirt", "shirt-m", 2)])));
  assert.equal(accepted.limits.has("shirt-m"), false);
  const recapped = applyCartQuantityPayload(
    capped,
    payload(cart([line("shirt", "shirt-m", 2)]), "shirt"),
  );
  assert.equal(recapped.limits.get("shirt-m"), 2);
});

test("unknown mutation results preserve known quantities and ceilings", () => {
  const capped = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("shirt", "shirt-m", 1)]), "shirt"),
  );
  assert.equal(
    applyCartQuantityPayload(capped, {
      configured: true,
      confirmed: false,
      warnings: [],
      userErrors: [],
    }),
    capped,
  );
});

test("incomplete snapshots cannot clear a ceiling or enable another addition", () => {
  const capped = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("shirt", "shirt-m", 1)]), "shirt"),
  );
  const incomplete = { ...cart([]), totalQuantity: 1 };
  const state = applyCartQuantityPayload(capped, payload(incomplete));
  assert.equal(state.limits.get("shirt-m"), 1);
  assert.equal(getRemainingCartVariantQuantity(state, "shirt-m"), 0);
});

test("a returned sold-out placeholder establishes an explicit zero ceiling", () => {
  const state = applyCartQuantityPayload(
    emptyState(),
    payload(cart([line("ghost", "shirt-m", 0)]), "ghost"),
  );
  const refreshed = applyCartQuantityPayload(state, payload(cart([line("ghost", "shirt-m", 0)])));
  assert.equal(refreshed.limits.get("shirt-m"), 0);
  assert.equal(getRemainingCartVariantQuantity(refreshed, "shirt-m"), 0);
});

test("handled stock warnings use row limits while unrelated warnings remain visible", () => {
  const snapshot = cart([line("shirt", "shirt-m", 1)]);
  const stock = {
    code: "MERCHANDISE_NOT_ENOUGH_STOCK",
    message: "Stock adjusted.",
    target: "shirt",
  };
  const other = { code: "DISCOUNT_NOT_FOUND", message: "Discount unavailable.", target: "shirt" };
  assert.deepEqual(getCartDisplayWarnings(snapshot, [stock, other]), [other]);
});

test("duplicate remaining messages are shown once without hiding unknown targets", () => {
  const snapshot = cart([line("shirt", "shirt-m", 1)]);
  const unknown = {
    code: "MERCHANDISE_NOT_ENOUGH_STOCK",
    message: "Review this item.",
    target: "missing",
  };
  const other = { code: "UNKNOWN", message: "Another adjustment.", target: null };
  assert.deepEqual(getCartDisplayWarnings(snapshot, [unknown, unknown, other, other]), [
    unknown,
    other,
  ]);
});

test("incomplete carts retain stock warnings instead of inferring compact limits", () => {
  const incomplete = { ...cart([line("shirt", "shirt-m", 1)]), totalQuantity: 2 };
  const warning = {
    code: "MERCHANDISE_NOT_ENOUGH_STOCK",
    message: "Review quantity.",
    target: "shirt",
  };
  assert.deepEqual(getCartDisplayWarnings(incomplete, [warning]), [warning]);
});
