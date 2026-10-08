import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test, { type TestContext } from "node:test";

import { NextRequest } from "next/server";

import { GIFT_WRAP_GROUP_ATTRIBUTE } from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartLine,
  ShopifyCartLineInput,
  ShopifyCartLineUpdate,
  ShopifyCartResponse,
  ShopifyGiftWrapOffer,
} from "@/lib/shopify/types";

const CART_ID = "gid://shopify/Cart/existing-wrap?key=private-test-only";
const PARENT_ID = "gid://shopify/CartLine/existing-item";
const CHILD_ID = "gid://shopify/CartLine/existing-wrap";
const VARIANT_ID = "gid://shopify/ProductVariant/shirt-small";
const WRAP_ID = "gid://shopify/ProductVariant/gift-wrap";
const offer: ShopifyGiftWrapOffer = {
  merchandiseId: WRAP_ID,
  title: "Gift Wrap",
  price: { amount: "14.99", currencyCode: "USD" },
  availableForSale: true,
};

type Payload = ShopifyCartResponse;
type FixtureLine = ShopifyCartLine & {
  variantId: string;
  attributes: { key: string; value: string }[];
};
type RequestFixture = { query: string; variables?: Record<string, unknown> };
type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string) => void;
  delete: (name: string) => void;
};

function line(
  id: string,
  variantId = VARIANT_ID,
  quantity = 1,
  group?: string,
  parentLineId?: string,
): FixtureLine {
  const wrap = variantId === WRAP_ID;
  const amount = wrap ? "14.99" : "325.00";

  return {
    id,
    variantId,
    quantity,
    variantTitle: wrap ? "Default Title" : "40",
    productTitle: wrap ? "Gift Wrap" : "Test Shirt",
    productHandle: wrap ? "gift-wrap" : "test-shirt",
    productType: wrap ? "Service" : "Shirt",
    attributes: group ? [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group }] : [],
    parentLineId: parentLineId ?? null,
    instructions: { canRemove: true, canUpdateQuantity: true },
    selectedOptions: wrap ? [] : [{ name: "Size", value: "40" }],
    image: null,
    unitPrice: { amount, currencyCode: "USD" },
    totalPrice: { amount: (Number(amount) * quantity).toFixed(2), currencyCode: "USD" },
    variants: wrap
      ? []
      : [
          {
            id: variantId,
            title: "40",
            availableForSale: true,
            price: { amount, currencyCode: "USD" },
            compareAtPrice: null,
            selectedOptions: [{ name: "Size", value: "40" }],
          },
        ],
  };
}

function rawCart(lines: ShopifyCartLine[]): Record<string, unknown> {
  const amount = lines
    .reduce((total, item) => total + Number(item.totalPrice.amount), 0)
    .toFixed(2);
  const money = { amount, currencyCode: "USD" };

  return {
    id: CART_ID,
    checkoutUrl: "https://checkout.example.test/existing-wrap",
    totalQuantity: lines.reduce((quantity, item) => quantity + item.quantity, 0),
    cost: { subtotalAmount: money, totalAmount: money, totalTaxAmount: null },
    lines: {
      nodes: lines.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        attributes: item.attributes,
        parentRelationship: item.parentLineId ? { parent: { id: item.parentLineId } } : null,
        instructions: item.instructions,
        cost: { amountPerQuantity: item.unitPrice, totalAmount: item.totalPrice },
        merchandise: {
          id: item.variantId,
          title: item.variantTitle,
          selectedOptions: item.selectedOptions,
          image: null,
          product: {
            title: item.productTitle,
            handle: item.productHandle,
            productType: item.productType,
            variants: { nodes: item.variants },
          },
        },
      })),
    },
  };
}

function rawGiftProduct(availableForSale = true): Record<string, unknown> {
  return {
    id: "gid://shopify/Product/gift-wrap",
    handle: "gift-wrap",
    title: "Gift Wrap",
    createdAt: "2026-01-01T00:00:00Z",
    description: "Gift wrap",
    descriptionHtml: "<p>Gift wrap</p>",
    vendor: "Test Store",
    productType: "Service",
    tags: [],
    featuredImage: null,
    images: { nodes: [] },
    collections: { nodes: [] },
    priceRange: { minVariantPrice: offer.price, maxVariantPrice: offer.price },
    variants: {
      nodes: [
        {
          id: WRAP_ID,
          title: "Default Title",
          availableForSale,
          price: offer.price,
          compareAtPrice: null,
          selectedOptions: [],
        },
      ],
    },
  };
}

function mockCookies(context: TestContext, initial: string | null = CART_ID): void {
  let value = initial;
  const headers = createRequire(`${process.cwd()}/package.json`)("next/headers") as {
    cookies: () => Promise<CookieStore>;
  };

  context.mock.method(
    headers,
    "cookies",
    async (): Promise<CookieStore> => ({
      get: () => (value ? { value } : undefined),
      set: (_name: string, next: string): void => {
        value = next;
      },
      delete: (): void => {
        value = null;
      },
    }),
  );
}

function mockTransport(
  context: TestContext,
  respond: (request: RequestFixture) => Record<string, unknown>,
): RequestFixture[] {
  const requests: RequestFixture[] = [];

  context.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      assert.equal(String(input), "https://existing-wrap.myshopify.com/api/2026-01/graphql.json");
      const fixture = JSON.parse(String(init?.body)) as RequestFixture;
      requests.push(fixture);
      return Response.json({ data: respond(fixture) });
    },
  );

  return requests;
}

function request(method: string, body?: unknown): NextRequest {
  return new NextRequest("https://storefront.example.test/api/shopify/cart", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function mutation(lines: ShopifyCartLine[], userErrors: unknown[] = []): Record<string, unknown> {
  return { cart: rawCart(lines), warnings: [], userErrors };
}

function writes(requests: RequestFixture[]): RequestFixture[] {
  return requests.filter((input) => /\bmutation\b/.test(input.query));
}

function clothingQuantities(payload: Payload): Array<[string | null, number]> {
  return (payload.cart?.lines ?? [])
    .filter((item) => item.variantId !== WRAP_ID)
    .map((item) => [item.variantId, item.quantity]);
}

test("gift wrap can be attached to an existing item without requiring more clothing stock", async (context) => {
  const environment = {
    SHOPIFY_STORE_DOMAIN: "existing-wrap.myshopify.com",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: "existing-wrap-test-token",
    SHOPIFY_STOREFRONT_API_VERSION: "2026-01",
  };
  const previous = Object.keys(environment).map((key) => [key, process.env[key]] as const);
  Object.assign(process.env, environment);
  context.after(() =>
    previous.forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }),
  );
  const cache = createRequire(`${process.cwd()}/package.json`)("next/cache") as {
    unstable_cache: (
      callback: (...args: unknown[]) => Promise<unknown>,
    ) => (...args: unknown[]) => Promise<unknown>;
  };
  context.mock.method(
    cache,
    "unstable_cache",
    (callback: (...args: unknown[]) => Promise<unknown>) => callback,
  );
  const hook = registerHooks({
    resolve(specifier, resolverContext, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        resolverContext,
      );
    },
  });
  let routes: typeof import("@/app/api/shopify/cart/route");

  try {
    routes = await import("@/app/api/shopify/cart/route");
  } finally {
    hook.deregister();
  }

  for (const quantity of [1, 3]) {
    await context.test(
      `attaching wrap to ${quantity} existing items only updates metadata and adds matching service quantity`,
      async (subcontext) => {
        mockCookies(subcontext);
        const original = line(PARENT_ID, VARIANT_ID, quantity);
        original.attributes = [{ key: "Note", value: "Keep this existing note" }];
        let group = "";
        const returnedParentId = "metadata-updated-parent";
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart([original]) };
          if (input.query.includes("mutation UpdateCartLines")) {
            const updates = input.variables?.lines as ShopifyCartLineUpdate[];
            assert.equal(updates.length, 1);
            group =
              updates[0].attributes?.find((item) => item.key === GIFT_WRAP_GROUP_ATTRIBUTE)
                ?.value ?? "";
            assert.match(group, /^[a-f0-9-]{36}$/);
            assert.deepEqual(updates, [
              {
                id: PARENT_ID,
                attributes: [
                  ...original.attributes,
                  { key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group },
                ],
              },
            ]);
            const parent = line(returnedParentId, VARIANT_ID, quantity, group);
            parent.attributes = updates[0].attributes ?? [];
            return { cartLinesUpdate: mutation([parent]) };
          }
          assert.ok(input.query.includes("mutation AddCartLines"));
          assert.deepEqual(input.variables?.lines, [
            {
              merchandiseId: WRAP_ID,
              quantity,
              attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group }],
              parent: { lineId: returnedParentId },
            },
          ]);
          const parent = line(returnedParentId, VARIANT_ID, quantity, group);
          parent.attributes = [
            ...original.attributes,
            { key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group },
          ];
          return {
            cartLinesAdd: mutation([
              parent,
              line(CHILD_ID, WRAP_ID, quantity, group, returnedParentId),
            ]),
          };
        });
        const response = await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }));
        const payload = (await response.json()) as Payload;
        assert.equal(response.status, 200);
        assert.equal(payload.confirmed, true);
        assert.equal(payload.giftWrapGroupId, group);
        assert.deepEqual(payload.giftWrapOffer, offer);
        assert.deepEqual(clothingQuantities(payload), [[VARIANT_ID, quantity]]);
        assert.equal(payload.cart?.lines.find((item) => item.id === CHILD_ID)?.quantity, quantity);
        assert.equal(writes(requests).length, 2);
        assert.ok(!JSON.stringify(payload).includes("private-test-only"));
      },
    );
  }

  await context.test(
    "another wrapped copy and an unwrapped copy of the same SKU keep their identities",
    async (subcontext) => {
      mockCookies(subcontext);
      const old = [
        line("already-wrapped", VARIANT_ID, 1, "old-group"),
        line("old-wrap", WRAP_ID, 1, "old-group", "already-wrapped"),
        line("keep-unwrapped", VARIANT_ID),
      ];
      let group = "";
      mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
        if (input.query.includes("query GetCart("))
          return { cart: rawCart([...old, line(PARENT_ID)]) };
        if (input.query.includes("mutation UpdateCartLines")) {
          const updates = input.variables?.lines as ShopifyCartLineUpdate[];
          group =
            updates[0].attributes?.find((item) => item.key === GIFT_WRAP_GROUP_ATTRIBUTE)?.value ??
            "";
          assert.notEqual(group, "old-group");
          assert.equal(updates[0].id, PARENT_ID);
          assert.equal(updates[0].quantity, undefined);
          assert.equal(updates[0].merchandiseId, undefined);
          return { cartLinesUpdate: mutation([...old, line(PARENT_ID, VARIANT_ID, 1, group)]) };
        }
        const children = input.variables?.lines as ShopifyCartLineInput[];
        assert.deepEqual(children[0].parent, { lineId: PARENT_ID });
        return {
          cartLinesAdd: mutation([
            ...old,
            line(PARENT_ID, VARIANT_ID, 1, group),
            line(CHILD_ID, WRAP_ID, 1, group, PARENT_ID),
          ]),
        };
      });
      const payload = (await (
        await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
      ).json()) as Payload;
      assert.equal(payload.confirmed, true);
      assert.equal(payload.cart?.lines.length, 5);
      assert.equal(
        payload.cart?.lines.find((item) => item.id === "old-wrap")?.parentLineId,
        "already-wrapped",
      );
      assert.equal(
        payload.cart?.lines.find((item) => item.id === "keep-unwrapped")?.attributes?.length,
        0,
      );
      assert.deepEqual(clothingQuantities(payload), [
        [VARIANT_ID, 1],
        [VARIANT_ID, 1],
        [VARIANT_ID, 1],
      ]);
    },
  );

  await context.test(
    "re-adding removed wrap reuses the parent group without an apparel write",
    async (subcontext) => {
      mockCookies(subcontext);
      const parent = line(PARENT_ID, VARIANT_ID, 2, "retained-group");
      const requests = mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
        if (input.query.includes("query GetCart(")) return { cart: rawCart([parent]) };
        assert.ok(input.query.includes("mutation AddCartLines"));
        assert.deepEqual(input.variables?.lines, [
          {
            merchandiseId: WRAP_ID,
            quantity: 2,
            parent: { lineId: PARENT_ID },
            attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "retained-group" }],
          },
        ]);
        return {
          cartLinesAdd: mutation([parent, line(CHILD_ID, WRAP_ID, 2, "retained-group", PARENT_ID)]),
        };
      });
      const payload = (await (
        await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
      ).json()) as Payload;
      assert.equal(payload.confirmed, true);
      assert.equal(writes(requests).length, 1);
    },
  );

  for (const update of ["neighbor-id-rotation", "free-placeholder-removal"]) {
    await context.test(
      `${update} does not prevent confirming an otherwise unchanged cart`,
      async (subcontext) => {
        mockCookies(subcontext);
        const parent = line(PARENT_ID, VARIANT_ID, 1, "retained-group");
        const neighbor = line(
          "neighbor",
          "neighbor-variant",
          update === "free-placeholder-removal" ? 0 : 1,
        );
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart([parent, neighbor]) };
          assert.ok(input.query.includes("mutation AddCartLines"));
          const neighbors =
            update === "neighbor-id-rotation" ? [{ ...neighbor, id: "rotated-neighbor" }] : [];
          return {
            cartLinesAdd: mutation([
              parent,
              ...neighbors,
              line(CHILD_ID, WRAP_ID, 1, "retained-group", PARENT_ID),
            ]),
          };
        });
        const payload = (await (
          await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
        ).json()) as Payload;
        assert.equal(payload.confirmed, true);
        assert.equal(payload.giftWrapGroupId, "retained-group");
        assert.equal(writes(requests).length, 1);
        assert.equal(payload.cart?.lines.find((item) => item.id === PARENT_ID)?.quantity, 1);
        assert.equal(
          payload.cart?.lines.find((item) => item.id === CHILD_ID)?.parentLineId,
          PARENT_ID,
        );
      },
    );
  }

  await context.test(
    "an already wrapped item is an idempotent request with no duplicate fee",
    async (subcontext) => {
      mockCookies(subcontext);
      const original = [
        line(PARENT_ID, VARIANT_ID, 1, "group"),
        line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
      ];
      const requests = mockTransport(subcontext, (input) =>
        input.query.includes("query ShopProduct(")
          ? { product: rawGiftProduct() }
          : { cart: rawCart(original) },
      );
      const payload = (await (
        await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
      ).json()) as Payload;
      assert.equal(payload.confirmed, true);
      assert.equal(payload.cart?.lines.length, 2);
      assert.equal(writes(requests).length, 0);
    },
  );

  await context.test(
    "simultaneous requests for the same existing item buy wrapping only once",
    async (subcontext) => {
      mockCookies(subcontext);
      const parent = line(PARENT_ID, VARIANT_ID, 1, "retained-group");
      let current = [parent];
      let feeWrites = 0;
      const requests = mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
        if (input.query.includes("query GetCart(")) return { cart: rawCart(current) };
        assert.ok(input.query.includes("mutation AddCartLines"));
        const children = input.variables?.lines as ShopifyCartLineInput[];
        assert.equal(children[0].merchandiseId, WRAP_ID);
        assert.equal(children[0].quantity, 1);
        feeWrites += 1;
        current = [
          ...current,
          line(`${CHILD_ID}-${feeWrites}`, WRAP_ID, 1, "retained-group", PARENT_ID),
        ];
        return { cartLinesAdd: mutation(current) };
      });
      const responses = await Promise.all([
        routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } })),
        routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } })),
      ]);
      const payloads = (await Promise.all(
        responses.map((response) => response.json()),
      )) as Payload[];
      assert.ok(payloads.every((payload) => payload.confirmed === true));
      assert.equal(feeWrites, 1);
      assert.equal(writes(requests).length, 1);
      assert.equal(current.filter((item) => item.variantId === WRAP_ID).length, 1);
      assert.equal(current.find((item) => item.id === PARENT_ID)?.quantity, 1);
    },
  );

  for (const restriction of ["quantity-locked", "apparel-now-unavailable"]) {
    await context.test(
      `${restriction} existing apparel can receive wrap without requesting more stock`,
      async (subcontext) => {
        mockCookies(subcontext);
        const original = line(PARENT_ID);
        if (restriction === "quantity-locked") {
          original.instructions = { canRemove: true, canUpdateQuantity: false };
        } else {
          original.variants[0].availableForSale = false;
        }
        let group = "";
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart([original]) };
          if (input.query.includes("mutation UpdateCartLines")) {
            const updates = input.variables?.lines as ShopifyCartLineUpdate[];
            group =
              updates[0].attributes?.find((item) => item.key === GIFT_WRAP_GROUP_ATTRIBUTE)
                ?.value ?? "";
            assert.deepEqual(updates, [
              { id: PARENT_ID, attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group }] },
            ]);
            return {
              cartLinesUpdate: mutation([{ ...original, attributes: updates[0].attributes ?? [] }]),
            };
          }
          const children = input.variables?.lines as ShopifyCartLineInput[];
          assert.equal(children[0].merchandiseId, WRAP_ID);
          assert.equal(children[0].quantity, 1);
          const parent = {
            ...original,
            attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group }],
          };
          return { cartLinesAdd: mutation([parent, line(CHILD_ID, WRAP_ID, 1, group, PARENT_ID)]) };
        });
        const payload = (await (
          await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
        ).json()) as Payload;
        assert.equal(payload.confirmed, true);
        assert.deepEqual(clothingQuantities(payload), [[VARIANT_ID, 1]]);
        assert.equal(writes(requests).length, 2);
      },
    );
  }

  for (const invalid of ["missing", "gift-service", "nested", "zero-quantity", "ambiguous-group"]) {
    await context.test(`${invalid} targets cannot add a gift-wrap charge`, async (subcontext) => {
      mockCookies(subcontext);
      const parent = line(
        PARENT_ID,
        invalid === "gift-service" ? WRAP_ID : VARIANT_ID,
        invalid === "zero-quantity" ? 0 : 1,
        invalid === "ambiguous-group" ? "duplicate-group" : undefined,
        invalid === "nested" ? "another-parent" : undefined,
      );
      const original = invalid === "missing" ? [] : [parent];
      if (invalid === "ambiguous-group")
        original.push(line("duplicate-parent", VARIANT_ID, 1, "duplicate-group"));
      const requests = mockTransport(subcontext, (input) =>
        input.query.includes("query ShopProduct(")
          ? { product: rawGiftProduct() }
          : { cart: rawCart(original) },
      );
      const response = await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }));
      const payload = (await response.json()) as Payload;
      assert.equal(response.status, 409);
      assert.equal(payload.confirmed, false);
      assert.equal(writes(requests).length, 0);
    });
  }

  await context.test(
    "unavailable wrapping is rejected before changing the existing item",
    async (subcontext) => {
      mockCookies(subcontext);
      const requests = mockTransport(subcontext, (input) =>
        input.query.includes("query ShopProduct(")
          ? { product: rawGiftProduct(false) }
          : { cart: rawCart([line(PARENT_ID)]) },
      );
      const response = await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }));
      const payload = (await response.json()) as Payload;
      assert.equal(response.status, 409);
      assert.equal(payload.confirmed, false);
      assert.match(payload.message ?? "", /gift wrap.*unavailable/i);
      assert.equal(writes(requests).length, 0);
    },
  );

  for (const failure of ["transport", "rejected"]) {
    await context.test(
      `a ${failure} metadata write preserves the known bag and never attempts a wrapping purchase`,
      async (subcontext) => {
        mockCookies(subcontext);
        const original = line(PARENT_ID);
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart([original]) };
          assert.ok(input.query.includes("mutation UpdateCartLines"));
          if (failure === "transport") throw new Error("Synthetic lost metadata response");
          return {
            cartLinesUpdate: mutation(
              [original],
              [
                {
                  code: "INVALID",
                  field: ["lines"],
                  message: "Synthetic rejected metadata update",
                },
              ],
            ),
          };
        });
        const payload = (await (
          await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
        ).json()) as Payload;
        assert.equal(payload.confirmed, false);
        assert.deepEqual(clothingQuantities(payload), [[VARIANT_ID, 1]]);
        assert.ok(!payload.cart?.lines.some((item) => item.variantId === WRAP_ID));
        assert.equal(writes(requests).length, 1);
      },
    );
  }

  for (const change of ["quantity", "variant", "other-item-quantity", "missing-group"]) {
    await context.test(
      `a metadata response changing ${change} prevents the wrapping charge`,
      async (subcontext) => {
        mockCookies(subcontext);
        const original = [line(PARENT_ID), line("other-item", "another-variant")];
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
          assert.ok(input.query.includes("mutation UpdateCartLines"));
          const updates = input.variables?.lines as ShopifyCartLineUpdate[];
          const group =
            updates[0].attributes?.find((item) => item.key === GIFT_WRAP_GROUP_ATTRIBUTE)?.value ??
            "";
          const parent = line(
            PARENT_ID,
            change === "variant" ? "changed-variant" : VARIANT_ID,
            change === "quantity" ? 0 : 1,
            change === "missing-group" ? undefined : group,
          );
          const other = line(
            "other-item",
            "another-variant",
            change === "other-item-quantity" ? 2 : 1,
          );
          return { cartLinesUpdate: mutation([parent, other]) };
        });
        const payload = (await (
          await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
        ).json()) as Payload;
        assert.equal(payload.confirmed, false);
        assert.equal(writes(requests).length, 1);
        assert.ok(!payload.cart?.lines.some((item) => item.variantId === WRAP_ID));
      },
    );
  }

  for (const failure of [
    "transport",
    "rejected",
    "wrong-parent",
    "wrong-quantity",
    "missing-child",
    "other-item-change",
    "other-item-variant-change",
    "parent-quantity-change",
    "parent-variant-change",
  ]) {
    await context.test(
      `${failure} gift addition preserves the known bag without confirming or repeating the write`,
      async (subcontext) => {
        mockCookies(subcontext);
        const parent = line(PARENT_ID, VARIANT_ID, 2, "group");
        const other = line("other-item", "another-variant");
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart([parent, other]) };
          assert.ok(input.query.includes("mutation AddCartLines"));
          if (failure === "transport") throw new Error("Synthetic lost gift-wrap response");
          const child = line(
            CHILD_ID,
            WRAP_ID,
            failure === "wrong-quantity" || failure === "parent-quantity-change" ? 1 : 2,
            "group",
            failure === "wrong-parent" ? other.id : PARENT_ID,
          );
          const children = failure === "rejected" || failure === "missing-child" ? [] : [child];
          return {
            cartLinesAdd: mutation(
              [
                failure === "parent-quantity-change"
                  ? line(PARENT_ID, VARIANT_ID, 1, "group")
                  : failure === "parent-variant-change"
                    ? line(PARENT_ID, "another-variant", 2, "group")
                    : parent,
                failure === "other-item-change"
                  ? line(other.id, other.variantId, 2)
                  : failure === "other-item-variant-change"
                    ? line(other.id, "changed-neighbor-variant")
                    : other,
                ...children,
              ],
              failure === "rejected"
                ? [
                    {
                      code: "MERCHANDISE_NOT_ENOUGH_STOCK",
                      field: ["lines"],
                      message: "Synthetic provider detail",
                    },
                  ]
                : [],
            ),
          };
        });
        const payload = (await (
          await routes.PATCH(request("PATCH", { giftWrap: { lineId: PARENT_ID } }))
        ).json()) as Payload;
        assert.equal(payload.confirmed, false);
        assert.equal(payload.giftWrapIncomplete, true);
        assert.equal(payload.giftWrapGroupId, undefined);
        assert.ok(payload.cart?.lines.some((item) => item.id === PARENT_ID));
        if (failure !== "parent-quantity-change") {
          assert.equal(payload.cart?.lines.find((item) => item.id === PARENT_ID)?.quantity, 2);
        }
        assert.equal(writes(requests).length, 1);
        assert.match(payload.message ?? "", /gift wrap/i);
      },
    );
  }

  await context.test(
    "client-supplied service IDs, prices, quantity and attributes cannot alter the trusted wrapping request",
    async (subcontext) => {
      mockCookies(subcontext);
      const parent = line(PARENT_ID, VARIANT_ID, 1, "trusted-group");
      const requests = mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
        if (input.query.includes("query GetCart(")) return { cart: rawCart([parent]) };
        assert.deepEqual(input.variables?.lines, [
          {
            merchandiseId: WRAP_ID,
            quantity: 1,
            parent: { lineId: PARENT_ID },
            attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "trusted-group" }],
          },
        ]);
        return {
          cartLinesAdd: mutation([parent, line(CHILD_ID, WRAP_ID, 1, "trusted-group", PARENT_ID)]),
        };
      });
      const response = await routes.PATCH(
        request("PATCH", {
          giftWrap: {
            lineId: PARENT_ID,
            merchandiseId: "malicious-variant",
            quantity: 25,
            price: "0.01",
            attributes: [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "malicious-group" }],
          },
        }),
      );
      const payload = (await response.json()) as Payload;
      assert.equal(response.status, 400);
      assert.equal(payload.confirmed, false);
      assert.equal(writes(requests).length, 0);
    },
  );

  await context.test(
    "cart GET exposes the current gift-wrap offer with the existing item",
    async (subcontext) => {
      mockCookies(subcontext);
      const requests = mockTransport(subcontext, (input) =>
        input.query.includes("query ShopProduct(")
          ? { product: rawGiftProduct() }
          : { cart: rawCart([line(PARENT_ID)]) },
      );
      const response = await routes.GET(request("GET"));
      const payload = (await response.json()) as Payload;
      assert.equal(response.status, 200);
      assert.deepEqual(payload.giftWrapOffer, offer);
      assert.deepEqual(clothingQuantities(payload), [[VARIANT_ID, 1]]);
      assert.equal(writes(requests).length, 0);
    },
  );

  await context.test(
    "a gift-price lookup failure does not prevent the existing cart from loading",
    async (subcontext) => {
      mockCookies(subcontext);
      subcontext.mock.method(console, "error", (): void => {});
      const requests = mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct("))
          throw new Error("Synthetic gift lookup failure");
        return { cart: rawCart([line(PARENT_ID)]) };
      });
      const response = await routes.GET(request("GET"));
      const payload = (await response.json()) as Payload;
      assert.equal(response.status, 200);
      assert.equal(payload.giftWrapOffer, null);
      assert.deepEqual(clothingQuantities(payload), [[VARIANT_ID, 1]]);
      assert.equal(writes(requests).length, 0);
    },
  );
});
