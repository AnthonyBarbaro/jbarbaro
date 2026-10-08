import assert from "node:assert/strict";
import test from "node:test";

import { getCartAdditionFeedback } from "@/lib/shopify/cart-feedback";
import { GIFT_WRAP_GROUP_ATTRIBUTE } from "@/lib/shopify/gift-wrap";
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

function wrappedResponse(): ShopifyCartResponse & { cart: ShopifyCartSnapshot } {
  const payload = response("variant-m");
  assert.ok(payload.cart);
  const parent = payload.cart.lines[0];
  parent.attributes = [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "receipt-group" }];
  payload.cart.lines.push({
    ...parent,
    id: "wrap-line",
    variantId: "wrap-variant",
    productTitle: "Gift Wrap",
    productHandle: "gift-wrap",
    parentLineId: parent.id,
    unitPrice: { amount: "6", currencyCode: "USD" },
    totalPrice: { amount: "6", currencyCode: "USD" },
  });
  payload.cart.totalQuantity = 2;
  payload.cart.subtotal = { amount: "106", currencyCode: "USD" };
  payload.cart.total = payload.cart.subtotal;

  return { ...payload, cart: payload.cart, giftWrapGroupId: "receipt-group" };
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

test("gift-wrap success requires the server receipt and its exact attached item", () => {
  assert.deepEqual(getCartAdditionFeedback(wrappedResponse(), "variant-m", true), {
    confirmed: true,
    message: null,
  });
  assert.equal(getCartAdditionFeedback(wrappedResponse(), "variant-other", true).confirmed, false);
  assert.equal(getCartAdditionFeedback(response("variant-m"), "variant-m", true).confirmed, false);
});

test("an existing wrapped item cannot stand in for the newly requested receipt group", () => {
  const payload = wrappedResponse();
  delete payload.giftWrapGroupId;
  assert.equal(getCartAdditionFeedback(payload, "variant-m", true).confirmed, false);
  payload.giftWrapGroupId = "new-request-group";
  assert.equal(getCartAdditionFeedback(payload, "variant-m", true).confirmed, false);
});

test("correct service quantity elsewhere in the bag cannot confirm a wrong-parent attachment", () => {
  const payload = wrappedResponse();
  const requestedParent = payload.cart.lines[0];
  payload.cart.lines.push({ ...requestedParent, id: "other-item", attributes: [] });
  payload.cart.totalQuantity = 3;
  payload.cart.lines[1].parentLineId = "other-item";

  assert.equal(getCartAdditionFeedback(payload, "variant-m", true).confirmed, false);
});

test("gift-wrap stock caps, duplicate charges, and missing relationships require review", () => {
  const capped = wrappedResponse();
  capped.cart.lines[1].quantity = 0;
  capped.cart.totalQuantity = 1;
  assert.equal(getCartAdditionFeedback(capped, "variant-m", true).confirmed, false);

  const duplicate = wrappedResponse();
  duplicate.cart.lines.push({ ...duplicate.cart.lines[1], id: "duplicate-wrap" });
  duplicate.cart.totalQuantity = 3;
  assert.equal(getCartAdditionFeedback(duplicate, "variant-m", true).confirmed, false);

  const orphan = wrappedResponse();
  orphan.cart.lines[1].parentLineId = null;
  assert.equal(getCartAdditionFeedback(orphan, "variant-m", true).confirmed, false);
});

test("an unchanged existing pair cannot imply success after a failed wrapped addition", () => {
  const payload = wrappedResponse();
  payload.confirmed = false;
  payload.message = "Gift wrap was not added. Review your bag before trying again.";

  assert.deepEqual(getCartAdditionFeedback(payload, "variant-m", true), {
    confirmed: false,
    message: payload.message,
  });
});

test("a product-page gift-wrap receipt confirms one added item rather than a merged quantity", () => {
  const payload = wrappedResponse();
  payload.cart.lines[0].quantity = 2;
  payload.cart.lines[1].quantity = 2;
  payload.cart.totalQuantity = 4;

  assert.equal(getCartAdditionFeedback(payload, "variant-m", true).confirmed, false);
});
