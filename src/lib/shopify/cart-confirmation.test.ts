import assert from "node:assert/strict";
import test from "node:test";

import {
  confirmCartLinesAdded,
  confirmCartLinesRemoved,
  confirmCartLinesUpdated,
} from "@/lib/shopify/cart-confirmation";
import type { ShopifyCartSnapshot } from "@/lib/shopify/types";

function cart(
  lines: Array<{ id: string; variantId: string; quantity: number }>,
): ShopifyCartSnapshot {
  const totalQuantity = lines.reduce((total, line) => total + line.quantity, 0);
  const money = { amount: String(totalQuantity * 50), currencyCode: "USD" };

  return {
    totalQuantity,
    checkoutUrl: "https://checkout.example.test/test-checkout",
    subtotal: money,
    total: money,
    tax: null,
    lines: lines.map((line) => ({
      ...line,
      variantTitle: null,
      productTitle: "Test Shirt",
      productHandle: "test-shirt",
      productType: "Shirt",
      selectedOptions: [],
      image: null,
      unitPrice: { amount: "50", currencyCode: "USD" },
      totalPrice: { amount: String(line.quantity * 50), currencyCode: "USD" },
      variants: [],
    })),
  };
}

test("confirms a fresh add only when the requested variant quantity was accepted", () => {
  const requested = [{ merchandiseId: "small-navy", quantity: 2 }];

  assert.equal(
    confirmCartLinesAdded(
      null,
      cart([{ id: "new", variantId: "small-navy", quantity: 2 }]),
      requested,
    ),
    true,
  );
  assert.equal(
    confirmCartLinesAdded(
      null,
      cart([{ id: "new", variantId: "small-navy", quantity: 1 }]),
      requested,
    ),
    false,
  );
  assert.equal(confirmCartLinesAdded(null, null, requested), false);
});

test("same-variant additions require the requested increase over the existing quantity", () => {
  const before = cart([{ id: "existing", variantId: "small-navy", quantity: 3 }]);
  const requested = [{ merchandiseId: "small-navy", quantity: 2 }];

  assert.equal(
    confirmCartLinesAdded(
      before,
      cart([{ id: "existing", variantId: "small-navy", quantity: 5 }]),
      requested,
    ),
    true,
  );
  assert.equal(
    confirmCartLinesAdded(
      before,
      cart([{ id: "existing", variantId: "small-navy", quantity: 4 }]),
      requested,
    ),
    false,
  );
  assert.equal(confirmCartLinesAdded(before, before, requested), false);
});

test("an unrelated variant increasing cannot confirm a requested size add", () => {
  const before = cart([{ id: "other", variantId: "large-navy", quantity: 1 }]);
  const after = cart([{ id: "other", variantId: "large-navy", quantity: 3 }]);

  assert.equal(
    confirmCartLinesAdded(before, after, [{ merchandiseId: "small-navy", quantity: 2 }]),
    false,
  );
});

test("aggregates duplicate requested variants and split returned lines", () => {
  const before = cart([{ id: "existing", variantId: "small-navy", quantity: 2 }]);
  const requested = [
    { merchandiseId: "small-navy", quantity: 2 },
    { merchandiseId: "small-navy", quantity: 1 },
  ];

  assert.equal(
    confirmCartLinesAdded(
      before,
      cart([
        { id: "existing", variantId: "small-navy", quantity: 3 },
        { id: "separate", variantId: "small-navy", quantity: 2 },
      ]),
      requested,
    ),
    true,
  );
  assert.equal(
    confirmCartLinesAdded(
      before,
      cart([{ id: "existing", variantId: "small-navy", quantity: 4 }]),
      requested,
    ),
    false,
  );
});

test("multi-variant additions are unconfirmed when just one requested line is accepted", () => {
  assert.equal(
    confirmCartLinesAdded(null, cart([{ id: "small", variantId: "small-navy", quantity: 1 }]), [
      { merchandiseId: "small-navy", quantity: 1 },
      { merchandiseId: "large-navy", quantity: 1 },
    ]),
    false,
  );
});

test("an incomplete cart response cannot confirm a requested change", () => {
  const complete = cart([{ id: "existing", variantId: "small-navy", quantity: 1 }]);
  const truncated = { ...complete, totalQuantity: 51 };

  assert.equal(
    confirmCartLinesAdded(null, truncated, [{ merchandiseId: "small-navy", quantity: 1 }]),
    false,
  );
  assert.equal(
    confirmCartLinesAdded(truncated, complete, [{ merchandiseId: "small-navy", quantity: 1 }]),
    false,
  );
  assert.equal(
    confirmCartLinesUpdated(complete, truncated, [{ id: "existing", quantity: 1 }]),
    false,
  );
  assert.equal(confirmCartLinesRemoved(truncated, ["absent-line"]), false);
});

test("quantity edits confirm the requested quantity rather than an unchanged or stock-capped line", () => {
  const before = cart([{ id: "existing", variantId: "small-navy", quantity: 1 }]);
  const requested = [{ id: "existing", quantity: 3 }];

  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ id: "existing", variantId: "small-navy", quantity: 3 }]),
      requested,
    ),
    true,
  );
  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ id: "existing", variantId: "small-navy", quantity: 2 }]),
      requested,
    ),
    false,
  );
  assert.equal(confirmCartLinesUpdated(before, before, requested), false);
  assert.equal(confirmCartLinesUpdated(before, null, requested), false);
});

test("another line of the same variant cannot conceal an unchanged targeted quantity", () => {
  const before = cart([
    { id: "target", variantId: "small-navy", quantity: 1 },
    { id: "other", variantId: "small-navy", quantity: 1 },
  ]);
  const requested = [{ id: "target", quantity: 2 }];

  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([
        { id: "target", variantId: "small-navy", quantity: 1 },
        { id: "other", variantId: "small-navy", quantity: 2 },
      ]),
      requested,
    ),
    false,
  );
  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([
        { id: "target", variantId: "small-navy", quantity: 2 },
        { id: "other", variantId: "small-navy", quantity: 1 },
      ]),
      requested,
    ),
    true,
  );
});

test("variant changes confirm the requested size and preserve the existing quantity", () => {
  const before = cart([{ id: "existing", variantId: "small-navy", quantity: 2 }]);
  const requested = [{ id: "existing", merchandiseId: "large-navy" }];

  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ id: "existing", variantId: "large-navy", quantity: 2 }]),
      requested,
    ),
    true,
  );
  assert.equal(confirmCartLinesUpdated(before, before, requested), false);
  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ id: "existing", variantId: "large-navy", quantity: 1 }]),
      requested,
    ),
    false,
  );
});

test("variant changes account for Shopify merging into a line already in the bag", () => {
  const before = cart([
    { id: "small", variantId: "small-navy", quantity: 1 },
    { id: "large", variantId: "large-navy", quantity: 2 },
  ]);
  const requested = [{ id: "small", merchandiseId: "large-navy", quantity: 3 }];

  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ id: "large", variantId: "large-navy", quantity: 5 }]),
      requested,
    ),
    true,
  );
  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ id: "large", variantId: "large-navy", quantity: 4 }]),
      requested,
    ),
    false,
  );
  assert.equal(confirmCartLinesUpdated(before, before, requested), false);
});

test("an absent source line cannot confirm a stale requested update", () => {
  const before = cart([{ id: "existing", variantId: "small-navy", quantity: 1 }]);

  assert.equal(confirmCartLinesUpdated(before, before, [{ id: "stale-line", quantity: 1 }]), false);
});

test("removal confirms all requested line IDs are gone from an actual returned cart", () => {
  const remaining = cart([{ id: "keep", variantId: "large-navy", quantity: 1 }]);

  assert.equal(confirmCartLinesRemoved(remaining, ["remove-one", "remove-two"]), true);
  assert.equal(confirmCartLinesRemoved(remaining, ["remove-one", "keep"]), false);
  assert.equal(confirmCartLinesRemoved(cart([]), ["last-line"]), true);
  assert.equal(confirmCartLinesRemoved(null, ["last-line"]), false);
});
