import "server-only";

import { unstable_cache } from "next/cache";

import { storefrontRequest } from "@/lib/shopify/client";
import { SHOPIFY_STOREFRONT_REVALIDATE_SECONDS } from "@/lib/shopify/config";
import type {
  ShopifyCollection,
  ShopifyCollectionPreview,
  ShopifyProduct,
  ShopifyProductPreview,
  ShopifyProductReviewSummary,
  ShopifyProductSearchResult,
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

type PredictiveSearchResponse = {
  predictiveSearch: {
    products: RawProduct[];
  };
};

type ProductPreviewsResponse = {
  products: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
    }>;
  };
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
  variants(first: 25) {
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

async function fetchBestSellingProducts(limit = 8): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductsResponse, { limit: number }>({
    query: `
      query BestSellingProducts($limit: Int!) {
        products(first: $limit, sortKey: BEST_SELLING) {
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
  ["shopify-best-selling-products"],
  {
    revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS,
  },
);

export async function getBestSellingProducts(limit = 8): Promise<ShopifyProduct[]> {
  return getBestSellingProductsCached(limit);
}

async function fetchShopProduct(handle: string): Promise<ShopifyProduct | null> {
  const data = await storefrontRequest<ProductResponse, { handle: string }>({
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
  });

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

async function fetchShopCollection(handle: string, limit = 12): Promise<ShopifyCollection | null> {
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

  if (!data.collection) {
    return null;
  }

  return normalizeCollection(data.collection);
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

async function fetchShopCollectionsWithProducts(
  limit = 8,
  productLimit = 4,
): Promise<ShopifyCollection[]> {
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

  return data.collections.nodes.map(normalizeCollection);
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

async function fetchRecommendedProducts(
  productId: string,
  excludeHandle: string,
  limit = 4,
): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductRecommendationsResponse, { productId: string }>({
    query: `
      query ProductRecommendations($productId: ID!) {
        productRecommendations(productId: $productId) {
          ${productFields}
        }
      }
    `,
    variables: {
      productId,
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
  limit = 4,
): Promise<ShopifyProduct[]> {
  return getRecommendedProductsCached(productId, excludeHandle, limit);
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
    featuredImage: product.featuredImage,
    priceRange: product.priceRange,
  }));
}
