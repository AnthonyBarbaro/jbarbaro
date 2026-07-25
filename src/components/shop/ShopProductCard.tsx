import Image from "next/image";
import Link from "next/link";

import { Card } from "@/components/ui/Card";
import {
  getProductFitMatchesForProfile,
  type FitProfile,
} from "@/lib/fit-profile";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopifyProduct;
  fitProfile?: FitProfile | null;
  imageSizes?: string;
};

function getSecondaryImage(product: ShopifyProduct) {
  return product.images.find((image) => image.url !== product.featuredImage?.url) ?? product.images[1] ?? null;
}

export function ShopProductCard({
  product,
  fitProfile = null,
  imageSizes = "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw",
}: ShopProductCardProps) {
  const availableVariants = product.variants.filter((variant) => variant.availableForSale);
  const primaryVariant = availableVariants[0] ?? product.variants[0];
  const hasPriceRange = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const priceLabel = hasPriceRange
    ? `${formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)} - ${formatMoney(product.priceRange.maxVariantPrice.amount, product.priceRange.maxVariantPrice.currencyCode)}`
    : formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);
  const isOnSale =
    Boolean(primaryVariant?.compareAtPrice) &&
    Number(primaryVariant.compareAtPrice?.amount) > Number(primaryVariant.price.amount);
  const compareAtPrice =
    isOnSale && primaryVariant.compareAtPrice
      ? formatMoney(primaryVariant.compareAtPrice.amount, primaryVariant.compareAtPrice.currencyCode)
      : null;
  const salePercent =
    isOnSale && primaryVariant.compareAtPrice
      ? Math.round(
          (1 - Number(primaryVariant.price.amount) / Number(primaryVariant.compareAtPrice.amount)) * 100,
        )
      : null;
  const isSoldOut = availableVariants.length === 0;
  const secondaryImage = getSecondaryImage(product);
  const fitMatches = fitProfile
    ? getProductFitMatchesForProfile(product, fitProfile)
    : [];
  const fitMatchLabel = fitMatches.length > 0 ? fitMatches.slice(0, 2).join(", ") : null;
  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-lg border-ink/10 bg-white transition-colors duration-200 hover:border-ink/25">
      <Link href={`/shop/${product.handle}`} className="flex h-full flex-col">
        <div className="relative overflow-hidden border-b border-ink/8 bg-white">
          {isSoldOut ? (
            <span className="absolute top-3 right-3 z-[2] rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Sold Out
            </span>
          ) : salePercent ? (
            <span className="absolute top-3 right-3 z-[2] rounded-full bg-[#8f2632] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Save {salePercent}%
            </span>
          ) : null}
          {fitMatchLabel ? (
            <span className="absolute right-3 bottom-3 z-[2] rounded-md bg-deep-teal px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Your size {fitMatchLabel}
            </span>
          ) : null}

          <div className="relative aspect-[4/3] px-3 py-3 sm:px-4 sm:py-4">
            {product.featuredImage ? (
              <>
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  fill
                  sizes={imageSizes}
                  className={cn(
                    "object-contain object-center p-3 transition-all duration-700",
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
                    className="object-contain object-center p-3 opacity-0 transition-all duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
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
          {product.vendor ? (
            <p className="text-[10px] font-semibold tracking-[0.16em] text-smoke uppercase">{product.vendor}</p>
          ) : null}

          <h2 className="mt-1.5 line-clamp-2 text-[0.95rem] leading-5 font-semibold tracking-[-0.01em] text-ink transition-colors group-hover:text-deep-teal sm:text-[1rem] sm:leading-6">
            {product.title}
          </h2>

          <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-3">
            <p className={cn("text-[1.05rem] font-bold tracking-[-0.02em]", compareAtPrice ? "text-[#8f2632]" : "text-ink")}>
              {priceLabel}
            </p>
            {compareAtPrice ? <p className="text-sm font-medium text-smoke line-through">{compareAtPrice}</p> : null}
          </div>
        </div>
      </Link>
    </Card>
  );
}
