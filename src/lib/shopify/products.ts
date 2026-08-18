import "server-only";

import { unstable_cache } from "next/cache";

import { getVariantSizeValue } from "@/lib/fit-profile";
import { storefrontRequest } from "@/lib/shopify/client";
import { SHOPIFY_STOREFRONT_REVALIDATE_SECONDS } from "@/lib/shopify/config";
import type {
  ShopifyCollection,
  ShopifyCollectionPreview,
  ShopifyProduct,
  ShopifyProductPreview,
  ShopifyProductReviewSummary,
  ShopifyProductSearchResult,
  ShopifyProductVariant,
} from "@/lib/shopify/types";

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  createdAt: string;
  description: string;
  descriptionHtml: string;
  vendor: string;
  productType: string;
  tags: string[];
  reviewRating: {
    value: string;
  } | null;
  reviewCount: {
    value: string;
  } | null;
  featuredImage: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  images: {
    nodes: Array<{
      url: string;
      altText: string | null;
      width: number | null;
      height: number | null;
    }>;
  };
  collections: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
      image: {
        url: string;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    }>;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    nodes: Array<{
      id: string;
      title: string;
      availableForSale: boolean;
      price: {
        amount: string;
        currencyCode: string;
      };
      compareAtPrice: {
        amount: string;
        currencyCode: string;
      } | null;
      selectedOptions: { name: string; value: string }[];
    }>;
  };
};

type ProductsResponse = {
  products: {
    nodes: RawProduct[];
  };
};

type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

type PaginatedConnection<T> = {
  nodes: T[];
  pageInfo: PageInfo;
};

type PaginatedProductsResponse = {
  products: PaginatedConnection<RawProduct>;
};

type ProductResponse = {
  product: RawProduct | null;
};

type RawCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: {
    url: string;
    altText: string | null;
    width: number | null;
    height: number | null;
  } | null;
  products: {
    nodes: RawProduct[];
  };
};

type RawCollectionDetails = Omit<RawCollection, "products">;

type PaginatedCollectionResponse = {
  collection:
    | (RawCollectionDetails & {
        products: PaginatedConnection<RawProduct>;
      })
    | null;
};

type CollectionResponse = {
  collection: RawCollection | null;
};

type CollectionsResponse = {
  collections: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
      image: {
        url: string;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    }>;
  };
};

type CollectionsWithProductsResponse = {
  collections: {
    nodes: RawCollection[];
  };
};

type ProductRecommendationsResponse = {
  productRecommendations: RawProduct[];
};

export type ProductRecommendationIntent = "RELATED" | "COMPLEMENTARY";

type RawPredictiveSearchVariant = Pick<
  ShopifyProductVariant,
  "availableForSale" | "selectedOptions"
>;

type RawPredictiveSearchProduct = Pick<
  RawProduct,
  "id" | "handle" | "title" | "vendor" | "productType" | "featuredImage" | "priceRange"
> & {
  availableForSale: boolean;
  variants: {
    nodes: RawPredictiveSearchVariant[];
  };
};

type PredictiveSearchResponse = {
  predictiveSearch: {
    products: RawPredictiveSearchProduct[];
  };
};

type ProductPreviewsResponse = {
  products: {
    nodes: RawProductPreview[];
  };
};

type RawProductPreview = {
  id: string;
  handle: string;
  title: string;
};

type PaginatedProductPreviewsResponse = {
  products: PaginatedConnection<RawProductPreview>;
};

const productFields = `
  id
  handle
  title
  createdAt
  description
  descriptionHtml
  vendor
  productType
  tags
  reviewRating: metafield(namespace: "reviews", key: "rating") {
    value
  }
  reviewCount: metafield(namespace: "reviews", key: "rating_count") {
    value
  }
  featuredImage {
    url
    altText
    width
    height
  }
  images(first: 8) {
    nodes {
      url
      altText
      width
      height
    }
  }
  collections(first: 10) {
    nodes {
      id
      handle
      title
      image {
        url
        altText
        width
        height
      }
    }
  }
  priceRange {
    minVariantPrice {
      amount
      currencyCode
    }
    maxVariantPrice {
      amount
      currencyCode
    }
  }
  variants(first: 100) {
    nodes {
      id
      title
      availableForSale
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
    }
  }
`;

const SHOPIFY_PAGE_SIZE = 250;

function parseReviewRatingValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as { value?: string | number } | string | number;
    const candidate =
      typeof parsed === "object" && parsed !== null && "value" in parsed ? parsed.value : parsed;
    const rating = Number(candidate);

    return Number.isFinite(rating) && rating > 0 ? rating : null;
  } catch {
    const rating = Number(value);

    return Number.isFinite(rating) && rating > 0 ? rating : null;
  }
}

function parseReviewCountValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const count = Number(value);

  return Number.isInteger(count) && count > 0 ? count : null;
}

function normalizeReviewSummary(product: RawProduct): ShopifyProductReviewSummary | null {
  const ratingValue = parseReviewRatingValue(product.reviewRating?.value);
  const reviewCount = parseReviewCountValue(product.reviewCount?.value);

  if (!ratingValue || !reviewCount) {
    return null;
  }

  return {
    ratingValue,
    reviewCount,
  };
}

function normalizeProduct(product: RawProduct): ShopifyProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    createdAt: product.createdAt,
    description: product.description,
    descriptionHtml: product.descriptionHtml,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    reviewSummary: normalizeReviewSummary(product),
    featuredImage: product.featuredImage,
    images: product.images.nodes,
    collections: product.collections.nodes,
    priceRange: product.priceRange,
    variants: product.variants.nodes,
  };
}

function normalizeCollection(collection: RawCollection): ShopifyCollection {
  return {
    id: collection.id,
    handle: collection.handle,
    title: collection.title,
    image: collection.image,
    description: collection.description,
    products: collection.products.nodes.map(normalizeProduct),
  };
}

async function fetchWithRetry<T>(
  request: () => Promise<T>,
  shouldRetry: (value: T) => boolean,
): Promise<T> {
  try {
    const value = await request();

    if (!shouldRetry(value)) {
      return value;
    }
  } catch {
    // Retry once below; if it also fails, the second error remains visible to the caller.
  }

  return request();
}

async function fetchAllPages<T extends { id: string }>(
  label: string,
  requestPage: (cursor: string | null) => Promise<PaginatedConnection<T>>,
): Promise<T[]> {
  const itemsById = new Map<string, T>();
  const seenCursors = new Set<string>();
  let cursor: string | null = null;

  while (true) {
    const itemCountBeforeRequest = itemsById.size;
    const page = await fetchWithRetry(
      () => requestPage(cursor),
      () => false,
    );

    for (const item of page.nodes) {
      itemsById.set(item.id, item);
    }

    if (!page.pageInfo.hasNextPage) {
      break;
    }

    const nextCursor = page.pageInfo.endCursor;

    if (!nextCursor) {
      throw new Error(`${label} pagination did not return an end cursor.`);
    }

    if (
      nextCursor === cursor ||
      seenCursors.has(nextCursor) ||
      itemsById.size === itemCountBeforeRequest
    ) {
      throw new Error(`${label} pagination did not make progress.`);
    }

    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return Array.from(itemsById.values());
}

async function fetchShopProducts(limit = 12): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductsResponse, { limit: number }>({
    query: `
      query ShopProducts($limit: Int!) {
        products(first: $limit, sortKey: CREATED_AT, reverse: true) {
          nodes {
            ${productFields}
          }
        }
      }
    `,
    variables: {
      limit,
    },
  });

  return data.products.nodes.map(normalizeProduct);
}

const getShopProductsCached = unstable_cache(fetchShopProducts, ["shopify-products"], {
  revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
});

export async function getShopProducts(limit = 12): Promise<ShopifyProduct[]> {
  return getShopProductsCached(limit);
}

async function fetchNewArrivalProducts(limit = 20): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductsResponse, { limit: number }>({
    query: `
      query NewArrivalProducts($limit: Int!) {
        products(
          first: $limit
          query: "available_for_sale:true"
          sortKey: CREATED_AT
          reverse: true
        ) {
          nodes {
            ${productFields}
          }
        }
      }
    `,
    variables: {
      limit,
    },
  });

  return data.products.nodes.map(normalizeProduct);
}

const getNewArrivalProductsCached = unstable_cache(
  fetchNewArrivalProducts,
  ["shopify-new-arrival-products"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getNewArrivalProducts(limit = 20): Promise<ShopifyProduct[]> {
  return getNewArrivalProductsCached(limit);
}

async function fetchAllShopProductsPage(cursor: string | null) {
  const data = await storefrontRequest<PaginatedProductsResponse, { cursor: string | null }>({
    query: `
      query AllShopProducts($cursor: String) {
        products(
          first: ${SHOPIFY_PAGE_SIZE}
          after: $cursor
          sortKey: CREATED_AT
          reverse: true
        ) {
          nodes {
            ${productFields}
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `,
    variables: { cursor },
  });

  return data.products;
}

const getAllShopProductsPageCached = unstable_cache(
  fetchAllShopProductsPage,
  ["shopify-all-products-page"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

async function fetchAllShopProducts(): Promise<ShopifyProduct[]> {
  const products = await fetchAllPages("Shopify products", (cursor) =>
    getAllShopProductsPageCached(cursor),
  );

  return products.map(normalizeProduct);
}

export async function getAllShopProducts(): Promise<ShopifyProduct[]> {
  return fetchAllShopProducts();
}

async function fetchProductsByVendor(
  vendor: string,
  limit = 60,
  availableOnly = false,
): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductsResponse, { limit: number; query: string }>({
    query: `
      query ProductsByVendor($limit: Int!, $query: String!) {
        products(first: $limit, sortKey: CREATED_AT, reverse: true, query: $query) {
          nodes {
            ${productFields}
          }
        }
      }
    `,
    variables: {
      limit,
      query: `vendor:'${vendor.replace(/'/g, "\\'")}'${availableOnly ? " AND available_for_sale:true" : ""}`,
    },
  });

  return data.products.nodes.map(normalizeProduct);
}

const getProductsByVendorCached = unstable_cache(
  fetchProductsByVendor,
  ["shopify-products-by-vendor"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getProductsByVendor(
  vendor: string,
  limit = 60,
  availableOnly = false,
): Promise<ShopifyProduct[]> {
  return getProductsByVendorCached(vendor, limit, availableOnly);
}

async function fetchAllProductsByVendor(
  vendor: string,
  availableOnly = false,
): Promise<ShopifyProduct[]> {
  const vendorQuery = `vendor:'${vendor.replace(/'/g, "\\'")}'${availableOnly ? " AND available_for_sale:true" : ""}`;
  const products = await fetchAllPages(
    `Shopify products for vendor "${vendor}"`,
    async (cursor) => {
      const data = await storefrontRequest<
        PaginatedProductsResponse,
        { cursor: string | null; query: string }
      >({
        query: `
        query AllProductsByVendor($cursor: String, $query: String!) {
          products(
            first: ${SHOPIFY_PAGE_SIZE}
            after: $cursor
            sortKey: CREATED_AT
            reverse: true
            query: $query
          ) {
            nodes {
              ${productFields}
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
        variables: {
          cursor,
          query: vendorQuery,
        },
      });

      return data.products;
    },
  );

  return products.map(normalizeProduct);
}

const getAllProductsByVendorCached = unstable_cache(
  fetchAllProductsByVendor,
  ["shopify-all-products-by-vendor"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getAllProductsByVendor(
  vendor: string,
  availableOnly = false,
): Promise<ShopifyProduct[]> {
  return getAllProductsByVendorCached(vendor, availableOnly);
}

async function fetchBestSellingProducts(limit = 8): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductsResponse, { limit: number }>({
    query: `
      query BestSellingProducts($limit: Int!) {
        products(first: $limit, query: "available_for_sale:true", sortKey: BEST_SELLING) {
          nodes {
            ${productFields}
          }
        }
      }
    `,
    variables: {
      limit,
    },
  });

  return data.products.nodes.map(normalizeProduct);
}

const getBestSellingProductsCached = unstable_cache(
  fetchBestSellingProducts,
  ["shopify-available-best-selling-products"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getBestSellingProducts(limit = 8): Promise<ShopifyProduct[]> {
  return getBestSellingProductsCached(limit);
}

async function fetchShopProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await fetchWithRetry(
    () =>
      storefrontRequest<ProductResponse, { handle: string }>({
        query: `
          query ShopProduct($handle: String!) {
            product(handle: $handle) {
              ${productFields}
            }
          }
        `,
        variables: {
          handle,
        },
      }),
    () => false,
  );

  if (!data.product) {
    return null;
  }

  return normalizeProduct(data.product);
}

const getShopProductCached = unstable_cache(fetchShopProduct, ["shopify-product"], {
  revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
});

export async function getShopProduct(handle: string): Promise<ShopifyProduct | null> {
  return getShopProductCached(handle);
}

async function requestShopCollection(handle: string, limit: number): Promise<RawCollection | null> {
  const data = await storefrontRequest<CollectionResponse, { handle: string; limit: number }>({
    query: `
      query ShopCollection($handle: String!, $limit: Int!) {
        collection(handle: $handle) {
          id
          handle
          title
          description
          image {
            url
            altText
            width
            height
          }
          products(first: $limit) {
            nodes {
              ${productFields}
            }
          }
        }
      }
    `,
    variables: {
      handle,
      limit,
    },
  });

  return data.collection;
}

async function fetchShopCollection(handle: string, limit = 12): Promise<ShopifyCollection | null> {
  const collection = await fetchWithRetry(
    () => requestShopCollection(handle, limit),
    (result) => limit > 1 && (!result || result.products.nodes.length === 0),
  );

  return collection ? normalizeCollection(collection) : null;
}

const getShopCollectionCached = unstable_cache(fetchShopCollection, ["shopify-collection"], {
  revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
});

export async function getShopCollection(
  handle: string,
  limit = 12,
): Promise<ShopifyCollection | null> {
  return getShopCollectionCached(handle, limit);
}

async function fetchAllShopCollection(handle: string): Promise<ShopifyCollection | null> {
  const collectionState: {
    details: RawCollectionDetails | null;
    missing: boolean;
  } = {
    details: null,
    missing: false,
  };
  const products = await fetchAllPages(`Shopify collection "${handle}"`, async (cursor) => {
    const data = await fetchWithRetry(
      () =>
        storefrontRequest<PaginatedCollectionResponse, { handle: string; cursor: string | null }>({
          query: `
            query AllShopCollectionProducts($handle: String!, $cursor: String) {
              collection(handle: $handle) {
                id
                handle
                title
                description
                image {
                  url
                  altText
                  width
                  height
                }
                products(first: ${SHOPIFY_PAGE_SIZE}, after: $cursor) {
                  nodes {
                    ${productFields}
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }
          `,
          variables: {
            handle,
            cursor,
          },
        }),
      (result) =>
        cursor === null && (!result.collection || result.collection.products.nodes.length === 0),
    );

    if (!data.collection) {
      if (cursor) {
        throw new Error(`Shopify collection "${handle}" disappeared during pagination.`);
      }

      collectionState.missing = true;
      return {
        nodes: [],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      };
    }

    collectionState.details = {
      id: data.collection.id,
      handle: data.collection.handle,
      title: data.collection.title,
      description: data.collection.description,
      image: data.collection.image,
    };

    return data.collection.products;
  });

  if (collectionState.missing || !collectionState.details) {
    return null;
  }

  return normalizeCollection({
    ...collectionState.details,
    products: { nodes: products },
  });
}

const getAllShopCollectionCached = unstable_cache(
  fetchAllShopCollection,
  ["shopify-all-collection-products"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getAllShopCollection(handle: string): Promise<ShopifyCollection | null> {
  return getAllShopCollectionCached(handle);
}

async function fetchShopCollections(limit = 8): Promise<ShopifyCollectionPreview[]> {
  const data = await storefrontRequest<CollectionsResponse, { limit: number }>({
    query: `
      query ShopCollections($limit: Int!) {
        collections(first: $limit) {
          nodes {
            id
            handle
            title
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
    `,
    variables: {
      limit,
    },
  });

  return data.collections.nodes;
}

const getShopCollectionsCached = unstable_cache(fetchShopCollections, ["shopify-collections"], {
  revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
});

export async function getShopCollections(limit = 8): Promise<ShopifyCollectionPreview[]> {
  return getShopCollectionsCached(limit);
}

async function requestShopCollectionsWithProducts(
  limit: number,
  productLimit: number,
): Promise<RawCollection[]> {
  const data = await storefrontRequest<
    CollectionsWithProductsResponse,
    { limit: number; productLimit: number }
  >({
    query: `
      query ShopCollectionsWithProducts($limit: Int!, $productLimit: Int!) {
        collections(first: $limit) {
          nodes {
            id
            handle
            title
            description
            image {
              url
              altText
              width
              height
            }
            products(first: $productLimit) {
              nodes {
                ${productFields}
              }
            }
          }
        }
      }
    `,
    variables: {
      limit,
      productLimit,
    },
  });

  return data.collections.nodes;
}

async function fetchShopCollectionsWithProducts(
  limit = 8,
  productLimit = 4,
): Promise<ShopifyCollection[]> {
  const collections = await fetchWithRetry(
    () => requestShopCollectionsWithProducts(limit, productLimit),
    (results) =>
      limit > 0 &&
      (results.length === 0 ||
        (productLimit > 0 &&
          results.every((collection) => collection.products.nodes.length === 0))),
  );

  return collections.map(normalizeCollection);
}

const getShopCollectionsWithProductsCached = unstable_cache(
  fetchShopCollectionsWithProducts,
  ["shopify-collections-products"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getShopCollectionsWithProducts(
  limit = 8,
  productLimit = 4,
): Promise<ShopifyCollection[]> {
  return getShopCollectionsWithProductsCached(limit, productLimit);
}

async function fetchShopProductPreviews(limit = 100): Promise<ShopifyProductPreview[]> {
  const data = await storefrontRequest<ProductPreviewsResponse, { limit: number }>({
    query: `
      query ShopProductPreviews($limit: Int!) {
        products(first: $limit) {
          nodes {
            id
            handle
            title
          }
        }
      }
    `,
    variables: {
      limit,
    },
  });

  return data.products.nodes;
}

const getShopProductPreviewsCached = unstable_cache(
  fetchShopProductPreviews,
  ["shopify-product-previews"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getShopProductPreviews(limit = 100): Promise<ShopifyProductPreview[]> {
  return getShopProductPreviewsCached(limit);
}

async function fetchAllShopProductPreviews(): Promise<ShopifyProductPreview[]> {
  return fetchAllPages("Shopify product previews", async (cursor) => {
    const data = await storefrontRequest<
      PaginatedProductPreviewsResponse,
      { cursor: string | null }
    >({
      query: `
        query AllShopProductPreviews($cursor: String) {
          products(first: ${SHOPIFY_PAGE_SIZE}, after: $cursor) {
            nodes {
              id
              handle
              title
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `,
      variables: { cursor },
    });

    return data.products;
  });
}

const getAllShopProductPreviewsCached = unstable_cache(
  fetchAllShopProductPreviews,
  ["shopify-all-product-previews"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getAllShopProductPreviews(): Promise<ShopifyProductPreview[]> {
  return getAllShopProductPreviewsCached();
}

async function fetchRecommendedProducts(
  productId: string,
  excludeHandle: string,
  limit = 10,
  intent: ProductRecommendationIntent = "RELATED",
): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<
    ProductRecommendationsResponse,
    { productId: string; intent: ProductRecommendationIntent }
  >({
    query: `
      query ProductRecommendations($productId: ID!, $intent: ProductRecommendationIntent!) {
        productRecommendations(productId: $productId, intent: $intent) {
          ${productFields}
        }
      }
    `,
    variables: {
      productId,
      intent,
    },
  });

  return data.productRecommendations
    .map(normalizeProduct)
    .filter((product) => product.handle !== excludeHandle)
    .slice(0, limit);
}

const getRecommendedProductsCached = unstable_cache(
  fetchRecommendedProducts,
  ["shopify-product-recommendations"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getRecommendedProducts(
  productId: string,
  excludeHandle: string,
  limit = 10,
  intent: ProductRecommendationIntent = "RELATED",
): Promise<ShopifyProduct[]> {
  return getRecommendedProductsCached(productId, excludeHandle, limit, intent);
}

export async function searchShopProducts(
  query: string,
  limit = 6,
): Promise<ShopifyProductSearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const data = await storefrontRequest<PredictiveSearchResponse, { query: string; limit: number }>({
    query: `
      query PredictiveProductSearch($query: String!, $limit: Int!) {
        predictiveSearch(query: $query, limit: $limit) {
          products {
            id
            handle
            title
            vendor
            productType
            availableForSale
            variants(first: 100) {
              nodes {
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
            featuredImage {
              url
              altText
              width
              height
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
              maxVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    `,
    variables: {
      query: normalizedQuery,
      limit,
    },
    cache: "no-store",
  });

  return data.predictiveSearch.products.map((product) => ({
    id: product.id,
    handle: product.handle,
    title: product.title,
    vendor: product.vendor,
    productType: product.productType,
    availableForSale: product.availableForSale,
    availableSizes: Array.from(
      new Set(
        product.variants.nodes
          .filter((variant) => variant.availableForSale)
          .map(getVariantSizeValue)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
    featuredImage: product.featuredImage,
    priceRange: product.priceRange,
  }));
}
