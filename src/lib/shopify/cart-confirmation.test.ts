import assert from "node:assert/strict";
import test from "node:test";

import {
  confirmCartLinesAdded,
  confirmCartLinesRemoved,
  confirmCartLinesUpdated,
} from "@/lib/shopify/cart-confirmation";
import { GIFT_WRAP_GROUP_ATTRIBUTE } from "@/lib/shopify/gift-wrap";
import type { ShopifyCartLine, ShopifyCartSnapshot } from "@/lib/shopify/types";

function cart(
  lines: Array<
    Pick<ShopifyCartLine, "id" | "variantId" | "quantity"> &
      Partial<Pick<ShopifyCartLine, "attributes" | "parentLineId" | "productHandle">>
  >,
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
      productHandle: line.productHandle ?? "test-shirt",
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

test("wrapped adds confirm native attachment rather than the service variant total alone", () => {
  const attributes = [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "new-group" }];
  const before = cart([{ id: "existing", variantId: "small-navy", quantity: 2 }]);
  const parent = { id: "new-parent", variantId: "small-navy", quantity: 1, attributes };
  const child = {
    id: "wrap",
    variantId: "gift-wrap",
    quantity: 1,
    attributes,
    parentLineId: parent.id,
    productHandle: "gift-wrap",
  };
  const requested = [
    { merchandiseId: "small-navy", quantity: 1, attributes },
    { merchandiseId: "gift-wrap", quantity: 1, attributes, parent: { lineId: parent.id } },
  ];

  assert.equal(
    confirmCartLinesAdded(before, cart([...before.lines, parent, child]), requested),
    true,
  );
  assert.equal(
    confirmCartLinesAdded(
      before,
      cart([...before.lines, parent, { ...child, parentLineId: "existing" }]),
      requested,
    ),
    false,
  );
  assert.equal(
    confirmCartLinesAdded(
      before,
      cart([...before.lines, parent, { ...child, parentLineId: null }]),
      requested,
    ),
    false,
  );
});

test("wrap requests require the server-generated groups on the returned parent and child", () => {
  const attributes = [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "new-group" }];
  const parent = { id: "parent", variantId: "small-navy", quantity: 1, attributes };
  const child = {
    id: "wrap",
    variantId: "gift-wrap",
    quantity: 1,
    attributes,
    parentLineId: parent.id,
    productHandle: "gift-wrap",
  };
  const requested = [
    { merchandiseId: "small-navy", quantity: 1, attributes },
    { merchandiseId: "gift-wrap", quantity: 1, attributes, parent: { lineId: parent.id } },
  ];

  assert.equal(
    confirmCartLinesAdded(null, cart([parent, { ...child, attributes: [] }]), requested),
    false,
  );
  assert.equal(
    confirmCartLinesAdded(null, cart([{ ...parent, attributes: [] }, child]), requested),
    false,
  );
});

test("parent creation can be confirmed before a gift-wrap charge is added", () => {
  const attributes = [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "new-group" }];

  assert.equal(
    confirmCartLinesAdded(
      null,
      cart([{ id: "parent", variantId: "small-navy", quantity: 1, attributes }]),
      [{ merchandiseId: "small-navy", quantity: 1, attributes }],
    ),
    true,
  );
});

test("wrapped size changes confirm the stable group after Shopify changes line IDs", () => {
  const attributes = [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "stable-group" }];
  const before = cart([
    { id: "small", variantId: "small-navy", quantity: 1, attributes },
    {
      id: "wrap",
      variantId: "gift-wrap",
      quantity: 1,
      attributes,
      productHandle: "gift-wrap",
      parentLineId: "small",
    },
  ]);
  const after = cart([
    { id: "large-new", variantId: "large-navy", quantity: 1, attributes },
    {
      id: "wrap-new",
      variantId: "gift-wrap",
      quantity: 1,
      attributes,
      productHandle: "gift-wrap",
      parentLineId: "large-new",
    },
  ]);
  const requested = [{ id: "small", merchandiseId: "large-navy" }];

  assert.equal(confirmCartLinesUpdated(before, after, requested), true);
  assert.equal(
    confirmCartLinesUpdated(
      before,
      { ...after, lines: after.lines.map((line) => ({ ...line, attributes: [] })) },
      requested,
    ),
    false,
  );
  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([
        { ...after.lines[0], attributes: [] },
        { ...after.lines[1], parentLineId: "wrong-parent" },
      ]),
      requested,
    ),
    false,
  );
  assert.equal(confirmCartLinesUpdated(before, cart([after.lines[0]]), requested), false);
});

test("parent quantity updates must keep their exact attached wrap quantity in sync", () => {
  const attributes = [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "stable-group" }];
  const before = cart([
    { id: "parent", variantId: "small-navy", quantity: 1, attributes },
    {
      id: "wrap",
      variantId: "gift-wrap",
      quantity: 1,
      attributes,
      productHandle: "gift-wrap",
      parentLineId: "parent",
    },
  ]);
  const requested = [
    { id: "parent", quantity: 2 },
    { id: "wrap", quantity: 2 },
  ];
  const after = cart(before.lines.map((line) => ({ ...line, quantity: 2 })));

  assert.equal(confirmCartLinesUpdated(before, after, requested), true);
  assert.equal(
    confirmCartLinesUpdated(
      before,
      cart([{ ...before.lines[0], quantity: 2 }, before.lines[1]]),
      requested,
    ),
    false,
  );
});
