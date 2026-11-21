"use client";

import { usePathname } from "next/navigation";
import { Tag, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { KlaviyoTextSignupForm } from "@/components/marketing/KlaviyoTextSignupForm";
import {
  KLAVIYO_TEXT_SIGNUP_FORM_ID,
  TEXT_SIGNUP_OPEN_EVENT,
  TEXT_SIGNUP_PATH,
} from "@/lib/klaviyo";

const hiddenOfferKey = "jbarbaro:text-offer-hidden";

function getStoredOfferDismissal() {
  try {
    return window.localStorage.getItem(hiddenOfferKey) === "true";
  } catch {
    return false;
  }
}

function subscribeToStoredOfferDismissal(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function TextOffersLauncher({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const klaviyoFormDeclinedRef = useRef(false);
  const [opened, setOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hiddenInBrowser = useSyncExternalStore(
    subscribeToStoredOfferDismissal,
    getStoredOfferDismissal,
    () => true,
  );
  const isBrowsing =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/categories" ||
    pathname.startsWith("/categories/") ||
    pathname.startsWith("/shop/brands");

  const openOffer = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || klaviyoFormDeclinedRef.current) return false;

    if (!dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpened(true);
      dialog.showModal();
      dialog.focus({ preventScroll: true });
    }
    return true;
  }, []);

  const dismissOffer = useCallback(() => {
    openerRef.current = null;
    dialogRef.current?.close();
    setDismissed(true);
    try {
      window.localStorage.setItem(hiddenOfferKey, "true");
    } catch {
      // Keep the offer hidden in the current page when storage is unavailable.
    }
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!isBrowsing) return;

    function handleOpenRequest(event: Event) {
      if (openOffer()) event.preventDefault();
    }

    window.addEventListener(TEXT_SIGNUP_OPEN_EVENT, handleOpenRequest);
    return () => window.removeEventListener(TEXT_SIGNUP_OPEN_EVENT, handleOpenRequest);
  }, [isBrowsing, openOffer]);

  useEffect(() => {
    if (!opened || !isBrowsing) return;

    function handleFormEvent(event: Event) {
      if (!(event instanceof CustomEvent) || !dialogRef.current?.open) return;
      if (event.detail?.type === "close" && event.detail.formId === KLAVIYO_TEXT_SIGNUP_FORM_ID) {
        // Klaviyo removes a declined embed. A later signup click can open the standalone page.
        klaviyoFormDeclinedRef.current = true;
        setOpened(false);
        dismissOffer();
      }
    }

    function showVerification(event: Event) {
      const dialog = dialogRef.current;
      if (!dialog?.matches(":modal") || !(event instanceof CustomEvent)) return;

      const { rootElement, challengeType } = event.detail ?? {};
      if (
        !(rootElement instanceof HTMLElement) ||
        dialog.contains(rootElement) ||
        challengeType === "device_check_invisible_mode"
      ) {
        return;
      }

      const frame = rootElement.querySelector<HTMLIFrameElement>(
        'iframe[title="Verification system"]',
      );
      if (!frame) return;

      // Klaviyo verification sits outside the dialog and needs to receive pointer and focus events.
      dialog.close();
      dialog.show();
      frame.focus({ preventScroll: true });
    }

    function restoreSignupModal() {
      const dialog = dialogRef.current;
      if (!dialog?.open || dialog.matches(":modal")) return;

      dialog.close();
      dialog.showModal();
      dialog.focus({ preventScroll: true });
    }

    window.addEventListener("klaviyoForms", handleFormEvent);
    window.addEventListener("dd_response_displayed", showVerification);
    window.addEventListener("dd_response_unload", restoreSignupModal);
    return () => {
      window.removeEventListener("klaviyoForms", handleFormEvent);
      window.removeEventListener("dd_response_displayed", showVerification);
      window.removeEventListener("dd_response_unload", restoreSignupModal);
    };
  }, [dismissOffer, isBrowsing, opened]);

  if (!isBrowsing) return null;

  return (
    <>
      {!dismissed && !hiddenInBrowser ? (
        <div className="text-offers-launcher fixed z-[85]">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-controls="text-offers-panel"
            onClick={openOffer}
            className="text-offers-tab flex min-w-11 items-center gap-2 rounded-l-md border border-gold/55 bg-ink px-3 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <Tag className="h-4 w-4 text-gold" aria-hidden />
            Save 5%
          </button>
          <button
            type="button"
            aria-label="Hide Save 5% offer"
            onClick={dismissOffer}
            className="absolute -top-2 -right-2 inline-flex size-7 items-center justify-center rounded-full border border-ink/20 bg-ivory text-ink shadow-sm hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
      <dialog
        id="text-offers-panel"
        ref={dialogRef}
        aria-label="Text signup"
        onClose={(event) => {
          if (!event.currentTarget.open) openerRef.current?.focus({ preventScroll: true });
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          ) {
            event.currentTarget.close();
          }
        }}
        className="text-offers-panel fixed m-0 max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-xl bg-ivory p-0 text-ink shadow-xl backdrop:bg-ink/45"
      >
        <div className="relative min-h-11">
          <button
            type="button"
            aria-label="Close text signup"
            onClick={() => dialogRef.current?.close()}
            className="absolute top-1 right-1 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          {opened ? (
            <KlaviyoTextSignupForm siteId={siteId} fallbackHref={TEXT_SIGNUP_PATH} />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
