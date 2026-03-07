import type { CollectionConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

export const Brands: CollectionConfig = {
  slug: "brands",
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
      name: "slug",
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
      name: "image",
      type: "text",
      required: true,
    },
    {
      name: "logo",
      type: "text",
      required: true,
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
};
