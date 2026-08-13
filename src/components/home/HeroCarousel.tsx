"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from "react";

import { ButtonLink } from "@/components/ui/Button";
import type { HeroSlide } from "@/types/site";
import { cn } from "@/lib/utils";

type HeroCarouselProps = {
  slides: HeroSlide[];
  badges?: Array<{ label: string }>;
  secondaryCta?: { label: string; href: string };
};

function getPrimaryCtaLabel(slide: HeroSlide) {
  if (slide.href === "/register-your-wedding") {
    return "Register Wedding";
  }

  if (slide.href === "/schedule-appointment") {
    return "Book Appointment";
  }

  if (slide.href === "/tailored-clothing") {
    return "Explore Tailoring";
  }

  if (slide.href === "/suit-tuxedo-rentals") {
    return "View Rentals";
  }

  if (slide.href.startsWith("/location/")) {
    return "Explore the Store";
  }

  if (slide.title.toLowerCase().includes("$299")) {
    return "Shop Suits";
  }

  return "Shop Now";
}

function getImagePosition(slide: HeroSlide) {
  switch (slide.mobileFocalPoint) {
    case "left":
      return "object-left sm:object-center";
    case "right":
      return "object-right sm:object-center";
    case "right-quarter":
      return "object-[78%_center] sm:object-center";
    default:
      return "object-center";
  }
}

export function HeroCarousel({ slides, badges = [], secondaryCta }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteractionPaused, setIsInteractionPaused] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const metadataBadges = badges.filter(
    ({ label }) => !/j\.\s*barbaro clothiers|since\s+1998/i.test(label.trim()),
  );

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      if (reducedMotion.matches) {
        setIsPaused(true);
      }
    };

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => reducedMotion.removeEventListener("change", syncMotionPreference);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || isPaused || isInteractionPaused) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [isInteractionPaused, isPaused, slides.length]);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[activeIndex];
  const nextSlide = slides.length > 1 ? slides[(activeIndex + 1) % slides.length] : null;
  const renderedSlides = nextSlide ? [activeSlide, nextSlide] : [activeSlide];
  const fallbackSecondaryCta = secondaryCta ?? {
    label: "Book Appointment",
    href: "/schedule-appointment",
  };

  function showPreviousSlide() {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNextSlide() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  function handleTouchStart(event: ReactTouchEvent<HTMLElement>) {
    if (event.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsInteractionPaused(true);
  }

  function handleTouchEnd(event: ReactTouchEvent<HTMLElement>) {
    const touchStart = touchStartRef.current;
    const touchEnd = event.changedTouches[0];

    touchStartRef.current = null;
    setIsInteractionPaused(false);

    if (!touchStart || !touchEnd || slides.length < 2) {
      return;
    }

    const horizontalDistance = touchStart.x - touchEnd.clientX;
    const verticalDistance = Math.abs(touchStart.y - touchEnd.clientY);

    if (Math.abs(horizontalDistance) < 48 || Math.abs(horizontalDistance) <= verticalDistance) {
      return;
    }

    if (horizontalDistance > 0) {
      showNextSlide();
    } else {
      showPreviousSlide();
    }
  }

  function handleTouchCancel() {
    touchStartRef.current = null;
    setIsInteractionPaused(false);
  }

  return (
    <section
      aria-label="Featured collections"
      aria-roledescription="carousel"
      className="relative touch-pan-y overflow-hidden bg-[#0b0f14] text-white"
      onMouseEnter={() => setIsInteractionPaused(true)}
      onMouseLeave={() => setIsInteractionPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onFocusCapture={() => setIsInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsInteractionPaused(false);
        }
      }}
    >
      {renderedSlides.map((slide, index) => {
        const isActive = index === 0;

        return (
          <article
            key={slide.id}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              isActive ? "hero-slide-enter opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <Image
              src={slide.image}
              alt={isActive ? slide.imageAlt : ""}
              fill
              priority={activeIndex === 0 && isActive}
              quality={92}
              sizes="100vw"
              className={cn("object-cover", getImagePosition(slide))}
            />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,15,20,0.9),rgba(11,15,20,0.66)_48%,rgba(11,15,20,0.22))]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.04),rgba(11,15,20,0.58))]" />
          </article>
        );
      })}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={showPreviousSlide}
            className="absolute top-1/2 left-5 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-[#0b0f14]/72 text-white transition-colors hover:border-gold hover:text-gold 2xl:inline-flex"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={showNextSlide}
            className="absolute top-1/2 right-5 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-[#0b0f14]/72 text-white transition-colors hover:border-gold hover:text-gold 2xl:inline-flex"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl items-end px-4 py-12 sm:min-h-[580px] sm:items-center sm:px-6 sm:py-16 lg:min-h-[620px] lg:px-8 lg:py-20">
        <div className="w-full">
          <div className="max-w-3xl">
            <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden sm:gap-2">
              {metadataBadges.map((badge, index) => (
                <span
                  key={badge.label}
                  className={cn(
                    "shrink-0 whitespace-nowrap border px-2.5 py-1 text-xs font-semibold tracking-[0.1em] uppercase backdrop-blur-sm sm:px-3 sm:py-1.5 sm:tracking-[0.12em]",
                    index === 0
                      ? "border-gold bg-gold font-bold text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.85)]"
                      : "border-white/25 border-l-2 border-l-gold/90 bg-[#0b0f14]/55 text-ivory/82",
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <h1 className="mt-6 max-w-4xl text-balance font-heading text-[2.8rem] leading-[0.98] sm:text-6xl lg:text-7xl">
              {activeSlide.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-[0.98rem] leading-7 text-white/84 sm:text-lg sm:leading-8">
              {activeSlide.caption}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink
                href={activeSlide.href}
                target={activeSlide.external ? "_blank" : undefined}
                rel={activeSlide.external ? "noopener noreferrer" : undefined}
                size="lg"
                className="w-full sm:w-auto"
              >
                {getPrimaryCtaLabel(activeSlide)}
              </ButtonLink>
              <ButtonLink
                href={fallbackSecondaryCta.href}
                variant="secondary"
                size="lg"
                className="w-full border-white/70 bg-transparent text-white hover:border-gold hover:bg-transparent hover:text-gold sm:w-auto"
              >
                {fallbackSecondaryCta.label}
              </ButtonLink>
            </div>
          </div>

          {slides.length > 1 ? (
            <div className="mt-7 flex flex-wrap sm:mt-9">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show slide ${index + 1}: ${slide.title}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  className="group inline-flex h-11 w-11 items-center justify-center"
                >
                  <span
                    className={cn(
                      "h-1.5 w-9 rounded-full transition-colors",
                      index === activeIndex ? "bg-gold" : "bg-white/35 group-hover:bg-white/65",
                    )}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsPaused((paused) => !paused)}
                className="ml-1 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/25 bg-ink/45 px-3 text-xs font-semibold tracking-[0.12em] text-white uppercase transition-colors hover:border-gold hover:text-gold"
                aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Pause className="h-3.5 w-3.5" aria-hidden />
                )}
                {isPaused ? "Play" : "Pause"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
