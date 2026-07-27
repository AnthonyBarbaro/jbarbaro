import type { ShopifyProduct, ShopifyProductVariant } from "@/lib/shopify/types";

export type ProductSale = {
  variant: ShopifyProductVariant;
  discountPercent: number;
};

export function getProductSales(product: ShopifyProduct): ProductSale[] {
  return product.variants
    .filter((variant) => {
      const price = Number(variant.price.amount);
      const compareAtPrice = Number(variant.compareAtPrice?.amount);

      return (
        variant.availableForSale &&
        Number.isFinite(price) &&
        Number.isFinite(compareAtPrice) &&
        compareAtPrice > price
      );
    })
    .map((variant) => ({
      variant,
      discountPercent: Math.round(
        (1 - Number(variant.price.amount) / Number(variant.compareAtPrice?.amount)) * 100,
      ),
    }))
    .sort((left, right) => right.discountPercent - left.discountPercent);
}

export function getProductSale(product: ShopifyProduct): ProductSale | null {
  return getProductSales(product)[0] ?? null;
}
