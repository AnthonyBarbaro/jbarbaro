"use client";

import type { ShopifyCartResponse } from "@/lib/shopify/types";

export const SHOPIFY_CART_CHANGED_EVENT = "shopify-cart:changed";
export const SHOPIFY_CART_OPEN_EVENT = "shopify-cart:open";

export function notifyShopifyCartChanged(detail?: ShopifyCartResponse): void {
  window.dispatchEvent(new CustomEvent(SHOPIFY_CART_CHANGED_EVENT, { detail }));
}

export function openShopifyCartDrawer(detail?: ShopifyCartResponse): void {
  window.dispatchEvent(new CustomEvent(SHOPIFY_CART_OPEN_EVENT, { detail }));
}
