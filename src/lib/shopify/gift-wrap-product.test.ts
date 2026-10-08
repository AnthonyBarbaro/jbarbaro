import assert from "node:assert/strict";
import { createRequire, registerHooks } from "node:module";
import test from "node:test";

import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";

type CachedCallback = (...args: unknown[]) => Promise<unknown>;

function variant(id: string, availableForSale = true): ShopifyProductVariant {
  return {
    id,
    title: "Default Title",
    availableForSale,
    price: { amount: "17.25", currencyCode: "CAD" },
    compareAtPrice: null,
    selectedOptions: [{ name: "Title", value: "Default Title" }],
  };
}

function product(variants: ShopifyProductVariant[]): ShopifyProduct {
  const price = { amount: "17.25", currencyCode: "CAD" };

  return {
    id: "gift-wrap-product",
    handle: "gift-wrap",
    title: "Seasonal Gift Wrap",
    createdAt: "2026-01-01T00:00:00Z",
    description: "",
    descriptionHtml: "",
    vendor: "Test Clothier",
    productType: "Service",
    tags: [],
    reviewSummary: null,
    featuredImage: null,
    images: [],
    collections: [],
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    variants,
  };
}

test("gift-wrap offers use the published product variant and price without guessing", async (context) => {
  let cachedProduct: ShopifyProduct | null = product([variant("current-gift-variant")]);
  let lookupError: Error | null = null;
  const cacheModule = createRequire(`${process.cwd()}/package.json`)("next/cache") as {
    unstable_cache: (callback: CachedCallback, keyParts?: string[]) => CachedCallback;
  };

  context.mock.method(
    cacheModule,
    "unstable_cache",
    (callback: CachedCallback, keyParts?: string[]): CachedCallback =>
      keyParts?.includes("shopify-product")
        ? async (handle: unknown): Promise<ShopifyProduct | null> => {
            assert.equal(handle, "gift-wrap");

            if (lookupError) {
              throw lookupError;
            }

            return cachedProduct;
          }
        : callback,
  );

  const hook = registerHooks({
    resolve(specifier, resolutionContext, nextResolve) {
      return nextResolve(
        specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier,
        resolutionContext,
      );
    },
  });
  const { getGiftWrapOffer } = await import("@/lib/shopify/gift-wrap-product.server").finally(() =>
    hook.deregister(),
  );

  await context.test("returns the current variant, title, currency and price", async () => {
    assert.deepEqual(await getGiftWrapOffer(), {
      merchandiseId: "current-gift-variant",
      title: "Seasonal Gift Wrap",
      price: { amount: "17.25", currencyCode: "CAD" },
      availableForSale: true,
    });
  });

  await context.test(
    "retains the known offer and price when its only variant is sold out",
    async () => {
      cachedProduct = product([variant("sold-out-gift", false)]);
      assert.equal((await getGiftWrapOffer())?.availableForSale, false);
      assert.equal((await getGiftWrapOffer())?.merchandiseId, "sold-out-gift");
    },
  );

  await context.test(
    "chooses the sole available variant rather than a sold-out variant",
    async () => {
      cachedProduct = product([variant("old-gift", false), variant("available-gift")]);
      assert.equal((await getGiftWrapOffer())?.merchandiseId, "available-gift");
    },
  );

  await context.test("does not choose between multiple available variants", async () => {
    cachedProduct = product([variant("gift-one"), variant("gift-two")]);
    assert.equal(await getGiftWrapOffer(), null);
  });

  await context.test("does not guess a price from multiple sold-out variants", async () => {
    cachedProduct = product([variant("gift-one", false), variant("gift-two", false)]);
    assert.equal(await getGiftWrapOffer(), null);
  });

  await context.test("missing products and products without variants have no offer", async () => {
    cachedProduct = product([]);
    assert.equal(await getGiftWrapOffer(), null);
    cachedProduct = null;
    assert.equal(await getGiftWrapOffer(), null);
  });

  await context.test(
    "lookup failures remain visible to the caller for graceful page handling",
    async () => {
      lookupError = new Error("Shopify product lookup unavailable");
      await assert.rejects(getGiftWrapOffer(), lookupError);
    },
  );
});
