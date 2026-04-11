import categoriesJson from "@content/site/categories.json";

import type { MenCategory } from "@/types/site";

type CategoriesData = {
  items: MenCategory[];
};

const categoryData = categoriesJson as CategoriesData;

export const menCategories = categoryData.items;
export const menCategoryMap = Object.fromEntries(menCategories.map((category) => [category.slug, category]));
export const menCategoryByCollectionHandleMap = Object.fromEntries(
  menCategories
    .filter((category) => category.shopifyCollectionHandle?.trim())
    .map((category) => [category.shopifyCollectionHandle!.trim(), category]),
);

export function getMenCategoryHref(category: MenCategory) {
  return `/for-men/${category.slug}`;
}

export function getMenCategoryByHandle(handle: string) {
  return menCategoryByCollectionHandleMap[handle] ?? null;
}
