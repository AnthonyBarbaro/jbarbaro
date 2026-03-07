import type { CollectionConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

export const Categories: CollectionConfig = {
  slug: "categories",
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
      name: "shortDescription",
      type: "textarea",
      required: true,
    },
    {
      name: "longDescription",
      type: "textarea",
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
};
