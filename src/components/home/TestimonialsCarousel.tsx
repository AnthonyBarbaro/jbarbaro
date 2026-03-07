"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { Testimonial } from "@/types/site";
import { formatDate } from "@/lib/utils";

type TestimonialsCarouselProps = {
  aggregateRating: {
    ratingValue: number;
    reviewCount: number;
  };
  testimonials: Testimonial[];
};

export function TestimonialsCarousel({ aggregateRating, testimonials }: TestimonialsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((index) => (index + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (!testimonials.length) {
    return null;
  }

  const active = testimonials[activeIndex];

  return (
    <section className="bg-ink py-16 text-ivory sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:px-8">
        <div>
          <Badge variant="gold">Social Proof</Badge>
          <h2 className="mt-4 font-heading text-4xl leading-tight sm:text-5xl">Trusted by Metro Detroit</h2>
          <p className="mt-4 text-base leading-8 text-ivory/78">
            Our personalized fit process is reflected in every review.
          </p>
          <p className="mt-5 text-3xl font-semibold text-gold">
            {aggregateRating.ratingValue} <span className="text-base text-ivory/70">({aggregateRating.reviewCount} reviews)</span>
          </p>
          <div className="mt-3 flex items-center gap-1 text-gold">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <ButtonLink href="/reviews" variant="secondary" className="mt-7 border-ivory/80 text-ivory hover:border-gold hover:text-gold">
            Read All Reviews
          </ButtonLink>
        </div>

        <div className="rounded-3xl border border-ivory/18 bg-ivory/8 p-8">
          <div className="flex items-center gap-1 text-gold">
            {Array.from({ length: active.rating }).map((_, index) => (
              <Star key={index} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <blockquote className="mt-4 font-heading text-3xl leading-tight text-ivory/95">“{active.quote}”</blockquote>
          <p className="mt-6 text-sm font-semibold tracking-[0.14em] text-ivory uppercase">{active.name}</p>
          <p className="mt-1 text-xs text-ivory/60">{formatDate(active.date)}</p>
          <Link href="/schedule-appointment" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-gold uppercase hover:text-ivory">
            Book Your Appointment
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <div className="mt-6 flex gap-2">
            {testimonials.map((item, index) => (
              <button
                type="button"
                key={item.id}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-9 bg-gold" : "w-2.5 bg-ivory/35"}`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
