import assert from "node:assert/strict";
import test from "node:test";

import {
  GIFT_WRAP_GROUP_ATTRIBUTE,
  findGiftWrapParent,
  getCartGiftWrapIssue,
  getCartItemQuantity,
  getCartVariantQuantityLimits,
  getGiftWrapGroup,
  getGiftWrapLinesForParent,
  isGiftWrapLine,
  isCartLinePlaceholder,
} from "@/lib/shopify/gift-wrap";
import type { ShopifyCartLine, ShopifyCartSnapshot, ShopifyCartWarning } from "@/lib/shopify/types";

function line(id: string, overrides: Partial<ShopifyCartLine> = {}): ShopifyCartLine {
  return {
    id,
    quantity: 1,
    variantId: "shirt-medium",
    variantTitle: "Medium / Navy",
    productTitle: "Test Shirt",
    productHandle: "test-shirt",
    productType: "Shirt",
    selectedOptions: [{ name: "Size", value: "Medium" }],
    image: null,
    unitPrice: { amount: "100", currencyCode: "USD" },
    totalPrice: { amount: "100", currencyCode: "USD" },
    variants: [],
    ...overrides,
  };
}

function wrappedParent(id: string, group: string, quantity = 1): ShopifyCartLine {
  return line(id, {
    quantity,
    attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group }],
  });
}

function giftWrap(id: string, parent: ShopifyCartLine): ShopifyCartLine {
  return line(id, {
    quantity: parent.quantity,
    variantId: "gift-wrap-variant",
    variantTitle: "Default Title",
    productTitle: "Gift Wrap",
    productHandle: "gift-wrap",
    productType: "Service",
    selectedOptions: [],
    attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: getGiftWrapGroup(parent) ?? "" }],
    parentLineId: parent.id,
    unitPrice: { amount: "6", currencyCode: "USD" },
    totalPrice: { amount: String(6 * parent.quantity), currencyCode: "USD" },
  });
}

function cart(lines: ShopifyCartLine[]): ShopifyCartSnapshot {
  const money = {
    amount: String(lines.reduce((amount, item) => amount + Number(item.totalPrice.amount), 0)),
    currencyCode: "USD",
  };

  return {
    totalQuantity: lines.reduce((quantity, item) => quantity + item.quantity, 0),
    checkoutUrl: "https://checkout.example.test/checkout",
    subtotal: money,
    total: money,
    tax: null,
    lines,
  };
}

test("gift wrap is recognized by its product handle rather than a clothing title", () => {
  assert.equal(
    isGiftWrapLine(line("clothing", { productTitle: "Gift Wrap Printed Shirt" })),
    false,
  );
  assert.equal(isGiftWrapLine(line("wrap", { productHandle: "gift-wrap" })), true);
  assert.equal(isGiftWrapLine(line("missing", { productHandle: null })), false);
});

test("requires one nonempty correlation attribute instead of accepting ambiguous groups", () => {
  assert.equal(getGiftWrapGroup(wrappedParent("item", "group-a")), "group-a");
  assert.equal(getGiftWrapGroup(line("missing")), null);
  assert.equal(getGiftWrapGroup(wrappedParent("blank", "  ")), null);
  assert.equal(
    getGiftWrapGroup(
      line("duplicate", {
        attributes: [
          { key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "group-a" },
          { key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "group-b" },
        ],
      }),
    ),
    null,
  );
});

test("associates repeated clothing variants with their exact native parent lines", () => {
  const first = wrappedParent("first", "group-first");
  const second = wrappedParent("second", "group-second");
  const firstWrap = giftWrap("wrap-first", first);
  const secondWrap = giftWrap("wrap-second", second);
  const bag = cart([secondWrap, first, second, firstWrap, line("unwrapped")]);

  assert.deepEqual(getGiftWrapLinesForParent(bag, first), [firstWrap]);
  assert.deepEqual(getGiftWrapLinesForParent(bag, second), [secondWrap]);
  assert.equal(findGiftWrapParent(bag, "group-first"), first);
  assert.equal(findGiftWrapParent(bag, "group-second"), second);
  assert.equal(getCartGiftWrapIssue(bag), null);
});

test("a copied group attribute cannot invent a native item association", () => {
  const parent = wrappedParent("parent", "group-parent");
  const orphan = { ...giftWrap("wrap", parent), parentLineId: null };
  const bag = cart([parent, orphan]);

  assert.deepEqual(getGiftWrapLinesForParent(bag, parent), []);
  assert.match(getCartGiftWrapIssue(bag) ?? "", /missing its attached item/);
});

test("item counts exclude gift-wrap service quantities while Shopify totals remain intact", () => {
  const parent = wrappedParent("parent", "group-parent", 3);
  const bag = cart([parent, giftWrap("wrap", parent), line("plain", { quantity: 2 })]);

  assert.equal(getCartItemQuantity(bag), 5);
  assert.equal(bag.totalQuantity, 8);
  assert.equal(getCartItemQuantity(null), 0);
  assert.equal(getCartItemQuantity(cart([line("orphan", { productHandle: "gift-wrap" })])), 0);
});

test("a retained parent group without a service charge is valid after removing gift wrap", () => {
  const parent = wrappedParent("parent", "group-parent");

  assert.equal(getCartGiftWrapIssue(cart([parent, line("other")])), null);
  assert.equal(getCartGiftWrapIssue(cart([])), null);
  assert.equal(getCartGiftWrapIssue(null), null);
});

test("checkout cannot proceed from an incomplete cart snapshot", () => {
  const bag = cart([line("item")]);

  assert.match(getCartGiftWrapIssue({ ...bag, totalQuantity: 2 }) ?? "", /load every item/);
});

test("standalone wrap charges and removed parents require recovery before checkout", () => {
  const parent = wrappedParent("parent", "group-parent");
  const child = giftWrap("wrap", parent);

  assert.match(getCartGiftWrapIssue(cart([child])) ?? "", /missing its attached item/);
  assert.match(getCartGiftWrapIssue(cart([{ ...child, parentLineId: null }])) ?? "", /missing/);
});

test("an unavailable native child remains a service requiring recovery rather than another item", () => {
  const parent = wrappedParent("parent", "group-parent");
  const child = {
    ...giftWrap("wrap", parent),
    variantId: null,
    productHandle: null,
    productTitle: null,
  };
  const bag = cart([parent, child]);

  assert.match(getCartGiftWrapIssue(bag) ?? "", /could not confirm an attached add-on/);
  assert.equal(getCartItemQuantity(bag), 1);
  assert.deepEqual(getGiftWrapLinesForParent(bag, parent), []);
  assert.equal(bag.lines.includes(child), true);
});

test("wrap cannot be attached under another service or a nested parent", () => {
  const parent = wrappedParent("parent", "group-parent");
  const child = giftWrap("wrap", parent);

  assert.match(
    getCartGiftWrapIssue(cart([{ ...parent, productHandle: "gift-wrap" }, child])) ?? "",
    /missing its attached item/,
  );
  assert.match(
    getCartGiftWrapIssue(cart([{ ...parent, parentLineId: "grandparent" }, child])) ?? "",
    /could not confirm an attached add-on/,
  );
});

test("both native attachment and matching unique groups must identify the same item", () => {
  const parent = wrappedParent("parent", "group-parent");
  const child = giftWrap("wrap", parent);

  for (const attributes of [[], [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "other-group" }]]) {
    assert.match(
      getCartGiftWrapIssue(cart([parent, { ...child, attributes }])) ?? "",
      /which item this gift wrap belongs to/,
    );
  }
  assert.match(
    getCartGiftWrapIssue(cart([parent, wrappedParent("duplicate", "group-parent"), child])) ?? "",
    /which item this gift wrap belongs to/,
  );
  assert.equal(
    findGiftWrapParent(cart([parent, wrappedParent("duplicate", "group-parent")]), "group-parent"),
    null,
  );
});

test("multiple gift-wrap charges for one parent cannot pass checkout validation", () => {
  const parent = wrappedParent("parent", "group-parent");

  assert.match(
    getCartGiftWrapIssue(cart([parent, giftWrap("one", parent), giftWrap("two", parent)])) ?? "",
    /duplicate gift-wrap charges/,
  );
});

test("gift-wrap quantity must match every physical item in its parent line", () => {
  const parent = wrappedParent("parent", "group-parent", 3);
  const child = giftWrap("wrap", parent);

  assert.equal(getCartGiftWrapIssue(cart([parent, child])), null);
  for (const quantity of [1, 2, 4, 1.5]) {
    assert.match(
      getCartGiftWrapIssue(cart([parent, { ...child, quantity }])) ?? "",
      /quantities do not match/,
    );
  }
});

test("free zero-quantity stock placeholders do not create extra wrap associations", () => {
  const parent = wrappedParent("parent", "group-parent");
  const child = giftWrap("wrap", parent);
  const placeholder = {
    ...child,
    id: "out-of-stock-placeholder",
    quantity: 0,
    totalPrice: { amount: "0.00", currencyCode: "USD" },
  };
  const bag = cart([parent, child, placeholder]);

  assert.equal(isCartLinePlaceholder(placeholder), true);
  assert.equal(isCartLinePlaceholder(child), false);
  assert.deepEqual(getGiftWrapLinesForParent(bag, parent), [child]);
  assert.equal(getCartGiftWrapIssue(bag), null);
  assert.equal(bag.lines.length, 3);
  assert.equal(bag.totalQuantity, 2);
});

test("a free zero-quantity child does not charge for wrapping an otherwise unwrapped item", () => {
  const parent = wrappedParent("parent", "group-parent");
  const placeholder = {
    ...giftWrap("placeholder", parent),
    quantity: 0,
    totalPrice: { amount: "0.00", currencyCode: "USD" },
  };

  assert.equal(getCartGiftWrapIssue(cart([parent, placeholder])), null);
  assert.deepEqual(getGiftWrapLinesForParent(cart([parent, placeholder]), parent), []);
  assert.equal(
    getCartGiftWrapIssue(cart([parent, { ...placeholder, productHandle: null, variantId: null }])),
    null,
  );
});

test("zero-quantity merchandise and wrap lines with remaining charges cannot be hidden", () => {
  const parent = wrappedParent("parent", "group-parent");

  for (const paid of [
    { ...parent, quantity: 0 },
    { ...giftWrap("paid-wrap", parent), quantity: 0 },
  ]) {
    assert.equal(isCartLinePlaceholder(paid), false);
    assert.match(getCartGiftWrapIssue(cart([paid])) ?? "", /still has a charge/);
  }
});

test("a zero-quantity duplicate parent cannot obscure the one accepted receipt group", () => {
  const parent = wrappedParent("parent", "group-parent");
  const placeholder = {
    ...parent,
    id: "zero-parent",
    quantity: 0,
    totalPrice: { amount: "0", currencyCode: "USD" },
  };
  const bag = cart([parent, giftWrap("wrap", parent), placeholder]);

  assert.equal(findGiftWrapParent(bag, "group-parent"), parent);
  assert.equal(getCartGiftWrapIssue(bag), null);
});

test("mixed gift-wrap currency requires review rather than misleading totals", () => {
  const parent = wrappedParent("parent", "group-parent");
  const child = giftWrap("wrap", parent);

  assert.match(
    getCartGiftWrapIssue(
      cart([parent, { ...child, unitPrice: { amount: "6", currencyCode: "EUR" } }]),
    ) ?? "",
    /price could not be confirmed/,
  );
  assert.match(
    getCartGiftWrapIssue(
      cart([parent, { ...child, totalPrice: { amount: "6", currencyCode: "EUR" } }]),
    ) ?? "",
    /price could not be confirmed/,
  );
});

function stockWarning(
  target: string | null,
  code = "MERCHANDISE_NOT_ENOUGH_STOCK",
): ShopifyCartWarning {
  return { code, message: "Review the accepted quantity.", target };
}

test("known stock ceilings count every wrapped and plain copy of the exact clothing variant", () => {
  const parent = wrappedParent("wrapped", "group-parent", 2);
  const plain = line("plain", { quantity: 1 });
  const otherSize = line("other-size", { variantId: "shirt-large", quantity: 4 });
  const bag = cart([parent, giftWrap("wrap", parent), plain, otherSize]);

  assert.deepEqual(Array.from(getCartVariantQuantityLimits(bag, [stockWarning(parent.id)])), [
    ["shirt-medium", 3],
  ]);
  assert.equal(getCartVariantQuantityLimits(bag, []).size, 0);
});

test("an out-of-stock zero placeholder identifies the limit of the accepted copies only", () => {
  const parent = wrappedParent("accepted", "group-parent");
  const ghost = line("zero-placeholder", {
    quantity: 0,
    totalPrice: { amount: "0", currencyCode: "USD" },
  });
  const bag = cart([parent, giftWrap("wrap", parent), ghost]);

  assert.equal(
    getCartVariantQuantityLimits(bag, [stockWarning(ghost.id, "MERCHANDISE_OUT_OF_STOCK")]).get(
      parent.variantId ?? "",
    ),
    1,
  );
});

test("warnings without a matching returned target cannot invent an inventory ceiling", () => {
  const bag = cart([line("item")]);

  assert.equal(
    getCartVariantQuantityLimits(bag, [stockWarning("stale-target"), stockWarning(null)]).size,
    0,
  );
  assert.equal(
    getCartVariantQuantityLimits(bag, [stockWarning("item", "DISCOUNT_NOT_FOUND")]).size,
    0,
  );
  assert.equal(getCartVariantQuantityLimits(null, [stockWarning("item")]).size, 0);
});

test("stock warnings from an incomplete snapshot do not claim an exact accepted quantity", () => {
  const bag = cart([line("item")]);

  assert.equal(
    getCartVariantQuantityLimits({ ...bag, totalQuantity: 4 }, [stockWarning("item")]).size,
    0,
  );
});

test("a specific stock-rejected variant with no accepted units has a zero ceiling", () => {
  const ghost = line("zero-placeholder", {
    quantity: 0,
    totalPrice: { amount: "0", currencyCode: "USD" },
  });

  assert.equal(
    getCartVariantQuantityLimits(cart([ghost]), [stockWarning(ghost.id)]).get("shirt-medium"),
    0,
  );
});
