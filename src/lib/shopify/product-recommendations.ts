import { getProductSizeKind, type FitProduct } from "@/lib/fit-profile";

export type FeaturedRecommendationStrategy = {
  vendor: "Canali" | "Eton";
  title: string;
  description: string;
  productKind: "shirt" | null;
};

const etonShirtStrategy: FeaturedRecommendationStrategy = {
  vendor: "Eton",
  title: "Eton Shirts",
  description: "Available Eton shirts to explore next.",
  productKind: "shirt",
};

const canaliStrategy: FeaturedRecommendationStrategy = {
  vendor: "Canali",
  title: "Canali",
  description: "Available Canali styles to explore next.",
  productKind: null,
};

function normalizeVendor(vendor: string) {
  return vendor.trim().toLocaleLowerCase();
}

export function getFeaturedRecommendationStrategy(sourceVendor: string) {
  return normalizeVendor(sourceVendor) === "eton" ? canaliStrategy : etonShirtStrategy;
}

export function isFeaturedRecommendationCandidate(
  product: FitProduct,
  strategy: FeaturedRecommendationStrategy,
) {
  return (
    normalizeVendor(product.vendor) === normalizeVendor(strategy.vendor) &&
    (!strategy.productKind || getProductSizeKind(product) === strategy.productKind)
  );
}

export function rotateRecommendationsForSource<T>(products: readonly T[], sourceKey: string) {
  if (products.length < 2) {
    return [...products];
  }

  const offset =
    Array.from(sourceKey).reduce(
      (total, character, index) => total + character.codePointAt(0)! * (index + 1),
      0,
    ) % products.length;

  return [...products.slice(offset), ...products.slice(0, offset)];
}
