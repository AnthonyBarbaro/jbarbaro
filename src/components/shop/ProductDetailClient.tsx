"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Maximize2,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ProductSmartFitDrawer } from "@/components/shop/ProductSmartFitDrawer";
import { brandSlug } from "@/lib/shopify/brand-slug";
import {
  FIT_PROFILE_STORAGE_KEY,
  getProductFitRecommendation,
  getProductSuitSizeSystem,
  getUsJacketEquivalentLabel,
  isProductJacketLengthOption,
  isSuitSizingProduct,
  parseFitProfile,
  type ProductFitRecommendation,
} from "@/lib/fit-profile";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ProductDetailClientProps = {
  product: ShopifyProduct;
};

const MIN_IMAGE_ZOOM = 1;
const MAX_IMAGE_ZOOM = 5;
const IMAGE_ZOOM_STEP = 0.5;
const DOUBLE_TAP_IMAGE_ZOOM = 2.5;

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

  return Array.from(optionMap.entries())
    .map(([name, values]) => ({
      name,
      values: values.filter((value) => value.trim().toLowerCase() !== "default title"),
    }))
    .filter((group) => group.name.trim().toLowerCase() !== "title" && group.values.length > 0);
}

function getProductOptionLabel(product: ShopifyProduct, name: string) {
  if (
    isSuitSizingProduct(product) &&
    name.toLowerCase().includes("size") &&
    getProductSuitSizeSystem(product) === "EU"
  ) {
    return "EU Jacket Size";
  }

  return isSuitSizingProduct(product) && isProductJacketLengthOption(product, name)
    ? "Length"
    : name;
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
      variant.selectedOptions.some(
        (option) => option.name === optionName && option.value === optionValue,
      ),
  );

  if (matchingVariants.length === 0) {
    return null;
  }

  return (
    matchingVariants.find((variant) =>
      variant.selectedOptions.every((option) =>
        option.name === optionName
          ? option.value === optionValue
          : selectedOptions[option.name] === option.value,
      ),
    ) ?? matchingVariants[0]
  );
}

function buildInitialOptionState(variant: ShopifyProductVariant | undefined) {
  return Object.fromEntries(
    (variant?.selectedOptions ?? []).map((option) => [option.name, option.value]),
  );
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
  return (
    product.collections.find(
      (collection) => collection.title.trim().toLowerCase() !== "shop all",
    ) ??
    product.collections[0] ??
    null
  );
}

const shopifyRichTextClassName =
  "[&_a]:font-semibold [&_a]:text-deep-teal [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-ink [&_b]:font-semibold [&_b]:text-ink [&_blockquote]:border-l-2 [&_blockquote]:border-gold/60 [&_blockquote]:pl-4 [&_blockquote]:italic [&_em]:italic [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-[1.35rem] [&_h2]:text-ink [&_h3]:mt-7 [&_h3]:font-heading [&_h3]:text-[1.15rem] [&_h3]:text-ink [&_li]:leading-8 [&_li]:marker:text-gold [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_p]:text-[0.98rem] [&_p]:leading-8 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 max-w-none space-y-4 text-smoke";

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const initialVariant =
    product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const images = getProductImages(product);
  const optionGroups = getOptionMap(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    buildInitialOptionState(initialVariant),
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [smartFitRecommendation, setSmartFitRecommendation] =
    useState<ProductFitRecommendation | null>(null);
  const [isSmartFitOpen, setIsSmartFitOpen] = useState(false);
  const [isBuyBoxInView, setIsBuyBoxInView] = useState(true);
  const galleryTouchStartXRef = useRef<number | null>(null);
  const buyBoxRef = useRef<HTMLDivElement | null>(null);
  const lightboxDialogRef = useRef<HTMLDivElement | null>(null);
  const lightboxStageRef = useRef<HTMLDivElement | null>(null);
  const lightboxTriggerRef = useRef<HTMLElement | null>(null);
  const lightboxTouchRef = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    pinchDistance: null as number | null,
    moved: false,
    lastTap: 0,
  });
  const mouseDragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  const selectedVariant = findMatchingVariant(product, selectedOptions);
  const activeImage = images[selectedImageIndex] ?? images[0] ?? null;
  const hasMultipleImages = images.length > 1;
  const primaryCollection = getPrimaryCollection(product);
  const descriptionMarkup =
    product.descriptionHtml?.trim() || getRichTextFallback(product.description);
  const priceLabel = selectedVariant
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : formatMoney(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode,
      );
  const selectedCompareAtPrice = selectedVariant?.compareAtPrice ?? null;
  const isOnSale = Boolean(
    selectedVariant &&
    selectedCompareAtPrice &&
    Number(selectedCompareAtPrice.amount) > Number(selectedVariant.price.amount),
  );
  const compareAtPrice =
    isOnSale && selectedCompareAtPrice
      ? formatMoney(selectedCompareAtPrice.amount, selectedCompareAtPrice.currencyCode)
      : null;
  const salePercent =
    isOnSale && selectedVariant && selectedCompareAtPrice
      ? Math.round(
          (1 - Number(selectedVariant.price.amount) / Number(selectedCompareAtPrice.amount)) * 100,
        )
      : null;
  const selectedVariantIsAvailable = Boolean(selectedVariant?.availableForSale);
  const availabilityMessage = selectedVariant
    ? selectedVariantIsAvailable
      ? "In stock, ready to ship"
      : "Sold out"
    : "Choose a size to continue";
  const selectedOptionSummary = selectedVariant?.selectedOptions
    .filter(
      (option) =>
        option.name.trim().toLowerCase() !== "title" &&
        option.value.trim().toLowerCase() !== "default title",
    )
    .map((option) => option.value)
    .join(" · ");
  const metaCategoryLabel = primaryCollection?.title || product.productType;
  const visibleOptionGroups = optionGroups;
  const smartFitUnavailable = Boolean(smartFitRecommendation && !smartFitRecommendation.variantId);
  const smartFitSupportingCopy = smartFitRecommendation
    ? (() => {
        const suitRecommendation = smartFitRecommendation.suit;
        const equivalence = suitRecommendation?.converted
          ? `Equivalent to your saved ${suitRecommendation.savedLabel}. `
          : "";

        if (smartFitUnavailable) {
          if (!suitRecommendation) {
            return "That recommended size is not currently available online. Choose another option or ask a fit expert.";
          }

          return suitRecommendation.lengthOffered
            ? `${equivalence}That size and jacket length are not currently available online.`
            : `${equivalence}That jacket size is not currently available online. This style does not list jacket length separately.`;
        }

        if (!suitRecommendation) {
          return "We selected the recommended size for this item. You can still change it before adding it to your bag.";
        }

        return suitRecommendation.lengthOffered
          ? `${equivalence}We selected the available size and jacket length.`
          : `${equivalence}We selected the available jacket size. This style does not list jacket length separately.`;
      })()
    : "";

  function showPreviousImage() {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedImageIndex((current) => (current - 1 + images.length) % images.length);
    resetViewer();
  }

  function showNextImage() {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedImageIndex((current) => (current + 1) % images.length);
    resetViewer();
  }

  function selectImage(index: number) {
    setSelectedImageIndex(index);
    resetViewer();
  }

  function handleGalleryTouchStart(clientX: number) {
    galleryTouchStartXRef.current = clientX;
  }

  function handleGalleryTouchEnd(clientX: number) {
    if (galleryTouchStartXRef.current === null) {
      return;
    }

    const deltaX = clientX - galleryTouchStartXRef.current;
    galleryTouchStartXRef.current = null;

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

    lightboxTriggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  }

  function closeLightbox() {
    setIsLightboxOpen(false);
    resetViewer();
  }

  function resetViewer() {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  }

  function clampPan(offset: { x: number; y: number }, scale: number) {
    const stage = lightboxStageRef.current;
    const stageWidth = stage?.clientWidth ?? 0;
    const stageHeight = stage?.clientHeight ?? 0;
    const maxX = Math.max(0, ((scale - 1) * stageWidth) / 2);
    const maxY = Math.max(0, ((scale - 1) * stageHeight) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    };
  }

  function changeZoom(amount: number) {
    setZoomLevel((current) => {
      const next = Math.max(MIN_IMAGE_ZOOM, Math.min(MAX_IMAGE_ZOOM, current + amount));
      setPanOffset((offset) => (next === MIN_IMAGE_ZOOM ? { x: 0, y: 0 } : clampPan(offset, next)));
      return next;
    });
  }

  function toggleZoom() {
    setZoomLevel((current) => {
      const next = current > MIN_IMAGE_ZOOM ? MIN_IMAGE_ZOOM : DOUBLE_TAP_IMAGE_ZOOM;
      setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function getTouchDistance(touches: ReactTouchEvent<HTMLDivElement>["touches"]) {
    const first = touches[0];
    const second = touches[1];

    if (!first || !second) {
      return null;
    }

    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  }

  function handleLightboxTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const interaction = lightboxTouchRef.current;

    if (event.touches.length === 2) {
      interaction.pinchDistance = getTouchDistance(event.touches);
      interaction.moved = true;
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    interaction.startX = touch.clientX;
    interaction.startY = touch.clientY;
    interaction.lastX = touch.clientX;
    interaction.lastY = touch.clientY;
    interaction.moved = false;
  }

  function handleLightboxTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const interaction = lightboxTouchRef.current;

    if (event.touches.length === 2) {
      const distance = getTouchDistance(event.touches);

      if (distance && interaction.pinchDistance) {
        event.preventDefault();
        const ratio = distance / interaction.pinchDistance;
        setZoomLevel((current) => {
          const next = Math.max(MIN_IMAGE_ZOOM, Math.min(MAX_IMAGE_ZOOM, current * ratio));
          setPanOffset((offset) =>
            next === MIN_IMAGE_ZOOM ? { x: 0, y: 0 } : clampPan(offset, next),
          );
          return next;
        });
      }

      interaction.pinchDistance = distance;
      interaction.moved = true;
      return;
    }

    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    if (zoomLevel > MIN_IMAGE_ZOOM) {
      event.preventDefault();
      const deltaX = touch.clientX - interaction.lastX;
      const deltaY = touch.clientY - interaction.lastY;

      setPanOffset((offset) => clampPan({ x: offset.x + deltaX, y: offset.y + deltaY }, zoomLevel));
      interaction.moved = true;
    }

    interaction.lastX = touch.clientX;
    interaction.lastY = touch.clientY;
  }

  function handleLightboxTouchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    const interaction = lightboxTouchRef.current;

    if (event.touches.length > 0) {
      const remainingTouch = event.touches[0];

      if (remainingTouch) {
        interaction.lastX = remainingTouch.clientX;
        interaction.lastY = remainingTouch.clientY;
      }

      interaction.pinchDistance = null;
      return;
    }

    const touch = event.changedTouches[0];

    if (!touch) {
      interaction.pinchDistance = null;
      return;
    }

    const deltaX = touch.clientX - interaction.startX;
    const deltaY = touch.clientY - interaction.startY;

    if (
      zoomLevel === MIN_IMAGE_ZOOM &&
      Math.abs(deltaX) > 44 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX < 0) {
        showNextImage();
      } else {
        showPreviousImage();
      }
    } else if (!interaction.moved && Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 12) {
      const now = event.timeStamp;

      if (now - interaction.lastTap < 320) {
        toggleZoom();
        interaction.lastTap = 0;
      } else {
        interaction.lastTap = now;
      }
    }

    interaction.pinchDistance = null;
    interaction.moved = false;
  }

  function handleMouseDragStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || zoomLevel <= MIN_IMAGE_ZOOM) {
      return;
    }

    mouseDragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMouseDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mouseDragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    setPanOffset((offset) => clampPan({ x: offset.x + deltaX, y: offset.y + deltaY }, zoomLevel));
  }

  function handleMouseDragEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (mouseDragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    mouseDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleLightboxWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? IMAGE_ZOOM_STEP : -IMAGE_ZOOM_STEP);
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
    setSmartFitRecommendation(null);
    setSelectedOptions((current) => {
      const nextVariant = findAvailableVariantForOption(product, optionName, optionValue, current);

      if (!nextVariant) {
        return current;
      }

      return buildInitialOptionState(nextVariant);
    });
  }

  function handleFitRecommendation(recommendation: ProductFitRecommendation) {
    if (!recommendation.variantId) {
      return;
    }

    const matchingVariant = product.variants.find(
      (variant) => variant.availableForSale && variant.id === recommendation.variantId,
    );

    if (matchingVariant) {
      setSelectedOptions(buildInitialOptionState(matchingVariant));
      setSmartFitRecommendation(recommendation);
    }

    setIsSmartFitOpen(false);
  }

  useEffect(() => {
    const profile = parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY));
    const recommendation = profile ? getProductFitRecommendation(product, profile) : null;
    const matchingVariant = recommendation?.variantId
      ? (product.variants.find(
          (variant) => variant.availableForSale && variant.id === recommendation.variantId,
        ) ?? null)
      : null;

    const frameId = window.requestAnimationFrame(() => {
      if (!matchingVariant) {
        setSmartFitRecommendation(recommendation);

        if (recommendation?.suit) {
          setSelectedOptions({});
        }

        return;
      }

      setSelectedOptions(buildInitialOptionState(matchingVariant));
      setSmartFitRecommendation(recommendation);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [product]);

  useEffect(() => {
    const node = buyBoxRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBuyBoxInView(entry.isIntersecting);
      },
      { rootMargin: "-72px 0px 0px 0px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const lightboxTrigger = lightboxTriggerRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = lightboxDialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      (firstFocusable ?? lightboxDialogRef.current)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
        return;
      }

      if (event.key === "ArrowLeft") {
        setSelectedImageIndex((current) => {
          if (!hasMultipleImages) {
            return current;
          }

          return (current - 1 + images.length) % images.length;
        });
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }

      if (event.key === "ArrowRight") {
        setSelectedImageIndex((current) => {
          if (!hasMultipleImages) {
            return current;
          }

          return (current + 1) % images.length;
        });
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
      }

      if (event.key === "Tab") {
        const focusableElements = Array.from(
          lightboxDialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);

        if (!firstElement || !lastElement) {
          event.preventDefault();
          lightboxDialogRef.current?.focus();
        } else if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      lightboxTrigger?.focus();
    };
  }, [hasMultipleImages, images.length, isLightboxOpen]);

  return (
    <div className="pb-4">
      <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(25rem,0.8fr)] xl:gap-14">
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:border-ink/30 hover:bg-stone/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to shop
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[1rem] border border-ink/8 bg-product-canvas">
            <div
              className="relative aspect-[4/5] touch-pan-y sm:aspect-[5/4] lg:aspect-[4/5]"
              onTouchStart={(event) => handleGalleryTouchStart(event.touches[0]?.clientX ?? 0)}
              onTouchEnd={(event) => handleGalleryTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
            >
              {activeImage ? (
                <button
                  type="button"
                  onClick={openLightbox}
                  className="group block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-deep-teal"
                  aria-label="Open product image viewer"
                >
                  <Image
                    src={activeImage.url}
                    alt={activeImage.altText || product.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    quality={92}
                    className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.01] sm:p-3 lg:p-4"
                  />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-sm text-smoke">
                  Image coming soon
                </div>
              )}
              <div className="pointer-events-none absolute top-3 right-3 rounded-full border border-ink/10 bg-white/90 px-3 py-1.5 text-[10px] font-medium text-ink backdrop-blur sm:top-4 sm:right-4">
                {selectedImageIndex + 1} / {Math.max(images.length, 1)}
              </div>
            </div>

            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute top-1/2 left-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/92 text-ink shadow-sm backdrop-blur transition-colors hover:border-ink/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal sm:left-4"
                  aria-label="Show previous product image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="absolute top-1/2 right-3 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/92 text-ink shadow-sm backdrop-blur transition-colors hover:border-ink/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal sm:right-4"
                  aria-label="Show next product image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : null}

            {activeImage ? (
              <button
                type="button"
                onClick={openLightbox}
                className="absolute bottom-3 left-1/2 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full border border-ink/10 bg-white/92 px-4 py-2 text-[10px] font-semibold tracking-[0.12em] whitespace-nowrap text-ink uppercase shadow-sm backdrop-blur transition-colors hover:border-ink/30 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal sm:bottom-4"
                aria-label="Zoom product image"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Tap to zoom
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
                    onClick={() => selectImage(index)}
                    className={cn(
                      "relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-md border bg-product-canvas transition-all sm:h-20 sm:w-20",
                      index === selectedImageIndex
                        ? "border-ink ring-1 ring-ink"
                        : "border-ink/10 hover:border-ink/35",
                    )}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={index === selectedImageIndex}
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

        <section className="min-w-0 lg:pt-[3.75rem]">
          <div className="space-y-5 lg:sticky lg:top-28">
            <header>
              {product.vendor || metaCategoryLabel ? (
                <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">
                  {product.vendor ? (
                    <Link
                      href={`/shop/brands/${brandSlug(product.vendor)}`}
                      className="transition-colors hover:text-deep-teal"
                    >
                      {product.vendor}
                    </Link>
                  ) : null}
                  {product.vendor && metaCategoryLabel ? " / " : null}
                  {metaCategoryLabel}
                </p>
              ) : null}

              <h1 className="mt-3 text-balance font-heading text-[2rem] leading-[1.08] text-ink sm:text-[2.55rem] lg:text-[2.8rem]">
                {product.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-smoke">
                <span className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      selectedVariantIsAvailable ? "bg-deep-teal" : "bg-[#b45309]",
                    )}
                  />
                  {availabilityMessage}
                </span>
              </div>
            </header>

            <div ref={buyBoxRef} className="border-t border-ink/10 pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <p
                    className={cn(
                      "text-[1.75rem] font-semibold sm:text-[2rem]",
                      compareAtPrice ? "text-sale" : "text-ink",
                    )}
                  >
                    {priceLabel}
                  </p>
                  {compareAtPrice ? (
                    <p className="text-base font-medium text-smoke line-through">
                      {compareAtPrice}
                    </p>
                  ) : null}
                  {salePercent ? (
                    <span className="rounded-full bg-sale px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
                      Save {salePercent}%
                    </span>
                  ) : null}
                </div>
              </div>

              {smartFitRecommendation ? (
                <div
                  id="smart-fit-match-status"
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "mt-4 rounded-md border px-4 py-3 text-sm leading-6 text-smoke",
                    smartFitUnavailable
                      ? "border-gold/35 bg-gold/10"
                      : "border-deep-teal/20 bg-deep-teal/8",
                  )}
                >
                  <p className="font-semibold text-ink">
                    Smart Fit match: {smartFitRecommendation.label}
                  </p>
                  <p className="mt-1">{smartFitSupportingCopy}</p>
                </div>
              ) : null}

              {visibleOptionGroups.length > 0 ? (
                <div className="mt-6 space-y-5">
                  {visibleOptionGroups.map((group) => {
                    const labelId = `product-option-${group.name.toLowerCase().replace(/\s+/g, "-")}`;
                    const selectedValue = selectedOptions[group.name] ?? "";
                    const displayGroupName = getProductOptionLabel(product, group.name);
                    const isEuropeanJacketSize =
                      getProductSuitSizeSystem(product) === "EU" &&
                      group.name.toLowerCase().includes("size");

                    return (
                      <div key={group.name} className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p id={labelId} className="text-sm font-semibold text-ink">
                            Select {displayGroupName}
                          </p>
                          <div className="flex items-center gap-3">
                            {/size/i.test(group.name) ? (
                              <button
                                type="button"
                                onClick={() => setIsSmartFitOpen(true)}
                                className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-deep-teal underline-offset-4 hover:underline"
                                aria-controls="product-smart-fit"
                                aria-expanded={isSmartFitOpen}
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                                Fit help
                              </button>
                            ) : null}
                            {selectedValue ? (
                              <p className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                                {selectedValue}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div
                          role="group"
                          aria-labelledby={labelId}
                          aria-describedby={
                            smartFitRecommendation ? "smart-fit-match-status" : undefined
                          }
                          className="mt-3 flex flex-wrap gap-2"
                        >
                          {group.values.map((value) => {
                            const isSelected = selectedValue === value;
                            const isAvailable = Boolean(
                              findAvailableVariantForOption(
                                product,
                                group.name,
                                value,
                                selectedOptions,
                              ),
                            );
                            const usJacketEquivalent = isEuropeanJacketSize
                              ? getUsJacketEquivalentLabel(value)
                              : null;

                            return (
                              <button
                                key={value}
                                type="button"
                                aria-pressed={isSelected}
                                aria-label={`${displayGroupName} ${value}${
                                  usJacketEquivalent ? `, equivalent to ${usJacketEquivalent}` : ""
                                }${isAvailable ? "" : ", sold out"}`}
                                disabled={!isAvailable}
                                onClick={() => handleOptionChange(group.name, value)}
                                className={cn(
                                  "relative inline-flex min-h-12 min-w-12 flex-col items-center justify-center rounded-md border px-4 py-2 text-center text-sm font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal disabled:cursor-not-allowed",
                                  isSelected
                                    ? "border-ink bg-ink text-white shadow-[0_16px_30px_-26px_rgba(11,15,20,0.7)]"
                                    : isAvailable
                                      ? "border-ink/15 bg-white text-ink hover:border-ink/45 hover:bg-stone/40"
                                      : "border-ink/8 bg-stone/60 text-smoke/60 line-through",
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
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-6">
                {selectedVariant ? (
                  <AddToCartButton
                    merchandiseId={selectedVariant.id}
                    availableForSale={selectedVariant.availableForSale}
                    itemName={product.title}
                    className="min-h-14 w-full rounded-lg border-ink bg-ink text-sm tracking-[0.08em] !text-white hover:border-deep-teal hover:bg-deep-teal"
                    label="Add to Bag"
                  />
                ) : initialVariant ? (
                  <AddToCartButton
                    merchandiseId={initialVariant.id}
                    availableForSale={false}
                    disabledLabel="Select a Size"
                    itemName={product.title}
                    className="min-h-14 w-full rounded-lg border-ink bg-ink text-sm tracking-[0.08em] !text-white hover:border-deep-teal hover:bg-deep-teal"
                  />
                ) : (
                  <p className="text-sm text-smoke">
                    This product does not have an available variant yet.
                  </p>
                )}
              </div>

              <p className="mt-3 flex items-center justify-center gap-2 text-xs text-smoke">
                <ShieldCheck className="h-4 w-4 text-deep-teal" />
                Secure checkout powered by Shopify
              </p>

              <div className="mt-5 grid grid-cols-3 divide-x divide-ink/10 border-y border-ink/10 py-3">
                <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                  <HelpCircle className="h-4 w-4 text-deep-teal" />
                  <span className="text-[10px] font-semibold leading-4 text-ink">Fit guidance</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                  <Truck className="h-4 w-4 text-deep-teal" />
                  <span className="text-[10px] font-semibold leading-4 text-ink">
                    Shipping at checkout
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                  <CreditCard className="h-4 w-4 text-deep-teal" />
                  <span className="text-[10px] font-semibold leading-4 text-ink">
                    Shopify checkout
                  </span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-ink/10 border-y border-ink/10">
              {descriptionMarkup.trim() ? (
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold text-ink">
                    Product details
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div
                    className={`${shopifyRichTextClassName} pb-6`}
                    dangerouslySetInnerHTML={{ __html: descriptionMarkup }}
                  />
                </details>
              ) : null}

              <details className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold text-ink">
                  Shipping &amp; order support
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-6 text-sm leading-7 text-smoke">
                  <p>
                    Orders are prepared quickly and packed with care before leaving our shop. For
                    delivery or availability questions,{" "}
                    <Link
                      href="/contact-us"
                      className="font-semibold text-deep-teal underline underline-offset-4"
                    >
                      contact our team
                    </Link>
                    .
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-semibold text-ink">
                  Fit &amp; alterations
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <div className="pb-6 text-sm leading-7 text-smoke">
                  <p>
                    Need a second opinion on size or tailoring?{" "}
                    <Link
                      href="/schedule-appointment"
                      className="font-semibold text-deep-teal underline underline-offset-4"
                    >
                      Book an appointment
                    </Link>{" "}
                    for personal fit guidance.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>
      </div>

      {!isBuyBoxInView && !isLightboxOpen && selectedVariant ? (
        <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-ink/10 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-32px_rgba(11,15,20,0.4)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-smoke">{product.title}</p>
              {selectedOptionSummary ? (
                <p className="truncate text-[11px] font-semibold text-deep-teal">
                  {selectedOptionSummary}
                </p>
              ) : null}
              <div className="flex items-baseline gap-2">
                <p className={cn("text-base font-bold", compareAtPrice ? "text-sale" : "text-ink")}>
                  {priceLabel}
                </p>
                {compareAtPrice ? (
                  <p className="text-xs font-medium text-smoke line-through">{compareAtPrice}</p>
                ) : null}
              </div>
            </div>
            <AddToCartButton
              merchandiseId={selectedVariant.id}
              availableForSale={selectedVariant.availableForSale}
              itemName={product.title}
              className="min-h-11 shrink-0 rounded-md border-ink bg-ink px-5 text-xs !text-white hover:border-deep-teal hover:bg-deep-teal"
              label="Add to Bag"
              ariaLabel={`Add ${product.title} to bag`}
            />
          </div>
        </div>
      ) : null}

      {isLightboxOpen && activeImage ? (
        <div
          ref={lightboxDialogRef}
          className="fixed inset-0 z-[180] bg-[#090d11] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Product image viewer"
          tabIndex={-1}
        >
          <div className="flex h-dvh flex-col">
            <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-5 sm:py-4">
              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-semibold tracking-[0.12em] uppercase transition-colors hover:border-white/40 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
                aria-label="Close image viewer"
              >
                <X className="h-4 w-4" />
                Close
              </button>
              <p className="hidden max-w-[40vw] truncate text-xs font-medium text-white/65 sm:block">
                {product.title}
              </p>
              <div className="flex items-center rounded-full border border-white/15 bg-white/8">
                <button
                  type="button"
                  onClick={() => changeZoom(-IMAGE_ZOOM_STEP)}
                  disabled={zoomLevel <= MIN_IMAGE_ZOOM}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold/40 disabled:opacity-35"
                  aria-label="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={resetViewer}
                  className="min-w-14 text-center text-[11px] font-semibold tabular-nums text-white"
                  aria-label="Reset image zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => changeZoom(IMAGE_ZOOM_STEP)}
                  disabled={zoomLevel >= MAX_IMAGE_ZOOM}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold/40 disabled:opacity-35"
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={lightboxStageRef}
              className={cn(
                "relative min-h-0 flex-1 touch-none overflow-hidden bg-product-canvas",
                zoomLevel > MIN_IMAGE_ZOOM
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-zoom-in",
              )}
              onDoubleClick={toggleZoom}
              onWheel={handleLightboxWheel}
              onTouchStart={handleLightboxTouchStart}
              onTouchMove={handleLightboxTouchMove}
              onTouchEnd={handleLightboxTouchEnd}
              onPointerDown={handleMouseDragStart}
              onPointerMove={handleMouseDragMove}
              onPointerUp={handleMouseDragEnd}
              onPointerCancel={handleMouseDragEnd}
            >
              <div
                className="relative h-full w-full will-change-transform"
                style={{
                  transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
                  transformOrigin: "center center",
                }}
              >
                <Image
                  src={activeImage.url}
                  alt={activeImage.altText || product.title}
                  fill
                  sizes="100vw"
                  priority
                  unoptimized
                  draggable={false}
                  className="pointer-events-none object-contain p-2 select-none sm:p-5"
                />
              </div>

              {hasMultipleImages && zoomLevel === MIN_IMAGE_ZOOM ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousImage}
                    className="absolute top-1/2 left-3 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-ink shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal sm:left-5"
                    aria-label="Show previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNextImage}
                    className="absolute top-1/2 right-3 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-ink shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal sm:right-5"
                    aria-label="Show next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}

              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
                <p className="rounded-full bg-ink/75 px-3 py-2 text-center text-[10px] font-medium tracking-[0.05em] text-white backdrop-blur">
                  {zoomLevel > MIN_IMAGE_ZOOM
                    ? "Drag to explore · Pinch or scroll to zoom · Tap 100% to reset"
                    : `Double tap, pinch, or scroll to zoom${hasMultipleImages ? " · Swipe for more" : ""}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ProductSmartFitDrawer
        product={product}
        open={isSmartFitOpen}
        onClose={() => setIsSmartFitOpen(false)}
        onUseRecommendation={handleFitRecommendation}
      />
    </div>
  );
}
