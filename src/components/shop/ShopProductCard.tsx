import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Card, CardContent } from "@/components/ui/Card";
import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

type ShopProductCardProps = {
  product: ShopifyProduct;
  columns?: 1 | 2;
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
    <div className={cn("relative overflow-hidden bg-[linear-gradient(180deg,#f7f3eb_0%,#efe9df_100%)]", className)}>
      {showVendorTag ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex items-start p-4">
          <span className="rounded-full border border-ink/10 bg-ivory/90 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur">
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
                  "object-contain object-center transition-all duration-700",
                  secondaryImage
                    ? "opacity-100 group-hover:scale-[1.01] group-hover:opacity-0 group-focus-within:scale-[1.01] group-focus-within:opacity-0"
                    : "group-hover:scale-[1.03] group-focus-within:scale-[1.03]",
                )}
              />
              {secondaryImage ? (
                <Image
                  src={secondaryImage.url}
                  alt={secondaryImage.altText || `${product.title} alternate view`}
                  fill
                  sizes={imageSizes}
                  className="object-contain object-center opacity-0 transition-all duration-700 group-hover:scale-[1.01] group-hover:opacity-100 group-focus-within:scale-[1.01] group-focus-within:opacity-100"
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

export function ShopProductCard({ product, columns = 1 }: ShopProductCardProps) {
  const primaryVariant = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const hasPriceRange = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const priceLabel = hasPriceRange
    ? `${formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)} - ${formatMoney(product.priceRange.maxVariantPrice.amount, product.priceRange.maxVariantPrice.currencyCode)}`
    : formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);
  const primaryCollection = product.collections[0];
  const secondaryImage = getSecondaryImage(product);
  const sizeOptions = getOptionValues(product, "size").slice(0, 4);
  const colorOptions = getOptionValues(product, "color").slice(0, 3);
  const isCompact = columns === 2;

  if (isCompact) {
    return (
      <Card className="group flex h-full flex-col overflow-hidden rounded-[1.25rem] border-ink/8 bg-white transition-all duration-300 hover:border-gold/45 hover:shadow-[0_24px_54px_-36px_rgba(14,23,38,0.3)]">
        <ProductImageStage
          product={product}
          secondaryImage={secondaryImage}
          imageSizes="(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 33vw"
          className="aspect-[4/5] border-b border-ink/6 px-3 pb-3 pt-4 sm:px-4 sm:pb-4 sm:pt-5"
        />

        <CardContent className="flex flex-1 flex-col p-3.5 sm:p-4">
          {primaryCollection ? (
            <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">{primaryCollection.title}</p>
          ) : product.productType ? (
            <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">{product.productType}</p>
          ) : null}

          <h2 className="mt-1.5 line-clamp-2 text-[0.92rem] leading-5 font-semibold text-ink sm:text-[0.98rem]">
            <Link href={`/shop/${product.handle}`} className="transition-colors hover:text-deep-teal">
              {product.title}
            </Link>
          </h2>

          <div className="mt-2.5 flex items-end justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[1.02rem] font-bold text-ink sm:text-lg">{priceLabel}</p>
              <div className="mt-1.5 space-y-1 text-[11px] text-smoke">
                {sizeOptions.length > 0 ? <p className="line-clamp-1">Sizes: {sizeOptions.join(", ")}</p> : null}
                {colorOptions.length > 0 ? <p className="line-clamp-1">Colors: {colorOptions.join(", ")}</p> : null}
              </div>
            </div>
            {primaryVariant ? (
              <AddToCartButton
                merchandiseId={primaryVariant.id}
                availableForSale={primaryVariant.availableForSale}
                className="h-10 w-10 min-h-10 shrink-0 rounded-full px-0"
                label="Add to Bag"
                ariaLabel={`Add ${product.title} to bag`}
                iconOnly
              />
            ) : (
              <p className="text-right text-xs text-smoke">Unavailable</p>
            )}
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

              <p className="mt-2 text-[1.02rem] font-bold text-ink sm:text-[1.08rem]">{priceLabel}</p>

              <div className="mt-1.5 space-y-1 text-[11px] leading-4.5 text-smoke sm:text-[12px] sm:leading-5">
                {sizeOptions.length > 0 ? <p>Sizes: {sizeOptions.join(", ")}</p> : null}
                {colorOptions.length > 0 ? <p>Colors: {colorOptions.join(", ")}</p> : null}
                {primaryCollection && product.productType ? <p>Category: {product.productType}</p> : null}
              </div>
            </Link>

            {primaryVariant ? (
              <AddToCartButton
                merchandiseId={primaryVariant.id}
                availableForSale={primaryVariant.availableForSale}
                className="mt-0.5 h-10 w-10 min-h-10 shrink-0 rounded-full px-0"
                label="Add to Bag"
                ariaLabel={`Add ${product.title} to bag`}
                iconOnly
              />
            ) : (
              <p className="text-right text-xs text-smoke">Unavailable</p>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
