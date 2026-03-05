import type { Testimonial } from "@/types/site";

export const aggregateRating = {
  ratingValue: 4.7,
  reviewCount: 234,
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Michael R.",
    rating: 5,
    locationSlug: "partridge-creek",
    quote:
      "Jason and the team made the entire process seamless. My tailored suit fits perfectly and the service feels truly personal.",
    date: "2025-11-12",
  },
  {
    id: "t2",
    name: "Anthony S.",
    rating: 5,
    locationSlug: "great-lakes-crossing-outlet",
    quote:
      "Excellent selection of designer brands and great guidance on fit. I walked out with a complete look for multiple events.",
    date: "2025-09-22",
  },
  {
    id: "t3",
    name: "David P.",
    rating: 4,
    locationSlug: "partridge-creek",
    quote:
      "Professional staff, quality tailoring, and fast turnaround for wedding attire. Highly recommend scheduling an appointment.",
    date: "2025-08-18",
  },
  {
    id: "t4",
    name: "Chris L.",
    rating: 5,
    locationSlug: "great-lakes-crossing-outlet",
    quote:
      "From denim to formalwear, everything is curated at a higher level than typical retail stores. Worth the drive.",
    date: "2025-07-09",
  },
  {
    id: "t5",
    name: "Ryan M.",
    rating: 5,
    locationSlug: "partridge-creek",
    quote:
      "Best menswear experience in Metro Detroit. Honest recommendations and impeccable alterations.",
    date: "2025-06-02",
  },
];
