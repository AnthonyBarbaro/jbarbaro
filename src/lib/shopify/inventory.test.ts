import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

type RequestFixture = { query: string; variables?: Record<string, unknown> };

test("inventory reads preserve nullable stock and degrade safely without inventory permission", async (context) => {
  const environment = {
    SHOPIFY_STORE_DOMAIN: "inventory-tests.myshopify.com",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: "synthetic-inventory-test-token",
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
  const require = createRequire(`${process.cwd()}/package.json`);
  const cache = require("next/cache") as {
    unstable_cache: (callback: (...args: unknown[]) => Promise<unknown>) => unknown;
  };
  context.mock.method(
    cache,
    "unstable_cache",
    (callback: (...args: unknown[]) => Promise<unknown>) => callback,
  );
  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        resolutionContext,
      );
    },
  });
  const client = await import("@/lib/shopify/client");
  const carts = await import("@/lib/shopify/cart");
  const products = await import("@/lib/shopify/products");
  hook.deregister();
  const price = { amount: "100", currencyCode: "USD" };
  const variant = {
    id: "inventory-variant",
    title: "M",
    availableForSale: true,
    quantityAvailable: 1,
    currentlyNotInStock: false,
    price,
    compareAtPrice: null,
    selectedOptions: [{ name: "Size", value: "M" }],
  };
  const product = {
    id: "inventory-product",
    handle: "inventory-product",
    title: "Synthetic Shirt",
    createdAt: "2026-01-01T00:00:00Z",
    description: "",
    descriptionHtml: "",
    vendor: "Synthetic Store",
    productType: "Shirt",
    tags: [],
    featuredImage: null,
    images: { nodes: [] },
    collections: { nodes: [] },
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    variants: { nodes: [variant] },
  };
  const rawCart = {
    checkoutUrl: "https://checkout.example.test/inventory",
    totalQuantity: 1,
    cost: { subtotalAmount: price, totalAmount: price, totalTaxAmount: null },
    lines: {
      nodes: [
        {
          id: "inventory-line",
          quantity: 1,
          cost: { totalAmount: price, amountPerQuantity: price },
          merchandise: { ...variant, image: null, product },
        },
      ],
    },
  };
  const denied = {
    errors: [
      {
        message: "Access denied for quantityAvailable field.",
        extensions: { code: "ACCESS_DENIED" },
      },
    ],
  };
  const readQuery = `query Inventory { product { variants { quantityAvailable\n currentlyNotInStock } } }`;

  await context.test(
    "product and exact cart variant retain stock and backorder metadata",
    async (subcontext) => {
      const requests: RequestFixture[] = [];
      subcontext.mock.method(
        globalThis,
        "fetch",
        async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          assert.equal(
            String(input),
            "https://inventory-tests.myshopify.com/api/2026-01/graphql.json",
          );
          const request = JSON.parse(String(init?.body)) as RequestFixture;
          requests.push(request);
          return Response.json({
            data: request.query.includes("query GetCart(") ? { cart: rawCart } : { product },
          });
        },
      );
      const loadedProduct = await products.getShopProduct(product.handle);
      const loadedCart = await carts.getCart("synthetic-cart");
      assert.equal(loadedProduct?.variants[0].quantityAvailable, 1);
      assert.equal(loadedProduct?.variants[0].currentlyNotInStock, false);
      assert.deepEqual(loadedCart?.lines[0].inventory, {
        quantityAvailable: 1,
        currentlyNotInStock: false,
        availableForSale: true,
      });
      assert.equal(loadedCart?.lines[0].variants[0].quantityAvailable, 1);
      for (const request of requests) assert.match(request.query, /quantityAvailable/);
    },
  );

  await context.test(
    "a permission-denied read retries once without the optional field",
    async (subcontext) => {
      const requests: RequestFixture[] = [];
      subcontext.mock.method(
        globalThis,
        "fetch",
        async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          const request = JSON.parse(String(init?.body)) as RequestFixture;
          requests.push(request);
          return Response.json(
            requests.length === 1 ? denied : { data: { product: { quantityAvailable: null } } },
          );
        },
      );
      const result = await client.storefrontRequest<{ product: { quantityAvailable: null } }>({
        query: "query Inventory {\nquantityAvailable\n}",
      });
      assert.equal(result.product.quantityAvailable, null);
      assert.equal(requests.length, 2);
      assert.match(requests[0].query, /quantityAvailable/);
      assert.doesNotMatch(requests[1].query, /quantityAvailable/);
    },
  );

  await context.test(
    "field-denial paths are accepted without depending on provider message wording",
    async (subcontext) => {
      let calls = 0;
      subcontext.mock.method(globalThis, "fetch", async (): Promise<Response> => {
        calls += 1;
        return Response.json(
          calls === 1
            ? {
                errors: [
                  {
                    message: "Forbidden",
                    path: ["product", "variants", 0, "quantityAvailable"],
                    extensions: { code: "ACCESS_DENIED" },
                  },
                ],
              }
            : { data: { product: null } },
        );
      });
      assert.deepEqual(
        await client.storefrontRequest({ query: "query Inventory {\nquantityAvailable\n}" }),
        { product: null },
      );
      assert.equal(calls, 2);
    },
  );

  await context.test(
    "permission fallback maps cart inventory to unknown instead of zero",
    async (subcontext) => {
      let calls = 0;
      subcontext.mock.method(
        globalThis,
        "fetch",
        async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          calls += 1;
          const request = JSON.parse(String(init?.body)) as RequestFixture;
          if (request.query.includes("quantityAvailable")) return Response.json(denied);
          const unknownVariant = { ...variant, quantityAvailable: undefined };
          return Response.json({
            data: {
              cart: {
                ...rawCart,
                lines: {
                  nodes: [
                    {
                      ...rawCart.lines.nodes[0],
                      merchandise: {
                        ...unknownVariant,
                        image: null,
                        product: { ...product, variants: { nodes: [unknownVariant] } },
                      },
                    },
                  ],
                },
              },
            },
          });
        },
      );
      const loaded = await carts.getCart("synthetic-cart");
      assert.equal(calls, 2);
      assert.equal(loaded?.lines[0].inventory?.quantityAvailable, null);
      assert.equal(loaded?.lines[0].variants[0].quantityAvailable, null);
    },
  );

  await context.test(
    "cart writes do not request optional inventory permission",
    async (subcontext) => {
      let calls = 0;
      subcontext.mock.method(
        globalThis,
        "fetch",
        async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
          calls += 1;
          const request = JSON.parse(String(init?.body)) as RequestFixture;
          assert.match(request.query, /mutation AddCartLines/);
          assert.doesNotMatch(request.query, /quantityAvailable/);
          return Response.json({
            data: { cartLinesAdd: { cart: rawCart, warnings: [], userErrors: [] } },
          });
        },
      );
      const result = await carts.addCartLines("synthetic-cart", [
        { merchandiseId: variant.id, quantity: 1 },
      ]);
      assert.equal(result.cart?.lines[0].quantity, 1);
      assert.equal(calls, 1);
    },
  );

  for (const fixture of [
    {
      name: "mutation responses are never retried",
      query: "mutation Inventory {\nquantityAvailable\n}",
      errors: denied.errors,
    },
    {
      name: "unrelated access failures are not retried",
      query: readQuery,
      errors: [
        { message: "Access denied for price field.", extensions: { code: "ACCESS_DENIED" } },
      ],
    },
    { name: "transport failures are not retried", query: readQuery, errors: null },
  ]) {
    await context.test(fixture.name, async (subcontext) => {
      let calls = 0;
      subcontext.mock.method(globalThis, "fetch", async (): Promise<Response> => {
        calls += 1;
        if (!fixture.errors) throw new Error("Synthetic offline boundary");
        return Response.json({ errors: fixture.errors });
      });
      await assert.rejects(client.storefrontRequest({ query: fixture.query }));
      assert.equal(calls, 1);
    });
  }
});
