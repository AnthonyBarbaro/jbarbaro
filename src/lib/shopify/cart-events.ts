"use client";

import type { ShopifyCartResponse } from "@/lib/shopify/types";

export const SHOPIFY_CART_CHANGED_EVENT = "shopify-cart:changed";
export const SHOPIFY_CART_OPEN_EVENT = "shopify-cart:open";
export const SHOPIFY_CART_INVALIDATED_EVENT = "shopify-cart:invalidated";
export const SHOPIFY_CART_REVALIDATION_FAILED_EVENT = "shopify-cart:revalidation-failed";
export const SHOPIFY_CART_MUTATION_STARTED_EVENT = "shopify-cart:mutation-started";
export const SHOPIFY_CART_MUTATION_FINISHED_EVENT = "shopify-cart:mutation-finished";
export const SHOPIFY_CART_SYNC_KEY = "jbarbaro-cart-invalidation";

export type ShopifyCartChangePayload = ShopifyCartResponse & { backgroundRefresh?: true };
let lastBroadcastToken: string | null = null;

function broadcastInvalidation(): void {
  // Only an opaque invalidation token crosses tabs, never cart contents or checkout credentials.
  const token = `v1:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  lastBroadcastToken = token;
  try {
    const channel = new BroadcastChannel(SHOPIFY_CART_SYNC_KEY);
    channel.postMessage(token);
    channel.close();
  } catch {
    // Storage and focus revalidation also cover browsers without BroadcastChannel.
  }
  try {
    window.localStorage.setItem(SHOPIFY_CART_SYNC_KEY, token);
  } catch {
    // Shopping still works when browser storage is disabled.
  }
}

export function startShopifyCartSynchronization(): () => void {
  let lastToken: string | null = null;
  let channel: BroadcastChannel | null = null;
  function invalidate(): void {
    window.dispatchEvent(new Event(SHOPIFY_CART_INVALIDATED_EVENT));
  }
  function receiveToken(token: unknown): void {
    if (
      typeof token === "string" &&
      token.startsWith("v1:") &&
      token !== lastToken &&
      token !== lastBroadcastToken
    ) {
      lastToken = token;
      invalidate();
    }
  }
  function handleStorage(event: StorageEvent): void {
    if (event.key === SHOPIFY_CART_SYNC_KEY) receiveToken(event.newValue);
  }
  function handleVisibility(): void {
    if (document.visibilityState === "visible") invalidate();
  }
  try {
    channel = new BroadcastChannel(SHOPIFY_CART_SYNC_KEY);
    channel.onmessage = (event: MessageEvent<unknown>): void => receiveToken(event.data);
  } catch {
    // Storage events and returning to the page remain available as fallbacks.
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener("focus", invalidate);
  document.addEventListener("visibilitychange", handleVisibility);
  return () => {
    channel?.close();
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("focus", invalidate);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}

export function notifyShopifyCartChanged(
  detail?: ShopifyCartChangePayload,
  { broadcast = detail?.confirmed !== undefined }: { broadcast?: boolean } = {},
): void {
  window.dispatchEvent(new CustomEvent(SHOPIFY_CART_CHANGED_EVENT, { detail }));
  if (broadcast) broadcastInvalidation();
}

export function openShopifyCartDrawer(detail?: ShopifyCartResponse): void {
  window.dispatchEvent(new CustomEvent(SHOPIFY_CART_OPEN_EVENT, { detail }));
}
