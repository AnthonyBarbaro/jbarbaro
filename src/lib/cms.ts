import { unstable_noStore as noStore } from "next/cache";
import { getPayload } from "payload";

import type { NavChild, NavItem } from "@/data/navigation";
import { defaultAboutPage } from "@/lib/cms-defaults";
import { getFileCollection, getFilePostBySlug } from "@/lib/content-files";
import {
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
  type AboutPageContent,
  type ContactPageContent,
  type DesignersPageContent,
  type ForMenPageContent,
  type HomePageContent,
  type LocationsPageContent,
  type NavigationContent,
  type OurHistoryPageContent,
  type PostIndexContent,
  type RentalsPageContent,
  type ReviewsPageContent,
  type SchedulePageContent,
  type ServicesContent,
  type SiteSettingsContent,
  type TailoredPageContent,
  type WeddingPageContent,
} from "@/lib/cms-defaults";
import config from "@/payload.config";
import type { ContentPost } from "@/types/content";
import type { Brand, Location, MenCategory, Testimonial } from "@/types/site";

type LinkItem = {
  label?: string | null;
  href?: string | null;
  external?: boolean | null;
};

function toLink(item: LinkItem, fallback?: { label: string; href: string; external?: boolean }) {
  if (!item?.label || !item?.href) {
    return fallback || null;
  }

  return {
    label: item.label,
    href: item.href,
    external: Boolean(item.external),
  };
}

function toArray<T>(value: T[] | null | undefined, fallback: T[]) {
  return Array.isArray(value) && value.length > 0 ? value : fallback;
}

async function loadPayload() {
  noStore();

  try {
    return await getPayload({ config });
  } catch (error) {
    console.error("CMS init failed:", error);
    return null;
  }
}

async function findGlobalSafe<T>(slug: string) {
  const payload = await loadPayload();

  if (!payload) {
    return null as T | null;
  }

  try {
    return (await payload.findGlobal({
      slug,
      depth: 2,
    })) as T;
  } catch (error) {
    console.error(`CMS global load failed for ${slug}:`, error);
    return null as T | null;
  }
}

async function findCollectionSafe<T>(collection: string, sort?: string) {
  const payload = await loadPayload();

  if (!payload) {
    return [] as T[];
  }

  try {
    const result = await payload.find({
      collection,
      depth: 2,
      draft: false,
      limit: 500,
      sort,
    });

    return result.docs as T[];
  } catch (error) {
    console.error(`CMS collection load failed for ${collection}:`, error);
    return [] as T[];
  }
}

export async function getSiteSettings(): Promise<SiteSettingsContent> {
  const doc = await findGlobalSafe<Record<string, unknown>>("site-settings");

  if (!doc) {
    return defaultSiteSettings;
  }

  return {
    siteName: String(doc.siteName || defaultSiteSettings.siteName),
    siteOwner: String(doc.siteOwner || defaultSiteSettings.siteOwner),
    siteDescription: String(doc.siteDescription || defaultSiteSettings.siteDescription),
    logoUrl: String(doc.logoUrl || defaultSiteSettings.logoUrl),
    socialLinks: toArray(
      (doc.socialLinks as LinkItem[] | undefined)
        ?.map((item) => toLink(item))
        .filter(Boolean) as SiteSettingsContent["socialLinks"],
      defaultSiteSettings.socialLinks,
    ),
    ratingValue: Number(doc.ratingValue ?? defaultSiteSettings.ratingValue),
    reviewCount: Number(doc.reviewCount ?? defaultSiteSettings.reviewCount),
    facebookLikes: Number(doc.facebookLikes ?? defaultSiteSettings.facebookLikes),
  };
}

export async function getNavigation(): Promise<NavigationContent> {
  const doc = await findGlobalSafe<Record<string, unknown>>("navigation");

  if (!doc) {
    return defaultNavigation;
  }

  return {
    primaryNavigation: toArray(
      (doc.primaryNavigation as Array<Record<string, unknown>> | undefined)?.map((item) => ({
        label: String(item.label || ""),
        href: item.href ? String(item.href) : undefined,
        external: Boolean(item.external),
        children: Array.isArray(item.children)
          ? (item.children
              .map((child) => toLink(child as LinkItem))
              .filter(Boolean) as NavChild[])
          : undefined,
      })),
      defaultNavigation.primaryNavigation,
    ) as NavItem[],
    headerTopLinks: toArray(
      (doc.headerTopLinks as LinkItem[] | undefined)
        ?.map((item) => toLink(item))
        .filter(Boolean) as NavigationContent["headerTopLinks"],
      defaultNavigation.headerTopLinks,
    ),
    headerCtas: toArray(
      (doc.headerCtas as LinkItem[] | undefined)
        ?.map((item) => toLink(item))
        .filter(Boolean) as NavigationContent["headerCtas"],
      defaultNavigation.headerCtas,
    ),
    footerShoppingLinks: toArray(
      (doc.footerShoppingLinks as LinkItem[] | undefined)
        ?.map((item) => toLink(item))
        .filter(Boolean) as NavigationContent["footerShoppingLinks"],
      defaultNavigation.footerShoppingLinks,
    ),
    footerUtilityLinks: toArray(
      (doc.footerUtilityLinks as LinkItem[] | undefined)
        ?.map((item) => toLink(item))
        .filter(Boolean) as NavigationContent["footerUtilityLinks"],
      defaultNavigation.footerUtilityLinks,
    ),
    footerNewsletterTitle: String(doc.footerNewsletterTitle || defaultNavigation.footerNewsletterTitle),
    footerNewsletterCopy: String(doc.footerNewsletterCopy || defaultNavigation.footerNewsletterCopy),
  };
}

function mapBrand(doc: Record<string, unknown>): Brand {
  return {
    slug: String(doc.slug),
    name: String(doc.name),
    image: String(doc.image),
    logo: String(doc.logo),
    featured: Boolean(doc.featured),
    description: String(doc.description),
  };
}

function mapLocation(doc: Record<string, unknown>): Location {
  return {
    slug: String(doc.slug),
    name: String(doc.name),
    brand: String(doc.brand),
    photo: String(doc.photo),
    address: String(doc.address),
    phone: String(doc.phone),
    latitude: Number(doc.latitude),
    longitude: Number(doc.longitude),
    note: String(doc.note),
    hours: Array.isArray(doc.hours)
      ? doc.hours.map((interval) => ({
          days: String((interval as Record<string, unknown>).days),
          open: String((interval as Record<string, unknown>).open),
          close: String((interval as Record<string, unknown>).close),
        }))
      : [],
  };
}

function mapCategory(doc: Record<string, unknown>): MenCategory {
  return {
    slug: String(doc.slug),
    name: String(doc.name),
    shortDescription: String(doc.shortDescription),
    longDescription: String(doc.longDescription),
  };
}

function mapTestimonial(doc: Record<string, unknown>): Testimonial {
  const location = doc.location as Record<string, unknown> | string | null | undefined;

  return {
    id: String(doc.legacyId || doc.id),
    name: String(doc.name),
    rating: Number(doc.rating),
    locationSlug:
      typeof location === "object" && location
        ? String(location.slug)
        : String(location || ""),
    quote: String(doc.quote),
    date: String(doc.date),
  };
}

function mapPost(doc: Record<string, unknown>): ContentPost {
  return {
    slug: String(doc.slug),
    title: String(doc.title),
    description: String(doc.description),
    publishedAt: String(doc.publishedAt),
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : undefined,
    author: String(doc.author),
    coverImage: String(doc.coverImage),
    tags: Array.isArray(doc.tags)
      ? doc.tags.map((tag) => String((tag as Record<string, unknown>).value))
      : [],
    body: String(doc.body),
    type: String(doc.type) === "style-guide" ? "style-guide" : "blog",
  };
}

export async function getBrands(): Promise<Brand[]> {
  const docs = await findCollectionSafe<Record<string, unknown>>("brands", "name");
  return docs.length ? docs.map(mapBrand) : defaultBrands;
}

export async function getFeaturedBrands(): Promise<Brand[]> {
  const docs = await getBrands();
  return docs.filter((brand) => brand.featured);
}

export async function getBrandMap() {
  const docs = await getBrands();
  return Object.fromEntries(docs.map((brand) => [brand.slug, brand]));
}

export async function getLocations(): Promise<Location[]> {
  const docs = await findCollectionSafe<Record<string, unknown>>("locations", "name");
  return docs.length ? docs.map(mapLocation) : defaultLocations;
}

export async function getLocationMap() {
  const docs = await getLocations();
  return Object.fromEntries(docs.map((location) => [location.slug, location]));
}

export async function getCategories(): Promise<MenCategory[]> {
  const docs = await findCollectionSafe<Record<string, unknown>>("categories", "name");
  return docs.length ? docs.map(mapCategory) : defaultCategories;
}

export async function getCategoryMap() {
  const docs = await getCategories();
  return Object.fromEntries(docs.map((category) => [category.slug, category]));
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const docs = await findCollectionSafe<Record<string, unknown>>("testimonials", "-date");
  return docs.length ? docs.map(mapTestimonial) : defaultTestimonials;
}

export async function getAggregateRating() {
  const settings = await getSiteSettings();
  return {
    ratingValue: settings.ratingValue,
    reviewCount: settings.reviewCount,
  };
}

export async function getSwatches() {
  const docs = await findCollectionSafe<Record<string, unknown>>("swatches", "sku");

  if (!docs.length) {
    return defaultSwatches;
  }

  return docs.map((doc) => ({
    sku: String(doc.sku),
    thumb: String(doc.thumb),
    full: String(doc.full),
  }));
}

export async function getPosts(type: "blog" | "style-guide"): Promise<ContentPost[]> {
  const docs = await findCollectionSafe<Record<string, unknown>>("posts", "-publishedAt");

  if (!docs.length) {
    return getFileCollection(type);
  }

  const posts = docs
    .map(mapPost)
    .filter((post) => post.type === type)
    .sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt));

  return posts.length ? posts : getFileCollection(type);
}

export async function getPostBySlug(type: "blog" | "style-guide", slug: string) {
  const posts = await getPosts(type);
  return posts.find((post) => post.slug === slug) || getFilePostBySlug(type, slug);
}

export async function getHomePageContent(): Promise<HomePageContent> {
  const doc = await findGlobalSafe<Partial<HomePageContent>>("home-page");
  return {
    ...defaultHomePage,
    ...doc,
    heroBadges: toArray(doc?.heroBadges, defaultHomePage.heroBadges),
    heroCtas: toArray(doc?.heroCtas, defaultHomePage.heroCtas),
    heroSlides: defaultHomePage.heroSlides,
    ctaTiles: defaultHomePage.ctaTiles,
    retailBanner: { ...defaultHomePage.retailBanner, ...doc?.retailBanner },
    tailorProcess: {
      ...defaultHomePage.tailorProcess,
      ...doc?.tailorProcess,
      items: toArray(doc?.tailorProcess?.items, defaultHomePage.tailorProcess.items),
    },
    categoriesSection: { ...defaultHomePage.categoriesSection, ...doc?.categoriesSection },
    brandsSection: {
      ...defaultHomePage.brandsSection,
      ...doc?.brandsSection,
      buttons: toArray(doc?.brandsSection?.buttons, defaultHomePage.brandsSection.buttons),
    },
    appointmentPriority: { ...defaultHomePage.appointmentPriority, ...doc?.appointmentPriority },
    locationsSection: { ...defaultHomePage.locationsSection, ...doc?.locationsSection },
    journalSection: { ...defaultHomePage.journalSection, ...doc?.journalSection },
  };
}

async function getPageGlobal<T>(slug: string, fallback: T): Promise<T> {
  const doc = await findGlobalSafe<Partial<T>>(slug);
  return doc ? ({ ...fallback, ...doc } as T) : fallback;
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const doc = await findGlobalSafe<Partial<AboutPageContent>>("about-page");

  if (!doc) {
    return defaultAboutPage;
  }

  return {
    ...defaultAboutPage,
    ...doc,
    hero: { ...defaultAboutPage.hero, ...doc.hero },
    overview: {
      ...defaultAboutPage.overview,
      ...doc.overview,
      paragraphs: toArray(doc.overview?.paragraphs, defaultAboutPage.overview.paragraphs),
      exploreLinks: toArray(doc.overview?.exploreLinks, defaultAboutPage.overview.exploreLinks),
    },
    founderSpotlight: {
      ...defaultAboutPage.founderSpotlight,
      ...doc.founderSpotlight,
      paragraphs: toArray(doc.founderSpotlight?.paragraphs, defaultAboutPage.founderSpotlight.paragraphs),
      buttons: toArray(doc.founderSpotlight?.buttons, defaultAboutPage.founderSpotlight.buttons),
    },
    pillars: toArray(doc.pillars, defaultAboutPage.pillars),
  };
}

export async function getServicesContent(): Promise<ServicesContent> {
  const doc = await findGlobalSafe<Partial<ServicesContent>>("services-content");

  if (!doc) {
    return defaultServicesContent;
  }

  return {
    ...defaultServicesContent,
    ...doc,
    hero: { ...defaultServicesContent.hero, ...doc.hero },
    serviceHighlights: toArray(doc.serviceHighlights, defaultServicesContent.serviceHighlights),
    appointmentServices: toArray(
      doc.appointmentServices?.map((item) => (typeof item === "string" ? item : String((item as { label?: string }).label || ""))),
      defaultServicesContent.appointmentServices,
    ),
    closingCta: {
      ...defaultServicesContent.closingCta,
      ...doc.closingCta,
      buttons: toArray(doc.closingCta?.buttons, defaultServicesContent.closingCta.buttons),
    },
  };
}

export async function getContactPageContent(): Promise<ContactPageContent> {
  const doc = await findGlobalSafe<Partial<ContactPageContent>>("contact-page");
  return doc
    ? {
        ...defaultContactPage,
        ...doc,
        hero: { ...defaultContactPage.hero, ...doc.hero },
        supportCard: { ...defaultContactPage.supportCard, ...doc.supportCard },
        asideCta: { ...defaultContactPage.asideCta, ...doc.asideCta },
      }
    : defaultContactPage;
}

export async function getReviewsPageContent(): Promise<ReviewsPageContent> {
  const doc = await findGlobalSafe<Partial<ReviewsPageContent>>("reviews-page");
  return doc
    ? {
        ...defaultReviewsPage,
        ...doc,
        hero: { ...defaultReviewsPage.hero, ...doc.hero },
      }
    : defaultReviewsPage;
}

export async function getSchedulePageContent(): Promise<SchedulePageContent> {
  const doc = await findGlobalSafe<Partial<SchedulePageContent>>("schedule-page");
  return doc
    ? {
        ...defaultSchedulePage,
        ...doc,
        hero: { ...defaultSchedulePage.hero, ...doc.hero },
      }
    : defaultSchedulePage;
}

export async function getRentalsPageContent(): Promise<RentalsPageContent> {
  const doc = await findGlobalSafe<Partial<RentalsPageContent>>("rentals-page");

  if (!doc) {
    return defaultRentalsPage;
  }

  return {
    ...defaultRentalsPage,
    ...doc,
    hero: { ...defaultRentalsPage.hero, ...doc.hero },
    catalogs: toArray(doc.catalogs, defaultRentalsPage.catalogs),
    featureCards: toArray(doc.featureCards, defaultRentalsPage.featureCards),
    closingCard: {
      ...defaultRentalsPage.closingCard,
      ...doc.closingCard,
      buttons: toArray(doc.closingCard?.buttons, defaultRentalsPage.closingCard.buttons),
    },
  };
}

export async function getWeddingPageContent(): Promise<WeddingPageContent> {
  const doc = await findGlobalSafe<Partial<WeddingPageContent>>("wedding-page");

  if (!doc) {
    return defaultWeddingPage;
  }

  return {
    ...defaultWeddingPage,
    ...doc,
    hero: { ...defaultWeddingPage.hero, ...doc.hero },
    intakeCard: { ...defaultWeddingPage.intakeCard, ...doc.intakeCard },
    nextSteps: toArray(doc.nextSteps, defaultWeddingPage.nextSteps),
    catalogButtons: toArray(doc.catalogButtons, defaultWeddingPage.catalogButtons),
  };
}

export async function getDesignersPageContent(): Promise<DesignersPageContent> {
  const doc = await findGlobalSafe<Partial<DesignersPageContent>>("designers-page");

  if (!doc) {
    return defaultDesignersPage;
  }

  return {
    ...defaultDesignersPage,
    ...doc,
    hero: { ...defaultDesignersPage.hero, ...doc.hero },
    cards: toArray(doc.cards, defaultDesignersPage.cards),
  };
}

export async function getForMenPageContent(): Promise<ForMenPageContent> {
  const doc = await findGlobalSafe<Partial<ForMenPageContent>>("for-men-page");
  return doc
    ? {
        ...defaultForMenPage,
        ...doc,
        hero: { ...defaultForMenPage.hero, ...doc.hero },
      }
    : defaultForMenPage;
}

export async function getLocationsPageContent(): Promise<LocationsPageContent> {
  const doc = await findGlobalSafe<Partial<LocationsPageContent>>("locations-page-content");

  if (!doc) {
    return defaultLocationsPageContent;
  }

  return {
    ...defaultLocationsPageContent,
    ...doc,
    hero: { ...defaultLocationsPageContent.hero, ...doc.hero },
    closingButtons: toArray(doc.closingButtons, defaultLocationsPageContent.closingButtons),
  };
}

export async function getTailoredPageContent(): Promise<TailoredPageContent> {
  const doc = await findGlobalSafe<Partial<TailoredPageContent>>("tailored-page");

  if (!doc) {
    return defaultTailoredPage;
  }

  return {
    ...defaultTailoredPage,
    ...doc,
    heroHighlights: toArray(doc.heroHighlights, defaultTailoredPage.heroHighlights),
    fitSection: {
      ...defaultTailoredPage.fitSection,
      ...doc.fitSection,
      pillars: toArray(doc.fitSection?.pillars, defaultTailoredPage.fitSection.pillars),
      buttons: toArray(doc.fitSection?.buttons, defaultTailoredPage.fitSection.buttons),
    },
    processSection: {
      ...defaultTailoredPage.processSection,
      ...doc.processSection,
      steps: toArray(doc.processSection?.steps, defaultTailoredPage.processSection.steps),
    },
    optionsSection: {
      ...defaultTailoredPage.optionsSection,
      ...doc.optionsSection,
      options: toArray(doc.optionsSection?.options, defaultTailoredPage.optionsSection.options),
      insetButtons: toArray(doc.optionsSection?.insetButtons, defaultTailoredPage.optionsSection.insetButtons),
    },
    swatchSection: { ...defaultTailoredPage.swatchSection, ...doc.swatchSection },
    faqSection: {
      ...defaultTailoredPage.faqSection,
      ...doc.faqSection,
      faqs: toArray(doc.faqSection?.faqs, defaultTailoredPage.faqSection.faqs),
      closingButtons: toArray(doc.faqSection?.closingButtons, defaultTailoredPage.faqSection.closingButtons),
    },
  };
}

export async function getOurHistoryPageContent(): Promise<OurHistoryPageContent> {
  const doc = await findGlobalSafe<Partial<OurHistoryPageContent>>("our-history-page");

  if (!doc) {
    return defaultOurHistoryPage;
  }

  return {
    ...defaultOurHistoryPage,
    ...doc,
    hero: { ...defaultOurHistoryPage.hero, ...doc.hero },
    milestones: toArray(doc.milestones, defaultOurHistoryPage.milestones),
  };
}

export async function getBlogIndexContent(): Promise<PostIndexContent> {
  return getPageGlobal("blog-index", defaultBlogIndex);
}

export async function getStyleGuideIndexContent(): Promise<PostIndexContent> {
  return getPageGlobal("style-guide-index", defaultStyleGuideIndex);
}
