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
  if (slide.href === "/tailored-clothing") {
    return "Explore Tailoring";
  }

  if (slide.href === "/suit-tuxedo-rentals") {
    return "View Formalwear";
  }

  if (slide.title.toLowerCase().includes("$299")) {
    return "Shop the Offer";
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
    <section className="relative min-h-[640px] overflow-hidden bg-ink text-ivory sm:min-h-[700px]">
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
            <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(11,15,20,0.97),rgba(11,15,20,0.74)_42%,rgba(11,15,20,0.36)_72%,rgba(11,15,20,0.12))]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,15,20,0.16),rgba(11,15,20,0.18)_45%,rgba(11,15,20,0.76))]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(199,164,106,0.22),transparent_28%)]" />
          </article>
        );
      })}

      <button
        type="button"
        onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/20 bg-ink/72 text-ivory transition-colors hover:border-gold hover:text-gold sm:left-5 sm:h-12 sm:w-12"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
        className="absolute right-3 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/20 bg-ink/72 text-ivory transition-colors hover:border-gold hover:text-gold sm:right-5 sm:h-12 sm:w-12"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="relative z-10 mx-auto flex min-h-[640px] max-w-7xl items-end px-4 py-14 sm:min-h-[700px] sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="w-full">
          <div className="max-w-4xl">
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
              <span className="rounded-full border border-ivory/18 bg-ink/45 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.16em] text-ivory/82 uppercase backdrop-blur-sm sm:text-[11px]">
                {slideCounter}
              </span>
            </div>

            <p className="mt-6 text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">Campaign spotlight</p>
            <h1 className="mt-4 max-w-4xl text-balance font-heading text-[2.8rem] leading-[0.98] sm:text-6xl lg:text-7xl">
              {activeSlide.title}
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-[0.98rem] leading-7 text-ivory/84 sm:text-lg sm:leading-8">
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
                className="w-full border-ivory/70 text-ivory hover:border-gold hover:bg-transparent hover:text-gold sm:w-auto"
              >
                {fallbackSecondaryCta.label}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
