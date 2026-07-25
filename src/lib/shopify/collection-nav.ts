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
  href: string;
  matches?: string[];
  description: string;
};

const collectionNavSpecs: CollectionNavSpec[] = [
  {
    label: "Suits",
    href: "/categories/suits",
    matches: ["suits"],
    description: "Shop business, wedding, and event-ready suits with clear size and length options.",
  },
  {
    label: "Shop All",
    href: "/shop",
    matches: ["shop all", "all"],
    description: "Browse every product currently available online.",
  },
  {
    label: "Sport Coats",
    href: "/categories/sport-coats",
    matches: ["sports jacket", "sport jacket", "sport coat", "sports coat"],
    description: "Explore tailored jackets built for business casual, dinner plans, and polished everyday dressing.",
  },
  {
    label: "Shirts",
    href: "/categories/shirts",
    matches: ["shirts"],
    description: "Dress shirts and casual shirting with cleaner fits, better fabrics, and easy options for daily rotation.",
  },
  {
    label: "Pants",
    href: "/categories/pants",
    matches: ["dress pants", "pants", "trousers"],
    description: "Shop casual and tailored pants organized around the waist size you already know.",
  },
  {
    label: "Shoes",
    href: "/categories/shoes",
    matches: ["shoes", "footwear"],
    description: "Leather shoes and refined footwear designed to complete suiting, tailoring, and elevated casual looks.",
  },
  {
    label: "Accessories",
    href: "/categories/accessories",
    matches: ["accessories"],
    description: "Finish the look with belts, ties, braces, pocket squares, and smaller details.",
  },
  {
    label: "Formalwear",
    href: "/categories/formalwear",
    matches: ["tuxedo", "tuxedos", "formalwear"],
    description: "Formal pieces for weddings, black-tie events, and milestone occasions.",
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
    href: item.href,
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
        href: item.href,
        description: item.description,
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown collection nav error.";
    console.error(`Unable to load collection nav items: ${message}`);
    return staticItems;
  }
}
