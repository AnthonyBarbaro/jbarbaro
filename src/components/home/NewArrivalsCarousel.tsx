"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

const AUTOPLAY_DELAY_MS = 6500;
const SCROLL_IDLE_DELAY_MS = 180;

type NewArrivalsCarouselProps = {
  children: ReactNode;
  itemCount: number;
};

type RailArrowButtonProps = {
  className: string;
  direction: -1 | 1;
  disabled: boolean;
  railId: string;
  onClick: (direction: -1 | 1) => void;
  willWrap: boolean;
};

function RailArrowButton({
  className,
  direction,
  disabled,
  railId,
  onClick,
  willWrap,
}: RailArrowButtonProps) {
  const ArrowIcon = direction === -1 ? ChevronLeft : ChevronRight;
  const label =
    direction === -1
      ? willWrap
        ? "Show last new arrivals"
        : "Show previous new arrivals"
      : willWrap
        ? "Show first new arrivals"
        : "Show more new arrivals";

  return (
    <button
      type="button"
      onClick={() => onClick(direction)}
      disabled={disabled}
      className={`group h-11 w-11 shrink-0 items-center justify-center border border-ink/20 bg-transparent text-ink transition-colors duration-200 hover:bg-ink hover:text-ivory focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal disabled:cursor-not-allowed disabled:border-ink/8 disabled:text-smoke/30 disabled:hover:bg-transparent ${className}`}
      aria-label={label}
      aria-controls={railId}
    >
      <ArrowIcon
        className={`h-5 w-5 transition-transform duration-200 ${
          direction === -1 ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
        }`}
        aria-hidden
      />
    </button>
  );
}

export function NewArrivalsCarousel({ children, itemCount }: NewArrivalsCarouselProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const railRef = useRef<HTMLUListElement | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const scrollIdleTimerRef = useRef<number | null>(null);
  const autoplayDirectionRef = useRef<-1 | 1>(1);
  const railId = useId();
  const [canScrollPrevious, setCanScrollPrevious] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(itemCount > 1);
  const [hasOverflow, setHasOverflow] = useState(itemCount > 1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isInView, setIsInView] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const syncRailState = useCallback(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    const endPosition = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const scrollLeft = Math.min(endPosition, Math.max(0, rail.scrollLeft));
    const overflow = endPosition > 2;

    setHasOverflow(overflow);
    setCanScrollPrevious(overflow && scrollLeft > 2);
    setCanScrollNext(overflow && scrollLeft < endPosition - 2);
    setScrollProgress(
      rail.scrollWidth > 0
        ? Math.min(1, Math.max(0, (scrollLeft + rail.clientWidth) / rail.scrollWidth))
        : 1,
    );
  }, []);

  const handleRailScroll = useCallback(() => {
    if (scrollAnimationFrameRef.current === null) {
      scrollAnimationFrameRef.current = window.requestAnimationFrame(() => {
        scrollAnimationFrameRef.current = null;
        syncRailState();
      });
    }

    setIsScrolling(true);

    if (scrollIdleTimerRef.current !== null) {
      window.clearTimeout(scrollIdleTimerRef.current);
    }

    scrollIdleTimerRef.current = window.setTimeout(() => {
      scrollIdleTimerRef.current = null;
      setIsScrolling(false);
      syncRailState();
    }, SCROLL_IDLE_DELAY_MS);
  }, [syncRailState]);

  const scrollRail = useCallback(
    (direction: -1 | 1, shouldWrap = false) => {
      const rail = railRef.current;
      const firstItem = rail?.firstElementChild;

      if (!rail || !(firstItem instanceof HTMLElement)) {
        return;
      }

      const styles = window.getComputedStyle(rail);
      const gap = Number.parseFloat(styles.columnGap) || 16;
      const itemStep = firstItem.getBoundingClientRect().width + gap;
      const visibleItems = Math.max(1, Math.round((rail.clientWidth + gap) / itemStep));
      const endPosition = Math.max(0, rail.scrollWidth - rail.clientWidth);
      const targetPosition = shouldWrap
        ? direction === 1
          ? 0
          : endPosition
        : Math.min(endPosition, Math.max(0, rail.scrollLeft + direction * itemStep * visibleItems));

      rail.scrollTo({
        left: targetPosition,
        behavior: prefersReducedMotion || shouldWrap ? "auto" : "smooth",
      });
    },
    [prefersReducedMotion],
  );

  function handleArrowClick(direction: -1 | 1) {
    autoplayDirectionRef.current = direction;
    const shouldWrap =
      (direction === -1 && !canScrollPrevious) || (direction === 1 && !canScrollNext);
    scrollRail(direction, shouldWrap);
  }

  useEffect(() => {
    const rail = railRef.current;

    if (!rail) {
      return;
    }

    syncRailState();

    const resizeObserver = new ResizeObserver(syncRailState);
    resizeObserver.observe(rail);

    return () => resizeObserver.disconnect();
  }, [itemCount, syncRailState]);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => setPrefersReducedMotion(motionPreference.matches);

    syncMotionPreference();
    motionPreference.addEventListener("change", syncMotionPreference);

    return () => motionPreference.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    const syncDocumentVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    syncDocumentVisibility();
    document.addEventListener("visibilitychange", syncDocumentVisibility);

    return () => document.removeEventListener("visibilitychange", syncDocumentVisibility);
  }, []);

  useEffect(() => {
    if (!isPointerActive) {
      return;
    }

    const endPointerInteraction = () => setIsPointerActive(false);
    window.addEventListener("pointerup", endPointerInteraction);
    window.addEventListener("pointercancel", endPointerInteraction);

    return () => {
      window.removeEventListener("pointerup", endPointerInteraction);
      window.removeEventListener("pointercancel", endPointerInteraction);
    };
  }, [isPointerActive]);

  useEffect(
    () => () => {
      if (scrollAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollAnimationFrameRef.current);
      }

      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
      }
    },
    [],
  );

  const isInteractionPaused = isHovered || isFocusWithin || isPointerActive || isScrolling;
  const canAutoplay =
    itemCount > 1 &&
    hasOverflow &&
    !isUserPaused &&
    !prefersReducedMotion &&
    !isInteractionPaused &&
    isInView &&
    isDocumentVisible;

  useEffect(() => {
    if (!canAutoplay) {
      return;
    }

    const timer = window.setTimeout(() => {
      let direction = autoplayDirectionRef.current;

      if (direction === 1 && !canScrollNext) {
        direction = -1;
      } else if (direction === -1 && !canScrollPrevious) {
        direction = 1;
      }

      autoplayDirectionRef.current = direction;
      scrollRail(direction);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [canAutoplay, canScrollNext, canScrollPrevious, scrollRail]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`${railId}-heading`}
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocusWithin(false);
        }
      }}
    >
      <div className="mt-10 flex flex-col gap-4 border-t border-ink/15 px-4 pt-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-deep-teal uppercase">
            New Arrivals
          </p>
          <h2 id={`${railId}-heading`} className="mt-2 font-heading text-3xl text-ink sm:text-4xl">
            Fresh on the Floor
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <Link
            href="/shop?top=new#top-picks"
            className="inline-flex min-h-11 items-center px-1 text-xs font-semibold tracking-[0.14em] text-deep-teal uppercase transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2"
          >
            Shop New Arrivals
          </Link>

          {itemCount > 1 ? (
            <button
              type="button"
              onClick={() => setIsUserPaused((paused) => !paused)}
              disabled={!hasOverflow || prefersReducedMotion}
              className="inline-flex h-11 items-center justify-center gap-2 border-l border-ink/12 pl-3 text-xs font-semibold tracking-[0.12em] text-smoke uppercase transition-colors hover:text-deep-teal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-deep-teal focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-smoke/45"
              aria-label={
                prefersReducedMotion
                  ? "Autoplay disabled by reduced motion preference"
                  : isUserPaused
                    ? "Play new arrivals carousel"
                    : "Pause new arrivals carousel"
              }
            >
              {isUserPaused ? (
                <Play className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Pause className="h-3.5 w-3.5" aria-hidden />
              )}
              <span>{prefersReducedMotion ? "Motion off" : isUserPaused ? "Play" : "Pause"}</span>
            </button>
          ) : null}

          {itemCount > 1 ? (
            <div className="flex items-center gap-px" role="group" aria-label="Browse new arrivals">
              <RailArrowButton
                direction={-1}
                disabled={!hasOverflow}
                railId={railId}
                onClick={handleArrowClick}
                willWrap={!canScrollPrevious && hasOverflow}
                className="inline-flex"
              />
              <RailArrowButton
                direction={1}
                disabled={!hasOverflow}
                railId={railId}
                onClick={handleArrowClick}
                willWrap={!canScrollNext && hasOverflow}
                className="inline-flex"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4">
        <ul
          id={railId}
          ref={railRef}
          aria-label="Fresh on the Floor products"
          aria-live="off"
          onScroll={handleRailScroll}
          onPointerDown={(event) => {
            if (event.isPrimary) {
              setIsPointerActive(true);
            }
          }}
          onPointerUp={() => setIsPointerActive(false)}
          onPointerCancel={() => setIsPointerActive(false)}
          className="flex snap-x snap-mandatory scroll-px-0 gap-px overflow-x-auto overscroll-x-contain bg-ink/10 pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </ul>
      </div>

      <div className="mt-3 flex items-center justify-center px-4 sm:px-6">
        <div
          className="h-1 max-w-36 flex-1 overflow-hidden rounded-full bg-ink/10 sm:max-w-44"
          aria-hidden
        >
          <span
            className="block h-full origin-left rounded-full bg-deep-teal transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `scaleX(${scrollProgress})` }}
          />
        </div>
      </div>
    </section>
  );
}
