import "server-only";

import { unstable_cache } from "next/cache";

import { getBrandPresentation } from "@/data/brands";
import { brandSlug } from "@/lib/shopify/brand-slug";
import { storefrontRequest } from "@/lib/shopify/client";
import { SHOPIFY_STOREFRONT_REVALIDATE_SECONDS } from "@/lib/shopify/config";
import type { ShopifyProduct } from "@/lib/shopify/types";
import type { Brand } from "@/types/site";

type BrandProduct = {
  vendor: string;
  featuredImage: ShopifyProduct["featuredImage"];
};

type BrandProductsResponse = {
  products: {
    nodes: BrandProduct[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

export type ShopBrand = {
  vendor: string;
  name: string;
  slug: string;
  productCount: number;
  image: ShopifyProduct["featuredImage"];
  presentation: Brand | null;
};

async function fetchShopBrandProducts(): Promise<BrandProduct[]> {
  const products: BrandProduct[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: BrandProductsResponse = await storefrontRequest<
      BrandProductsResponse,
      { cursor: string | null }
    >({
      query: `
        query ShopBrandProducts($cursor: String) {
          products(first: 250, after: $cursor) {
            nodes {
              vendor
              featuredImage {
                url
                altText
                width
                height
              }
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

    products.push(...data.products.nodes);
    hasNextPage = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;

    if (hasNextPage && !cursor) {
      throw new Error("Shopify brand pagination did not return an end cursor.");
    }
  }

  return products;
}

const getShopBrandProductsCached = unstable_cache(
  fetchShopBrandProducts,
  ["shopify-all-brand-products"],
  { revalidate: SHOPIFY_STOREFRONT_REVALIDATE_SECONDS },
);

export async function getShopBrands(): Promise<ShopBrand[]> {
  const products = await getShopBrandProductsCached();
  const brandsByVendor = new Map<string, ShopBrand>();

  for (const product of products) {
    const vendor = product.vendor?.trim();

    if (!vendor) {
      continue;
    }

    const vendorKey = vendor.toLocaleLowerCase();
    const existing = brandsByVendor.get(vendorKey);

    if (existing) {
      existing.productCount += 1;

      if (!existing.image && product.featuredImage) {
        existing.image = product.featuredImage;
      }
    } else {
      const presentation = getBrandPresentation(vendor);

      brandsByVendor.set(vendorKey, {
        vendor,
        name: presentation?.name ?? vendor,
        slug: brandSlug(vendor),
        productCount: 1,
        image: product.featuredImage,
        presentation,
      });
    }
  }

  return Array.from(brandsByVendor.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export async function getShopBrandBySlug(slug: string): Promise<ShopBrand | null> {
  const brands = await getShopBrands();

  return brands.find((brand) => brand.slug === slug) ?? null;
}
