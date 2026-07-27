"use client";

import Image from "next/image";
import { Plus, ShoppingBag, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import {
  FIT_PROFILE_STORAGE_KEY,
  getProductFitRecommendation,
  getUsJacketEquivalentLabel,
  isProductJacketLengthOption,
  parseFitProfile,
  type SuitSizeSystem,
} from "@/lib/fit-profile";
import { openShopifyCartDrawer } from "@/lib/shopify/cart-events";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

export type QuickAddProductData = Pick<
  ShopifyProduct,
  | "title"
  | "vendor"
  | "productType"
  | "tags"
  | "collections"
  | "featuredImage"
  | "priceRange"
  | "variants"
>;

type QuickAddProductProps = {
  product: QuickAddProductData;
  className?: string;
  preferredVariantId?: string | null;
  jacketSizeSystem?: SuitSizeSystem | null;
  fitVariants?: ShopifyProductVariant[];
};

function isMeaningfulOption(name: string, value: string) {
  return (
    name.trim().toLowerCase() !== "title" &&
    value.trim().toLowerCase() !== "default title" &&
    value.trim().length > 0
  );
}

function getOptionGroups(product: QuickAddProductData) {
  const optionMap = new Map<string, string[]>();

  for (const variant of product.variants) {
    for (const option of variant.selectedOptions) {
      if (!isMeaningfulOption(option.name, option.value)) {
        continue;
      }

      const values = optionMap.get(option.name) ?? [];

      if (!values.includes(option.value)) {
        optionMap.set(option.name, [...values, option.value]);
      }
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({ name, values }));
}

type OptionGroup = ReturnType<typeof getOptionGroups>[number];

function getOptionGroupLabel(
  product: QuickAddProductData,
  group: OptionGroup,
  jacketSizeSystem?: SuitSizeSystem | null,
) {
  if (jacketSizeSystem === "EU" && /size/i.test(group.name)) {
    return "EU Jacket Size";
  }

  return isProductJacketLengthOption(product, group.name) ? "Length" : group.name;
}

function getVariantOptionValue(variant: ShopifyProductVariant, optionName: string) {
  return variant.selectedOptions.find((option) => option.name === optionName)?.value;
}

function variantMatchesSelections(
  variant: ShopifyProductVariant,
  selectedOptions: Record<string, string>,
) {
  return Object.entries(selectedOptions).every(
    ([name, value]) => getVariantOptionValue(variant, name) === value,
  );
}

function getInitialSelectedOptions(
  product: QuickAddProductData,
  optionGroups: OptionGroup[],
  preferredVariantId?: string | null,
) {
  const preferredVariant = preferredVariantId
    ? product.variants.find(
        (variant) => variant.availableForSale && variant.id === preferredVariantId,
      )
    : null;

  if (preferredVariant) {
    return Object.fromEntries(
      preferredVariant.selectedOptions
        .filter((option) => isMeaningfulOption(option.name, option.value))
        .map((option) => [option.name, option.value]),
    );
  }

  return Object.fromEntries(
    optionGroups.flatMap((group) => {
      const [onlyValue] = group.values;
      const isAvailable =
        onlyValue &&
        product.variants.some(
          (variant) =>
            variant.availableForSale && getVariantOptionValue(variant, group.name) === onlyValue,
        );

      return group.values.length === 1 && isAvailable ? [[group.name, onlyValue]] : [];
    }),
  );
}

function findMatchingVariant(
  product: QuickAddProductData,
  optionGroups: OptionGroup[],
  selectedOptions: Record<string, string>,
) {
  if (optionGroups.some((group) => !selectedOptions[group.name])) {
    return null;
  }

  return (
    product.variants.find(
      (variant) => variant.availableForSale && variantMatchesSelections(variant, selectedOptions),
    ) ?? null
  );
}

function getAvailableVariantsForOption(
  product: QuickAddProductData,
  optionName: string,
  optionValue: string,
) {
  return product.variants.filter(
    (variant) =>
      variant.availableForSale && getVariantOptionValue(variant, optionName) === optionValue,
  );
}

export function QuickAddProduct({
  product,
  className,
  preferredVariantId,
  jacketSizeSystem,
  fitVariants,
}: QuickAddProductProps) {
  const fitProduct = fitVariants ? { ...product, variants: fitVariants } : product;
  const availableVariants = useMemo(
    () => product.variants.filter((variant) => variant.availableForSale),
    [product.variants],
  );
  const preferredVariant = preferredVariantId
    ? availableVariants.find((variant) => variant.id === preferredVariantId)
    : null;
  const initialVariant = preferredVariant ?? availableVariants[0];
  const optionGroups = useMemo(() => getOptionGroups(product), [product]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    getInitialSelectedOptions(product, optionGroups, preferredVariantId),
  );
  const [selectionNotice, setSelectionNotice] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const shouldRestoreFocusRef = useRef(true);
  const reactId = useId().replace(/:/g, "");
  const dialogId = `quick-add-${reactId}`;
  const labelId = `${dialogId}-label`;
  const titleId = `${dialogId}-title`;
  const selectedVariant = findMatchingVariant(product, optionGroups, selectedOptions);
  const hasMeaningfulOptions = optionGroups.length > 0;
  const isSoldOut = availableVariants.length === 0;
  const buttonClassName = cn(
    "inline-flex h-11 min-h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white/95 p-0 text-deep-teal shadow-[0_8px_24px_-16px_rgba(11,15,20,0.75)] transition-[background-color,border-color,color,transform,box-shadow] duration-200 hover:border-deep-teal hover:bg-deep-teal hover:text-white hover:shadow-[0_12px_28px_-16px_rgba(15,91,91,0.8)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ivory",
    className,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      (firstFocusable ?? panelRef.current)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        shouldRestoreFocusRef.current = true;
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        panelRef.current?.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      if (shouldRestoreFocusRef.current) {
        trigger?.focus();
      }
    };
  }, [isOpen]);

  function openQuickAdd() {
    const storedProfile = parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY));
    const storedRecommendation = storedProfile
      ? getProductFitRecommendation(fitProduct, storedProfile)
      : null;
    const activePreferredVariantId = [storedRecommendation?.variantId, preferredVariantId].find(
      (variantId) =>
        Boolean(
          variantId &&
          product.variants.some((variant) => variant.availableForSale && variant.id === variantId),
        ),
    );

    shouldRestoreFocusRef.current = true;
    setSelectedOptions(getInitialSelectedOptions(product, optionGroups, activePreferredVariantId));
    setSelectionNotice("");
    setIsOpen(true);
  }

  function closeQuickAdd() {
    shouldRestoreFocusRef.current = true;
    setIsOpen(false);
  }

  function selectOption(name: string, value: string) {
    const matchingVariants = getAvailableVariantsForOption(product, name, value);

    if (matchingVariants.length === 0) {
      return;
    }

    const bestMatch = matchingVariants.reduce((best, candidate) => {
      const score = Object.entries(selectedOptions).filter(
        ([selectedName, selectedValue]) =>
          selectedName !== name && getVariantOptionValue(candidate, selectedName) === selectedValue,
      ).length;
      const bestScore = Object.entries(selectedOptions).filter(
        ([selectedName, selectedValue]) =>
          selectedName !== name && getVariantOptionValue(best, selectedName) === selectedValue,
      ).length;

      return score > bestScore ? candidate : best;
    });
    const nextSelectedOptions = { ...selectedOptions, [name]: value };
    const clearedGroups: string[] = [];

    for (const group of optionGroups) {
      if (
        group.name !== name &&
        nextSelectedOptions[group.name] &&
        getVariantOptionValue(bestMatch, group.name) !== nextSelectedOptions[group.name]
      ) {
        delete nextSelectedOptions[group.name];
        clearedGroups.push(group.name);
      }
    }

    setSelectedOptions(nextSelectedOptions);
    setSelectionNotice(
      clearedGroups.length > 0
        ? `Select ${clearedGroups.join(" and ")} again for this combination.`
        : "",
    );
  }

  if (isSoldOut || !initialVariant) {
    return null;
  }

  if (!hasMeaningfulOptions) {
    return (
      <AddToCartButton
        merchandiseId={initialVariant.id}
        availableForSale
        ariaLabel={`Add ${product.title} to bag`}
        itemName={product.title}
        iconOnly
        containerClassName="relative"
        className={buttonClassName}
      />
    );
  }

  const selectedPrice = selectedVariant
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : formatMoney(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode,
      );
  const selectedOptionSummary = optionGroups
    .map((group) => {
      const value = selectedOptions[group.name];

      return value && jacketSizeSystem === "EU" && /size/i.test(group.name) ? `EU ${value}` : value;
    })
    .filter((value): value is string => Boolean(value))
    .join(" · ");
  const missingOptionGroups = optionGroups.filter((group) => !selectedOptions[group.name]);
  const selectionPrompt =
    missingOptionGroups.length > 0
      ? `Select ${missingOptionGroups.map((group) => group.name).join(" and ")}`
      : "Choose an available combination";

  return (
    <div className="group/quick relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={openQuickAdd}
        className={buttonClassName}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={isOpen}
        aria-label={`Choose options for ${product.title}`}
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-[calc(100%+0.5rem)] z-10 hidden rounded-md bg-ink px-2.5 py-1.5 text-xs font-semibold tracking-[0.1em] whitespace-nowrap text-white uppercase opacity-0 shadow-sm transition-opacity group-focus-within/quick:opacity-100 group-hover/quick:opacity-100 sm:block"
      >
        Quick add
      </span>

      {isOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[190] flex items-end justify-center sm:items-center sm:p-6">
              <button
                type="button"
                onClick={closeQuickAdd}
                className="absolute inset-0 bg-ink/60"
                aria-label="Close quick add"
              />

              <div
                ref={panelRef}
                id={dialogId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${labelId} ${titleId}`}
                tabIndex={-1}
                className="relative z-[1] flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-lg bg-white shadow-[0_30px_70px_-36px_rgba(11,15,20,0.65)] outline-none sm:rounded-lg"
              >
                <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2 text-deep-teal">
                    <ShoppingBag className="h-4 w-4" aria-hidden />
                    <p id={labelId} className="text-xs font-semibold tracking-[0.14em] uppercase">
                      Quick Add
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeQuickAdd}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/12 text-ink transition-colors hover:border-deep-teal hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
                    aria-label="Close quick add"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                  <div className="flex gap-4">
                    <div className="relative h-28 w-22 shrink-0 overflow-hidden rounded-md bg-product-canvas">
                      {product.featuredImage ? (
                        <Image
                          src={product.featuredImage.url}
                          alt={product.featuredImage.altText || product.title}
                          fill
                          sizes="88px"
                          className="object-contain p-2"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                      {product.vendor ? (
                        <p className="text-xs font-semibold tracking-[0.14em] text-smoke uppercase">
                          {product.vendor}
                        </p>
                      ) : null}
                      <h2
                        id={titleId}
                        className="mt-1 line-clamp-2 text-base leading-6 font-semibold text-ink sm:text-lg"
                      >
                        {product.title}
                      </h2>
                      <p className="mt-2 text-lg font-bold tracking-[-0.02em] text-ink">
                        {selectedPrice}
                      </p>
                      {selectedOptionSummary ? (
                        <p className="mt-1 text-xs text-smoke">{selectedOptionSummary}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {optionGroups.map((group) => (
                      <fieldset key={group.name}>
                        <legend className="text-xs font-semibold tracking-[0.12em] text-ink uppercase">
                          Select {getOptionGroupLabel(fitProduct, group, jacketSizeSystem)}
                        </legend>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {group.values.map((value) => {
                            const isAvailable =
                              getAvailableVariantsForOption(product, group.name, value).length > 0;
                            const isSelected = selectedOptions[group.name] === value;
                            const usJacketEquivalent =
                              jacketSizeSystem === "EU" && /size/i.test(group.name)
                                ? getUsJacketEquivalentLabel(value)
                                : null;

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => selectOption(group.name, value)}
                                disabled={!isAvailable}
                                aria-pressed={isSelected}
                                aria-label={
                                  jacketSizeSystem === "EU" && /size/i.test(group.name)
                                    ? `European jacket size ${value}${
                                        usJacketEquivalent
                                          ? `, equivalent to ${usJacketEquivalent}`
                                          : ""
                                      }`
                                    : undefined
                                }
                                className={cn(
                                  "inline-flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-ink/8 disabled:bg-stone/60 disabled:text-smoke/45 disabled:line-through",
                                  isSelected
                                    ? "border-ink bg-ink text-white"
                                    : "border-ink/15 bg-white text-ink hover:border-deep-teal hover:text-deep-teal",
                                )}
                              >
                                <span>{value}</span>
                                {usJacketEquivalent ? (
                                  <span
                                    className={cn(
                                      "mt-0.5 text-[10px] font-medium",
                                      isSelected ? "text-white/70" : "text-smoke",
                                    )}
                                  >
                                    {usJacketEquivalent}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                    <p className="sr-only" role="status" aria-live="polite">
                      {selectionNotice}
                    </p>
                  </div>
                </div>

                <div className="border-t border-ink/10 bg-stone/45 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4">
                  <AddToCartButton
                    merchandiseId={selectedVariant?.id ?? initialVariant.id}
                    availableForSale={Boolean(selectedVariant?.availableForSale)}
                    label="Add Selected Item"
                    disabledLabel={selectionPrompt}
                    ariaLabel={
                      selectedVariant
                        ? `Add ${product.title}${selectedOptionSummary ? ` in ${selectedOptionSummary}` : ""} to bag`
                        : `${selectionPrompt} before adding ${product.title} to bag`
                    }
                    itemName={product.title}
                    className="min-h-12 w-full border-ink bg-ink text-white hover:border-deep-teal hover:bg-deep-teal focus-visible:ring-deep-teal"
                    openCartOnSuccess={false}
                    onAdded={() => {
                      shouldRestoreFocusRef.current = true;
                      setIsOpen(false);
                      window.setTimeout(openShopifyCartDrawer, 0);
                    }}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
