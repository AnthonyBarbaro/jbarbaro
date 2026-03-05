"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { HeroSlide } from "@/types/site";
import { cn } from "@/lib/utils";

type HeroCarouselProps = {
  slides: HeroSlide[];
};

export function HeroCarousel({ slides }: HeroCarouselProps) {
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

  return (
    <section className="relative h-[78svh] min-h-[560px] w-full overflow-hidden">
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
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(11,15,20,0.84),rgba(11,15,20,0.55)_40%,rgba(11,15,20,0.26)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(199,164,106,0.2),transparent_28%)]" />
          </article>
        );
      })}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-14 sm:px-6 sm:pb-18 lg:px-8">
        <div className="w-full max-w-4xl text-ivory">
          <Badge variant="gold">Luxury Menswear in Metro Detroit</Badge>
          <h1 className="mt-6 font-heading text-4xl leading-tight sm:text-5xl lg:text-7xl">
            Tailored Confidence. <span className="text-gold">Modern Menswear.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-ivory/82 sm:text-lg">
            Discover designer collections, precision tailoring, and one-on-one styling built around your lifestyle.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/schedule-appointment" size="lg">
              Book an Appointment
            </ButtonLink>
            <ButtonLink href="/for-men" variant="secondary" size="lg" className="border-ivory/80 text-ivory hover:border-gold hover:text-gold">
              Explore Collections
            </ButtonLink>
          </div>

          <Link
            href={activeSlide.href}
            target={activeSlide.external ? "_blank" : undefined}
            rel={activeSlide.external ? "noopener noreferrer" : undefined}
            className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-ivory/90 hover:text-gold"
          >
            Featured: {activeSlide.title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="absolute right-4 bottom-6 z-20 flex items-center gap-2 sm:right-6 lg:right-8">
        <button
          type="button"
          onClick={() => setActiveIndex((current) => (current - 1 + slides.length) % slides.length)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/35 bg-ink/40 text-ivory backdrop-blur hover:border-gold hover:text-gold"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveIndex((current) => (current + 1) % slides.length)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ivory/35 bg-ink/40 text-ivory backdrop-blur hover:border-gold hover:text-gold"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-6 left-4 z-20 flex items-center gap-2 sm:left-6 lg:left-8">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-2.5 rounded-full transition-all",
              index === activeIndex ? "w-10 bg-gold" : "w-2.5 bg-ivory/70",
            )}
            aria-label={`Show slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
