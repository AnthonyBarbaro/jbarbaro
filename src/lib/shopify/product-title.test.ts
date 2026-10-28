import assert from "node:assert/strict";
import test from "node:test";

import { getProductDisplayTitle } from "@/lib/shopify/product-title";

test("removes manufacturer style identifiers from imported product names", () => {
  const cases = [
    ["Canali Sport Coat CF00142/399", "Canali Sport Coat"],
    ["Canali Tuxedos BF00263/311 Navy", "Canali Tuxedo Navy"],
    ["Ballin Casual Pants Bertini M2149E059/010 Char", "Ballin Casual Pants Bertini Char"],
    ["Milestone Leather Jacket 20305-1/99 Black", "Milestone Leather Jacket Black"],
    ["Joe'S Denim 45TNDLDL8220-Ldl", "Joe's Denim"],
    ["Luigi Bianchi Suit L.B.M 03699/1", "Luigi Bianchi Suit L.B.M"],
    ["Alberto Casual Pants 1942-895 Navy", "Alberto Casual Pants Navy"],
    ["Paul Betenly Suit 1LH5123", "Paul Betenly Suit"],
    ["Renoir 831-1 Ivory Vest", "Renoir Ivory Vest"],
    [
      "Sand Triluxe Apparel Group Sport Coat Jerry Key 90201/3048 61 Brw",
      "Sand Triluxe Apparel Group Sport Coat Jerry Key Brw",
    ],
  ];
  for (const [title, expected] of cases) {
    assert.equal(getProductDisplayTitle({ title }), expected);
  }
});

test("replaces a code-only imported name with its explicit garment type", () => {
  assert.equal(
    getProductDisplayTitle({
      title: "Eton 1000 15938 23",
      brand: "Eton",
      productType: "Dress Shirt",
    }),
    "Eton Dress Shirt",
  );
  assert.equal(
    getProductDisplayTitle({
      title: "Corneliani 6339 30 Brown",
      brand: "Corneliani",
      productType: "Sport Coat",
    }),
    "Corneliani Brown Sport Coat",
  );
});

test("retains retail model numbers, fractions, percentages, and garment counts", () => {
  for (const title of [
    "Levi's 501 Original Fit Jeans",
    "New Balance 990v6 Shoes",
    "New Balance 1906R Shoes",
    "7 Downie ST Verona Polo — Navy",
    "Canali 100% Wool Suit",
    "Mattarazi 2PC Suit — Grey Check",
    "Brax 5-Pocket Pants",
    "Eton 3D Print Shirt",
    "Heritage 2026 Collection Shirt",
    "Heritage 2024-2026 Collection Shirt",
  ]) {
    assert.equal(getProductDisplayTitle({ title }), title);
  }
  assert.equal(
    getProductDisplayTitle({ title: "F/X Fusion Knit Shirt 1/4 Zip - Slate" }),
    "F/X Fusion Knit Shirt 1/4-Zip — Slate",
  );
});

test("adds an explicitly selected retail brand exactly once", () => {
  assert.equal(
    getProductDisplayTitle({ title: "Deke Twill Shorts - Black", brand: "Brax" }),
    "Brax Deke Twill Shorts — Black",
  );
  assert.equal(
    getProductDisplayTitle({ title: "CANALI Sport Coat CF00142/399", brand: "Canali" }),
    "Canali Sport Coat",
  );
  assert.equal(
    getProductDisplayTitle({ title: "Canalina Shirt", brand: "Canali" }),
    "Canali Canalina Shirt",
  );
});

test("supplier names are changed only when the caller supplies a resolved brand", () => {
  assert.equal(
    getProductDisplayTitle({
      title: "Mantoni Dress Shirt - Navy",
      vendor: "Gruppo Bravo Menswear",
    }),
    "Mantoni Dress Shirt — Navy",
  );
  assert.equal(
    getProductDisplayTitle({
      title: "Gruppo Bravo Menswear Mantoni Dress Shirt - Navy",
      vendor: "Gruppo Bravo Menswear",
      brand: "Mantoni",
    }),
    "Mantoni Dress Shirt — Navy",
  );
  assert.equal(
    getProductDisplayTitle({ title: "Eterna Dress Shirt - White", vendor: "Scott Barber" }),
    "Eterna Dress Shirt — White",
  );
});

test("preserves factual detail and the original title when the garment category conflicts", () => {
  const product = {
    title: "Alessandro Vitello Suede Jacket Black",
    vendor: "Renoir Fashion",
    productType: "Suit",
  };
  assert.equal(getProductDisplayTitle(product), product.title);
  assert.equal(product.title, "Alessandro Vitello Suede Jacket Black");
  assert.equal(
    getProductDisplayTitle({
      title: "Magnanni Diezma II Medium Brown Suede",
      productType: "Shoes",
    }),
    "Magnanni Diezma II Medium Brown Suede",
  );
});

test("handles blank and code-only titles without leaving punctuation or an empty heading", () => {
  assert.equal(
    getProductDisplayTitle({
      title: " - [CF00142/399] - ",
      brand: "Canali",
      productType: "Sport Coat",
    }),
    "Canali Sport Coat",
  );
  assert.equal(
    getProductDisplayTitle({ title: "  ", brand: "Canali", productType: "Sport Coat" }),
    "Canali Sport Coat",
  );
  assert.equal(getProductDisplayTitle({ title: "  " }), "Product");
});

test("applying the formatting a second time does not change the display title", () => {
  const input = {
    title: "Canali Tuxedos BF00263/311 Navy",
    brand: "Canali",
    productType: "Tuxedos",
  };
  const title = getProductDisplayTitle(input);
  assert.equal(getProductDisplayTitle({ ...input, title }), title);
});
