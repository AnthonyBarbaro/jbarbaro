import assert from "node:assert/strict";
import test from "node:test";

import {
  getProductDisplayBrand,
  getProductDisplayCategory,
  getStorefrontProductTitle,
} from "@/lib/shopify/product-title-presentation";

test("customer titles include the brand and omit internal identifiers", () => {
  assert.equal(
    getStorefrontProductTitle({
      title: "Canali Sport Coat CF00142/399",
      vendor: "Canali",
      productType: "Sport Coat",
    }),
    "Canali Windowpane Sport Coat — Navy",
  );
  assert.equal(
    getStorefrontProductTitle({
      title: "Eton 1000 15938 23",
      vendor: "Eton",
      productType: "Dress Shirt",
    }),
    "Eton Dress Shirt",
  );
  assert.equal(
    getStorefrontProductTitle({
      title: "Deke Twill Shorts - Black",
      vendor: "Brax",
      productType: "SH",
    }),
    "Brax Deke Twill Shorts — Black",
  );
});

test("retail-brand rules are scoped to both the supplier and the individual product", () => {
  const cases = [
    ["Mantoni Dress Shirt - Navy", "Gruppo Bravo Menswear", "Mantoni Dress Shirt — Navy"],
    ["Eterna Dress Shirt - White", "Scott Barber", "Eterna Dress Shirt — White"],
    ["Milestone Leather Jacket 20305-1/99 Black", "Alberto", "Milestone Leather Jacket Black"],
    ["Alberto Outerwear Milestone JK 20315-1/45", "Alberto", "Milestone Jacket"],
    ["Alberto Stretch Colored Denim Camel", "Alberto", "Alberto Stretch Colored Denim Camel"],
    [
      "7 Downie ST Sport Coat - Draper Navy",
      "Eros Clothing Inc",
      "7 Downie St. Sport Coat — Draper Navy",
    ],
    [
      "Sartorial Apparel Group Barocci Dress Pants - Black",
      "Sartorial Apparel Group",
      "Barocci Dress Pants — Black",
    ],
    ["Mattarazi Unomo 2PC Suit - Olive", "Mattarazi Unomo Inc", "Mattarazi 2PC Suit — Olive"],
  ];
  for (const [title, vendor, expected] of cases)
    assert.equal(getStorefrontProductTitle({ title, vendor }), expected);
  assert.equal(
    getProductDisplayBrand({ title: "Scott Barber Dress Shirt", vendor: "Scott Barber" }),
    "Scott Barber",
  );
});

test("normalization is idempotent and preserves operations data", () => {
  const input = {
    title: "Mantoni Dress Shirt - Navy",
    vendor: "Gruppo Bravo Menswear",
    productType: "Dress Shirt",
  };
  const title = getStorefrontProductTitle(input);
  assert.equal(getStorefrontProductTitle({ ...input, title }), title);
  assert.equal(input.vendor, "Gruppo Bravo Menswear");
  assert.equal(input.title, "Mantoni Dress Shirt - Navy");
  const downie = {
    title: "7 Downie ST Sport Coat - Navy",
    vendor: "Eros Clothing Inc",
    productType: "Sport Coat",
  };
  const downieTitle = getStorefrontProductTitle(downie);
  assert.equal(getStorefrontProductTitle({ ...downie, title: downieTitle }), downieTitle);
});

test("category labels expand import abbreviations and withhold conflicting labels", () => {
  assert.equal(
    getProductDisplayCategory({ title: "Brax Deke Shorts", productType: "SH" }),
    "Shorts",
  );
  assert.equal(
    getProductDisplayCategory({ title: "Mantoni Tuxedo Shirt", productType: "TUX Shirt" }),
    "Tuxedo Shirt",
  );
  assert.equal(
    getProductDisplayCategory({ title: "Alessandro Vitello Suede Jacket", productType: "Suit" }),
    "",
  );
});

test("gift-wrap service labels remain merchant-controlled", () => {
  assert.equal(
    getStorefrontProductTitle({
      title: "Seasonal Gift Wrap",
      vendor: "Test Clothier",
      productType: "Service",
    }),
    "Seasonal Gift Wrap",
  );
  assert.equal(getStorefrontProductTitle({ title: "Gift Wrap", vendor: "jbarbaro" }), "Gift Wrap");
});
