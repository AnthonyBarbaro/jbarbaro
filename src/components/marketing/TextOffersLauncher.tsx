"use client";

import { usePathname } from "next/navigation";
import { Tag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { KlaviyoTextSignupForm } from "@/components/marketing/KlaviyoTextSignupForm";
import { KLAVIYO_TEXT_SIGNUP_FORM_ID, TEXT_SIGNUP_PATH } from "@/lib/klaviyo";

export function TextOffersLauncher({ siteId }: { siteId: string }) {
  const pathname = usePathname();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const isBrowsing =
    pathname === "/" ||
    pathname === "/shop" ||
    pathname === "/categories" ||
    pathname.startsWith("/categories/") ||
    pathname.startsWith("/shop/brands");

  useEffect(() => {
    if (!opened) return;

    function handleFormEvent(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      if (event.detail?.type === "close" && event.detail.formId === KLAVIYO_TEXT_SIGNUP_FORM_ID) {
        dialogRef.current?.close();
        setDismissed(true);
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
    }

    window.addEventListener("klaviyoForms", handleFormEvent);
    window.addEventListener("dd_response_displayed", showVerification);
    window.addEventListener("dd_response_unload", restoreSignupModal);
    return () => {
      window.removeEventListener("klaviyoForms", handleFormEvent);
      window.removeEventListener("dd_response_displayed", showVerification);
      window.removeEventListener("dd_response_unload", restoreSignupModal);
    };
  }, [opened]);

  if (!isBrowsing || dismissed) return null;

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-haspopup="dialog"
        aria-controls="text-offers-panel"
        onClick={() => {
          setOpened(true);
          dialogRef.current?.showModal();
        }}
        className="text-offers-tab fixed z-[85] inline-flex min-w-11 items-center gap-2 rounded-l-md border border-gold/55 bg-ink px-3 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        <Tag className="h-4 w-4 text-gold" aria-hidden />
        Save 5%
      </button>
      <dialog
        id="text-offers-panel"
        ref={dialogRef}
        aria-label="Text signup"
        onClose={(event) => {
          if (!event.currentTarget.open) launcherRef.current?.focus({ preventScroll: true });
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
