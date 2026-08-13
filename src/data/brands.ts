import brandsJson from "@content/site/brands.json";

import { brandSlug } from "@/lib/shopify/brand-slug";
import type { Brand } from "@/types/site";

type BrandsData = {
  items: Brand[];
};

const brandData = brandsJson as BrandsData;

export const brands = brandData.items;
export const featuredBrands = brands.filter((brand) => brand.featured).slice(0, 24);
export const brandMap = Object.fromEntries(brands.map((brand) => [brand.slug, brand]));

const normalizeShopifyVendor = (vendor: string) => vendor.trim().toLocaleLowerCase();

export const brandByShopifyVendor = new Map(
  brands
    .filter((brand) => brand.shopifyVendor?.trim())
    .map((brand) => [normalizeShopifyVendor(brand.shopifyVendor ?? ""), brand]),
);

export function getBrandPresentation(vendor: string) {
  return (
    brandByShopifyVendor.get(normalizeShopifyVendor(vendor)) ?? brandMap[brandSlug(vendor)] ?? null
  );
}
