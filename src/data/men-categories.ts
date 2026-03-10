import categoriesJson from "@content/site/categories.json";

import type { MenCategory } from "@/types/site";

type CategoriesData = {
  items: MenCategory[];
};

const categoryData = categoriesJson as CategoriesData;

export const menCategories = categoryData.items;
export const menCategoryMap = Object.fromEntries(menCategories.map((category) => [category.slug, category]));
