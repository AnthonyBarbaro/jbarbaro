import type { Payload } from "payload";

import {
  defaultAboutPage,
  defaultBlogIndex,
  defaultBrands,
  defaultCategories,
  defaultContactPage,
  defaultDesignersPage,
  defaultForMenPage,
  defaultHomePage,
  defaultLocations,
  defaultLocationsPageContent,
  defaultNavigation,
  defaultOurHistoryPage,
  defaultRentalsPage,
  defaultReviewsPage,
  defaultSchedulePage,
  defaultServicesContent,
  defaultSiteSettings,
  defaultStyleGuideIndex,
  defaultSwatches,
  defaultTailoredPage,
  defaultTestimonials,
  defaultWeddingPage,
} from "../lib/cms-defaults";
import { getFileCollection } from "../lib/content-files";

type CollectionSlug =
  | "brands"
  | "categories"
  | "locations"
  | "posts"
  | "swatches"
  | "testimonials"
  | "users";

type GlobalSlug =
  | "site-settings"
  | "navigation"
  | "home-page"
  | "about-page"
  | "our-history-page"
  | "services-content"
  | "contact-page"
  | "reviews-page"
  | "schedule-page"
  | "rentals-page"
  | "wedding-page"
  | "designers-page"
  | "for-men-page"
  | "locations-page-content"
  | "tailored-page"
  | "blog-index"
  | "style-guide-index";

type SeedMode = "force" | "if-empty";

export type CmsBootstrapResult = {
  mode: SeedMode;
  seeded: boolean;
  createdAdmin: boolean;
  createdEditor: boolean;
  reason?: "content-present" | "nothing-to-seed";
};

type ExistingDoc = {
  id?: number | string;
};

let bootstrapPromise: Promise<CmsBootstrapResult> | null = null;

function linkValue(link: { label: string; href: string; external?: boolean }) {
  return {
    label: link.label,
    href: link.href,
    external: Boolean(link.external),
  };
}

async function upsertGlobal(payload: Payload, slug: GlobalSlug, data: Record<string, unknown>) {
  await payload.updateGlobal({
    slug,
    data,
    depth: 0,
    draft: false,
    overrideAccess: true,
  });
}

async function findExisting(payload: Payload, collection: CollectionSlug, field: string, value: string) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      [field]: {
        equals: value,
      },
    },
  });

  return (result.docs[0] || null) as ExistingDoc | null;
}

async function upsertCollectionDoc(
  payload: Payload,
  collection: CollectionSlug,
  uniqueField: string,
  uniqueValue: string,
  data: Record<string, unknown>,
) {
  const existing = await findExisting(payload, collection, uniqueField, uniqueValue);

  if (existing?.id) {
    return payload.update({
      collection,
      id: String(existing.id),
      data,
      depth: 0,
      draft: false,
      overrideAccess: true,
    });
  }

  return payload.create({
    collection,
    data,
    depth: 0,
    draft: false,
    overrideAccess: true,
  });
}

async function seedGlobals(payload: Payload) {
  const homePage = {
    ...defaultHomePage,
  } as Omit<typeof defaultHomePage, "heroSlides" | "ctaTiles"> & Partial<typeof defaultHomePage>;

  delete homePage.heroSlides;
  delete homePage.ctaTiles;

  await upsertGlobal(payload, "site-settings", {
    ...defaultSiteSettings,
    socialLinks: defaultSiteSettings.socialLinks.map(linkValue),
  });
  await upsertGlobal(payload, "navigation", {
    primaryNavigation: defaultNavigation.primaryNavigation.map((item) => ({
      label: item.label,
      href: item.href,
      external: Boolean(item.external),
      children: item.children?.map(linkValue) || [],
    })),
    headerTopLinks: defaultNavigation.headerTopLinks.map(linkValue),
    headerCtas: defaultNavigation.headerCtas.map(linkValue),
    footerShoppingLinks: defaultNavigation.footerShoppingLinks.map(linkValue),
    footerUtilityLinks: defaultNavigation.footerUtilityLinks.map(linkValue),
    footerNewsletterTitle: defaultNavigation.footerNewsletterTitle,
    footerNewsletterCopy: defaultNavigation.footerNewsletterCopy,
  });
  await upsertGlobal(payload, "home-page", {
    ...homePage,
    heroCtas: homePage.heroCtas.map(linkValue),
    retailBanner: {
      ...homePage.retailBanner,
      buttons: homePage.retailBanner.buttons.map(linkValue),
    },
    brandsSection: {
      ...homePage.brandsSection,
      buttons: homePage.brandsSection.buttons.map(linkValue),
    },
  });
  await upsertGlobal(payload, "about-page", defaultAboutPage as Record<string, unknown>);
  await upsertGlobal(payload, "our-history-page", defaultOurHistoryPage as Record<string, unknown>);
  await upsertGlobal(payload, "services-content", {
    ...defaultServicesContent,
    appointmentServices: defaultServicesContent.appointmentServices.map((label) => ({ label })),
  });
  await upsertGlobal(payload, "contact-page", defaultContactPage as Record<string, unknown>);
  await upsertGlobal(payload, "reviews-page", defaultReviewsPage as Record<string, unknown>);
  await upsertGlobal(payload, "schedule-page", defaultSchedulePage as Record<string, unknown>);
  await upsertGlobal(payload, "rentals-page", defaultRentalsPage as Record<string, unknown>);
  await upsertGlobal(payload, "wedding-page", defaultWeddingPage as Record<string, unknown>);
  await upsertGlobal(payload, "designers-page", defaultDesignersPage as Record<string, unknown>);
  await upsertGlobal(payload, "for-men-page", defaultForMenPage as Record<string, unknown>);
  await upsertGlobal(payload, "locations-page-content", defaultLocationsPageContent as Record<string, unknown>);
  await upsertGlobal(payload, "tailored-page", defaultTailoredPage as Record<string, unknown>);
  await upsertGlobal(payload, "blog-index", defaultBlogIndex as Record<string, unknown>);
  await upsertGlobal(payload, "style-guide-index", defaultStyleGuideIndex as Record<string, unknown>);
}

async function seedCollections(payload: Payload) {
  for (const category of defaultCategories) {
    await upsertCollectionDoc(payload, "categories", "slug", category.slug, { ...category });
  }

  for (const brand of defaultBrands) {
    await upsertCollectionDoc(payload, "brands", "slug", brand.slug, { ...brand });
  }

  const locationIdBySlug = new Map<string, number | string>();

  for (const location of defaultLocations) {
    const doc = await upsertCollectionDoc(payload, "locations", "slug", location.slug, {
      ...location,
      hours: location.hours.map((interval) => ({ ...interval })),
    });
    locationIdBySlug.set(location.slug, doc.id as number | string);
  }

  for (const testimonial of defaultTestimonials) {
    const locationId = locationIdBySlug.get(testimonial.locationSlug);

    if (!locationId) {
      throw new Error(`Unable to seed testimonial ${testimonial.id}: location ${testimonial.locationSlug} was not found.`);
    }

    await upsertCollectionDoc(payload, "testimonials", "legacyId", testimonial.id, {
      legacyId: testimonial.id,
      name: testimonial.name,
      rating: testimonial.rating,
      location: locationId,
      quote: testimonial.quote,
      date: testimonial.date,
    });
  }

  for (const swatch of defaultSwatches) {
    await upsertCollectionDoc(payload, "swatches", "sku", swatch.sku, { ...swatch });
  }

  for (const post of [...getFileCollection("blog"), ...getFileCollection("style-guide")]) {
    await upsertCollectionDoc(payload, "posts", "slug", post.slug, {
      ...post,
      tags: post.tags.map((value) => ({ value })),
    });
  }
}

async function ensureUser(
  payload: Payload,
  {
    email,
    firstName,
    lastName,
    password,
    roles,
  }: {
    email?: string;
    firstName: string;
    lastName: string;
    password?: string;
    roles: string[];
  },
) {
  if (!email || !password) {
    return false;
  }

  const existing = await findExisting(payload, "users", "email", email);

  if (existing) {
    return false;
  }

  await payload.create({
    collection: "users",
    data: {
      email,
      firstName,
      lastName,
      password,
      roles,
    },
    depth: 0,
    overrideAccess: true,
  });

  return true;
}

async function seedUsers(payload: Payload) {
  const isProduction = process.env.NODE_ENV === "production";
  const adminEmail = process.env.PAYLOAD_ADMIN_EMAIL || (isProduction ? undefined : "admin@jbarbaro.local");
  const adminPassword = process.env.PAYLOAD_ADMIN_PASSWORD || (isProduction ? undefined : "ChangeMe123!");
  const editorEmail = process.env.PAYLOAD_EDITOR_EMAIL;
  const editorPassword = process.env.PAYLOAD_EDITOR_PASSWORD;

  const createdAdmin = await ensureUser(payload, {
    email: adminEmail,
    firstName: "Site",
    lastName: "Admin",
    password: adminPassword,
    roles: ["admin"],
  });

  const createdEditor = await ensureUser(payload, {
    email: editorEmail,
    firstName: "Store",
    lastName: "Editor",
    password: editorPassword,
    roles: ["editor"],
  });

  return {
    createdAdmin,
    createdEditor,
  };
}

async function collectionHasDocs(payload: Payload, collection: CollectionSlug) {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
  });

  return result.docs.length > 0;
}

async function hasCmsContent(payload: Payload) {
  const checks = await Promise.all([
    collectionHasDocs(payload, "brands"),
    collectionHasDocs(payload, "categories"),
    collectionHasDocs(payload, "locations"),
    collectionHasDocs(payload, "posts"),
    collectionHasDocs(payload, "swatches"),
    collectionHasDocs(payload, "testimonials"),
  ]);

  return checks.some(Boolean);
}

export async function runCmsBootstrap(
  payload: Payload,
  { mode = "if-empty" }: { mode?: SeedMode } = {},
): Promise<CmsBootstrapResult> {
  const hasContent = await hasCmsContent(payload);

  if (mode === "if-empty" && hasContent) {
    const users = await seedUsers(payload);

    return {
      mode,
      seeded: false,
      createdAdmin: users.createdAdmin,
      createdEditor: users.createdEditor,
      reason: "content-present",
    };
  }

  const users = await seedUsers(payload);

  if (!hasContent && mode === "if-empty") {
    await seedGlobals(payload);
    await seedCollections(payload);

    return {
      mode,
      seeded: true,
      createdAdmin: users.createdAdmin,
      createdEditor: users.createdEditor,
    };
  }

  if (mode === "force") {
    await seedGlobals(payload);
    await seedCollections(payload);

    return {
      mode,
      seeded: true,
      createdAdmin: users.createdAdmin,
      createdEditor: users.createdEditor,
    };
  }

  return {
    mode,
    seeded: false,
    createdAdmin: users.createdAdmin,
    createdEditor: users.createdEditor,
    reason: "nothing-to-seed",
  };
}

export function ensureCmsBootstrapped(payload: Payload, options?: { mode?: SeedMode }) {
  if (!bootstrapPromise) {
    bootstrapPromise = runCmsBootstrap(payload, options).finally(() => {
      bootstrapPromise = null;
    });
  }

  return bootstrapPromise;
}
