import assert from "node:assert/strict";
import test from "node:test";

import { getCartAdditionFeedback } from "@/lib/shopify/cart-feedback";
import type { ShopifyCartResponse, ShopifyCartSnapshot } from "@/lib/shopify/types";

function response(variantId: string, quantity = 1): ShopifyCartResponse {
  const money = { amount: "100.00", currencyCode: "USD" };
  const cart: ShopifyCartSnapshot = {
    totalQuantity: quantity,
    checkoutUrl: "https://example.com/checkout",
    subtotal: money,
    total: money,
    tax: null,
    lines: [
      {
        id: "line-1",
        quantity,
        variantId,
        variantTitle: "M",
        productTitle: "Test shirt",
        productHandle: "test-shirt",
        productType: "Shirt",
        selectedOptions: [{ name: "Size", value: "M" }],
        image: null,
        unitPrice: money,
        totalPrice: money,
        variants: [],
      },
    ],
  };

  return { configured: true, cart, confirmed: true, warnings: [], userErrors: [] };
}

test("confirms only the requested variant after server quantity verification", () => {
  assert.deepEqual(getCartAdditionFeedback(response("variant-m"), "variant-m"), {
    confirmed: true,
    message: null,
  });
  assert.equal(getCartAdditionFeedback(response("variant-l"), "variant-m").confirmed, false);
});

test("does not announce success for an unchanged or stock-adjusted addition", () => {
  const payload = response("variant-m");
  payload.confirmed = false;
  payload.message = "Only one is available. Review your bag.";
  payload.warnings = [
    { code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: payload.message, target: "line-1" },
  ];

  assert.deepEqual(getCartAdditionFeedback(payload, "variant-m"), {
    confirmed: false,
    message: payload.message,
  });
});

test("does not infer confirmation from a successful-looking cart response", () => {
  const payload = response("variant-m");
  delete payload.confirmed;

  assert.equal(getCartAdditionFeedback(payload, "variant-m").confirmed, false);
  assert.equal(getCartAdditionFeedback(response("variant-m", 0), "variant-m").confirmed, false);
});

test("missing cart responses provide review guidance rather than success", () => {
  const payload: ShopifyCartResponse = {
    configured: true,
    cart: null,
    confirmed: true,
    warnings: [],
    userErrors: [],
  };

  assert.equal(getCartAdditionFeedback(payload, "variant-m").confirmed, false);
  assert.match(getCartAdditionFeedback(null, "variant-m").message ?? "", /Review your bag/);
});
