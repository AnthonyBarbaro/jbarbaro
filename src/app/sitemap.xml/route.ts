import { SITE_URL } from "@/lib/constants";
import { getSitemapRoutes } from "@/lib/sitemap-routes";

export async function GET() {
  const routes = getSitemapRoutes();

  const entries = routes
    .map((path) => {
      const loc = `${SITE_URL}${path}`;
      const changefreq = path.startsWith("/blog") || path.startsWith("/style-guide") ? "monthly" : "weekly";
      const priority = path === "" ? "1.0" : "0.7";

      return `
  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
