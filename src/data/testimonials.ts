import testimonialsJson from "@content/site/testimonials.json";

import type { Testimonial } from "@/types/site";

type TestimonialsData = {
  aggregateRating: {
    ratingValue: number;
    reviewCount: number;
  };
  testimonials: Testimonial[];
};

const testimonialsContent = testimonialsJson as TestimonialsData;

export const aggregateRating = testimonialsContent.aggregateRating;
export const testimonials = testimonialsContent.testimonials;
