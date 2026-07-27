import Image from "next/image";
import Link from "next/link";

import { QuickAddProduct } from "@/components/shop/QuickAddProduct";
import { Card } from "@/components/ui/Card";
import {
  getProductFitMatchesForProfile,
  getProductFitRecommendation,
  getProductSuitSizeSystem,
  type FitProfile,
} from "@/lib/fit-profile";
import { getProductSales } from "@/lib/shopify/product-merchandising";
import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopifyProduct;
  fitProfile?: FitProfile | null;
  imageSizes?: string;
  saleOnly?: boolean;
};

function getSecondaryImage(product: ShopifyProduct) {
  return (
    product.images.find((image) => image.url !== product.featuredImage?.url) ??
    product.images[1] ??
    null
  );
}

function getVariantPriceRange(
  variants: ShopifyProductVariant[],
  fallback: ShopifyProduct["priceRange"],
) {
  const pricedVariants = variants
    .filter((variant) => Number.isFinite(Number(variant.price.amount)))
    .sort((left, right) => Number(left.price.amount) - Number(right.price.amount));
  const minimum = pricedVariants[0];
  const maximum = pricedVariants.at(-1);

  return minimum && maximum
    ? {
        minVariantPrice: minimum.price,
        maxVariantPrice: maximum.price,
      }
    : fallback;
}

export function ShopProductCard({
  product,
  fitProfile = null,
  imageSizes = "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw",
  saleOnly = false,
}: ShopProductCardProps) {
  const availableVariants = product.variants.filter((variant) => variant.availableForSale);
  const productSales = getProductSales(product);
  const productSale = productSales[0] ?? null;
  const quickAddVariants = saleOnly ? productSales.map((sale) => sale.variant) : product.variants;
  const quickAddPriceRange = saleOnly
    ? getVariantPriceRange(quickAddVariants, product.priceRange)
    : product.priceRange;
  const fitRecommendation = fitProfile ? getProductFitRecommendation(product, fitProfile) : null;
  const quickAddPreferredVariantId =
    fitRecommendation?.variantId &&
    quickAddVariants.some((variant) => variant.id === fitRecommendation.variantId)
      ? fitRecommendation.variantId
      : null;
  const jacketSizeSystem = getProductSuitSizeSystem(product);
  const hasPriceRange =
    product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const priceLabel =
    saleOnly && productSale
      ? formatMoney(productSale.variant.price.amount, productSale.variant.price.currencyCode)
      : hasPriceRange
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
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-lg border-ink/10 bg-white shadow-none transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-deep-teal/30 hover:shadow-[0_18px_40px_-32px_rgba(11,15,20,0.32)]">
      <Link
        href={`/shop/${product.handle}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-inset"
      >
        <div className="relative overflow-hidden border-b border-ink/8 bg-product-canvas">
          {isSoldOut ? (
            <span className="absolute top-3 right-3 z-[2] rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Sold Out
            </span>
          ) : salePercent !== null ? (
            <span className="absolute top-3 right-3 z-[2] rounded-full bg-sale px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Save {salePercent}%
            </span>
          ) : null}
          {fitMatchLabel ? (
            <span className="absolute right-3 bottom-3 z-[2] rounded-md bg-deep-teal px-2.5 py-1 text-xs font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Your size {fitMatchLabel}
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
                    "object-contain object-center p-4 transition-all duration-500 sm:p-5",
                    secondaryImage
                      ? "opacity-100 group-hover:scale-[1.03] group-hover:opacity-0"
                      : "group-hover:scale-[1.03]",
                  )}
                />
                {secondaryImage ? (
                  <Image
                    src={secondaryImage.url}
                    alt={secondaryImage.altText || `${product.title} alternate view`}
                    fill
                    sizes={imageSizes}
                    className="object-contain object-center p-4 opacity-0 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100 sm:p-5"
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

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          {productMeta ? (
            <p className="truncate text-xs font-semibold tracking-[0.14em] text-smoke uppercase">
              {productMeta}
            </p>
          ) : null}

          <h2 className="mt-1.5 line-clamp-2 text-base leading-5 font-semibold tracking-[-0.01em] text-ink transition-colors group-hover:text-deep-teal sm:leading-6">
            {product.title}
          </h2>

          <div className="mt-auto flex flex-wrap items-baseline gap-2 pr-14 pt-3 sm:pr-16">
            <p
              className={cn(
                "text-lg font-bold tracking-[-0.02em]",
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
            priceRange: quickAddPriceRange,
            variants: quickAddVariants,
          }}
          preferredVariantId={quickAddPreferredVariantId}
          jacketSizeSystem={jacketSizeSystem}
          fitVariants={saleOnly ? product.variants : undefined}
        />
      </div>
    </Card>
  );
}
