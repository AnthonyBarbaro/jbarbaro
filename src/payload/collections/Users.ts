import type { CollectionConfig } from "payload";

import { isAdmin, isAdminFieldLevel, isAdminOrSelf, isAdminOrSelfFieldLevel } from "@/payload/access/isAdmin";

export const Users: CollectionConfig = {
  slug: "users",
  access: {
    create: isAdmin,
    delete: isAdminOrSelf,
    read: isAdmin,
    update: isAdminOrSelf,
  },
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  fields: [
    {
      name: "email",
      type: "email",
      access: {
        read: isAdminOrSelfFieldLevel,
      },
      required: true,
      unique: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
          required: true,
        },
        {
          name: "lastName",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "roles",
      type: "select",
      access: {
        create: isAdminFieldLevel,
        read: isAdminOrSelfFieldLevel,
        update: isAdminFieldLevel,
      },
      defaultValue: ["admin"],
      hasMany: true,
      options: [
        {
          label: "Admin",
          value: "admin",
        },
        {
          label: "Editor",
          value: "editor",
        },
      ],
      required: true,
    },
  ],
};
