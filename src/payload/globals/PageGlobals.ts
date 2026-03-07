import type { GlobalConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

const ctaFields = [
  {
    name: "label",
    type: "text" as const,
  },
  {
    name: "href",
    type: "text" as const,
  },
];

function pageHeroFields() {
  return [
    {
      name: "title",
      type: "text" as const,
      required: true,
    },
    {
      name: "description",
      type: "textarea" as const,
      required: true,
    },
    {
      name: "ctaPrimary",
      type: "group" as const,
      fields: ctaFields,
    },
    {
      name: "ctaSecondary",
      type: "group" as const,
      fields: ctaFields,
    },
  ];
}

function standardGlobal(slug: string, fields: GlobalConfig["fields"]): GlobalConfig {
  return {
    slug,
    access: {
      read: publicRead,
      update: isEditor,
    },
    fields,
    versions: {
      drafts: true,
    },
  };
}

export const HomePage: GlobalConfig = standardGlobal("home-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroImage",
    type: "text",
    required: true,
  },
  {
    name: "heroTitle",
    type: "text",
    required: true,
  },
  {
    name: "heroDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroBadges",
    type: "array",
    fields: [
      {
        name: "label",
        type: "text",
        required: true,
      },
    ],
  },
  {
    name: "heroCtas",
    type: "array",
    fields: ctaFields,
  },
  {
    name: "retailBanner",
    type: "group",
    fields: [
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttons",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
  {
    name: "tailorProcess",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "items",
        type: "array",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "copy",
            type: "textarea",
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "categoriesSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttonLabel",
        type: "text",
        required: true,
      },
      {
        name: "buttonHref",
        type: "text",
        required: true,
      },
    ],
  },
  {
    name: "brandsSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttons",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
  {
    name: "appointmentPriority",
    type: "group",
    fields: [
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttonLabel",
        type: "text",
        required: true,
      },
      {
        name: "buttonHref",
        type: "text",
        required: true,
      },
      {
        name: "testimonialHeading",
        type: "text",
        required: true,
      },
    ],
  },
  {
    name: "locationsSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "journalSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
]);

export const AboutPage: GlobalConfig = standardGlobal("about-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "overview",
    type: "group",
    fields: [
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "paragraphs",
        type: "array",
        fields: [
          {
            name: "copy",
            type: "textarea",
            required: true,
          },
        ],
      },
      {
        name: "exploreLinks",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
  {
    name: "founderSpotlight",
    type: "group",
    fields: [
      {
        name: "image",
        type: "text",
        required: true,
      },
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "paragraphs",
        type: "array",
        fields: [
          {
            name: "copy",
            type: "textarea",
            required: true,
          },
        ],
      },
      {
        name: "buttons",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
  {
    name: "pillars",
    type: "array",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "bottomCtaLabel",
    type: "text",
    required: true,
  },
  {
    name: "bottomCtaHref",
    type: "text",
    required: true,
  },
]);

export const ServicesContent: GlobalConfig = standardGlobal("services-content", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "serviceHighlights",
    type: "array",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "appointmentServices",
    type: "array",
    fields: [
      {
        name: "label",
        type: "text",
        required: true,
      },
    ],
  },
  {
    name: "closingCta",
    type: "group",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttons",
        type: "array",
        fields: ctaFields,
      },
      {
        name: "footerLinkLabel",
        type: "text",
        required: true,
      },
      {
        name: "footerLinkHref",
        type: "text",
        required: true,
      },
    ],
  },
]);

export const ContactPage: GlobalConfig = standardGlobal("contact-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "supportCard",
    type: "group",
    fields: [
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "asideCta",
    type: "group",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttonLabel",
        type: "text",
        required: true,
      },
      {
        name: "buttonHref",
        type: "text",
        required: true,
      },
    ],
  },
]);

export const ReviewsPage: GlobalConfig = standardGlobal("reviews-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "aggregateLabel",
    type: "text",
    required: true,
  },
]);

export const SchedulePage: GlobalConfig = standardGlobal("schedule-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
]);

export const RentalsPage: GlobalConfig = standardGlobal("rentals-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroImage",
    type: "text",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "catalogs",
    type: "array",
    fields: [
      {
        name: "id",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "href",
        type: "text",
        required: true,
      },
    ],
  },
  {
    name: "featureCards",
    type: "array",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "closingCard",
    type: "group",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttons",
        type: "array",
        fields: ctaFields,
      },
      {
        name: "footerLinkLabel",
        type: "text",
        required: true,
      },
      {
        name: "footerLinkHref",
        type: "text",
        required: true,
      },
    ],
  },
]);

export const WeddingPage: GlobalConfig = standardGlobal("wedding-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "intakeCard",
    type: "group",
    fields: [
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "nextSteps",
    type: "array",
    fields: [
      {
        name: "copy",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "catalogButtons",
    type: "array",
    fields: ctaFields,
  },
]);

export const DesignersPage: GlobalConfig = standardGlobal("designers-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "cards",
    type: "array",
    fields: [
      {
        name: "badge",
        type: "text",
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "buttonLabel",
        type: "text",
      },
      {
        name: "buttonHref",
        type: "text",
      },
    ],
  },
  {
    name: "popularHeading",
    type: "text",
    required: true,
  },
]);

export const ForMenPage: GlobalConfig = standardGlobal("for-men-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "closingCardTitle",
    type: "text",
    required: true,
  },
  {
    name: "closingCardDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "closingButtonLabel",
    type: "text",
    required: true,
  },
  {
    name: "closingButtonHref",
    type: "text",
    required: true,
  },
]);

export const LocationsPageContent: GlobalConfig = standardGlobal("locations-page-content", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "closingBadge",
    type: "text",
    required: true,
  },
  {
    name: "closingTitle",
    type: "text",
    required: true,
  },
  {
    name: "closingDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "closingButtons",
    type: "array",
    fields: ctaFields,
  },
]);

export const TailoredPage: GlobalConfig = standardGlobal("tailored-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroTitle",
    type: "text",
    required: true,
  },
  {
    name: "heroDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroCtaPrimary",
    type: "group",
    fields: ctaFields,
  },
  {
    name: "heroCtaSecondary",
    type: "group",
    fields: ctaFields,
  },
  {
    name: "heroHighlights",
    type: "array",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "copy",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "heroImage",
    type: "text",
    required: true,
  },
  {
    name: "insetImage",
    type: "text",
    required: true,
  },
  {
    name: "fitSection",
    type: "group",
    fields: [
      {
        name: "badge",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "introTitle",
        type: "text",
        required: true,
      },
      {
        name: "introCopy",
        type: "textarea",
        required: true,
      },
      {
        name: "pillars",
        type: "array",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "copy",
            type: "textarea",
            required: true,
          },
        ],
      },
      {
        name: "buttons",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
  {
    name: "processSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "steps",
        type: "array",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "copy",
            type: "textarea",
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "optionsSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "options",
        type: "array",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "copy",
            type: "textarea",
            required: true,
          },
        ],
      },
      {
        name: "insetBadge",
        type: "text",
        required: true,
      },
      {
        name: "insetTitle",
        type: "text",
        required: true,
      },
      {
        name: "insetCopy",
        type: "textarea",
        required: true,
      },
      {
        name: "insetButtons",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
  {
    name: "swatchSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "faqSection",
    type: "group",
    fields: [
      {
        name: "eyebrow",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        required: true,
      },
      {
        name: "faqs",
        type: "array",
        fields: [
          {
            name: "question",
            type: "text",
            required: true,
          },
          {
            name: "answer",
            type: "textarea",
            required: true,
          },
        ],
      },
      {
        name: "closingTitle",
        type: "text",
        required: true,
      },
      {
        name: "closingDescription",
        type: "textarea",
        required: true,
      },
      {
        name: "closingButtons",
        type: "array",
        fields: ctaFields,
      },
    ],
  },
]);

export const OurHistoryPage: GlobalConfig = standardGlobal("our-history-page", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "hero",
    type: "group",
    fields: pageHeroFields(),
  },
  {
    name: "milestones",
    type: "array",
    fields: [
      {
        name: "year",
        type: "text",
        required: true,
      },
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "detail",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    name: "closingTitle",
    type: "text",
    required: true,
  },
  {
    name: "closingDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "closingButtonLabel",
    type: "text",
    required: true,
  },
  {
    name: "closingButtonHref",
    type: "text",
    required: true,
  },
]);

export const BlogIndex: GlobalConfig = standardGlobal("blog-index", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroTitle",
    type: "text",
    required: true,
  },
  {
    name: "heroDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "sectionEyebrow",
    type: "text",
    required: true,
  },
  {
    name: "sectionTitle",
    type: "text",
    required: true,
  },
  {
    name: "sectionDescription",
    type: "textarea",
    required: true,
  },
]);

export const StyleGuideIndex: GlobalConfig = standardGlobal("style-guide-index", [
  {
    name: "metaTitle",
    type: "text",
    required: true,
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "heroTitle",
    type: "text",
    required: true,
  },
  {
    name: "heroDescription",
    type: "textarea",
    required: true,
  },
  {
    name: "sectionEyebrow",
    type: "text",
    required: true,
  },
  {
    name: "sectionTitle",
    type: "text",
    required: true,
  },
  {
    name: "sectionDescription",
    type: "textarea",
    required: true,
  },
]);
