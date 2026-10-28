import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import type { ShopifyProduct } from "@/lib/shopify/types";

type CachedCallback = (...args: unknown[]) => Promise<unknown>;

async function loadServerModule<T>(load: () => Promise<T>): Promise<T> {
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

test("customer product names are consistent across Shopify read boundaries", async (context) => {
  const rawTitle = "Canali Sport Coat CF00142/399";
  const money = { amount: "100.00", currencyCode: "USD" };
  const variant = {
    id: "gid://shopify/ProductVariant/title-test",
    title: "38/S",
    availableForSale: true,
    quantityAvailable: 2,
    currentlyNotInStock: false,
    price: money,
    compareAtPrice: null,
    selectedOptions: [
      { name: "Size", value: "38" },
      { name: "Length", value: "S" },
    ],
  };
  const cachedProduct: ShopifyProduct = {
    id: "gid://shopify/Product/title-test",
    handle: "canali-sport-coat-cf00142-399",
    title: rawTitle,
    createdAt: "2026-01-01T00:00:00Z",
    vendor: "Canali",
    productType: "Sport Coat",
    description: "",
    descriptionHtml: "",
    tags: [],
    reviewSummary: null,
    featuredImage: null,
    images: [],
    collections: [],
    priceRange: { minVariantPrice: money, maxVariantPrice: money },
    variants: [variant],
  };
  const rawProduct = {
    ...cachedProduct,
    images: { nodes: [] },
    collections: { nodes: [] },
    variants: { nodes: [variant] },
    reviewRating: null,
    reviewCount: null,
  };
  const environment = {
    SHOPIFY_STORE_DOMAIN: "unit-test.myshopify.com",
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: "unit-test-storefront-token",
    SHOPIFY_STOREFRONT_API_VERSION: "2026-01",
  };
  const previous = new Map(Object.keys(environment).map((key) => [key, process.env[key]]));
  Object.assign(process.env, environment);
  context.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  const cacheModule = createRequire(`${process.cwd()}/package.json`)("next/cache") as {
    unstable_cache: (callback: CachedCallback, keyParts?: string[]) => CachedCallback;
  };
  context.mock.method(
    cacheModule,
    "unstable_cache",
    (callback: CachedCallback, keyParts?: string[]): CachedCallback =>
      keyParts?.includes("shopify-product") ? async () => cachedProduct : callback,
  );
  context.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> => {
      assert.equal(input, "https://unit-test.myshopify.com/api/2026-01/graphql.json");
      const body = JSON.parse(String(init?.body)) as { query: string };
      assert.doesNotMatch(body.query, /\bmutation\b/);
      if (/\bGetCart\b/.test(body.query)) {
        assert.match(body.query, /product\s*\{\s*title\s+vendor/);
        return Response.json({
          data: {
            cart: {
              checkoutUrl: "https://checkout.example.test/title-test",
              totalQuantity: 1,
              cost: { subtotalAmount: money, totalAmount: money, totalTaxAmount: null },
              lines: {
                nodes: [
                  {
                    id: "gid://shopify/CartLine/title-test",
                    quantity: 1,
                    cost: { totalAmount: money, amountPerQuantity: money },
                    merchandise: { ...variant, image: null, product: rawProduct },
                  },
                ],
              },
            },
          },
        });
      }
      if (/\bPredictiveProductSearch\b/.test(body.query)) {
        return Response.json({ data: { predictiveSearch: { products: [rawProduct] } } });
      }
      if (/\b(?:AllShopProductPreviews|ShopProductPreviews)\b/.test(body.query)) {
        assert.match(body.query, /title\s+vendor\s+productType/);
      }
      return Response.json({
        data: {
          products: {
            nodes: [rawProduct],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      });
    },
  );

  const products = await loadServerModule(() => import("@/lib/shopify/products"));
  const cart = await loadServerModule(() => import("@/lib/shopify/cart"));

  await context.test(
    "catalog names omit style identifiers while purchase identities remain intact",
    async () => {
      const [product] = await products.getAllShopProducts();
      assert.equal(product.title, "Canali Windowpane Sport Coat — Navy");
      assert.equal(product.id, cachedProduct.id);
      assert.equal(product.handle, cachedProduct.handle);
      assert.deepEqual(product.variants, [variant]);
      assert.equal(rawProduct.title, rawTitle);
    },
  );

  await context.test(
    "cached product pages also receive current names without mutating cached data",
    async () => {
      const product = await products.getShopProduct(cachedProduct.handle);
      assert.equal(product?.title, "Canali Windowpane Sport Coat — Navy");
      assert.equal(cachedProduct.title, rawTitle);
      assert.notEqual(product, cachedProduct);
    },
  );

  await context.test("predictive search and sitemap previews agree with the catalog", async () => {
    const [search] = await products.searchShopProducts("Canali");
    const [preview] = await products.getShopProductPreviews();
    const [allPreview] = await products.getAllShopProductPreviews();
    assert.equal(search.title, "Canali Windowpane Sport Coat — Navy");
    assert.equal(preview.title, "Canali Windowpane Sport Coat — Navy");
    assert.equal(allPreview.title, "Canali Windowpane Sport Coat — Navy");
    assert.equal(allPreview.handle, cachedProduct.handle);
  });

  await context.test(
    "cart names agree while variant titles and selected options stay unchanged",
    async () => {
      const snapshot = await cart.getCart("gid://shopify/Cart/title-test");
      const line = snapshot?.lines[0];
      assert.equal(line?.productTitle, "Canali Windowpane Sport Coat — Navy");
      assert.equal(line?.variantTitle, "38/S");
      assert.equal(line?.variantId, variant.id);
      assert.equal(line?.productHandle, cachedProduct.handle);
      assert.deepEqual(line?.selectedOptions, variant.selectedOptions);
      assert.deepEqual(line?.variants[0], variant);
    },
  );
});
