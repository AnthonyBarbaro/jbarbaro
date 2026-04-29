import "server-only";

import { getShopifyConfigStatus } from "@/lib/shopify/config";
import { getShopCollections } from "@/lib/shopify/products";
import type { ShopifyCollectionPreview } from "@/lib/shopify/types";

export type CollectionNavItem = {
  label: string;
  href: string;
  description: string;
};

type CollectionNavSpec = {
  label: string;
  matches?: string[];
  description: string;
};

const collectionNavSpecs: CollectionNavSpec[] = [
  {
    label: "Accessories",
    matches: ["accessories"],
    description: "Finish the look with belts, ties, braces, pocket squares, and the smaller details that pull everything together.",
  },
  {
    label: "Sports Jacket",
    matches: ["sports jacket", "sport coat", "sports coat"],
    description: "Explore tailored jackets built for business casual, dinner plans, and polished everyday dressing.",
  },
  {
    label: "Shirts",
    matches: ["shirts"],
    description: "Dress shirts and casual shirting with cleaner fits, better fabrics, and easy options for daily rotation.",
  },
  {
    label: "Tuxedo",
    matches: ["tuxedo", "tuxedos"],
    description: "Formalwear pieces ready for weddings, black-tie events, and special occasions that call for a sharper finish.",
  },
  {
    label: "Shoes",
    matches: ["shoes", "footwear"],
    description: "Leather shoes and refined footwear designed to complete suiting, tailoring, and elevated casual looks.",
  },
  {
    label: "Suits",
    matches: ["suits"],
    description: "Shop business, wedding, and event-ready suits with a stronger fit foundation and room for tailoring support.",
  },
];

function normalizeCollectionValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function collectionMatches(collection: ShopifyCollectionPreview, spec: CollectionNavSpec) {
  if (!spec.matches?.length) {
    return false;
  }

  const title = normalizeCollectionValue(collection.title);
  const handle = normalizeCollectionValue(collection.handle);

  return spec.matches.some((candidate) => {
    const normalizedCandidate = normalizeCollectionValue(candidate);

    return title === normalizedCandidate || handle === normalizedCandidate;
  });
}

export async function resolveCollectionNavItems(limit = 40): Promise<CollectionNavItem[]> {
  const staticItems = collectionNavSpecs.map((item) => ({
    label: item.label,
    href: `/categories/${item.matches?.[0]?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ?? item.label.toLowerCase()}`,
    description: item.description,
  }));

  if (!getShopifyConfigStatus().configured) {
    return staticItems;
  }

  try {
    const collections = await getShopCollections(limit);
    const matchedHandles = new Set<string>();
    return collectionNavSpecs.map((item) => {
      const matchedCollection = collections.find((collection) => {
        if (matchedHandles.has(collection.handle)) {
          return false;
        }

        return collectionMatches(collection, item);
      });

      if (!matchedCollection) {
        return staticItems.find((staticItem) => staticItem.label === item.label)!;
      }

      matchedHandles.add(matchedCollection.handle);

      return {
        label: item.label,
        href: `/categories/${matchedCollection.handle}`,
        description: item.description,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown collection nav error.";
    console.error(`Unable to load collection nav items: ${message}`);
    return staticItems;
  }
}
