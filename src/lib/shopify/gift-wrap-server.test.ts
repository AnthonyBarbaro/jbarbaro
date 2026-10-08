import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test, { type TestContext } from "node:test";

import { NextRequest } from "next/server";

import { GIFT_WRAP_GROUP_ATTRIBUTE } from "@/lib/shopify/gift-wrap";
import type {
  ShopifyCartLine,
  ShopifyCartLineInput,
  ShopifyCartResponse,
} from "@/lib/shopify/types";

const CART_ID = "gid://shopify/Cart/gift-test?key=private-test-only";
const PARENT_ID = "gid://shopify/CartLine/parent";
const CHILD_ID = "gid://shopify/CartLine/wrap";
const VARIANT_ID = "gid://shopify/ProductVariant/shirt-small";
const WRAP_ID = "gid://shopify/ProductVariant/wrap";

function line(
  id: string,
  variantId: string,
  quantity = 1,
  group?: string,
  parentLineId?: string,
): ShopifyCartLine {
  const wrap = variantId === WRAP_ID;
  const amount = wrap ? "14.99" : "100.00";

  return {
    id,
    variantId,
    quantity,
    variantTitle: wrap ? "Default Title" : "Small / Navy",
    productTitle: wrap ? "Gift Wrap" : "Test Shirt",
    productHandle: wrap ? "gift-wrap" : "test-shirt",
    productType: wrap ? "Service" : "Shirt",
    attributes: group ? [{ key: GIFT_WRAP_GROUP_ATTRIBUTE, value: group }] : [],
    parentLineId: parentLineId ?? null,
    instructions: { canRemove: true, canUpdateQuantity: true },
    selectedOptions: wrap ? [] : [{ name: "Size", value: "Small" }],
    image: null,
    unitPrice: { amount, currencyCode: "USD" },
    totalPrice: { amount: (Number(amount) * quantity).toFixed(2), currencyCode: "USD" },
    variants: wrap
      ? []
      : [VARIANT_ID, "large"].map((variant) => ({
          id: variant,
          title: variant === VARIANT_ID ? "Small" : "Large",
          availableForSale: true,
          price: { amount, currencyCode: "USD" },
          compareAtPrice: null,
          selectedOptions: [{ name: "Size", value: variant === VARIANT_ID ? "Small" : "Large" }],
        })),
  };
}

function rawCart(lines: ShopifyCartLine[]): Record<string, unknown> {
  const amount = lines
    .reduce((total, item) => total + Number(item.totalPrice.amount), 0)
    .toFixed(2);
  const money = { amount, currencyCode: "USD" };

  return {
    id: CART_ID,
    checkoutUrl: "https://checkout.example.test/gift-test",
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
  const price = { amount: "14.99", currencyCode: "USD" };

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
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    variants: {
      nodes: [
        {
          id: WRAP_ID,
          title: "Default Title",
          availableForSale,
          price,
          compareAtPrice: null,
          selectedOptions: [],
        },
      ],
    },
  };
}

type RequestFixture = { query: string; variables?: Record<string, unknown> };
type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string) => void;
  delete: (name: string) => void;
};

function mockCookies(context: TestContext, initial: string | null): { value: string | null } {
  const state = { value: initial };
  const headers = createRequire(`${process.cwd()}/package.json`)("next/headers") as {
    cookies: () => Promise<CookieStore>;
  };

  context.mock.method(
    headers,
    "cookies",
    async (): Promise<CookieStore> => ({
      get: () => (state.value ? { value: state.value } : undefined),
      set: (_name: string, value: string): void => {
        state.value = value;
      },
      delete: (): void => {
        state.value = null;
      },
    }),
  );

  return state;
}

function mockTransport(
  context: TestContext,
  respond: (request: RequestFixture) => Record<string, unknown>,
  giftProduct: Record<string, unknown> = rawGiftProduct(),
): RequestFixture[] {
  const requests: RequestFixture[] = [];

  context.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      assert.equal(String(input), "https://gift-test.myshopify.com/api/2026-01/graphql.json");
      const request = JSON.parse(String(init?.body)) as RequestFixture;
      requests.push(request);
      if (request.query.includes("query ShopProduct(")) {
        return Response.json({ data: { product: giftProduct } });
      }
      return Response.json({ data: respond(request) });
    },
  );

  return requests;
}

function request(method: string, body: unknown): NextRequest {
  return new NextRequest("https://storefront.example.test/api/shopify/cart", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function mutation(
  cart: Record<string, unknown>,
  userErrors: unknown[] = [],
): Record<string, unknown> {
  return { cart, warnings: [], userErrors };
}

test("gift wrap is attached and verified at the server purchase boundaries", async (context) => {
  const environment = {
    SHOPIFY_STORE_DOMAIN: "gift-test.myshopify.com",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: "gift-test-token",
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
  let checkout: typeof import("@/app/api/shopify/cart/checkout/route");
  let products: typeof import("@/lib/shopify/products");

  try {
    routes = await import("@/app/api/shopify/cart/route");
    checkout = await import("@/app/api/shopify/cart/checkout/route");
    products = await import("@/lib/shopify/products");
  } finally {
    hook.deregister();
  }

  for (const existing of [false, true]) {
    await context.test(
      `${existing ? "existing" : "new"} cart wraps the exact new parent while an unwrapped copy remains separate`,
      async (subcontext) => {
        const cookies = mockCookies(subcontext, existing ? CART_ID : null);
        const old = existing ? [line("unwrapped", VARIANT_ID)] : [];
        let group = "";
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart(old) };
          const lines = (input.variables?.lines ??
            (input.variables?.input as { lines: ShopifyCartLineInput[] })
              ?.lines) as ShopifyCartLineInput[];
          if (!lines[0].parent) {
            group = lines[0].attributes?.[0].value ?? "";
            assert.match(group, /^[a-f0-9-]{36}$/);
            assert.equal(lines[0].attributes?.[0].key, GIFT_WRAP_GROUP_ATTRIBUTE);
            assert.ok(!("giftWrap" in lines[0]));
            const cart = rawCart([...old, line(PARENT_ID, VARIANT_ID, 1, group)]);
            return input.query.includes("mutation CreateCart")
              ? { cartCreate: mutation(cart) }
              : { cartLinesAdd: mutation(cart) };
          }
          assert.deepEqual(lines[0].parent, { lineId: PARENT_ID });
          assert.equal(lines[0].merchandiseId, WRAP_ID);
          assert.equal(lines[0].quantity, 1);
          assert.equal(lines[0].attributes?.[0].value, group);
          return {
            cartLinesAdd: mutation(
              rawCart([
                ...old,
                line(PARENT_ID, VARIANT_ID, 1, group),
                line(CHILD_ID, WRAP_ID, 1, group, PARENT_ID),
              ]),
            ),
          };
        });
        const response = await routes.POST(
          request("POST", {
            lines: [{ merchandiseId: VARIANT_ID, quantity: 1, giftWrap: true }],
            price: "0.01",
          }),
        );
        const payload = (await response.json()) as ShopifyCartResponse;
        assert.equal(response.status, existing ? 200 : 201);
        assert.equal(payload.confirmed, true);
        assert.equal(payload.giftWrapGroupId, group);
        assert.equal(
          payload.cart?.lines.find((item) => item.id === CHILD_ID)?.parentLineId,
          PARENT_ID,
        );
        assert.equal(cookies.value, CART_ID);
        assert.equal(
          requests.filter((item) => /mutation (?:CreateCart|AddCartLines)/.test(item.query)).length,
          2,
        );
        assert.ok(!JSON.stringify(payload).includes("private-test-only"));
      },
    );
  }

  for (const failure of [
    "rejected",
    "transport",
    "wrong-parent",
    "wrong-quantity",
    "missing-child",
  ]) {
    await context.test(
      `a ${failure} gift-wrap outcome never confirms success or repeats the write`,
      async (subcontext) => {
        mockCookies(subcontext, CART_ID);
        let group = "";
        let writes = 0;
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
          if (input.query.includes("query GetCart(")) return { cart: rawCart([]) };
          const lines = input.variables?.lines as ShopifyCartLineInput[];
          writes += 1;
          if (!lines[0].parent) {
            group = lines[0].attributes?.[0].value ?? "";
            return { cartLinesAdd: mutation(rawCart([line(PARENT_ID, VARIANT_ID, 1, group)])) };
          }
          if (failure === "transport") throw new Error("Synthetic lost response");
          const parents = [line(PARENT_ID, VARIANT_ID, 1, group)];
          const child = line(
            CHILD_ID,
            WRAP_ID,
            failure === "wrong-quantity" ? 2 : 1,
            group,
            failure === "wrong-parent" ? "another-parent" : PARENT_ID,
          );
          const children = failure === "rejected" || failure === "missing-child" ? [] : [child];
          return {
            cartLinesAdd: mutation(
              rawCart([...parents, ...children]),
              failure === "rejected"
                ? [
                    {
                      code: "MERCHANDISE_NOT_APPLICABLE",
                      field: ["lines"],
                      message: "Provider detail",
                    },
                  ]
                : [],
            ),
          };
        });
        const response = await routes.POST(
          request("POST", { lines: [{ merchandiseId: VARIANT_ID, quantity: 1, giftWrap: true }] }),
        );
        const payload = (await response.json()) as ShopifyCartResponse;
        assert.equal(payload.confirmed, false);
        assert.match(payload.message ?? "", /item was added.*could not confirm gift wrap/i);
        assert.equal(payload.giftWrapGroupId, undefined);
        assert.equal(payload.giftWrapIncomplete, true);
        assert.ok(payload.cart?.lines.some((item) => item.id === PARENT_ID));
        assert.equal(writes, 2);
        assert.equal(
          requests.filter((item) => item.query.includes("mutation AddCartLines")).length,
          2,
        );
        assert.ok(!JSON.stringify(payload).includes("Provider detail"));
      },
    );
  }

  await context.test(
    "a changed parent ID during wrap addition keeps the exact group attachment",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      let group = "";
      mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
        if (input.query.includes("query GetCart(")) return { cart: rawCart([]) };
        const inputs = input.variables?.lines as ShopifyCartLineInput[];
        if (!inputs[0].parent) {
          group = inputs[0].attributes?.[0].value ?? "";
          return { cartLinesAdd: mutation(rawCart([line(PARENT_ID, VARIANT_ID, 1, group)])) };
        }
        assert.deepEqual(inputs[0].parent, { lineId: PARENT_ID });
        return {
          cartLinesAdd: mutation(
            rawCart([
              line("changed-parent", VARIANT_ID, 1, group),
              line(CHILD_ID, WRAP_ID, 1, group, "changed-parent"),
            ]),
          ),
        };
      });
      const response = await routes.POST(
        request("POST", { lines: [{ merchandiseId: VARIANT_ID, quantity: 1, giftWrap: true }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;
      assert.equal(payload.confirmed, true);
      assert.equal(payload.giftWrapGroupId, group);
      assert.equal(payload.giftWrapIncomplete, undefined);
    },
  );

  await context.test("unavailable gift wrap prevents the parent write", async (subcontext) => {
    mockCookies(subcontext, CART_ID);
    const requests = mockTransport(
      subcontext,
      () => ({ product: rawGiftProduct(false) }),
      rawGiftProduct(false),
    );
    const response = await routes.POST(
      request("POST", { lines: [{ merchandiseId: VARIANT_ID, quantity: 1, giftWrap: true }] }),
    );
    assert.equal(response.status, 409);
    assert.match(
      ((await response.json()) as ShopifyCartResponse).message ?? "",
      /uncheck gift wrap/i,
    );
    assert.equal(requests.length, 1);
    assert.ok(!requests[0].query.includes("mutation"));
  });

  await context.test("gift wrap cannot be used as its own parent", async (subcontext) => {
    mockCookies(subcontext, CART_ID);
    const requests = mockTransport(subcontext, () => ({ product: rawGiftProduct() }));
    const response = await routes.POST(
      request("POST", { lines: [{ merchandiseId: WRAP_ID, quantity: 1, giftWrap: true }] }),
    );
    assert.equal(response.status, 409);
    assert.equal(requests.length, 1);
  });

  for (const swap of [false, true]) {
    await context.test(
      `${swap ? "size changes preserve attachment through changed IDs" : "quantity changes update wrap to the same quantity"}`,
      async (subcontext) => {
        mockCookies(subcontext, CART_ID);
        const original = [
          line(PARENT_ID, VARIANT_ID, 1, "group"),
          line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
        ];
        let writes = 0;
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
          writes += 1;
          const updates = input.variables?.lines as Array<{
            id: string;
            quantity?: number;
            merchandiseId?: string;
          }>;
          assert.deepEqual(
            updates,
            swap
              ? [{ id: PARENT_ID, merchandiseId: "large" }]
              : [{ id: writes === 1 ? PARENT_ID : CHILD_ID, quantity: 2 }],
          );
          const parentId = swap ? "new-parent" : PARENT_ID;
          return {
            cartLinesUpdate: mutation(
              rawCart([
                line(parentId, swap ? "large" : VARIANT_ID, swap ? 1 : 2, "group"),
                line(CHILD_ID, WRAP_ID, swap || writes === 1 ? 1 : 2, "group", parentId),
              ]),
            ),
          };
        });
        const response = await routes.PATCH(
          request("PATCH", {
            lines: [
              swap ? { id: PARENT_ID, merchandiseId: "large" } : { id: PARENT_ID, quantity: 2 },
            ],
          }),
        );
        assert.equal(((await response.json()) as ShopifyCartResponse).confirmed, true);
        assert.equal(requests.length, swap ? 3 : 4);
      },
    );
  }

  await context.test(
    "a stock-capped parent never increments its gift-wrap charge",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const original = [
        line(PARENT_ID, VARIANT_ID, 1, "group"),
        line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
      ];
      const requests = mockTransport(subcontext, (input) => {
        if (!input.query.includes("mutation UpdateCartLines")) return { cart: rawCart(original) };
        assert.deepEqual(input.variables?.lines, [{ id: PARENT_ID, quantity: 2 }]);
        return { cartLinesUpdate: mutation(rawCart(original)) };
      });
      const response = await routes.PATCH(
        request("PATCH", { lines: [{ id: PARENT_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;
      assert.equal(payload.confirmed, false);
      assert.match(payload.message ?? "", /requested quantity is unavailable/i);
      assert.equal(payload.cart?.lines[0].quantity, 1);
      assert.equal(payload.cart?.lines[1].quantity, 1);
      assert.equal(requests.length, 3);
      mockTransport(subcontext, () => ({ cart: rawCart(original) }));
      const handoff = await checkout.POST(request("POST", {}));
      assert.equal(handoff.status, 200);
    },
  );

  await context.test("a second wrapped copy keeps its own attachment", async (subcontext) => {
    mockCookies(subcontext, CART_ID);
    const old = [
      line("first-parent", VARIANT_ID, 1, "first-group"),
      line("first-wrap", WRAP_ID, 1, "first-group", "first-parent"),
      line("unwrapped", VARIANT_ID),
    ];
    let group = "";
    mockTransport(subcontext, (input) => {
      if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
      if (input.query.includes("query GetCart(")) return { cart: rawCart(old) };
      const inputs = input.variables?.lines as ShopifyCartLineInput[];
      if (!inputs[0].parent) {
        group = inputs[0].attributes?.[0].value ?? "";
        assert.notEqual(group, "first-group");
        return { cartLinesAdd: mutation(rawCart([...old, line(PARENT_ID, VARIANT_ID, 1, group)])) };
      }
      assert.deepEqual(inputs[0].parent, { lineId: PARENT_ID });
      return {
        cartLinesAdd: mutation(
          rawCart([
            ...old,
            line(PARENT_ID, VARIANT_ID, 1, group),
            line(CHILD_ID, WRAP_ID, 1, group, PARENT_ID),
          ]),
        ),
      };
    });
    const response = await routes.POST(
      request("POST", {
        lines: [{ merchandiseId: VARIANT_ID, quantity: 1, giftWrap: true }],
      }),
    );
    const payload = (await response.json()) as ShopifyCartResponse;
    assert.equal(payload.confirmed, true);
    assert.equal(payload.cart?.lines.length, 5);
    assert.equal(
      payload.cart?.lines.find((item) => item.id === "first-wrap")?.parentLineId,
      "first-parent",
    );
  });

  await context.test(
    "a wrapped request for two with stock for one adds only one wrap",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      let group = "";
      const requests = mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: rawGiftProduct() };
        if (input.query.includes("query GetCart(")) return { cart: rawCart([]) };
        const inputs = input.variables?.lines as ShopifyCartLineInput[];
        if (!inputs[0].parent) {
          group = inputs[0].attributes?.[0].value ?? "";
          assert.equal(inputs[0].quantity, 2);
          return { cartLinesAdd: mutation(rawCart([line(PARENT_ID, VARIANT_ID, 1, group)])) };
        }
        assert.equal(inputs[0].quantity, 1);
        return {
          cartLinesAdd: mutation(
            rawCart([
              line(PARENT_ID, VARIANT_ID, 1, group),
              line(CHILD_ID, WRAP_ID, 1, group, PARENT_ID),
            ]),
          ),
        };
      });
      const response = await routes.POST(
        request("POST", {
          lines: [{ merchandiseId: VARIANT_ID, quantity: 2, giftWrap: true }],
        }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;
      assert.equal(payload.confirmed, false);
      assert.match(payload.message ?? "", /Only 1 of the 2 requested items/);
      assert.deepEqual(
        payload.cart?.lines.map((item) => item.quantity),
        [1, 1],
      );
      assert.equal(requests.length, 4);
    },
  );

  for (const lostResponse of [false, true]) {
    await context.test(
      `existing mismatched wrap ${lostResponse ? "stays blocked after an uncertain repair" : "can be repaired without adding an item"}`,
      async (subcontext) => {
        mockCookies(subcontext, CART_ID);
        const original = [
          line(PARENT_ID, VARIANT_ID, 1, "group"),
          line(CHILD_ID, WRAP_ID, 2, "group", PARENT_ID),
        ];
        let writes = 0;
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
          writes += 1;
          assert.deepEqual(input.variables?.lines, [
            { id: writes === 1 ? PARENT_ID : CHILD_ID, quantity: 1 },
          ]);
          if (writes === 2 && lostResponse) throw new Error("Synthetic uncertain repair");
          return {
            cartLinesUpdate: mutation(
              rawCart(
                writes === 1
                  ? original
                  : [original[0], line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID)],
              ),
            ),
          };
        });
        const response = await routes.PATCH(
          request("PATCH", { lines: [{ id: PARENT_ID, quantity: 1 }] }),
        );
        const payload = (await response.json()) as ShopifyCartResponse;
        assert.equal(payload.confirmed, !lostResponse);
        assert.equal(payload.cart?.lines[1].quantity, lostResponse ? 2 : 1);
        assert.equal(requests.length, 4);
      },
    );
  }

  await context.test(
    "wrapped variant changes cannot substitute another product",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const requests = mockTransport(subcontext, () => ({
        cart: rawCart([
          line(PARENT_ID, VARIANT_ID, 1, "group"),
          line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
        ]),
      }));
      const response = await routes.PATCH(
        request("PATCH", { lines: [{ id: PARENT_ID, merchandiseId: "unrelated-product" }] }),
      );
      assert.equal(response.status, 409);
      assert.equal(requests.length, 1);
    },
  );

  await context.test(
    "a free old parent placeholder cannot prevent gift quantity repair",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const original = [
        line(PARENT_ID, VARIANT_ID, 1, "group"),
        line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
      ];
      let writes = 0;
      mockTransport(subcontext, (input) => {
        if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
        writes += 1;
        assert.deepEqual(input.variables?.lines, [
          { id: writes === 1 ? PARENT_ID : CHILD_ID, quantity: 2 },
        ]);
        return {
          cartLinesUpdate: mutation(
            rawCart([
              line("old-parent", VARIANT_ID, 0, "group"),
              line(PARENT_ID, VARIANT_ID, 2, "group"),
              line(CHILD_ID, WRAP_ID, writes === 1 ? 1 : 2, "group", PARENT_ID),
            ]),
          ),
        };
      });
      const response = await routes.PATCH(
        request("PATCH", { lines: [{ id: PARENT_ID, quantity: 2 }] }),
      );
      assert.equal(((await response.json()) as ShopifyCartResponse).confirmed, true);
      assert.equal(writes, 2);
    },
  );

  await context.test(
    "an unavailable parent cannot keep a paid zero-quantity gift fee",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const original = [
        line(PARENT_ID, VARIANT_ID, 1, "group"),
        line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
      ];
      const zeroParent = line(PARENT_ID, VARIANT_ID, 0, "group");
      const paidGift = {
        ...line(CHILD_ID, WRAP_ID, 0, "group", PARENT_ID),
        totalPrice: { amount: "14.99", currencyCode: "USD" },
      };
      const requests = mockTransport(subcontext, (input) => {
        if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
        if (input.query.includes("mutation UpdateCartLines"))
          return { cartLinesUpdate: mutation(rawCart([zeroParent, paidGift])) };
        assert.deepEqual(input.variables?.lineIds, [CHILD_ID]);
        return { cartLinesRemove: mutation(rawCart([zeroParent])) };
      });
      const response = await routes.PATCH(
        request("PATCH", { lines: [{ id: PARENT_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;
      assert.equal(payload.confirmed, false);
      assert.equal(payload.cart?.subtotal.amount, "0.00");
      assert.equal(
        payload.cart?.lines.some((item) => item.id === CHILD_ID),
        false,
      );
      assert.equal(requests.length, 4);
    },
  );

  await context.test(
    "gift-stock limits keep checkout blocked until quantities agree",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const original = [
        line(PARENT_ID, VARIANT_ID, 1, "group"),
        line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
      ];
      const limited = [line(PARENT_ID, VARIANT_ID, 2, "group"), original[1]];
      let writes = 0;
      mockTransport(subcontext, (input) => {
        if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
        writes += 1;
        return {
          cartLinesUpdate: {
            ...mutation(rawCart(limited)),
            warnings: [
              {
                code: "MERCHANDISE_NOT_ENOUGH_STOCK",
                target: CHILD_ID,
                message: "Provider stock details",
              },
            ],
          },
        };
      });
      const response = await routes.PATCH(
        request("PATCH", { lines: [{ id: PARENT_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;
      assert.equal(payload.confirmed, false);
      assert.equal(payload.warnings.length, 1);
      assert.equal(payload.warnings[0].target, CHILD_ID);
      assert.equal(writes, 2);
      mockTransport(subcontext, () => ({ cart: rawCart(limited) }));
      assert.equal((await checkout.POST(request("POST", {}))).status, 409);
    },
  );

  for (const removeParent of [false, true]) {
    await context.test(
      `${removeParent ? "parent removal confirms child cascade" : "gift-only removal retains its parent"}`,
      async (subcontext) => {
        mockCookies(subcontext, CART_ID);
        const original = [
          line(PARENT_ID, VARIANT_ID, 1, "group"),
          line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
        ];
        mockTransport(subcontext, (input) => {
          if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
          assert.deepEqual(input.variables?.lineIds, [removeParent ? PARENT_ID : CHILD_ID]);
          return { cartLinesRemove: mutation(rawCart(removeParent ? [] : [original[0]])) };
        });
        const response = await routes.DELETE(
          request("DELETE", { lineIds: [removeParent ? PARENT_ID : CHILD_ID] }),
        );
        const payload = (await response.json()) as ShopifyCartResponse;
        assert.equal(payload.confirmed, true);
        assert.equal(payload.cart?.lines.length, removeParent ? 0 : 1);
      },
    );
  }

  for (const partial of [false, true]) {
    await context.test(
      `clear bag ${partial ? "keeps a partially removed bag unconfirmed" : "removes wrapped, plain and unattached gift lines"}`,
      async (subcontext) => {
        mockCookies(subcontext, CART_ID);
        const original = [
          line(PARENT_ID, VARIANT_ID, 1, "group"),
          line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
          line("plain", VARIANT_ID),
          line("orphan-wrap", WRAP_ID, 1, "missing-parent", "absent"),
        ];
        const requests = mockTransport(subcontext, (input) => {
          if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
          assert.deepEqual(input.variables?.lineIds, [PARENT_ID, "plain", "orphan-wrap"]);
          return { cartLinesRemove: mutation(rawCart(partial ? original.slice(0, 2) : [])) };
        });
        const response = await routes.DELETE(request("DELETE", { clear: true }));
        const payload = (await response.json()) as ShopifyCartResponse;
        assert.equal(payload.confirmed, !partial);
        assert.equal(payload.cart?.lines.length, partial ? 2 : 0);
        assert.equal(payload.cart?.subtotal.amount, partial ? "114.99" : "0.00");
        assert.equal(requests.length, 3);
      },
    );
  }

  await context.test(
    "clear bag supports more than the individual removal request limit",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const original = Array.from({ length: 30 }, (_, index) => line(`item-${index}`, VARIANT_ID));
      mockTransport(subcontext, (input) => {
        if (input.query.includes("query GetCart(")) return { cart: rawCart(original) };
        assert.deepEqual(
          input.variables?.lineIds,
          original.map((item) => item.id),
        );
        return { cartLinesRemove: mutation(rawCart([])) };
      });
      const response = await routes.DELETE(request("DELETE", { clear: true }));
      assert.equal(((await response.json()) as ShopifyCartResponse).confirmed, true);
    },
  );

  for (const incomplete of [false, true]) {
    await context.test(
      `clear bag does not write when ${incomplete ? "cart lines are incomplete" : "a root cannot be removed"}`,
      async (subcontext) => {
        mockCookies(subcontext, CART_ID);
        const item = line(PARENT_ID, VARIANT_ID);
        const cart = rawCart([
          { ...item, instructions: { canRemove: incomplete, canUpdateQuantity: true } },
        ]);
        if (incomplete) cart.totalQuantity = 2;
        const requests = mockTransport(subcontext, () => ({ cart }));
        const response = await routes.DELETE(request("DELETE", { clear: true }));
        assert.equal(response.status, 409);
        assert.equal(((await response.json()) as ShopifyCartResponse).confirmed, false);
        assert.equal(requests.length, 1);
      },
    );
  }

  await context.test(
    "clear bag confirms an already empty bag without a mutation",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const requests = mockTransport(subcontext, () => ({ cart: rawCart([]) }));
      const response = await routes.DELETE(request("DELETE", { clear: true }));
      assert.equal(((await response.json()) as ShopifyCartResponse).confirmed, true);
      assert.equal(requests.length, 2);
    },
  );

  await context.test(
    "clear bag cannot confirm while an empty returned bag still has a charge",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const empty = rawCart([]);
      empty.cost = {
        subtotalAmount: { amount: "14.99", currencyCode: "USD" },
        totalAmount: { amount: "14.99", currencyCode: "USD" },
        totalTaxAmount: null,
      };
      mockTransport(subcontext, (input) =>
        input.query.includes("query GetCart(")
          ? { cart: rawCart([line(PARENT_ID, VARIANT_ID)]) }
          : { cartLinesRemove: mutation(empty) },
      );
      const response = await routes.DELETE(request("DELETE", { clear: true }));
      assert.equal(((await response.json()) as ShopifyCartResponse).confirmed, false);
    },
  );

  await context.test(
    "conflicting clear and individual removal payloads are rejected",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      const requests = mockTransport(subcontext, () => assert.fail("No provider request expected"));
      const response = await routes.DELETE(
        request("DELETE", { clear: true, lineIds: [PARENT_ID] }),
      );
      assert.equal(response.status, 400);
      assert.equal(requests.length, 0);
    },
  );

  await context.test("gift-only quantity requests never reach a mutation", async (subcontext) => {
    mockCookies(subcontext, CART_ID);
    const requests = mockTransport(subcontext, () => ({
      cart: rawCart([
        line(PARENT_ID, VARIANT_ID, 1, "group"),
        line(CHILD_ID, WRAP_ID, 1, "group", PARENT_ID),
      ]),
    }));
    const response = await routes.PATCH(
      request("PATCH", { lines: [{ id: CHILD_ID, quantity: 2 }] }),
    );
    assert.equal(response.status, 409);
    assert.equal(requests.length, 1);
  });

  await context.test(
    "standalone wrap is visible for recovery and checkout is blocked",
    async (subcontext) => {
      mockCookies(subcontext, CART_ID);
      mockTransport(subcontext, () => ({ cart: rawCart([line(CHILD_ID, WRAP_ID)]) }));
      const response = await checkout.POST(request("POST", {}));
      const payload = (await response.json()) as ShopifyCartResponse & { checkoutUrl?: string };
      assert.equal(response.status, 409);
      assert.equal(payload.cart?.lines.length, 1);
      assert.equal(payload.checkoutUrl, undefined);
    },
  );

  await context.test("valid wrapped quantities may proceed to checkout", async (subcontext) => {
    mockCookies(subcontext, CART_ID);
    mockTransport(subcontext, () => ({
      cart: rawCart([
        line(PARENT_ID, VARIANT_ID, 2, "group"),
        line(CHILD_ID, WRAP_ID, 2, "group", PARENT_ID),
      ]),
    }));
    const response = await checkout.POST(request("POST", {}));
    assert.equal(response.status, 200);
    assert.equal(
      ((await response.json()) as { checkoutUrl?: string }).checkoutUrl,
      "https://checkout.example.test/gift-test",
    );
  });

  await context.test(
    "catalog and search exclude the service while direct lookup remains available",
    async (subcontext) => {
      const gift = rawGiftProduct();
      const shirt = { ...gift, id: "shirt", handle: "test-shirt", title: "Test Shirt" };
      mockTransport(subcontext, (input) => {
        if (input.query.includes("query ShopProduct(")) return { product: gift };
        if (input.query.includes("query PredictiveProductSearch"))
          return {
            predictiveSearch: {
              products: [
                { ...gift, availableForSale: true },
                { ...shirt, availableForSale: true },
              ],
            },
          };
        return { products: { nodes: [gift, shirt] } };
      });
      assert.deepEqual(
        (await products.getShopProducts()).map((item) => item.handle),
        ["test-shirt"],
      );
      assert.deepEqual(
        (await products.searchShopProducts("gift")).map((item) => item.handle),
        ["test-shirt"],
      );
      assert.equal((await products.getShopProduct("gift-wrap"))?.handle, "gift-wrap");
    },
  );
});
