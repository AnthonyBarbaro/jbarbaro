import type { CollectionConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  access: {
    create: isEditor,
    delete: isEditor,
    read: publicRead,
    update: isEditor,
  },
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "legacyId",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "rating",
      type: "number",
      max: 5,
      min: 1,
      required: true,
    },
    {
      name: "location",
      type: "relationship",
      relationTo: "locations",
      required: true,
    },
    {
      name: "quote",
      type: "textarea",
      required: true,
    },
    {
      name: "date",
      type: "date",
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
};
