"use client";

import { useEffect, useMemo, useState } from "react";

import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WaveSection } from "@/components/ui/WaveSection";
import {
  FIT_PROFILE_STORAGE_KEY,
  getProductFitMatchesForProfile,
  getProductFitRecommendation,
  getProductSizeKind,
  getProductSuitSizeSystem,
  getVariantJacketLengthValue,
  getVariantSizeValue,
  isProductJacketLengthOption,
  normalizeJacketLength,
  normalizeSizeToken,
  parseSuitSize,
  parseFitProfile,
  type FitProfile,
} from "@/lib/fit-profile";
import {
  getLatestProductSelection,
  PRODUCT_SELECTION_EVENT,
  type ProductSelectionDetail,
} from "@/lib/shop-product-selection";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";

type ProductRecommendationsClientProps = {
  product: ShopifyProduct;
  sameBrandCandidates: ShopifyProduct[];
  outfitMatchCandidates: ShopifyProduct[];
};

type RecommendationEntry = {
  product: ShopifyProduct;
  preferredVariantId: string;
  sizeAvailabilityLabel: string | null;
};

const GROUP_SIZE = 3;

function getInitialSelection(product: ShopifyProduct): ProductSelectionDetail {
  const variant =
    product.variants.find((candidate) => candidate.availableForSale) ?? product.variants[0] ?? null;

  return {
    productId: product.id,
    variantId: variant?.id ?? null,
    selectedOptions: variant?.selectedOptions ?? [],
  };
}

function getSelectedSize(selectedOptions: ShopifyProductVariant["selectedOptions"]) {
  return (
    selectedOptions.find((option) => option.name.toLowerCase().includes("size"))?.value ?? null
  );
}

function normalizeComparableSize(value: string) {
  return normalizeSizeToken(value.replace(/^(?:European|EUR|EU|USA|US)(?=\s|\d)\s*/i, ""));
}

function getSuitSizeParts(value: string) {
  const combinedSize = parseSuitSize(value);

  if (combinedSize) {
    return { chest: combinedSize.chest, length: combinedSize.length };
  }

  const numericSize = value
    .replace(/^(?:European|EUR|EU|USA|US)(?=\s|\d)\s*/i, "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)$/)?.[1];

  return numericSize ? { chest: numericSize, length: null } : null;
}

function convertSuitSizeForProduct(
  value: string,
  sourceProduct: ShopifyProduct,
  candidateProduct: ShopifyProduct,
) {
  const sourceSystem = getProductSuitSizeSystem(sourceProduct);
  const candidateSystem = getProductSuitSizeSystem(candidateProduct);

  if (!sourceSystem || !candidateSystem || sourceSystem === candidateSystem) {
    return value;
  }

  const match = value
    .replace(/^(?:European|EUR|EU|USA|US)(?=\s|\d)\s*/i, "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)(.*)$/);

  if (!match?.[1]) {
    return value;
  }

  const convertedNumber = sourceSystem === "US" ? Number(match[1]) + 10 : Number(match[1]) - 10;

  return Number.isFinite(convertedNumber) ? `${convertedNumber}${match[2] ?? ""}` : value;
}

function getMatchingSizeVariant(
  product: ShopifyProduct,
  sourceProduct: ShopifyProduct,
  sourceSelectedOptions: ShopifyProductVariant["selectedOptions"],
  selectedSize: string,
) {
  const expectedSize =
    getProductSizeKind(product) === "suit"
      ? convertSuitSizeForProduct(selectedSize, sourceProduct, product)
      : selectedSize;
  const expectedToken = normalizeComparableSize(expectedSize);
  const expectedSuitSize = getSuitSizeParts(expectedSize);
  const selectedLengthOption = sourceSelectedOptions.find((option) =>
    isProductJacketLengthOption(sourceProduct, option.name),
  );
  const expectedLength =
    expectedSuitSize?.length ??
    (selectedLengthOption ? normalizeJacketLength(selectedLengthOption.value) : null);
  const candidateOffersLength = product.variants.some((variant) => {
    const size = getVariantSizeValue(variant);

    return Boolean(
      (size ? getSuitSizeParts(size)?.length : null) ?? getCandidateLength(product, variant),
    );
  });

  return (
    product.variants.find((variant) => {
      const size = getVariantSizeValue(variant);
      const candidateSuitSize = size ? getSuitSizeParts(size) : null;
      const sizeMatches =
        getProductSizeKind(product) === "suit" && expectedSuitSize && candidateSuitSize
          ? candidateSuitSize.chest === expectedSuitSize.chest
          : Boolean(size) && normalizeComparableSize(size ?? "") === expectedToken;
      const lengthMatches =
        !expectedLength ||
        !candidateOffersLength ||
        (candidateSuitSize?.length ?? getCandidateLength(product, variant)) === expectedLength;

      return variant.availableForSale && sizeMatches && lengthMatches;
    }) ?? null
  );
}

function getCandidateLength(product: ShopifyProduct, variant: ShopifyProductVariant) {
  const lengthOption = variant.selectedOptions.find((option) =>
    isProductJacketLengthOption(product, option.name),
  );

  return lengthOption
    ? normalizeJacketLength(lengthOption.value)
    : getVariantJacketLengthValue(variant);
}

function hasMeaningfulSizes(product: ShopifyProduct) {
  return product.variants.some((variant) => Boolean(getVariantSizeValue(variant)));
}

function getEligibleRecommendation(
  product: ShopifyProduct,
  sourceProduct: ShopifyProduct,
  selection: ProductSelectionDetail,
  fitProfile: FitProfile | null,
): RecommendationEntry | null {
  const availableVariant = product.variants.find((variant) => variant.availableForSale) ?? null;

  if (!availableVariant) {
    return null;
  }

  const sourceSize = getSelectedSize(selection.selectedOptions);
  const sameSizeKind = getProductSizeKind(product) === getProductSizeKind(sourceProduct);

  if (sourceSize && sameSizeKind) {
    const matchingVariant = getMatchingSizeVariant(
      product,
      sourceProduct,
      selection.selectedOptions,
      sourceSize,
    );

    return matchingVariant
      ? {
          product,
          preferredVariantId: matchingVariant.id,
          sizeAvailabilityLabel: `Size ${getVariantSizeValue(matchingVariant) ?? sourceSize} in stock`,
        }
      : null;
  }

  if (fitProfile && hasMeaningfulSizes(product)) {
    const fitMatches = getProductFitMatchesForProfile(product, fitProfile);
    const fitRecommendation =
      fitMatches.length > 0 ? getProductFitRecommendation(product, fitProfile) : null;
    const matchingVariant = fitRecommendation?.variantId
      ? (product.variants.find(
          (variant) => variant.availableForSale && variant.id === fitRecommendation.variantId,
        ) ?? null)
      : null;

    return matchingVariant
      ? {
          product,
          preferredVariantId: matchingVariant.id,
          sizeAvailabilityLabel: `${fitRecommendation?.label ?? fitMatches[0]} in stock`,
        }
      : null;
  }

  return {
    product,
    preferredVariantId: availableVariant.id,
    sizeAvailabilityLabel: null,
  };
}

function selectRecommendations(
  candidates: ShopifyProduct[],
  sourceProduct: ShopifyProduct,
  selection: ProductSelectionDetail,
  fitProfile: FitProfile | null,
  excludedIds = new Set<string>(),
) {
  const entries: RecommendationEntry[] = [];
  const seenIds = new Set(excludedIds);

  for (const candidate of candidates) {
    if (seenIds.has(candidate.id) || candidate.id === sourceProduct.id) {
      continue;
    }

    const entry = getEligibleRecommendation(candidate, sourceProduct, selection, fitProfile);

    if (!entry) {
      continue;
    }

    entries.push(entry);
    seenIds.add(candidate.id);

    if (entries.length === GROUP_SIZE) {
      break;
    }
  }

  return entries;
}

function RecommendationGroup({
  id,
  title,
  entries,
  mobileColumn,
  className = "",
}: {
  id: string;
  title: string;
  entries: RecommendationEntry[];
  mobileColumn: boolean;
  className?: string;
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={id} className={`grid min-w-0 grid-rows-[auto_1fr] ${className}`}>
      <h3 id={id} className="text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase">
        {title}
      </h3>
      <ul
        className={`mt-3 grid gap-3 sm:gap-4 md:grid-cols-3 md:grid-rows-1 xl:gap-5 ${
          mobileColumn
            ? `grid-cols-1 ${entries.length === GROUP_SIZE ? "grid-rows-3" : ""}`
            : "grid-cols-2"
        }`}
      >
        {entries.map((entry) => (
          <li key={entry.product.id} className="min-w-0">
            <ShopProductCard
              product={entry.product}
              preferredVariantId={entry.preferredVariantId}
              sizeAvailabilityLabel={entry.sizeAvailabilityLabel}
              headingLevel="h4"
              imageSizes="(max-width: 767px) calc(50vw - 1.25rem), (max-width: 1279px) calc(33vw - 1.5rem), 25rem"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductRecommendationsClient({
  product,
  sameBrandCandidates,
  outfitMatchCandidates,
}: ProductRecommendationsClientProps) {
  const [selection, setSelection] = useState<ProductSelectionDetail>(() =>
    getInitialSelection(product),
  );
  const [fitProfile, setFitProfile] = useState<FitProfile | null>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setFitProfile(parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY)));

      const latestSelection = getLatestProductSelection(product.id);

      if (latestSelection) {
        setSelection(latestSelection);
      }
    });

    function handleProductSelection(event: Event) {
      const detail = (event as CustomEvent<ProductSelectionDetail>).detail;

      if (detail?.productId === product.id) {
        setSelection(detail);
        setFitProfile(parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY)));
      }
    }

    window.addEventListener(PRODUCT_SELECTION_EVENT, handleProductSelection);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(PRODUCT_SELECTION_EVENT, handleProductSelection);
    };
  }, [product.id]);

  const sameBrandProducts = useMemo(() => {
    const sourceKind = getProductSizeKind(product);
    const rankedCandidates = sameBrandCandidates
      .map((candidate, index) => ({
        candidate,
        index,
        sameKind: getProductSizeKind(candidate) === sourceKind,
      }))
      .sort(
        (left, right) => Number(right.sameKind) - Number(left.sameKind) || left.index - right.index,
      )
      .map(({ candidate }) => candidate);

    return selectRecommendations(rankedCandidates, product, selection, fitProfile);
  }, [fitProfile, product, sameBrandCandidates, selection]);
  const sameBrandIds = useMemo(
    () => new Set(sameBrandProducts.map((entry) => entry.product.id)),
    [sameBrandProducts],
  );
  const outfitMatchProducts = useMemo(
    () =>
      selectRecommendations(outfitMatchCandidates, product, selection, fitProfile, sameBrandIds),
    [fitProfile, outfitMatchCandidates, product, sameBrandIds, selection],
  );

  if (sameBrandProducts.length === 0 && outfitMatchProducts.length === 0) {
    return null;
  }

  const hasBothGroups = sameBrandProducts.length > 0 && outfitMatchProducts.length > 0;
  const summary = hasBothGroups
    ? `More from ${product.vendor}, followed by pieces chosen to work with this item.`
    : sameBrandProducts.length > 0
      ? `More available styles from ${product.vendor}.`
      : "Available pieces chosen to work with this item.";

  return (
    <WaveSection as="div" topWave="C" background="stone" className="overflow-x-clip">
      <Container>
        <section aria-labelledby="complete-look-heading">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h2 id="complete-look-heading" className="font-heading text-3xl text-ink sm:text-4xl">
                Complete the Look
              </h2>
              <p className="mt-3 text-sm leading-7 text-smoke">{summary}</p>
              <p className="mt-1 text-xs leading-6 text-smoke">
                Every item shown is in stock. Matching product types also honor the size selected
                above; Smart Fit applies your saved sizes across categories.
              </p>
            </div>
            <ButtonLink href="/shop" variant="secondary" className="w-full sm:w-auto">
              Browse All Products
            </ButtonLink>
          </div>

          <div
            className={`mt-7 grid items-stretch gap-x-3 sm:gap-x-4 md:block ${
              hasBothGroups ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <RecommendationGroup
              id="same-brand-heading"
              title="Same Brand"
              entries={sameBrandProducts}
              mobileColumn={hasBothGroups}
            />
            <RecommendationGroup
              id="outfit-matches-heading"
              title="Outfit Matches"
              entries={outfitMatchProducts}
              mobileColumn={hasBothGroups}
              className={sameBrandProducts.length > 0 ? "md:mt-8" : ""}
            />
          </div>
        </section>
      </Container>
    </WaveSection>
  );
}
