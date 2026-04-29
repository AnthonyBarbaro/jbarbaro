import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";

export const FIT_PROFILE_STORAGE_KEY = "jbarbaro_fit_profile_v1";

export type FitBuild = "slim" | "average" | "athletic" | "broad" | "full";

export type FitProfileInput = {
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  build: FitBuild;
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

  if (
    heightFeet === null ||
    heightInches === null ||
    weightLbs === null ||
    !Number.isInteger(heightFeet) ||
    !Number.isInteger(heightInches) ||
    heightFeet < 4 ||
    heightFeet > 7 ||
    heightInches < 0 ||
    heightInches > 11 ||
    weightLbs < 95 ||
    weightLbs > 340 ||
    !isFitBuild(profile.build)
  ) {
    return null;
  }

  return {
    heightFeet,
    heightInches,
    weightLbs,
    build: profile.build,
    knownSuitSize: cleanStoredSize(profile.knownSuitSize),
    knownTopSize: cleanStoredSize(profile.knownTopSize),
    knownDressShirtSize: cleanStoredSize(profile.knownDressShirtSize),
    knownWaistSize: cleanStoredSize(profile.knownWaistSize),
    shoeSize: cleanStoredSize(profile.shoeSize),
  };
}

export function getHeightInches(input: Pick<FitProfileInput, "heightFeet" | "heightInches">) {
  return input.heightFeet * 12 + input.heightInches;
}

export function normalizeSizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, "");
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

  sizes.add(estimate.suit);
  sizes.add(String(estimate.jacketChest));
  for (const label of lengthLabels) {
    sizes.add(`${estimate.jacketChest}${label}`);
    sizes.add(`${estimate.jacketChest} ${label}`);
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
  const heightInches = getHeightInches(input);
  const normalizedWeight = clamp(input.weightLbs, 95, 340);
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
  const chest = clamp(roundToEven(heightInches * 0.28 + normalizedWeight * 0.095 + buildChestAdjustments[input.build]), 34, 58);
  const jacketLength = getJacketLength(heightInches);
  const neck = clamp(roundToHalf(14 + (chest - 34) * 0.25 + buildNeckAdjustments[input.build]), 14, 22);
  const sleeve = heightInches >= 75 ? "35/36" : heightInches >= 72 ? "34/35" : heightInches >= 69 ? "33/34" : "32/33";
  const waistPrimary = clamp(Math.round(normalizedWeight * 0.15 + heightInches * 0.035 + buildWaistAdjustments[input.build]), 28, 54);
  const waist = `${waistPrimary}/${Math.min(56, waistPrimary + 1)}`;
  const knownSuitSize = cleanKnownSize(input.knownSuitSize);
  const knownTopSize = cleanKnownSize(input.knownTopSize);
  const knownDressShirtSize = cleanKnownSize(input.knownDressShirtSize);
  const knownWaistSize = cleanKnownSize(input.knownWaistSize);
  const shoeSize = cleanKnownSize(input.shoeSize);
  const estimate: FitEstimate = {
    suit: knownSuitSize || `${chest}${jacketLength}`,
    jacketChest: chest,
    jacketLength,
    alpha: knownTopSize || getAlphaSize(chest),
    dressShirt: knownDressShirtSize || `${neck % 1 === 0 ? neck.toFixed(0) : neck.toFixed(1)} x ${sleeve}`,
    waist: knownWaistSize || waist,
    shoe: shoeSize,
    notes: [
      "This is a starting point, not a final tailoring measurement.",
      `Build selected: ${buildLabels[input.build]}.`,
      ...(knownSuitSize || knownTopSize || knownDressShirtSize || knownWaistSize ? ["Known sizes override estimated sizes when provided."] : []),
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
  return variant.selectedOptions.find((option) => option.name.toLowerCase().includes("size"))?.value ?? null;
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
