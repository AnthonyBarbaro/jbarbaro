"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, ShieldCheck, Truck } from "lucide-react";

import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const initialVariant = product.variants.find((variant) => variant.availableForSale) ?? product.variants[0];
  const images = getProductImages(product);
  const optionGroups = getOptionMap(product);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(buildInitialOptionState(initialVariant));

  const selectedVariant = findMatchingVariant(product, selectedOptions) ?? initialVariant;
  const activeImage = images[selectedImageIndex] ?? images[0] ?? null;
  const primaryCollection = product.collections[0];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div className="space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-ink/10 bg-stone">
          {activeImage ? (
            <Image
              src={activeImage.url}
              alt={activeImage.altText || product.title}
              fill
              sizes="(max-width: 1280px) 100vw, 55vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-smoke">Image coming soon</div>
          )}
        </div>

        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-3 lg:grid-cols-5">
            {images.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden rounded-[1.25rem] border bg-stone transition-all",
                  index === selectedImageIndex ? "border-deep-teal shadow-lg" : "border-ink/10 hover:border-gold",
                )}
                aria-label={`View image ${index + 1}`}
              >
                <Image src={image.url} alt={image.altText || product.title} fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-5 xl:sticky xl:top-28 xl:h-fit">
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              {product.vendor ? <Badge variant="neutral">{product.vendor}</Badge> : null}
              {product.productType ? <Badge variant="neutral">{product.productType}</Badge> : null}
              {selectedVariant?.availableForSale ? <Badge variant="teal">Ready to Order</Badge> : <Badge variant="gold">Currently Unavailable</Badge>}
            </div>

            {primaryCollection ? (
              <p className="mt-4 text-[11px] font-semibold tracking-[0.18em] text-smoke uppercase">{primaryCollection.title}</p>
            ) : null}

            <h1 className="mt-4 font-heading text-4xl text-ink sm:text-5xl">{product.title}</h1>

            <p className="mt-4 text-sm font-semibold tracking-[0.08em] text-deep-teal uppercase">
              {selectedVariant
                ? formatMoney(selectedVariant.price.amount, selectedVariant.price.currencyCode)
                : formatMoney(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
            </p>

            {optionGroups.length > 0 ? (
              <div className="mt-6 space-y-5">
                {optionGroups.map((group) => (
                  <div key={group.name}>
                    <p className="text-sm font-medium text-ink/90">{group.name}</p>
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
                            className={cn("min-w-[76px]", isUnavailable && "opacity-50")}
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

            <div className="mt-8">
              {selectedVariant ? (
                <AddToCartButton
                  merchandiseId={selectedVariant.id}
                  availableForSale={selectedVariant.availableForSale}
                  className="w-full"
                  label="Add to Bag"
                />
              ) : (
                <p className="text-sm text-smoke">This product does not have an available variant yet.</p>
              )}
            </div>

            <div className="mt-8 grid gap-3">
              <div className="flex items-start gap-3 rounded-[1.5rem] border border-ink/10 bg-stone/50 px-4 py-4">
                <Truck className="mt-0.5 h-5 w-5 text-deep-teal" />
                <div>
                  <p className="text-sm font-semibold text-ink">Headless storefront, hosted checkout</p>
                  <p className="mt-1 text-sm text-smoke">Customers stay in your custom experience until secure Shopify checkout begins.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1.5rem] border border-ink/10 bg-stone/50 px-4 py-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-deep-teal" />
                <div>
                  <p className="text-sm font-semibold text-ink">Professional product presentation</p>
                  <p className="mt-1 text-sm text-smoke">No long product blurbs here, just the selling details shoppers need: imagery, size, color, availability, and price.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card tone="stone">
          <CardContent>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-deep-teal uppercase">Product Details</p>
            <div className="mt-4 grid gap-3 text-sm text-smoke">
              {product.vendor ? (
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-deep-teal" />
                  <span>Brand: {product.vendor}</span>
                </div>
              ) : null}
              {product.productType ? (
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-deep-teal" />
                  <span>Category: {product.productType}</span>
                </div>
              ) : null}
              {product.collections.length > 0 ? (
                <div className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 text-deep-teal" />
                  <span>Collections: {product.collections.map((collection) => collection.title).join(", ")}</span>
                </div>
              ) : null}
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-deep-teal" />
                <span>{product.variants.filter((variant) => variant.availableForSale).length} purchasable variant{product.variants.filter((variant) => variant.availableForSale).length === 1 ? "" : "s"} available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
