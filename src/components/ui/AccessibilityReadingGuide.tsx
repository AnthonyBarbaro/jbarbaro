"use client";

import { useEffect, useRef } from "react";

import type { ReadingGuideSize } from "@/lib/accessibility";

export function AccessibilityReadingGuide({
  size,
  dimOutside,
}: {
  size: ReadingGuideSize;
  dimOutside: boolean;
}) {
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const guide = guideRef.current;
    if (!guide) return;
    const band = guide;

    function moveTo(y: number) {
      band.style.setProperty("--reading-guide-position", `${y}px`);
    }

    function followPointer(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest("#accessibility-widget-panel")) {
        return;
      }
      if (event.pointerType !== "touch" || (event.type === "pointerdown" && event.isPrimary)) {
        moveTo(event.clientY);
      }
    }

    function followKeyboardFocus(event: FocusEvent) {
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        !target.matches(":focus-visible") ||
        target.closest("#accessibility-widget-panel")
      )
        return;
      const rect = target.getBoundingClientRect();
      moveTo(rect.top + rect.height / 2);
    }

    function nudgeGuide(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (event.key !== "ArrowUp" && event.key !== "ArrowDown") ||
        (event.target instanceof HTMLElement &&
          (event.target.isContentEditable ||
            event.target.closest(
              "dialog, [role='dialog'], input:not([type='checkbox']), select, textarea",
            )))
      )
        return;

      event.preventDefault();
      const rect = band.getBoundingClientRect();
      const next = event.key === "ArrowUp" ? rect.top : rect.bottom;
      moveTo(Math.min(window.innerHeight, Math.max(0, next)));
    }

    window.addEventListener("pointermove", followPointer, { passive: true });
    window.addEventListener("pointerdown", followPointer, { passive: true });
    window.addEventListener("focusin", followKeyboardFocus);
    window.addEventListener("keydown", nudgeGuide);
    return () => {
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("pointerdown", followPointer);
      window.removeEventListener("focusin", followKeyboardFocus);
      window.removeEventListener("keydown", nudgeGuide);
    };
  }, []);

  return (
    <div
      ref={guideRef}
      className="accessibility-reading-guide"
      data-size={size}
      data-dim-outside={dimOutside}
      aria-hidden="true"
    />
  );
}
