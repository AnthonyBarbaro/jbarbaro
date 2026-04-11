"use client";

import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { FieldLabel, Select } from "@/components/ui/Field";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ProductDetailClientProps = {
  product: ShopifyProduct;
};

function getProductImages(product: ShopifyProduct) {
  if (product.images.length > 0) {
    return product.images;
  }

  return product.featuredImage ? [product.featuredImage] : [];
}

function getOptionMap(product: ShopifyProduct) {
  const optionMap = new Map<string, string[]>();

  for (const variant of product.variants.filter((item) => item.availableForSale)) {
    for (const option of variant.selectedOptions) {
      const existingValues = optionMap.get(option.name) ?? [];

      if (!existingValues.includes(option.value)) {
        optionMap.set(option.name, [...existingValues, option.value]);
      }
    }
  }

  return Array.from(optionMap.entries())
    .map(([name, values]) => ({
      name,
      values: values.filter((value) => value.trim().toLowerCase() !== "default title"),
    }))
    .filter((group) => group.name.trim().toLowerCase() !== "title" && group.values.length > 1);
}

function findMatchingVariant(product: ShopifyProduct, selectedOptions: Record<string, string>) {
  return (
    product.variants.find((variant) =>
      variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value),
    ) ?? null
  );
}

function findAvailableVariantForOption(
  product: ShopifyProduct,
  optionName: string,
  optionValue: string,
  selectedOptions: Record<string, string>,
) {
  const matchingVariants = product.variants.filter(
    (variant) =>
      variant.availableForSale &&
      variant.selectedOptions.some((option) => option.name === optionName && option.value === optionValue),
  );

  if (matchingVariants.length === 0) {
    return null;
  }

  return (
    matchingVariants.find((variant) =>
      variant.selectedOptions.every((option) => (option.name === optionName ? option.value === optionValue : selectedOptions[option.name] === option.value)),
    ) ?? matchingVariants[0]
  );
}

function getAvailableValuesForGroup(
  product: ShopifyProduct,
  groupName: string,
  values: string[],
  selectedOptions: Record<string, string>,
) {
  return values.filter((value) => findAvailableVariantForOption(product, groupName, value, selectedOptions));
}

function buildInitialOptionState(variant: ShopifyProductVariant | undefined) {
  return Object.fromEntries((variant?.selectedOptions ?? []).map((option) => [option.name, option.value]));
}

function summarizeProductDescription(description: string) {
  const trimmed = description.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return null;
  }

  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0]?.trim() || trimmed;

  if (firstSentence.length <= 180) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 177).trimEnd()}...`;
}

function getRichTextFallback(description: string) {
  return description
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join("");
}

function getPrimaryCollection(product: ShopifyProduct) {
  return product.collections.find((collection) => collection.title.trim().toLowerCase() !== "shop all") ?? product.collections[0] ?? null;
}

const shopifyRichTextClassName =
  "[&_a]:font-semibold [&_a]:text-deep-teal [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-ink [&_b]:font-semibold [&_b]:text-ink [&_blockquote]:border-l-2 [&_blockquote]:border-gold/60 [&_blockquote]:pl-4 [&_blockquote]:italic [&_em]:italic [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-[1.35rem] [&_h2]:text-ink [&_h3]:mt-7 [&_h3]:font-heading [&_h3]:text-[1.15rem] [&_h3]:text-ink [&_li]:leading-8 [&_li]:marker:text-gold [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:text-[0.98rem] [&_p]:leading-8 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 max-w-none space-y-4 text-smoke";

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const initialVariant = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const images = getProductImages(product);
  const optionGroups = getOptionMap(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(buildInitialOptionState(initialVariant));
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const touchStartXRef = useRef<number | null>(null);

  const selectedVariant = findMatchingVariant(product, selectedOptions) ?? initialVariant;
  const activeImage = images[selectedImageIndex] ?? images[0] ?? null;
  const availableVariantCount = product.variants.filter((variant) => variant.availableForSale).length;
  const hasMultipleImages = images.length > 1;
  const primaryCollection = getPrimaryCollection(product);
  const productSummary = summarizeProductDescription(product.description);
  const descriptionMarkup = product.descriptionHtml?.trim() || getRichTextFallback(product.description);
  const priceLabel = selectedVariant
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);
  const availabilityLabel =
    availableVariantCount > 0
      ? `${availableVariantCount} purchasable option${availableVariantCount === 1 ? "" : "s"}`
      : "Unavailable";
  const availabilityMessage = selectedVariant?.availableForSale ? "Available to order online" : "Currently unavailable";
  const metaLine = [product.vendor, primaryCollection?.title || product.productType].filter(Boolean).join(" / ");
  const shouldShowDescriptionSection = Boolean(descriptionMarkup.trim());
  const visibleOptionGroups = optionGroups
    .map((group) => ({
      ...group,
      values: getAvailableValuesForGroup(product, group.name, group.values, selectedOptions),
    }))
    .filter((group) => group.values.length > 0);

  function showPreviousImage() {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage() {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedImageIndex((current) => (current + 1) % images.length);
  }

  function handleTouchStart(clientX: number) {
    touchStartXRef.current = clientX;
  }

  function handleTouchEnd(clientX: number) {
    if (touchStartXRef.current === null) {
      return;
    }

    const deltaX = clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) < 36) {
      return;
    }

    if (deltaX < 0) {
      showNextImage();
      return;
    }

    showPreviousImage();
  }

  function openLightbox() {
    if (!activeImage) {
      return;
    }

    setZoomLevel(1);
    setIsLightboxOpen(true);
  }

  function closeLightbox() {
    setIsLightboxOpen(false);
    setZoomLevel(1);
  }

  function zoomIn() {
    setZoomLevel((current) => Math.min(current + 0.35, 3));
  }

  function zoomOut() {
    setZoomLevel((current) => Math.max(current - 0.35, 1));
  }

  function goBack() {
    if (typeof window === "undefined") {
      router.push("/shop");
      return;
    }

    const referrer = document.referrer;
    let isSameOriginReferrer = false;

    if (referrer) {
      try {
        isSameOriginReferrer = new URL(referrer).origin === window.location.origin;
      } catch {
        isSameOriginReferrer = false;
      }
    }

    if (isSameOriginReferrer && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/shop");
  }

  function handleOptionChange(optionName: string, optionValue: string) {
    setSelectedOptions((current) => {
      const nextVariant = findAvailableVariantForOption(product, optionName, optionValue, current);

      if (!nextVariant) {
        return current;
      }

      return buildInitialOptionState(nextVariant);
    });
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((current) => {
          if (!hasMultipleImages) {
            return current;
          }

          return (current - 1 + images.length) % images.length;
        });
      }

      if (event.key === "ArrowRight") {
        setSelectedImageIndex((current) => {
          if (!hasMultipleImages) {
            return current;
          }

          return (current + 1) % images.length;
        });
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultipleImages, images.length, isLightboxOpen]);

  return (
    <div className="space-y-10 lg:space-y-12">
      <div className="grid min-w-0 gap-8 lg:gap-12 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <section className="min-w-0 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-gold hover:text-gold"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

        <div className="relative overflow-hidden rounded-[1.4rem] border border-ink/8 bg-white shadow-[0_20px_42px_-34px_rgba(14,23,38,0.22)]">
          <div
            className="relative h-[clamp(18rem,78vw,30rem)] touch-pan-y bg-[#f7f7f5] sm:h-[clamp(24rem,72vw,38rem)] lg:h-[clamp(33rem,56vw,46rem)]"
            onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
            onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          >
            {activeImage ? (
              <button type="button" onClick={openLightbox} className="block h-full w-full" aria-label="Open product image viewer">
                <Image
                  src={activeImage.url}
                  alt={activeImage.altText || product.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-3 sm:p-5 lg:p-7"
                />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-sm text-smoke">Image coming soon</div>
            )}
          </div>

          {hasMultipleImages ? (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute top-1/2 left-3 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/92 text-ink shadow-[0_14px_30px_-20px_rgba(14,23,38,0.42)] backdrop-blur transition-colors hover:border-gold hover:text-gold sm:left-4"
                aria-label="Show previous product image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute top-1/2 right-3 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/92 text-ink shadow-[0_14px_30px_-20px_rgba(14,23,38,0.42)] backdrop-blur transition-colors hover:border-gold hover:text-gold sm:right-4"
                aria-label="Show next product image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-ink/10 bg-white/88 px-3 py-1 text-[10px] font-medium text-smoke backdrop-blur sm:right-4 sm:bottom-4">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </>
          ) : null}

          {activeImage ? (
            <button
              type="button"
              onClick={openLightbox}
              className="absolute left-3 bottom-3 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white/92 px-3 py-2 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase shadow-[0_14px_30px_-20px_rgba(14,23,38,0.42)] backdrop-blur transition-colors hover:border-gold hover:text-gold sm:left-4 sm:bottom-4"
              aria-label="Zoom product image"
            >
              <Search className="h-3.5 w-3.5" />
              Zoom
            </button>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max gap-2 sm:gap-3">
              {images.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-[0.95rem] border bg-white transition-all sm:h-24 sm:w-24 lg:h-24 lg:w-24",
                    index === selectedImageIndex
                      ? "border-ink shadow-[0_16px_30px_-26px_rgba(15,20,28,0.35)]"
                      : "border-ink/10 hover:border-ink/35",
                  )}
                  aria-label={`View product image ${index + 1}`}
                >
                  <Image
                    src={image.url}
                    alt={image.altText || product.title}
                    fill
                    sizes="112px"
                    className="object-contain p-1.5 sm:p-2"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
        </section>

        <section className="min-w-0 lg:pt-9">
          <div className="border-b border-ink/10 pb-7">
            {metaLine ? <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">{metaLine}</p> : null}

          <h1 className="mt-3 text-balance font-heading text-[1.95rem] leading-[1.04] text-ink sm:text-[2.45rem] lg:text-[3rem]">
            {product.title}
          </h1>

          {productSummary ? (
            <p className="mt-4 max-w-2xl text-[0.98rem] leading-8 text-smoke">
              {productSummary}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-smoke">
            <span className="inline-flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", selectedVariant?.availableForSale ? "bg-deep-teal" : "bg-[#b45309]")} />
              {availabilityMessage}
            </span>
            {!selectedVariant?.availableForSale ? <span className="font-medium uppercase tracking-[0.12em]">Sold out</span> : null}
          </div>
        </div>

          <div className="pt-6">
            <p className="text-[1.7rem] font-semibold text-ink sm:text-[1.9rem]">{priceLabel}</p>

          {visibleOptionGroups.length > 0 ? (
            <div className="mt-6 space-y-5">
              {visibleOptionGroups.map((group) => (
                <div key={group.name} className="min-w-0">
                  <FieldLabel htmlFor={`product-option-${group.name.toLowerCase().replace(/\s+/g, "-")}`}>Select {group.name}</FieldLabel>
                  <Select
                    id={`product-option-${group.name.toLowerCase().replace(/\s+/g, "-")}`}
                    value={selectedOptions[group.name] ?? ""}
                    onChange={(event) => handleOptionChange(group.name, event.target.value)}
                    className="mt-2 rounded-xl border-ink/12 bg-white py-3 text-sm shadow-none focus:border-ink focus:ring-2 focus:ring-ink/10"
                  >
                    {group.values.map((value) => {
                      return (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      );
                    })}
                  </Select>
                </div>
              ))}
            </div>
          ) : null}

            <div className="mt-6">
              {selectedVariant ? (
                <AddToCartButton
                  merchandiseId={selectedVariant.id}
                  availableForSale={selectedVariant.availableForSale}
                  className="h-12 w-full rounded-xl text-sm tracking-[0.08em]"
                  label="Add to Bag"
                />
              ) : (
                <p className="text-sm text-smoke">This product does not have an available variant yet.</p>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-ink/10 bg-stone/40 px-4 py-3 text-sm text-smoke">
              <p>
                {availabilityLabel}
                {primaryCollection ? ` in ${primaryCollection.title}` : ""}.
              </p>
            </div>
          </div>
        </section>
      </div>

      {shouldShowDescriptionSection ? (
        <section className="border-t border-ink/10 pt-8 lg:pt-10">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-8">
            <div>
              <h2 className="font-heading text-[1.55rem] text-ink sm:text-[1.9rem]">Description</h2>
            </div>
            <div
              className={shopifyRichTextClassName}
              dangerouslySetInnerHTML={{ __html: descriptionMarkup }}
            />
          </div>
        </section>
      ) : null}

      {isLightboxOpen && activeImage ? (
        <div className="fixed inset-0 z-[180] bg-ink/92 text-ivory" onClick={closeLightbox}>
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex items-center gap-2 rounded-full border border-ivory/18 bg-ivory/8 px-3.5 py-2 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:border-gold hover:text-gold"
                aria-label="Close image viewer"
              >
                <X className="h-4 w-4" />
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={zoomLevel <= 1}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/18 bg-ivory/8 transition-colors hover:border-gold hover:text-gold disabled:opacity-45"
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/18 bg-ivory/8 transition-colors hover:border-gold hover:text-gold disabled:opacity-45"
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 touch-pan-y overflow-hidden px-4 pb-4 sm:px-6 sm:pb-6"
              onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
              onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
            >
              <div
                className="relative flex h-full items-center justify-center overflow-auto rounded-[1.2rem] bg-ivory/5"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="relative h-full w-full transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                >
                  <Image
                    src={activeImage.url}
                    alt={activeImage.altText || product.title}
                    fill
                    sizes="100vw"
                    className="object-contain p-3 sm:p-6"
                  />
                </div>

                {hasMultipleImages ? (
                  <>
                    <button
                      type="button"
                      onClick={showPreviousImage}
                      className="absolute top-1/2 left-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/18 bg-ink/55 transition-colors hover:border-gold hover:text-gold sm:left-5"
                      aria-label="Show previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={showNextImage}
                      className="absolute top-1/2 right-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/18 bg-ink/55 transition-colors hover:border-gold hover:text-gold sm:right-5"
                      aria-label="Show next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
