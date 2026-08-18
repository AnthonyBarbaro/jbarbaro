import assert from "node:assert/strict";
import test from "node:test";

import { getProductOptionPresentation } from "@/lib/shopify/product-option-presentation";

function variant(selectedOptions: Array<{ name: string; value: string }>) {
  return { selectedOptions };
}

test("presents imported dress shirt sizing as neck and sleeve measurements", () => {
  const rawOptions = [
    { name: "Size", value: "18.5" },
    { name: "Color", value: "6/7" },
  ];
  const presentation = getProductOptionPresentation({
    productType: "Dress Shirt",
    title: "Marquis Dress Shirt Charcoal",
    variants: [variant(rawOptions)],
  });

  assert.equal(presentation.getLabel("Size"), "Neck Size (in.)");
  assert.equal(presentation.getLabel("Color"), "Sleeve Length (in.)");
  assert.equal(presentation.getValue("Color", "6/7"), "36/37");
  assert.equal(presentation.getSummaryPart("Size", "18.5"), "Neck 18.5 in.");
  assert.equal(presentation.getSummaryPart("Color", "6/7"), "Sleeve 36/37 in.");
  assert.deepEqual(rawOptions, [
    { name: "Size", value: "18.5" },
    { name: "Color", value: "6/7" },
  ]);
});

test("supports every slash and compact imported sleeve code", () => {
  const slashPresentation = getProductOptionPresentation({
    productType: "Dress Shirt",
    variants: [
      variant([
        { name: "Size", value: "17.5" },
        { name: "Color", value: "2/3" },
      ]),
      variant([
        { name: "Size", value: "17.5" },
        { name: "Color", value: "4/5" },
      ]),
      variant([
        { name: "Size", value: "17.5" },
        { name: "Color", value: "6/7" },
      ]),
      variant([
        { name: "Size", value: "17.5" },
        { name: "Color", value: "8/9" },
      ]),
    ],
  });
  const compactPresentation = getProductOptionPresentation({
    productType: "TUX Shirt",
    variants: [
      variant([
        { name: "Size", value: "17.5" },
        { name: "Color", value: "23" },
      ]),
      variant([
        { name: "Size", value: "18" },
        { name: "Color", value: "45" },
      ]),
      variant([
        { name: "Size", value: "18.5" },
        { name: "Color", value: "67" },
      ]),
      variant([
        { name: "Size", value: "19" },
        { name: "Color", value: "89" },
      ]),
    ],
  });

  assert.deepEqual(
    ["2/3", "4/5", "6/7", "8/9"].map((value) => slashPresentation.getValue("Color", value)),
    ["32/33", "34/35", "36/37", "38/39"],
  );
  assert.deepEqual(
    ["23", "45", "67", "89"].map((value) => compactPresentation.getValue("Color", value)),
    ["32/33", "34/35", "36/37", "38/39"],
  );
});

test("leaves ordinary color options unchanged", () => {
  const presentation = getProductOptionPresentation({
    productType: "Dress Shirt",
    variants: [
      variant([
        { name: "Size", value: "M" },
        { name: "Color", value: "Navy" },
      ]),
    ],
  });

  assert.equal(presentation.importedDressShirtSizing, false);
  assert.equal(presentation.getLabel("Size"), "Size");
  assert.equal(presentation.getLabel("Color"), "Color");
  assert.equal(presentation.getValue("Color", "Navy"), "Navy");
});

test("does not reinterpret numeric options on non-shirt products", () => {
  const presentation = getProductOptionPresentation({
    productType: "Accessory",
    variants: [
      variant([
        { name: "Size", value: "18.5" },
        { name: "Color", value: "6/7" },
      ]),
    ],
  });

  assert.equal(presentation.importedDressShirtSizing, false);
  assert.equal(presentation.getLabel("Color"), "Color");
  assert.equal(presentation.getValue("Color", "6/7"), "6/7");
});
