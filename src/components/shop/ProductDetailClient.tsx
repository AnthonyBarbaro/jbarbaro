"use client";

import Image from "next/image";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

  for (const variant of product.variants) {
    for (const option of variant.selectedOptions) {
      const existingValues = optionMap.get(option.name) ?? [];

      if (!existingValues.includes(option.value)) {
        optionMap.set(option.name, [...existingValues, option.value]);
      }
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({ name, values }));
}

function findMatchingVariant(product: ShopifyProduct, selectedOptions: Record<string, string>) {
  return (
    product.variants.find((variant) =>
      variant.selectedOptions.every((option) => selectedOptions[option.name] === option.value),
    ) ?? null
  );
}

function buildInitialOptionState(variant: ShopifyProductVariant | undefined) {
  return Object.fromEntries((variant?.selectedOptions ?? []).map((option) => [option.name, option.value]));
}

function getSelectedVariantLabel(variant: ShopifyProductVariant | null | undefined) {
  if (!variant || variant.title === "Default Title") {
    return null;
  }

  return variant.title;
}

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
  const selectedVariantLabel = getSelectedVariantLabel(selectedVariant);
  const activeImage = images[selectedImageIndex] ?? images[0] ?? null;
  const availableVariantCount = product.variants.filter((variant) => variant.availableForSale).length;
  const hasMultipleImages = images.length > 1;
  const priceLabel = selectedVariant
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);

  const detailRows = [
    product.vendor ? { label: "Brand", value: product.vendor } : null,
    product.productType ? { label: "Category", value: product.productType } : null,
    selectedVariantLabel ? { label: "Selected", value: selectedVariantLabel } : null,
    {
      label: "Availability",
      value:
        availableVariantCount > 0
          ? `${availableVariantCount} purchasable option${availableVariantCount === 1 ? "" : "s"}`
          : "Unavailable",
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row));

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
    <div className="grid min-w-0 gap-6 lg:gap-10 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
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

        <div className="relative overflow-hidden rounded-[1.55rem] border border-ink/8 bg-[#f5f2ec] shadow-[0_22px_50px_-38px_rgba(14,23,38,0.28)] sm:rounded-[1.85rem]">
          <div
            className="relative h-[clamp(18rem,78vw,30rem)] touch-pan-y sm:h-[clamp(24rem,72vw,38rem)] lg:h-[clamp(33rem,56vw,46rem)]"
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
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-[1rem] border bg-[#f5f2ec] transition-all sm:h-24 sm:w-24 lg:h-28 lg:w-28",
                    index === selectedImageIndex
                      ? "border-deep-teal shadow-[0_18px_36px_-26px_rgba(15,91,91,0.4)]"
                      : "border-ink/10 hover:border-gold",
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

      <section className="min-w-0 lg:pt-2">
        <div className="rounded-[1.45rem] border border-ink/8 bg-white p-4 shadow-[0_18px_42px_-34px_rgba(14,23,38,0.22)] sm:rounded-[1.7rem] sm:p-6 lg:p-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {product.vendor ? (
              <Badge variant="neutral" className="max-w-full">
                <span className="truncate">{product.vendor}</span>
              </Badge>
            ) : null}
            {!selectedVariant?.availableForSale ? <Badge variant="gold">Unavailable</Badge> : null}
          </div>

          {product.productType ? (
            <p className="mt-4 text-[10px] font-semibold tracking-[0.18em] text-smoke uppercase sm:text-[11px]">
              {product.productType}
            </p>
          ) : null}

          <h1 className="mt-2 text-balance font-heading text-[1.85rem] leading-[1.04] text-ink sm:text-[2.4rem] lg:text-[3rem]">
            {product.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <p className="text-[1.45rem] font-semibold text-ink sm:text-[1.7rem]">{priceLabel}</p>
            {selectedVariantLabel ? <p className="text-sm text-smoke">{selectedVariantLabel}</p> : null}
          </div>

          {optionGroups.length > 0 ? (
            <div className="mt-6 space-y-5">
              {optionGroups.map((group) => (
                <div key={group.name} className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{group.name}</p>
                    {selectedOptions[group.name] ? (
                      <p className="truncate text-xs font-medium text-smoke">{selectedOptions[group.name]}</p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.values.map((value) => {
                      const isSelected = selectedOptions[group.name] === value;
                      const variantForValue = product.variants.find(
                        (variant) =>
                          variant.selectedOptions.some((option) => option.name === group.name && option.value === value) &&
                          variant.selectedOptions.every((option) =>
                            option.name === group.name ? option.value === value : selectedOptions[option.name] === option.value,
                          ),
                      );
                      const isUnavailable = variantForValue ? !variantForValue.availableForSale : false;

                      return (
                        <Button
                          key={value}
                          variant={isSelected ? "teal" : "secondary"}
                          size="sm"
                          className={cn("min-w-[4.2rem] rounded-full", isUnavailable && "opacity-45")}
                          disabled={isUnavailable}
                          onClick={() => setSelectedOptions((current) => ({ ...current, [group.name]: value }))}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-6">
            {selectedVariant ? (
              <AddToCartButton
                merchandiseId={selectedVariant.id}
                availableForSale={selectedVariant.availableForSale}
                className="h-11 w-full rounded-full text-sm tracking-[0.08em]"
                label="Add to Bag"
              />
            ) : (
              <p className="text-sm text-smoke">This product does not have an available variant yet.</p>
            )}
          </div>

          <div className="mt-6 border-t border-ink/8 pt-5">
            <dl className="grid gap-3 text-sm text-smoke sm:grid-cols-2">
              {detailRows.map((row) => (
                <div key={row.label} className="min-w-0 rounded-[1rem] bg-stone/35 px-3.5 py-3">
                  <dt className="text-[10px] font-semibold tracking-[0.16em] uppercase">{row.label}</dt>
                  <dd className="mt-1.5 break-words text-sm text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

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
