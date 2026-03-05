export const tailoringHeroImage = "https://www.jasonbarbaro.com/assets/media/2020/05/t002.jpg";
export const tailoringInsetImage = "https://www.jasonbarbaro.com/assets/media/2020/06/h3_lg.jpg";

export const tailoringPillars = [
  {
    title: "Precision Measurement",
    copy: "We use a detailed multi-point measuring process to map posture, shoulder balance, and body shape before any cutting begins.",
  },
  {
    title: "Fit-First Patterning",
    copy: "Garment structure is built around your proportions and movement, not an off-the-rack block pattern.",
  },
  {
    title: "Refinement Appointments",
    copy: "Every fitting is focused on clean drape, sleeve break, trouser line, and comfort through the full range of motion.",
  },
  {
    title: "Long-Term Wardrobe Planning",
    copy: "We keep your fit profile on file so future pieces stay consistent as your wardrobe grows season after season.",
  },
] as const;

export const tailoringSteps = [
  {
    title: "Style Brief",
    copy: "We define your goals, preferred silhouette, and where the garment will be worn.",
  },
  {
    title: "Body Mapping",
    copy: "Comprehensive measurements and fit notes establish a profile unique to you.",
  },
  {
    title: "Construction & Alteration",
    copy: "Our team fine-tunes balance, shape, and drape to deliver a sharp but wearable result.",
  },
  {
    title: "Final Fit Session",
    copy: "You review the finished garment with styling guidance and optional follow-up adjustments.",
  },
] as const;

export const tailoringOptions = [
  {
    title: "Suits & Sport Coats",
    copy: "Seasonal fabrics, balanced canvassing, and silhouette options from modern trim to classic comfort.",
  },
  {
    title: "Trousers",
    copy: "Rise, taper, and hem break configured to your shoes and daily routine.",
  },
  {
    title: "Formalwear",
    copy: "Tuxedo and event tailoring with precise neckline, lapel, and waist treatment.",
  },
  {
    title: "Alteration Services",
    copy: "Expert adjustments for jackets, shirts, denim, and trousers to improve fit and longevity.",
  },
] as const;

const SWATCH_ROOT = "https://www.jasonbarbaro.com/assets/media/2020/05";

function swatch(sku: string) {
  return {
    sku,
    thumb: `${SWATCH_ROOT}/${sku}-700x525.jpg`,
    full: `${SWATCH_ROOT}/${sku}-1000x750.jpg`,
  };
}

export const tailoredSwatches = [
  swatch("01-01A1"),
  swatch("46-00A1"),
  swatch("46-00A3"),
  swatch("46-00A6"),
  swatch("63-00A2"),
  swatch("66-30A2"),
  swatch("66-22A5"),
  swatch("66-13A2"),
  swatch("66-10A2"),
  swatch("66-08A7"),
  swatch("66-07A6"),
  swatch("66-07A2"),
  swatch("66-06A8"),
  swatch("66-05A2"),
  swatch("66-04A1"),
  swatch("66-03A2"),
  swatch("66-02A0"),
  swatch("66-01A1"),
  swatch("66-00A6"),
  swatch("65-12A5"),
  swatch("65-00A2"),
  swatch("63-00A8"),
  swatch("66-81A2"),
  swatch("66-06A4"),
] as const;

export const tailoringFaqs = [
  {
    question: "How long does a tailored garment take?",
    answer:
      "Timing depends on the garment and season, but we review expected lead times during your consultation and plan fittings around your event date.",
  },
  {
    question: "Can I tailor an existing suit I already own?",
    answer:
      "Yes. We evaluate each piece and recommend the alterations that will produce the biggest fit improvement while maintaining garment integrity.",
  },
  {
    question: "Do I need an appointment for tailoring?",
    answer:
      "Appointments are strongly recommended so we can prepare fitting space, cloth options, and a stylist for dedicated one-on-one service.",
  },
  {
    question: "What should I bring to my fitting?",
    answer:
      "Bring dress shoes and key layering pieces you plan to wear. This helps us calibrate trouser break, sleeve length, and overall balance.",
  },
] as const;
