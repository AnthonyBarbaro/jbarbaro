"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

type BrandProductRailProps = {
  brandName: string;
  brandSlug: string;
  children: ReactNode;
};

export function BrandProductRail({ brandName, brandSlug, children }: BrandProductRailProps) {
  const railRef = useRef<HTMLUListElement | null>(null);
  const railId = useId();
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const maximumScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);

    setCanScrollPrevious(rail.scrollLeft > 2);
    setCanScrollNext(rail.scrollLeft < maximumScrollLeft - 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(rail);
    rail.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      resizeObserver.disconnect();
      rail.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    rail.scrollBy({
      left: direction * Math.max(rail.clientWidth * 0.82, 260),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  return (
    <section
      aria-labelledby={`${railId}-heading`}
      aria-roledescription="carousel"
      className="brand-product-rail min-w-0 overflow-hidden border-t border-ink/15 py-8 first:border-t-0"
    >
      <div className="flex min-w-0 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <h3 id={`${railId}-heading`} className="font-heading text-3xl text-ink sm:text-4xl">
          {brandName}
        </h3>

        <Link
          href={`/shop/brands/${brandSlug}`}
          className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
        >
          Shop {brandName}
        </Link>
      </div>

      <div className="relative mt-4">
        <ul
          id={railId}
          ref={railRef}
          aria-label={`${brandName} best-selling products`}
          className="flex snap-x snap-mandatory scroll-px-[12vw] overflow-x-auto overscroll-x-contain bg-white px-[12vw] pb-px sm:scroll-px-0 sm:px-0 [scrollbar-width:none] [&>li]:border-r [&>li]:border-ink/10 [&>li:first-child]:border-l [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </ul>

        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-between px-4 md:flex lg:px-6"
          role="group"
          aria-label={`Browse ${brandName}`}
        >
          <button
            type="button"
            onClick={() => scrollRail(-1)}
            disabled={!canScrollPrevious}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-ink/90 text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-colors duration-200 hover:bg-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Show previous ${brandName} products`}
            aria-controls={railId}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollRail(1)}
            disabled={!canScrollNext}
            className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-ink/90 text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition-colors duration-200 hover:bg-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label={`Show more ${brandName} products`}
            aria-controls={railId}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
