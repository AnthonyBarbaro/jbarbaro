import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";

export const FIT_PROFILE_STORAGE_KEY = "jbarbaro_fit_profile_v1";

export type FitBuild = "slim" | "average" | "athletic" | "broad" | "full";

export type FitProfileInput = {
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  build?: FitBuild;
  knownSuitSize?: string;
  knownTopSize?: string;
  knownDressShirtSize?: string;
  knownWaistSize?: string;
  shoeSize?: string;
};

export type FitEstimate = {
  suit: string;
  jacketChest: number;
  jacketLength: "S" | "R" | "L" | "XL";
  alpha: string;
  dressShirt: string;
  waist: string;
  shoe?: string;
  notes: string[];
};

export type FitProfile = FitProfileInput & {
  updatedAt: string;
  estimate: FitEstimate;
  recommendedSizes: string[];
};

export type ProductSizeKind = "waist" | "suit" | "shirt" | "shoe" | "top";

const buildLabels: Record<FitBuild, string> = {
  slim: "Slim",
  average: "Average",
  athletic: "Athletic",
  broad: "Broad",
  full: "Full",
};

const jacketLengthLabels: Record<FitEstimate["jacketLength"], string[]> = {
  S: ["S", "Short"],
  R: ["R", "Regular"],
  L: ["L", "Long"],
  XL: ["XL", "Extra Long"],
};
const fitBuildValues: FitBuild[] = ["slim", "average", "athletic", "broad", "full"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToEven(value: number) {
  return Math.round(value / 2) * 2;
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function cleanKnownSize(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed || /nan|undefined|null/i.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function cleanStoredSize(value: unknown) {
  return typeof value === "string" ? cleanKnownSize(value) : undefined;
}

function isFitBuild(value: unknown): value is FitBuild {
  return typeof value === "string" && fitBuildValues.includes(value as FitBuild);
}

function toFiniteNumber(value: unknown) {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeStoredFitInput(value: unknown): FitProfileInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const profile = value as Record<string, unknown>;
  const heightFeet = toFiniteNumber(profile.heightFeet);
  const heightInches = toFiniteNumber(profile.heightInches);
  const weightLbs = toFiniteNumber(profile.weightLbs);
  const knownSuitSize = cleanStoredSize(profile.knownSuitSize);
  const knownTopSize = cleanStoredSize(profile.knownTopSize);
  const knownDressShirtSize = cleanStoredSize(profile.knownDressShirtSize);
  const knownWaistSize = cleanStoredSize(profile.knownWaistSize);
  const shoeSize = cleanStoredSize(profile.shoeSize);
  const storedBuild = isFitBuild(profile.build) ? profile.build : undefined;
  const hasKnownSize = Boolean(
    knownSuitSize ||
      knownTopSize ||
      knownDressShirtSize ||
      knownWaistSize ||
      shoeSize,
  );
  const hasCompleteMeasurements =
    heightFeet !== null &&
    heightInches !== null &&
    weightLbs !== null &&
    Number.isInteger(heightFeet) &&
    Number.isInteger(heightInches) &&
    heightFeet >= 4 &&
    heightFeet <= 7 &&
    heightInches >= 0 &&
    heightInches <= 11 &&
    weightLbs >= 95 &&
    weightLbs <= 340 &&
    Boolean(storedBuild);

  if (!hasCompleteMeasurements && !hasKnownSize) {
    return null;
  }

  return {
    ...(hasCompleteMeasurements
      ? {
          heightFeet,
          heightInches,
          weightLbs,
          build: storedBuild,
        }
      : {}),
    knownSuitSize,
    knownTopSize,
    knownDressShirtSize,
    knownWaistSize,
    shoeSize,
  };
}

export function getHeightInches(input: {
  heightFeet: number;
  heightInches: number;
}) {
  return input.heightFeet * 12 + input.heightInches;
}

export function normalizeSizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, "");
}

export function isSuitSizingProduct(product: ShopifyProduct) {
  const productText = [
    product.title,
    product.productType,
    ...product.collections.map((collection) => collection.title),
  ]
    .join(" ")
    .toLowerCase();

  return /suit|jacket|blazer|sport coat|overcoat/.test(productText);
}

export function getProductSizeKind(product: ShopifyProduct): ProductSizeKind {
  const productText = [
    product.title,
    product.productType,
    ...product.collections.map((collection) => collection.title),
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(?:pants?|trousers?|denim|jeans?|shorts)\b/.test(productText)) {
    return "waist";
  }

  if (isSuitSizingProduct(product)) {
    return "suit";
  }

  if (/dress shirt|shirt/.test(productText)) {
    return "shirt";
  }

  if (/shoe|loafer|sneaker|boot|footwear/.test(productText)) {
    return "shoe";
  }

  return "top";
}

export function normalizeJacketLength(value: string) {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalizedValue === "s" || normalizedValue === "short") return "S";
  if (normalizedValue === "r" || normalizedValue === "regular") return "R";
  if (normalizedValue === "l" || normalizedValue === "long") return "L";
  if (normalizedValue === "xl" || normalizedValue === "extralong") return "XL";

  return null;
}

export function parseSuitSize(value: string) {
  const normalizedValue = value
    .trim()
    .replace(/extra[\s_-]*long/i, "XL")
    .replace(/short/i, "S")
    .replace(/regular/i, "R")
    .replace(/long/i, "L")
    .replace(/\s+/g, "");
  const match = normalizedValue.match(/^(\d+(?:\.\d+)?)(XL|S|R|L)$/i);

  if (!match?.[1] || !match[2]) {
    return null;
  }

  return {
    chest: match[1],
    length: match[2].toUpperCase() as FitEstimate["jacketLength"],
    label: `${match[1]}${match[2].toUpperCase()}`,
  };
}

export function getVariantJacketLengthValue(variant: ShopifyProductVariant) {
  for (const option of variant.selectedOptions) {
    if (option.name.toLowerCase().includes("size")) {
      continue;
    }

    const length = normalizeJacketLength(option.value);

    if (length) {
      return length;
    }
  }

  return null;
}

export function findProductSuitVariant(
  product: ShopifyProduct,
  suitSize: string,
  availableOnly = true,
) {
  const size = parseSuitSize(suitSize);

  if (!size) {
    return null;
  }

  return (
    product.variants.find(
      (variant) =>
        (!availableOnly || variant.availableForSale) &&
        getVariantSizeValue(variant) === size.chest &&
        getVariantJacketLengthValue(variant) === size.length,
    ) ?? null
  );
}

function getJacketLength(heightInches: number): FitEstimate["jacketLength"] {
  if (heightInches <= 67) {
    return "S";
  }

  if (heightInches <= 71) {
    return "R";
  }

  if (heightInches <= 75) {
    return "L";
  }

  return "XL";
}

function getAlphaSize(chest: number) {
  if (chest <= 36) {
    return "S";
  }

  if (chest <= 39) {
    return "M";
  }

  if (chest <= 41) {
    return "M/L";
  }

  if (chest <= 44) {
    return "L";
  }

  if (chest <= 46) {
    return "L/XL";
  }

  if (chest <= 50) {
    return "XL";
  }

  return "XXL";
}

function getRecommendedSizes(estimate: FitEstimate) {
  const sizes = new Set<string>();
  const lengthLabels = jacketLengthLabels[estimate.jacketLength];

  if (estimate.suit) {
    sizes.add(estimate.suit);
  }

  if (estimate.jacketChest > 0) {
    sizes.add(String(estimate.jacketChest));
    for (const label of lengthLabels) {
      sizes.add(`${estimate.jacketChest}${label}`);
      sizes.add(`${estimate.jacketChest} ${label}`);
    }
  }

  for (const alphaSize of estimate.alpha.split("/")) {
    const trimmed = alphaSize.trim();

    if (!trimmed) {
      continue;
    }

    sizes.add(trimmed);

    if (trimmed === "S") sizes.add("Small");
    if (trimmed === "M") sizes.add("Medium");
    if (trimmed === "L") sizes.add("Large");
    if (trimmed === "XL") sizes.add("X-Large");
    if (trimmed === "XXL") sizes.add("XX-Large");
    if (trimmed.toLowerCase() === "small") sizes.add("S");
    if (trimmed.toLowerCase() === "medium") sizes.add("M");
    if (trimmed.toLowerCase() === "large") sizes.add("L");
    if (trimmed.toLowerCase() === "x-large") sizes.add("XL");
    if (trimmed.toLowerCase() === "xx-large") sizes.add("XXL");
  }

  for (const neck of estimate.dressShirt.split(" x ")[0]?.split("/") ?? []) {
    if (neck.trim()) {
      sizes.add(neck.trim());
    }
  }

  for (const waist of estimate.waist.split("/")) {
    if (waist.trim()) {
      sizes.add(waist.trim());
    }
  }

  if (estimate.shoe) {
    sizes.add(estimate.shoe);
    sizes.add(`US ${estimate.shoe}`);
  }

  return Array.from(sizes);
}

export function buildFitProfile(input: FitProfileInput): FitProfile {
  const hasCompleteMeasurements =
    typeof input.heightFeet === "number" &&
    typeof input.heightInches === "number" &&
    typeof input.weightLbs === "number" &&
    Boolean(input.build);
  const resolvedBuild = input.build ?? "average";
  const heightInches = hasCompleteMeasurements
    ? getHeightInches({
        heightFeet: input.heightFeet!,
        heightInches: input.heightInches!,
      })
    : 0;
  const normalizedWeight = hasCompleteMeasurements
    ? clamp(input.weightLbs!, 95, 340)
    : 0;
  const buildChestAdjustments: Record<FitBuild, number> = {
    slim: 0,
    average: 1,
    athletic: 1.5,
    broad: 2.5,
    full: 3.5,
  };
  const buildWaistAdjustments: Record<FitBuild, number> = {
    slim: 0.5,
    average: 1.5,
    athletic: 1,
    broad: 2,
    full: 3,
  };
  const buildNeckAdjustments: Record<FitBuild, number> = {
    slim: 0,
    average: 0.25,
    athletic: 0.25,
    broad: 0.5,
    full: 0.75,
  };
  const chest = hasCompleteMeasurements
    ? clamp(
        roundToEven(
          heightInches * 0.28 +
            normalizedWeight * 0.095 +
            buildChestAdjustments[resolvedBuild],
        ),
        34,
        58,
      )
    : 0;
  const jacketLength = hasCompleteMeasurements
    ? getJacketLength(heightInches)
    : "R";
  const neck = hasCompleteMeasurements
    ? clamp(
        roundToHalf(
          14 + (chest - 34) * 0.25 + buildNeckAdjustments[resolvedBuild],
        ),
        14,
        22,
      )
    : 0;
  const sleeve = hasCompleteMeasurements
    ? heightInches >= 75
      ? "35/36"
      : heightInches >= 72
        ? "34/35"
        : heightInches >= 69
          ? "33/34"
          : "32/33"
    : "";
  const waistPrimary = hasCompleteMeasurements
    ? clamp(
        Math.round(
          normalizedWeight * 0.15 +
            heightInches * 0.035 +
            buildWaistAdjustments[resolvedBuild],
        ),
        28,
        54,
      )
    : 0;
  const waist = hasCompleteMeasurements
    ? `${waistPrimary}/${Math.min(56, waistPrimary + 1)}`
    : "";
  const knownSuitSize = cleanKnownSize(input.knownSuitSize);
  const knownTopSize = cleanKnownSize(input.knownTopSize);
  const knownDressShirtSize = cleanKnownSize(input.knownDressShirtSize);
  const knownWaistSize = cleanKnownSize(input.knownWaistSize);
  const shoeSize = cleanKnownSize(input.shoeSize);
  const parsedKnownSuitSize = knownSuitSize ? parseSuitSize(knownSuitSize) : null;
  const numericKnownSuitSize =
    knownSuitSize && /^\d+(?:\.\d+)?$/.test(knownSuitSize)
      ? knownSuitSize
      : null;
  const resolvedJacketChest = Number.parseFloat(
    parsedKnownSuitSize?.chest ?? numericKnownSuitSize ?? String(chest),
  );
  const resolvedJacketLength = parsedKnownSuitSize?.length ?? jacketLength;
  const resolvedSuitSize = parsedKnownSuitSize
    ? parsedKnownSuitSize.label
    : numericKnownSuitSize
      ? `${numericKnownSuitSize}${resolvedJacketLength}`
      : knownSuitSize || (chest > 0 ? `${chest}${jacketLength}` : "");
  const estimate: FitEstimate = {
    suit: resolvedSuitSize,
    jacketChest: resolvedJacketChest,
    jacketLength: resolvedJacketLength,
    alpha: knownTopSize || (chest > 0 ? getAlphaSize(chest) : ""),
    dressShirt:
      knownDressShirtSize ||
      (neck > 0
        ? `${neck % 1 === 0 ? neck.toFixed(0) : neck.toFixed(1)} x ${sleeve}`
        : ""),
    waist: knownWaistSize || waist,
    shoe: shoeSize,
    notes: [
      "This is a starting point, not a final tailoring measurement.",
      ...(input.build ? [`Build selected: ${buildLabels[input.build]}.`] : []),
      ...(knownSuitSize || knownTopSize || knownDressShirtSize || knownWaistSize
        ? ["Known sizes override estimated sizes when provided."]
        : []),
    ],
  };

  return {
    ...input,
    knownSuitSize,
    knownTopSize,
    knownDressShirtSize,
    knownWaistSize,
    shoeSize,
    updatedAt: new Date().toISOString(),
    estimate,
    recommendedSizes: getRecommendedSizes(estimate),
  };
}

export function parseFitProfile(value: string | null): FitProfile | null {
  if (!value) {
    return null;
  }

  try {
    const normalizedInput = normalizeStoredFitInput(JSON.parse(value));

    return normalizedInput ? buildFitProfile(normalizedInput) : null;
  } catch {
    return null;
  }
}

export function getMatchingProfileSizes(availableSizes: string[], profile: FitProfile | null) {
  if (!profile) {
    return [];
  }

  const targetTokens = new Set(profile.recommendedSizes.map(normalizeSizeToken));

  return availableSizes.filter((size) => targetTokens.has(normalizeSizeToken(size)));
}

export function getVariantSizeValue(variant: ShopifyProductVariant) {
  return (
    variant.selectedOptions.find((option) => option.name.toLowerCase().includes("size"))?.value ??
    null
  );
}

export function getProductFitMatches(product: ShopifyProduct, fitSizes: string[]) {
  if (fitSizes.length === 0) {
    return [];
  }

  const fitTokens = new Set(fitSizes.map(normalizeSizeToken));
  const matches = product.variants
    .filter((variant) => variant.availableForSale)
    .map(getVariantSizeValue)
    .filter((value): value is string => Boolean(value))
    .filter((value) => fitTokens.has(normalizeSizeToken(value)));

  return Array.from(new Set(matches));
}

function getAlphaSizeAliases(value: string) {
  const sizes = new Set<string>();

  for (const alphaSize of value.split("/")) {
    const trimmed = alphaSize.trim();

    if (!trimmed) {
      continue;
    }

    sizes.add(trimmed);

    if (trimmed === "S") sizes.add("Small");
    if (trimmed === "M") sizes.add("Medium");
    if (trimmed === "L") sizes.add("Large");
    if (trimmed === "XL") sizes.add("X-Large");
    if (trimmed === "XXL") sizes.add("XX-Large");
    if (trimmed.toLowerCase() === "small") sizes.add("S");
    if (trimmed.toLowerCase() === "medium") sizes.add("M");
    if (trimmed.toLowerCase() === "large") sizes.add("L");
    if (trimmed.toLowerCase() === "x-large") sizes.add("XL");
    if (trimmed.toLowerCase() === "xx-large") sizes.add("XXL");
  }

  return Array.from(sizes);
}

export function getProfileSizesForProduct(product: ShopifyProduct, profile: FitProfile) {
  const kind = getProductSizeKind(product);

  if (kind === "waist") {
    return profile.estimate.waist
      .split("/")
      .map((size) => size.trim())
      .filter(Boolean);
  }

  if (kind === "suit") {
    const suitSize = parseSuitSize(profile.estimate.suit);
    return suitSize
      ? [suitSize.chest]
      : profile.estimate.jacketChest > 0
        ? [String(profile.estimate.jacketChest)]
        : [];
  }

  if (kind === "shirt") {
    return (profile.estimate.dressShirt.split(" x ")[0] ?? "")
      .split("/")
      .map((size) => size.trim())
      .filter(Boolean);
  }

  if (kind === "shoe") {
    return profile.estimate.shoe
      ? [profile.estimate.shoe, `US ${profile.estimate.shoe}`]
      : [];
  }

  return getAlphaSizeAliases(profile.estimate.alpha);
}

export function getProductFitMatchesForProfile(
  product: ShopifyProduct,
  profile: FitProfile,
) {
  if (getProductSizeKind(product) === "suit") {
    const suitSize = parseSuitSize(profile.estimate.suit);

    if (!suitSize || !findProductSuitVariant(product, suitSize.label)) {
      return [];
    }

    return [suitSize.label];
  }

  return getProductFitMatches(product, getProfileSizesForProduct(product, profile));
}

function getNumericTarget(profile: FitProfile, kind: ProductSizeKind) {
  if (kind === "waist") {
    return Number.parseFloat(profile.estimate.waist.split("/")[0] ?? "");
  }

  if (kind === "suit") {
    return profile.estimate.jacketChest;
  }

  if (kind === "shirt") {
    return Number.parseFloat(profile.estimate.dressShirt);
  }

  if (kind === "shoe") {
    return Number.parseFloat(profile.estimate.shoe ?? "");
  }

  return Number.NaN;
}

export function getProductFitRecommendation(product: ShopifyProduct, profile: FitProfile) {
  const sizeKind = getProductSizeKind(product);

  if (sizeKind === "suit") {
    const suitSize = parseSuitSize(profile.estimate.suit);

    if (!suitSize) {
      return null;
    }

    const exactVariant = findProductSuitVariant(product, suitSize.label);

    return {
      label: suitSize.label,
      variantId: exactVariant?.id ?? null,
    };
  }

  const exactMatches = getProductFitMatches(
    product,
    getProfileSizesForProduct(product, profile),
  );
  const exactSize = exactMatches[0];

  if (exactSize) {
    const exactVariant = product.variants.find(
      (variant) =>
        variant.availableForSale && getVariantSizeValue(variant) === exactSize,
    );

    if (exactVariant) {
      return {
        label: exactSize,
        variantId: exactVariant.id,
      };
    }
  }

  const target = getNumericTarget(profile, sizeKind);

  if (!Number.isFinite(target)) {
    return null;
  }

  const numericSizes = Array.from(
    new Map(
      product.variants
        .filter((variant) => variant.availableForSale)
        .map(getVariantSizeValue)
        .filter((value): value is string => Boolean(value))
        .map((value) => [value, Number.parseFloat(value)] as const)
        .filter(([, numericValue]) => Number.isFinite(numericValue)),
    ).entries(),
  ).map(([value, numericValue]) => ({ value, number: numericValue }));

  const closestSize = numericSizes.sort(
    (left, right) =>
      Math.abs(left.number - target) - Math.abs(right.number - target),
  )[0]?.value;
  const closestVariant = closestSize
    ? product.variants.find(
        (variant) =>
          variant.availableForSale && getVariantSizeValue(variant) === closestSize,
      )
    : null;

  return closestSize && closestVariant
    ? {
        label: closestSize,
        variantId: closestVariant.id,
      }
    : null;
}
