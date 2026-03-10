import { defineConfig } from "tinacms";

const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.GITHUB_BRANCH ||
  process.env.HEAD ||
  "main";
const clientId = process.env.NEXT_PUBLIC_TINA_CLIENT_ID;
const token = process.env.TINA_TOKEN;

const singletonActions = {
  create: false,
  delete: false,
};

const textField = (name: string, label: string, textarea = false) => ({
  type: "string" as const,
  name,
  label,
  ...(textarea ? { ui: { component: "textarea" as const } } : {}),
});

const imageField = (name: string, label: string) => ({
  type: "image" as const,
  name,
  label,
});

const linkFields = [
  textField("label", "Label"),
  textField("href", "Href"),
  { type: "boolean" as const, name: "external", label: "External" },
];

const buttonFields = [textField("label", "Label"), textField("href", "Href")];

const heroFields = (withSecondary = false) => [
  textField("title", "Title"),
  textField("description", "Description", true),
  {
    type: "object" as const,
    name: "ctaPrimary",
    label: "Primary CTA",
    fields: buttonFields,
  },
  ...(withSecondary
    ? [
        {
          type: "object" as const,
          name: "ctaSecondary",
          label: "Secondary CTA",
          fields: buttonFields,
        },
      ]
    : []),
];

const metaFields = [textField("metaTitle", "Meta Title"), textField("metaDescription", "Meta Description", true)];

const truncateLabel = (value: string, max = 48) =>
  value.length > max ? `${value.slice(0, max - 3).trimEnd()}...` : value;

const objectListUi = (fallback: string, ...keys: string[]) => ({
  itemProps: (item: object) => {
    const record = item as Record<string, unknown>;

    for (const key of keys) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return { label: truncateLabel(value.trim()) };
      }
    }

    return { label: fallback };
  },
});

export default defineConfig({
  branch,
  clientId,
  token,
  build: {
    publicFolder: "public",
    outputFolder: "admin",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "siteSettings",
        label: "Site Settings",
        path: "content/site",
        format: "json",
        match: {
          include: "site-settings",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          textField("siteName", "Site Name"),
          textField("siteOwner", "Site Owner"),
          textField("siteDescription", "Site Description", true),
          imageField("logoUrl", "Logo"),
          {
            type: "object",
            name: "socialLinks",
            label: "Social Links",
            list: true,
            ui: objectListUi("Social Link", "label", "href"),
            fields: linkFields,
          },
          { type: "number", name: "ratingValue", label: "Rating Value" },
          { type: "number", name: "reviewCount", label: "Review Count" },
          { type: "number", name: "facebookLikes", label: "Facebook Likes" },
        ],
      },
      {
        name: "navigation",
        label: "Navigation",
        path: "content/site",
        format: "json",
        match: {
          include: "navigation",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "primaryNavigation",
            label: "Primary Navigation",
            list: true,
            ui: objectListUi("Navigation Item", "label", "href"),
            fields: [
              textField("label", "Label"),
              textField("href", "Href"),
              { type: "boolean", name: "external", label: "External" },
              {
                type: "object",
                name: "children",
                label: "Children",
                list: true,
                ui: objectListUi("Navigation Child", "label", "href"),
                fields: linkFields,
              },
            ],
          },
          {
            type: "object",
            name: "headerTopLinks",
            label: "Header Top Links",
            list: true,
            ui: objectListUi("Header Link", "label", "href"),
            fields: linkFields,
          },
          {
            type: "object",
            name: "headerCtas",
            label: "Header CTAs",
            list: true,
            ui: objectListUi("Header CTA", "label", "href"),
            fields: buttonFields,
          },
          {
            type: "object",
            name: "footerShoppingLinks",
            label: "Footer Shopping Links",
            list: true,
            ui: objectListUi("Footer Link", "label", "href"),
            fields: linkFields,
          },
          {
            type: "object",
            name: "footerUtilityLinks",
            label: "Footer Utility Links",
            list: true,
            ui: objectListUi("Footer Link", "label", "href"),
            fields: linkFields,
          },
          textField("footerNewsletterTitle", "Footer Newsletter Title"),
          textField("footerNewsletterCopy", "Footer Newsletter Copy", true),
        ],
      },
      {
        name: "brands",
        label: "Brands",
        path: "content/site",
        format: "json",
        match: {
          include: "brands",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "items",
            label: "Brands",
            list: true,
            ui: objectListUi("Brand", "name", "slug"),
            fields: [
              textField("slug", "Slug"),
              textField("name", "Name"),
              imageField("image", "Image"),
              imageField("logo", "Logo"),
              { type: "boolean", name: "featured", label: "Featured" },
              textField("description", "Description", true),
            ],
          },
        ],
      },
      {
        name: "categories",
        label: "Categories",
        path: "content/site",
        format: "json",
        match: {
          include: "categories",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "items",
            label: "Categories",
            list: true,
            ui: objectListUi("Category", "name", "slug"),
            fields: [
              textField("slug", "Slug"),
              textField("name", "Name"),
              textField("shortDescription", "Short Description", true),
              textField("longDescription", "Long Description", true),
            ],
          },
        ],
      },
      {
        name: "locations",
        label: "Locations",
        path: "content/site",
        format: "json",
        match: {
          include: "locations",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "items",
            label: "Locations",
            list: true,
            ui: objectListUi("Location", "name", "slug"),
            fields: [
              textField("slug", "Slug"),
              textField("name", "Name"),
              textField("brand", "Brand"),
              imageField("photo", "Photo"),
              textField("address", "Address", true),
              textField("phone", "Phone"),
              { type: "number", name: "latitude", label: "Latitude" },
              { type: "number", name: "longitude", label: "Longitude" },
              textField("note", "Note", true),
              {
                type: "object",
                name: "hours",
                label: "Hours",
                list: true,
                ui: objectListUi("Hours", "days", "open"),
                fields: [textField("days", "Days"), textField("open", "Open"), textField("close", "Close")],
              },
            ],
          },
        ],
      },
      {
        name: "testimonials",
        label: "Testimonials",
        path: "content/site",
        format: "json",
        match: {
          include: "testimonials",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "aggregateRating",
            label: "Aggregate Rating",
            fields: [
              { type: "number", name: "ratingValue", label: "Rating Value" },
              { type: "number", name: "reviewCount", label: "Review Count" },
            ],
          },
          {
            type: "object",
            name: "testimonials",
            label: "Testimonials",
            list: true,
            ui: objectListUi("Testimonial", "name", "date"),
            fields: [
              textField("id", "ID"),
              textField("name", "Name"),
              { type: "number", name: "rating", label: "Rating" },
              textField("locationSlug", "Location Slug"),
              textField("quote", "Quote", true),
              textField("date", "Date"),
            ],
          },
        ],
      },
      {
        name: "tailoredSwatches",
        label: "Tailored Swatches",
        path: "content/site",
        format: "json",
        match: {
          include: "tailored",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "tailoredSwatches",
            label: "Swatches",
            list: true,
            ui: objectListUi("Swatch", "sku"),
            fields: [textField("sku", "SKU"), imageField("thumb", "Thumbnail"), imageField("full", "Full Image")],
          },
        ],
      },
      {
        name: "pageContent",
        label: "Page Content",
        path: "content/site",
        format: "json",
        match: {
          include: "page-content",
        },
        ui: {
          allowedActions: singletonActions,
        },
        fields: [
          {
            type: "object",
            name: "homePage",
            label: "Home Page",
            fields: [
              ...metaFields,
              imageField("heroImage", "Hero Image"),
              textField("heroTitle", "Hero Title"),
              textField("heroDescription", "Hero Description", true),
              {
                type: "object",
                name: "heroBadges",
                label: "Hero Badges",
                list: true,
                ui: objectListUi("Hero Badge", "label"),
                fields: [textField("label", "Label")],
              },
              {
                type: "object",
                name: "heroCtas",
                label: "Hero CTAs",
                list: true,
                ui: objectListUi("Hero CTA", "label", "href"),
                fields: buttonFields,
              },
              {
                type: "object",
                name: "heroSlides",
                label: "Hero Slides",
                list: true,
                ui: objectListUi("Hero Slide", "title", "id"),
                fields: [
                  textField("id", "ID"),
                  textField("title", "Title"),
                  textField("caption", "Caption", true),
                  textField("href", "Href"),
                  imageField("image", "Image"),
                  { type: "boolean", name: "external", label: "External" },
                ],
              },
              {
                type: "object",
                name: "ctaTiles",
                label: "CTA Tiles",
                list: true,
                ui: objectListUi("CTA Tile", "title", "id"),
                fields: [
                  textField("id", "ID"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  textField("href", "Href"),
                  imageField("image", "Image"),
                  { type: "boolean", name: "external", label: "External" },
                ],
              },
              {
                type: "object",
                name: "retailBanner",
                label: "Retail Banner",
                fields: [
                  textField("badge", "Badge"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "buttons",
                    label: "Buttons",
                    list: true,
                    ui: objectListUi("Button", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
              {
                type: "object",
                name: "tailorProcess",
                label: "Tailor Process",
                fields: [
                  textField("eyebrow", "Eyebrow"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "items",
                    label: "Items",
                    list: true,
                    ui: objectListUi("Process Item", "title", "copy"),
                    fields: [textField("title", "Title"), textField("copy", "Copy", true)],
                  },
                ],
              },
              {
                type: "object",
                name: "categoriesSection",
                label: "Categories Section",
                fields: [
                  textField("eyebrow", "Eyebrow"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  textField("buttonLabel", "Button Label"),
                  textField("buttonHref", "Button Href"),
                ],
              },
              {
                type: "object",
                name: "brandsSection",
                label: "Brands Section",
                fields: [
                  textField("eyebrow", "Eyebrow"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "buttons",
                    label: "Buttons",
                    list: true,
                    ui: objectListUi("Button", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
              {
                type: "object",
                name: "appointmentPriority",
                label: "Appointment Priority",
                fields: [
                  textField("badge", "Badge"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  textField("buttonLabel", "Button Label"),
                  textField("buttonHref", "Button Href"),
                  textField("testimonialHeading", "Testimonial Heading"),
                ],
              },
              {
                type: "object",
                name: "locationsSection",
                label: "Locations Section",
                fields: [textField("eyebrow", "Eyebrow"), textField("title", "Title"), textField("description", "Description", true)],
              },
              {
                type: "object",
                name: "journalSection",
                label: "Journal Section",
                fields: [textField("eyebrow", "Eyebrow"), textField("title", "Title"), textField("description", "Description", true)],
              },
            ],
          },
          {
            type: "object",
            name: "aboutPage",
            label: "About Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(true) },
              {
                type: "object",
                name: "overview",
                label: "Overview",
                fields: [
                  textField("badge", "Badge"),
                  textField("title", "Title"),
                  {
                    type: "object",
                    name: "paragraphs",
                    label: "Paragraphs",
                    list: true,
                    ui: objectListUi("Paragraph", "copy"),
                    fields: [textField("copy", "Copy", true)],
                  },
                  {
                    type: "object",
                    name: "exploreLinks",
                    label: "Explore Links",
                    list: true,
                    ui: objectListUi("Explore Link", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
              {
                type: "object",
                name: "founderSpotlight",
                label: "Founder Spotlight",
                fields: [
                  imageField("image", "Image"),
                  textField("badge", "Badge"),
                  textField("title", "Title"),
                  {
                    type: "object",
                    name: "paragraphs",
                    label: "Paragraphs",
                    list: true,
                    ui: objectListUi("Paragraph", "copy"),
                    fields: [textField("copy", "Copy", true)],
                  },
                  {
                    type: "object",
                    name: "buttons",
                    label: "Buttons",
                    list: true,
                    ui: objectListUi("Button", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
              {
                type: "object",
                name: "pillars",
                label: "Pillars",
                list: true,
                ui: objectListUi("Pillar", "title", "description"),
                fields: [textField("title", "Title"), textField("description", "Description", true)],
              },
              textField("bottomCtaLabel", "Bottom CTA Label"),
              textField("bottomCtaHref", "Bottom CTA Href"),
            ],
          },
          {
            type: "object",
            name: "servicesPage",
            label: "Services Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(true) },
              {
                type: "object",
                name: "serviceHighlights",
                label: "Service Highlights",
                list: true,
                ui: objectListUi("Service Highlight", "title", "description"),
                fields: [textField("title", "Title"), textField("description", "Description", true)],
              },
              { type: "string", name: "appointmentServices", label: "Appointment Services", list: true },
              {
                type: "object",
                name: "closingCta",
                label: "Closing CTA",
                fields: [
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "buttons",
                    label: "Buttons",
                    list: true,
                    ui: objectListUi("Button", "label", "href"),
                    fields: buttonFields,
                  },
                  textField("footerLinkLabel", "Footer Link Label"),
                  textField("footerLinkHref", "Footer Link Href"),
                ],
              },
            ],
          },
          {
            type: "object",
            name: "contactPage",
            label: "Contact Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(false) },
              {
                type: "object",
                name: "supportCard",
                label: "Support Card",
                fields: [textField("badge", "Badge"), textField("title", "Title"), textField("description", "Description", true)],
              },
              {
                type: "object",
                name: "asideCta",
                label: "Aside CTA",
                fields: [
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  textField("buttonLabel", "Button Label"),
                  textField("buttonHref", "Button Href"),
                ],
              },
            ],
          },
          {
            type: "object",
            name: "reviewsPage",
            label: "Reviews Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(false) },
              textField("aggregateLabel", "Aggregate Label"),
            ],
          },
          {
            type: "object",
            name: "schedulePage",
            label: "Schedule Page",
            fields: [...metaFields, { type: "object", name: "hero", label: "Hero", fields: [textField("title", "Title"), textField("description", "Description", true)] }],
          },
          {
            type: "object",
            name: "rentalsPage",
            label: "Rentals Page",
            fields: [
              ...metaFields,
              imageField("heroImage", "Hero Image"),
              { type: "object", name: "hero", label: "Hero", fields: heroFields(true) },
              {
                type: "object",
                name: "catalogs",
                label: "Catalogs",
                list: true,
                ui: objectListUi("Catalog", "title", "id"),
                fields: [textField("id", "ID"), textField("title", "Title"), textField("description", "Description", true), textField("href", "Href")],
              },
              {
                type: "object",
                name: "featureCards",
                label: "Feature Cards",
                list: true,
                ui: objectListUi("Feature Card", "title", "description"),
                fields: [textField("title", "Title"), textField("description", "Description", true)],
              },
              {
                type: "object",
                name: "closingCard",
                label: "Closing Card",
                fields: [
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "buttons",
                    label: "Buttons",
                    list: true,
                    ui: objectListUi("Button", "label", "href"),
                    fields: buttonFields,
                  },
                  textField("footerLinkLabel", "Footer Link Label"),
                  textField("footerLinkHref", "Footer Link Href"),
                ],
              },
            ],
          },
          {
            type: "object",
            name: "weddingPage",
            label: "Wedding Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(false) },
              {
                type: "object",
                name: "intakeCard",
                label: "Intake Card",
                fields: [textField("badge", "Badge"), textField("title", "Title"), textField("description", "Description", true)],
              },
              {
                type: "object",
                name: "nextSteps",
                label: "Next Steps",
                list: true,
                ui: objectListUi("Next Step", "copy"),
                fields: [textField("copy", "Copy", true)],
              },
              {
                type: "object",
                name: "catalogButtons",
                label: "Catalog Buttons",
                list: true,
                ui: objectListUi("Catalog Button", "label", "href"),
                fields: buttonFields,
              },
            ],
          },
          {
            type: "object",
            name: "designersPage",
            label: "Designers Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(false) },
              {
                type: "object",
                name: "cards",
                label: "Cards",
                list: true,
                ui: objectListUi("Card", "title", "description"),
                fields: [
                  textField("badge", "Badge"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  textField("buttonLabel", "Button Label"),
                  textField("buttonHref", "Button Href"),
                ],
              },
              textField("popularHeading", "Popular Heading"),
            ],
          },
          {
            type: "object",
            name: "forMenPage",
            label: "For Men Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(false) },
              textField("closingCardTitle", "Closing Card Title"),
              textField("closingCardDescription", "Closing Card Description", true),
              textField("closingButtonLabel", "Closing Button Label"),
              textField("closingButtonHref", "Closing Button Href"),
            ],
          },
          {
            type: "object",
            name: "locationsPage",
            label: "Locations Page",
            fields: [
              ...metaFields,
              { type: "object", name: "hero", label: "Hero", fields: heroFields(false) },
              textField("closingBadge", "Closing Badge"),
              textField("closingTitle", "Closing Title"),
              textField("closingDescription", "Closing Description", true),
              {
                type: "object",
                name: "closingButtons",
                label: "Closing Buttons",
                list: true,
                ui: objectListUi("Closing Button", "label", "href"),
                fields: buttonFields,
              },
            ],
          },
          {
            type: "object",
            name: "tailoredPage",
            label: "Tailored Page",
            fields: [
              ...metaFields,
              textField("heroTitle", "Hero Title"),
              textField("heroDescription", "Hero Description", true),
              {
                type: "object",
                name: "heroCtaPrimary",
                label: "Primary Hero CTA",
                fields: buttonFields,
              },
              {
                type: "object",
                name: "heroCtaSecondary",
                label: "Secondary Hero CTA",
                fields: buttonFields,
              },
              {
                type: "object",
                name: "heroHighlights",
                label: "Hero Highlights",
                list: true,
                ui: objectListUi("Hero Highlight", "title", "copy"),
                fields: [textField("title", "Title"), textField("copy", "Copy", true)],
              },
              imageField("heroImage", "Hero Image"),
              imageField("insetImage", "Inset Image"),
              {
                type: "object",
                name: "fitSection",
                label: "Fit Section",
                fields: [
                  textField("badge", "Badge"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  textField("introTitle", "Intro Title"),
                  textField("introCopy", "Intro Copy", true),
                  {
                    type: "object",
                    name: "pillars",
                    label: "Pillars",
                    list: true,
                    ui: objectListUi("Pillar", "title", "copy"),
                    fields: [textField("title", "Title"), textField("copy", "Copy", true)],
                  },
                  {
                    type: "object",
                    name: "buttons",
                    label: "Buttons",
                    list: true,
                    ui: objectListUi("Button", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
              {
                type: "object",
                name: "processSection",
                label: "Process Section",
                fields: [
                  textField("eyebrow", "Eyebrow"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "steps",
                    label: "Steps",
                    list: true,
                    ui: objectListUi("Step", "title", "copy"),
                    fields: [textField("title", "Title"), textField("copy", "Copy", true)],
                  },
                ],
              },
              {
                type: "object",
                name: "optionsSection",
                label: "Options Section",
                fields: [
                  textField("eyebrow", "Eyebrow"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "options",
                    label: "Options",
                    list: true,
                    ui: objectListUi("Option", "title", "copy"),
                    fields: [textField("title", "Title"), textField("copy", "Copy", true)],
                  },
                  textField("insetBadge", "Inset Badge"),
                  textField("insetTitle", "Inset Title"),
                  textField("insetCopy", "Inset Copy", true),
                  {
                    type: "object",
                    name: "insetButtons",
                    label: "Inset Buttons",
                    list: true,
                    ui: objectListUi("Inset Button", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
              {
                type: "object",
                name: "swatchSection",
                label: "Swatch Section",
                fields: [textField("eyebrow", "Eyebrow"), textField("title", "Title"), textField("description", "Description", true)],
              },
              {
                type: "object",
                name: "faqSection",
                label: "FAQ Section",
                fields: [
                  textField("eyebrow", "Eyebrow"),
                  textField("title", "Title"),
                  textField("description", "Description", true),
                  {
                    type: "object",
                    name: "faqs",
                    label: "FAQs",
                    list: true,
                    ui: objectListUi("FAQ", "question", "answer"),
                    fields: [textField("question", "Question"), textField("answer", "Answer", true)],
                  },
                  textField("closingTitle", "Closing Title"),
                  textField("closingDescription", "Closing Description", true),
                  {
                    type: "object",
                    name: "closingButtons",
                    label: "Closing Buttons",
                    list: true,
                    ui: objectListUi("Closing Button", "label", "href"),
                    fields: buttonFields,
                  },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "ourHistoryPage",
            label: "Our History Page",
            fields: [
              ...metaFields,
              {
                type: "object",
                name: "hero",
                label: "Hero",
                fields: [textField("title", "Title"), textField("description", "Description", true)],
              },
              {
                type: "object",
                name: "milestones",
                label: "Milestones",
                list: true,
                ui: objectListUi("Milestone", "title", "year"),
                fields: [textField("year", "Year"), textField("title", "Title"), textField("detail", "Detail", true)],
              },
              textField("closingTitle", "Closing Title"),
              textField("closingDescription", "Closing Description", true),
              textField("closingButtonLabel", "Closing Button Label"),
              textField("closingButtonHref", "Closing Button Href"),
            ],
          },
          {
            type: "object",
            name: "blogIndex",
            label: "Blog Index",
            fields: [
              ...metaFields,
              textField("heroTitle", "Hero Title"),
              textField("heroDescription", "Hero Description", true),
              textField("sectionEyebrow", "Section Eyebrow"),
              textField("sectionTitle", "Section Title"),
              textField("sectionDescription", "Section Description", true),
            ],
          },
          {
            type: "object",
            name: "styleGuideIndex",
            label: "Style Guide Index",
            fields: [
              ...metaFields,
              textField("heroTitle", "Hero Title"),
              textField("heroDescription", "Hero Description", true),
              textField("sectionEyebrow", "Section Eyebrow"),
              textField("sectionTitle", "Section Title"),
              textField("sectionDescription", "Section Description", true),
            ],
          },
        ],
      },
      {
        name: "blog",
        label: "Blog Posts",
        path: "content/blog",
        format: "mdx",
        fields: [
          textField("title", "Title"),
          textField("description", "Description", true),
          textField("publishedAt", "Published At"),
          textField("updatedAt", "Updated At"),
          textField("author", "Author"),
          imageField("coverImage", "Cover Image"),
          { type: "string", name: "tags", label: "Tags", list: true },
          {
            type: "string",
            name: "body",
            label: "Body",
            isBody: true,
            ui: {
              component: "textarea",
            },
          },
        ],
      },
      {
        name: "styleGuide",
        label: "Style Guide Posts",
        path: "content/style-guide",
        format: "mdx",
        fields: [
          textField("title", "Title"),
          textField("description", "Description", true),
          textField("publishedAt", "Published At"),
          textField("updatedAt", "Updated At"),
          textField("author", "Author"),
          imageField("coverImage", "Cover Image"),
          { type: "string", name: "tags", label: "Tags", list: true },
          {
            type: "string",
            name: "body",
            label: "Body",
            isBody: true,
            ui: {
              component: "textarea",
            },
          },
        ],
      },
    ],
  },
});
