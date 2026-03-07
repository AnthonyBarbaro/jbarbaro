import type { CollectionConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

export const Locations: CollectionConfig = {
  slug: "locations",
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
      name: "brand",
      type: "text",
      required: true,
    },
    {
      name: "photo",
      type: "text",
      required: true,
    },
    {
      name: "address",
      type: "textarea",
      required: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "latitude",
          type: "number",
          required: true,
        },
        {
          name: "longitude",
          type: "number",
          required: true,
        },
      ],
    },
    {
      name: "note",
      type: "textarea",
      required: true,
    },
    {
      name: "hours",
      type: "array",
      fields: [
        {
          name: "days",
          type: "text",
          required: true,
        },
        {
          name: "open",
          type: "text",
          required: true,
        },
        {
          name: "close",
          type: "text",
          required: true,
        },
      ],
    },
  ],
  versions: {
    drafts: true,
  },
};
