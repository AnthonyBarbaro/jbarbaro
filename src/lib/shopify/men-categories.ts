import "server-only";

import { getMenCategoryByHandle, getMenCategoryHref, menCategories, menCategoryMap } from "@/data/men-categories";
import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { getShopCollection, getShopCollectionsWithProducts } from "@/lib/shopify/products";
import type { ShopifyCollection } from "@/lib/shopify/types";
import { toTitleCase } from "@/lib/utils";
import type { MenCategory } from "@/types/site";

export type ResolvedMenCategory = {
  slug: string;
  href: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  shopifyCollectionHandle?: string;
  shopifyCollection: ShopifyCollection | null;
  source: "editorial" | "shopify" | "merged";
};

function summarizeDescription(description: string) {
  const trimmed = description.trim();

  if (!trimmed) {
    return "";
  }

  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0]?.trim();

  return firstSentence || trimmed;
}

function fallbackDescription(name: string) {
  return `Explore ${name} in the live J. Barbaro collection and book a fitting when you want the shortlist prepared ahead of time.`;
}

function buildResolvedCategory({
  editorialCategory,
  shopifyCollection,
  slugOverride,
}: {
  editorialCategory: MenCategory | null;
  shopifyCollection: ShopifyCollection | null;
  slugOverride?: string;
}): ResolvedMenCategory {
  const slug = slugOverride || editorialCategory?.slug || shopifyCollection?.handle || "";
  const shopifyDescription = shopifyCollection?.description.trim() || "";
  const name = shopifyCollection?.title || editorialCategory?.name || toTitleCase(slug);
  const shortDescription =
    editorialCategory?.shortDescription || summarizeDescription(shopifyDescription) || fallbackDescription(name);
  const longDescription = shopifyDescription || editorialCategory?.longDescription || fallbackDescription(name);
  const source = editorialCategory && shopifyCollection ? "merged" : shopifyCollection ? "shopify" : "editorial";
  const shopifyCollectionHandle = shopifyCollection?.handle || editorialCategory?.shopifyCollectionHandle?.trim() || undefined;

  return {
    slug,
    href: `/for-men/${slug}`,
    name,
    shortDescription,
    longDescription,
    shopifyCollectionHandle,
    shopifyCollection,
    source,
  };
}

function getCollectionHandleCandidates(slugOrHandle: string, editorialCategory: MenCategory | null) {
  return Array.from(
    new Set(
      [editorialCategory?.shopifyCollectionHandle?.trim(), slugOrHandle, editorialCategory?.slug]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function getEditorialCategoryForCollection(handle: string) {
  return getMenCategoryByHandle(handle) ?? menCategoryMap[handle] ?? null;
}

async function safeGetShopCollection(handle: string, limit: number) {
  if (!getShopifyConfigStatus().configured) {
    return null;
  }

  try {
    return await getShopCollection(handle, limit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Shopify collection error.";
    console.error(`Unable to load Shopify collection for "${handle}": ${message}`);
    return null;
  }
}

export async function resolveMenCategories(limit = 24, productLimit = 4): Promise<ResolvedMenCategory[]> {
  if (!getShopifyConfigStatus().configured) {
    return [];
  }

  let shopifyCollections: ShopifyCollection[] = [];

  try {
    shopifyCollections = await getShopCollectionsWithProducts(limit, productLimit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Shopify collections error.";
    console.error(`Unable to load Shopify collections for /for-men: ${message}`);
    return [];
  }

  const collectionByHandle = new Map(shopifyCollections.map((collection) => [collection.handle, collection]));
  const usedHandles = new Set<string>();
  const mergedCategories = menCategories.flatMap((category) => {
    const matchedCollection = getCollectionHandleCandidates(category.slug, category)
      .map((handle) => collectionByHandle.get(handle) ?? null)
      .find((collection): collection is ShopifyCollection => Boolean(collection));

    if (!matchedCollection) {
      return [];
    }

    usedHandles.add(matchedCollection.handle);

    return [
      buildResolvedCategory({
        editorialCategory: category,
        shopifyCollection: matchedCollection,
        slugOverride: category.slug,
      }),
    ];
  });

  const shopifyOnlyCategories = shopifyCollections
    .filter((collection) => !usedHandles.has(collection.handle))
    .map((collection) => {
      const editorialCategory = getEditorialCategoryForCollection(collection.handle);

      return buildResolvedCategory({
        editorialCategory,
        shopifyCollection: collection,
        slugOverride: editorialCategory?.slug || collection.handle,
      });
    });

  return [...mergedCategories, ...shopifyOnlyCategories];
}

export async function resolveMenCategory(slugOrHandle: string, productLimit = 8): Promise<ResolvedMenCategory | null> {
  if (!getShopifyConfigStatus().configured) {
    return null;
  }

  const editorialCategory = menCategoryMap[slugOrHandle] ?? getMenCategoryByHandle(slugOrHandle);

  for (const handle of getCollectionHandleCandidates(slugOrHandle, editorialCategory)) {
    const shopifyCollection = await safeGetShopCollection(handle, productLimit);

    if (shopifyCollection) {
      return buildResolvedCategory({
        editorialCategory,
        shopifyCollection,
        slugOverride: editorialCategory?.slug || shopifyCollection.handle,
      });
    }
  }

  return null;
}

export async function getMenCategoryRoutes(limit = 40) {
  const categories = await resolveMenCategories(limit, 1);

  return Array.from(new Set(categories.map((category) => category.href)));
}

export function getResolvedMenCategoryHref(category: ResolvedMenCategory) {
  const editorialCategory = menCategoryMap[category.slug];

  if (editorialCategory) {
    return getMenCategoryHref(editorialCategory);
  }

  return category.href;
}
