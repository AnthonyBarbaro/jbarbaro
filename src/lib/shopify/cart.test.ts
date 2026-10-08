import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test, { type TestContext } from "node:test";

import { NextRequest } from "next/server";

import { GIFT_WRAP_GROUP_ATTRIBUTE } from "@/lib/shopify/gift-wrap";
import type { ShopifyCartResponse } from "@/lib/shopify/types";

const CART_ID = "gid://shopify/Cart/test-cart?key=test-private-cart-key";
const VARIANT_ID = "gid://shopify/ProductVariant/test-small";
const LINE_ID = "gid://shopify/CartLine/test-line";

type StorefrontRequestFixture = {
  query: string;
  variables?: Record<string, unknown>;
};

type CookieStoreFixture = {
  get: (name: string) => { name: string; value: string } | undefined;
  set: (name: string, value: string, options: { httpOnly?: boolean }) => void;
  delete: (name: string) => void;
};

function mockCartCookies(
  context: TestContext,
  cartId: string | null,
): { cartId: string | null; deletes: number; writes: number } {
  const state = { cartId, deletes: 0, writes: 0 };
  const headersModule = createRequire(`${process.cwd()}/package.json`)("next/headers") as {
    cookies: () => Promise<CookieStoreFixture>;
  };

  context.mock.method(
    headersModule,
    "cookies",
    async (): Promise<CookieStoreFixture> => ({
      get(name) {
        assert.equal(name, "jbarbaro_shopify_cart");
        return state.cartId ? { name, value: state.cartId } : undefined;
      },
      set(name, value, options) {
        assert.equal(name, "jbarbaro_shopify_cart");
        assert.equal(options.httpOnly, true);
        state.cartId = value;
        state.writes += 1;
      },
      delete(name) {
        assert.equal(name, "jbarbaro_shopify_cart");
        state.cartId = null;
        state.deletes += 1;
      },
    }),
  );

  return state;
}

function cartRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("https://storefront.example.test/api/shopify/cart", {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
  });
}

function rawCart(quantity: number = 1): Record<string, unknown> {
  const amount = String(quantity * 50);

  return {
    id: CART_ID,
    checkoutUrl: "https://checkout.example.test/test-checkout",
    totalQuantity: quantity,
    cost: {
      subtotalAmount: { amount, currencyCode: "USD" },
      totalAmount: { amount, currencyCode: "USD" },
      totalTaxAmount: null,
    },
    lines: {
      nodes: [
        {
          id: LINE_ID,
          quantity,
          cost: {
            totalAmount: { amount, currencyCode: "USD" },
            amountPerQuantity: { amount: "50", currencyCode: "USD" },
          },
          merchandise: {
            id: VARIANT_ID,
            title: "Small / Navy",
            selectedOptions: [
              { name: "Size", value: "Small" },
              { name: "Color", value: "Navy" },
            ],
            image: null,
            product: {
              title: "Test Shirt",
              handle: "test-shirt",
              productType: "Shirt",
              variants: {
                nodes: [
                  {
                    id: VARIANT_ID,
                    title: "Small / Navy",
                    availableForSale: true,
                    price: { amount: "50", currencyCode: "USD" },
                    compareAtPrice: null,
                    selectedOptions: [{ name: "Size", value: "Small" }],
                  },
                ],
              },
            },
          },
        },
      ],
    },
  };
}

function mockStorefront(
  context: TestContext,
  data: Record<string, unknown> | Array<Record<string, unknown>>,
): StorefrontRequestFixture[] {
  const requests: StorefrontRequestFixture[] = [];
  const responses = Array.isArray(data) ? data : [data];

  context.mock.method(
    globalThis,
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      assert.equal(String(input), "https://unit-test.myshopify.com/api/2026-01/graphql.json");
      const request = JSON.parse(String(init?.body)) as StorefrontRequestFixture;
      // These fixtures track cart operations; gift pricing is covered by the wrapping tests.
      if (request.query.includes("query ShopProduct(")) {
        return Response.json({ data: { product: null } });
      }
      assert.equal(init?.cache, "no-store");
      const responseData = responses[requests.length];
      assert.ok(responseData, "Unexpected additional Shopify request");
      requests.push(request);
      return Response.json({ data: responseData });
    },
  );

  return requests;
}

async function loadServerModule<T>(load: () => Promise<T>): Promise<T> {
  // Next replaces this server boundary marker; use its empty module in isolated Node tests.
  const hook = registerHooks({
    resolve(specifier, context, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        context,
      );
    },
  });

  try {
    return await load();
  } finally {
    hook.deregister();
  }
}

test("Shopify cart requests preserve actual outcomes without leaking provider messages", async (context) => {
  const environment = {
    SHOPIFY_STORE_DOMAIN: "unit-test.myshopify.com",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: "unit-test-storefront-token",
    SHOPIFY_STOREFRONT_API_VERSION: "2026-01",
  };
  const previousValues = new Map(Object.keys(environment).map((key) => [key, process.env[key]]));

  Object.assign(process.env, environment);
  context.after(() => {
    for (const [key, value] of previousValues) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  const cartModule = await loadServerModule(() => import("@/lib/shopify/cart"));
  const operations = [
    {
      name: "cartCreate",
      run: () => cartModule.createCart({ lines: [{ merchandiseId: VARIANT_ID, quantity: 3 }] }),
    },
    {
      name: "cartLinesAdd",
      run: () => cartModule.addCartLines(CART_ID, [{ merchandiseId: VARIANT_ID, quantity: 3 }]),
    },
    {
      name: "cartLinesUpdate",
      run: () => cartModule.updateCartLines(CART_ID, [{ id: LINE_ID, quantity: 3 }]),
    },
    {
      name: "cartLinesRemove",
      run: () => cartModule.removeCartLines(CART_ID, [LINE_ID]),
    },
  ];

  for (const operation of operations) {
    await context.test(
      `${operation.name} carries stock warnings and the returned cart`,
      async (subtest) => {
        const requests = mockStorefront(subtest, {
          [operation.name]: {
            cart: rawCart(2),
            warnings: [
              {
                code: "MERCHANDISE_NOT_ENOUGH_STOCK",
                message: `Internal provider details for ${CART_ID}`,
                target: CART_ID,
              },
            ],
            userErrors: [],
          },
        });
        const result = await operation.run();

        assert.equal(requests.length, 1);
        const warningSelection = requests[0].query.match(/warnings\s*\{([^}]+)\}/)?.[1] ?? "";
        const errorSelection = requests[0].query.match(/userErrors\s*\{([^}]+)\}/)?.[1] ?? "";
        for (const field of ["code", "message", "target"]) {
          assert.match(warningSelection, new RegExp(`\\b${field}\\b`));
        }
        for (const field of ["code", "field", "message"]) {
          assert.match(errorSelection, new RegExp(`\\b${field}\\b`));
        }
        assert.equal(result.cart?.totalQuantity, 2);
        assert.equal(result.cart?.lines[0].variantId, VARIANT_ID);
        assert.equal(result.cart?.lines[0].quantity, 2);
        assert.equal(result.cart?.subtotal.amount, "100");
        assert.equal(result.warnings[0].code, "MERCHANDISE_NOT_ENOUGH_STOCK");
        assert.equal(result.warnings[0].target, null);
        assert.equal(result.warnings[0].message, "The requested quantity is unavailable.");
        assert.doesNotMatch(result.warnings[0].message, /Internal provider|test-private-cart-key/);
        assert.deepEqual(result.userErrors, []);
        assert.equal(Object.hasOwn(result.cart ?? {}, "id"), false);
      },
    );

    await context.test(
      `${operation.name} retains partial cart state with safe user errors`,
      async (subtest) => {
        const requests = mockStorefront(subtest, {
          [operation.name]: {
            cart: rawCart(1),
            warnings: [],
            userErrors: [
              {
                code: "TEST_UNKNOWN_PROVIDER_CODE",
                field: ["lines", "0", "merchandiseId"],
                message: `Raw provider error containing ${CART_ID}`,
              },
            ],
          },
        });
        const result = await operation.run();

        assert.equal(requests.length, 1);
        assert.equal(result.cart?.totalQuantity, 1);
        assert.deepEqual(result.warnings, []);
        assert.equal(result.userErrors[0].code, "TEST_UNKNOWN_PROVIDER_CODE");
        assert.deepEqual(result.userErrors[0].field, ["lines", "0", "merchandiseId"]);
        assert.ok(result.userErrors[0].message.length > 0);
        assert.doesNotMatch(result.userErrors[0].message, /Raw provider|test-private-cart-key/);
      },
    );
  }

  await context.test(
    "create keeps a partial cart session ID outside the public cart snapshot",
    async (subtest) => {
      mockStorefront(subtest, {
        cartCreate: {
          cart: rawCart(1),
          warnings: [],
          userErrors: [{ code: "INVALID", field: ["lines"], message: "Untrusted detail" }],
        },
      });
      const result = await cartModule.createCart({
        lines: [{ merchandiseId: VARIANT_ID, quantity: 2 }],
      });

      assert.equal(result.cartId, CART_ID);
      assert.equal(result.cart?.lines[0].quantity, 1);
      assert.equal(Object.hasOwn(result.cart ?? {}, "id"), false);
    },
  );

  await context.test(
    "rejected cart creation returns a recoverable result without a session ID",
    async (subtest) => {
      mockStorefront(subtest, {
        cartCreate: {
          cart: null,
          warnings: [],
          userErrors: [{ code: "INVALID", field: ["lines"], message: "Untrusted detail" }],
        },
      });
      const result = await cartModule.createCart({
        lines: [{ merchandiseId: VARIANT_ID, quantity: 2 }],
      });

      assert.equal(result.cartId, null);
      assert.equal(result.cart, null);
      assert.equal(result.userErrors.length, 1);
    },
  );

  await context.test(
    "missing or expired cart remains null without attempting another mutation",
    async (subtest) => {
      const requests = mockStorefront(subtest, { cart: null });

      assert.equal(await cartModule.getCart(CART_ID), null);
      assert.equal(requests.length, 1);
      assert.match(requests[0].query, /query GetCart/);
    },
  );

  await context.test(
    "getCart returns fresh variant quantities and no private cart ID",
    async (subtest) => {
      const requests = mockStorefront(subtest, { cart: rawCart(1) });
      const cart = await cartModule.getCart(CART_ID);

      assert.equal(requests.length, 1);
      assert.equal(cart?.lines[0].quantity, 1);
      assert.equal(cart?.totalQuantity, 1);
      assert.equal(Object.hasOwn(cart ?? {}, "id"), false);
    },
  );

  await context.test(
    "native gift-wrap associations and instructions survive normalization without unrelated attributes",
    async (subtest) => {
      const raw = rawCart(1);
      const nodes = (raw.lines as { nodes: Array<Record<string, unknown>> }).nodes;
      const parent = nodes[0];
      const group = { key: GIFT_WRAP_GROUP_ATTRIBUTE, value: "public-correlation-group" };
      parent.attributes = [group, { key: "private-provider-note", value: CART_ID }];
      const merchandise = parent.merchandise as Record<string, unknown>;
      const product = merchandise.product as Record<string, unknown>;
      nodes.push({
        ...parent,
        id: "gid://shopify/CartLine/gift-wrap",
        attributes: [group],
        parentRelationship: { parent: { id: LINE_ID } },
        instructions: { canRemove: true, canUpdateQuantity: false },
        merchandise: {
          ...merchandise,
          id: "gid://shopify/ProductVariant/gift-wrap",
          product: { ...product, handle: "gift-wrap", title: "Gift Wrap" },
        },
      });
      raw.totalQuantity = 2;
      const requests = mockStorefront(subtest, {
        cartLinesAdd: { cart: raw, warnings: [], userErrors: [] },
      });
      const lines = [
        {
          merchandiseId: "gid://shopify/ProductVariant/gift-wrap",
          quantity: 1,
          attributes: [group],
          parent: { lineId: LINE_ID },
        },
      ];
      const result = await cartModule.addCartLines(CART_ID, lines);

      assert.deepEqual(requests[0].variables?.lines, lines);
      assert.match(requests[0].query, /lines\(first: 250\)/);
      assert.match(requests[0].query, /\.\.\. on CartLine\s*\{\s*parentRelationship/);
      assert.equal(result.cart?.totalQuantity, 2);
      assert.deepEqual(result.cart?.lines[0].attributes, [group]);
      assert.equal(result.cart?.lines[0].parentLineId, null);
      assert.equal(result.cart?.lines[1].parentLineId, LINE_ID);
      assert.equal(result.cart?.lines[1].productHandle, "gift-wrap");
      assert.deepEqual(result.cart?.lines[1].instructions, {
        canRemove: true,
        canUpdateQuantity: false,
      });
      assert.doesNotMatch(
        JSON.stringify(result.cart),
        /private-provider-note|test-private-cart-key/,
      );
    },
  );

  await context.test(
    "out-of-stock warnings identify the zero placeholder while preserving accepted units of the same variant",
    async (subtest) => {
      const raw = rawCart(1);
      const nodes = (raw.lines as { nodes: Array<Record<string, unknown>> }).nodes;
      const placeholderId = "gid://shopify/CartLine/out-of-stock-placeholder";
      nodes.push({
        ...nodes[0],
        id: placeholderId,
        quantity: 0,
        cost: {
          totalAmount: { amount: "0.00", currencyCode: "USD" },
          amountPerQuantity: { amount: "50", currencyCode: "USD" },
        },
      });
      mockStorefront(subtest, {
        cartLinesAdd: {
          cart: raw,
          userErrors: [],
          warnings: [
            {
              code: "MERCHANDISE_OUT_OF_STOCK",
              target: placeholderId,
              message: `Raw provider message including ${CART_ID}`,
            },
          ],
        },
      });
      const result = await cartModule.addCartLines(CART_ID, [
        { merchandiseId: VARIANT_ID, quantity: 1 },
      ]);

      assert.equal(result.cart?.lines.length, 2);
      assert.equal(result.cart?.lines[1].quantity, 0);
      assert.equal(result.cart?.totalQuantity, 1);
      assert.equal(result.warnings[0].target, placeholderId);
      assert.equal(
        result.warnings[0].message,
        "No more Test Shirt (Size: Small, Color: Navy) are available.",
      );
      assert.doesNotMatch(
        result.warnings[0].message,
        /Raw provider|test-private-cart-key|out of stock/,
      );
    },
  );

  await context.test(
    "stock warning quantity is specific to its variant rather than all same-title sizes",
    async (subtest) => {
      const raw = rawCart(0);
      const nodes = (raw.lines as { nodes: Array<Record<string, unknown>> }).nodes;
      const merchandise = nodes[0].merchandise as Record<string, unknown>;
      nodes.push({
        ...nodes[0],
        id: "gid://shopify/CartLine/different-size",
        quantity: 2,
        merchandise: { ...merchandise, id: "gid://shopify/ProductVariant/different-size" },
      });
      raw.totalQuantity = 2;
      mockStorefront(subtest, {
        cartLinesAdd: {
          cart: raw,
          userErrors: [],
          warnings: [{ code: "MERCHANDISE_OUT_OF_STOCK", target: LINE_ID, message: CART_ID }],
        },
      });
      const result = await cartModule.addCartLines(CART_ID, [
        { merchandiseId: VARIANT_ID, quantity: 1 },
      ]);

      assert.equal(
        result.warnings[0].message,
        "Test Shirt (Size: Small, Color: Navy) is out of stock.",
      );
      assert.doesNotMatch(result.warnings[0].message, /No more/);
    },
  );

  await context.test(
    "a stock warning on an accepted nonzero line says no more units are available",
    async (subtest) => {
      mockStorefront(subtest, {
        cartLinesUpdate: {
          cart: rawCart(1),
          userErrors: [],
          warnings: [{ code: "MERCHANDISE_OUT_OF_STOCK", target: LINE_ID, message: CART_ID }],
        },
      });
      const result = await cartModule.updateCartLines(CART_ID, [{ id: LINE_ID, quantity: 2 }]);

      assert.equal(result.cart?.lines[0].quantity, 1);
      assert.equal(
        result.warnings[0].message,
        "No more Test Shirt (Size: Small, Color: Navy) are available.",
      );
      assert.doesNotMatch(result.warnings[0].message, /out of stock|test-private-cart-key/);
    },
  );

  await context.test("stock shortages keep a concise product and size message", async (subtest) => {
    mockStorefront(subtest, {
      cartLinesAdd: {
        cart: rawCart(1),
        userErrors: [],
        warnings: [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK", target: LINE_ID, message: CART_ID }],
      },
    });
    const result = await cartModule.addCartLines(CART_ID, [
      { merchandiseId: VARIANT_ID, quantity: 2 },
    ]);

    assert.equal(
      result.warnings[0].message,
      "Only the available quantity of Test Shirt (Size: Small, Color: Navy) was added.",
    );
  });

  await context.test("cart warnings deduplicate by code and safe target", async (subtest) => {
    const otherTarget = "gid://shopify/CartLine/other-item";
    mockStorefront(subtest, {
      cartLinesAdd: {
        cart: rawCart(1),
        userErrors: [],
        warnings: [
          { code: "MERCHANDISE_OUT_OF_STOCK", target: LINE_ID, message: CART_ID },
          { code: "MERCHANDISE_OUT_OF_STOCK", target: LINE_ID, message: "Duplicate details" },
          { code: "MERCHANDISE_OUT_OF_STOCK", target: otherTarget, message: CART_ID },
          { code: "MERCHANDISE_NOT_ENOUGH_STOCK", target: LINE_ID, message: CART_ID },
          { code: "MERCHANDISE_OUT_OF_STOCK", target: CART_ID, message: CART_ID },
          { code: "MERCHANDISE_OUT_OF_STOCK", target: `${CART_ID}&other=1`, message: CART_ID },
        ],
      },
    });
    const result = await cartModule.addCartLines(CART_ID, [
      { merchandiseId: VARIANT_ID, quantity: 2 },
    ]);

    assert.deepEqual(
      result.warnings.map(({ code, target }) => ({ code, target })),
      [
        { code: "MERCHANDISE_OUT_OF_STOCK", target: LINE_ID },
        { code: "MERCHANDISE_OUT_OF_STOCK", target: otherTarget },
        { code: "MERCHANDISE_NOT_ENOUGH_STOCK", target: LINE_ID },
        { code: "MERCHANDISE_OUT_OF_STOCK", target: null },
      ],
    );
    assert.equal(result.warnings[3].message, "An item in your bag is out of stock.");
    assert.doesNotMatch(JSON.stringify(result.warnings), /Duplicate details|test-private-cart-key/);
  });

  const cartRoute = await loadServerModule(() => import("@/app/api/shopify/cart/route"));

  await context.test(
    "add route exposes a stock-capped cart without confirming the full addition",
    async (subtest) => {
      const session = mockCartCookies(subtest, CART_ID);
      const requests = mockStorefront(subtest, [
        { cart: rawCart(1) },
        {
          cartLinesAdd: {
            cart: rawCart(2),
            warnings: [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: CART_ID, target: LINE_ID }],
            userErrors: [],
          },
        },
      ]);
      const response = await cartRoute.POST(
        cartRequest("POST", { lines: [{ merchandiseId: VARIANT_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;

      assert.equal(response.status, 200);
      assert.equal(payload.confirmed, false);
      assert.equal(payload.cart?.lines[0].quantity, 2);
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
      assert.equal(payload.warnings[0].code, "MERCHANDISE_NOT_ENOUGH_STOCK");
      assert.deepEqual(payload.userErrors, []);
      assert.doesNotMatch(JSON.stringify(payload), /test-private-cart-key/);
      assert.equal(session.cartId, CART_ID);
      assert.equal(session.writes, 0);
      assert.equal(requests.length, 2);
    },
  );

  await context.test(
    "new stock-capped cart keeps its session and actual contents for recovery",
    async (subtest) => {
      const session = mockCartCookies(subtest, null);
      const requests = mockStorefront(subtest, {
        cartCreate: {
          cart: rawCart(1),
          warnings: [{ code: "MERCHANDISE_NOT_ENOUGH_STOCK", message: CART_ID, target: LINE_ID }],
          userErrors: [],
        },
      });
      const response = await cartRoute.POST(
        cartRequest("POST", { lines: [{ merchandiseId: VARIANT_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;

      assert.equal(response.status, 201);
      assert.equal(payload.confirmed, false);
      assert.equal(payload.cart?.lines[0].quantity, 1);
      assert.equal(session.cartId, CART_ID);
      assert.equal(session.writes, 1);
      assert.equal(requests.length, 1);
      assert.doesNotMatch(JSON.stringify(payload), /test-private-cart-key/);
    },
  );

  await context.test(
    "expired add session is replaced once without duplicating the requested addition",
    async (subtest) => {
      const session = mockCartCookies(
        subtest,
        "gid://shopify/Cart/expired-test-cart?key=expired-key",
      );
      const requests = mockStorefront(subtest, [
        { cart: null },
        { cartCreate: { cart: rawCart(2), warnings: [], userErrors: [] } },
      ]);
      const response = await cartRoute.POST(
        cartRequest("POST", { lines: [{ merchandiseId: VARIANT_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;

      assert.equal(response.status, 201);
      assert.equal(payload.confirmed, true);
      assert.equal(payload.cart?.lines[0].quantity, 2);
      assert.equal(session.deletes, 1);
      assert.equal(session.writes, 1);
      assert.equal(session.cartId, CART_ID);
      assert.equal(requests.length, 2);
      assert.match(requests[0].query, /query GetCart/);
      assert.match(requests[1].query, /mutation CreateCart/);
      assert.doesNotMatch(JSON.stringify(payload), /test-private-cart-key|expired-key/);
    },
  );

  for (const method of ["PATCH", "DELETE"] as const) {
    await context.test(
      `expired ${method} session clears the cookie without mutating a replacement cart`,
      async (subtest) => {
        const session = mockCartCookies(subtest, CART_ID);
        const requests = mockStorefront(subtest, { cart: null });
        const body =
          method === "PATCH" ? { lines: [{ id: LINE_ID, quantity: 2 }] } : { lineIds: [LINE_ID] };
        const response = await cartRoute[method](cartRequest(method, body));
        const payload = (await response.json()) as ShopifyCartResponse;

        assert.equal(response.status, 404);
        assert.equal(payload.cart, null);
        assert.equal(payload.confirmed, false);
        assert.ok(payload.message);
        assert.equal(session.cartId, null);
        assert.equal(session.deletes, 1);
        assert.equal(session.writes, 0);
        assert.equal(requests.length, 1);
        assert.match(requests[0].query, /query GetCart/);
      },
    );
  }

  await context.test(
    "rejected update preserves the active session and asks for refresh without repeating the mutation",
    async (subtest) => {
      const session = mockCartCookies(subtest, CART_ID);
      const requests = mockStorefront(subtest, [
        { cart: rawCart(1) },
        {
          cartLinesUpdate: {
            cart: null,
            warnings: [],
            userErrors: [
              { code: "INVALID_MERCHANDISE_LINE", field: ["lines", "0"], message: CART_ID },
            ],
          },
        },
      ]);
      const response = await cartRoute.PATCH(
        cartRequest("PATCH", { lines: [{ id: LINE_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;

      assert.equal(response.status, 409);
      assert.equal(payload.confirmed, false);
      assert.equal(Object.hasOwn(payload, "cart"), false);
      assert.equal(payload.userErrors[0].code, "INVALID_MERCHANDISE_LINE");
      assert.match(payload.message ?? "", /refresh/i);
      assert.equal(session.cartId, CART_ID);
      assert.equal(session.deletes, 0);
      assert.equal(session.writes, 0);
      assert.equal(requests.length, 2);
      assert.doesNotMatch(JSON.stringify(payload), /test-private-cart-key/);
    },
  );

  await context.test(
    "ambiguous transport failure asks for refresh and does not repeat the update",
    async (subtest) => {
      const session = mockCartCookies(subtest, CART_ID);
      let requestCount = 0;
      const loggedErrors: unknown[][] = [];
      subtest.mock.method(console, "error", (...values: unknown[]): void => {
        loggedErrors.push(values);
      });
      subtest.mock.method(globalThis, "fetch", async (): Promise<Response> => {
        requestCount += 1;
        if (requestCount === 1) {
          return Response.json({ data: { cart: rawCart(1) } });
        }
        throw new Error(`Fake upstream transport failure: ${CART_ID}`);
      });
      const response = await cartRoute.PATCH(
        cartRequest("PATCH", { lines: [{ id: LINE_ID, quantity: 2 }] }),
      );
      const payload = (await response.json()) as ShopifyCartResponse;

      assert.equal(response.status, 500);
      assert.equal(payload.confirmed, false);
      assert.equal(Object.hasOwn(payload, "cart"), false);
      assert.deepEqual(payload.warnings, []);
      assert.deepEqual(payload.userErrors, []);
      assert.match(payload.message ?? "", /refresh/i);
      assert.equal(session.cartId, CART_ID);
      assert.equal(session.deletes, 0);
      assert.equal(requestCount, 2);
      assert.doesNotMatch(JSON.stringify(payload), /test-private-cart-key|Fake upstream/);
      assert.doesNotMatch(JSON.stringify(loggedErrors), /test-private-cart-key|Fake upstream/);
    },
  );

  for (const method of ["PATCH", "DELETE"] as const) {
    await context.test(
      `malformed ${method} JSON is recoverable and never reaches Shopify`,
      async (subtest) => {
        mockCartCookies(subtest, CART_ID);
        const requests = mockStorefront(subtest, []);
        const response = await cartRoute[method](
          new NextRequest("https://storefront.example.test/api/shopify/cart", {
            method,
            headers: { "Content-Type": "application/json" },
            body: "{",
          }),
        );
        const payload = (await response.json()) as ShopifyCartResponse;

        assert.equal(response.status, 400);
        assert.equal(payload.confirmed, false);
        assert.deepEqual(payload.warnings, []);
        assert.deepEqual(payload.userErrors, []);
        assert.ok(payload.message);
        assert.equal(requests.length, 0);
      },
    );
  }

  const checkoutRoute = await loadServerModule(
    () => import("@/app/api/shopify/cart/checkout/route"),
  );

  await context.test(
    "checkout clears an expired session without returning a redirect",
    async (subtest) => {
      const session = mockCartCookies(subtest, CART_ID);
      const requests = mockStorefront(subtest, { cart: null });
      const response = await checkoutRoute.POST(cartRequest("POST"));
      const payload = (await response.json()) as ShopifyCartResponse & { checkoutUrl?: string };

      assert.equal(response.status, 404);
      assert.equal(payload.cart, null);
      assert.equal(payload.checkoutUrl, undefined);
      assert.deepEqual(payload.warnings, []);
      assert.deepEqual(payload.userErrors, []);
      assert.equal(session.cartId, null);
      assert.equal(session.deletes, 1);
      assert.equal(requests.length, 1);
    },
  );

  await context.test(
    "checkout rejects an empty authoritative cart without a redirect",
    async (subtest) => {
      const session = mockCartCookies(subtest, CART_ID);
      mockStorefront(subtest, { cart: { ...rawCart(0), lines: { nodes: [] } } });
      const response = await checkoutRoute.POST(cartRequest("POST"));
      const payload = (await response.json()) as ShopifyCartResponse & { checkoutUrl?: string };

      assert.equal(response.status, 400);
      assert.equal(payload.cart?.totalQuantity, 0);
      assert.equal(payload.checkoutUrl, undefined);
      assert.equal(session.cartId, CART_ID);
      assert.equal(session.deletes, 0);
    },
  );

  await context.test(
    "checkout handoff includes fresh authoritative contents and stays private",
    async (subtest) => {
      mockCartCookies(subtest, CART_ID);
      const requests = mockStorefront(subtest, { cart: rawCart(1) });
      const response = await checkoutRoute.POST(cartRequest("POST"));
      const payload = (await response.json()) as ShopifyCartResponse & { checkoutUrl?: string };

      assert.equal(response.status, 200);
      assert.equal(payload.cart?.lines[0].quantity, 1);
      assert.equal(payload.checkoutUrl, "https://checkout.example.test/test-checkout");
      assert.equal(response.headers.get("Cache-Control"), "private, no-store");
      assert.equal(requests.length, 1);
      assert.doesNotMatch(JSON.stringify(payload), /test-private-cart-key/);
    },
  );
});
