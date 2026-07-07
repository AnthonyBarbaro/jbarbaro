"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  PackageCheck,
  Ruler,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { aggregateRating } from "@/data/testimonials";
import { brandSlug } from "@/lib/shopify/brand-slug";
import {
  FIT_PROFILE_STORAGE_KEY,
  getProductFitMatches,
  getVariantSizeValue,
  parseFitProfile,
} from "@/lib/fit-profile";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ProductDetailClientProps = {
  product: ShopifyProduct;
  storeReviewSummary?: {
    source: "google" | "fallback";
    ratingValue: number;
    reviewCount: number;
  };
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

function getAvailableValuesForGroup(
  product: ShopifyProduct,
  groupName: string,
  values: string[],
  selectedOptions: Record<string, string>,
) {
  return values.filter((value) =>
    findAvailableVariantForOption(product, groupName, value, selectedOptions),
  );
}

function buildInitialOptionState(variant: ShopifyProductVariant | undefined) {
  return Object.fromEntries(
    (variant?.selectedOptions ?? []).map((option) => [option.name, option.value]),
  );
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

function AssuranceItem({
  icon,
  title,
  detail,
  highlight = false,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[5rem] gap-3 rounded-md border px-4 py-3",
        highlight ? "border-deep-teal/18 bg-deep-teal/7" : "border-ink/10 bg-white",
      )}
    >
      <div
        className={cn(
          "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
          highlight
            ? "border-deep-teal/20 bg-white text-deep-teal"
            : "border-gold/25 bg-gold/10 text-ink",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-5 text-smoke">{detail}</p>
      </div>
    </div>
  );
}

function ReviewStars({ rating }: { rating: number }) {
  const fillPercentage = (Math.max(0, Math.min(5, rating)) / 5) * 100;

  return (
    <span className="relative inline-flex items-center" aria-hidden="true">
      <span className="flex gap-0.5 text-ink/15">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 shrink-0 fill-current" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-gold"
        style={{ width: `${fillPercentage}%` }}
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 shrink-0 fill-current" />
        ))}
      </span>
    </span>
  );
}

function getDescriptionSentences(description: string) {
  return description
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pickDescriptionDetail(sentences: string[], pattern: RegExp, fallback: string) {
  return sentences.find((sentence) => pattern.test(sentence)) ?? fallback;
}

function getProductNoun(product: ShopifyProduct) {
  return product.productType || getPrimaryCollection(product)?.title || "piece";
}

function getProductDescriptionHighlights(product: ShopifyProduct) {
  const productNoun = getProductNoun(product).toLowerCase();
  const sentences = getDescriptionSentences(product.description);
  const summary =
    summarizeProductDescription(product.description) ||
    `${product.title} is selected for a polished, professional wardrobe.`;

  return [
    {
      title: "Design notes",
      detail: summary,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      title: "Material and finish",
      detail: pickDescriptionDetail(
        sentences,
        /leather|suede|wool|cotton|linen|silk|cashmere|fabric|crafted|premium|durable|polished|finish/i,
        `${product.vendor || "J. Barbaro"} selected this ${productNoun} for a refined finish and easy wardrobe versatility.`,
      ),
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      title: "Fit and styling",
      detail: pickDescriptionDetail(
        sentences,
        /fit|comfort|tailor|slim|classic|regular|relaxed|wear|pair|style|occasion|silhouette/i,
        `Style it with tailored separates, denim, or occasion-ready layers depending on the setting.`,
      ),
      icon: <Ruler className="h-4 w-4" />,
    },
  ];
}

function DescriptionHighlight({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-stone/45 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-white text-deep-teal">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-3 text-sm leading-7 text-smoke">{detail}</p>
    </div>
  );
}

function getProductReviewCard(
  product: ShopifyProduct,
  primaryCollectionTitle: string | null,
  storeReviewSummary: ProductDetailClientProps["storeReviewSummary"],
) {
  if (product.reviewSummary) {
    return {
      heading: `${product.reviewSummary.ratingValue.toFixed(1)} / 5`,
      body: `Based on ${new Intl.NumberFormat("en-US").format(product.reviewSummary.reviewCount)} product reviews`,
      eyebrow: "Product reviews",
    };
  }

  const productNoun = (
    primaryCollectionTitle ||
    product.productType ||
    product.title
  ).toLowerCase();
  const ratingValue = storeReviewSummary?.ratingValue ?? aggregateRating.ratingValue;
  const storeReviewCount = new Intl.NumberFormat("en-US").format(
    storeReviewSummary?.reviewCount ?? aggregateRating.reviewCount,
  );
  const sourceLabel =
    storeReviewSummary?.source === "google"
      ? "Google store reviews"
      : "J. Barbaro customer reviews";

  return {
    heading: `${ratingValue.toFixed(1)} / 5`,
    body: `Product reviews for ${productNoun} are coming soon. Backed by ${storeReviewCount} ${sourceLabel}.`,
    eyebrow: "Reviews coming soon",
  };
}

export function ProductDetailClient({ product, storeReviewSummary }: ProductDetailClientProps) {
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
  const [smartFitMatch, setSmartFitMatch] = useState<string | null>(null);
  const [isBuyBoxInView, setIsBuyBoxInView] = useState(true);
  const touchStartXRef = useRef<number | null>(null);
  const buyBoxRef = useRef<HTMLDivElement | null>(null);

  const selectedVariant = findMatchingVariant(product, selectedOptions) ?? initialVariant;
  const activeImage = images[selectedImageIndex] ?? images[0] ?? null;
  const availableVariantCount = product.variants.filter(
    (variant) => variant.availableForSale,
  ).length;
  const hasMultipleImages = images.length > 1;
  const primaryCollection = getPrimaryCollection(product);
  const productSummary = summarizeProductDescription(product.description);
  const descriptionMarkup =
    product.descriptionHtml?.trim() || getRichTextFallback(product.description);
  const priceLabel = selectedVariant
    ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
    : formatMoney(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode,
      );
  const isOnSale =
    Boolean(selectedVariant?.compareAtPrice) &&
    Number(selectedVariant.compareAtPrice?.amount) > Number(selectedVariant.price.amount);
  const compareAtPrice =
    isOnSale && selectedVariant.compareAtPrice
      ? formatMoney(
          selectedVariant.compareAtPrice.amount,
          selectedVariant.compareAtPrice.currencyCode,
        )
      : null;
  const salePercent =
    isOnSale && selectedVariant.compareAtPrice
      ? Math.round(
          (1 - Number(selectedVariant.price.amount) / Number(selectedVariant.compareAtPrice.amount)) *
            100,
        )
      : null;
  const displayRating =
    product.reviewSummary?.ratingValue ??
    storeReviewSummary?.ratingValue ??
    aggregateRating.ratingValue;
  const selectedVariantIsAvailable = Boolean(selectedVariant?.availableForSale);
  const availabilityLabel =
    availableVariantCount > 0
      ? `${availableVariantCount} available option${availableVariantCount === 1 ? "" : "s"}${primaryCollection ? ` in ${primaryCollection.title}` : ""}.`
      : "This piece is currently sold out online.";
  const availabilityMessage = selectedVariantIsAvailable ? "In stock, ready to ship" : "Sold out";
  const shippingAssuranceDetail = selectedVariantIsAvailable
    ? "Orders are prepared quickly and packed with care before they leave our shop."
    : "Contact the shop and we can help find a similar ready-to-ship option.";
  const statusAssuranceDetail = selectedVariantIsAvailable
    ? "This selection is available online and ready for checkout."
    : "Choose another available option or book an appointment for sourcing help.";
  const metaCategoryLabel = primaryCollection?.title || product.productType;
  const descriptionHighlights = getProductDescriptionHighlights(product);
  const productReviewCard = getProductReviewCard(
    product,
    primaryCollection?.title ?? null,
    storeReviewSummary,
  );
  const shouldShowDescriptionSection =
    descriptionHighlights.length > 0 || Boolean(descriptionMarkup.trim());
  const shouldShowAppointmentCta =
    Number(product.priceRange.minVariantPrice.amount) >= 250 ||
    /suit|tuxedo|formal|sport|tailor/i.test(
      [product.title, product.productType, primaryCollection?.title].filter(Boolean).join(" "),
    );
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
    setSmartFitMatch(null);
    setSelectedOptions((current) => {
      const nextVariant = findAvailableVariantForOption(product, optionName, optionValue, current);

      if (!nextVariant) {
        return current;
      }

      return buildInitialOptionState(nextVariant);
    });
  }

  useEffect(() => {
    const profile = parseFitProfile(window.localStorage.getItem(FIT_PROFILE_STORAGE_KEY));
    const fitMatches = profile ? getProductFitMatches(product, profile.recommendedSizes) : [];

    const matchingVariant =
      fitMatches.length > 0
        ? (product.variants.find((variant) => {
            const variantSize = getVariantSizeValue(variant);

            return Boolean(
              variant.availableForSale && variantSize && fitMatches.includes(variantSize),
            );
          }) ?? null)
        : null;

    const frameId = window.requestAnimationFrame(() => {
      if (!matchingVariant) {
        setSmartFitMatch(null);
        return;
      }

      setSelectedOptions(buildInitialOptionState(matchingVariant));
      setSmartFitMatch(getVariantSizeValue(matchingVariant));
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
    <div className="space-y-10 lg:space-y-14">
      <div className="grid min-w-0 gap-8 lg:gap-12 xl:grid-cols-[minmax(0,1.04fr)_minmax(24rem,0.96fr)]">
        <section className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-[11px] font-semibold tracking-[0.14em] text-ink uppercase shadow-[0_12px_24px_-22px_rgba(11,15,20,0.35)] transition-colors hover:border-gold hover:text-gold"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[1.35rem] border border-ink/8 bg-white shadow-[0_26px_56px_-42px_rgba(14,23,38,0.4)]">
            <div
              className="relative h-[clamp(18rem,78vw,30rem)] touch-pan-y bg-[#f8f7f4] sm:h-[clamp(24rem,72vw,38rem)] lg:h-[clamp(33rem,56vw,46rem)]"
              onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
              onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
            >
              {activeImage ? (
                <button
                  type="button"
                  onClick={openLightbox}
                  className="block h-full w-full"
                  aria-label="Open product image viewer"
                >
                  <Image
                    src={activeImage.url}
                    alt={activeImage.altText || product.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-contain p-4 sm:p-6 lg:p-8"
                  />
                </button>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-sm text-smoke">
                  Image coming soon
                </div>
              )}
              <div className="pointer-events-none absolute top-4 left-4 rounded-full border border-ink/10 bg-white/88 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur">
                J. Barbaro edit
              </div>
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
                      "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-white transition-all sm:h-24 sm:w-24 lg:h-24 lg:w-24",
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

        <section className="min-w-0 lg:pt-5 xl:pt-8">
          <div className="space-y-5">
            <header className="border-b border-ink/10 pb-6">
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

              <h1 className="mt-3 text-balance font-heading text-[2.05rem] leading-[1.04] text-ink sm:text-[2.65rem] lg:text-[3.15rem]">
                {product.title}
              </h1>

              {productSummary ? (
                <p className="mt-4 max-w-2xl text-[0.98rem] leading-8 text-smoke">
                  {productSummary}
                </p>
              ) : null}

              <Link
                href="/reviews"
                className="mt-5 flex items-center justify-between gap-3 rounded-md border border-ink/10 bg-white px-4 py-3 shadow-[0_18px_38px_-34px_rgba(14,23,38,0.42)] transition-colors hover:border-gold"
                aria-label="Read customer reviews"
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-ink">
                    <ReviewStars rating={displayRating} />
                    <span>{productReviewCard.heading}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-smoke">
                    {productReviewCard.body}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-semibold tracking-[0.14em] text-deep-teal uppercase">
                  {productReviewCard.eyebrow}
                </span>
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-smoke">
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

            <div
              ref={buyBoxRef}
              className="rounded-[1.1rem] border border-ink/10 bg-white p-5 shadow-[0_24px_52px_-42px_rgba(14,23,38,0.42)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <p
                    className={cn(
                      "text-[1.75rem] font-semibold sm:text-[2rem]",
                      compareAtPrice ? "text-[#8f2632]" : "text-ink",
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
                    <span className="rounded-full bg-[#8f2632] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase">
                      Save {salePercent}%
                    </span>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase",
                    selectedVariantIsAvailable
                      ? "border-deep-teal/18 bg-deep-teal/8 text-deep-teal"
                      : "border-[#b45309]/20 bg-[#b45309]/8 text-[#8a3a04]",
                  )}
                >
                  {selectedVariantIsAvailable ? "Ready to ship" : "Sold out"}
                </span>
              </div>

              {smartFitMatch ? (
                <div className="mt-4 rounded-md border border-deep-teal/20 bg-deep-teal/8 px-4 py-3 text-sm leading-6 text-smoke">
                  <p className="font-semibold text-ink">
                    Smart Fit found your saved size: {smartFitMatch}
                  </p>
                  <p className="mt-1">
                    We selected the closest available variant. You can still change the size before
                    adding it to your bag.
                  </p>
                </div>
              ) : null}

              {visibleOptionGroups.length > 0 ? (
                <div className="mt-6 space-y-5">
                  {visibleOptionGroups.map((group) => {
                    const labelId = `product-option-${group.name.toLowerCase().replace(/\s+/g, "-")}`;
                    const selectedValue = selectedOptions[group.name] ?? "";

                    return (
                      <div key={group.name} className="min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p id={labelId} className="text-sm font-medium text-ink/90">
                            Select {group.name}
                          </p>
                          {selectedValue ? (
                            <p className="text-xs font-semibold tracking-[0.12em] text-smoke uppercase">
                              {selectedValue}
                            </p>
                          ) : null}
                        </div>
                        <div
                          role="radiogroup"
                          aria-labelledby={labelId}
                          className="mt-3 flex flex-wrap gap-2"
                        >
                          {group.values.map((value) => {
                            const isSelected = selectedValue === value;

                            return (
                              <button
                                key={value}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => handleOptionChange(group.name, value)}
                                className={cn(
                                  "inline-flex min-h-11 min-w-12 items-center justify-center rounded-md border px-4 py-2 text-center text-sm font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/30",
                                  isSelected
                                    ? "border-ink bg-ink text-white shadow-[0_16px_30px_-26px_rgba(11,15,20,0.7)]"
                                    : "border-ink/12 bg-white text-ink hover:border-gold hover:bg-gold/10",
                                )}
                              >
                                {value}
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
                    className="min-h-[3.25rem] w-full rounded-md border-ink bg-ink text-sm tracking-[0.08em] !text-white hover:border-deep-teal hover:bg-deep-teal"
                    label="Add to Bag"
                  />
                ) : (
                  <p className="text-sm text-smoke">
                    This product does not have an available variant yet.
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-md bg-stone/65 px-4 py-3 text-sm leading-6 text-smoke">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" />
                <p>
                  <span className="font-semibold text-ink">Fast shipping.</span>{" "}
                  {shippingAssuranceDetail}
                </p>
              </div>

              <p className="mt-3 text-xs leading-5 text-smoke">{availabilityLabel}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <AssuranceItem
                icon={<PackageCheck className="h-4 w-4" />}
                title="Expertly packaged"
                detail="Each order is protected and presented with boutique-level care."
              />
              <AssuranceItem
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Authenticity guaranteed"
                detail="Designer merchandise is sourced through trusted brand channels."
              />
              <AssuranceItem
                icon={<CreditCard className="h-4 w-4" />}
                title="Secure payments"
                detail="Checkout runs through encrypted Shopify payment processing."
              />
              <AssuranceItem
                icon={
                  selectedVariantIsAvailable ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )
                }
                title={
                  selectedVariantIsAvailable ? "In stock, ready to ship" : "Availability support"
                }
                detail={statusAssuranceDetail}
                highlight={selectedVariantIsAvailable}
              />
            </div>

            {shouldShowDescriptionSection ? (
              <section className="rounded-[1.1rem] border border-ink/10 bg-white p-5 shadow-[0_22px_48px_-42px_rgba(14,23,38,0.38)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] text-deep-teal uppercase">
                      Editor&apos;s notes
                    </p>
                    <h2 className="mt-2 font-heading text-2xl leading-tight text-ink">
                      Details that make it work
                    </h2>
                  </div>
                  <span className="hidden rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase sm:inline-flex">
                    Curated
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {descriptionHighlights.map((highlight) => (
                    <DescriptionHighlight
                      key={highlight.title}
                      icon={highlight.icon}
                      title={highlight.title}
                      detail={highlight.detail}
                    />
                  ))}
                </div>

                {descriptionMarkup.trim() ? (
                  <div className="mt-6 border-t border-ink/10 pt-5">
                    <p className="text-sm font-semibold tracking-[0.12em] text-ink uppercase">
                      Full description
                    </p>
                    <div
                      className={`${shopifyRichTextClassName} mt-4`}
                      dangerouslySetInnerHTML={{ __html: descriptionMarkup }}
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {shouldShowAppointmentCta ? (
              <div className="rounded-[1.1rem] border border-gold/30 bg-gold/12 px-5 py-5">
                <p className="text-sm font-semibold text-ink">Need help with fit?</p>
                <p className="mt-2 text-sm leading-6 text-smoke">
                  Book an appointment and we&apos;ll help with sizing, tailoring, and
                  complete-the-look options.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/schedule-appointment")}
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md border border-deep-teal bg-deep-teal px-4 py-2 text-[11px] font-semibold tracking-[0.14em] text-white uppercase transition-colors hover:bg-ink"
                >
                  Book Appointment
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {!isBuyBoxInView && !isLightboxOpen && selectedVariant ? (
        <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-ink/10 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-18px_40px_-32px_rgba(11,15,20,0.4)] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-smoke">{product.title}</p>
              <div className="flex items-baseline gap-2">
                <p className={cn("text-base font-bold", compareAtPrice ? "text-[#8f2632]" : "text-ink")}>{priceLabel}</p>
                {compareAtPrice ? (
                  <p className="text-xs font-medium text-smoke line-through">{compareAtPrice}</p>
                ) : null}
              </div>
            </div>
            <AddToCartButton
              merchandiseId={selectedVariant.id}
              availableForSale={selectedVariant.availableForSale}
              className="min-h-11 shrink-0 rounded-md border-ink bg-ink px-5 text-xs !text-white hover:border-deep-teal hover:bg-deep-teal"
              label="Add to Bag"
              ariaLabel={`Add ${product.title} to bag`}
            />
          </div>
        </div>
      ) : null}

      {isLightboxOpen && activeImage ? (
        <div className="fixed inset-0 z-[180] bg-ink/92 text-ivory" onClick={closeLightbox}>
          <div className="flex h-full flex-col">
            <div
              className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6"
              onClick={(event) => event.stopPropagation()}
            >
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
