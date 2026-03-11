import Image from "next/image";
import Link from "next/link";

import type { ShopifyProduct } from "@/lib/shopify/types";
import { cn, formatMoney } from "@/lib/utils";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

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

export function ShopProductCard({ product, columns = 2 }: ShopProductCardProps) {
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
  const imageSizes = isCompact
    ? "(max-width: 768px) 50vw, (max-width: 1280px) 50vw, 33vw"
    : "(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 40vw";

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden border-ink/8 bg-[#fcfbf7] transition-all duration-500 hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_32px_75px_-42px_rgba(14,23,38,0.45)]",
        isCompact ? "rounded-[1.6rem]" : "rounded-[2rem]",
      )}
    >
      <div className="relative overflow-hidden border-b border-ink/6 bg-[linear-gradient(180deg,#f7f3eb_0%,#efe9df_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] flex items-start justify-between gap-3 p-4">
          <span className="rounded-full border border-ink/10 bg-ivory/90 px-3 py-1 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase backdrop-blur">
            {product.vendor || "Shop"}
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase backdrop-blur",
              primaryVariant?.availableForSale
                ? "border border-deep-teal/15 bg-deep-teal/90 text-ivory"
                : "border border-gold/20 bg-gold/90 text-ink",
            )}
          >
            {primaryVariant?.availableForSale ? "In Stock" : "Unavailable"}
          </span>
        </div>

        <Link href={`/shop/${product.handle}`} className="block">
          <div className={cn("relative aspect-[4/5]", isCompact ? "px-4 pb-4 pt-6 sm:px-5" : "px-6 pb-6 pt-8 sm:px-8")}>
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ink/[0.06] to-transparent" />
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
          </div>
        </Link>
      </div>

      <CardContent className={cn("flex flex-1 flex-col", isCompact ? "p-4 sm:p-5" : "p-5 sm:p-7")}>
        {primaryCollection ? (
          <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">{primaryCollection.title}</p>
        ) : product.productType ? (
          <p className="text-[11px] font-semibold tracking-[0.16em] text-smoke uppercase">{product.productType}</p>
        ) : null}

        {isCompact ? (
          <>
            <h2 className="mt-2 line-clamp-2 text-[0.98rem] leading-6 font-semibold text-ink sm:text-[1.02rem]">
              <Link href={`/shop/${product.handle}`} className="transition-colors hover:text-deep-teal">
                {product.title}
              </Link>
            </h2>

            <p className="mt-3 text-lg font-bold text-ink">{priceLabel}</p>

            <div className="mt-3 space-y-2 text-[11px] text-smoke">
              {sizeOptions.length > 0 ? <p className="line-clamp-1">Sizes: {sizeOptions.join(", ")}</p> : null}
              {colorOptions.length > 0 ? <p className="line-clamp-1">Colors: {colorOptions.join(", ")}</p> : null}
            </div>

            <div className="mt-auto flex items-end justify-between gap-3 pt-4">
              <Link
                href={`/shop/${product.handle}`}
                className="text-[11px] font-semibold tracking-[0.14em] text-smoke uppercase transition-colors duration-200 hover:text-deep-teal"
              >
                View Product
              </Link>
              {primaryVariant ? (
                <AddToCartButton
                  merchandiseId={primaryVariant.id}
                  availableForSale={primaryVariant.availableForSale}
                  className="h-11 w-11 min-h-11 shrink-0 rounded-full px-0"
                  label="Add to Bag"
                  ariaLabel={`Add ${product.title} to bag`}
                  iconOnly
                />
              ) : (
                <p className="text-right text-xs text-smoke">Unavailable</p>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-3 font-heading text-[1.95rem] leading-[1.08] text-ink sm:text-[2.15rem]">
              <Link href={`/shop/${product.handle}`} className="transition-colors hover:text-deep-teal">
                {product.title}
              </Link>
            </h2>

            <p className="mt-3 text-sm font-semibold tracking-[0.12em] text-deep-teal uppercase">{priceLabel}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {sizeOptions.map((size) => (
                <Badge key={size} variant="neutral">
                  Size {size}
                </Badge>
              ))}
              {colorOptions.map((color) => (
                <Badge key={color} variant="neutral">
                  {color}
                </Badge>
              ))}
            </div>

            <div className="mt-auto pt-7">
              {primaryVariant ? (
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Link
                    href={`/shop/${product.handle}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/20 px-5 py-2.5 text-xs font-semibold tracking-[0.16em] text-ink uppercase transition-all duration-300 hover:border-gold hover:text-gold"
                  >
                    View Product
                  </Link>
                  <AddToCartButton
                    merchandiseId={primaryVariant.id}
                    availableForSale={primaryVariant.availableForSale}
                    className="h-11 w-11 min-h-11 rounded-full px-0"
                    label="Add to Bag"
                    ariaLabel={`Add ${product.title} to bag`}
                    iconOnly
                  />
                </div>
              ) : (
                <p className="text-sm text-smoke">This product has no purchasable variants yet.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
