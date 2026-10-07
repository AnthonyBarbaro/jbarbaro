import assert from "node:assert/strict";
import test from "node:test";

import type { FitProduct } from "@/lib/fit-profile";
import {
  applyProductFitRecommendation,
  changeProductOptionSelection,
  findProductSelectedVariant,
  getInitialProductOptions,
  getProductOptionGroups,
} from "@/lib/shopify/product-option-selection";
import type { ShopifyProductVariant } from "@/lib/shopify/types";

function variant(
  id: string,
  options: Record<string, string>,
  availableForSale = true,
): ShopifyProductVariant {
  return {
    id,
    title: Object.values(options).join(" / ") || "Default Title",
    availableForSale,
    selectedOptions: Object.entries(options).map(([name, value]) => ({ name, value })),
    price: { amount: "100.00", currencyCode: "USD" },
    compareAtPrice: null,
  };
}

function product(variants: ShopifyProductVariant[], productType = "Shirt"): FitProduct {
  return { title: "Test item", vendor: "Test", productType, tags: [], collections: [], variants };
}

const shirts = product([
  variant("m-navy", { Size: "M", Color: "Navy" }),
  variant("m-black", { Size: "M", Color: "Black" }),
  variant("l-black", { Size: "L", Color: "Black" }),
  variant("s-navy", { Size: "S", Color: "Navy" }, false),
]);

test("multiple sizes and colors start unselected and cannot resolve to a buyable variant", () => {
  const selections = getInitialProductOptions(shirts);

  assert.deepEqual(selections, {});
  assert.equal(findProductSelectedVariant(shirts, selections), null);
  assert.equal(findProductSelectedVariant(shirts, { Color: "Black" }), null);
});

test("even a single offered size needs a deliberate selection", () => {
  const single = product([variant("one-size", { Size: "One Size", Color: "Black" })]);
  const initial = getInitialProductOptions(single);

  assert.deepEqual(initial, { Color: "Black" });
  assert.equal(findProductSelectedVariant(single, initial), null);
  const chosen = changeProductOptionSelection(single, initial, "Size", "One Size");
  assert.equal(findProductSelectedVariant(single, chosen.selectedOptions)?.id, "one-size");
});

test("products without a size choice remain purchasable", () => {
  const optionSets: Record<string, string>[] = [{ Title: "Default Title" }, {}];

  for (const options of optionSets) {
    const single = product([variant("default", options)]);
    assert.deepEqual(getProductOptionGroups(single), []);
    assert.equal(
      findProductSelectedVariant(single, getInitialProductOptions(single))?.id,
      "default",
    );
  }

  const colorOnly = product([variant("black", { Color: "Black" })]);
  assert.deepEqual(getInitialProductOptions(colorOnly), { Color: "Black" });
  assert.equal(
    findProductSelectedVariant(colorOnly, getInitialProductOptions(colorOnly))?.id,
    "black",
  );
});

test("choosing another option never automatically supplies an unselected size", () => {
  const selected = changeProductOptionSelection(shirts, {}, "Color", "Black");

  assert.deepEqual(selected, { selectedOptions: { Color: "Black" }, clearedOptionNames: [] });
  assert.equal(findProductSelectedVariant(shirts, selected.selectedOptions), null);
});

test("compatible size and color choices are preserved", () => {
  assert.deepEqual(
    changeProductOptionSelection(shirts, { Size: "M", Color: "Black" }, "Size", "L"),
    {
      selectedOptions: { Size: "L", Color: "Black" },
      clearedOptionNames: [],
    },
  );
  assert.deepEqual(
    changeProductOptionSelection(shirts, { Size: "M", Color: "Navy" }, "Color", "Black"),
    {
      selectedOptions: { Size: "M", Color: "Black" },
      clearedOptionNames: [],
    },
  );
});

test("an incompatible size change clears the previous color without replacing it", () => {
  const current = { Size: "M", Color: "Navy" };
  const next = changeProductOptionSelection(shirts, current, "Size", "L");

  assert.deepEqual(next, { selectedOptions: { Size: "L" }, clearedOptionNames: ["Color"] });
  assert.deepEqual(current, { Size: "M", Color: "Navy" });
  assert.equal(findProductSelectedVariant(shirts, next.selectedOptions), null);
});

test("an incompatible color change clears the previous size instead of silently choosing another", () => {
  const next = changeProductOptionSelection(shirts, { Size: "L", Color: "Black" }, "Color", "Navy");

  assert.deepEqual(next, { selectedOptions: { Color: "Navy" }, clearedOptionNames: ["Size"] });
  assert.equal(findProductSelectedVariant(shirts, next.selectedOptions), null);
});

test("a compatible selected size takes priority over color when a third option changes", () => {
  const candidates = [
    variant("color-match", { Size: "L", Color: "Navy", Length: "L" }),
    variant("size-match", { Size: "M", Color: "Black", Length: "L" }),
  ];

  for (const ordered of [candidates, [...candidates].reverse()]) {
    const threeOptions = product([
      ...ordered,
      variant("initial", { Size: "M", Color: "Navy", Length: "R" }),
    ]);
    const next = changeProductOptionSelection(
      threeOptions,
      { Size: "M", Color: "Navy", Length: "R" },
      "Length",
      "L",
    );

    assert.deepEqual(next, {
      selectedOptions: { Size: "M", Length: "L" },
      clearedOptionNames: ["Color"],
    });
    assert.equal(findProductSelectedVariant(threeOptions, next.selectedOptions), null);
  }
});

test("an explicitly requested size change wins while compatible other selections remain", () => {
  const threeOptions = product([
    variant("current", { Size: "M", Color: "Navy", Length: "R" }),
    variant("requested", { Size: "L", Color: "Navy", Length: "R" }),
  ]);

  assert.deepEqual(
    changeProductOptionSelection(
      threeOptions,
      { Size: "M", Color: "Navy", Length: "R" },
      "Size",
      "L",
    ),
    { selectedOptions: { Size: "L", Color: "Navy", Length: "R" }, clearedOptionNames: [] },
  );
});

test("multiple size axes preserve the largest compatible subset without filling cleared choices", () => {
  const dimensions = product(
    [
      variant("fewer-sizes", { NeckSize: "18", SleeveSize: "34", Color: "Navy", Fabric: "Linen" }),
      variant("all-sizes", { NeckSize: "17", SleeveSize: "34", Color: "Black", Fabric: "Linen" }),
      variant("initial", { NeckSize: "17", SleeveSize: "34", Color: "Navy", Fabric: "Cotton" }),
    ],
    "Dress Shirt",
  );

  assert.deepEqual(
    changeProductOptionSelection(
      dimensions,
      { NeckSize: "17", SleeveSize: "34", Color: "Navy", Fabric: "Cotton" },
      "Fabric",
      "Linen",
    ),
    {
      selectedOptions: { NeckSize: "17", SleeveSize: "34", Fabric: "Linen" },
      clearedOptionNames: ["Color"],
    },
  );

  const partial = product(
    [
      variant("preserve-neck", { NeckSize: "17", SleeveSize: "36", Color: "Black" }),
      variant("preserve-neither", { NeckSize: "18", SleeveSize: "36", Color: "Black" }),
      variant("initial", { NeckSize: "17", SleeveSize: "34", Color: "Navy" }),
    ],
    "Dress Shirt",
  );
  const next = changeProductOptionSelection(
    partial,
    { NeckSize: "17", SleeveSize: "34", Color: "Navy" },
    "Color",
    "Black",
  );

  assert.deepEqual(next, {
    selectedOptions: { NeckSize: "17", Color: "Black" },
    clearedOptionNames: ["SleeveSize"],
  });
  assert.equal(findProductSelectedVariant(partial, next.selectedOptions), null);
});

test("sold-out or unknown choices cannot replace a valid selection", () => {
  const current = { Size: "M", Color: "Navy" };

  for (const [name, value] of [
    ["Size", "S"],
    ["Size", "Missing"],
    ["Unknown", "M"],
  ]) {
    assert.deepEqual(changeProductOptionSelection(shirts, current, name, value), {
      selectedOptions: current,
      clearedOptionNames: [],
    });
  }
});

test("an all-sold-out product never resolves to an available variant", () => {
  const soldOut = product([variant("sold", { Size: "M", Color: "Navy" }, false)]);
  const initial = getInitialProductOptions(soldOut);

  assert.deepEqual(initial, {});
  assert.equal(findProductSelectedVariant(soldOut, initial), null);
  assert.equal(
    findProductSelectedVariant(soldOut, { Size: "M", Color: "Navy" })?.availableForSale,
    false,
  );
});

test("a selected variant that sells out stays sold out when another size remains available", () => {
  const refreshed = product([
    variant("selected-m", { Size: "M", Color: "Navy" }, false),
    variant("available-l", { Size: "L", Color: "Navy" }),
  ]);
  const selected = findProductSelectedVariant(refreshed, { Size: "M", Color: "Navy" });

  assert.equal(selected?.id, "selected-m");
  assert.equal(selected?.availableForSale, false);
  assert.equal(findProductSelectedVariant(refreshed, { Color: "Navy" }), null);
});

test("a saved recommendation does not affect initial selection and explicit use preserves compatible color", () => {
  const recommendation = { variantId: "m-navy" };
  const current = { Color: "Black" };

  assert.deepEqual(getInitialProductOptions(shirts), {});
  const chosen = applyProductFitRecommendation(shirts, current, recommendation);
  assert.deepEqual(chosen, {
    selectedOptions: { Color: "Black", Size: "M" },
    clearedOptionNames: [],
  });
  assert.equal(findProductSelectedVariant(shirts, chosen?.selectedOptions ?? {})?.id, "m-black");
});

test("explicit Smart Fit use clears incompatible color and requires it to be chosen again", () => {
  const chosen = applyProductFitRecommendation(shirts, { Color: "Navy" }, { variantId: "l-black" });

  assert.deepEqual(chosen, { selectedOptions: { Size: "L" }, clearedOptionNames: ["Color"] });
  assert.equal(findProductSelectedVariant(shirts, chosen?.selectedOptions ?? {}), null);
});

test("Smart Fit sets a jacket size and length together while retaining compatible color", () => {
  const suits = product(
    [
      variant("navy-long", { Size: "42", Length: "L", Color: "Navy" }),
      variant("black-long", { Size: "42", Length: "L", Color: "Black" }),
      variant("black-regular", { Size: "42", Length: "R", Color: "Black" }),
    ],
    "Suit",
  );
  const chosen = applyProductFitRecommendation(
    suits,
    { Color: "Black" },
    { variantId: "navy-long" },
  );

  assert.deepEqual(chosen, {
    selectedOptions: { Color: "Black", Size: "42", Length: "L" },
    clearedOptionNames: [],
  });
  assert.equal(findProductSelectedVariant(suits, chosen?.selectedOptions ?? {})?.id, "black-long");
});

test("Smart Fit does not fill an unselected imported sleeve choice", () => {
  const dressShirt = product(
    [
      variant("short-sleeve", { Size: "17", Color: "2/3" }),
      variant("long-sleeve", { Size: "17", Color: "6/7" }),
    ],
    "Dress Shirt",
  );
  const chosen = applyProductFitRecommendation(dressShirt, {}, { variantId: "long-sleeve" });

  assert.deepEqual(chosen, { selectedOptions: { Size: "17" }, clearedOptionNames: [] });
  assert.equal(findProductSelectedVariant(dressShirt, chosen?.selectedOptions ?? {}), null);
});

test("missing and unavailable fit recommendations cannot change selections", () => {
  for (const variantId of [null, "missing", "s-navy"]) {
    assert.equal(applyProductFitRecommendation(shirts, { Color: "Black" }, { variantId }), null);
  }
});
