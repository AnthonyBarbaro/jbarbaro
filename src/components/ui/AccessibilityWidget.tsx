"use client";

import { Accessibility, Minus, Plus, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, type ReactElement } from "react";

import { useAccessibility } from "@/components/ui/AccessibilityProvider";
import { AccessibilityReadingGuide } from "@/components/ui/AccessibilityReadingGuide";
import { accessibilityGroups, defaultAccessibilityPreferences } from "@/lib/accessibility";

function resolvePanelAnchor(trigger: HTMLButtonElement): HTMLButtonElement {
  if (trigger.isConnected && trigger.getClientRects().length && !trigger.closest("[inert]")) {
    return trigger;
  }
  return document.querySelector<HTMLButtonElement>("header [data-a11y-opener]") ?? trigger;
}

export function AccessibilityWidget({
  placement = "floating",
}: {
  placement?: "floating" | "navigation";
}): ReactElement {
  const { preferences, setPreferences, panelTrigger, togglePanel, closePanel } = useAccessibility();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = panelTrigger !== null;
  const atMinimumTextSize = preferences.fontScale <= 100;
  const atMaximumTextSize = preferences.fontScale >= 200;

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panelTrigger || !panel) return;
    const anchor = resolvePanelAnchor(panelTrigger);
    const viewport = window.visualViewport;
    let anchorRect = anchor.getBoundingClientRect();

    const updatePosition = () => {
      if (anchor.getClientRects().length) anchorRect = anchor.getBoundingClientRect();

      const margin = 12;
      const gap = 8;
      const left = (viewport?.offsetLeft ?? 0) + margin;
      const top = (viewport?.offsetTop ?? 0) + margin;
      const width = (viewport?.width ?? document.documentElement.clientWidth) - 2 * margin;
      const bottom = top + (viewport?.height ?? window.innerHeight) - 2 * margin;
      const above = Math.min(bottom, Math.max(top, anchorRect.top - gap));
      const below = Math.min(bottom, Math.max(top, anchorRect.bottom + gap));
      const opensAbove = above - top > bottom - below;

      panel.style.maxWidth = `${width}px`;
      panel.style.left = `${Math.max(left, Math.min(anchorRect.left, left + width - panel.offsetWidth))}px`;
      panel.style.top = opensAbove ? "auto" : `${below}px`;
      panel.style.bottom = opensAbove ? `${window.innerHeight - above}px` : "auto";
      panel.style.setProperty(
        "--accessibility-panel-space",
        `${opensAbove ? above - top : bottom - below}px`,
      );
      panel.dataset.direction = opensAbove ? "up" : "down";
    };

    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(anchor);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });
    viewport?.addEventListener("resize", updatePosition);
    viewport?.addEventListener("scroll", updatePosition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
      viewport?.removeEventListener("resize", updatePosition);
      viewport?.removeEventListener("scroll", updatePosition);
    };
  }, [panelTrigger]);

  useEffect(() => {
    if (panelTrigger) closeRef.current?.focus({ preventScroll: true });
  }, [panelTrigger]);

  useEffect(() => {
    if (!isOpen) return;

    function dismissOnOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        panelRef.current?.contains(target) ||
        target.closest("[data-a11y-opener]")
      ) {
        return;
      }
      closePanel();
    }

    document.addEventListener("click", dismissOnOutsideClick, true);
    return () => document.removeEventListener("click", dismissOnOutsideClick, true);
  }, [closePanel, isOpen]);

  function dismissPanel() {
    if (panelTrigger) resolvePanelAnchor(panelTrigger).focus({ preventScroll: true });
    closePanel();
  }

  return (
    <>
      {placement === "floating" && !preferences.hideFloating ? (
        <button
          type="button"
          className="accessibility-floating-button"
          aria-label="Accessibility options"
          aria-controls="accessibility-widget-panel"
          aria-expanded={isOpen}
          onClick={(event) => togglePanel(event.currentTarget)}
          data-a11y-opener
        >
          <Accessibility className="h-6 w-6" aria-hidden="true" />
        </button>
      ) : null}

      <section
        ref={panelRef}
        id="accessibility-widget-panel"
        className="accessibility-panel"
        hidden={!isOpen}
        aria-labelledby="accessibility-title"
        aria-describedby="accessibility-description"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented) {
            event.preventDefault();
            dismissPanel();
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
              onClick={dismissPanel}
            >
              <X className="h-[20px] w-[20px]" aria-hidden="true" />
            </button>
            <p id="accessibility-description" className="col-span-2 text-sm leading-6 text-smoke">
              Adjust the display to suit you. Your choices are saved in this browser.
            </p>
          </header>

          <div className="accessibility-panel-body">
            <nav className="mb-4 flex flex-wrap gap-x-4" aria-label="Page shortcuts">
              <a
                href="#main-content"
                onClick={closePanel}
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-deep-teal underline underline-offset-4"
              >
                Jump to content
              </a>
              <a
                href="#site-footer"
                onClick={closePanel}
                className="inline-flex min-h-[44px] items-center text-sm font-semibold text-deep-teal underline underline-offset-4"
              >
                Jump to footer
              </a>
            </nav>
            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-ink">Text size</legend>
              <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center rounded-md border border-ink/25">
                <button
                  type="button"
                  className="accessibility-size-button"
                  aria-label="Decrease text size"
                  aria-disabled={atMinimumTextSize}
                  onClick={() => {
                    if (!atMinimumTextSize) {
                      setPreferences({ ...preferences, fontScale: preferences.fontScale - 25 });
                    }
                  }}
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
                  aria-disabled={atMaximumTextSize}
                  onClick={() => {
                    if (!atMaximumTextSize) {
                      setPreferences({ ...preferences, fontScale: preferences.fontScale + 25 });
                    }
                  }}
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </fieldset>

            {accessibilityGroups.map(({ label: groupLabel, options }) => (
              <fieldset key={groupLabel} className="mt-6 min-w-0 border-t border-ink/15">
                <legend className="pr-3 text-sm font-semibold text-ink">{groupLabel}</legend>
                <div className="divide-y divide-ink/10">
                  {options.map(({ key, label }) => (
                    <div key={key}>
                      <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 py-3 text-sm text-ink">
                        <span className="min-w-0 break-words">{label}</span>
                        <input
                          type="checkbox"
                          className="h-[20px] w-[20px] shrink-0"
                          checked={preferences[key]}
                          onChange={(event) =>
                            setPreferences({ ...preferences, [key]: event.target.checked })
                          }
                          aria-describedby={
                            key === "readingGuide" && preferences.readingGuide
                              ? "accessibility-reading-guide-help"
                              : undefined
                          }
                        />
                      </label>
                      {key === "readingGuide" && preferences.readingGuide ? (
                        <div className="mb-3 rounded-md bg-stone p-3">
                          <label className="block text-sm text-ink">
                            <span className="font-semibold">Guide size</span>
                            <select
                              className="mt-2 min-h-[44px] w-full rounded-md border border-ink/35 bg-ivory p-2 text-ink"
                              value={preferences.readingGuideSize}
                              onChange={(event) =>
                                setPreferences({
                                  ...preferences,
                                  readingGuideSize:
                                    event.currentTarget.value === "standard" ? "standard" : "large",
                                })
                              }
                            >
                              <option value="standard">Standard</option>
                              <option value="large">Large</option>
                            </select>
                          </label>
                          <label className="mt-2 flex min-h-[44px] cursor-pointer items-center justify-between gap-4 text-sm text-ink">
                            <span className="min-w-0">Dim outside the guide</span>
                            <input
                              type="checkbox"
                              className="h-[20px] w-[20px] shrink-0"
                              checked={preferences.dimOutsideGuide}
                              onChange={(event) =>
                                setPreferences({
                                  ...preferences,
                                  dimOutsideGuide: event.target.checked,
                                })
                              }
                            />
                          </label>
                          <p
                            id="accessibility-reading-guide-help"
                            className="mt-3 text-sm leading-normal text-smoke"
                          >
                            Move your pointer over the page, tap a blank spot, or press Alt (Option
                            on Mac) with the up or down arrow.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}

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
                  className="mt-1 h-[20px] w-[20px] shrink-0"
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
            <div className="mt-4 flex flex-wrap gap-x-4">
              <Link
                href="/accessibility"
                onClick={closePanel}
                className="inline-flex min-h-[44px] items-center text-sm text-deep-teal underline underline-offset-4"
              >
                Accessibility statement
              </Link>
              <Link
                href="/contact-us"
                onClick={closePanel}
                className="inline-flex min-h-[44px] items-center text-sm text-deep-teal underline underline-offset-4"
              >
                Get help using this website
              </Link>
            </div>
            <p className="mt-4 border-t border-ink/15 pt-2 text-center text-[0.6875rem] text-smoke">
              <a
                href="https://barbaro.tech"
                className="inline-flex min-h-6 items-center underline decoration-current/40 underline-offset-2 hover:text-deep-teal"
              >
                Powered by Barbaro Tech
              </a>
            </p>
          </div>
        </div>
      </section>

      {preferences.readingGuide ? (
        <AccessibilityReadingGuide
          size={preferences.readingGuideSize}
          dimOutside={preferences.dimOutsideGuide}
        />
      ) : null}
    </>
  );
}
