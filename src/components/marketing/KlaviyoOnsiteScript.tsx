"use client";

import { useEffect, useSyncExternalStore } from "react";

import {
  applyKlaviyoTrackingPreference,
  getCookiePreference,
  subscribeToCookiePreference,
} from "@/lib/cookie-preference";
import { KLAVIYO_ONSITE_SCRIPT_ID } from "@/lib/klaviyo";

let onsiteScriptLoad: Promise<void> | undefined;

function loadKlaviyoOnsiteScript(siteId: string) {
  if (onsiteScriptLoad) return onsiteScriptLoad;

  applyKlaviyoTrackingPreference();
  const script = document.createElement("script");
  script.id = KLAVIYO_ONSITE_SCRIPT_ID;
  script.async = true;
  script.src = `https://static.klaviyo.com/onsite/js/${encodeURIComponent(siteId)}/klaviyo.js`;
  onsiteScriptLoad = new Promise<void>((resolve, reject) => {
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        onsiteScriptLoad = undefined;
        reject(new Error("Klaviyo’s onsite script could not load."));
      },
      { once: true },
    );
  });
  document.head.append(script);
  return onsiteScriptLoad;
}

export function KlaviyoOnsiteScript({ siteId, onError }: { siteId: string; onError?: () => void }) {
  useEffect(() => {
    let active = true;
    void loadKlaviyoOnsiteScript(siteId)
      .catch(() => {
        // Give an open form one retry after a network failure.
        if (active && onError) return loadKlaviyoOnsiteScript(siteId);
      })
      .catch(() => {
        if (active) onError?.();
      });
    return () => {
      active = false;
    };
  }, [siteId, onError]);

  return null;
}

export function KlaviyoTracking({ siteId }: { siteId: string }) {
  const preference = useSyncExternalStore(
    subscribeToCookiePreference,
    getCookiePreference,
    () => null,
  );

  return preference === "accepted" ? <KlaviyoOnsiteScript siteId={siteId} /> : null;
}
