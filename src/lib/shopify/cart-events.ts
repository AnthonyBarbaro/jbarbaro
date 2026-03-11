"use client";

export const SHOPIFY_CART_CHANGED_EVENT = "shopify-cart:changed";

export function notifyShopifyCartChanged() {
  window.dispatchEvent(new Event(SHOPIFY_CART_CHANGED_EVENT));
}
