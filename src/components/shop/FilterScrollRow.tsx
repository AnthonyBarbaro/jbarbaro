"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function FilterScrollRow({ children }: { children: ReactNode }) {
  const id = useId();
  const rowRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ previous: false, next: false });

  useEffect(() => {
    const row = rowRef.current;
    const content = contentRef.current;
    if (!row || !content) return;
    const update = (): void => {
      setEdges({
        previous: row.scrollLeft > 2,
        next: row.scrollLeft < row.scrollWidth - row.clientWidth - 2,
      });
    };
    const observer = new ResizeObserver(update);
    observer.observe(row);
    observer.observe(content);
    row.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      row.removeEventListener("scroll", update);
    };
  }, []);

  function scroll(direction: -1 | 1): void {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({
      left: direction * row.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  const buttonClass =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white text-deep-teal hover:bg-stone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex min-w-0 items-start gap-2 lg:hidden">
      <button
        type="button"
        className={buttonClass}
        disabled={!edges.previous}
        aria-label="Show previous filters"
        aria-controls={id}
        onClick={() => scroll(-1)}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <div
        id={id}
        ref={rowRef}
        className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={contentRef} className="flex w-max items-start gap-2">
          {children}
        </div>
      </div>
      <button
        type="button"
        className={buttonClass}
        disabled={!edges.next}
        aria-label="Show more filters"
        aria-controls={id}
        onClick={() => scroll(1)}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
