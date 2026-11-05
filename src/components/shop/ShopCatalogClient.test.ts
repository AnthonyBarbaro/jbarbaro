import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { ShopCatalogClient } from "@/components/shop/ShopCatalogClient";
import type { ShopifyProduct } from "@/lib/shopify/types";

function product(handle: string, createdAt: string): ShopifyProduct {
  const price = { amount: "100.00", currencyCode: "USD" };
  return {
    id: handle,
    handle,
    title: handle,
    createdAt,
    description: "",
    descriptionHtml: "",
    vendor: "Test Clothier",
    productType: "Shirt",
    tags: [],
    reviewSummary: null,
    featuredImage: null,
    images: [],
    collections: [],
    priceRange: { minVariantPrice: price, maxVariantPrice: price },
    variants: [
      {
        id: `${handle}-m`,
        title: "M",
        availableForSale: true,
        price,
        compareAtPrice: null,
        selectedOptions: [{ name: "Size", value: "M" }],
      },
    ],
  };
}

const bestSeller = product("bestselling-shirt", "2025-01-01T00:00:00Z");
const newest = product("newest-shirt", "2026-10-30T00:00:00Z");
const recent = product("recent-shirt", "2026-10-20T00:00:00Z");

function renderCatalog(query: string): string {
  return renderToStaticMarkup(
    createElement(
      SearchParamsContext.Provider,
      { value: new URLSearchParams(query) },
      createElement(ShopCatalogClient, {
        products: [recent, newest, bestSeller],
        bestSellers: [bestSeller],
        newArrivals: [recent, newest],
        showTopPicks: false,
      }),
    ),
  );
}

test("Best Sellers links open only the bestselling selection without a separate rail", () => {
  const markup = renderCatalog("top=best");
  assert.match(markup, /<h1[^>]*>Best Sellers<\/h1>/);
  assert.match(markup, /href="\/shop\/bestselling-shirt"/);
  assert.doesNotMatch(markup, /href="\/shop\/(?:newest|recent)-shirt"/);
  assert.doesNotMatch(markup, /id="top-picks"/);
});

test("New Arrivals links open only new products in newest-first order", () => {
  const markup = renderCatalog("top=new");
  assert.match(markup, /<h1[^>]*>New Arrivals<\/h1>/);
  assert.doesNotMatch(markup, /href="\/shop\/bestselling-shirt"/);
  assert.ok(
    markup.indexOf('href="/shop/newest-shirt"') < markup.indexOf('href="/shop/recent-shirt"'),
  );
});

test("the ordinary catalog retains its bestselling products at the front", () => {
  const markup = renderCatalog("");
  assert.match(markup, /href="\/shop\/bestselling-shirt"/);
  assert.match(markup, /href="\/shop\/newest-shirt"/);
  assert.match(markup, /href="\/shop\/recent-shirt"/);
  assert.ok(
    markup.indexOf('href="/shop/bestselling-shirt"') < markup.indexOf('href="/shop/newest-shirt"'),
  );
});

test("search filters stay within the selected collection", () => {
  const markup = renderCatalog("top=best&q=newest");
  assert.match(markup, /No products match your filters/);
  assert.doesNotMatch(markup, /href="\/shop\/newest-shirt"/);
});
