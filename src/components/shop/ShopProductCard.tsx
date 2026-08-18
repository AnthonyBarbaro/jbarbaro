import Image from "next/image";
import Link from "next/link";

import { QuickAddProduct } from "@/components/shop/QuickAddProduct";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { Card } from "@/components/ui/Card";
import {
  getProductFitMatchesForProfile,
  getProductFitRecommendation,
  getProductSuitSizeSystem,
  type FitProfile,
} from "@/lib/fit-profile";
import { getProductSales } from "@/lib/shopify/product-merchandising";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopifyProduct;
  fitProfile?: FitProfile | null;
  imagePresentation?: "default" | "filled";
  imageSizes?: string;
  preferredVariantId?: string | null;
  sizeAvailabilityLabel?: string | null;
  headingLevel?: "h2" | "h3" | "h4";
};

function getSecondaryImage(product: ShopifyProduct) {
  return (
    product.images.find((image) => image.url !== product.featuredImage?.url) ??
    product.images[1] ??
    null
  );
}

export function ShopProductCard({
  product,
  fitProfile = null,
  imagePresentation = "default",
  imageSizes = "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw",
  preferredVariantId = null,
  sizeAvailabilityLabel = null,
  headingLevel = "h2",
}: ShopProductCardProps) {
  const ProductHeading = headingLevel;
  const availableVariants = product.variants.filter((variant) => variant.availableForSale);
  const productSales = getProductSales(product);
  const productSale = productSales[0] ?? null;
  const fitRecommendation = fitProfile ? getProductFitRecommendation(product, fitProfile) : null;
  const quickAddPreferredVariantId = [preferredVariantId, fitRecommendation?.variantId].find(
    (variantId) =>
      Boolean(
        variantId &&
        product.variants.some((variant) => variant.availableForSale && variant.id === variantId),
      ),
  );
  const jacketSizeSystem = getProductSuitSizeSystem(product);
  const hasPriceRange =
    product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const priceLabel = hasPriceRange
    ? `${formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)} - ${formatMoney(product.priceRange.maxVariantPrice.amount, product.priceRange.maxVariantPrice.currencyCode)}`
    : formatMoney(
        product.priceRange.minVariantPrice.amount,
        product.priceRange.minVariantPrice.currencyCode,
      );
  const compareAtPrice = productSale?.variant.compareAtPrice
    ? formatMoney(
        productSale.variant.compareAtPrice.amount,
        productSale.variant.compareAtPrice.currencyCode,
      )
    : null;
  const salePercent = productSale?.discountPercent ?? null;
  const isSoldOut = availableVariants.length === 0;
  const secondaryImage = getSecondaryImage(product);
  const fitMatches = fitProfile ? getProductFitMatchesForProfile(product, fitProfile) : [];
  const fitMatchLabel = fitMatches.length > 0 ? fitMatches.slice(0, 2).join(", ") : null;
  const productMeta = [product.vendor, product.productType]
    .filter(
      (value, index, values): value is string =>
        Boolean(value) &&
        values.findIndex((candidate) => candidate?.toLowerCase() === value?.toLowerCase()) ===
          index,
    )
    .join(" · ");

  return (
    <Card className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border-ink/10 bg-white shadow-none transition-[border-color,transform] duration-200 ease-out hover:border-ink/25 focus-within:border-deep-teal/40 motion-safe:hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none">
      <WishlistButton
        item={{
          id: product.id,
          handle: product.handle,
          title: product.title,
          vendor: product.vendor,
          productType: product.productType,
          priceLabel,
          image: product.featuredImage
            ? {
                url: product.featuredImage.url,
                altText: product.featuredImage.altText,
              }
            : null,
        }}
        className="absolute top-3 left-3 z-[3]"
      />

      <Link
        href={`/shop/${product.handle}`}
        className="flex min-w-0 flex-1 flex-col focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-inset"
      >
        <div
          className={cn(
            "relative overflow-hidden border-b border-ink/8",
            imagePresentation === "filled" ? "bg-white" : "bg-product-canvas",
          )}
        >
          {isSoldOut ? (
            <span className="absolute top-3 right-3 z-[2] rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Sold Out
            </span>
          ) : salePercent !== null ? (
            <span className="absolute top-3 right-3 z-[2] rounded-full bg-sale px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Save {salePercent}%
            </span>
          ) : null}
          {sizeAvailabilityLabel || fitMatchLabel ? (
            <span className="absolute right-3 bottom-3 z-[2] rounded-md bg-deep-teal px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              {sizeAvailabilityLabel ?? `Your size ${fitMatchLabel}`}
            </span>
          ) : null}

          <div className="relative aspect-[4/5]">
            {product.featuredImage ? (
              <>
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  fill
                  sizes={imageSizes}
                  className={cn(
                    "object-center transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
                    imagePresentation === "filled" ? "object-contain" : "object-contain p-3 sm:p-4",
                    secondaryImage
                      ? "opacity-100 group-hover:opacity-0 motion-safe:group-hover:scale-[1.025]"
                      : "motion-safe:group-hover:scale-[1.025]",
                  )}
                />
                {secondaryImage ? (
                  <Image
                    src={secondaryImage.url}
                    alt=""
                    fill
                    sizes={imageSizes}
                    className={cn(
                      "object-center opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:opacity-100 motion-safe:group-hover:scale-[1.025] motion-reduce:transition-none",
                      imagePresentation === "filled"
                        ? "object-contain"
                        : "object-contain p-3 sm:p-4",
                    )}
                  />
                ) : null}
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-smoke">
                Image coming soon
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
          {productMeta ? (
            <p className="truncate text-xs font-semibold tracking-[0.14em] text-smoke uppercase">
              {productMeta}
            </p>
          ) : null}

          <ProductHeading className="mt-1.5 min-h-10 line-clamp-2 text-sm leading-5 font-semibold tracking-[-0.01em] text-ink transition-colors duration-200 group-hover:text-deep-teal sm:min-h-12 sm:text-base sm:leading-6 motion-reduce:transition-none">
            {product.title}
          </ProductHeading>

          <div className="mt-auto flex flex-wrap items-baseline gap-2 pr-14 pt-3 sm:pr-16">
            <p
              className={cn(
                "text-base font-bold tracking-[-0.02em] sm:text-lg",
                compareAtPrice ? "text-sale" : "text-ink",
              )}
            >
              {priceLabel}
            </p>
            {compareAtPrice ? (
              <p className="text-sm font-medium text-smoke line-through">{compareAtPrice}</p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="absolute right-3 bottom-3 z-[3] sm:right-4 sm:bottom-4">
        <QuickAddProduct
          product={{
            title: product.title,
            vendor: product.vendor,
            productType: product.productType,
            tags: product.tags,
            collections: product.collections,
            featuredImage: product.featuredImage,
            priceRange: product.priceRange,
            variants: product.variants,
          }}
          preferredVariantId={quickAddPreferredVariantId}
          jacketSizeSystem={jacketSizeSystem}
        />
      </div>
    </Card>
  );
}
