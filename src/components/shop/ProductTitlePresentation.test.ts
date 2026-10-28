import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { getStorefrontProductTitle } from "@/lib/shopify/product-title-presentation";
import type { ShopifyProduct } from "@/lib/shopify/types";

const price = { amount: "100.00", currencyCode: "USD" };
const product: ShopifyProduct = {
  id: "test-coat",
  handle: "canali-coat-original-handle",
  title: getStorefrontProductTitle({
    title: "Canali Sport Coat CF00142/399",
    vendor: "Canali",
    productType: "Sport Coat",
  }),
  createdAt: "2026-01-01T00:00:00Z",
  description: "",
  descriptionHtml: "",
  vendor: "Canali",
  productType: "Sport Coat",
  tags: [],
  reviewSummary: null,
  featuredImage: null,
  images: [],
  collections: [],
  priceRange: { minVariantPrice: price, maxVariantPrice: price },
  variants: [
    {
      id: "coat-38-s",
      title: "38 / S",
      availableForSale: true,
      price,
      compareAtPrice: null,
      selectedOptions: [
        { name: "Size", value: "38" },
        { name: "Length", value: "S" },
      ],
    },
  ],
};

test("product cards put the category above a single branded title without style codes", () => {
  const markup = renderToStaticMarkup(createElement(ShopProductCard, { product }));
  const heading = markup.match(/<h2\b[^>]*>(.*?)<\/h2>/)?.[1];
  assert.equal(heading, "Canali Windowpane Sport Coat — Navy");
  assert.match(markup, /<p[^>]*>Sport Coat<\/p>/);
  assert.doesNotMatch(markup, /Canali · Sport Coat|CF00142\/399/);
  assert.match(markup, /href="\/shop\/canali-coat-original-handle"/);
});

test("product details keep brand navigation within the heading without repeating the brand above it", () => {
  const markup = renderToStaticMarkup(createElement(ProductDetailClient, { product }));
  const heading = markup.match(/<h1\b[^>]*>(.*?)<\/h1>/)?.[1];
  assert.ok(heading);
  assert.match(heading, /href="\/shop\/brands\/canali"/);
  assert.equal(heading.replace(/<[^>]+>/g, ""), "Canali Windowpane Sport Coat — Navy");
  assert.doesNotMatch(markup, /CF00142\/399/);
});
