import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { getProductFitMatches } from "@/lib/fit-profile";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopifyProduct;
  columns?: 1 | 2;
  fitSizes?: string[];
};

function getSecondaryImage(product: ShopifyProduct) {
  return product.images.find((image) => image.url !== product.featuredImage?.url) ?? product.images[1] ?? null;
}

function getOptionValues(product: ShopifyProduct, optionName: string) {
  return Array.from(
    new Set(
      product.variants.flatMap((variant) =>
        variant.selectedOptions
          .filter((option) => option.name.toLowerCase().includes(optionName))
          .map((option) => option.value),
      ),
    ),
  );
}

function ProductImageStage({
  product,
  secondaryImage,
  imageSizes,
  className,
  showVendorTag = true,
}: {
  product: ShopifyProduct;
  secondaryImage: ShopifyProduct["featuredImage"];
  imageSizes: string;
  className: string;
  showVendorTag?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-white", className)}>
      {showVendorTag ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex items-start p-4">
          <span className="rounded-full border border-ink/10 bg-white/88 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase shadow-[0_12px_20px_-16px_rgba(14,23,38,0.45)] backdrop-blur">
            {product.vendor || "Shop"}
          </span>
        </div>
      ) : null}

      <Link href={`/shop/${product.handle}`} className="block h-full">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/[0.06] to-transparent" />
        <div className="relative h-full w-full">
          {product.featuredImage ? (
            <>
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                fill
                sizes={imageSizes}
                className={cn(
                  "scale-[1.12] object-contain object-center transition-all duration-700",
                  secondaryImage
                    ? "opacity-100 group-hover:scale-[1.15] group-hover:opacity-0 group-focus-within:scale-[1.15] group-focus-within:opacity-0"
                    : "group-hover:scale-[1.15] group-focus-within:scale-[1.15]",
                )}
              />
              {secondaryImage ? (
                <Image
                  src={secondaryImage.url}
                  alt={secondaryImage.altText || `${product.title} alternate view`}
                  fill
                  sizes={imageSizes}
                  className="scale-[1.12] object-contain object-center opacity-0 transition-all duration-700 group-hover:scale-[1.15] group-hover:opacity-100 group-focus-within:scale-[1.15] group-focus-within:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-smoke">Image coming soon</div>
          )}
        </div>
      </Link>
    </div>
  );
}

export function ShopProductCard({ product, columns = 1, fitSizes = [] }: ShopProductCardProps) {
  const availableVariants = product.variants.filter((variant) => variant.availableForSale);
  const primaryVariant = availableVariants[0] ?? product.variants[0];
  const canQuickAdd = availableVariants.length === 1;
  const hasPriceRange = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const priceLabel = hasPriceRange
    ? `${formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)} - ${formatMoney(product.priceRange.maxVariantPrice.amount, product.priceRange.maxVariantPrice.currencyCode)}`
    : formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);
  const compareAtPrice =
    primaryVariant?.compareAtPrice && Number(primaryVariant.compareAtPrice.amount) > Number(primaryVariant.price.amount)
      ? formatMoney(primaryVariant.compareAtPrice.amount, primaryVariant.compareAtPrice.currencyCode)
      : null;
  const primaryCollection = product.collections[0];
  const secondaryImage = getSecondaryImage(product);
  const sizeOptions = getOptionValues(product, "size").slice(0, 4);
  const colorOptions = getOptionValues(product, "color").slice(0, 3);
  const detailChips = sizeOptions.length > 0 ? sizeOptions : colorOptions;
  const detailLabel = sizeOptions.length > 0 ? "Sizes" : colorOptions.length > 0 ? "Colors" : null;
  const isCompact = columns === 2;
  const fitMatches = getProductFitMatches(product, fitSizes);
  const fitMatchLabel = fitMatches.length > 0 ? fitMatches.slice(0, 2).join(", ") : null;

  if (isCompact) {
    return (
      <Card className="group flex h-full flex-col overflow-hidden rounded-lg border-ink/10 bg-ivory transition-colors duration-200 hover:border-ink/25">
        <div className="relative">
          {fitMatchLabel ? (
            <div className="absolute right-3 bottom-3 z-[3] rounded-md bg-deep-teal px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white uppercase shadow-sm">
              Your size {fitMatchLabel}
            </div>
          ) : null}
          <ProductImageStage
            product={product}
            secondaryImage={secondaryImage}
            imageSizes="(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 33vw"
            className="aspect-[4/3] border-b border-ink/10 bg-white px-4 py-4"
          />
        </div>

        <CardContent className="flex flex-1 flex-col p-4">
          {primaryCollection ? (
            <p className="text-[10px] font-bold tracking-[0.16em] text-smoke uppercase">{primaryCollection.title}</p>
          ) : product.productType ? (
            <p className="text-[10px] font-bold tracking-[0.16em] text-smoke uppercase">{product.productType}</p>
          ) : null}

          <h2 className="mt-2 line-clamp-2 text-[0.95rem] leading-5 font-semibold tracking-[-0.01em] text-ink sm:text-[1rem] sm:leading-6">
            <Link href={`/shop/${product.handle}`} className="transition-colors hover:text-deep-teal">
              {product.title}
            </Link>
          </h2>

          {detailLabel && detailChips.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-medium text-smoke">{detailLabel}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detailChips.map((value) => (
                  <span
                    key={`${product.id}-${detailLabel}-${value}`}
                    className="rounded-full border border-ink/8 bg-white/80 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-ink uppercase"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-auto pt-5">
            <div className="border-t border-ink/8 pt-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-[1.08rem] font-bold tracking-[-0.02em] text-ink sm:text-[1.18rem]">{priceLabel}</p>
                {compareAtPrice ? <p className="text-sm font-medium text-smoke line-through">{compareAtPrice}</p> : null}
              </div>

              {primaryVariant && canQuickAdd ? (
                <AddToCartButton
                  merchandiseId={primaryVariant.id}
                  availableForSale={primaryVariant.availableForSale}
                  className="mt-4 w-full rounded-md border-deep-teal bg-deep-teal text-white hover:border-[#136868] hover:bg-[#136868]"
                  label="Add to Bag"
                  ariaLabel={`Add ${product.title} to bag`}
                />
              ) : primaryVariant ? (
                <ButtonLink
                  href={`/shop/${product.handle}`}
                  variant="secondary"
                  className="mt-4 w-full rounded-md border-ink/20 bg-ivory text-ink hover:border-ink/35 hover:bg-stone/55"
                >
                  Choose Options
                </ButtonLink>
              ) : (
                <p className="mt-4 rounded-full border border-ink/10 bg-white/80 px-4 py-3 text-center text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase">
                  Unavailable
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden rounded-[1.15rem] border border-ink/8 bg-white transition-all duration-200 hover:border-gold/35 hover:shadow-[0_18px_32px_-28px_rgba(14,23,38,0.24)]">
      <div className="grid grid-cols-[104px_minmax(0,1fr)] sm:grid-cols-[136px_minmax(0,1fr)]">
        <ProductImageStage
          product={product}
          secondaryImage={secondaryImage}
          imageSizes="(max-width: 768px) 42vw, (max-width: 1280px) 28vw, 320px"
          className="aspect-[4/5] border-r border-ink/6 px-2.5 pb-2.5 pt-3 sm:px-3 sm:pb-3 sm:pt-4"
          showVendorTag={false}
        />

        <CardContent className="flex min-h-full flex-col p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2.5">
            <Link href={`/shop/${product.handle}`} className="min-w-0 flex-1 rounded-[0.8rem] outline-none transition-colors hover:text-deep-teal focus-visible:ring-2 focus-visible:ring-gold/40">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-semibold tracking-[0.11em] text-smoke uppercase">
                {product.vendor ? <span>{product.vendor}</span> : null}
                {primaryCollection ? <span>{primaryCollection.title}</span> : product.productType ? <span>{product.productType}</span> : null}
              </div>

              <h2 className="mt-1.5 text-[0.96rem] leading-5 font-semibold text-ink sm:text-[1.02rem] sm:leading-6">
                {product.title}
              </h2>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <p className="text-[1.02rem] font-bold text-ink sm:text-[1.08rem]">{priceLabel}</p>
                {compareAtPrice ? <p className="text-xs font-medium text-smoke line-through">{compareAtPrice}</p> : null}
              </div>

              <div className="mt-1.5 space-y-1 text-[11px] leading-4.5 text-smoke sm:text-[12px] sm:leading-5">
                {fitMatchLabel ? <p className="font-semibold text-deep-teal">Your saved size is available: {fitMatchLabel}</p> : null}
                {sizeOptions.length > 0 ? <p>Sizes: {sizeOptions.join(", ")}</p> : null}
                {colorOptions.length > 0 ? <p>Colors: {colorOptions.join(", ")}</p> : null}
                {primaryCollection && product.productType ? <p>Category: {product.productType}</p> : null}
              </div>
            </Link>

            {primaryVariant && canQuickAdd ? (
              <AddToCartButton
                merchandiseId={primaryVariant.id}
                availableForSale={primaryVariant.availableForSale}
                className="mt-0.5 h-10 w-10 min-h-10 shrink-0 rounded-full px-0"
                label="Add to Bag"
                ariaLabel={`Add ${product.title} to bag`}
                iconOnly
              />
            ) : primaryVariant ? (
              <Link
                href={`/shop/${product.handle}`}
                className="mt-0.5 inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-ink/20 bg-ivory px-3 text-[10px] font-semibold tracking-[0.1em] text-ink uppercase transition-colors hover:border-ink/35 hover:bg-stone/55"
                aria-label={`Choose options for ${product.title}`}
              >
                Options
              </Link>
            ) : (
              <p className="text-right text-xs text-smoke">Unavailable</p>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
