"use client";

import { Accessibility, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, type ReactElement } from "react";

import { useAccessibility } from "@/components/ui/AccessibilityProvider";
import { accessibilityOptions, defaultAccessibilityPreferences } from "@/lib/accessibility";

export function AccessibilityWidget({
  placement = "floating",
}: {
  placement?: "floating" | "navigation";
}): ReactElement {
  const { preferences, setPreferences, isOpen, setIsOpen } = useAccessibility();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      // A mobile-navigation opener may be hidden after its drawer closes.
      const target =
        opener instanceof HTMLElement && opener.checkVisibility() && !opener.closest("[inert]")
          ? opener
          : document.querySelector<HTMLElement>("header [data-a11y-opener]");
      target?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!preferences.readingGuide) return;
    function moveGuide(event: PointerEvent): void {
      guideRef.current?.style.setProperty("top", `${Math.max(0, event.clientY - 24)}px`);
    }
    window.addEventListener("pointermove", moveGuide, { passive: true });
    return () => window.removeEventListener("pointermove", moveGuide);
  }, [preferences.readingGuide]);

  return (
    <>
      {placement === "floating" && !preferences.hideFloating ? (
        <button
          type="button"
          className="accessibility-floating-button"
          aria-label="Accessibility options"
          aria-haspopup="dialog"
          aria-controls="accessibility-widget-panel"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(true)}
          data-a11y-opener
        >
          <Accessibility className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : null}

      <dialog
        ref={dialogRef}
        id="accessibility-widget-panel"
        className="accessibility-panel"
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
        onCancel={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'a[href], button:not(:disabled), input:not(:disabled), [tabindex="0"]',
            ),
          ).filter((element) => element.checkVisibility());
          const first = controls[0];
          const last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
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
            setIsOpen(false);
          }
        }}
      >
        <div className="accessibility-panel-content">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-[16px] gap-y-2 border-b border-ink/15 p-[20px]">
            <h2 id="accessibility-title" className="font-heading text-xl break-words text-ink">
              Accessibility options
            </h2>
            <button
              ref={closeRef}
              type="button"
              className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-md border border-ink/20 text-ink hover:bg-stone"
              aria-label="Close accessibility options"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-[20px] w-[20px]" aria-hidden="true" />
            </button>
            <p id="accessibility-description" className="col-span-2 text-sm leading-6 text-smoke">
              Adjust the display to suit you. Your choices are saved in this browser.
            </p>
          </header>

          <div className="accessibility-panel-body">
            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-ink">Text size</legend>
              <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center rounded-md border border-ink/25">
                <button
                  type="button"
                  className="accessibility-size-button"
                  aria-label="Decrease text size"
                  disabled={preferences.fontScale <= 100}
                  onClick={() =>
                    setPreferences({ ...preferences, fontScale: preferences.fontScale - 25 })
                  }
                >
                  <Minus className="h-5 w-5" aria-hidden="true" />
                </button>
                <output aria-live="polite" className="text-center text-sm font-semibold text-ink">
                  {preferences.fontScale}%
                </output>
                <button
                  type="button"
                  className="accessibility-size-button"
                  aria-label="Increase text size"
                  disabled={preferences.fontScale >= 200}
                  onClick={() =>
                    setPreferences({ ...preferences, fontScale: preferences.fontScale + 25 })
                  }
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </fieldset>

            <fieldset className="mt-6 min-w-0">
              <legend className="mb-2 text-sm font-semibold text-ink">Display and reading</legend>
              <div className="divide-y divide-ink/10">
                {accessibilityOptions.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex min-h-12 cursor-pointer items-center justify-between gap-4 py-3 text-sm text-ink"
                  >
                    <span className="min-w-0 break-words">{label}</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 accent-deep-teal"
                      checked={preferences[key]}
                      onChange={(event) =>
                        setPreferences({ ...preferences, [key]: event.target.checked })
                      }
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {placement === "floating" ? (
              <label className="mt-5 flex min-h-12 cursor-pointer items-start justify-between gap-4 border-t border-ink/15 pt-5 text-sm text-ink">
                <span className="min-w-0 break-words">
                  <span className="block font-semibold">Move button to navigation</span>
                  <span className="mt-1 block leading-6 text-smoke">
                    Hide the floating button. Open these options from the header or footer anytime.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-deep-teal"
                  checked={preferences.hideFloating}
                  onChange={(event) =>
                    setPreferences({ ...preferences, hideFloating: event.target.checked })
                  }
                />
              </label>
            ) : null}
            <button
              type="button"
              className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-deep-teal bg-deep-teal px-4 py-3 text-sm font-semibold text-white hover:bg-ink"
              onClick={() => setPreferences(defaultAccessibilityPreferences)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset display preferences
            </button>
            <a
              href="/contact-us"
              onClick={() => setIsOpen(false)}
              className="mt-4 inline-flex min-h-11 items-center text-sm text-deep-teal underline underline-offset-4"
            >
              Get help using this website
            </a>
          </div>
        </div>
      </dialog>

      {preferences.readingGuide ? (
        <div ref={guideRef} className="accessibility-reading-guide" aria-hidden="true" />
      ) : null}
    </>
  );
}
