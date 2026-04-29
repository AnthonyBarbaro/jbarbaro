import { brands } from "@/data/brands";
import { locations } from "@/data/locations";
import { getCollection } from "@/lib/content";
import { getMenCategoryRoutes } from "@/lib/shopify/men-categories";
import { getShopProductPreviews } from "@/lib/shopify/products";

export async function getSitemapRoutes() {
  const staticRoutes = [
    "",
    "/about",
    "/about/our-history",
    "/services",
    "/reviews",
    "/categories",
    "/shop",
    "/designers",
    "/designers/featured-designers",
    "/designers/all-designer-brands",
    "/tailored-clothing",
    "/suit-tuxedo-rentals",
    "/register-your-wedding",
    "/locations",
    "/schedule-appointment",
    "/contact-us",
    "/blog",
    "/style-guide",
    "/privacy-policy",
    "/terms-of-use",
    "/sitemap",
  ];

  let menCategoryRoutes = ["/categories"];

  try {
    menCategoryRoutes = Array.from(new Set(["/categories", ...(await getMenCategoryRoutes(40))]));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown men category sitemap error.";
    console.error(`Unable to build dynamic /categories sitemap routes: ${message}`);
  }

  let shopProductRoutes: string[] = [];

  try {
    shopProductRoutes = (await getShopProductPreviews(100)).map((product) => `/shop/${product.handle}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Shopify product sitemap error.";
    console.error(`Unable to build dynamic /shop sitemap routes: ${message}`);
  }

  const dynamicRoutes = [
    ...menCategoryRoutes.filter((route) => route !== "/categories"),
    ...shopProductRoutes,
    ...locations.map((location) => `/location/${location.slug}`),
    ...brands.map((brand) => `/collection-brand/${brand.slug}`),
    ...getCollection("blog").map((post) => `/blog/${post.slug}`),
    ...getCollection("style-guide").map((post) => `/style-guide/${post.slug}`),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
