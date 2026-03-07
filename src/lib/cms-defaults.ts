import { brands, featuredBrands } from "@/data/brands";
import { ctaTiles, heroSlides } from "@/data/home";
import { locations } from "@/data/locations";
import { menCategories } from "@/data/men-categories";
import type { NavItem } from "@/data/navigation";
import { primaryNavigation } from "@/data/navigation";
import { serviceHighlights, appointmentServices } from "@/data/services";
import { socialLinks } from "@/data/social";
import { tailoredSwatches, tailoringFaqs, tailoringHeroImage, tailoringInsetImage, tailoringOptions, tailoringPillars, tailoringSteps } from "@/data/tailored";
import { aggregateRating, testimonials } from "@/data/testimonials";
import { SITE_DESCRIPTION, SITE_NAME, SITE_OWNER } from "@/lib/constants";
import type { Brand, Location, MenCategory, SocialLink, Testimonial } from "@/types/site";

export type SiteSettingsContent = {
  siteName: string;
  siteOwner: string;
  siteDescription: string;
  logoUrl: string;
  socialLinks: SocialLink[];
  ratingValue: number;
  reviewCount: number;
  facebookLikes: number;
};

export type NavigationContent = {
  primaryNavigation: NavItem[];
  headerTopLinks: Array<{ label: string; href: string; external?: boolean }>;
  headerCtas: Array<{ label: string; href: string; external?: boolean }>;
  footerShoppingLinks: Array<{ label: string; href: string; external?: boolean }>;
  footerUtilityLinks: Array<{ label: string; href: string; external?: boolean }>;
  footerNewsletterTitle: string;
  footerNewsletterCopy: string;
};

export type HomePageContent = {
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
  heroTitle: string;
  heroDescription: string;
  heroBadges: Array<{ label: string }>;
  heroCtas: Array<{ label: string; href: string }>;
  heroSlides: typeof heroSlides;
  ctaTiles: typeof ctaTiles;
  retailBanner: {
    badge: string;
    title: string;
    description: string;
    buttons: Array<{ label: string; href: string }>;
  };
  tailorProcess: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ title: string; copy: string }>;
  };
  categoriesSection: {
    eyebrow: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
  };
  brandsSection: {
    eyebrow: string;
    title: string;
    description: string;
    buttons: Array<{ label: string; href: string }>;
  };
  appointmentPriority: {
    badge: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
    testimonialHeading: string;
  };
  locationsSection: {
    eyebrow: string;
    title: string;
    description: string;
  };
  journalSection: {
    eyebrow: string;
    title: string;
    description: string;
  };
};

export type AboutPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
  };
  overview: {
    badge: string;
    title: string;
    paragraphs: Array<{ copy: string }>;
    exploreLinks: Array<{ label: string; href: string }>;
  };
  founderSpotlight: {
    image: string;
    badge: string;
    title: string;
    paragraphs: Array<{ copy: string }>;
    buttons: Array<{ label: string; href: string }>;
  };
  pillars: Array<{ title: string; description: string }>;
  bottomCtaLabel: string;
  bottomCtaHref: string;
};

export type ServicesContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary?: { label: string; href: string };
    ctaSecondary?: { label: string; href: string };
  };
  serviceHighlights: Array<{ title: string; description: string }>;
  appointmentServices: string[];
  closingCta: {
    title: string;
    description: string;
    buttons: Array<{ label: string; href: string }>;
    footerLinkLabel: string;
    footerLinkHref: string;
  };
};

export type ContactPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
  };
  supportCard: {
    badge: string;
    title: string;
    description: string;
  };
  asideCta: {
    title: string;
    description: string;
    buttonLabel: string;
    buttonHref: string;
  };
};

export type ReviewsPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
  };
  aggregateLabel: string;
};

export type SchedulePageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
  };
};

export type RentalsPageContent = {
  metaTitle: string;
  metaDescription: string;
  heroImage: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
    ctaSecondary: { label: string; href: string };
  };
  catalogs: Array<{ id: string; title: string; description: string; href: string }>;
  featureCards: Array<{ title: string; description: string }>;
  closingCard: {
    title: string;
    description: string;
    buttons: Array<{ label: string; href: string }>;
    footerLinkLabel: string;
    footerLinkHref: string;
  };
};

export type WeddingPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
  };
  intakeCard: {
    badge: string;
    title: string;
    description: string;
  };
  nextSteps: Array<{ copy: string }>;
  catalogButtons: Array<{ label: string; href: string }>;
};

export type DesignersPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
  };
  cards: Array<{
    badge?: string;
    title: string;
    description: string;
    buttonLabel?: string;
    buttonHref?: string;
  }>;
  popularHeading: string;
};

export type ForMenPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
  };
  closingCardTitle: string;
  closingCardDescription: string;
  closingButtonLabel: string;
  closingButtonHref: string;
};

export type LocationsPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
    ctaPrimary: { label: string; href: string };
  };
  closingBadge: string;
  closingTitle: string;
  closingDescription: string;
  closingButtons: Array<{ label: string; href: string }>;
};

export type TailoredPageContent = {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaPrimary: { label: string; href: string };
  heroCtaSecondary: { label: string; href: string };
  heroHighlights: Array<{ title: string; copy: string }>;
  heroImage: string;
  insetImage: string;
  fitSection: {
    badge: string;
    title: string;
    description: string;
    introTitle: string;
    introCopy: string;
    pillars: Array<{ title: string; copy: string }>;
    buttons: Array<{ label: string; href: string }>;
  };
  processSection: {
    eyebrow: string;
    title: string;
    description: string;
    steps: Array<{ title: string; copy: string }>;
  };
  optionsSection: {
    eyebrow: string;
    title: string;
    description: string;
    options: Array<{ title: string; copy: string }>;
    insetBadge: string;
    insetTitle: string;
    insetCopy: string;
    insetButtons: Array<{ label: string; href: string }>;
  };
  swatchSection: {
    eyebrow: string;
    title: string;
    description: string;
  };
  faqSection: {
    eyebrow: string;
    title: string;
    description: string;
    faqs: Array<{ question: string; answer: string }>;
    closingTitle: string;
    closingDescription: string;
    closingButtons: Array<{ label: string; href: string }>;
  };
};

export type OurHistoryPageContent = {
  metaTitle: string;
  metaDescription: string;
  hero: {
    title: string;
    description: string;
  };
  milestones: Array<{ year: string; title: string; detail: string }>;
  closingTitle: string;
  closingDescription: string;
  closingButtonLabel: string;
  closingButtonHref: string;
};

export type PostIndexContent = {
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroDescription: string;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionDescription: string;
};

export const defaultSiteSettings: SiteSettingsContent = {
  siteName: SITE_NAME,
  siteOwner: SITE_OWNER,
  siteDescription: SITE_DESCRIPTION,
  logoUrl: "/images/remote/www.jasonbarbaro.com/assets/media/2020/05/logo_trans.png",
  socialLinks,
  ratingValue: aggregateRating.ratingValue,
  reviewCount: aggregateRating.reviewCount,
  facebookLikes: 4033,
};

export const defaultNavigation: NavigationContent = {
  primaryNavigation,
  headerTopLinks: [
    { label: "Shop Online", href: "/shop-coming-soon" },
    { label: "Schedule Appointment", href: "/schedule-appointment" },
    { label: "View Cart", href: "/cart" },
  ],
  headerCtas: [
    { label: "Shop Online", href: "/shop-coming-soon" },
    { label: "Book Appointment", href: "/schedule-appointment" },
  ],
  footerShoppingLinks: [
    { label: "Shop Online", href: "/shop-coming-soon" },
    { label: "Schedule Appointment", href: "/schedule-appointment" },
    { label: "Tuxedo Rentals", href: "/suit-tuxedo-rentals" },
    { label: "Register Wedding", href: "/register-your-wedding" },
    { label: "Sale Coming Soon", href: "/sale-coming-soon" },
    { label: "Cart", href: "/cart" },
  ],
  footerUtilityLinks: [
    { label: "Home", href: "/" },
    { label: "Our History", href: "/about/our-history" },
    { label: "Locations", href: "/locations" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Sitemap", href: "/sitemap" },
    { label: "XML", href: "/sitemap.xml" },
    { label: "RSS", href: "/rss.xml" },
    { label: "Terms", href: "/terms-of-use" },
    { label: "Privacy", href: "/privacy-policy" },
  ],
  footerNewsletterTitle: "Stay in the Loop",
  footerNewsletterCopy:
    "New arrivals, seasonal edits, and private appointment windows. Newsletter signup backend is coming soon.",
};

export const defaultHomePage: HomePageContent = {
  metaTitle: `${SITE_NAME} | Classic Tailoring & Luxury Menswear`,
  metaDescription:
    "Classic tailoring, designer menswear, and personal styling at J. Barbaro Clothiers. Book a one-on-one appointment in Metro Detroit.",
  heroImage: heroSlides[2].image,
  heroTitle: "Classic Tailoring for the Modern Gentleman",
  heroDescription:
    "An appointment-first menswear experience focused on precision fit, premium designer labels, and exceptional personal service.",
  heroBadges: [{ label: SITE_NAME }, { label: "Clinton Township" }, { label: "Auburn Hills" }],
  heroCtas: [
    { label: "Book an Appointment", href: "/schedule-appointment" },
    { label: "Shop Online", href: "/shop-coming-soon" },
    { label: "About Jason Barbaro", href: "/about" },
  ],
  heroSlides,
  ctaTiles,
  retailBanner: {
    badge: "Retail + Ecommerce",
    title: "Shop In-Store Today. Shop Online Next.",
    description:
      "We are building a full online store experience with premium product pages, concierge checkout support, and curated seasonal drops.",
    buttons: [
      { label: "Explore Online Shop", href: "/shop-coming-soon" },
      { label: "View Sale Preview", href: "/sale-coming-soon" },
      { label: "Tuxedo Catalogs", href: "/suit-tuxedo-rentals" },
    ],
  },
  tailorProcess: {
    eyebrow: "The Tailor’s Method",
    title: "A Proven Process for Elevated Fit",
    description:
      "Every appointment is intentionally structured so you leave with confidence, clarity, and garments that move with you.",
    items: [
      {
        title: "Consultation",
        copy: "We begin with your lifestyle, event calendar, and fit preferences.",
      },
      {
        title: "Measurement",
        copy: "Precise body mapping ensures structure, balance, and comfort.",
      },
      {
        title: "Refinement",
        copy: "Tailoring and finishing details deliver a polished final silhouette.",
      },
    ],
  },
  categoriesSection: {
    eyebrow: "Shop by Category",
    title: "Refined Menswear, Curated by Need",
    description:
      "Start with the category that fits your immediate goal, then book an appointment for expert recommendations.",
    buttonLabel: "View All Categories",
    buttonHref: "/for-men",
  },
  brandsSection: {
    eyebrow: "Featured Designers",
    title: "Luxury Labels We Trust",
    description:
      "Explore our featured designer lineup and discover the labels defining the season.",
    buttons: [
      { label: "View Featured Designers", href: "/designers/featured-designers" },
      { label: "Browse All Designers", href: "/designers/all-designer-brands" },
    ],
  },
  appointmentPriority: {
    badge: "Appointment Priority",
    title: "Bring Your Vision. We’ll Handle the Fit.",
    description:
      "The fastest way to build a wardrobe you actually wear is a focused appointment. We prepare options in your size, discuss your goals, and deliver a polished final fit.",
    buttonLabel: "Reserve Appointment",
    buttonHref: "/schedule-appointment",
    testimonialHeading: "Client Feedback",
  },
  locationsSection: {
    eyebrow: "Visit In Person",
    title: "Two Locations. One Consistent Standard.",
    description:
      "Choose the store that is most convenient and book ahead for a prepared fitting session.",
  },
  journalSection: {
    eyebrow: "Journal",
    title: "Style Guidance from the Floor",
    description: "Editorial insights on fit, tailoring, and seasonal wardrobe planning.",
  },
};

export const defaultAboutPage: AboutPageContent = {
  metaTitle: "About J. Barbaro Clothiers",
  metaDescription:
    "Learn about J. Barbaro Clothiers, our luxury menswear philosophy, and the personalized styling experience we deliver in Metro Detroit.",
  hero: {
    title: "About J. Barbaro Clothiers",
    description:
      "A modern clothier rooted in personal service, impeccable fit, and curated designer menswear.",
    ctaPrimary: { label: "Book an Appointment", href: "/schedule-appointment" },
    ctaSecondary: { label: "Our History", href: "/about/our-history" },
  },
  overview: {
    badge: "Who We Are",
    title: "Luxury Menswear with Human-Centered Service",
    paragraphs: [
      {
        copy:
          "J. Barbaro Clothiers serves Metro Detroit clients who value craftsmanship, presentation, and confidence. From first consultation through final fitting, every recommendation is designed around your goals.",
      },
      {
        copy:
          "We support executives, entrepreneurs, and event clients with full wardrobe strategy: tailored clothing, premium casualwear, and formalwear coordination.",
      },
    ],
    exploreLinks: [
      { label: "Our History", href: "/about/our-history" },
      { label: "Services", href: "/services" },
      { label: "Reviews", href: "/reviews" },
      { label: "Locations", href: "/locations" },
    ],
  },
  founderSpotlight: {
    image: "/images/remote/www.macombnowmagazine.com/wp-content/uploads/2017/09/fashion_bombaro.jpg",
    badge: "Founder Spotlight",
    title: "Jason Barbaro",
    paragraphs: [
      {
        copy:
          "Jason Barbaro founded J. Barbaro Clothiers with a simple principle: every client deserves expert fit guidance, elevated service, and wardrobe recommendations built around real life, not trends alone.",
      },
      {
        copy:
          "That founder-led mindset still drives the business today across both Metro Detroit locations, from tailored clothing and luxury menswear to wedding and formalwear styling.",
      },
    ],
    buttons: [
      { label: "Follow on Instagram", href: "https://www.instagram.com/j.barbaroclothiers/" },
      { label: "View Founder Post Feed", href: "https://www.instagram.com/j.barbaroclothiers/" },
    ],
  },
  pillars: [
    {
      title: "Personal Guidance",
      description:
        "Styling consultations rooted in fit, context, and your day-to-day lifestyle.",
    },
    {
      title: "Tailored Precision",
      description:
        "Alteration and made-to-fit services designed for confidence and movement.",
    },
    {
      title: "Curated Brands",
      description:
        "Seasonal collections chosen for fabric quality, drape, and modern versatility.",
    },
    {
      title: "Long-Term Partnership",
      description:
        "We help clients evolve wardrobes over time instead of one-off purchases.",
    },
  ],
  bottomCtaLabel: "Schedule a Styling Session",
  bottomCtaHref: "/schedule-appointment",
};

export const defaultServicesContent: ServicesContent = {
  metaTitle: "Menswear Services",
  metaDescription:
    "Explore premium menswear services at J. Barbaro Clothiers including personal styling, tailoring, formalwear, and wardrobe planning.",
  hero: {
    title: "Luxury Menswear Services",
    description:
      "From personalized styling to tailoring and formalwear planning, every service is built to improve fit, confidence, and convenience.",
    ctaPrimary: { label: "Book Service Appointment", href: "/schedule-appointment" },
  },
  serviceHighlights,
  appointmentServices,
  closingCta: {
    title: "Ready for a Focused Styling Session?",
    description:
      "Tell us your event, timeline, and style goals. We will prepare a curated session before you arrive.",
    buttons: [
      { label: "Schedule Appointment", href: "/schedule-appointment" },
      { label: "Ask a Question", href: "/contact-us" },
    ],
    footerLinkLabel: "See Client Reviews",
    footerLinkHref: "/reviews",
  },
};

export const defaultContactPage: ContactPageContent = {
  metaTitle: "Contact Us",
  metaDescription:
    "Contact J. Barbaro Clothiers for appointments, gift cards, tailoring questions, and menswear support.",
  hero: {
    title: "Contact Us",
    description: "Questions, gift cards, or fit support. Send a message or choose a location below.",
    ctaPrimary: { label: "Book Appointment Instead", href: "/schedule-appointment" },
  },
  supportCard: {
    badge: "Client Support",
    title: "Send Us a Message",
    description:
      "We typically respond quickly. For immediate styling help, booking an appointment is the fastest option.",
  },
  asideCta: {
    title: "Need a Faster Response?",
    description:
      "Scheduling an appointment is the fastest way to get personalized service and product recommendations.",
    buttonLabel: "Schedule Appointment",
    buttonHref: "/schedule-appointment",
  },
};

export const defaultReviewsPage: ReviewsPageContent = {
  metaTitle: "Customer Reviews",
  metaDescription:
    "Read verified customer testimonials and review insights for J. Barbaro Clothiers, rated 4.7/5 across Metro Detroit locations.",
  hero: {
    title: "Customer Reviews",
    description:
      "Our clients trust us for fit precision, professional guidance, and premium menswear service.",
    ctaPrimary: { label: "Book an Appointment", href: "/schedule-appointment" },
  },
  aggregateLabel: "Aggregate Rating",
};

export const defaultSchedulePage: SchedulePageContent = {
  metaTitle: "Schedule Appointment",
  metaDescription:
    "Schedule a menswear appointment at J. Barbaro Clothiers. Choose location, service type, and preferred date/time.",
  hero: {
    title: "Schedule an Appointment",
    description:
      "Reserve one-on-one time for styling, tailoring, event wear, or a complete wardrobe refresh.",
  },
};

export const defaultRentalsPage: RentalsPageContent = {
  metaTitle: "Wedding Suits & Tuxedos",
  metaDescription:
    "Explore tuxedo and wedding suit rentals or purchases at J. Barbaro Clothiers. View catalogs and register your wedding party.",
  heroImage: "/images/remote/www.barbaroformalwear.com/wp-content/uploads/2024/02/h3lg.jpg",
  hero: {
    title: "Rent or Purchase a Formal Look That Fits Perfectly",
    description:
      "Build your wedding party style with expert fit guidance, coordinated accessories, and a polished final presentation.",
    ctaPrimary: { label: "Register Your Wedding", href: "/register-your-wedding" },
    ctaSecondary: { label: "Book Formalwear Appointment", href: "/schedule-appointment" },
  },
  catalogs: [
    {
      id: "rentals",
      title: "Tuxedo & Suit Rental Catalog",
      description:
        "Explore rental-ready wedding and formalwear styles for grooms, groomsmen, and black-tie events.",
      href: "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_rental_final.pdf",
    },
    {
      id: "accessories",
      title: "Formal Accessory Catalog",
      description:
        "Coordinate ties, bow ties, pocket squares, and finishing details for a complete formal look.",
      href: "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_accessory_final.pdf",
    },
  ],
  featureCards: [
    {
      title: "Wedding Party Coordination",
      description:
        "Keep every groomsman aligned with a consistent style direction and sizing process.",
    },
    {
      title: "Luxury Fit Standards",
      description:
        "We focus on clean silhouette, event-appropriate styling, and final-detail polish.",
    },
  ],
  closingCard: {
    title: "Ready to Start?",
    description:
      "Register your wedding party today and our team will follow up with the next steps.",
    buttons: [
      { label: "Register Wedding", href: "/register-your-wedding" },
      { label: "Shop Online Preview", href: "/shop-coming-soon" },
    ],
    footerLinkLabel: "Go to Registration",
    footerLinkHref: "/register-your-wedding",
  },
};

export const defaultWeddingPage: WeddingPageContent = {
  metaTitle: "Register Your Wedding",
  metaDescription:
    "Register your wedding party with J. Barbaro Clothiers for tuxedo and suit rentals, fittings, and formal accessory coordination.",
  hero: {
    title: "Register Your Wedding",
    description:
      "Tell us your date, party size, and contact details. Our formalwear team will coordinate tuxedo/suit rental and purchase options for your full wedding party.",
    ctaPrimary: { label: "Browse Tuxedo Catalogs", href: "/suit-tuxedo-rentals" },
  },
  intakeCard: {
    badge: "Wedding Party Intake",
    title: "Secure Your Wedding Style Timeline Early",
    description:
      "Early registration gives your party more flexibility for fittings, style selections, and coordinated accessory matching.",
  },
  nextSteps: [
    { copy: "We contact you to confirm wedding details and timeline." },
    { copy: "We align your preferred showroom and fitting strategy." },
    { copy: "We help finalize tuxedo/suit styles and accessories." },
  ],
  catalogButtons: [
    {
      label: "Rental PDF",
      href: "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_rental_final.pdf",
    },
    {
      label: "Accessory PDF",
      href: "https://www.barbaroformalwear.com/wp-content/uploads/2024/02/jbarbaro_accessory_final.pdf",
    },
  ],
};

export const defaultDesignersPage: DesignersPageContent = {
  metaTitle: "Designer Brands",
  metaDescription:
    "Explore the designer brands carried at J. Barbaro Clothiers, including luxury tailoring, denim, shirting, and accessories.",
  hero: {
    title: "Designer Collections",
    description:
      "We curate globally respected menswear labels selected for quality, fit consistency, and wardrobe longevity.",
    ctaPrimary: { label: "Browse All Designers", href: "/designers/all-designer-brands" },
  },
  cards: [
    {
      badge: "Featured",
      title: "Featured Designers",
      description:
        "Our seasonal spotlight: the strongest luxury and performance-driven labels right now.",
      buttonLabel: "Explore Featured",
      buttonHref: "/designers/featured-designers",
    },
    {
      badge: "Directory",
      title: "All Designer Brands",
      description:
        "Use search and A-Z filtering to quickly find every designer available in-store.",
      buttonLabel: "Browse A-Z",
      buttonHref: "/designers/all-designer-brands",
    },
    {
      title: "Need Brand Recommendations?",
      description:
        "Book a consultation and we'll build a shortlist around your fit profile, style goals, and budget.",
      buttonLabel: "Book Styling Session",
      buttonHref: "/schedule-appointment",
    },
  ],
  popularHeading: "Popular Designer Profiles",
};

export const defaultForMenPage: ForMenPageContent = {
  metaTitle: "For Men Collections",
  metaDescription:
    "Browse designer menswear categories including suits, dress shirts, denim, footwear, accessories, and more.",
  hero: {
    title: "For Men",
    description:
      "Explore premium menswear categories curated for business, occasion, and elevated daily style.",
    ctaPrimary: { label: "Book a Styling Session", href: "/schedule-appointment" },
  },
  closingCardTitle: "Need Direction on Where to Start?",
  closingCardDescription:
    "If you're refreshing your wardrobe or dressing for an upcoming event, our team can build a category-by-category plan around your needs.",
  closingButtonLabel: "Schedule Appointment",
  closingButtonHref: "/schedule-appointment",
};

export const defaultLocationsPageContent: LocationsPageContent = {
  metaTitle: "Store Locations",
  metaDescription:
    "Visit J. Barbaro Clothiers at The Mall at Partridge Creek and Great Lakes Crossing Outlet in Metro Detroit.",
  hero: {
    title: "Our Locations",
    description:
      "Visit either Metro Detroit store location for personalized menswear service, tailoring, and formalwear guidance.",
    ctaPrimary: { label: "Book Store Appointment", href: "/schedule-appointment" },
  },
  closingBadge: "Store Visit Strategy",
  closingTitle: "Plan the Right Store Visit",
  closingDescription:
    "Book ahead and our team will prepare selections in your size for tailored clothing, designer labels, and event-ready formalwear.",
  closingButtons: [
    { label: "Schedule Appointment", href: "/schedule-appointment" },
    { label: "Explore Tuxedos", href: "/suit-tuxedo-rentals" },
  ],
};

export const defaultTailoredPage: TailoredPageContent = {
  metaTitle: "Tailored Clothing & Made-to-Measure Fittings",
  metaDescription:
    "Discover precision tailoring at J. Barbaro Clothiers with fit-first consultations, made-to-measure services, and expert alterations.",
  heroTitle: "Tailored Clothing",
  heroDescription:
    "A fit-first tailoring experience built around your body, your style goals, and how you actually live.",
  heroCtaPrimary: { label: "Book Tailoring Consultation", href: "/schedule-appointment" },
  heroCtaSecondary: { label: "Choose Your Location", href: "/locations" },
  heroHighlights: [
    {
      title: "Style Brief",
      copy: "Consultation based on your wardrobe goals and event needs.",
    },
    {
      title: "Precision Measuring",
      copy: "Body mapping and fit diagnostics for clean, confident drape.",
    },
    {
      title: "Final Refinement",
      copy: "Final fitting and styling guidance before pickup or event day.",
    },
  ],
  heroImage: tailoringHeroImage,
  insetImage: tailoringInsetImage,
  fitSection: {
    badge: "Best Fit Standard",
    title: "How We Deliver the Best Fit Possible",
    description:
      "We combine traditional tailoring standards with modern fit diagnostics so your garments look sharp and feel effortless all day.",
    introTitle: "Tailoring Designed Around You",
    introCopy:
      "The goal is simple: a garment that reads polished from every angle and remains comfortable in motion. Each appointment is one-on-one and tailored to your build, preferences, and schedule.",
    pillars: tailoringPillars.map((item) => ({ ...item })),
    buttons: [
      { label: "Reserve Appointment", href: "/schedule-appointment" },
      { label: "View Services", href: "/services" },
    ],
  },
  processSection: {
    eyebrow: "Fit Method",
    title: "A Structured Process from Consultation to Final Press",
    description:
      "Our process is consistent, transparent, and designed to reduce guesswork while maximizing fit confidence.",
    steps: tailoringSteps.map((item) => ({ ...item })),
  },
  optionsSection: {
    eyebrow: "Custom Options",
    title: "Build a Wardrobe with Better Structure and Better Wear",
    description:
      "From daily business pieces to wedding formalwear, we tailor garments with balance, proportion, and longevity in mind.",
    options: tailoringOptions.map((item) => ({ ...item })),
    insetBadge: "Ready to Start",
    insetTitle: "Book Your Fitting Session",
    insetCopy:
      "We will prepare options in your size and style range before you arrive so your appointment is focused and efficient.",
    insetButtons: [
      { label: "Schedule Appointment", href: "/schedule-appointment" },
      { label: "Visit Locations", href: "/locations" },
    ],
  },
  swatchSection: {
    eyebrow: "Tailored Swatches",
    title: "Explore a Sample of Available Cloth Patterns",
    description:
      "Preview selected swatches below. During your appointment, we can review a broader swatch book and recommend the right weights and weaves.",
  },
  faqSection: {
    eyebrow: "Tailoring FAQ",
    title: "Common Questions Before You Book",
    description: "Everything you need to know before your first fitting appointment.",
    faqs: tailoringFaqs.map((item) => ({ ...item })),
    closingTitle: "Bring Your Vision. We'll Handle the Fit.",
    closingDescription:
      "Book a one-on-one appointment and our team will prepare garments and fabric options for your goals before you arrive.",
    closingButtons: [
      { label: "Reserve Appointment", href: "/schedule-appointment" },
      { label: "Ask a Question", href: "/contact-us" },
    ],
  },
};

export const defaultOurHistoryPage: OurHistoryPageContent = {
  metaTitle: "Our History",
  metaDescription:
    "Read the story behind J. Barbaro Clothiers and how our heritage in premium menswear continues to shape service today.",
  hero: {
    title: "Our History",
    description:
      "A legacy of style, fit, and personal service carried forward with a modern menswear perspective.",
  },
  milestones: [
    {
      year: "Foundation",
      title: "Built on Fit-First Service",
      detail:
        "J. Barbaro Clothiers began with a commitment to expert fit guidance and personalized menswear recommendations.",
    },
    {
      year: "Growth",
      title: "Expanding Across Metro Detroit",
      detail:
        "As demand grew, additional location coverage made premium styling and tailoring more accessible.",
    },
    {
      year: "Today",
      title: "Luxury Retail, Modern Experience",
      detail:
        "The brand continues to merge old-school service values with contemporary designer curation and digital convenience.",
    },
  ],
  closingTitle: "Experience the Next Chapter",
  closingDescription:
    "Book a one-on-one appointment and experience our modern approach to luxury menswear, tailoring, and wardrobe planning.",
  closingButtonLabel: "Book an Appointment",
  closingButtonHref: "/schedule-appointment",
};

export const defaultBlogIndex: PostIndexContent = {
  metaTitle: "Blog",
  metaDescription:
    "Menswear insights, tailoring guides, and seasonal updates from J. Barbaro Clothiers.",
  heroTitle: "Blog",
  heroDescription:
    "Menswear insight from our team on fit, tailoring, seasonal transitions, and occasion styling.",
  sectionEyebrow: "Editorial Journal",
  sectionTitle: "Latest Stories",
  sectionDescription:
    "Practical advice and inspiration designed for modern professional wardrobes.",
};

export const defaultStyleGuideIndex: PostIndexContent = {
  metaTitle: "Style Guide",
  metaDescription:
    "Practical style guides for building a modern menswear wardrobe, from business casual to event-ready looks.",
  heroTitle: "Style Guide",
  heroDescription:
    "Actionable frameworks from our stylists to help you dress well with less effort and better consistency.",
  sectionEyebrow: "Practical Styling",
  sectionTitle: "Guides You Can Apply Today",
  sectionDescription:
    "From business casual planning to event dressing, each guide is built for real-world use.",
};

export const defaultBrands: Brand[] = brands;
export const defaultFeaturedBrands: Brand[] = featuredBrands;
export const defaultLocations: Location[] = locations;
export const defaultCategories: MenCategory[] = menCategories;
export const defaultTestimonials: Testimonial[] = testimonials;
export const defaultSwatches = tailoredSwatches;
