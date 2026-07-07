"use client";

export const SHOPIFY_CART_CHANGED_EVENT = "shopify-cart:changed";
export const SHOPIFY_CART_OPEN_EVENT = "shopify-cart:open";

export function notifyShopifyCartChanged() {
  window.dispatchEvent(new Event(SHOPIFY_CART_CHANGED_EVENT));
}

export function openShopifyCartDrawer() {
  window.dispatchEvent(new Event(SHOPIFY_CART_OPEN_EVENT));
}
