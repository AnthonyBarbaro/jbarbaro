import type { CollectionConfig } from "payload";

import { isEditor, publicRead } from "@/payload/access/isAdmin";

export const Posts: CollectionConfig = {
  slug: "posts",
  access: {
    create: isEditor,
    delete: isEditor,
    read: publicRead,
    update: isEditor,
  },
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "type",
      type: "select",
      defaultValue: "blog",
      options: [
        {
          label: "Blog",
          value: "blog",
        },
        {
          label: "Style Guide",
          value: "style-guide",
        },
      ],
      required: true,
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
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
      name: "publishedAt",
      type: "date",
      required: true,
    },
    {
      name: "updatedAt",
      type: "date",
    },
    {
      name: "author",
      type: "text",
      defaultValue: "J. Barbaro Editorial Team",
      required: true,
    },
    {
      name: "coverImage",
      type: "text",
      required: true,
    },
    {
      name: "tags",
      type: "array",
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "body",
      type: "textarea",
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
};
