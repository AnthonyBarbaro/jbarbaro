"use client";

import { Accessibility } from "lucide-react";
import type { ReactElement } from "react";

import { useAccessibility } from "@/components/ui/AccessibilityProvider";
import { cn } from "@/lib/utils";

export function AccessibilityNavButton({
  className,
  onOpen,
  showLabel = false,
}: {
  className?: string;
  onOpen?: () => void;
  showLabel?: boolean;
}): ReactElement {
  const { isOpen, setIsOpen } = useAccessibility();

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md transition-colors hover:text-deep-teal",
        className,
      )}
      aria-label="Accessibility options"
      aria-haspopup="dialog"
      aria-controls="accessibility-widget-panel"
      aria-expanded={isOpen}
      onClick={() => {
        onOpen?.();
        setIsOpen(true);
      }}
      data-a11y-opener
    >
      <Accessibility className="h-5 w-5 shrink-0" aria-hidden="true" />
      {showLabel ? (
        <span className="min-w-0 text-left break-words">Accessibility options</span>
      ) : null}
    </button>
  );
}
