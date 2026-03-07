import path from "node:path";

import { sqliteAdapter } from "@payloadcms/db-sqlite";
import type { Config } from "payload";

import { Brands } from "./collections/Brands";
import { Categories } from "./collections/Categories";
import { Locations } from "./collections/Locations";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Swatches } from "./collections/Swatches";
import { Testimonials } from "./collections/Testimonials";
import { Users } from "./collections/Users";
import { preserveExistingTables } from "./db/preserveExistingTables";
import {
  AboutPage,
  BlogIndex,
  ContactPage,
  DesignersPage,
  ForMenPage,
  HomePage,
  LocationsPageContent,
  OurHistoryPage,
  RentalsPage,
  ReviewsPage,
  SchedulePage,
  ServicesContent,
  StyleGuideIndex,
  TailoredPage,
  WeddingPage,
} from "./globals/PageGlobals";
import { Navigation, SiteSettings } from "./globals/SiteGlobals";
import { ensureCmsBootstrapped } from "./seed";

export const payloadCollections = [
  Users,
  Media,
  Categories,
  Brands,
  Locations,
  Testimonials,
  Swatches,
  Posts,
] as const;

export const payloadGlobals = [
  SiteSettings,
  Navigation,
  HomePage,
  AboutPage,
  OurHistoryPage,
  ServicesContent,
  ContactPage,
  ReviewsPage,
  SchedulePage,
  RentalsPage,
  WeddingPage,
  DesignersPage,
  ForMenPage,
  LocationsPageContent,
  TailoredPage,
  BlogIndex,
  StyleGuideIndex,
] as const;

export function resolveDatabaseURL() {
  const databaseURL = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (databaseURL.startsWith("file:./")) {
    return `file:${path.resolve(process.cwd(), databaseURL.replace(/^file:\.\//, ""))}`;
  }

  return databaseURL;
}

function shouldAutoSeedOnInit() {
  const configured = process.env.PAYLOAD_AUTO_SEED;

  if (configured === "true") {
    return true;
  }

  if (configured === "false") {
    return false;
  }

  return process.env.NODE_ENV !== "production";
}

function shouldPushDatabaseSchema() {
  return process.env.PAYLOAD_DB_PUSH === "true";
}

export function createPayloadConfig(baseDir: string): Config {
  return {
    admin: {
      components: {
        Nav: {
          exportName: "Sidebar",
          path: "./admin/components/Sidebar",
        },
        graphics: {
          Icon: {
            exportName: "AdminIcon",
            path: "./admin/components/AdminIcon",
          },
          Logo: {
            exportName: "AdminLogo",
            path: "./admin/components/AdminLogo",
          },
        },
      },
      importMap: {
        autoGenerate: false,
        baseDir,
      },
      theme: "dark",
    },
    collections: [...payloadCollections],
    db: sqliteAdapter({
      beforeSchemaInit: [preserveExistingTables as never],
      client: {
        url: resolveDatabaseURL(),
      },
      push: shouldPushDatabaseSchema(),
    }),
    globals: [...payloadGlobals],
    onInit: async (payload) => {
      if (!shouldAutoSeedOnInit()) {
        return;
      }

      const result = await ensureCmsBootstrapped(payload);

      if (result.seeded || result.createdAdmin || result.createdEditor) {
        payload.logger.info(
          `CMS bootstrap complete (mode=${result.mode}, seeded=${String(result.seeded)}, admin=${String(result.createdAdmin)}, editor=${String(result.createdEditor)})`,
        );
      }
    },
    routes: {
      admin: "/cms",
    },
    secret: process.env.PAYLOAD_SECRET || "dev-payload-secret-change-me",
    serverURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    typescript: {
      outputFile: path.resolve(baseDir, "payload-types.ts"),
    },
  };
}
