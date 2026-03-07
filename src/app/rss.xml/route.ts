import { getCollection } from "@/lib/content";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const posts = await getCollection("blog");

  const items = posts
    .map(
      (post) => `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>${SITE_URL}/blog/${post.slug}</link>
        <description>${escapeXml(post.description)}</description>
        <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        <guid>${SITE_URL}/blog/${post.slug}</guid>
      </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)} Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Menswear insights and updates from ${escapeXml(SITE_NAME)}.</description>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
