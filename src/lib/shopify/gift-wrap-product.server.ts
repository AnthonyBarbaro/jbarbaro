import "server-only";

import { GIFT_WRAP_PRODUCT_HANDLE } from "@/lib/shopify/gift-wrap";
import { getShopProduct } from "@/lib/shopify/products";
import type { ShopifyGiftWrapOffer } from "@/lib/shopify/types";

export async function getGiftWrapOffer(): Promise<ShopifyGiftWrapOffer | null> {
  const product = await getShopProduct(GIFT_WRAP_PRODUCT_HANDLE);

  if (!product) {
    return null;
  }

  const availableVariants = product.variants.filter((variant) => variant.availableForSale);
  const variant =
    availableVariants.length === 1
      ? availableVariants[0]
      : product.variants.length === 1
        ? product.variants[0]
        : null;

  if (!variant) {
    return null;
  }

  return {
    merchandiseId: variant.id,
    title: product.title,
    price: variant.price,
    availableForSale: variant.availableForSale,
  };
}
