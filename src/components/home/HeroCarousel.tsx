"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { ButtonLink } from "@/components/ui/Button";
import type { HeroSlide } from "@/types/site";
import { cn } from "@/lib/utils";

type HeroCarouselProps = {
  slides: HeroSlide[];
  badges?: Array<{ label: string }>;
  secondaryCta?: { label: string; href: string };
};

type SwipeGesture = {
  pointerId: number;
  startX: number;
  startY: number;
  isDragging: boolean;
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
  const [transitionDirection, setTransitionDirection] = useState<-1 | 1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isPointerActive, setIsPointerActive] = useState(false);
  const swipeGestureRef = useRef<SwipeGesture | null>(null);
  const suppressClickRef = useRef(false);
  const isInteractionPaused = isHovered || isFocusWithin || isPointerActive;
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
      setTransitionDirection(1);
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
    setTransitionDirection(-1);
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }

  function showNextSlide() {
    setTransitionDirection(1);
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  function showSlide(index: number) {
    if (index === activeIndex) {
      return;
    }

    setTransitionDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (
      slides.length < 2 ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    swipeGestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      isDragging: false,
    };
    setIsPointerActive(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const gesture = swipeGestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId || gesture.isDragging) {
      return;
    }

    const horizontalDistance = Math.abs(event.clientX - gesture.startX);
    const verticalDistance = Math.abs(event.clientY - gesture.startY);

    if (horizontalDistance < 10 || horizontalDistance <= verticalDistance) {
      return;
    }

    gesture.isDragging = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    const gesture = swipeGestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId) {
      return;
    }

    swipeGestureRef.current = null;
    setIsPointerActive(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const horizontalDistance = gesture.startX - event.clientX;
    const verticalDistance = Math.abs(gesture.startY - event.clientY);
    const shouldChangeSlide =
      slides.length > 1 &&
      Math.abs(horizontalDistance) >= 48 &&
      Math.abs(horizontalDistance) > verticalDistance;

    if (gesture.isDragging || shouldChangeSlide) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    if (!shouldChangeSlide) {
      return;
    }

    if (horizontalDistance > 0) {
      showNextSlide();
    } else {
      showPreviousSlide();
    }
  }

  function handlePointerCancel(event: ReactPointerEvent<HTMLElement>) {
    if (swipeGestureRef.current?.pointerId !== event.pointerId) {
      return;
    }

    swipeGestureRef.current = null;
    setIsPointerActive(false);
  }

  function handlePointerLeave(event: ReactPointerEvent<HTMLElement>) {
    const gesture = swipeGestureRef.current;

    if (
      !gesture ||
      gesture.pointerId !== event.pointerId ||
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      return;
    }

    swipeGestureRef.current = null;
    setIsPointerActive(false);
  }

  return (
    <section
      aria-label="Featured collections"
      aria-roledescription="carousel"
      className="relative touch-pan-y overflow-hidden bg-[#0b0f14] text-white select-none [perspective:1600px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
      onDragStart={(event) => event.preventDefault()}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocusWithin(false);
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
              "absolute inset-0 overflow-hidden",
              isActive
                ? cn(
                    "z-[1] opacity-100",
                    transitionDirection === 1
                      ? "hero-page-turn hero-page-turn-next"
                      : "hero-page-turn hero-page-turn-previous",
                  )
                : "pointer-events-none opacity-0",
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
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(20,17,12,0.92),rgba(20,17,12,0.64)_48%,rgba(20,17,12,0.18))]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.02),rgba(11,15,20,0.62))]" />
            <div className="hero-page-fold absolute inset-0" aria-hidden />
          </article>
        );
      })}

      {slides.length > 1 ? (
        <div
          className="absolute top-4 right-4 z-20 flex items-center gap-px sm:top-6 sm:right-6 lg:top-8 lg:right-8"
          role="group"
          aria-label="Browse featured collections"
        >
          <button
            type="button"
            onClick={showPreviousSlide}
            className="inline-flex h-11 w-11 items-center justify-center border border-white/35 bg-[#14110c]/72 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/45"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={showNextSlide}
            className="inline-flex h-11 w-11 items-center justify-center border border-white/35 bg-[#14110c]/72 text-white backdrop-blur-sm transition-colors duration-200 hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/45"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-[540px] w-full items-end px-4 py-10 sm:min-h-[600px] sm:items-center sm:px-6 sm:py-14 lg:min-h-[680px] lg:px-8 lg:py-16 xl:px-10 2xl:px-12">
        <div className="w-full">
          <div key={activeSlide.id} className="hero-copy-enter max-w-4xl">
            <div className="flex flex-nowrap items-center gap-3 overflow-hidden border-y border-white/25 py-2 sm:w-fit sm:gap-4">
              {metadataBadges.map((badge, index) => (
                <span
                  key={badge.label}
                  className={cn(
                    "shrink-0 whitespace-nowrap text-xs font-semibold tracking-[0.16em] uppercase",
                    index === 0
                      ? "text-gold"
                      : "border-l border-white/30 pl-3 text-ivory/82 sm:pl-4",
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <h1 className="mt-6 max-w-5xl text-balance font-heading text-5xl leading-[0.94] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
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
                className="w-full rounded-none border border-ivory bg-ivory text-ink hover:border-gold hover:bg-gold sm:w-auto"
              >
                {getPrimaryCtaLabel(activeSlide)}
              </ButtonLink>
              <ButtonLink
                href={fallbackSecondaryCta.href}
                variant="secondary"
                size="lg"
                className="w-full rounded-none border-white/55 bg-transparent text-white hover:border-gold hover:bg-transparent hover:text-gold sm:w-auto"
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
                  onClick={() => showSlide(index)}
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
