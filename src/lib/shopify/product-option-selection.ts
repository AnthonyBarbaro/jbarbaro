import {
  isProductJacketLengthOption,
  isSuitSizingProduct,
  type FitProduct,
  type ProductFitRecommendation,
} from "@/lib/fit-profile";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";

type ProductOptionSource = Pick<ShopifyProduct, "variants">;
export type ProductOptionSelections = Record<string, string>;
export type ProductOptionGroup = { name: string; values: string[] };
export type ProductOptionSelectionChange = {
  selectedOptions: ProductOptionSelections;
  clearedOptionNames: string[];
};

function isMeaningfulOption(name: string, value: string): boolean {
  return (
    name.trim().toLowerCase() !== "title" &&
    value.trim().toLowerCase() !== "default title" &&
    value.trim().length > 0
  );
}

function optionValue(variant: ShopifyProductVariant, name: string): string | undefined {
  return variant.selectedOptions.find((option) => option.name === name)?.value;
}

export function getProductOptionGroups(product: ProductOptionSource): ProductOptionGroup[] {
  const groups = new Map<string, string[]>();

  for (const variant of product.variants) {
    for (const option of variant.selectedOptions) {
      if (!isMeaningfulOption(option.name, option.value)) {
        continue;
      }

      const values = groups.get(option.name) ?? [];

      if (!values.includes(option.value)) {
        groups.set(option.name, [...values, option.value]);
      }
    }
  }

  return Array.from(groups, ([name, values]) => ({ name, values }));
}

export function getInitialProductOptions(product: ProductOptionSource): ProductOptionSelections {
  return Object.fromEntries(
    getProductOptionGroups(product).flatMap((group) => {
      const [value] = group.values;

      return !/size/i.test(group.name) &&
        group.values.length === 1 &&
        product.variants.some(
          (variant) => variant.availableForSale && optionValue(variant, group.name) === value,
        )
        ? [[group.name, value]]
        : [];
    }),
  );
}

export function findProductSelectedVariant(
  product: ProductOptionSource,
  selections: ProductOptionSelections,
): ShopifyProductVariant | null {
  const groups = getProductOptionGroups(product);

  if (groups.some((group) => !selections[group.name])) {
    return null;
  }

  const matches = product.variants.filter((variant) =>
    groups.every((group) => optionValue(variant, group.name) === selections[group.name]),
  );

  return matches.find((variant) => variant.availableForSale) ?? matches[0] ?? null;
}

function reconcileProductOptions(
  product: ProductOptionSource,
  current: ProductOptionSelections,
  requested: ProductOptionSelections,
): ProductOptionSelectionChange | null {
  const candidates = product.variants.filter(
    (variant) =>
      variant.availableForSale &&
      Object.entries(requested).every(([name, value]) => optionValue(variant, name) === value),
  );

  if (candidates.length === 0) {
    return null;
  }

  const matchCount = (variant: ShopifyProductVariant): number =>
    Object.entries(current).filter(
      ([name, value]) => !(name in requested) && optionValue(variant, name) === value,
    ).length;
  const sizeMatchCount = (variant: ShopifyProductVariant): number =>
    Object.entries(current).filter(
      ([name, value]) =>
        /size/i.test(name) && !(name in requested) && optionValue(variant, name) === value,
    ).length;
  const bestMatch = candidates.reduce((best, candidate) => {
    const candidateSizes = sizeMatchCount(candidate);
    const bestSizes = sizeMatchCount(best);

    return candidateSizes > bestSizes ||
      (candidateSizes === bestSizes && matchCount(candidate) > matchCount(best))
      ? candidate
      : best;
  });
  const selectedOptions = { ...current, ...requested };
  const clearedOptionNames: string[] = [];

  for (const group of getProductOptionGroups(product)) {
    if (
      selectedOptions[group.name] &&
      optionValue(bestMatch, group.name) !== selectedOptions[group.name]
    ) {
      delete selectedOptions[group.name];
      clearedOptionNames.push(group.name);
    }
  }

  return { selectedOptions, clearedOptionNames };
}

export function changeProductOptionSelection(
  product: ProductOptionSource,
  current: ProductOptionSelections,
  name: string,
  value: string,
): ProductOptionSelectionChange {
  const group = getProductOptionGroups(product).find((candidate) => candidate.name === name);

  if (!group?.values.includes(value)) {
    return { selectedOptions: current, clearedOptionNames: [] };
  }

  return (
    reconcileProductOptions(product, current, { [name]: value }) ?? {
      selectedOptions: current,
      clearedOptionNames: [],
    }
  );
}

export function applyProductFitRecommendation(
  product: FitProduct,
  current: ProductOptionSelections,
  recommendation: Pick<ProductFitRecommendation, "variantId">,
): ProductOptionSelectionChange | null {
  const recommendedVariant = product.variants.find(
    (variant) => variant.availableForSale && variant.id === recommendation.variantId,
  );

  if (!recommendedVariant) {
    return null;
  }

  const fitOptions = Object.fromEntries(
    recommendedVariant.selectedOptions
      .filter(
        (option) =>
          isMeaningfulOption(option.name, option.value) &&
          (/size/i.test(option.name) ||
            (isSuitSizingProduct(product) && isProductJacketLengthOption(product, option.name))),
      )
      .map((option) => [option.name, option.value]),
  );

  return Object.keys(fitOptions).length > 0
    ? reconcileProductOptions(product, current, fitOptions)
    : null;
}
