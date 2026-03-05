import { brands } from "@/data/brands";
import { locations } from "@/data/locations";
import { menCategories } from "@/data/men-categories";
import { getCollection } from "@/lib/content";

export function getSitemapRoutes() {
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

  const dynamicRoutes = [
    ...menCategories.map((category) => `/for-men/${category.slug}`),
    ...locations.map((location) => `/location/${location.slug}`),
    ...brands.map((brand) => `/collection-brand/${brand.slug}`),
    ...getCollection("blog").map((post) => `/blog/${post.slug}`),
    ...getCollection("style-guide").map((post) => `/style-guide/${post.slug}`),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
