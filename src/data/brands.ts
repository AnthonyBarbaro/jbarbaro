import brandsJson from "@content/site/brands.json";

import type { Brand } from "@/types/site";

type BrandsData = {
  items: Brand[];
};

const brandData = brandsJson as BrandsData;

export const brands = brandData.items;
export const featuredBrands = brands.filter((brand) => brand.featured).slice(0, 24);
export const brandMap = Object.fromEntries(brands.map((brand) => [brand.slug, brand]));
