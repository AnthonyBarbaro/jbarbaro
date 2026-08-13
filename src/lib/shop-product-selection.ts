import type { ShopifyProductVariant } from "@/lib/shopify/types";

export const PRODUCT_SELECTION_EVENT = "jbarbaro:product-selection";

export type ProductSelectionDetail = {
  productId: string;
  variantId: string | null;
  selectedOptions: ShopifyProductVariant["selectedOptions"];
};

let latestProductSelection: ProductSelectionDetail | null = null;

export function publishProductSelection(detail: ProductSelectionDetail) {
  latestProductSelection = detail;
  window.dispatchEvent(
    new CustomEvent<ProductSelectionDetail>(PRODUCT_SELECTION_EVENT, { detail }),
  );
}

export function getLatestProductSelection(productId: string) {
  return latestProductSelection?.productId === productId ? latestProductSelection : null;
}
