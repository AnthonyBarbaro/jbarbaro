"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  applyKlaviyoTrackingPreference,
  getCookiePreference,
  subscribeToCookiePreference,
} from "@/lib/cookie-preference";
import { KLAVIYO_ONSITE_SCRIPT_ID } from "@/lib/klaviyo";

export function KlaviyoOnsiteScript({ siteId, onError }: { siteId: string; onError?: () => void }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    applyKlaviyoTrackingPreference();
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!ready) return null;

  return (
    <Script
      id={KLAVIYO_ONSITE_SCRIPT_ID}
      src={`https://static.klaviyo.com/onsite/js/${siteId}/klaviyo.js`}
      strategy="afterInteractive"
      onError={onError}
    />
  );
}

export function KlaviyoTracking({ siteId }: { siteId: string }) {
  const preference = useSyncExternalStore(
    subscribeToCookiePreference,
    getCookiePreference,
    () => null,
  );

  return preference === "accepted" ? <KlaviyoOnsiteScript siteId={siteId} /> : null;
}
