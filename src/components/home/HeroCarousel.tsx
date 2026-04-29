"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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

  if (slide.title.toLowerCase().includes("$299")) {
    return "Shop Suits";
  }

  return "Shop Now";
}

export function HeroCarousel({ slides, badges = [], secondaryCta }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[activeIndex];
  const slideCounter = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  const fallbackSecondaryCta = secondaryCta ?? { label: "Book Appointment", href: "/schedule-appointment" };

  return (
    <section className="relative overflow-hidden bg-[#0b0f14] text-white">
      {slides.map((slide, index) => {
        const isActive = index === activeIndex;

        return (
          <article
            key={slide.id}
            aria-hidden={!isActive}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              isActive ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,15,20,0.88),rgba(11,15,20,0.64)_48%,rgba(11,15,20,0.2))]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.04),rgba(11,15,20,0.56))]" />
          </article>
        );
      })}

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
            className="absolute top-1/2 left-3 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-[#0b0f14]/72 text-white transition-colors hover:border-gold hover:text-gold sm:left-5 sm:h-11 sm:w-11"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
            className="absolute top-1/2 right-3 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-[#0b0f14]/72 text-white transition-colors hover:border-gold hover:text-gold sm:right-5 sm:h-11 sm:w-11"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl items-end px-4 py-12 sm:min-h-[580px] sm:items-center sm:px-6 sm:py-16 lg:min-h-[620px] lg:px-8 lg:py-20">
        <div className="w-full">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {badges.map((badge, index) =>
                index === 0 ? (
                  <Badge
                    key={badge.label}
                    variant="gold"
                    className="border-gold/95 bg-gold px-4 py-1.5 text-[0.72rem] font-bold tracking-[0.12em] text-ink shadow-[0_8px_24px_-12px_rgba(0,0,0,0.85)] sm:text-xs"
                  >
                    {badge.label}
                  </Badge>
                ) : (
                  <span
                    key={badge.label}
                    className="rounded-full border border-ivory/20 bg-ivory/8 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.12em] text-ivory/82 uppercase backdrop-blur-sm sm:text-[11px]"
                  >
                    {badge.label}
                  </span>
                ),
              )}
              <span className="rounded-md border border-white/18 bg-[#0b0f14]/45 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.16em] text-white/82 uppercase backdrop-blur-sm sm:text-[11px]">
                {slideCounter}
              </span>
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
            <div className="mt-9 flex flex-wrap gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show ${slide.title}`}
                  className={cn(
                    "h-1.5 w-10 rounded-full transition-colors",
                    index === activeIndex ? "bg-gold" : "bg-white/35 hover:bg-white/65",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
