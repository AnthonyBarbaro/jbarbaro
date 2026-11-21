"use client";

import { useSyncExternalStore } from "react";

import { getStorefrontLaunchSeconds, isStorefrontCheckoutOpen } from "@/lib/storefront-launch";

function subscribeToLaunchClock(onChange: () => void): () => void {
  let timer: number | undefined;

  function sync() {
    window.clearTimeout(timer);
    onChange();
    if (!isStorefrontCheckoutOpen()) {
      timer = window.setTimeout(sync, 1000 - (Date.now() % 1000));
    }
  }

  sync();
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pageshow", sync);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", sync);
    window.removeEventListener("pageshow", sync);
  };
}

export function useStorefrontLaunchCountdown(): number | null {
  return useSyncExternalStore(subscribeToLaunchClock, getStorefrontLaunchSeconds, () => null);
}

export function useStorefrontCheckoutOpen(): boolean {
  return useSyncExternalStore(subscribeToLaunchClock, isStorefrontCheckoutOpen, () => false);
}
