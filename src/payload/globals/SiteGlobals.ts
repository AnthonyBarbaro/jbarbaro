import type { GlobalConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

const linkFields = [
  {
    name: "label",
    type: "text" as const,
    required: true,
  },
  {
    name: "href",
    type: "text" as const,
  },
  {
    name: "external",
    type: "checkbox" as const,
    defaultValue: false,
  },
];

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: publicRead,
    update: isEditor,
  },
  fields: [
    {
      name: "siteName",
      type: "text",
      required: true,
    },
    {
      name: "siteOwner",
      type: "text",
      required: true,
    },
    {
      name: "siteDescription",
      type: "textarea",
      required: true,
    },
    {
      name: "logoUrl",
      type: "text",
      required: true,
    },
    {
      name: "socialLinks",
      type: "array",
      fields: linkFields,
    },
    {
      type: "row",
      fields: [
        {
          name: "ratingValue",
          type: "number",
          required: true,
        },
        {
          name: "reviewCount",
          type: "number",
          required: true,
        },
        {
          name: "facebookLikes",
          type: "number",
          required: true,
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
};

export const Navigation: GlobalConfig = {
  slug: "navigation",
  access: {
    read: publicRead,
    update: isEditor,
  },
  fields: [
    {
      name: "primaryNavigation",
      type: "array",
      fields: [
        ...linkFields,
        {
          name: "children",
          type: "array",
          fields: linkFields,
        },
      ],
    },
    {
      name: "headerTopLinks",
      type: "array",
      fields: linkFields,
    },
    {
      name: "headerCtas",
      type: "array",
      fields: linkFields,
    },
    {
      name: "footerShoppingLinks",
      type: "array",
      fields: linkFields,
    },
    {
      name: "footerUtilityLinks",
      type: "array",
      fields: linkFields,
    },
    {
      name: "footerNewsletterTitle",
      type: "text",
      required: true,
    },
    {
      name: "footerNewsletterCopy",
      type: "textarea",
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
};
