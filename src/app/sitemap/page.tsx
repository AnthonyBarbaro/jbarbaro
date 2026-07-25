import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { WaveSection } from "@/components/ui/WaveSection";
import { brands } from "@/data/brands";
import { locations } from "@/data/locations";
import { getCollection } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { resolveMenCategories } from "@/lib/shopify/men-categories";
import { getShopProductPreviews } from "@/lib/shopify/products";
import type { ShopifyProductPreview } from "@/lib/shopify/types";

export const metadata = buildMetadata({
  title: "HTML Sitemap",
  description: "Browse all key pages across the J. Barbaro Clothiers website.",
  path: "/sitemap",
});
export const revalidate = 300;

export default async function HtmlSitemapPage() {
  const blogPosts = getCollection("blog");
  const stylePosts = getCollection("style-guide");
  const menCategories = await resolveMenCategories(40, 1);
  let shopProducts: ShopifyProductPreview[] = [];

  try {
    shopProducts = await getShopProductPreviews(250);
  } catch (error) {
    console.error("Unable to load Shopify product previews for the HTML sitemap.", error);
  }

  const sections: Array<{ title: string; links: Array<{ label: string; href: string }> }> = [
    {
      title: "Main",
      links: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Reviews", href: "/reviews" },
        { label: "Tailored Clothing", href: "/tailored-clothing" },
        { label: "Suit & Tuxedo Rentals", href: "/suit-tuxedo-rentals" },
        { label: "Register Your Wedding", href: "/register-your-wedding" },
        { label: "Locations", href: "/locations" },
        { label: "Schedule Appointment", href: "/schedule-appointment" },
        { label: "Contact Us", href: "/contact-us" },
        { label: "Blog", href: "/blog" },
        { label: "Style Guide", href: "/style-guide" },
      ],
    },
    {
      title: "Collections",
      links: menCategories.map((category) => ({ label: category.name, href: category.href })),
    },
    {
      title: "Shop Products",
      links: shopProducts.map((product) => ({ label: product.title, href: `/shop/${product.handle}` })),
    },
    {
      title: "Locations",
      links: locations.map((location) => ({ label: location.name, href: `/location/${location.slug}` })),
    },
    {
      title: "Brands",
      links: brands.map((brand) => ({ label: brand.name, href: `/collection-brand/${brand.slug}` })),
    },
    {
      title: "Blog Posts",
      links: blogPosts.map((post) => ({ label: post.title, href: `/blog/${post.slug}` })),
    },
    {
      title: "Style Guide Posts",
      links: stylePosts.map((post) => ({ label: post.title, href: `/style-guide/${post.slug}` })),
    },
  ];

  return (
    <>
      <PageHero title="HTML Sitemap" description="A complete index of routes and resources available on jasonbarbaro.com." />
      <WaveSection topWave="C" background="stone">
        <Container>
          <div className="grid gap-5 md:grid-cols-2">
            {sections.map((section) => (
              <Card key={section.title} className="h-full">
                <CardContent>
                  <Badge variant="teal">{section.title}</Badge>
                  <ul className="mt-4 space-y-2 text-sm text-smoke">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="hover:text-deep-teal hover:underline">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </WaveSection>
    </>
  );
}
