"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";

import {
  getCookiePreference,
  saveCookiePreference,
  subscribeToCookiePreference,
} from "@/lib/cookie-preference";

export function CookieNotice() {
  const preference = useSyncExternalStore(
    subscribeToCookiePreference,
    getCookiePreference,
    () => "pending" as const,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const showNotice = preference === null || settingsOpen;

  function choose(preference: "accepted" | "essential") {
    if (settingsOpen) settingsButtonRef.current?.focus({ preventScroll: true });
    setSettingsOpen(false);
    saveCookiePreference(preference);
  }

  return (
    <>
      <button
        ref={settingsButtonRef}
        type="button"
        onClick={() => setSettingsOpen((open) => !open)}
        aria-expanded={showNotice}
        aria-controls="site-cookie-notice"
        className="text-white/85 underline decoration-white/30 underline-offset-4 hover:text-gold focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
      >
        Cookie settings
      </button>
      {showNotice ? (
        <aside
          id="site-cookie-notice"
          aria-labelledby="cookie-notice-title"
          className="cookie-notice fixed right-3 bottom-[calc(var(--mobile-nav-height,4rem)+0.75rem)] z-[125] w-[calc(100%-1.5rem)] max-w-sm rounded-xl border border-ink/15 bg-white p-3 text-left text-ink shadow-lg lg:right-6 lg:bottom-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="cookie-notice-title" className="text-sm font-semibold">
                Cookie choices
              </h2>
              <p className="mt-1 text-sm leading-5 text-smoke">
                Essential cookies keep your bag working. Close to skip optional tracking.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close and keep essential cookies only"
              onClick={() => choose("essential")}
              className="-mt-2 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-smoke hover:bg-stone hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/privacy-policy"
              className="text-xs text-deep-teal underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 text-xs font-semibold text-white hover:bg-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              Accept cookies
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
