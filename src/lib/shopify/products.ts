import "server-only";

import { storefrontRequest } from "@/lib/shopify/client";
import type { ShopifyCollectionPreview, ShopifyProduct, ShopifyProductSearchResult } from "@/lib/shopify/types";

type RawProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
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

type CollectionsResponse = {
  collections: {
    nodes: Array<{
      id: string;
      handle: string;
      title: string;
    }>;
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

const productFields = `
  id
  handle
  title
  description
  vendor
  productType
  tags
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
      selectedOptions {
        name
        value
      }
    }
  }
`;

function normalizeProduct(product: RawProduct): ShopifyProduct {
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    vendor: product.vendor,
    productType: product.productType,
    tags: product.tags,
    featuredImage: product.featuredImage,
    images: product.images.nodes,
    collections: product.collections.nodes,
    priceRange: product.priceRange,
    variants: product.variants.nodes,
  };
}

export async function getShopProducts(limit = 12): Promise<ShopifyProduct[]> {
  const data = await storefrontRequest<ProductsResponse, { limit: number }>({
    query: `
      query ShopProducts($limit: Int!) {
        products(first: $limit) {
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

export async function getShopProduct(handle: string): Promise<ShopifyProduct | null> {
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

export async function getShopCollections(limit = 8): Promise<ShopifyCollectionPreview[]> {
  const data = await storefrontRequest<CollectionsResponse, { limit: number }>({
    query: `
      query ShopCollections($limit: Int!) {
        collections(first: $limit) {
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

  return data.collections.nodes;
}

export async function getRecommendedProducts(productId: string, excludeHandle: string, limit = 4): Promise<ShopifyProduct[]> {
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

export async function searchShopProducts(query: string, limit = 6): Promise<ShopifyProductSearchResult[]> {
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
