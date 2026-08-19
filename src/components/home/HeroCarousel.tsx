"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { ButtonLink } from "@/components/ui/Button";
import type { HeroSlide } from "@/types/site";
import { cn } from "@/lib/utils";

type HeroCarouselProps = {
  slides: HeroSlide[];
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

  if (slide.href.startsWith("/shop/brands/")) {
    return slide.title.startsWith("Shop ") ? slide.title : "Shop Brand";
  }

  if (slide.title.toLowerCase().includes("save") && slide.href.startsWith("/shop/")) {
    return "Shop This Deal";
  }

  if (slide.title.toLowerCase().includes("$299")) {
    return "Shop Suits";
  }

  return "Shop Now";
}

function getImagePosition(slide: HeroSlide) {
  if (slide.imageFit === "contain-right") {
    return "object-center sm:object-contain sm:object-right";
  }

  const desktopImagePosition =
    slide.desktopImagePosition === "slightly-up"
      ? "sm:object-[center_55%]"
      : slide.desktopImagePosition === "slightly-down"
        ? "sm:object-[center_45%]"
        : "sm:object-center";

  switch (slide.mobileFocalPoint) {
    case "left":
      return `object-left ${desktopImagePosition}`;
    case "right":
      return `object-right ${desktopImagePosition}`;
    case "right-quarter":
      return `object-[78%_center] ${desktopImagePosition}`;
    default:
      return `object-center ${desktopImagePosition}`;
  }
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState<-1 | 1>(1);
  const swipeGestureRef = useRef<SwipeGesture | null>(null);
  const suppressClickRef = useRef(false);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[activeIndex];
  const nextSlide = slides.length > 1 ? slides[(activeIndex + 1) % slides.length] : null;
  const renderedSlides = nextSlide ? [activeSlide, nextSlide] : [activeSlide];

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
  }

  return (
    <section
      aria-label="Featured collections"
      aria-roledescription="carousel"
      className="relative touch-pan-y overflow-hidden bg-[#0b0f14] text-white select-none [perspective:1600px]"
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

      <div className="relative z-10 flex min-h-[540px] w-full items-end px-4 pt-10 pb-20 sm:min-h-[600px] sm:items-center sm:px-6 sm:py-14 lg:min-h-[680px] lg:px-8 lg:py-16 xl:px-10 2xl:px-12">
        <div className="w-full">
          <div key={activeSlide.id} className="hero-copy-enter max-w-4xl">
            {activeSlide.logo ? (
              <h1 className="relative -my-8 h-40 w-48 overflow-hidden sm:-my-10 sm:h-48 sm:w-56">
                <Image
                  src={activeSlide.logo}
                  alt={activeSlide.logoAlt || activeSlide.title}
                  fill
                  sizes="(max-width: 640px) 12rem, 14rem"
                  className="object-contain invert mix-blend-screen"
                />
              </h1>
            ) : (
              <h1 className="max-w-5xl text-balance font-heading text-5xl leading-[0.94] tracking-[-0.025em] sm:text-6xl lg:text-7xl">
                {activeSlide.title}
              </h1>
            )}
            <p className="mt-5 hidden max-w-2xl text-pretty text-[0.98rem] leading-7 text-white/84 sm:block sm:text-lg sm:leading-8">
              {activeSlide.caption}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              <ButtonLink
                href={activeSlide.href}
                target={activeSlide.external ? "_blank" : undefined}
                rel={activeSlide.external ? "noopener noreferrer" : undefined}
                size="lg"
                className="w-full rounded-none border border-ivory bg-ivory text-ink hover:border-gold hover:bg-gold sm:w-auto"
              >
                {getPrimaryCtaLabel(activeSlide)}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 ? (
        <div
          className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2"
          role="group"
          aria-label="Choose featured collection"
        >
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
        </div>
      ) : null}
    </section>
  );
}
