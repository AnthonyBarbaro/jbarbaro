import assert from "node:assert/strict";
import test from "node:test";

import {
  getFeaturedRecommendationStrategy,
  isFeaturedRecommendationCandidate,
  rotateRecommendationsForSource,
} from "@/lib/shopify/product-recommendations";
import type { FitProduct } from "@/lib/fit-profile";

function product(vendor: string, productType: string, title = productType): FitProduct {
  return {
    title,
    vendor,
    productType,
    tags: [],
    collections: [],
    variants: [],
  };
}

test("features Eton shirts for products from other brands", () => {
  const strategy = getFeaturedRecommendationStrategy("Canali");

  assert.equal(strategy.vendor, "Eton");
  assert.equal(strategy.title, "Eton Shirts");
  assert.equal(isFeaturedRecommendationCandidate(product("Eton", "Dress Shirt"), strategy), true);
  assert.equal(isFeaturedRecommendationCandidate(product("Eton", "Sport Coat"), strategy), false);
  assert.equal(
    isFeaturedRecommendationCandidate(product("Canali", "Dress Shirt"), strategy),
    false,
  );
});

test("switches Eton product pages to available Canali products", () => {
  const strategy = getFeaturedRecommendationStrategy(" ETON ");

  assert.equal(strategy.vendor, "Canali");
  assert.equal(strategy.title, "Canali");
  assert.equal(isFeaturedRecommendationCandidate(product("Canali", "Sport Coat"), strategy), true);
  assert.equal(isFeaturedRecommendationCandidate(product("Canali", "Dress Shirt"), strategy), true);
  assert.equal(isFeaturedRecommendationCandidate(product("Eton", "Dress Shirt"), strategy), false);
});

test("varies the first recommendation by product while keeping each order stable", () => {
  const products = ["one", "two", "three", "four"];
  const firstOrder = rotateRecommendationsForSource(products, "product-a");
  const repeatedOrder = rotateRecommendationsForSource(products, "product-a");
  const secondOrder = rotateRecommendationsForSource(products, "product-b");

  assert.deepEqual(firstOrder, repeatedOrder);
  assert.notDeepEqual(firstOrder, secondOrder);
  assert.deepEqual([...firstOrder].sort(), [...products].sort());
  assert.deepEqual(products, ["one", "two", "three", "four"]);
});
