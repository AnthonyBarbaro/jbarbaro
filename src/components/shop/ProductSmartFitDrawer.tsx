"use client";

import { Check, Ruler, Sparkles, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { FieldLabel, Input, Select } from "@/components/ui/Field";
import {
  buildFitProfile,
  findProductSuitVariant,
  FIT_PROFILE_STORAGE_KEY,
  getProductFitMatches,
  getVariantSizeValue,
  isSuitSizingProduct,
  parseSuitSize,
  parseFitProfile,
  type FitBuild,
  type FitProfile,
  type FitProfileInput,
} from "@/lib/fit-profile";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn } from "@/lib/utils";

type ProductSmartFitDrawerProps = {
  product: ShopifyProduct;
  open: boolean;
  onClose: () => void;
  onUseRecommendation: (recommendation: { label: string; variantId: string }) => void;
};

type FitDraft = {
  heightFeet: string;
  heightInches: string;
  weightLbs: string;
  build: FitBuild | "";
  knownSize: string;
};

const EMPTY_DRAFT: FitDraft = {
  heightFeet: "",
  heightInches: "",
  weightLbs: "",
  build: "",
  knownSize: "",
};

const BUILD_OPTIONS: Array<{ label: string; value: FitBuild }> = [
  { label: "Slim", value: "slim" },
  { label: "Average", value: "average" },
  { label: "Athletic", value: "athletic" },
  { label: "Broad", value: "broad" },
  { label: "Full", value: "full" },
];

type ProductSizeKind = "waist" | "suit" | "shirt" | "shoe" | "top";

function getProductSizeKind(product: ShopifyProduct): ProductSizeKind {
  const productText = [
    product.title,
    product.productType,
    ...product.collections.map((collection) => collection.title),
  ]
    .join(" ")
    .toLowerCase();

  if (/pant|trouser|denim|jean|short/.test(productText)) {
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

function getKnownSize(profile: FitProfile, kind: ProductSizeKind) {
  if (kind === "waist") return profile.knownWaistSize ?? "";
  if (kind === "suit") return profile.knownSuitSize ?? "";
  if (kind === "shirt") return profile.knownDressShirtSize ?? "";
  if (kind === "shoe") return profile.shoeSize ?? "";
  return profile.knownTopSize ?? "";
}

function getDraft(profile: FitProfile, kind: ProductSizeKind): FitDraft {
  return {
    heightFeet: String(profile.heightFeet),
    heightInches: String(profile.heightInches),
    weightLbs: String(profile.weightLbs),
    build: profile.build,
    knownSize: getKnownSize(profile, kind),
  };
}

function getEstimateLabel(profile: FitProfile, kind: ProductSizeKind) {
  if (kind === "waist") return `Waist ${profile.estimate.waist}`;
  if (kind === "suit") return `Suit ${profile.estimate.suit}`;
  if (kind === "shirt") return `Shirt ${profile.estimate.dressShirt}`;
  if (kind === "shoe")
    return profile.estimate.shoe ? `Shoe ${profile.estimate.shoe}` : "Shoe size not set";
  return `Top ${profile.estimate.alpha}`;
}

function getNumericTarget(profile: FitProfile, kind: ProductSizeKind) {
  if (kind === "waist") return Number.parseFloat(profile.estimate.waist.split("/")[0] ?? "");
  if (kind === "suit") return profile.estimate.jacketChest;
  if (kind === "shirt") return Number.parseFloat(profile.estimate.dressShirt);
  if (kind === "shoe") return Number.parseFloat(profile.estimate.shoe ?? "");
  return Number.NaN;
}

function getRecommendedProductSize(product: ShopifyProduct, profile: FitProfile) {
  if (getProductSizeKind(product) === "suit") {
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

  const exactMatches = getProductFitMatches(product, profile.recommendedSizes);
  const exactSize = exactMatches[0];

  if (exactSize) {
    const exactVariant = product.variants.find(
      (variant) => variant.availableForSale && getVariantSizeValue(variant) === exactSize,
    );

    if (exactVariant) {
      return {
        label: exactSize,
        variantId: exactVariant.id,
      };
    }
  }

  const sizeKind = getProductSizeKind(product);
  const target = getNumericTarget(profile, sizeKind);

  if (!Number.isFinite(target)) {
    return null;
  }

  const numericSizes = Array.from(
    new Set(
      product.variants
        .filter((variant) => variant.availableForSale)
        .map(getVariantSizeValue)
        .filter((value): value is string => Boolean(value))
        .map((value) => ({ value, number: Number.parseFloat(value) }))
        .filter((item) => Number.isFinite(item.number)),
    ),
  );

  const closestSize = numericSizes.sort(
    (left, right) => Math.abs(left.number - target) - Math.abs(right.number - target),
  )[0]?.value;
  const closestVariant = closestSize
    ? product.variants.find(
        (variant) => variant.availableForSale && getVariantSizeValue(variant) === closestSize,
      )
    : null;

  return closestSize && closestVariant
    ? {
        label: closestSize,
        variantId: closestVariant.id,
      }
    : null;
}

function buildInputFromDraft(draft: FitDraft, kind: ProductSizeKind): FitProfileInput | null {
  const heightFeet = Number(draft.heightFeet);
  const heightInches = Number(draft.heightInches);
  const weightLbs = Number(draft.weightLbs);
  const knownSize = draft.knownSize.trim() || undefined;

  if (
    !draft.build ||
    !Number.isInteger(heightFeet) ||
    !Number.isInteger(heightInches) ||
    !Number.isFinite(weightLbs)
  ) {
    return null;
  }

  return {
    heightFeet,
    heightInches,
    weightLbs,
    build: draft.build,
    knownWaistSize: kind === "waist" ? knownSize : undefined,
    knownSuitSize: kind === "suit" ? knownSize : undefined,
    knownDressShirtSize: kind === "shirt" ? knownSize : undefined,
    shoeSize: kind === "shoe" ? knownSize : undefined,
    knownTopSize: kind === "top" ? knownSize : undefined,
  };
}

export function ProductSmartFitDrawer({
  product,
  open,
  onClose,
  onUseRecommendation,
}: ProductSmartFitDrawerProps) {
  const sizeKind = getProductSizeKind(product);
  const [profile, setProfile] = useState<FitProfile | null>(null);
  const [draft, setDraft] = useState<FitDraft>(EMPTY_DRAFT);
  const [isEditing, setIsEditing] = useState(true);
  const recommendation = profile ? getRecommendedProductSize(product, profile) : null;
  const recommendedSize = recommendation?.label ?? null;
  const recommendationIsAvailable = Boolean(recommendation?.variantId);

  useEffect(() => {
    if (!open) {
      return;
    }

    const storedProfile = parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY));
    const frameId = window.requestAnimationFrame(() => {
      if (storedProfile) {
        setProfile(storedProfile);
        setDraft(getDraft(storedProfile, sizeKind));
        setIsEditing(false);
      } else {
        setProfile(null);
        setDraft(EMPTY_DRAFT);
        setIsEditing(true);
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [open, sizeKind]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildInputFromDraft(draft, sizeKind);

    if (!input) {
      return;
    }

    const nextProfile = buildFitProfile(input);
    window.localStorage.setItem(FIT_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setDraft(getDraft(nextProfile, sizeKind));
    setIsEditing(false);
  }

  function handleUseRecommendation() {
    if (!recommendation?.variantId) {
      return;
    }

    onUseRecommendation({
      label: recommendation.label,
      variantId: recommendation.variantId,
    });
  }

  if (!open) {
    return null;
  }

  const usualSizeLabel =
    sizeKind === "waist"
      ? "Usual waist size"
      : sizeKind === "suit"
        ? "Usual suit size"
        : sizeKind === "shirt"
          ? "Usual shirt size"
          : sizeKind === "shoe"
            ? "Usual shoe size"
            : "Usual top size";

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-[150] bg-ink/55 backdrop-blur-[2px]"
        aria-label="Close Smart Fit"
      />
      <aside
        id="product-smart-fit"
        className="fixed inset-y-0 right-0 z-[160] flex h-dvh w-full max-w-[30rem] flex-col bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-smart-fit-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-deep-teal/10 text-deep-teal">
              <Ruler className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-deep-teal uppercase">
                Smart Fit
              </p>
              <h2 id="product-smart-fit-title" className="text-lg font-semibold text-ink">
                Find your starting size
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink transition-colors hover:bg-stone focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
            aria-label="Close Smart Fit"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {profile && !isEditing ? (
            <div aria-live="polite">
              <p className="text-sm leading-6 text-smoke">
                Based on your answers, this is your recommended starting size for{" "}
                <span className="font-semibold text-ink">{product.title}</span>.
              </p>

              <div
                className={cn(
                  "mt-5 rounded-xl border px-5 py-6 text-center",
                  recommendationIsAvailable
                    ? "border-deep-teal/20 bg-deep-teal/8"
                    : "border-gold/35 bg-gold/10",
                )}
              >
                <Sparkles className="mx-auto h-5 w-5 text-deep-teal" />
                <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-smoke uppercase">
                  {recommendedSize ? "Recommended size" : "Your fit estimate"}
                </p>
                <p className="mt-2 font-heading text-5xl leading-none text-ink">
                  {recommendedSize ?? getEstimateLabel(profile, sizeKind)}
                </p>
                {recommendationIsAvailable ? (
                  <p className="mt-3 text-xs text-smoke">Exact size and length available online</p>
                ) : (
                  <p className="mt-3 text-xs leading-5 text-smoke">
                    {sizeKind === "suit"
                      ? "This is your full suit size. That exact size and length is not currently available online."
                      : "No exact online match is currently available for this product."}
                  </p>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-md border border-ink/10 bg-stone/60 p-3">
                  <p className="text-[9px] font-semibold tracking-[0.12em] text-smoke uppercase">
                    Suit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{profile.estimate.suit}</p>
                </div>
                <div className="rounded-md border border-ink/10 bg-stone/60 p-3">
                  <p className="text-[9px] font-semibold tracking-[0.12em] text-smoke uppercase">
                    Top
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{profile.estimate.alpha}</p>
                </div>
                <div className="rounded-md border border-ink/10 bg-stone/60 p-3">
                  <p className="text-[9px] font-semibold tracking-[0.12em] text-smoke uppercase">
                    Waist
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{profile.estimate.waist}</p>
                </div>
              </div>

              {recommendation?.variantId ? (
                <button
                  type="button"
                  onClick={handleUseRecommendation}
                  className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border border-ink bg-ink px-5 text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:border-deep-teal hover:bg-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
                >
                  <Check className="h-4 w-4" />
                  Use size {recommendation.label}
                </button>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-xs font-semibold text-ink transition-colors hover:bg-stone"
                >
                  Update answers
                </button>
                <a
                  href="/schedule-appointment"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-ink/15 bg-white px-4 text-center text-xs font-semibold text-ink transition-colors hover:bg-stone"
                >
                  Ask a fit expert
                </a>
              </div>

              <p className="mt-5 text-xs leading-5 text-smoke">
                Smart Fit is a starting estimate. Brand fit and tailoring can vary by garment.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm leading-6 text-smoke">
                Answer four quick questions. We&apos;ll compare your estimate with the sizes
                currently available for this product.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="product-fit-height-feet">Height (feet)</FieldLabel>
                  <Select
                    id="product-fit-height-feet"
                    value={draft.heightFeet}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, heightFeet: event.target.value }))
                    }
                    className="mt-2 min-h-12 bg-white"
                    required
                  >
                    <option value="">Feet</option>
                    {[4, 5, 6, 7].map((feet) => (
                      <option key={feet} value={feet}>
                        {feet}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <FieldLabel htmlFor="product-fit-height-inches">Inches</FieldLabel>
                  <Select
                    id="product-fit-height-inches"
                    value={draft.heightInches}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, heightInches: event.target.value }))
                    }
                    className="mt-2 min-h-12 bg-white"
                    required
                  >
                    <option value="">Inches</option>
                    {Array.from({ length: 12 }, (_, index) => index).map((inches) => (
                      <option key={inches} value={inches}>
                        {inches}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="product-fit-weight">Weight (lb)</FieldLabel>
                  <Input
                    id="product-fit-weight"
                    type="number"
                    min={95}
                    max={340}
                    inputMode="numeric"
                    value={draft.weightLbs}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, weightLbs: event.target.value }))
                    }
                    className="mt-2 min-h-12 bg-white"
                    placeholder="For example, 180"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="product-fit-build">Build</FieldLabel>
                  <Select
                    id="product-fit-build"
                    value={draft.build}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        build: event.target.value as FitBuild | "",
                      }))
                    }
                    className="mt-2 min-h-12 bg-white"
                    required
                  >
                    <option value="">Select your build</option>
                    {BUILD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="product-fit-known-size">
                    {usualSizeLabel} (optional)
                  </FieldLabel>
                  <Input
                    id="product-fit-known-size"
                    value={draft.knownSize}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, knownSize: event.target.value }))
                    }
                    className="mt-2 min-h-12 bg-white"
                    placeholder={
                      sizeKind === "waist" ? "For example, 34" : "Add a size you already wear"
                    }
                  />
                  <p className="mt-2 text-xs leading-5 text-smoke">
                    If you know it, this takes priority over the estimate.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border border-ink bg-ink px-5 text-sm font-semibold tracking-[0.08em] text-white uppercase transition-colors hover:border-deep-teal hover:bg-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30"
              >
                <Sparkles className="h-4 w-4" />
                Show my recommended size
              </button>

              {profile ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-xs font-semibold text-smoke underline underline-offset-4"
                >
                  Cancel changes
                </button>
              ) : null}

              <p className="mt-5 text-xs leading-5 text-smoke">
                Your fit profile is saved only in this browser so it can help while you shop.
              </p>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
