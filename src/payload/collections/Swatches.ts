import type { CollectionConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

export const Swatches: CollectionConfig = {
  slug: "swatches",
  access: {
    create: isEditor,
    delete: isEditor,
    read: publicRead,
    update: isEditor,
  },
  admin: {
    useAsTitle: "sku",
  },
  fields: [
    {
      name: "sku",
      type: "text",
      index: true,
      required: true,
      unique: true,
    },
    {
      name: "thumb",
      type: "text",
      required: true,
    },
    {
      name: "full",
      type: "text",
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
};
