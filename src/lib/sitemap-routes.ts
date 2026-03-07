import { getBrands, getCategories, getLocations } from "@/lib/cms";
import { getCollection } from "@/lib/content";

export async function getSitemapRoutes() {
  const staticRoutes = [
    "",
    "/about",
    "/about/our-history",
    "/services",
    "/reviews",
    "/for-men",
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
    "/shop-coming-soon",
    "/sale-coming-soon",
  ];

  const [brands, locations, categories, blogPosts, styleGuidePosts] = await Promise.all([
    getBrands(),
    getLocations(),
    getCategories(),
    getCollection("blog"),
    getCollection("style-guide"),
  ]);

  const dynamicRoutes = [
    ...categories.map((category) => `/for-men/${category.slug}`),
    ...locations.map((location) => `/location/${location.slug}`),
    ...brands.map((brand) => `/collection-brand/${brand.slug}`),
    ...blogPosts.map((post) => `/blog/${post.slug}`),
    ...styleGuidePosts.map((post) => `/style-guide/${post.slug}`),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
