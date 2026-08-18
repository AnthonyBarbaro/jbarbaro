import type { ShopifyProductVariant } from "@/lib/shopify/types";

type ProductOption = ShopifyProductVariant["selectedOptions"][number];

type ProductOptionPresentationSource = {
  productTitle?: string | null;
  productType?: string | null;
  selectedOptions?: readonly ProductOption[];
  title?: string | null;
  variants?: readonly Pick<ShopifyProductVariant, "selectedOptions">[];
};

const legacySleeveLengths: Readonly<Record<string, string>> = {
  "23": "32/33",
  "2/3": "32/33",
  "45": "34/35",
  "4/5": "34/35",
  "67": "36/37",
  "6/7": "36/37",
  "89": "38/39",
  "8/9": "38/39",
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isDressShirtSource(source: ProductOptionPresentationSource) {
  const productType = normalize(source.productType ?? "");
  const productTitle = source.title ?? source.productTitle ?? "";

  return (
    productType === "dress shirt" ||
    productType === "tux shirt" ||
    /\b(?:dress|tux(?:edo)?)\s+shirt\b/i.test(productTitle)
  );
}

function getSourceOptions(source: ProductOptionPresentationSource) {
  return [
    ...(source.selectedOptions ?? []),
    ...(source.variants ?? []).flatMap((variant) => variant.selectedOptions),
  ];
}

function usesImportedDressShirtSizing(source: ProductOptionPresentationSource) {
  if (!isDressShirtSource(source)) {
    return false;
  }

  const options = getSourceOptions(source);
  const neckValues = options
    .filter((option) => normalize(option.name) === "size")
    .map((option) => option.value.trim());
  const sleeveValues = options
    .filter((option) => /^(?:color|colour)$/.test(normalize(option.name)))
    .map((option) => option.value.trim());

  return (
    neckValues.length > 0 &&
    neckValues.every((value) => /^(?:1[4-9](?:\.5)?|20(?:\.5)?|22|24)$/.test(value)) &&
    sleeveValues.length > 0 &&
    sleeveValues.every((value) => Boolean(legacySleeveLengths[value]))
  );
}

export function getProductOptionPresentation(source: ProductOptionPresentationSource) {
  const importedDressShirtSizing = usesImportedDressShirtSizing(source);

  function getLabel(optionName: string) {
    if (!importedDressShirtSizing) {
      return optionName;
    }

    const normalizedName = normalize(optionName);

    if (normalizedName === "size") {
      return "Neck Size (in.)";
    }

    if (/^(?:color|colour)$/.test(normalizedName)) {
      return "Sleeve Length (in.)";
    }

    return optionName;
  }

  function getValue(optionName: string, optionValue: string) {
    return importedDressShirtSizing && /^(?:color|colour)$/.test(normalize(optionName))
      ? (legacySleeveLengths[optionValue.trim()] ?? optionValue)
      : optionValue;
  }

  function getSummaryPart(optionName: string, optionValue: string) {
    const displayValue = getValue(optionName, optionValue);

    if (!importedDressShirtSizing) {
      return displayValue;
    }

    const normalizedName = normalize(optionName);

    if (normalizedName === "size") {
      return `Neck ${displayValue} in.`;
    }

    if (/^(?:color|colour)$/.test(normalizedName)) {
      return `Sleeve ${displayValue} in.`;
    }

    return displayValue;
  }

  return {
    getLabel,
    getSummaryPart,
    getValue,
    importedDressShirtSizing,
  };
}
