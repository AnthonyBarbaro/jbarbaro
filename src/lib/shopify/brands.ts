import "server-only";

import { brandSlug } from "@/lib/shopify/brand-slug";
import { getShopProducts } from "@/lib/shopify/products";
import type { ShopifyProduct } from "@/lib/shopify/types";

export type ShopBrand = {
  name: string;
  slug: string;
  productCount: number;
  image: ShopifyProduct["featuredImage"];
};

export async function getShopBrands(): Promise<ShopBrand[]> {
  const products = await getShopProducts(100);
  const brandsByName = new Map<string, ShopBrand>();

  for (const product of products) {
    const vendor = product.vendor?.trim();

    if (!vendor) {
      continue;
    }

    const existing = brandsByName.get(vendor);

    if (existing) {
      existing.productCount += 1;

      if (!existing.image && product.featuredImage) {
        existing.image = product.featuredImage;
      }
    } else {
      brandsByName.set(vendor, {
        name: vendor,
        slug: brandSlug(vendor),
        productCount: 1,
        image: product.featuredImage,
      });
    }
  }

  return Array.from(brandsByName.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getShopBrandBySlug(slug: string): Promise<ShopBrand | null> {
  const brands = await getShopBrands();

  return brands.find((brand) => brand.slug === slug) ?? null;
}
